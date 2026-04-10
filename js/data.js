'use strict';

const DUNGEON_INFO = [
  { id:0, name:'슬라임 동굴',  portalX:25, portalY:45, bossName:'거대 슬라임',  bossColor:'#27ae60', bossHp:300,  bossAtk:20,  companionName:'슬라임 기사', companionColor:'#27ae60', recommendedLevel:1,  zone:'초원 입구', layoutHint:'개방형 동굴', bossSkillType:'slam', bossSkillName:'점액 낙하', bossSkillColor:'#2ecc71' },
  { id:1, name:'고블린 소굴',  portalX:55, portalY:50, bossName:'고블린 왕',    bossColor:'#e67e22', bossHp:500,  bossAtk:30,  companionName:'고블린 궁수', companionColor:'#e67e22', recommendedLevel:3,  zone:'동쪽 야영지', layoutHint:'갈림길 굴', bossSkillType:'bolt', bossSkillName:'왕의 화살', bossSkillColor:'#f39c12' },
  { id:2, name:'해골 무덤',    portalX:12, portalY:35, bossName:'해골 군주',    bossColor:'#bdc3c7', bossHp:600,  bossAtk:35,  companionName:'해골 마법사', companionColor:'#bdc3c7', recommendedLevel:5,  zone:'폐허 묘지', layoutHint:'묘지 복도형', bossSkillType:'nova', bossSkillName:'망자의 파동', bossSkillColor:'#ecf0f1' },
  { id:3, name:'오크 요새',    portalX:65, portalY:30, bossName:'오크 대장',    bossColor:'#8e44ad', bossHp:800,  bossAtk:45,  companionName:'오크 전사',  companionColor:'#8e44ad', recommendedLevel:7,  zone:'북부 요새길', layoutHint:'요새 십자형', bossSkillType:'charge', bossSkillName:'전쟁 돌진', bossSkillColor:'#9b59b6' },
  { id:4, name:'어둠의 숲',    portalX:10, portalY:15, bossName:'그림자 군주',   bossColor:'#2c3e50', bossHp:1000, bossAtk:55,  companionName:'그림자 비익', companionColor:'#2c3e50', recommendedLevel:10, zone:'그늘 숲', layoutHint:'미궁 숲길', bossSkillType:'bolt', bossSkillName:'그림자 창', bossSkillColor:'#34495e' },
  { id:5, name:'용암 동굴',    portalX:50, portalY:20, bossName:'화염 골렘',    bossColor:'#e74c3c', bossHp:1200, bossAtk:65,  companionName:'화염 마도사', companionColor:'#e74c3c', recommendedLevel:13, zone:'화산 협곡', layoutHint:'용암 균열형', bossSkillType:'nova', bossSkillName:'화염 폭발', bossSkillColor:'#ff6b6b' },
  { id:6, name:'얼음 성채',    portalX:30, portalY:8,  bossName:'빙결 여왕',    bossColor:'#74b9ff', bossHp:1500, bossAtk:75,  companionName:'빙결 수호자', companionColor:'#74b9ff', recommendedLevel:16, zone:'빙설 고원', layoutHint:'빙결 회랑', bossSkillType:'bolt', bossSkillName:'빙결 파편', bossSkillColor:'#74b9ff' },
  { id:7, name:'마왕의 탑',    portalX:70, portalY:10, bossName:'암흑 기사',    bossColor:'#636e72', bossHp:2000, bossAtk:90,  companionName:'암흑 성기사', companionColor:'#636e72', recommendedLevel:20, zone:'검은 탑', layoutHint:'탑의 3차선', bossSkillType:'charge', bossSkillName:'암흑 돌격', bossSkillColor:'#95a5a6' },
  { id:8, name:'최종 던전',    portalX:40, portalY:3,  bossName:'마왕',        bossColor:'#d63031', bossHp:3000, bossAtk:120, companionName:'성녀',       companionColor:'#ffeaa7', recommendedLevel:24, zone:'심연의 문', layoutHint:'최종 제단', bossSkillType:'nova', bossSkillName:'파멸진', bossSkillColor:'#ff7675' },
];

const COMPANION_ROSTER = {
  0: { id:0, key:'slime_knight', name:'슬라임 기사', classId:101, unlockType:'dungeonClear', unlockRef:0, color:'#27ae60', portraitIcon:'🛡️', desc:'전방에서 적을 붙잡는 보병 동료.' },
  1: { id:1, key:'goblin_archer', name:'고블린 궁수', classId:106, unlockType:'dungeonClear', unlockRef:1, color:'#e67e22', portraitIcon:'🏹', desc:'안정적으로 원거리 화력을 넣는 궁병.' },
  2: { id:2, key:'skeleton_mage', name:'해골 마법사', classId:109, unlockType:'dungeonClear', unlockRef:2, color:'#bdc3c7', portraitIcon:'🔮', desc:'광역 마법 화력을 담당하는 법사.' },
  3: { id:3, key:'orc_lancer', name:'오크 전사', classId:105, unlockType:'dungeonClear', unlockRef:3, color:'#8e44ad', portraitIcon:'🗡️', desc:'중거리 물리 압박이 강한 창병.' },
  4: { id:4, key:'shadow_flier', name:'그림자 비익', classId:102, unlockType:'dungeonClear', unlockRef:4, color:'#2c3e50', portraitIcon:'🪽', desc:'고기동으로 후열을 파고드는 비병.' },
  5: { id:5, key:'flame_cultist', name:'화염 마도사', classId:110, unlockType:'dungeonClear', unlockRef:5, color:'#e74c3c', portraitIcon:'🔥', desc:'화염과 약화 효과를 다루는 사교.' },
  6: { id:6, key:'frost_guard', name:'빙결 수호자', classId:104, unlockType:'dungeonClear', unlockRef:6, color:'#74b9ff', portraitIcon:'❄️', desc:'빙결 제어와 버티기가 좋은 수병.' },
  7: { id:7, key:'dark_paladin', name:'암흑 성기사', classId:103, unlockType:'dungeonClear', unlockRef:7, color:'#636e72', portraitIcon:'🐎', desc:'돌격과 진형 붕괴에 강한 기병.' },
  8: { id:8, key:'saintess', name:'성녀', classId:108, unlockType:'dungeonClear', unlockRef:8, color:'#ffeaa7', portraitIcon:'✨', desc:'파티 유지력의 핵심인 신관.' },
  9: { id:9, key:'radiant_monk', name:'백광 수도승', classId:107, unlockType:'subquestReward', unlockRef:'sage_survey', color:'#f1c40f', portraitIcon:'📿', desc:'보조와 공격을 겸하는 승려.' },
};

