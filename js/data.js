'use strict';

const DUNGEON_INFO = [
  { id:0, name:'슬라임 동굴',  portalX:25, portalY:45, bossName:'거대 슬라임',  bossColor:'#27ae60', bossHp:300,  bossAtk:20,  companionName:'슬라임 기사', companionColor:'#27ae60', recommendedLevel:1,  zone:'초원 입구', layoutHint:'개방형 동굴', bossSkillType:'slam', bossSkillName:'점액 낙하', bossSkillColor:'#2ecc71' },
  { id:1, name:'고블린 소굴',  portalX:55, portalY:50, bossName:'고블린 왕',    bossColor:'#e67e22', bossHp:500,  bossAtk:30,  companionName:'고블린 궁수', companionColor:'#e67e22', recommendedLevel:3,  zone:'동쪽 야영지', layoutHint:'갈림길 굴', bossSkillType:'bolt', bossSkillName:'왕의 화살', bossSkillColor:'#f39c12' },
  { id:2, name:'해골 무덤',    portalX:12, portalY:35, bossName:'해골 군주',    bossColor:'#bdc3c7', bossHp:600,  bossAtk:35,  companionName:'해골 마법사', companionColor:'#bdc3c7', recommendedLevel:5,  zone:'폐허 묘지', layoutHint:'묘지 복도형', bossSkillType:'nova', bossSkillName:'망자의 파동', bossSkillColor:'#ecf0f1' },
  { id:3, name:'오크 요새',    portalX:65, portalY:30, bossName:'오크 대장',    bossColor:'#8e44ad', bossHp:800,  bossAtk:45,  companionName:'오크 전사',  companionColor:'#8e44ad', recommendedLevel:7,  zone:'북부 요새길', layoutHint:'요새 십자형', bossSkillType:'charge', bossSkillName:'전쟁 돌진', bossSkillColor:'#9b59b6' },
  { id:4, name:'어둠의 숲',    portalX:10, portalY:15, bossName:'그림자 군주',   bossColor:'#2c3e50', bossHp:1000, bossAtk:55,  companionName:'그림자 암살자', companionColor:'#2c3e50', recommendedLevel:10, zone:'그늘 숲', layoutHint:'미궁 숲길', bossSkillType:'bolt', bossSkillName:'그림자 창', bossSkillColor:'#34495e' },
  { id:5, name:'용암 동굴',    portalX:50, portalY:20, bossName:'화염 골렘',    bossColor:'#e74c3c', bossHp:1200, bossAtk:65,  companionName:'화염 마도사', companionColor:'#e74c3c', recommendedLevel:13, zone:'화산 협곡', layoutHint:'용암 균열형', bossSkillType:'nova', bossSkillName:'화염 폭발', bossSkillColor:'#ff6b6b' },
  { id:6, name:'얼음 성채',    portalX:30, portalY:8,  bossName:'빙결 여왕',    bossColor:'#74b9ff', bossHp:1500, bossAtk:75,  companionName:'빙결 수호자', companionColor:'#74b9ff', recommendedLevel:16, zone:'빙설 고원', layoutHint:'빙결 회랑', bossSkillType:'bolt', bossSkillName:'빙결 파편', bossSkillColor:'#74b9ff' },
  { id:7, name:'마왕의 탑',    portalX:70, portalY:10, bossName:'암흑 기사',    bossColor:'#636e72', bossHp:2000, bossAtk:90,  companionName:'암흑 성기사', companionColor:'#636e72', recommendedLevel:20, zone:'검은 탑', layoutHint:'탑의 3차선', bossSkillType:'charge', bossSkillName:'암흑 돌격', bossSkillColor:'#95a5a6' },
  { id:8, name:'최종 던전',    portalX:40, portalY:3,  bossName:'마왕',        bossColor:'#d63031', bossHp:3000, bossAtk:120, companionName:'성녀',       companionColor:'#ffeaa7', recommendedLevel:24, zone:'심연의 문', layoutHint:'최종 제단', bossSkillType:'nova', bossSkillName:'파멸진', bossSkillColor:'#ff7675' },
];

