'use strict';

// ─── Companion Panel ─────────────────────────────────────────────────────────
const companionPanel = document.getElementById('companion-panel');
bindTap(document.getElementById('companion-close'), () => closeCompanionPanel());

function openCompanionPanel() {
  companionPanelOpen = true;
  showPanel(companionPanel);
  renderCompanionPanel();
}
function closeCompanionPanel() {
  companionPanelOpen = false;
  hidePanel(companionPanel);
}

function buildCompRow(cId) {
  const characterId = getCompanionCharacterId(cId);
  const profile = getCompanionProfile(cId);
  const info = getCompanionRoster(cId);
  if (!info || !profile) return '';
  const isActive = activeCompanions.includes(cId);
  const isDead = deadCompanions.includes(cId);
  const isCommander = currentCommanderId === characterId;
  const partyLocked = !canEditPartySetup();
  const maxHp = getCompanionMaxHp(cId);
  const currentHp = companionStates[cId] ? companionStates[cId].hp : maxHp;
  const hpPct = Math.max(0, Math.min(100, currentHp / maxHp * 100));
  const aiMode = getCompanionAIMode(cId, companionStates[cId]);
  const aiMeta = COMPANION_AI_MODES[aiMode] || COMPANION_AI_MODES.aggressive;

  const statusText = isDead ? '\uC0AC\uB9DD' : isCommander ? '\uC9C0\uD718\uAD00' : isActive ? '\uCD9C\uC804' : '\uB300\uAE30';
  const statusClass = isDead ? 'dead' : isCommander || isActive ? 'active' : '';
  const rowClass = isCommander ? ' active' : isActive ? ' active' : isDead ? ' dead' : '';
  const hpFillClass = hpPct < 30 ? ' low' : '';

  let aiHtml = '<button class="comp-act-btn ai-btn" data-ai-cid="' + cId + '" style="color:' + aiMeta.color + ';">' + aiMeta.label + '</button>';
  if (isCommander) {
    aiHtml = '<button class="comp-act-btn disabled" disabled>\uC9C0\uD718\uAD00</button>';
  }

  let commanderHtml = '';
  if (isCommander) {
    commanderHtml = '<button class="comp-act-btn disabled" disabled>\uD604\uC7AC \uC9C0\uD718\uAD00</button>';
  } else if (isDead || partyLocked) {
    commanderHtml = '<button class="comp-act-btn disabled" disabled>\uC9C0\uD718\uAD00 \uC9C0\uC815</button>';
  } else {
    commanderHtml = '<button class="comp-act-btn activate" data-commander-id="' + characterId + '">\uC9C0\uD718\uAD00 \uC9C0\uC815</button>';
  }

  let actionHtml = '';
  if (isCommander) {
    actionHtml = '<button class="comp-act-btn disabled" disabled>\uACE0\uC815</button>';
  } else if (isDead) {
    actionHtml = '<button class="comp-act-btn disabled" disabled>\uC0AC\uB9DD</button>';
  } else if (partyLocked) {
    actionHtml = '<button class="comp-act-btn disabled" disabled>\uD3B8\uC131 \uACE0\uC815</button>';
  } else if (isActive) {
    actionHtml = '<button class="comp-act-btn deactivate" data-cid="' + cId + '" data-action="deactivate">\uD574\uC81C</button>';
  } else if (activeCompanions.length >= MAX_ACTIVE_COMPANIONS) {
    actionHtml = '<button class="comp-act-btn disabled" disabled>\uB9CC\uC11D</button>';
  } else {
    actionHtml = '<button class="comp-act-btn activate" data-cid="' + cId + '" data-action="activate">\uC120\uD0DD</button>';
  }

  return '<div class="comp-row' + rowClass + '">' +
    '<div class="comp-icon" style="background:' + info.color + ';">' + (info.portraitIcon || '\u2605') + '</div>' +
    '<div class="comp-name">' + info.name + '</div>' +
    '<div class="comp-role">' + profile.className + '</div>' +
    '<div class="comp-status ' + statusClass + '">' + statusText + '</div>' +
    '<div class="comp-stats"><span class="stat-atk">ATK ' + getCompanionAtk(cId) + '</span></div>' +
    '<div class="comp-hp-mini"><div class="comp-hp-mini-fill' + hpFillClass + '" style="width:' + hpPct + '%;"></div></div>' +
    '<div class="comp-stats"><span class="stat-hp">' + Math.floor(currentHp) + '/' + maxHp + '</span></div>' +
    '<div class="comp-actions">' +
      aiHtml +
      commanderHtml +
      actionHtml +
    '</div>' +
  '</div>';
}