const COMPANION_CLASS_PROFILES = {
  101: { classId:101, className:'보병', unitType:'Infantry', roleKey:'tank', roleLabel:'전방 탱커', attackRange:50, preferredRange:34, attackCooldown:980, skillId:'slime_guard', skillName:'점액 방패', skillCooldown:5200, aiDefault:'defensive' },
  102: { classId:102, className:'비병', unitType:'FlyingKnight', roleKey:'assassin', roleLabel:'고기동 추격', attackRange:60, preferredRange:42, attackCooldown:820, skillId:'shadow_strike', skillName:'암영 참격', skillCooldown:5000, aiDefault:'aggressive' },
  103: { classId:103, className:'기병', unitType:'Cavalry', roleKey:'paladin', roleLabel:'돌격 딜러', attackRange:64, preferredRange:48, attackCooldown:980, skillId:'dark_aegis', skillName:'암흑 수호', skillCooldown:6200, aiDefault:'defensive' },
  104: { classId:104, className:'수병', unitType:'NavalUnit', roleKey:'guardian', roleLabel:'빙결 제어', attackRange:62, preferredRange:46, attackCooldown:1040, skillId:'frost_lock', skillName:'빙결 봉쇄', skillCooldown:5400, aiDefault:'defensive' },
  105: { classId:105, className:'창병', unitType:'Lancer', roleKey:'bruiser', roleLabel:'중거리 물리', attackRange:56, preferredRange:40, attackCooldown:960, skillId:'war_cleave', skillName:'전투 강타', skillCooldown:4300, aiDefault:'aggressive' },
  106: { classId:106, className:'궁병', unitType:'Archer', roleKey:'ranger', roleLabel:'원거리 딜러', attackRange:128, preferredRange:92, attackCooldown:1080, skillId:'arrow_barrage', skillName:'연발 사격', skillCooldown:4800, aiDefault:'aggressive' },
  107: { classId:107, className:'승려', unitType:'Monk', roleKey:'support', roleLabel:'전투 서포트', attackRange:104, preferredRange:80, attackCooldown:1180, skillId:'holy_prayer', skillName:'백광 기도', skillCooldown:5800, aiDefault:'support' },
  108: { classId:108, className:'신관', unitType:'Priest', roleKey:'support', roleLabel:'힐러/버퍼', attackRange:96, preferredRange:84, attackCooldown:1300, skillId:'holy_prayer', skillName:'성역 기도', skillCooldown:5400, aiDefault:'support' },
  109: { classId:109, className:'법사', unitType:'Mage', roleKey:'caster', roleLabel:'광역 마법', attackRange:118, preferredRange:86, attackCooldown:1200, skillId:'bone_nova', skillName:'망령 폭발', skillCooldown:5600, aiDefault:'aggressive' },
  110: { classId:110, className:'사교', unitType:'DarkPriest', roleKey:'mage', roleLabel:'약화 마도', attackRange:132, preferredRange:94, attackCooldown:1220, skillId:'flame_burst', skillName:'화염 난사', skillCooldown:5200, aiDefault:'aggressive' },
};

const COMPANION_CLASS_SYNERGIES = {
  '101-108': { name:'성역 방진', desc:'플레이어 방어 +2, 회복량 +15%', playerDefBonus:2, healMult:1.15 },
  '102-103': { name:'기동 추격', desc:'동료 공격 +3, 공격 주기 18% 개선', companionAtkBonus:3, cooldownMult:0.82 },
  '105-106': { name:'견제 사선', desc:'플레이어 공격 +2, 방어 +1', playerAtkBonus:2, playerDefBonus:1 },
  '109-110': { name:'심연 공명', desc:'마법 동료 피해 +4', companionAtkBonus:4 },
};

const COMPANION_AI_MODES = {
  aggressive: { key:'aggressive', label:'공격적', color:'#e74c3c' },
  defensive: { key:'defensive', label:'방어적', color:'#3498db' },
  support: { key:'support', label:'서포트', color:'#2ecc71' },
};

const COMPANION_UNIT_TYPE_LABELS = {
  Infantry: '근접 전열',
  FlyingKnight: '공중 기동',
  Cavalry: '돌격 기병',
  NavalUnit: '빙결 수호',
  Lancer: '중거리 창격',
  Archer: '원거리 사격',
  Monk: '전투 지원',
  Priest: '회복 지원',
  Mage: '광역 마법',
  DarkPriest: '약화 마도',
};

function getTotalCompanionCount() {
  return Object.keys(COMPANION_ROSTER).length;
}

function isValidCompanionId(cId) {
  return !!COMPANION_ROSTER[cId];
}

function getCompanionRoster(cId) {
  return COMPANION_ROSTER[cId] || null;
}

function getCompanionClassProfile(classId) {
  return COMPANION_CLASS_PROFILES[classId] || null;
}

function getCompanionClassName(classId) {
  const profile = getCompanionClassProfile(classId);
  return profile ? profile.className : '미정';
}

function getCompanionName(cId) {
  const roster = getCompanionRoster(cId);
  return roster ? roster.name : '알 수 없는 동료';
}

function getCompanionColor(cId) {
  const roster = getCompanionRoster(cId);
  return roster ? roster.color : '#7f8c8d';
}

function getCompanionProfile(cId) {
  const roster = getCompanionRoster(cId);
  if (!roster) return null;
  const classProfile = getCompanionClassProfile(roster.classId);
  if (!classProfile) return null;
  return {
    ...classProfile,
    ...roster,
    companionName: roster.name,
    companionColor: roster.color,
  };
}

function normalizeCompanionAIMode(mode) {
  return COMPANION_AI_MODES[mode] ? mode : 'aggressive';
}

function getCompanionUnitType(profileOrId) {
  const profile = typeof profileOrId === 'number' ? getCompanionProfile(profileOrId) : profileOrId;
  return profile && profile.unitType ? profile.unitType : null;
}

function getCompanionUnitTypeLabel(profileOrId) {
  const unitType = getCompanionUnitType(profileOrId);
  return unitType ? (COMPANION_UNIT_TYPE_LABELS[unitType] || unitType) : '미정';
}

function isCompanionSupportProfile(profileOrId) {
  const unitType = getCompanionUnitType(profileOrId);
  return unitType === 'Monk' || unitType === 'Priest';
}

function isCompanionRangedProfile(profileOrId) {
  const unitType = getCompanionUnitType(profileOrId);
  return unitType === 'Archer' || unitType === 'Mage' || unitType === 'DarkPriest' || unitType === 'Monk' || unitType === 'Priest';
}

