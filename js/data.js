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


// 성장 / 문장 / 스킬 관련 로직은 js/data-growth.js 로 분리됨.


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
// 퀘스트 관련 로직은 js/data-quests.js 로 분리됨.

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

// 퀘스트 관련 로직은 js/data-quests.js 로 분리됨.

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