function buildCommanderSummary() {
  const commanderName = getCharacterDisplayName(currentCommanderId || getHeroCharacterId());
  const activeParty = getActivePartyCharacters();
  const partyNames = activeParty.map(entry => entry.name).join(' · ') || commanderName;
  const partyCount = activeParty.length;
  const partyLimit = MAX_ACTIVE_COMPANIONS + 1;
  const lockText = canEditPartySetup()
    ? '\uB9C8\uC744/\uD544\uB4DC\uC5D0\uC11C \uC9C0\uD718\uAD00 \uC804\uD658\uACFC \uB3D9\uB8CC \uD3B8\uC131\uC744 \uBC14\uAFC0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
    : '\uB358\uC804 \uC548\uC5D0\uC11C\uB294 \uC9C0\uD718\uAD00 \uC804\uD658 / \uB3D9\uB8CC \uAD50\uCCB4\uAC00 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4.';
  const heroButtonHtml = currentCommanderId === getHeroCharacterId()
    ? '<button class="comp-act-btn disabled" disabled>\uC8FC\uC778\uACF5 \uC9C0\uD718 \uC911</button>'
    : canEditPartySetup()
      ? '<button class="comp-act-btn activate" data-commander-id="' + getHeroCharacterId() + '">\uC8FC\uC778\uACF5 \uC9C0\uD718\uAD00 \uC9C0\uC815</button>'
      : '<button class="comp-act-btn disabled" disabled>\uC8FC\uC778\uACF5 \uC9C0\uD718\uAD00 \uC9C0\uC815</button>';

  return '<div class="comp-synergy-bar">' +
    '<span class="comp-synergy-label">\uD604\uC7AC \uC9C0\uD718\uAD00: ' + commanderName + '</span>' +
    '<div class="comp-synergy-chips"><span class="comp-synergy-chip active">\uCD9C\uC804 ' + partyCount + '/' + partyLimit + '</span><span class="comp-synergy-chip active">\uD30C\uD2F0 ' + partyNames + '</span></div>' +
  '</div>' +
  '<div class="comp-synergy-bar">' +
    '<span class="comp-synergy-label">' + lockText + '</span>' +
    '<div class="comp-synergy-chips">' + heroButtonHtml + '</div>' +
  '</div>';
}

function buildSynergyChips() {
  const entries = Object.entries(COMPANION_CLASS_SYNERGIES);
  if (!entries.length) return '';

  const ownedClassIds = new Set(companions.map(cId => {
    const roster = getCompanionRoster(cId);
    return roster ? roster.classId : null;
  }).filter(Boolean));
  const activeClassIds = new Set((typeof getActiveCompanionPartyProfiles === 'function'
    ? getActiveCompanionPartyProfiles()
    : activeCompanions.map(cId => getCompanionProfile(cId)).filter(Boolean))
    .map(profile => profile.classId)
    .filter(Boolean));

  const chips = entries.map(([key, def]) => {
    const classIds = key.split('-').map(id => parseInt(id, 10));
    const activeCount = classIds.filter(id => activeClassIds.has(id)).length;
    const ownedCount = classIds.filter(id => ownedClassIds.has(id)).length;
    let cls = '';
    if (activeCount === MAX_ACTIVE_COMPANIONS) cls = 'active';
    else if (ownedCount === MAX_ACTIVE_COMPANIONS) cls = 'ready';
    else if (ownedCount > 0) cls = 'partial';
    return '<span class="comp-synergy-chip ' + cls + '" title="' + def.desc + '">' + def.name + ' ' + ownedCount + '/' + MAX_ACTIVE_COMPANIONS + '</span>';
  }).join('');

  return chips;
}

function handleCompanionAiTap(cId) {
  const info = getCompanionRoster(cId);
  const prevMode = getCompanionAIMode(cId, companionStates[cId]);
  const prevMeta = COMPANION_AI_MODES[prevMode];
  const nextMode = cycleCompanionAIMode(cId);
  const nextMeta = COMPANION_AI_MODES[nextMode] || COMPANION_AI_MODES.aggressive;
  syncCharacterAIModesFromLegacy();
  const transition = (prevMeta && prevMeta.label !== nextMeta.label) ? prevMeta.label + ' → ' + nextMeta.label : nextMeta.label;
  showToast((info ? info.name : '\uB3D9\uB8CC') + ' AI: ' + transition);
  renderCompanionPanel();
  autoSave();
}