function isCompanionMagicProfile(profileOrId) {
  const unitType = getCompanionUnitType(profileOrId);
  return unitType === 'Mage' || unitType === 'DarkPriest' || unitType === 'Monk' || unitType === 'Priest' || unitType === 'NavalUnit';
}

function isCompanionFrontlineProfile(profileOrId) {
  const unitType = getCompanionUnitType(profileOrId);
  return unitType === 'Infantry' || unitType === 'Cavalry' || unitType === 'NavalUnit' || unitType === 'Lancer';
}

function isCompanionFlankerProfile(profileOrId) {
  const unitType = getCompanionUnitType(profileOrId);
  return unitType === 'FlyingKnight' || unitType === 'Cavalry';
}

function getDefaultCompanionAIMode(cId) {
  const profile = getCompanionProfile(cId);
  if (profile.aiDefault && COMPANION_AI_MODES[profile.aiDefault]) return profile.aiDefault;
  if (isCompanionSupportProfile(profile)) return 'support';
  if (isCompanionFrontlineProfile(profile)) return 'defensive';
  return 'aggressive';
}

function getCompanionAIMode(cId, state) {
  if (state && state.aiMode && COMPANION_AI_MODES[state.aiMode]) return state.aiMode;
  if (companionAIModes[cId] && COMPANION_AI_MODES[companionAIModes[cId]]) return companionAIModes[cId];
  const fallback = getDefaultCompanionAIMode(cId);
  companionAIModes[cId] = fallback;
  return fallback;
}

function setCompanionAIMode(cId, mode) {
  const normalized = normalizeCompanionAIMode(mode || getDefaultCompanionAIMode(cId));
  companionAIModes[cId] = normalized;
  if (companionStates[cId]) companionStates[cId].aiMode = normalized;
  return normalized;
}

function cycleCompanionAIMode(cId) {
  const order = ['aggressive', 'defensive', 'support'];
  const current = getCompanionAIMode(cId);
  const idx = order.indexOf(current);
  const next = order[(idx + 1) % order.length];
  return setCompanionAIMode(cId, next);
}

function getActiveCompanionSynergy() {
  if (activeCompanions.length !== 2) return null;
  const profiles = activeCompanions.map(cId => getCompanionProfile(cId)).filter(Boolean);
  if (profiles.length !== 2) return null;
  const classIds = profiles
    .map(profile => profile.classId)
    .sort((a, b) => a - b);
  const key = classIds.join('-');
  return COMPANION_CLASS_SYNERGIES[key] || null;
}

function getHealingMultiplier() {
  const synergy = getActiveCompanionSynergy();
  return getVillagePotionMultiplier() * (synergy && synergy.healMult ? synergy.healMult : 1);
}

function initCompanionState(cId) {
  const profile = getCompanionProfile(cId);
  if (!profile) return false;
  const maxHp = getCompanionMaxHp(cId);
  companionStates[cId] = {
    x: player.x + (Math.random() - 0.5) * 40,
    y: player.y + (Math.random() - 0.5) * 40,
    hp: maxHp,
    maxHp: maxHp,
    attackTimer: 0,
    skillTimer: Math.random() * 1200,
    flashTimer: 0,
    aiMode: getCompanionAIMode(cId)
  };
  return true;
}

function getCompanionMaxHp(cId) {
  const synergy = getActiveCompanionSynergy();
  return 80 + cId * 30 + getVillageCompanionHpBonus() + (synergy && synergy.companionHpBonus ? synergy.companionHpBonus : 0);
}

function getCompanionAtk(cId) {
  const synergy = getActiveCompanionSynergy();
  return 10 + cId * 5 + getVillageCompanionAtkBonus() + (synergy && synergy.companionAtkBonus ? synergy.companionAtkBonus : 0);
}

function getCompanionAttackRange(cId) {
  const profile = getCompanionProfile(cId);
  return profile ? profile.attackRange : 50;
}

function getCompanionPreferredRange(cId) {
  const profile = getCompanionProfile(cId);
  return profile ? profile.preferredRange : 34;
}

function getCompanionAttackCooldown(cId, state) {
  const profile = getCompanionProfile(cId);
  if (!profile) return 1000;
  const synergy = getActiveCompanionSynergy();
  const mode = getCompanionAIMode(cId, state);
  let modeMult = 1;
  if (mode === 'aggressive') modeMult = 0.88;
  else if (mode === 'defensive') modeMult = 1.06;
  else if (mode === 'support') modeMult = 1.12;
  return Math.floor(profile.attackCooldown * (synergy && synergy.cooldownMult ? synergy.cooldownMult : 1) * modeMult);
}


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

const skillPages = [
  ['fireball', 'heal', 'slash', 'shield'],
  ['poison', 'sprint', 'thunder', 'drain'],
  [null, null, null, null],
];

function getSkillById(id) {
  return SKILLS.find(s => s.id === id) || null;
}

// ─── Enemy Types ──────────────────────────────────────────────────────────────
const ENEMY_TYPES = [
  { name:'슬라임', color:'#27ae60', size:20, hp:30, atk:6, speed:0.5, xp:10, gold:3, aggroRange:150, attackRange:28 },
  { name:'고블린', color:'#e67e22', size:22, hp:50, atk:12, speed:0.7, xp:20, gold:6, aggroRange:180, attackRange:30 },
  { name:'해골',   color:'#bdc3c7', size:22, hp:40, atk:10, speed:0.6, xp:15, gold:5, aggroRange:200, attackRange:28 },
  { name:'오크',   color:'#8e44ad', size:26, hp:90, atk:18, speed:0.4, xp:35, gold:12, aggroRange:160, attackRange:35 },
  { name:'다크나이트', color:'#2c3e50', size:28, hp:160, atk:28, speed:0.5, xp:60, gold:25, aggroRange:200, attackRange:38 },
];

