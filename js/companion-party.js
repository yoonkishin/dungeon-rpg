'use strict';

function activateCompanion(cId) {
  if (!isValidCompanionId(cId)) return false;
  if (!companions.includes(cId)) return false;
  if (!canEditPartySetup()) return false;
  if (deadCompanions.includes(cId)) return false;
  if (activeCompanions.includes(cId)) return true;
  if (activeCompanions.length >= MAX_ACTIVE_COMPANIONS) return false;

  activeCompanions.push(cId);
  initCompanionState(cId);
  syncCommanderModelFromLegacyPartyState();
  return true;
}

function deactivateCompanion(cId, options = {}) {
  const { force = false } = options;
  if (!force && currentCommanderId === getCompanionCharacterId(cId)) {
    if (typeof showToast === 'function') showToast('지휘 중인 동료는 비활성화할 수 없습니다');
    return false;
  }
  if (!activeCompanions.includes(cId)) return false;
  activeCompanions = activeCompanions.filter(id => id !== cId);
  delete companionStates[cId];
  syncCommanderModelFromLegacyPartyState();
  return true;
}

function markCompanionDead(cId, options = {}) {
  if (!isValidCompanionId(cId)) return false;
  const {
    hitX = null,
    hitY = null,
    showToastMessage = true,
    addDeathParticles = true,
  } = options;

  const cs = companionStates[cId] || null;
  if (cs) {
    cs.hp = 0;
    cs.flashTimer = 12;
  }
  if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
  deactivateCompanion(cId, { force: true });
  normalizeCommanderState();

  if (addDeathParticles) {
    const px = hitX ?? (cs ? cs.x : player.x);
    const py = hitY ?? (cs ? cs.y : player.y);
    addParticles(px, py, '#e74c3c', 15);
  }

  if (showToastMessage) {
    const cInfo = getCompanionRoster(cId);
    showToast((cInfo ? cInfo.name : '동료') + ' 쓰러짐! · 마을 신전에서 부활 가능');
  }

  return true;
}

function clearActiveCompanions(options = {}) {
  const {
    markDead = false,
    preserveDeadList = true,
  } = options;

  if (markDead) {
    activeCompanions.forEach(cId => {
      if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
    });
  } else if (!preserveDeadList) {
    deadCompanions = deadCompanions.filter(cId => !activeCompanions.includes(cId));
  }

  activeCompanions = [];
  companionStates = {};
  syncCommanderModelFromLegacyPartyState();
}

function initActiveCompanionsForDungeon() {
  companionStates = {};
  activeCompanions = activeCompanions.filter(cId => !deadCompanions.includes(cId));
  activeCompanions.forEach(cId => initCompanionState(cId));
  syncCommanderModelFromLegacyPartyState();
  return activeCompanions.length;
}

function restoreActiveCompanionStates() {
  companionStates = {};
  activeCompanions = activeCompanions.filter(cId => isValidCompanionId(cId) && !deadCompanions.includes(cId));
  activeCompanions.forEach(cId => initCompanionState(cId));
  syncCommanderModelFromLegacyPartyState();
  return activeCompanions.length;
}

function reviveCompanion(cId) {
  if (!deadCompanions.includes(cId)) return false;
  deadCompanions = deadCompanions.filter(id => id !== cId);
  delete companionStates[cId];
  normalizeCommanderState();
  return true;
}

function reviveAllCompanions() {
  if (deadCompanions.length === 0) return false;
  deadCompanions = [];
  normalizeCommanderState();
  return true;
}