function handleCommanderAssign(characterId) {
  if (!canEditPartySetup()) {
    showToast('\uB358\uC804 \uC548\uC5D0\uC11C\uB294 \uC9C0\uD718\uAD00 \uC804\uD658\uC774 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4');
    return;
  }
  if (isCurrentCommanderGhost()) {
    showToast('유령 상태의 지휘관은 신전에서 먼저 부활해야 합니다');
    return;
  }
  if (!assignCommanderCharacter(characterId)) return;
  showToast(getCharacterDisplayName(characterId) + ' \uC9C0\uD718\uAD00 \uC804\uD658');
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof renderSkillSlots === 'function') renderSkillSlots();
  if (typeof renderSkillPanel === 'function' && skillPanelOpen) renderSkillPanel();
  if (typeof renderProfile === 'function' && profileOpen) renderProfile();
  if (typeof renderInventory === 'function' && invOpen) renderInventory();
  if (typeof renderTrainingPanel === 'function' && trainingPanelOpen) renderTrainingPanel();
  if (typeof renderEmblemRoomPanel === 'function' && emblemRoomPanelOpen) renderEmblemRoomPanel();
  renderCompanionPanel();
  autoSave();
}

function handleCompanionAction(cId, action) {
  if (!canEditPartySetup()) {
    showToast('\uB358\uC804 \uC548\uC5D0\uC11C\uB294 \uD30C\uD2F0 \uD3B8\uC131\uC744 \uBC14\uAFC0 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4');
    return;
  }
  if (action === 'activate') {
    activateCompanion(cId);
  } else if (action === 'deactivate') {
    deactivateCompanion(cId);
  } else {
    return;
  }
  renderCompanionPanel();
  autoSave();
}

function bindCompanionPanelActions(content) {
  content.querySelectorAll('.comp-act-btn[data-ai-cid]').forEach(btn => {
    bindTap(btn, () => {
      handleCompanionAiTap(parseInt(btn.getAttribute('data-ai-cid'), 10));
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.comp-act-btn[data-commander-id]').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      handleCommanderAssign(btn.getAttribute('data-commander-id'));
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.comp-act-btn[data-action]').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      handleCompanionAction(
        parseInt(btn.getAttribute('data-cid'), 10),
        btn.getAttribute('data-action')
      );
    }, { stopPropagation: true });
  });
}

function renderCompanionPanel() {
  const content = document.getElementById('companion-content');
  const summaryEl = document.getElementById('comp-summary');
  const activeParty = getActivePartyCharacters();

  // Header summary
  if (summaryEl) {
    summaryEl.textContent = '\uC9C0\uD718 ' + getCharacterDisplayName(currentCommanderId || getHeroCharacterId()) +
      ' \u00B7 \uCD9C\uC804 ' + activeParty.length + '/' + (MAX_ACTIVE_COMPANIONS + 1) +
      ' \u00B7 \uC218\uC9D1 ' + companions.length + '/' + getTotalCompanionCount() +
      (deadCompanions.length > 0 ? ' \u00B7 \uC0AC\uB9DD ' + deadCompanions.length : '');
  }

  const commanderSummaryHtml = buildCommanderSummary();

  if (companions.length === 0) {
    content.innerHTML = commanderSummaryHtml +
      '<div class="companion-empty-state">\uC544\uC9C1 \uB3D9\uB8CC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB358\uC804\uC744 \uD074\uB9AC\uC5B4\uD558\uC5EC \uB3D9\uB8CC\uB97C \uC5BB\uC73C\uC138\uC694!</div>';
    bindCompanionPanelActions(content);
    return;
  }

  const synergy = getActiveCompanionSynergy();
  const synergyChips = buildSynergyChips();

  content.innerHTML =
    commanderSummaryHtml +
    // Synergy bar
    '<div class="comp-synergy-bar">' +
      '<span class="comp-synergy-label">' + (synergy ? '\uC2DC\uB108\uC9C0: ' + synergy.name : '\uC2DC\uB108\uC9C0') + '</span>' +
      '<div class="comp-synergy-chips">' + synergyChips + '</div>' +
    '</div>' +
    // Companion rows
    '<div class="comp-table">' +
      companions.map(buildCompRow).join('') +
    '</div>';

  bindCompanionPanelActions(content);
}