// ─── Item Definitions ────────────────────────────────────────────────────────
const ITEMS = {
  sword1:    { id:'sword1',    name:'낡은 검',     type:'weapon',    atk:5,  def:0,  price:0,   color:'#bdc3c7', icon:'🗡️' },
  sword2:    { id:'sword2',    name:'강철 검',     type:'weapon',    atk:12, def:0,  price:80,  color:'#ecf0f1', icon:'⚔️' },
  axe1:      { id:'axe1',      name:'전투 도끼',   type:'weapon',    atk:18, def:0,  price:150, color:'#e67e22', icon:'🪓' },
  dagger1:   { id:'dagger1',   name:'단검',        type:'weapon',    atk:8,  def:0,  price:40,  color:'#95a5a6', icon:'🔪' },
  leather1:  { id:'leather1',  name:'가죽 갑옷',   type:'armor',     atk:0,  def:5,  price:60,  color:'#8b6914', icon:'🧥' },
  iron1:     { id:'iron1',     name:'철 갑옷',     type:'armor',     atk:0,  def:12, price:200, color:'#7f8c8d', icon:'🛡️' },
  robe1:     { id:'robe1',     name:'마법사 로브', type:'armor',     atk:3,  def:3,  price:100, color:'#8e44ad', icon:'👘' },
  potion_hp: { id:'potion_hp', name:'체력 포션',   type:'potion',    atk:0,  def:0,  price:20,  color:'#e74c3c', icon:'🧪', heal:50 },
  potion_hp2:{ id:'potion_hp2',name:'고급 체력 포션',type:'potion',  atk:0,  def:0,  price:60,  color:'#c0392b', icon:'🧪', heal:120 },
  ring_atk:  { id:'ring_atk',  name:'힘의 반지',   type:'accessory', atk:4,  def:0,  price:120, color:'#e74c3c', icon:'💍' },
  ring_def:  { id:'ring_def',  name:'수호의 반지', type:'accessory', atk:0,  def:4,  price:120, color:'#3498db', icon:'💍' },
  amulet1:   { id:'amulet1',   name:'생명의 부적', type:'accessory', atk:2,  def:2,  price:180, color:'#2ecc71', icon:'📿' },
  helmet1:   { id:'helmet1',   name:'가죽 투구',   type:'helmet',    atk:0,  def:3,  price:40,  color:'#8b6914', icon:'⛑️' },
  helmet2:   { id:'helmet2',   name:'철 투구',     type:'helmet',    atk:0,  def:7,  price:120, color:'#7f8c8d', icon:'⛑️' },
  boots1:    { id:'boots1',    name:'가죽 장화',   type:'boots',     atk:0,  def:2,  price:30,  color:'#8b6914', icon:'👢', speedBonus:0.1 },
  boots2:    { id:'boots2',    name:'철 장화',     type:'boots',     atk:0,  def:5,  price:100, color:'#7f8c8d', icon:'👢', speedBonus:0.15 },
  shield1:   { id:'shield1',   name:'나무 방패',   type:'shield',    atk:0,  def:6,  price:50,  color:'#8b6914', icon:'🛡️' },
  shield2:   { id:'shield2',   name:'강철 방패',   type:'shield',    atk:0,  def:12, price:180, color:'#95a5a6', icon:'🛡️' },
  event1:    { id:'event1',    name:'행운의 부적', type:'event',     atk:0,  def:0,  price:500, color:'#f1c40f', icon:'🍀', critBonus:5, goldBonus:20 },
};

