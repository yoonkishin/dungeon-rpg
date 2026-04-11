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
function buildCompanionSummaryCard(label, value, valueClass = '', extraClass = '') {
  return '<div class="companion-summary-card ' + extraClass + '">' +
    '<div class="summary-label">' + label + '</div>' +
    '<div class="summary-value ' + valueClass + '">' + value + '</div>' +
  '</div>';
}

function getCompanionActionState(cId, isActive, isDead) {
  if (isDead) {
    return { label: '사망', className: 'disabled', action: 'none', disabled: true };
  }
  if (isActive) {
    return { label: '해제', className: 'deactivate', action: 'deactivate', disabled: false };
  }
  if (activeCompanions.length >= MAX_ACTIVE_COMPANIONS) {
    return { label: '만석', className: 'disabled', action: 'none', disabled: true };
  }
  return { label: '선택', className: 'activate', action: 'activate', disabled: false };
}

function buildCompanionIdentityChips(profile, aiMeta, defaultAiMeta) {
  return '<div class="companion-chip-row">' +
    '<span class="companion-info-chip">병종 ' + profile.className + '</span>' +
    '<span class="companion-info-chip">타입 ' + getCompanionUnitTypeLabel(profile) + '</span>' +
    '<span class="companion-info-chip ai-default">기본 ' + defaultAiMeta.label + '</span>' +
    '<span class="companion-info-chip ai-current" style="border-color:' + aiMeta.color + '44;color:' + aiMeta.color + ';">운용 ' + aiMeta.label + '</span>' +
  '</div>';
}

function buildCompanionCard(cId) {
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
  const defaultAiMode = getDefaultCompanionAIMode(cId);
  const defaultAiMeta = COMPANION_AI_MODES[defaultAiMode] || COMPANION_AI_MODES.aggressive;
  const actionState = getCompanionActionState(cId, isActive, isDead);
  const statusText = isDead ? '사망' : isActive ? '출전 중' : '대기';
  const statusClass = isDead ? 'dead' : isActive ? 'active' : '';

  return '<div class="companion-card' + (isActive ? ' active' : '') + (isDead ? ' dead' : '') + '">' +
    '<div class="companion-card-top">' +
      '<div class="companion-card-icon" style="background:' + info.color + ';">' + (info.portraitIcon || '★') + '</div>' +
      '<div class="companion-card-main">' +
        '<div class="companion-card-name-row">' +
          '<div class="companion-card-name">' + info.name + '</div>' +
          '<div class="companion-status-badge ' + statusClass + '">' + statusText + '</div>' +
        '</div>' +
        '<div class="companion-card-role">' + profile.roleLabel + '</div>' +
        '<div class="companion-card-skill">대표 스킬 · ' + profile.skillName + '</div>' +
      '</div>' +
    '</div>' +
    buildCompanionIdentityChips(profile, aiMeta, defaultAiMeta) +
    '<div class="companion-card-desc">' + (info.desc || '') + '</div>' +
    '<div class="companion-card-stats">' +
      '<span>ATK ' + getCompanionAtk(cId) + '</span>' +
      '<span>HP ' + Math.floor(currentHp) + '/' + maxHp + '</span>' +
      '<span>사거리 ' + profile.attackRange + '</span>' +
    '</div>' +
    '<div class="companion-hp-bar"><div class="companion-hp-fill" style="width:' + hpPct + '%;"></div></div>' +
    '<div class="companion-card-actions">' +
      '<button class="comp-ai-btn companion-mini-btn" data-cid="' + cId + '" style="background:' + aiMeta.color + ';">AI 변경 · ' + aiMeta.label + '</button>' +
      '<button class="comp-btn companion-mini-btn ' + actionState.className + '" data-cid="' + cId + '" data-action="' + actionState.action + '"' + (actionState.disabled ? ' disabled' : '') + '>' + actionState.label + '</button>' +
    '</div>' +
    (isDead ? '<div class="companion-cost-note">신전에서 부활 가능</div>' : '') +
  '</div>';
}

