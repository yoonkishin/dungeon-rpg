'use strict';

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
    aiMode: getCompanionAIMode(cId),
    targetCache: null,
    targetCooldown: 0
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