const DROP_TABLE = {
  0: [{ itemId:'dagger1', chance:0.08 }, { itemId:'potion_hp', chance:0.15 }],
  1: [{ itemId:'dagger1', chance:0.12 }, { itemId:'leather1', chance:0.06 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet1', chance:0.05 }, { itemId:'boots1', chance:0.05 }],
  2: [{ itemId:'sword1', chance:0.10 }, { itemId:'leather1', chance:0.08 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet1', chance:0.06 }, { itemId:'shield1', chance:0.04 }],
  3: [{ itemId:'sword2', chance:0.08 }, { itemId:'iron1', chance:0.05 }, { itemId:'axe1', chance:0.04 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet2', chance:0.04 }, { itemId:'boots2', chance:0.04 }, { itemId:'shield1', chance:0.05 }],
  4: [{ itemId:'axe1', chance:0.10 }, { itemId:'iron1', chance:0.08 }, { itemId:'robe1', chance:0.06 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet2', chance:0.05 }, { itemId:'boots2', chance:0.05 }, { itemId:'shield2', chance:0.04 }, { itemId:'event1', chance:0.02 }],
};

const EQUIP_SLOTS = ['weapon','armor','helmet','boots','accessory1','accessory2','shield','event'];

// Shop NPCs
const NPCS = [
  { id:'general',   name:'잡화점',   x: 9*40+20,  y: 8*40+20,  shopItems:['potion_hp','potion_hp2'], color:'#2ecc71', hat:'#27ae60' },
  { id:'weapon',    name:'무기점',   x: 12*40+20, y: 8*40+20,  shopItems:['sword1','sword2','dagger1','axe1'], color:'#e74c3c', hat:'#c0392b' },
  { id:'armor',     name:'방어구점', x: 9*40+20,  y: 11*40+20, shopItems:['leather1','iron1','robe1','helmet1','helmet2','boots1','boots2','shield1','shield2'], color:'#3498db', hat:'#2980b9' },
  { id:'accessory', name:'장신구점', x: 12*40+20, y: 11*40+20, shopItems:['ring_atk','ring_def','amulet1','event1'], color:'#f39c12', hat:'#e67e22' },
];

// Town NPCs (dialogue only)
const TOWN_NPCS = [
  { id:'chief', name:'촌장', x:10*40+20, y:10*40+20, color:'#e8d5b7', hat:'#8b4513',
    dialogue:['이 마을에 온 것을 환영합니다!','상점에서 장비를 구하고 밖으로 나가 모험을 시작하세요.','던전을 클리어하면 동료를 얻을 수 있습니다.'] },
  { id:'sage', name:'현자', x:7*40+20, y:12*40+20, color:'#ddd', hat:'#4a69bd',
    dialogue:['북쪽 숲 너머에 첫 번째 던전이 있다네...','9개의 던전을 모두 클리어하면 전설의 영웅들을 모을 수 있지.','각 던전의 보스는 점점 강해진다네. 준비를 철저히 하게.'] },
  { id:'guard', name:'경비병', x:14*40+20, y:14*40+20, color:'#95a5a6', hat:'#2c3e50',
    dialogue:['마을 밖은 위험합니다. 장비를 잘 챙기세요.','동쪽으로 가면 필드로 나갈 수 있습니다.','몬스터가 점점 강해지니 조심하십시오.'] },
  { id:'temple', name:'⛪ 신전', x:5*40+20, y:10*40+20, color:'#ffeaa7', hat:'#fdcb6e', isTemple:true,
    dialogue:['쓰러진 동료들을 이곳에서 부활시킬 수 있습니다.'] },
  { id:'training', name:'🏯 수련의 방', x:14*40+20, y:10*40+20, color:'#f8c471', hat:'#8e5a2b', isTrainingRoom:true,
    dialogue:['승급 자격이 생기면 이곳에서 클래스를 올릴 수 있습니다.'] },
  { id:'emblem_room', name:'🜂 문장의방', x:5*40+20, y:13*40+20, color:'#d6b3ff', hat:'#6c5ce7', isEmblemRoom:true,
    dialogue:['7단 Lv35와 충분한 전투 능력을 갖춘 자만 이곳의 시험에 도전할 수 있습니다.'] },
];
const MAIN_QUESTS = [
  {
    id: 'chief_intro',
    title: '촌장의 첫 부탁',
    targetNpcId: 'chief',
    objectiveType: 'talk',
    objectiveTarget: 'chief',
    description: '촌장에게 말을 걸어 첫 임무를 받자.',
    reminder: ['촌장이 널 찾고 있다.', '마을 한가운데 있는 촌장에게 먼저 말을 걸어봐.'],
    completionLines: ['좋아, 이제 모험을 시작할 때다.', '우선 필드의 첫 던전인 슬라임 동굴을 정리해다오.'],
    reward: { gold: 100, items: ['potion_hp'] }
  },
  {
    id: 'slime_cave_clear',
    title: '슬라임 동굴 정리',
    targetNpcId: 'chief',
    objectiveType: 'clearDungeon',
    objectiveTarget: 0,
    description: '필드의 슬라임 동굴을 클리어하고 촌장에게 보고하자.',
    reminder: ['슬라임 동굴이 아직 정리되지 않았다.', '필드의 첫 번째 포탈로 들어가 거대 슬라임을 쓰러뜨려라.'],
    completionLines: ['수고했다! 마을 사람들이 한숨 돌릴 수 있겠구나.', '이번엔 현자에게 가서 다음 지역에 대한 조언을 들어보거라.'],
    reward: { gold: 180, items: ['potion_hp2'] }
  },
  {
    id: 'sage_report',
    title: '현자의 조언',
    targetNpcId: 'sage',
    objectiveType: 'talk',
    objectiveTarget: 'sage',
    description: '현자와 대화해 다음 공략 목표를 듣자.',
    reminder: ['현자가 다음 여정을 준비하고 있다.', '마을 북서쪽의 현자에게 가보자.'],
    completionLines: ['좋다. 이제 고블린 소굴을 공략할 때다.', '활과 회복 아이템을 챙기고, 가능하면 동료도 편성해서 나가게.'],
    reward: { gold: 120, items: ['ring_def'] }
  },
  {
    id: 'goblin_den_clear',
    title: '고블린 왕 토벌',
    targetNpcId: 'sage',
    objectiveType: 'clearDungeon',
    objectiveTarget: 1,
    description: '고블린 소굴을 클리어하고 현자에게 보고하자.',
    reminder: ['고블린 소굴이 아직 남아 있다.', '두 번째 포탈로 들어가 고블린 왕을 처치해라.'],
    completionLines: ['훌륭하군. 이제부터는 진짜 원정대의 형태를 갖춰가게 될 거다.', '다음 던전부터는 더 강한 장비와 동료 조합을 의식해라.'],
    reward: { gold: 250, items: ['amulet1'] }
  }
];
const TOWN_UPGRADES = {
  forge: { id:'forge', icon:'⚔️', name:'훈련장', maxLevel:5, baseCost:120, costStep:120, bonusText:'+2 공격력 / +1 동료 공격' },
  guard: { id:'guard', icon:'🛡️', name:'방비대', maxLevel:5, baseCost:140, costStep:140, bonusText:'+1 방어력 / +10 동료 체력' },
  trade: { id:'trade', icon:'💰', name:'상단 계약', maxLevel:5, baseCost:160, costStep:160, bonusText:'+12% 골드 획득' },
  alchemy: { id:'alchemy', icon:'🧪', name:'연금 공방', maxLevel:5, baseCost:180, costStep:180, bonusText:'+15% 포션 효율 / 부활비 할인' },
};
function getVillageUpgradeLevel(id) {
  return villageUpgrades[id] || 0;
}

function getTotalVillageUpgradeLevel() {
  return (villageUpgrades.forge || 0) + (villageUpgrades.guard || 0) + (villageUpgrades.trade || 0) + (villageUpgrades.alchemy || 0);
}

function getVillageUpgradeCost(id) {
  const def = TOWN_UPGRADES[id];
  if (!def) return 999999;
  return def.baseCost + def.costStep * getVillageUpgradeLevel(id);
}

function getVillageAttackBonus() {
  return getVillageUpgradeLevel('forge') * 2;
}

function getVillageDefenseBonus() {
  return getVillageUpgradeLevel('guard');
}

function getVillageCompanionHpBonus() {
  return getVillageUpgradeLevel('guard') * 10;
}

function getVillageCompanionAtkBonus() {
  return getVillageUpgradeLevel('forge');
}

function getVillageGoldMultiplier() {
  return 1 + getVillageUpgradeLevel('trade') * 0.12;
}

function getVillagePotionMultiplier() {
  return 1 + getVillageUpgradeLevel('alchemy') * 0.15;
}

function getVillageReviveDiscount() {
  return Math.min(0.5, getVillageUpgradeLevel('alchemy') * 0.1);
}

function getReviveCost(cId) {
  const base = 50 + cId * 25;
  return Math.max(10, Math.floor(base * (1 - getVillageReviveDiscount())));
}

const SUBQUESTS = [
  {
    id: 'guard_patrol',
    npcId: 'guard',
    title: '경비병의 정찰 의뢰',
    objectiveType: 'killEnemies',
    targetAmount: 12,
    prereqMainQuestIndex: 1,
    description: '필드와 던전에서 적 12마리를 처치하고 경비병에게 보고하자.',
    offerLines: ['요즘 필드 주변이 더 시끄럽습니다.', '밖으로 나가 적 12마리만 정리해주시면 방비에 큰 도움이 됩니다.'],
    progressLines: ['정찰 임무는 아직 진행 중입니다.', '필드와 던전 어디서든 적을 처치하면 됩니다.'],
    completionLines: ['좋습니다. 경계선이 훨씬 조용해졌군요.', '이 보급품을 챙겨가십시오. 다음 원정에 도움이 될 겁니다.'],
    reward: { gold: 140, items: ['potion_hp2'] }
  },
  {
    id: 'sage_survey',
    npcId: 'sage',
    title: '현자의 탐사 기록',
    objectiveType: 'clearDungeonCount',
    targetAmount: 2,
    prereqMainQuestIndex: 2,
    description: '새로운 던전 2곳을 정리하고 현자에게 지도를 갱신받자.',
    offerLines: ['던전의 흐름을 더 정확히 알고 싶군.', '앞으로 2개의 던전을 더 정리해주면 내 기록을 보강해 주지.'],
    progressLines: ['기록은 아직 완성되지 않았네.', '새로운 던전을 더 정리하고 돌아오게.'],
    completionLines: ['좋군. 던전의 패턴이 훨씬 또렷해졌어.', '백광 수도승도 자네 원정대에 합류하겠다고 하더군.'],
    reward: { gold: 180, items: ['ring_atk'], companions: [9] }
  },
  {
    id: 'chief_companions',
    npcId: 'chief',
    title: '원정대 보강',
    objectiveType: 'companionCount',
    targetAmount: 3,
    prereqMainQuestIndex: 4,
    description: '동료를 3명 이상 확보해 촌장에게 원정대 구성을 보고하자.',
    offerLines: ['자네도 이제 제법 이름이 알려졌네.', '동료를 셋 이상 모아 진짜 원정대답게 꾸려보게.'],
    progressLines: ['원정대는 아직 부족하네.', '던전을 더 정리해서 믿을 만한 동료를 모아오게.'],
    completionLines: ['훌륭하군. 이제 마을도 자네를 정식 원정대로 인정할 걸세.', '새 장비 한 점 마련할 수 있도록 지원금을 주지.'],
    reward: { gold: 260, items: ['shield1'] }
  },
  {
    id: 'training_first_promotion',
    npcId: 'sage',
    title: '첫 승급 수련',
    objectiveType: 'classRank',
    targetAmount: 2,
    prereqMainQuestIndex: 4,
    description: '수련의 방에서 첫 승급을 완료하고 현자에게 수련 결과를 보고하자.',
    offerLines: ['이제 자네도 기초 단계를 넘길 때가 됐네.', '마을 수련의 방에서 첫 승급을 끝내고 다시 오게.'],
    progressLines: ['몸이 아직 덜 익었네.', 'Lv 6 이상이 되면 수련의 방에서 글라디에이터 승급을 확정할 수 있네.'],
    completionLines: ['좋아, 승급의 감각을 익혔군.', '이제부터는 클래스 변화가 전투 흐름을 더 크게 바꿔줄 걸세.'],
    reward: { gold: 220, items: ['helmet2'] }
  },
  {
    id: 'chief_synergy_squad',
    npcId: 'chief',
    title: '연계 전술 시험',
    objectiveType: 'activeSynergy',
    targetAmount: 1,
    prereqMainQuestIndex: 4,
    description: '시너지가 맞는 동료 2명을 함께 편성해 연계 전술을 증명하자.',
    offerLines: ['원정대는 숫자보다 조합이 중요하네.', '시너지가 나는 둘을 함께 묶어 진짜 전술팀을 보여주게.'],
    progressLines: ['아직 조합의 힘이 보이지 않는군.', '동료 패널에서 시너지 조합을 맞춰 출전시켜 보게.'],
    completionLines: ['좋아, 이게 바로 원정대다운 움직임일세.', '조합을 보는 눈이 생기면 전투가 훨씬 수월해질 걸세.'],
    reward: { gold: 240, items: ['potion_hp2', 'potion_hp2'] }
  },
  {
    id: 'guard_outpost_upgrade',
    npcId: 'guard',
    title: '전초기지 정비',
    objectiveType: 'villageUpgradeTotal',
    targetAmount: 3,
    prereqMainQuestIndex: 4,
    description: '마을 발전 시설을 합계 3단계 이상 강화해 방어 태세를 끌어올리자.',
    offerLines: ['마을도 이제 전초기지다운 모양을 갖춰야 합니다.', '시설 강화를 몇 번만 더 해주면 경계가 훨씬 안정될 겁니다.'],
    progressLines: ['아직 설비가 부족합니다.', '마을 발전 패널에서 시설을 더 강화하고 돌아와 주십시오.'],
    completionLines: ['훌륭합니다. 이제 외곽 경계선도 한결 든든해졌습니다.', '이 장비는 정비 지원 명목으로 드리겠습니다.'],
    reward: { gold: 230, items: ['boots2'] }
  }
];
function getMainQuest() {
  return MAIN_QUESTS[mainQuestIndex] || null;
}

function getCurrentMainQuest() {
  return getMainQuest();
}

function getQuestNpcById(id) {
  return TOWN_NPCS.find(npc => npc.id === id) || NPCS.find(npc => npc.id === id) || null;
}

function getQuestNpcName(id) {
  const npc = getQuestNpcById(id);
  return npc ? npc.name : '알 수 없음';
}

function getQuestOfferNpcId(quest) {
  if (!quest) return null;
  return quest.offerNpcId || quest.npcId || quest.targetNpcId || null;
}

function getQuestTurnInNpcId(quest) {
  if (!quest) return null;
  return quest.turnInNpcId || quest.npcId || quest.targetNpcId || null;
}

function getMainQuestStatus(quest) {
  if (!quest) return { label:'완료', ready:false };
  if (isMainQuestObjectiveMet(quest)) return { label:'완료 - 보고 필요', ready:true };
  if (quest.objectiveType === 'talk') return { label:'대화 필요', ready:false };
  if (quest.objectiveType === 'clearDungeon') return { label:'던전 공략 중', ready:false };
  if (quest.objectiveType === 'classRank') return { label:'승급 진행 중', ready:false };
  if (quest.objectiveType === 'activeSynergy') return { label:'조합 구성 중', ready:false };
  if (quest.objectiveType === 'villageUpgradeTotal') return { label:'마을 발전 중', ready:false };
  return { label:'진행 중', ready:false };
}

function getSubquestStatus(quest) {
  if (!quest) return { label:'알 수 없음', ready:false };
  if (isSubquestObjectiveMet(quest)) return { label:'완료 - 보고 필요', ready:true };
  return { label:'진행 중', ready:false };
}

function getAvailableSubquests() {
  return SUBQUESTS.filter(quest => isSubquestAvailable(quest) && !isSubquestAccepted(quest.id));
}

function getAcceptedSubquestsDetailed() {
  return acceptedSubquests.map(id => SUBQUESTS.find(quest => quest.id === id)).filter(Boolean).map(quest => {
    const status = getSubquestStatus(quest);
    return {
      quest,
      offerNpcName: getQuestNpcName(getQuestOfferNpcId(quest)),
      turnInNpcName: getQuestNpcName(getQuestTurnInNpcId(quest)),
      progressText: buildSubquestProgressText(quest),
      rewardText: buildQuestRewardText(quest),
      statusLabel: status.label,
      readyToTurnIn: status.ready,
    };
  });
}

function buildQuestRealtimeSnapshot() {
  const mainQuest = getMainQuest();
  const mainReady = mainQuest && isMainQuestObjectiveMet(mainQuest) ? '1' : '0';
  const subState = acceptedSubquests.map(id => {
    const quest = SUBQUESTS.find(q => q.id === id);
    if (!quest) return id + ':0';
    return id + ':' + (isSubquestObjectiveMet(quest) ? '1' : '0') + ':' + buildSubquestProgressText(quest);
  }).join('|');
  return [
    mainQuest ? mainQuest.id : 'none',
    mainReady,
    acceptedSubquests.slice().sort().join(','),
    completedSubquests.slice().sort().join(','),
    subState
  ].join('||');
}

function updateQuestRealtimeStatus() {
  const mainQuest = getMainQuest();
  if (mainQuest && isMainQuestObjectiveMet(mainQuest)) {
    if (questRealtimeNoticeState.mainReadyQuestId !== mainQuest.id) {
      questRealtimeNoticeState.mainReadyQuestId = mainQuest.id;
      if (typeof showToast === 'function') {
        showToast('메인 퀘스트 완료! ' + getQuestNpcName(getQuestTurnInNpcId(mainQuest)) + '에게 보고하세요');
      }
    }
  } else {
    questRealtimeNoticeState.mainReadyQuestId = null;
  }

  const activeAcceptedIds = new Set(acceptedSubquests);
  Object.keys(questRealtimeNoticeState.subReadyQuestIds).forEach(id => {
    if (!activeAcceptedIds.has(id)) delete questRealtimeNoticeState.subReadyQuestIds[id];
  });

  acceptedSubquests.forEach(id => {
    const quest = SUBQUESTS.find(q => q.id === id);
    if (!quest) return;
    if (isSubquestObjectiveMet(quest)) {
      if (!questRealtimeNoticeState.subReadyQuestIds[id]) {
        questRealtimeNoticeState.subReadyQuestIds[id] = true;
        if (typeof showToast === 'function') {
          showToast('서브 퀘스트 완료! ' + getQuestNpcName(getQuestTurnInNpcId(quest)) + '에게 보고하세요');
        }
      }
    } else {
      delete questRealtimeNoticeState.subReadyQuestIds[id];
    }
  });

  const snapshot = buildQuestRealtimeSnapshot();
  if (snapshot !== questRealtimeNoticeState.snapshot) {
    questRealtimeNoticeState.snapshot = snapshot;
    if (typeof questPanelOpen !== 'undefined' && questPanelOpen && typeof renderQuestPanel === 'function') {
      renderQuestPanel();
    }
  }
}

function isMainQuestObjectiveMet(quest, npcId) {
  if (!quest) return false;
  if (quest.objectiveType === 'talk') {
    return npcId === quest.objectiveTarget;
  }
  if (quest.objectiveType === 'clearDungeon') {
    return dungeonsCleared.includes(quest.objectiveTarget);
  }
  if (quest.objectiveType === 'classRank') {
    return player.classRank >= quest.objectiveTarget;
  }
  if (quest.objectiveType === 'activeSynergy') {
    return !!getActiveCompanionSynergy();
  }
  if (quest.objectiveType === 'villageUpgradeTotal') {
    return getTotalVillageUpgradeLevel() >= quest.objectiveTarget;
  }
  if (quest.objectiveType === 'companionCount') {
    return companions.length >= quest.objectiveTarget;
  }
  return false;
}

function unlockCompanion(cId, options = {}) {
  if (!isValidCompanionId(cId) || companions.includes(cId)) return false;
  companions.push(cId);
  if (!companionAIModes[cId]) companionAIModes[cId] = getDefaultCompanionAIMode(cId);
  if (!options.silent && typeof showToast === 'function') {
    showToast(getCompanionName(cId) + ' 합류!');
  }
  return true;
}

function buildQuestRewardText(quest) {
  if (!quest || !quest.reward) return '';
  const chunks = [];
  if (quest.reward.gold) chunks.push('💰 ' + quest.reward.gold + 'G');
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) chunks.push(ITEMS[id].icon + ' ' + ITEMS[id].name);
    });
  }
  if (Array.isArray(quest.reward.companions)) {
    quest.reward.companions.forEach(cId => {
      if (isValidCompanionId(cId)) chunks.push((getCompanionRoster(cId).portraitIcon || '★') + ' ' + getCompanionName(cId));
    });
  }
  return chunks.join(', ');
}

function grantMainQuestReward(quest) {
  if (!quest || !quest.reward) return;
  if (quest.reward.gold) player.gold += quest.reward.gold;
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) inventory.push(id);
    });
  }
  if (Array.isArray(quest.reward.companions)) {
    quest.reward.companions.forEach(cId => unlockCompanion(cId, { silent: true }));
  }
}

