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
  let helmetName = '';
  if (equipped.helmet) {
    helmetName = ITEMS[equipped.helmet.itemId] ? ITEMS[equipped.helmet.itemId].name : '헬멧';
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
    showToast((emblem ? emblem.name : '문장') + ' 장착' + (helmetName ? ' · 헬멧 ' + helmetName + ' 해제' : ''));
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
  const trialByLine = {
    infantry: { hp: 500, atk: 24 },
    flyingKnight: { hp: 470, atk: 23 },
    cavalry: { hp: 530, atk: 25 },
    navalUnit: { hp: 520, atk: 22 },
    lancer: { hp: 560, atk: 26 },
    archer: { hp: 490, atk: 24 },
    monk: { hp: 540, atk: 25 },
    priest: { hp: 560, atk: 26 },
    mage: { hp: 620, atk: 29 },
    darkPriest: { hp: 650, atk: 30 },
  };
  const isHigher = emblem.type === EMBLEM_TYPES.tier8 || emblem.type === EMBLEM_TYPES.tier9 || emblem.type === EMBLEM_TYPES.master;
  const trial = trialByLine[emblem.targetLine] || { hp: 500, atk: 24 };
  return {
    name: emblem.name.replace(' 문장', '') + ' 수호자',
    color: isHigher ? '#f1c40f' : '#a29bfe',
    hp: trial.hp,
    atk: trial.atk,
    speed: 0.72,
    xp: 90,
    gold: 40,
    bossSkillType: emblem.targetLine === 'infantry' || emblem.targetLine === 'lancer' ? 'slam' : (emblem.targetLine === 'mage' || emblem.targetLine === 'darkPriest' || emblem.targetLine === 'priest' || emblem.targetLine === 'monk' ? 'nova' : 'bolt'),
    bossSkillName: emblem.name + ' 시험',
    bossSkillColor: isHigher ? '#f1c40f' : '#c56cf0',
  };
}

// lightsaber_test staged progression §4.1~§4.5:
//   7단 기본 문장 합체는 재료를 소멸시키고 tier8UnlockLineId만 부여한다.
//   tier8 문장(= 과거의 masterEmblem) 자체는 여기서 주지 않는다.
function fuseTier7ToUnlockTier8(masterLineId) {
  if (!canPlayerFuseTier7ForLine(masterLineId)) return false;
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return false;

  (recipe.materials || []).forEach(materialId => {
    if (player.activeEmblemId === materialId) {
      const current = getEmblemDef(materialId);
      if (current) removeEmblemBonus(current);
      player.activeEmblemId = null;
      player.appliedEmblemBonusIds = [];
    }
    player.emblemIds = (player.emblemIds || []).filter(entry => entry !== materialId);
  });
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  if (!Array.isArray(player.emblemFusionHistory)) player.emblemFusionHistory = [];
  player.emblemFusionHistory.push('fuse:' + masterLineId);
  player.tier8UnlockLineId = masterLineId;

  const promotedRank = typeof promotePlayerToMasterLine === 'function' ? promotePlayerToMasterLine(masterLineId) : null;
  ensurePlayerEmblemBonusesApplied();

  // 연출은 별도 큐에 의해 구동된다. Banner는 합체 프리젠터가 결과 정착 단계에서 띄운다.
  if (typeof queueFusionTransformation === 'function') {
    queueFusionTransformation(masterLineId, promotedRank);
  } else if (promotedRank && typeof showTierBanner === 'function') {
    // 프리젠터 누락 대비 fallback
    showTierBanner(promotedRank);
  }
  autoSave();
  return true;
}

// 8단 Lv100 도달 시 호출: tier8EmblemId 부여 + 인벤토리 추가.
// 플레이어가 활성 문장이 없으면 자동 장착한다.
function grantTier8Emblem(masterLineId) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return false;
  const emblemId = recipe.tier8EmblemId;
  if (!emblemId) return false;
  if (player.tier8EmblemId === emblemId && playerHasEmblem(emblemId)) return false;
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  if (!player.emblemIds.includes(emblemId)) player.emblemIds.push(emblemId);
  player.tier8EmblemId = emblemId;
  if (!player.activeEmblemId) {
    equipPlayerEmblem(emblemId, { silent: true });
  } else {
    ensurePlayerEmblemBonusesApplied();
  }
  if (typeof showToast === 'function') {
    showToast((getEmblemDef(emblemId)?.name || '8단 문장') + ' 획득!');
  }
  if (typeof addParticles === 'function') addParticles(player.x, player.y, recipe.colors.primary, 28);
  autoSave();
  return true;
}

// 9단 Lv200 도달 시 호출: tier9EmblemId 부여.
function grantTier9Emblem(masterLineId) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return false;
  const emblemId = recipe.tier9EmblemId;
  if (!emblemId) return false;
  if (player.tier9EmblemId === emblemId && playerHasEmblem(emblemId)) return false;
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  if (!player.emblemIds.includes(emblemId)) player.emblemIds.push(emblemId);
  player.tier9EmblemId = emblemId;
  ensurePlayerEmblemBonusesApplied();
  if (typeof showToast === 'function') {
    showToast((getEmblemDef(emblemId)?.name || '9단 문장') + ' 획득!');
  }
  if (typeof addParticles === 'function') addParticles(player.x, player.y, recipe.colors.primary, 36);
  autoSave();
  return true;
}

// Lv100/Lv200 도달 자동 검사. combat.js gainXP에서 호출.
function checkTierCapMilestoneRewards() {
  const line = player.classLine;
  if (!line || !EMBLEM_FUSION_RECIPES[line]) return;
  if (player.classRank === 8 && player.level >= 100 && !player.tier8EmblemId) {
    grantTier8Emblem(line);
  }
  if (player.classRank === 9 && player.level >= 200 && !player.tier9EmblemId) {
    grantTier9Emblem(line);
  }
}

function canPromoteToTier9() {
  return !!(player.tier8EmblemId && player.classRank === 8 && player.level >= 100 && EMBLEM_FUSION_RECIPES[player.classLine]);
}

function canPromoteToTier10() {
  return !!(player.tier9EmblemId && player.classRank === 9 && player.level >= 200 && EMBLEM_FUSION_RECIPES[player.classLine]);
}
