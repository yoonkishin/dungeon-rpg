'use strict';

// ─── Skill System ─────────────────────────────────────────────────────────────
const SKILLS = [
  { id:'fireball',   name:'파이어볼',   icon:'🔥', mpCost:10, cooldown:3000, damage:25, range:120, type:'projectile', desc:'전방에 화염구를 발사하여 적에게 25 피해를 입힙니다', typeLabel:'투사체', iconBg:'#e74c3c' },
  { id:'heal',       name:'힐',         icon:'💚', mpCost:15, cooldown:5000, heal:40, range:0, type:'self', desc:'체력을 40 회복합니다', typeLabel:'자가', iconBg:'#2ecc71' },
  { id:'slash',      name:'강타',       icon:'⚡', mpCost:8,  cooldown:2000, damage:20, range:55, type:'melee', desc:'강력한 일격으로 근접 적에게 20 피해를 입힙니다', typeLabel:'근접', iconBg:'#e67e22' },
  { id:'shield',     name:'방어막',     icon:'🛡️', mpCost:12, cooldown:8000, defBuff:10, duration:5000, range:0, type:'buff', desc:'5초간 방어력이 10 증가합니다', typeLabel:'버프', iconBg:'#3498db' },
  { id:'poison',     name:'독안개',     icon:'☠️', mpCost:10, cooldown:4000, damage:5, ticks:5, range:80, type:'aoe', desc:'주변 적에게 독을 퍼뜨려 지속 피해를 입힙니다', typeLabel:'범위', iconBg:'#8e44ad' },
  { id:'sprint',     name:'질주',       icon:'💨', mpCost:5,  cooldown:6000, speedBuff:2, duration:3000, range:0, type:'buff', desc:'3초간 이동속도가 크게 증가합니다', typeLabel:'버프', iconBg:'#3498db' },
  { id:'thunder',    name:'번개',       icon:'⚡', mpCost:20, cooldown:6000, damage:40, range:100, type:'projectile', desc:'번개를 내려 적에게 40 피해를 입힙니다', typeLabel:'투사체', iconBg:'#e74c3c' },
  { id:'drain',      name:'흡혈',       icon:'🩸', mpCost:12, cooldown:4000, damage:15, heal:15, range:55, type:'melee', desc:'적의 생명력을 흡수하여 15 피해 + 15 회복합니다', typeLabel:'근접', iconBg:'#e67e22' },
  { id:'whirlwind',  name:'폭풍참',     icon:'🌪️', mpCost:25, cooldown:4000, damage:60, range:80,  type:'melee',      desc:'폭풍처럼 회전하며 주변 모든 적에게 60 피해를 입힙니다', typeLabel:'근접', iconBg:'#e67e22' },
  { id:'meteor',     name:'유성낙하',   icon:'☄️', mpCost:30, cooldown:8000, damage:80, range:150, type:'projectile', desc:'강력한 유성을 내리꽂아 범위 내 적에게 80 피해를 입힙니다', typeLabel:'투사체', iconBg:'#e74c3c' },
  { id:'iron_fortress', name:'철벽진', icon:'🏯', mpCost:20, cooldown:10000, defBuff:20, duration:6000, range:0, type:'buff', desc:'6초간 방어력이 20 증가하는 철벽 방어 태세를 취합니다', typeLabel:'버프', iconBg:'#3498db' },
  { id:'life_drain', name:'생명흡수',   icon:'💀', mpCost:22, cooldown:5000, damage:30, heal:30, range:65, type:'melee', desc:'강력한 생명 흡수로 근접 적에게 30 피해 + 30 회복합니다', typeLabel:'근접', iconBg:'#8e44ad' },
];

// ─── Player Growth Lines / Original Emblem Foundations ─────────────────────
const ORIGINAL_TIER_LEVEL_CAPS = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
  6: 35,
  7: 35,
  8: 100,
  9: 200,
  10: 300,
};

const PLAYER_LEVEL_CAP = ORIGINAL_TIER_LEVEL_CAPS[7];

