'use strict';

const DUNGEON_INFO = [
  { id:0, name:'슬라임 동굴',  portalX:25, portalY:45, bossName:'거대 슬라임',  bossColor:'#27ae60', bossHp:300,  bossAtk:20,  companionName:'슬라임 기사', companionColor:'#27ae60' },
  { id:1, name:'고블린 소굴',  portalX:55, portalY:50, bossName:'고블린 왕',    bossColor:'#e67e22', bossHp:500,  bossAtk:30,  companionName:'고블린 궁수', companionColor:'#e67e22' },
  { id:2, name:'해골 무덤',    portalX:12, portalY:35, bossName:'해골 군주',    bossColor:'#bdc3c7', bossHp:600,  bossAtk:35,  companionName:'해골 마법사', companionColor:'#bdc3c7' },
  { id:3, name:'오크 요새',    portalX:65, portalY:30, bossName:'오크 대장',    bossColor:'#8e44ad', bossHp:800,  bossAtk:45,  companionName:'오크 전사',  companionColor:'#8e44ad' },
  { id:4, name:'어둠의 숲',    portalX:10, portalY:15, bossName:'그림자 군주',   bossColor:'#2c3e50', bossHp:1000, bossAtk:55,  companionName:'그림자 암살자', companionColor:'#2c3e50' },
  { id:5, name:'용암 동굴',    portalX:50, portalY:20, bossName:'화염 골렘',    bossColor:'#e74c3c', bossHp:1200, bossAtk:65,  companionName:'화염 마도사', companionColor:'#e74c3c' },
  { id:6, name:'얼음 성채',    portalX:30, portalY:8,  bossName:'빙결 여왕',    bossColor:'#74b9ff', bossHp:1500, bossAtk:75,  companionName:'빙결 수호자', companionColor:'#74b9ff' },
  { id:7, name:'마왕의 탑',    portalX:70, portalY:10, bossName:'암흑 기사',    bossColor:'#636e72', bossHp:2000, bossAtk:90,  companionName:'암흑 성기사', companionColor:'#636e72' },
  { id:8, name:'최종 던전',    portalX:40, portalY:3,  bossName:'마왕',        bossColor:'#d63031', bossHp:3000, bossAtk:120, companionName:'성녀',       companionColor:'#ffeaa7' },
];

// ─── State ────────────────────────────────────────────────────────────────────
let currentMap = 'town';
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
let currentDungeonId = -1;
let companions = [];
let activeCompanions = [];  // array of companion IDs, max 2
let deadCompanions = [];    // IDs of dead companions

// Companion runtime states (keyed by companion ID)
let companionStates = {};

function initCompanionState(cId) {
  const maxHp = getCompanionMaxHp(cId);
  companionStates[cId] = {
    x: player.x + (Math.random() - 0.5) * 40,
    y: player.y + (Math.random() - 0.5) * 40,
    hp: maxHp,
    maxHp: maxHp,
    attackTimer: 0,
    flashTimer: 0
  };
}

function getCompanionMaxHp(cId) {
  return 80 + cId * 30;
}

function getCompanionAtk(cId) {
  return 10 + cId * 5;
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
  return player.atk + getEquipBonus().atk;
}

function playerDef() {
  let d = player.def + getEquipBonus().def;
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
let hudDirty = true;
let skillSlotsDirty = true;
let screenShake = { x:0, y:0, timer:0 };
let dayNight = 0;
let dayNightDir = 1;
let cameraX = 0, cameraY = 0;

// ─── Enemy Spawning ──────────────────────────────────────────────────────────