function tryCompleteMainQuest(npcId) {
  const quest = getMainQuest();
  if (!quest) return null;
  if (quest.targetNpcId !== npcId) return null;
  if (!isMainQuestObjectiveMet(quest, npcId)) return null;

  grantMainQuestReward(quest);
  completedMainQuests.push(quest.id);
  mainQuestIndex++;
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof autoSave === 'function') autoSave();
  return {
    quest,
    rewardText: buildQuestRewardText(quest),
    nextQuest: getMainQuest()
  };
}

function isSubquestAccepted(id) {
  return acceptedSubquests.includes(id);
}

function isSubquestCompleted(id) {
  return completedSubquests.includes(id);
}

function isSubquestAvailable(quest) {
  if (!quest) return false;
  if (isSubquestCompleted(quest.id)) return false;
  if (quest.prereqMainQuestIndex !== undefined && mainQuestIndex < quest.prereqMainQuestIndex) return false;
  return true;
}

function getNpcSubquest(npcId) {
  return SUBQUESTS.find(q => q.npcId === npcId && isSubquestAvailable(q)) || null;
}

function acceptSubquest(quest) {
  if (!quest || isSubquestAccepted(quest.id)) return;
  acceptedSubquests.push(quest.id);
  const progress = {};
  if (quest.objectiveType === 'killEnemies') progress.startKills = totalEnemiesKilled;
  if (quest.objectiveType === 'clearDungeonCount') progress.startDungeons = dungeonsCleared.length;
  if (quest.objectiveType === 'companionCount') progress.startCompanions = companions.length;
  subquestProgress[quest.id] = progress;
  if (typeof autoSave === 'function') autoSave();
}