const PLAYER_GROWTH_LINES = {
  infantry: {
    lineId: 'infantry',
    unitType: 'Infantry',
    lineName: '보병',
    levelGrowth: {
      maxHp: 18,
      maxMp: 8,
      atk: 4,
      def: 1,
      speed: 0.03,
      critChance: 0.5,
    },
    ranks: [
      { rank: 1, className: '견습보병',     reqLevel: 1,  color: '#bdc3c7', bodyColor: '#8e8e8e', levelGrowthBonus: { maxHp: 0, atk: 0, def: 0, critChance: 0.0 }, promotionBonus: { maxHp: 0, maxMp: 0, atk: 0, def: 0, speed: 0, critChance: 0 } },
      { rank: 2, className: '글라디에이터', reqLevel: 6,  color: '#3498db', bodyColor: '#2980b9', levelGrowthBonus: { maxHp: 1, atk: 0, def: 0, critChance: 0.05 }, promotionBonus: { maxHp: 10, atk: 2, def: 1, critChance: 0.5 } },
      { rank: 3, className: '소드맨',       reqLevel: 11, color: '#2ecc71', bodyColor: '#27ae60', levelGrowthBonus: { maxHp: 2, atk: 1, def: 0, critChance: 0.1 }, promotionBonus: { maxHp: 12, atk: 3, def: 1, critChance: 0.5 } },
      { rank: 4, className: '파이터',       reqLevel: 16, color: '#e74c3c', bodyColor: '#c0392b', levelGrowthBonus: { maxHp: 3, atk: 1, def: 0, critChance: 0.15 }, promotionBonus: { maxHp: 14, atk: 3, def: 1, critChance: 0.75 } },
      { rank: 5, className: '로열파이터',   reqLevel: 21, color: '#f1c40f', bodyColor: '#f39c12', levelGrowthBonus: { maxHp: 4, atk: 1, def: 1, critChance: 0.2 }, promotionBonus: { maxHp: 16, atk: 4, def: 2, critChance: 0.75 } },
      { rank: 6, className: '제네럴',       reqLevel: 26, color: '#9b59b6', bodyColor: '#8e44ad', levelGrowthBonus: { maxHp: 5, atk: 2, def: 1, critChance: 0.25 }, promotionBonus: { maxHp: 18, atk: 4, def: 2, critChance: 1 } },
      { rank: 7, className: '로열가드',     reqLevel: 31, color: '#e74c3c', bodyColor: '#ff6b6b', levelGrowthBonus: { maxHp: 6, atk: 2, def: 1, critChance: 0.3 }, promotionBonus: { maxHp: 20, atk: 5, def: 2, critChance: 1 } },
    ],
  }
};

function getTierLevelCap(tier) {
  return ORIGINAL_TIER_LEVEL_CAPS[tier] || PLAYER_LEVEL_CAP;
}

function getPlayerLevelCap() {
  return getTierLevelCap((player && (player.tier || player.classRank)) || 1);
}

function getXpToNextLevel(level, tier = 7) {
  if (level >= getTierLevelCap(tier)) return 0;
  return 100 + (50 * level) + (10 * level * level);
}

function xpForLevel(level) {
  return getXpToNextLevel(level);
}

function getGrowthLine(lineId) {
  return PLAYER_GROWTH_LINES[lineId] || PLAYER_GROWTH_LINES.infantry;
}

function getRankForLevel(lineId, level) {
  const line = getGrowthLine(lineId);
  let result = line.ranks[0];
  for (const r of line.ranks) {
    if (level >= r.reqLevel) result = r;
  }
  return result;
}

function getRankInfo(lineId, rank) {
  const line = getGrowthLine(lineId);
  return line.ranks.find(entry => entry.rank === rank) || line.ranks[0];
}

function getNextRank(lineId, level) {
  const line = getGrowthLine(lineId);
  for (const r of line.ranks) {
    if (r.reqLevel > level) return r;
  }
  return null;
}

function getNextRankFromCurrentRank(lineId, currentRank) {
  const line = getGrowthLine(lineId);
  const currentIndex = line.ranks.findIndex(entry => entry.rank === currentRank);
  if (currentIndex < 0 || currentIndex >= line.ranks.length - 1) return null;
  return line.ranks[currentIndex + 1];
}

function getLevelGrowthForRank(lineId, rank) {
  const line = getGrowthLine(lineId);
  const rankInfo = getRankInfo(lineId, rank);
  const bonus = rankInfo.levelGrowthBonus || {};
  return {
    maxHp: line.levelGrowth.maxHp + (bonus.maxHp || 0),
    maxMp: line.levelGrowth.maxMp + (bonus.maxMp || 0),
    atk: line.levelGrowth.atk + (bonus.atk || 0),
    def: line.levelGrowth.def + (bonus.def || 0),
    speed: line.levelGrowth.speed + (bonus.speed || 0),
    critChance: line.levelGrowth.critChance + (bonus.critChance || 0),
  };
}

function getPromotionBonusForRank(lineId, rank) {
  const rankInfo = getRankInfo(lineId, rank);
  const bonus = rankInfo.promotionBonus || {};
  return {
    maxHp: bonus.maxHp || 0,
    maxMp: bonus.maxMp || 0,
    atk: bonus.atk || 0,
    def: bonus.def || 0,
    speed: bonus.speed || 0,
    critChance: bonus.critChance || 0,
  };
}