function handleCompanionAiTap(cId) {
  const info = getCompanionRoster(cId);
  const nextMode = cycleCompanionAIMode(cId);
  const nextMeta = COMPANION_AI_MODES[nextMode] || COMPANION_AI_MODES.aggressive;
  showToast((info ? info.name : '동료') + ' AI: ' + nextMeta.label);
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

function buildCompanionSynergyCard(key, synergyDef) {
  const classIds = key.split('-').map(id => parseInt(id, 10));
  const classNames = classIds.map(getCompanionClassName);
  const ownedClassIds = new Set(companions.map(cId => {
    const roster = getCompanionRoster(cId);
    return roster ? roster.classId : null;
  }).filter(Boolean));
  const activeClassIds = new Set(activeCompanions.map(cId => {
    const roster = getCompanionRoster(cId);
    return roster ? roster.classId : null;
  }).filter(Boolean));
  const ownedCount = classIds.filter(classId => ownedClassIds.has(classId)).length;
  const activeCount = classIds.filter(classId => activeClassIds.has(classId)).length;

  let stateClass = 'locked';
  let stateLabel = ownedCount + '/' + MAX_ACTIVE_COMPANIONS + ' 확보';
  if (activeCount === MAX_ACTIVE_COMPANIONS) {
    stateClass = 'active';
    stateLabel = '활성';
  } else if (ownedCount === MAX_ACTIVE_COMPANIONS) {
    stateClass = 'ready';
    stateLabel = '보유 완료';
  } else if (ownedCount > 0) {
    stateClass = 'partial';
  }

  return '<div class="companion-synergy-card ' + stateClass + '">' +
    '<div class="companion-synergy-card-head">' +
      '<div class="companion-synergy-name">' + synergyDef.name + '</div>' +
      '<div class="companion-synergy-state ' + stateClass + '">' + stateLabel + '</div>' +
    '</div>' +
    '<div class="companion-synergy-pair">' + classNames.join(' × ') + '</div>' +
    '<div class="companion-synergy-desc">' + synergyDef.desc + '</div>' +
  '</div>';
}

function buildCompanionSynergySection() {
  const entries = Object.entries(COMPANION_CLASS_SYNERGIES);
  if (!entries.length) return '';
  return '<div class="companion-synergy-section">' +
    '<div class="companion-section-title">시너지 조합</div>' +
    '<div class="companion-synergy-list">' + entries.map(([key, def]) => buildCompanionSynergyCard(key, def)).join('') + '</div>' +
  '</div>';
}

function bindCompanionPanelActions(content) {
  content.querySelectorAll('.comp-ai-btn').forEach(btn => {
    bindTap(btn, () => {
      handleCompanionAiTap(parseInt(btn.getAttribute('data-cid'), 10));
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.comp-btn').forEach(btn => {
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
  if (companions.length === 0) {
    content.innerHTML = '<div class="companion-empty-state">아직 동료가 없습니다. 던전을 클리어하여 동료를 얻으세요!</div>';
    return;
  }

  const synergy = getActiveCompanionSynergy();
  content.innerHTML =
    '<div class="companion-summary-grid">' +
      buildCompanionSummaryCard('활성 동료', activeCompanions.length + '/' + MAX_ACTIVE_COMPANIONS) +
      buildCompanionSummaryCard('수집', companions.length + '/' + getTotalCompanionCount()) +
      buildCompanionSummaryCard('사망', deadCompanions.length + '명', deadCompanions.length > 0 ? 'warn' : '') +
      buildCompanionSummaryCard('용병 슬롯', '잠김', 'lock', 'mercenary') +
    '</div>' +
    '<div class="companion-synergy-banner">' + (synergy ? ('시너지 활성: ' + synergy.name + ' · ' + synergy.desc) : '시너지 없음 — 아래 조합 카드에서 다음 목표 조합을 바로 볼 수 있다') + '</div>' +
    buildCompanionSynergySection() +
    '<div class="companion-grid">' + companions.map(buildCompanionCard).join('') + '</div>';

  bindCompanionPanelActions(content);
}
