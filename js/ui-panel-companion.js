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
  const profile = getCompanionProfile(cId);
  const info = getCompanionRoster(cId);
  if (!info || !profile) return '';
  const isActive = activeCompanions.includes(cId);
  const isDead = deadCompanions.includes(cId);
  const maxHp = getCompanionMaxHp(cId);
  const currentHp = companionStates[cId] ? companionStates[cId].hp : maxHp;
  const hpPct = Math.max(0, Math.min(100, currentHp / maxHp * 100));
  const aiMode = getCompanionAIMode(cId, companionStates[cId]);
  const aiMeta = COMPANION_AI_MODES[aiMode] || COMPANION_AI_MODES.aggressive;

  const statusText = isDead ? '\uC0AC\uB9DD' : isActive ? '\uCD9C\uC804' : '\uB300\uAE30';
  const statusClass = isDead ? 'dead' : isActive ? 'active' : '';
  const rowClass = isActive ? ' active' : isDead ? ' dead' : '';
  const hpFillClass = hpPct < 30 ? ' low' : '';

  // Action button
  let actionHtml = '';
  if (isDead) {
    actionHtml = '<button class="comp-act-btn disabled" disabled>\uC0AC\uB9DD</button>';
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
      '<button class="comp-act-btn ai-btn" data-ai-cid="' + cId + '" style="color:' + aiMeta.color + ';">' + aiMeta.label + '</button>' +
      actionHtml +
    '</div>' +
  '</div>';
}

function buildSynergyChips() {
  const entries = Object.entries(COMPANION_CLASS_SYNERGIES);
  if (!entries.length) return '';

  const ownedClassIds = new Set(companions.map(cId => {
    const roster = getCompanionRoster(cId);
    return roster ? roster.classId : null;
  }).filter(Boolean));
  const activeClassIds = new Set(activeCompanions.map(cId => {
    const roster = getCompanionRoster(cId);
    return roster ? roster.classId : null;
  }).filter(Boolean));

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
  const nextMode = cycleCompanionAIMode(cId);
  const nextMeta = COMPANION_AI_MODES[nextMode] || COMPANION_AI_MODES.aggressive;
  showToast((info ? info.name : '\uB3D9\uB8CC') + ' AI: ' + nextMeta.label);
  renderCompanionPanel();
  autoSave();
}

function handleCompanionAction(cId, action) {
  if (action === 'activate') {
    if (activeCompanions.length < MAX_ACTIVE_COMPANIONS) {
      activeCompanions.push(cId);
      initCompanionState(cId);
    }
  } else if (action === 'deactivate') {
    activeCompanions = activeCompanions.filter(id => id !== cId);
    delete companionStates[cId];
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

  // Header summary
  if (summaryEl) {
    summaryEl.textContent = '\uD65C\uC131 ' + activeCompanions.length + '/' + MAX_ACTIVE_COMPANIONS +
      ' \u00B7 \uC218\uC9D1 ' + companions.length + '/' + getTotalCompanionCount() +
      (deadCompanions.length > 0 ? ' \u00B7 \uC0AC\uB9DD ' + deadCompanions.length : '');
  }

  if (companions.length === 0) {
    content.innerHTML = '<div class="companion-empty-state">\uC544\uC9C1 \uB3D9\uB8CC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uB358\uC804\uC744 \uD074\uB9AC\uC5B4\uD558\uC5EC \uB3D9\uB8CC\uB97C \uC5BB\uC73C\uC138\uC694!</div>';
    return;
  }

  const synergy = getActiveCompanionSynergy();
  const synergyChips = buildSynergyChips();

  content.innerHTML =
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