function getPromotionBonusDelta(lineId, fromRank, toRank) {
  const delta = { maxHp: 0, maxMp: 0, atk: 0, def: 0, speed: 0, critChance: 0 };
  for (let rank = fromRank + 1; rank <= toRank; rank++) {
    const bonus = getPromotionBonusForRank(lineId, rank);
    delta.maxHp += bonus.maxHp;
    delta.maxMp += bonus.maxMp;
    delta.atk += bonus.atk;
    delta.def += bonus.def;
    delta.speed += bonus.speed;
    delta.critChance += bonus.critChance;
  }
  return delta;
}

function applyPromotionBonus(delta) {
  player.maxHp += delta.maxHp;
  player.hp = player.maxHp;
  player.maxMp += delta.maxMp;
  player.mp = player.maxMp;
  player.atk += delta.atk;
  player.def += delta.def;
  player.speed += delta.speed;
  player.critChance = Math.min(30, player.critChance + delta.critChance);
}

function syncPlayerGrowthState() {
  player.classLine = player.classLine || 'infantry';
  const line = getGrowthLine(player.classLine);
  const highestRank = line.ranks[line.ranks.length - 1].rank;
  const derivedRank = getRankForLevel(player.classLine, player.level).rank;
  player.classRank = Math.max(1, Math.min(player.classRank || derivedRank, highestRank));
  player.promotionBonusRankApplied = Math.max(1, Math.min(player.promotionBonusRankApplied || 1, player.classRank));
  const nextRank = getNextRankFromCurrentRank(player.classLine, player.classRank);
  player.promotionPending = !!(nextRank && player.level >= nextRank.reqLevel);
  player.tier = player.classRank;
  player.currentClassKey = player.currentClassKey || `${player.classLine}_rank${player.classRank}`;
  player.currentClassKey = `${player.classLine}_rank${player.classRank}`;
  if (!Array.isArray(player.classHistory) || player.classHistory.length === 0) {
    player.classHistory = [player.currentClassKey];
  }
  if (!Array.isArray(player.emblemIds)) player.emblemIds = [];
  if (!Array.isArray(player.emblemFusionHistory)) player.emblemFusionHistory = [];
  player.masterEmblemId = player.masterEmblemId || null;
  player.xpNext = getXpToNextLevel(player.level, player.tier || player.classRank || 1);
  return getRankInfo(player.classLine, player.classRank);
}

// ─── Class Tier System (player growth line compat) ─────────────────────────
const CLASS_TIERS = PLAYER_GROWTH_LINES.infantry.ranks.map(rank => ({
  tier: rank.rank,
  name: rank.className,
  reqLevel: rank.reqLevel,
  color: rank.color,
  bodyColor: rank.bodyColor,
}));

function toTierDisplay(rankInfo) {
  return {
    ...rankInfo,
    tier: rankInfo.rank,
    name: rankInfo.className,
  };
}

function getCurrentTier() {
  return toTierDisplay(getRankInfo(player.classLine || 'infantry', player.classRank || 1));
}

function getNextTier() {
  const next = getNextRankFromCurrentRank(player.classLine || 'infantry', player.classRank || 1);
  if (!next) return null;
  return toTierDisplay(next);
}

function getPlayerPromotionTarget() {
  const next = getNextRankFromCurrentRank(player.classLine || 'infantry', player.classRank || 1);
  if (!next) return null;
  return player.level >= next.reqLevel ? toTierDisplay(next) : null;
}

function getPlayerPromotionGrowthDelta() {
  const currentRank = player.classRank || 1;
  const target = getPlayerPromotionTarget();
  if (!target) return null;
  const currentGrowth = getLevelGrowthForRank(player.classLine || 'infantry', currentRank);
  const targetGrowth = getLevelGrowthForRank(player.classLine || 'infantry', target.rank);
  return {
    maxHp: targetGrowth.maxHp - currentGrowth.maxHp,
    maxMp: targetGrowth.maxMp - currentGrowth.maxMp,
    atk: targetGrowth.atk - currentGrowth.atk,
    def: targetGrowth.def - currentGrowth.def,
    speed: targetGrowth.speed - currentGrowth.speed,
    critChance: targetGrowth.critChance - currentGrowth.critChance,
  };
}

