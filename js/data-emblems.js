'use strict';

// Emblem type taxonomy matches lightsaber_test staged progression:
//   unit  → 7단 기본 문장 10종 (문장의방 시험 보상)
//   tier8 → 8단 Lv100 만렙 보상 문장 3종 (9단 진입 게이트)
//   tier9 → 9단 Lv200 만렙 보상 문장 3종 (10단 진입 게이트)
//   master → deprecated alias for tier8 (save-migration only)
//   legacy → unused reserve
const EMBLEM_TYPES = {
  unit: 'unit',
  master: 'master',
  tier8: 'tier8',
  tier9: 'tier9',
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
  // tier8 문장 — 8단 만렙(Lv100) 보상. 9단 승급 게이트.
  battle_master_emblem: { id: 'battle_master_emblem', type: EMBLEM_TYPES.tier8, name: '배틀마스터 문장', targetLine: 'battleMaster', requiredTier: 8, requiredLevel: 100, bonus: { atk: 60, def: 40, maxHp: 100 } },
  tactics_master_emblem: { id: 'tactics_master_emblem', type: EMBLEM_TYPES.tier8, name: '택틱스마스터 문장', targetLine: 'tacticsMaster', requiredTier: 8, requiredLevel: 100, bonus: { atk: 48, def: 32, critChance: 4, maxHp: 80 } },
  magic_master_emblem: { id: 'magic_master_emblem', type: EMBLEM_TYPES.tier8, name: '매직마스터 문장', targetLine: 'magicMaster', requiredTier: 8, requiredLevel: 100, bonus: { atk: 55, maxMp: 120, critChance: 3 } },
  // tier9 문장 — 9단 만렙(Lv200) 보상. 10단 승급 게이트.
  grand_sword_emblem: { id: 'grand_sword_emblem', type: EMBLEM_TYPES.tier9, name: '그랑스워드 문장', targetLine: 'battleMaster', requiredTier: 9, requiredLevel: 200, bonus: { atk: 80, def: 55, maxHp: 140 } },
  grand_archer_emblem: { id: 'grand_archer_emblem', type: EMBLEM_TYPES.tier9, name: '그랑아처 문장', targetLine: 'tacticsMaster', requiredTier: 9, requiredLevel: 200, bonus: { atk: 66, def: 40, critChance: 6, maxHp: 110 } },
  grand_mage_emblem: { id: 'grand_mage_emblem', type: EMBLEM_TYPES.tier9, name: '그랑메이지 문장', targetLine: 'magicMaster', requiredTier: 9, requiredLevel: 200, bonus: { atk: 75, maxMp: 180, critChance: 5 } },
};

// 7단 기본 문장 → 8단 진입권 합체 레시피. 재료 + 부여할 tier8/tier9 보상 ID가 한 테이블에 모여있다.
const EMBLEM_FUSION_RECIPES = {
  battleMaster: {
    masterLineId: 'battleMaster',
    lineName: '배틀',
    materials: ['infantry_emblem', 'flying_knight_emblem', 'cavalry_emblem'],
    tier8EmblemId: 'battle_master_emblem',
    tier9EmblemId: 'grand_sword_emblem',
    colors: { primary: '#f1c40f', accent: '#e74c3c', glow: '#fff3b0' },
    keyword: '중량/전면돌파',
  },
  tacticsMaster: {
    masterLineId: 'tacticsMaster',
    lineName: '택틱스',
    materials: ['naval_unit_emblem', 'lancer_emblem', 'archer_emblem'],
    tier8EmblemId: 'tactics_master_emblem',
    tier9EmblemId: 'grand_archer_emblem',
    colors: { primary: '#1abc9c', accent: '#74b9ff', glow: '#d6f5ee' },
    keyword: '정밀/속도',
  },
  magicMaster: {
    masterLineId: 'magicMaster',
    lineName: '매직',
    materials: ['monk_emblem', 'priest_emblem', 'mage_emblem', 'dark_priest_emblem'],
    tier8EmblemId: 'magic_master_emblem',
    tier9EmblemId: 'grand_mage_emblem',
    colors: { primary: '#8e44ad', accent: '#6c5ce7', glow: '#e3d6f5' },
    keyword: '신비/초월',
  },
};

const EMBLEM_FUSION_MATERIAL_STYLES = {
  infantry: { glyph: '보', primary: '#f39c12', accent: '#c0392b', glow: '#ffe0a6' },
  flyingKnight: { glyph: '비', primary: '#f5b7b1', accent: '#e056fd', glow: '#ffe9ef' },
  cavalry: { glyph: '기', primary: '#f1c40f', accent: '#d35400', glow: '#fff2a8' },
  navalUnit: { glyph: '수', primary: '#1abc9c', accent: '#2980b9', glow: '#d7fff5' },
  lancer: { glyph: '창', primary: '#16a085', accent: '#2ecc71', glow: '#daf9ed' },
  archer: { glyph: '궁', primary: '#74b9ff', accent: '#0984e3', glow: '#e6f3ff' },
  monk: { glyph: '승', primary: '#9b59b6', accent: '#f39c12', glow: '#f3e5ff' },
  priest: { glyph: '신', primary: '#d6a2ff', accent: '#8e44ad', glow: '#fbf1ff' },
  mage: { glyph: '법', primary: '#6c5ce7', accent: '#00cec9', glow: '#ece9ff' },
  darkPriest: { glyph: '사', primary: '#8e44ad', accent: '#2d132c', glow: '#eedcff' },
};

function getFusionMaterialStyle(lineId) {
  return EMBLEM_FUSION_MATERIAL_STYLES[lineId] || null;
}

function getFusionRecipeForLine(masterLineId) {
  return EMBLEM_FUSION_RECIPES[masterLineId] || null;
}

function getAllFusionRecipes() {
  return Object.values(EMBLEM_FUSION_RECIPES);
}

function getFusionRecipeForTier8EmblemId(tier8EmblemId) {
  return getAllFusionRecipes().find(r => r.tier8EmblemId === tier8EmblemId) || null;
}

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

// lightsaber_test staged progression: 7단 기본 문장 합체는 "tier8 진입권"만 연다.
// 따라서 합체 가능 여부는 boolean 기준으로 재료만 본다. 이미 진입권을 획득한
// 라인이면 다시 합체할 수 없다.
function canPlayerFuseTier7ForLine(masterLineId) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return false;
  if (player.tier8UnlockLineId) return false;
  return (recipe.materials || []).every(playerHasEmblem);
}

function getPlayerFusionStatusForLine(masterLineId) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return null;
  const materials = recipe.materials || [];
  const owned = materials.filter(playerHasEmblem).length;
  const unlocked = player.tier8UnlockLineId === masterLineId;
  const otherUnlock = !!player.tier8UnlockLineId && !unlocked;
  return {
    recipe,
    materials,
    owned,
    total: materials.length,
    unlocked,
    otherUnlock,
    canFuse: !player.tier8UnlockLineId && owned >= materials.length,
  };
}