function getSubquestProgressValue(quest) {
  const progress = subquestProgress[quest.id] || {};
  if (quest.objectiveType === 'killEnemies') return Math.max(0, totalEnemiesKilled - (progress.startKills || 0));
  if (quest.objectiveType === 'clearDungeonCount') return Math.max(0, dungeonsCleared.length - (progress.startDungeons || 0));
  if (quest.objectiveType === 'companionCount') return companions.length;
  if (quest.objectiveType === 'classRank') return player.classRank;
  if (quest.objectiveType === 'activeSynergy') return getActiveCompanionSynergy() ? 1 : 0;
  if (quest.objectiveType === 'villageUpgradeTotal') return getTotalVillageUpgradeLevel();
  return 0;
}

function isSubquestObjectiveMet(quest) {
  return getSubquestProgressValue(quest) >= (quest.targetAmount || 0);
}

function buildSubquestProgressText(quest) {
  const value = Math.min(getSubquestProgressValue(quest), quest.targetAmount || 0);
  if (quest.objectiveType === 'activeSynergy') {
    const synergy = getActiveCompanionSynergy();
    return synergy ? `1/1 (${synergy.name})` : '0/1';
  }
  return `${value}/${quest.targetAmount}`;
}

function grantSubquestReward(quest) {
  if (!quest || !quest.reward) return;
  if (quest.reward.gold) player.gold += quest.reward.gold;
  if (Array.isArray(quest.reward.items)) {
    quest.reward.items.forEach(id => {
      if (ITEMS[id]) inventory.push(id);
    });
  }
  if (Array.isArray(quest.reward.companions)) {
    quest.reward.companions.forEach(cId => unlockCompanion(cId, { silent: true }));
  }
}

