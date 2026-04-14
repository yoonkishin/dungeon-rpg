'use strict';

const EMBLEM_TYPES = {
  unit: 'unit',
  master: 'master',
  legacy: 'legacy',
};

const ORIGINAL_LINE_LABELS = {
  infantry: '보병',
  flyingKnight: '비병',
  cavalry: '기병',
  navalUnit: '수병',
  lancer: '창병',
  archer: '궁병',
  monk: '승려',
  priest: '신관',
  mage: '법사',
  darkPriest: '사교',
  battleMaster: '배틀마스터',
  tacticsMaster: '택틱스마스터',
  magicMaster: '매직마스터',
};

const EMBLEM_DEFS = {
  infantry_emblem: { id: 'infantry_emblem', type: EMBLEM_TYPES.unit, name: '보병 문장', targetLine: 'infantry', requiredTier: 7, requiredLevel: 36, requiredAttack: 450, requiredDefense: 220, bonus: { atk: 30, def: 20, maxHp: 40 } },
  flying_knight_emblem: { id: 'flying_knight_emblem', type: EMBLEM_TYPES.unit, name: '비병 문장', targetLine: 'flyingKnight', requiredTier: 7, requiredLevel: 36, requiredAttack: 460, requiredDefense: 220, bonus: { atk: 20, speed: 0.35, critChance: 2 } },
  cavalry_emblem: { id: 'cavalry_emblem', type: EMBLEM_TYPES.unit, name: '기병 문장', targetLine: 'cavalry', requiredTier: 7, requiredLevel: 36, requiredAttack: 500, requiredDefense: 230, bonus: { atk: 32, def: 12, speed: 0.18 } },
  naval_unit_emblem: { id: 'naval_unit_emblem', type: EMBLEM_TYPES.unit, name: '수병 문장', targetLine: 'navalUnit', requiredTier: 7, requiredLevel: 36, requiredAttack: 470, requiredDefense: 240, bonus: { def: 24, maxHp: 60 } },
  lancer_emblem: { id: 'lancer_emblem', type: EMBLEM_TYPES.unit, name: '창병 문장', targetLine: 'lancer', requiredTier: 7, requiredLevel: 36, requiredAttack: 550, requiredDefense: 260, bonus: { atk: 34, critChance: 1 } },
  archer_emblem: { id: 'archer_emblem', type: EMBLEM_TYPES.unit, name: '궁병 문장', targetLine: 'archer', requiredTier: 7, requiredLevel: 36, requiredAttack: 520, requiredDefense: 230, bonus: { atk: 24, critChance: 2, speed: 0.12 } },
  monk_emblem: { id: 'monk_emblem', type: EMBLEM_TYPES.unit, name: '승려 문장', targetLine: 'monk', requiredTier: 7, requiredLevel: 36, requiredAttack: 560, requiredDefense: 270, bonus: { atk: 18, maxMp: 70, def: 10 } },
  priest_emblem: { id: 'priest_emblem', type: EMBLEM_TYPES.unit, name: '신관 문장', targetLine: 'priest', requiredTier: 7, requiredLevel: 36, requiredAttack: 600, requiredDefense: 280, bonus: { maxMp: 80, def: 14 } },
  mage_emblem: { id: 'mage_emblem', type: EMBLEM_TYPES.unit, name: '법사 문장', targetLine: 'mage', requiredTier: 7, requiredLevel: 36, requiredAttack: 700, requiredDefense: 320, bonus: { atk: 42, maxMp: 90 } },
  dark_priest_emblem: { id: 'dark_priest_emblem', type: EMBLEM_TYPES.unit, name: '사교 문장', targetLine: 'darkPriest', requiredTier: 7, requiredLevel: 36, requiredAttack: 720, requiredDefense: 330, bonus: { atk: 38, def: 12, maxMp: 80 } },
  battle_master_emblem: { id: 'battle_master_emblem', type: EMBLEM_TYPES.master, name: '배틀마스터 문장', targetLine: 'battleMaster', requiredTier: 7, requiredLevel: 36, fusionMaterials: ['infantry_emblem', 'flying_knight_emblem', 'cavalry_emblem'], bonus: { atk: 60, def: 40, maxHp: 100 } },
  tactics_master_emblem: { id: 'tactics_master_emblem', type: EMBLEM_TYPES.master, name: '택틱스마스터 문장', targetLine: 'tacticsMaster', requiredTier: 7, requiredLevel: 36, fusionMaterials: ['naval_unit_emblem', 'lancer_emblem', 'archer_emblem'], bonus: { atk: 48, def: 32, critChance: 4, maxHp: 80 } },
  magic_master_emblem: { id: 'magic_master_emblem', type: EMBLEM_TYPES.master, name: '매직마스터 문장', targetLine: 'magicMaster', requiredTier: 7, requiredLevel: 36, fusionMaterials: ['monk_emblem', 'priest_emblem', 'mage_emblem', 'dark_priest_emblem'], bonus: { atk: 55, maxMp: 120, critChance: 3 } },
};

function getOriginalLineLabel(lineId) {
  return ORIGINAL_LINE_LABELS[lineId] || lineId;
}

function isEmblemTrialActive() {
  return !!(currentEmblemTrial && currentEmblemTrial.emblemId && getEmblemDef(currentEmblemTrial.emblemId));
}

function getCurrentEmblemTrialDef() {
  return isEmblemTrialActive() ? getEmblemDef(currentEmblemTrial.emblemId) : null;
}

function startEmblemTrial(id) {
  if (!canPlayerEnterEmblemTrial(id)) return false;
  currentEmblemTrial = { emblemId: id };
  if (typeof enterEmblemTrial === 'function') enterEmblemTrial(id);
  return true;
}

function clearEmblemTrial() {
  currentEmblemTrial = null;
}

function getEmblemDef(id) {
  return EMBLEM_DEFS[id] || null;
}

function getAllEmblemDefs() {
  return Object.values(EMBLEM_DEFS);
}

function getPlayerOwnedEmblems() {
  return (player.emblemIds || []).map(getEmblemDef).filter(Boolean);
}

function playerHasEmblem(id) {
  return Array.isArray(player.emblemIds) && player.emblemIds.includes(id);
}

function getPlayerEmblemTrialStatus(id) {
  const emblem = getEmblemDef(id);
  if (!emblem || emblem.type !== EMBLEM_TYPES.unit) return null;
  const tierOk = (player.tier || player.classRank || 1) >= emblem.requiredTier;
  const levelOk = player.level >= emblem.requiredLevel;
  const lineOk = (player.classLine || 'infantry') === emblem.targetLine;
  const attackValue = playerAtk();
  const defenseValue = playerDef();
  const attackOk = true;
  const defenseOk = true;
  return {
    emblem,
    owned: playerHasEmblem(id),
    tierOk,
    levelOk,
    lineOk,
    attackOk,
    defenseOk,
    attackValue,
    defenseValue,
    canEnter: tierOk && levelOk && lineOk && attackOk && defenseOk,
  };
}

function canPlayerEnterEmblemTrial(id) {
  const status = getPlayerEmblemTrialStatus(id);
  return !!(status && status.canEnter && !status.owned);
}

function canPlayerFuseMasterEmblem(id) {
  const emblem = getEmblemDef(id);
  if (!emblem || emblem.type !== EMBLEM_TYPES.master || playerHasEmblem(id)) return false;
  return (emblem.fusionMaterials || []).every(playerHasEmblem);
}