function getPlayerPromotionStatBonus() {
  const target = getPlayerPromotionTarget();
  if (!target) return null;
  return getPromotionBonusDelta(player.classLine || 'infantry', player.promotionBonusRankApplied || 1, target.rank);
}

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
  infantry_emblem: { id: 'infantry_emblem', type: EMBLEM_TYPES.unit, name: '보병 문장', targetLine: 'infantry', requiredTier: 7, requiredLevel: 35, requiredAttack: 400, requiredDefense: 200, bonus: { atk: 30, def: 20 } },
  flying_knight_emblem: { id: 'flying_knight_emblem', type: EMBLEM_TYPES.unit, name: '비병 문장', targetLine: 'flyingKnight', requiredTier: 7, requiredLevel: 35, requiredAttack: 400, requiredDefense: 200, bonus: { speed: 0.35, critChance: 2 } },
  cavalry_emblem: { id: 'cavalry_emblem', type: EMBLEM_TYPES.unit, name: '기병 문장', targetLine: 'cavalry', requiredTier: 7, requiredLevel: 35, requiredAttack: 450, requiredDefense: 200, bonus: { atk: 25, speed: 0.25 } },
  naval_unit_emblem: { id: 'naval_unit_emblem', type: EMBLEM_TYPES.unit, name: '수병 문장', targetLine: 'navalUnit', requiredTier: 7, requiredLevel: 35, requiredAttack: 400, requiredDefense: 220, bonus: { def: 20, maxHp: 40 } },
  lancer_emblem: { id: 'lancer_emblem', type: EMBLEM_TYPES.unit, name: '창병 문장', targetLine: 'lancer', requiredTier: 7, requiredLevel: 35, requiredAttack: 500, requiredDefense: 250, bonus: { atk: 30, critChance: 1 } },
  archer_emblem: { id: 'archer_emblem', type: EMBLEM_TYPES.unit, name: '궁병 문장', targetLine: 'archer', requiredTier: 7, requiredLevel: 35, requiredAttack: 450, requiredDefense: 200, bonus: { atk: 25, critChance: 2 } },
  monk_emblem: { id: 'monk_emblem', type: EMBLEM_TYPES.unit, name: '승려 문장', targetLine: 'monk', requiredTier: 7, requiredLevel: 35, requiredAttack: 500, requiredDefense: 250, bonus: { maxMp: 40, def: 10 } },
  priest_emblem: { id: 'priest_emblem', type: EMBLEM_TYPES.unit, name: '신관 문장', targetLine: 'priest', requiredTier: 7, requiredLevel: 35, requiredAttack: 500, requiredDefense: 250, bonus: { maxMp: 50, def: 15 } },
  mage_emblem: { id: 'mage_emblem', type: EMBLEM_TYPES.unit, name: '법사 문장', targetLine: 'mage', requiredTier: 7, requiredLevel: 35, requiredAttack: 600, requiredDefense: 300, bonus: { atk: 35, maxMp: 50 } },
  dark_priest_emblem: { id: 'dark_priest_emblem', type: EMBLEM_TYPES.unit, name: '사교 문장', targetLine: 'darkPriest', requiredTier: 7, requiredLevel: 35, requiredAttack: 600, requiredDefense: 300, bonus: { atk: 30, def: 15, maxMp: 35 } },
  battle_master_emblem: { id: 'battle_master_emblem', type: EMBLEM_TYPES.master, name: '배틀마스터 문장', targetLine: 'battleMaster', requiredTier: 7, requiredLevel: 35, fusionMaterials: ['infantry_emblem', 'flying_knight_emblem', 'cavalry_emblem'], bonus: { atk: 60, def: 40, maxHp: 100 } },
  tactics_master_emblem: { id: 'tactics_master_emblem', type: EMBLEM_TYPES.master, name: '택틱스마스터 문장', targetLine: 'tacticsMaster', requiredTier: 7, requiredLevel: 35, fusionMaterials: ['naval_unit_emblem', 'lancer_emblem', 'archer_emblem'], bonus: { atk: 45, def: 25, critChance: 4 } },
  magic_master_emblem: { id: 'magic_master_emblem', type: EMBLEM_TYPES.master, name: '매직마스터 문장', targetLine: 'magicMaster', requiredTier: 7, requiredLevel: 35, fusionMaterials: ['monk_emblem', 'priest_emblem', 'mage_emblem', 'dark_priest_emblem'], bonus: { atk: 55, maxMp: 80, critChance: 3 } },
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
  const attackOk = attackValue >= emblem.requiredAttack;
  const defenseOk = defenseValue >= emblem.requiredDefense;
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


const skillPages = [
  ['fireball', 'heal', 'slash', 'shield'],
  ['poison', 'sprint', 'thunder', 'drain'],
  ['whirlwind', 'meteor', 'iron_fortress', 'life_drain'],
];

function getSkillById(id) {
  return SKILLS.find(s => s.id === id) || null;
}