function tryResolveSubquest(npcId) {
  const quest = getNpcSubquest(npcId);
  if (!quest) return null;

  if (!isSubquestAccepted(quest.id)) {
    acceptSubquest(quest);
    return {
      type: 'accepted',
      quest,
      rewardText: buildQuestRewardText(quest)
    };
  }

  if (!isSubquestObjectiveMet(quest)) {
    return {
      type: 'progress',
      quest,
      progressText: buildSubquestProgressText(quest)
    };
  }

  grantSubquestReward(quest);
  acceptedSubquests = acceptedSubquests.filter(id => id !== quest.id);
  completedSubquests.push(quest.id);
  delete subquestProgress[quest.id];
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof autoSave === 'function') autoSave();
  return {
    type: 'completed',
    quest,
    rewardText: buildQuestRewardText(quest)
  };
}

function getNpcInteractionLines(npc) {
  const quest = getMainQuest();
  const completion = tryCompleteMainQuest(npc.id);
  if (completion) {
    const lines = [`[메인 퀘스트 완료] ${completion.quest.title}`];
    (completion.quest.completionLines || []).forEach(line => lines.push(line));
    if (completion.rewardText) lines.push('보상: ' + completion.rewardText);
    if (completion.nextQuest) lines.push('[다음 목표] ' + completion.nextQuest.description);
    return lines;
  }

  if (quest && quest.targetNpcId === npc.id) {
    return [
      `[메인 퀘스트] ${quest.title}`,
      quest.description,
      ...((quest.reminder && quest.reminder.length) ? quest.reminder : [])
    ];
  }

  const subquestResult = tryResolveSubquest(npc.id);
  if (subquestResult) {
    if (subquestResult.type === 'accepted') {
      return [
        `[서브퀘스트 수락] ${subquestResult.quest.title}`,
        ...(subquestResult.quest.offerLines || []),
        subquestResult.quest.description,
        subquestResult.rewardText ? '보상: ' + subquestResult.rewardText : ''
      ].filter(Boolean);
    }
    if (subquestResult.type === 'progress') {
      return [
        `[서브퀘스트] ${subquestResult.quest.title}`,
        ...(subquestResult.quest.progressLines || []),
        '진행도: ' + subquestResult.progressText
      ].filter(Boolean);
    }
    if (subquestResult.type === 'completed') {
      return [
        `[서브퀘스트 완료] ${subquestResult.quest.title}`,
        ...(subquestResult.quest.completionLines || []),
        subquestResult.rewardText ? '보상: ' + subquestResult.rewardText : ''
      ].filter(Boolean);
    }
  }

  if (npc.id === 'guard' && quest) {
    return [
      '지금 목표를 잊지 마십시오.',
      quest.description,
      currentMap === 'town' ? '출구로 나가려면 동쪽이나 북쪽 길을 이용하면 됩니다.' : '필드에서는 포탈 위치를 미니맵으로 확인해보세요.'
    ];
  }

  return npc.dialogue;
}

function getEquipBonus() {
  let bonusAtk = 0, bonusDef = 0, speedBonus = 0, critBonus = 0, goldBonus = 0;
  const slots = EQUIP_SLOTS;
  slots.forEach(slot => {
    const id = equipped[slot];
    if (id && ITEMS[id]) {
      const item = ITEMS[id];
      bonusAtk += item.atk || 0;
      bonusDef += item.def || 0;
      if (item.speedBonus) speedBonus += item.speedBonus;
      if (item.critBonus) critBonus += item.critBonus;
      if (item.goldBonus) goldBonus += item.goldBonus;
    }
  });
  return { atk: bonusAtk, def: bonusDef, speedBonus, critBonus, goldBonus };
}

function playerAtk() {
  const synergy = getActiveCompanionSynergy();
  return player.atk + getEquipBonus().atk + getVillageAttackBonus() + (synergy && synergy.playerAtkBonus ? synergy.playerAtkBonus : 0);
}

function playerDef() {
  const synergy = getActiveCompanionSynergy();
  let d = player.def + getEquipBonus().def + getVillageDefenseBonus() + (synergy && synergy.playerDefBonus ? synergy.playerDefBonus : 0);
  Object.values(skillBuffs).forEach(b => {
    if (b.defBuff && b.timer > 0) d += b.defBuff;
  });
  return d;
}

function playerSpeed() {
  let s = player.speed + (getEquipBonus().speedBonus || 0);
  Object.values(skillBuffs).forEach(b => {
    if (b.speedBuff && b.timer > 0) s += b.speedBuff;
  });
  return s;
}

function showPickupText(name) {
  pickupTextContent = name + ' 획득!';
  pickupTextTimer = 90;
}


// ─── Enemy Spawning ──────────────────────────────────────────────────────────