const COMPANION_PROFILES = {
  0: { roleKey:'tank', roleLabel:'탱커', attackRange:50, preferredRange:34, attackCooldown:980, skillId:'slime_guard', skillName:'점액 방패', skillCooldown:5200, desc:'전방에서 적을 붙잡고 범위 경직을 준다.' },
  1: { roleKey:'ranger', roleLabel:'원거리', attackRange:128, preferredRange:92, attackCooldown:1080, skillId:'arrow_barrage', skillName:'연발 사격', skillCooldown:4800, desc:'멀리서 적 둘을 동시에 압박한다.' },
  2: { roleKey:'caster', roleLabel:'마법', attackRange:118, preferredRange:86, attackCooldown:1200, skillId:'bone_nova', skillName:'망령 폭발', skillCooldown:5600, desc:'적 무리를 광역으로 타격한다.' },
  3: { roleKey:'bruiser', roleLabel:'브루저', attackRange:56, preferredRange:40, attackCooldown:960, skillId:'war_cleave', skillName:'전투 강타', skillCooldown:4300, desc:'근거리 적들을 시원하게 쓸어버린다.' },
  4: { roleKey:'assassin', roleLabel:'암살', attackRange:60, preferredRange:42, attackCooldown:820, skillId:'shadow_strike', skillName:'암영 참격', skillCooldown:5000, desc:'체력이 낮은 적을 빠르게 마무리한다.' },
  5: { roleKey:'mage', roleLabel:'화염술사', attackRange:132, preferredRange:94, attackCooldown:1220, skillId:'flame_burst', skillName:'화염 난사', skillCooldown:5200, desc:'원거리 폭발로 적 무리를 태운다.' },
  6: { roleKey:'guardian', roleLabel:'수호', attackRange:62, preferredRange:46, attackCooldown:1040, skillId:'frost_lock', skillName:'빙결 봉쇄', skillCooldown:5400, desc:'빙결 일격으로 적을 오래 묶는다.' },
  7: { roleKey:'paladin', roleLabel:'성기사', attackRange:64, preferredRange:48, attackCooldown:980, skillId:'dark_aegis', skillName:'암흑 수호', skillCooldown:6200, desc:'위험한 순간 아군을 보호하며 반격한다.' },
  8: { roleKey:'support', roleLabel:'성녀', attackRange:96, preferredRange:84, attackCooldown:1300, skillId:'holy_prayer', skillName:'성역 기도', skillCooldown:5400, desc:'플레이어와 동료를 치유하며 전선을 유지한다.' },
};

const COMPANION_SYNERGIES = {
  '0-8': { name:'수호 성역', desc:'방어 +2, 회복량 +15%', playerDefBonus:2, healMult:1.15 },
  '1-4': { name:'암영 사냥', desc:'동료 공격 +3, 공격 주기 18% 개선', companionAtkBonus:3, cooldownMult:0.82 },
  '2-5': { name:'비전 공명', desc:'마법 동료 피해 +4', companionAtkBonus:4 },
  '3-6': { name:'전선 유지', desc:'플레이어 공격 +2, 방어 +1', playerAtkBonus:2, playerDefBonus:1 },
  '7-8': { name:'성흑 균형', desc:'회복량 +20%, 동료 체력 +20', healMult:1.2, companionHpBonus:20 },
};

// ─── State ────────────────────────────────────────────────────────────────────
let currentMap = 'town';
let currentDungeonId = -1;
let maps = {
  town: buildTown(),
  field: buildField(),
  dungeon: buildDungeon()
};

function getMap() { return maps[currentMap]; }
function mapW() {
  if (currentMap === 'town') return OW_W;
  if (currentMap === 'field') return FIELD_W;
  return DG_W;
}
function mapH() {
  if (currentMap === 'town') return OW_H;
  if (currentMap === 'field') return FIELD_H;
  return DG_H;
}

// ─── Player ───────────────────────────────────────────────────────────────────
const player = {
  x: 10 * TILE + TILE/2,
  y: 15 * TILE + TILE/2,
  w: 28, h: 28,
  speed: 1.5,
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  level: 1,
  xp: 0, xpNext: 30,
  gold: 5000,
  tier: 1,
  atk: 15,
  def: 3,
  dir: 0,
  frame: 0,
  frameTimer: 0,
  attackTimer: 0,
  attackCooldown: 600,
  isAttacking: false,
  attackAngle: 0,
  attackArc: 0,
  invincible: 0,
  dead: false,
  vx: 0, vy: 0,
  critChance: 10,
};

// ─── Dungeon & Companion State ────────────────────────────────────────────────
let dungeonsCleared = [];
let companions = [];
let activeCompanions = [];  // array of companion IDs, max 2
let deadCompanions = [];    // IDs of dead companions

// Companion runtime states (keyed by companion ID)
let companionStates = {};
let companionAIModes = {};

const COMPANION_AI_MODES = {
  aggressive: { key:'aggressive', label:'공격적', color:'#e74c3c' },
  defensive: { key:'defensive', label:'방어적', color:'#3498db' },
  support: { key:'support', label:'서포트', color:'#2ecc71' },
};

function getCompanionProfile(cId) {
  return COMPANION_PROFILES[cId] || COMPANION_PROFILES[0];
}

function normalizeCompanionAIMode(mode) {
  return COMPANION_AI_MODES[mode] ? mode : 'aggressive';
}

function getDefaultCompanionAIMode(cId) {
  const roleKey = getCompanionProfile(cId).roleKey;
  if (roleKey === 'support') return 'support';
  if (roleKey === 'tank' || roleKey === 'guardian' || roleKey === 'paladin') return 'defensive';
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
  const key = activeCompanions.slice().sort((a, b) => a - b).join('-');
  return COMPANION_SYNERGIES[key] || null;
}

function getHealingMultiplier() {
  const synergy = getActiveCompanionSynergy();
  return getVillagePotionMultiplier() * (synergy && synergy.healMult ? synergy.healMult : 1);
}

function initCompanionState(cId) {
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
  return getCompanionProfile(cId).attackRange;
}

function getCompanionPreferredRange(cId) {
  return getCompanionProfile(cId).preferredRange;
}

