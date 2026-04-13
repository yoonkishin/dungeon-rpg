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

function ensurePlayerEmblemBonusesApplied() {
  if (!Array.isArray(player.appliedEmblemBonusIds)) player.appliedEmblemBonusIds = [];
  (player.emblemIds || []).forEach(id => {
    if (player.appliedEmblemBonusIds.includes(id)) return;
    const emblem = getEmblemDef(id);
    if (!emblem) return;
    applyEmblemBonus(emblem);
    player.appliedEmblemBonusIds.push(id);
  });
}

function grantPlayerEmblem(id) {
  const emblem = getEmblemDef(id);
  if (!emblem || emblem.type !== EMBLEM_TYPES.unit || playerHasEmblem(id) || !canPlayerEnterEmblemTrial(id)) return false;
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  player.emblemIds.push(id);
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
    const material = getEmblemDef(materialId);
    if (player.appliedEmblemBonusIds && player.appliedEmblemBonusIds.includes(materialId)) {
      removeEmblemBonus(material);
      player.appliedEmblemBonusIds = player.appliedEmblemBonusIds.filter(entry => entry !== materialId);
    }
    player.emblemIds = (player.emblemIds || []).filter(entry => entry !== materialId);
  });
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  player.emblemIds.push(id);
  player.masterEmblemId = id;
  if (!Array.isArray(player.emblemFusionHistory)) player.emblemFusionHistory = [];
  player.emblemFusionHistory.push(id);
  ensurePlayerEmblemBonusesApplied();
  autoSave();
  return true;
}
