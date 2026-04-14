'use strict';

function applyEmblemBonus(emblem) {
  if (!emblem || !emblem.bonus) return;
  player.maxHp += emblem.bonus.maxHp || 0;
  player.hp = Math.min(player.maxHp, player.hp + (emblem.bonus.maxHp || 0));
  player.maxMp += emblem.bonus.maxMp || 0;
  player.mp = Math.min(player.maxMp, player.mp + (emblem.bonus.maxMp || 0));
  player.atk += emblem.bonus.atk || 0;
  player.def += emblem.bonus.def || 0;
  player.speed += emblem.bonus.speed || 0;
  player.critChance = Math.min(30, player.critChance + (emblem.bonus.critChance || 0));
}

function removeEmblemBonus(emblem) {
  if (!emblem || !emblem.bonus) return;
  player.maxHp = Math.max(1, player.maxHp - (emblem.bonus.maxHp || 0));
  player.hp = Math.min(player.hp, player.maxHp);
  player.maxMp = Math.max(0, player.maxMp - (emblem.bonus.maxMp || 0));
  player.mp = Math.min(player.mp, player.maxMp);
  player.atk -= emblem.bonus.atk || 0;
  player.def -= emblem.bonus.def || 0;
  player.speed -= emblem.bonus.speed || 0;
  player.critChance = Math.max(0, player.critChance - (emblem.bonus.critChance || 0));
}

function removeLegacyAppliedEmblemBonuses(appliedIds) {
  (appliedIds || []).forEach(id => {
    const emblem = getEmblemDef(id);
    if (!emblem) return;
    removeEmblemBonus(emblem);
  });
}

function getActivePlayerEmblem() {
  if (!player.activeEmblemId) return null;
  const emblem = getEmblemDef(player.activeEmblemId);
  if (!emblem || !playerHasEmblem(player.activeEmblemId)) return null;
  return emblem;
}

function ensurePlayerEmblemBonusesApplied() {
  if (!Array.isArray(player.appliedEmblemBonusIds)) player.appliedEmblemBonusIds = [];
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  if (player.activeEmblemId && !playerHasEmblem(player.activeEmblemId)) {
    player.activeEmblemId = null;
  }
  if (!player.activeEmblemId && player.masterEmblemId && playerHasEmblem(player.masterEmblemId)) {
    player.activeEmblemId = player.masterEmblemId;
  } else if (!player.activeEmblemId && player.emblemIds.length > 0) {
    player.activeEmblemId = player.emblemIds[0];
  }
  const desiredIds = player.activeEmblemId ? [player.activeEmblemId] : [];
  player.appliedEmblemBonusIds
    .filter(id => !desiredIds.includes(id))
    .forEach(id => removeEmblemBonus(getEmblemDef(id)));
  desiredIds
    .filter(id => !player.appliedEmblemBonusIds.includes(id))
    .forEach(id => applyEmblemBonus(getEmblemDef(id)));
  player.appliedEmblemBonusIds = desiredIds.slice();
}

function equipPlayerEmblem(id, options = {}) {
  if (!playerHasEmblem(id)) return false;
  if (player.activeEmblemId && player.activeEmblemId !== id) {
    const current = getEmblemDef(player.activeEmblemId);
    if (current) removeEmblemBonus(current);
  }
  if (equipped.helmet) {
    inventory.push(equipped.helmet);
    equipped.helmet = null;
  }
  player.activeEmblemId = id;
  const emblem = getEmblemDef(id);
  if (!player.appliedEmblemBonusIds.includes(id) && emblem) {
    applyEmblemBonus(emblem);
  }
  player.appliedEmblemBonusIds = [id];
  if (!options.silent && typeof showToast === 'function') {
    showToast((emblem ? emblem.name : '문장') + ' 장착');
  }
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof renderInventory === 'function' && invOpen) renderInventory();
  if (typeof renderProfile === 'function' && profileOpen) renderProfile();
  autoSave();
  return true;
}

function unequipPlayerEmblem(options = {}) {
  if (!player.activeEmblemId) return false;
  const emblem = getEmblemDef(player.activeEmblemId);
  if (emblem) removeEmblemBonus(emblem);
  player.activeEmblemId = null;
  player.appliedEmblemBonusIds = [];
  if (!options.silent && typeof showToast === 'function') {
    showToast((emblem ? emblem.name : '문장') + ' 해제');
  }
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof renderInventory === 'function' && invOpen) renderInventory();
  if (typeof renderProfile === 'function' && profileOpen) renderProfile();
  autoSave();
  return true;
}

function grantPlayerEmblem(id) {
  const emblem = getEmblemDef(id);
  if (!emblem || emblem.type !== EMBLEM_TYPES.unit || playerHasEmblem(id) || !canPlayerEnterEmblemTrial(id)) return false;
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  player.emblemIds.push(id);
  if (!player.activeEmblemId) equipPlayerEmblem(id, { silent: true });
  ensurePlayerEmblemBonusesApplied();
  autoSave();
  return true;
}

function getEmblemTrialEnemyProfile(id) {
  const emblem = getEmblemDef(id);
  if (!emblem) return null;
  return {
    name: emblem.name.replace(' 문장', '') + ' 수호자',
    color: emblem.type === EMBLEM_TYPES.master ? '#f1c40f' : '#a29bfe',
    hp: Math.max(220, emblem.requiredAttack + emblem.requiredDefense - 180),
    atk: Math.max(18, Math.floor((emblem.requiredAttack + emblem.requiredDefense) / 28)),
    speed: 0.72,
    xp: 90,
    gold: 40,
    bossSkillType: emblem.targetLine === 'infantry' || emblem.targetLine === 'lancer' ? 'slam' : (emblem.targetLine === 'mage' || emblem.targetLine === 'darkPriest' || emblem.targetLine === 'priest' || emblem.targetLine === 'monk' ? 'nova' : 'bolt'),
    bossSkillName: emblem.name + ' 시험',
    bossSkillColor: emblem.type === EMBLEM_TYPES.master ? '#f1c40f' : '#c56cf0',
  };
}

function fusePlayerMasterEmblem(id) {
  const emblem = getEmblemDef(id);
  if (!emblem || emblem.type !== EMBLEM_TYPES.master || !canPlayerFuseMasterEmblem(id)) return false;
  emblem.fusionMaterials.forEach(materialId => {
    if (player.activeEmblemId === materialId) {
      const current = getEmblemDef(materialId);
      if (current) removeEmblemBonus(current);
      player.activeEmblemId = null;
      player.appliedEmblemBonusIds = [];
    }
    player.emblemIds = (player.emblemIds || []).filter(entry => entry !== materialId);
  });
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  player.emblemIds.push(id);
  player.masterEmblemId = id;
  if (!Array.isArray(player.emblemFusionHistory)) player.emblemFusionHistory = [];
  player.emblemFusionHistory.push(id);
  const promotedTier = typeof promotePlayerToMasterLine === 'function' ? promotePlayerToMasterLine(emblem.targetLine) : null;
  equipPlayerEmblem(id, { silent: true });
  ensurePlayerEmblemBonusesApplied();
  if (promotedTier && typeof showTierBanner === 'function') {
    showTierBanner(promotedTier);
  }
  autoSave();
  return true;
}