function getCompanionAttackCooldown(cId, state) {
  const profile = getCompanionProfile(cId);
  const synergy = getActiveCompanionSynergy();
  const mode = getCompanionAIMode(cId, state);
  let modeMult = 1;
  if (mode === 'aggressive') modeMult = 0.88;
  else if (mode === 'defensive') modeMult = 1.06;
  else if (mode === 'support') modeMult = 1.12;
  return Math.floor(profile.attackCooldown * (synergy && synergy.cooldownMult ? synergy.cooldownMult : 1) * modeMult);
}


// Stats tracking
let totalGoldEarned = 0;
let totalEnemiesKilled = 0;

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

// ─── Class Tier System ───────────────────────────────────────────────────────
const CLASS_TIERS = [
  { tier:1, name:'수련생',      reqLevel:1,  color:'#bdc3c7', bodyColor:'#8e8e8e' },
  { tier:2, name:'모험가',      reqLevel:6,  color:'#3498db', bodyColor:'#2980b9' },
  { tier:3, name:'전사',        reqLevel:11, color:'#2ecc71', bodyColor:'#27ae60' },
  { tier:4, name:'정예 전사',   reqLevel:16, color:'#e74c3c', bodyColor:'#c0392b' },
  { tier:5, name:'영웅',        reqLevel:21, color:'#f1c40f', bodyColor:'#f39c12' },
  { tier:6, name:'전설의 영웅', reqLevel:26, color:'#9b59b6', bodyColor:'#8e44ad' },
  { tier:7, name:'신화 영웅',   reqLevel:31, color:'#e74c3c', bodyColor:'#ff6b6b' },
];

function getCurrentTier() {
  let t = CLASS_TIERS[0];
  for (const tier of CLASS_TIERS) {
    if (player.level >= tier.reqLevel) t = tier;
  }
  return t;
}

function getNextTier() {
  for (const tier of CLASS_TIERS) {
    if (tier.reqLevel > player.level) return tier;
  }
  return null;
}

const skillPages = [
  ['fireball', 'heal', 'slash', 'shield'],
  ['poison', 'sprint', 'thunder', 'drain'],
  [null, null, null, null],
];
let currentSkillPage = 0;
const skillCooldowns = {};
const skillBuffs = {};

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

const inventory = [];
const equipped = { weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null, shield: null, event: null };
const EQUIP_SLOTS = ['weapon','armor','helmet','boots','accessory1','accessory2','shield','event'];
let droppedItems = [];

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
];
let npcDialogueIdx = {};

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
let mainQuestIndex = 0;
let completedMainQuests = [];

const TOWN_UPGRADES = {
  forge: { id:'forge', icon:'⚔️', name:'훈련장', maxLevel:5, baseCost:120, costStep:120, bonusText:'+2 공격력 / +1 동료 공격' },
  guard: { id:'guard', icon:'🛡️', name:'방비대', maxLevel:5, baseCost:140, costStep:140, bonusText:'+1 방어력 / +10 동료 체력' },
  trade: { id:'trade', icon:'💰', name:'상단 계약', maxLevel:5, baseCost:160, costStep:160, bonusText:'+12% 골드 획득' },
  alchemy: { id:'alchemy', icon:'🧪', name:'연금 공방', maxLevel:5, baseCost:180, costStep:180, bonusText:'+15% 포션 효율 / 부활비 할인' },
};
let villageUpgrades = { forge: 0, guard: 0, trade: 0, alchemy: 0 };

function getVillageUpgradeLevel(id) {
  return villageUpgrades[id] || 0;
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
    completionLines: ['좋군. 던전의 패턴이 훨씬 또렷해졌어.', '이제 더 깊은 곳도 대비할 수 있겠네.'],
    reward: { gold: 180, items: ['ring_atk'] }
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
  }
];
let acceptedSubquests = [];
let completedSubquests = [];
let subquestProgress = {};

function getMainQuest() {
  return MAIN_QUESTS[mainQuestIndex] || null;
}

function isMainQuestObjectiveMet(quest, npcId) {
  if (!quest) return false;
  if (quest.objectiveType === 'talk') {
    return npcId === quest.objectiveTarget;
  }
  if (quest.objectiveType === 'clearDungeon') {
    return dungeonsCleared.includes(quest.objectiveTarget);
  }
  return false;
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
  return 0;
}

function isSubquestObjectiveMet(quest) {
  return getSubquestProgressValue(quest) >= (quest.targetAmount || 0);
}

function buildSubquestProgressText(quest) {
  const value = Math.min(getSubquestProgressValue(quest), quest.targetAmount || 0);
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

let pickupTextTimer = 0;
let pickupTextContent = '';
function showPickupText(name) {
  pickupTextContent = name + ' 획득!';
  pickupTextTimer = 90;
}

let enemies = [];
let particles = [];
let damageNumbers = [];
let enemyEffects = [];
let hudDirty = true;
let skillSlotsDirty = true;
let screenShake = { x:0, y:0, timer:0 };
let dayNight = 0;
let dayNightDir = 1;
let cameraX = 0, cameraY = 0;

// ─── Enemy Spawning ──────────────────────────────────────────────────────────
