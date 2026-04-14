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

// 동료 데이터 / AI / 시너지 로직은 js/data-companions.js 로 분리됨.

// 성장 / 문장 / 스킬 관련 로직은 js/data-growth.js 로 분리됨.


// ─── Enemy Types ──────────────────────────────────────────────────────────────
const ENEMY_TYPES = [
  { name:'슬라임', color:'#27ae60', size:20, hp:30, atk:6, speed:0.5, xp:10, gold:3, aggroRange:150, attackRange:28, shape:'blob' },
  { name:'고블린', color:'#e67e22', size:22, hp:50, atk:12, speed:0.7, xp:20, gold:6, aggroRange:180, attackRange:30, shape:'goblin' },
  { name:'해골',   color:'#bdc3c7', size:22, hp:40, atk:10, speed:0.6, xp:15, gold:5, aggroRange:200, attackRange:28, shape:'skeleton' },
  { name:'오크',   color:'#8e44ad', size:26, hp:90, atk:18, speed:0.4, xp:35, gold:12, aggroRange:160, attackRange:35, shape:'brute' },
  { name:'다크나이트', color:'#2c3e50', size:28, hp:160, atk:28, speed:0.5, xp:60, gold:25, aggroRange:200, attackRange:38, shape:'knight' },
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

[
  { id:'weapon_t4', name:'기사의 검', type:'weapon', atk:40, def:4, price:260, color:'#95a5a6', icon:'⚔️', tierNumber:4 },
  { id:'weapon_t5', name:'로열 블레이드', type:'weapon', atk:70, def:6, price:520, color:'#d35400', icon:'⚔️', tierNumber:5 },
  { id:'weapon_t6', name:'시시리오 랜스', type:'weapon', atk:120, def:10, price:1100, color:'#9b59b6', icon:'🗡️', tierNumber:6 },
  { id:'weapon_t7', name:'황혼의 전쟁검', type:'weapon', atk:180, def:14, price:2100, color:'#8e44ad', icon:'⚔️', tierNumber:7 },
  { id:'weapon_t8', name:'엔트리아 성검', type:'weapon', atk:260, def:20, price:4200, color:'#f1c40f', icon:'⚔️', tierNumber:8, critBonus:4 },
  { id:'weapon_t9', name:'그랑 소드', type:'weapon', atk:360, def:26, price:8600, color:'#1abc9c', icon:'⚔️', tierNumber:9, critBonus:6 },
  { id:'weapon_t10', name:'그랜드 소드', type:'weapon', atk:520, def:34, price:16000, color:'#e74c3c', icon:'⚔️', tierNumber:10, critBonus:8 },
  { id:'armor_t4', name:'기사 갑옷', type:'armor', atk:0, def:28, price:260, color:'#7f8c8d', icon:'🧥', tierNumber:4 },
  { id:'armor_t5', name:'로열 플레이트', type:'armor', atk:6, def:46, price:560, color:'#5d6d7e', icon:'🛡️', tierNumber:5 },
  { id:'armor_t6', name:'시시리오 워메일', type:'armor', atk:10, def:70, price:1200, color:'#6c3483', icon:'🧥', tierNumber:6 },
  { id:'armor_t7', name:'용린 갑주', type:'armor', atk:14, def:96, price:2200, color:'#884ea0', icon:'🛡️', tierNumber:7 },
  { id:'armor_t8', name:'엔트리아 성갑', type:'armor', atk:18, def:132, price:4400, color:'#d4ac0d', icon:'🧥', tierNumber:8 },
  { id:'armor_t9', name:'그랑 아머', type:'armor', atk:22, def:170, price:9000, color:'#16a085', icon:'🛡️', tierNumber:9 },
  { id:'armor_t10', name:'그랜드 아머', type:'armor', atk:28, def:220, price:18000, color:'#c0392b', icon:'🧥', tierNumber:10 },
  { id:'helmet_t4', name:'기사 투구', type:'helmet', atk:0, def:14, price:180, color:'#95a5a6', icon:'⛑️', tierNumber:4 },
  { id:'helmet_t6', name:'시시리오 투구', type:'helmet', atk:4, def:26, price:900, color:'#8e44ad', icon:'⛑️', tierNumber:6 },
  { id:'helmet_t8', name:'엔트리아 관', type:'helmet', atk:10, def:40, price:3200, color:'#f1c40f', icon:'👑', tierNumber:8, critBonus:3 },
  { id:'helmet_t10', name:'그랜드 헬름', type:'helmet', atk:18, def:64, price:12000, color:'#e74c3c', icon:'👑', tierNumber:10, critBonus:5 },
  { id:'boots_t4', name:'기사 장화', type:'boots', atk:0, def:10, price:170, color:'#8b6914', icon:'👢', tierNumber:4, speedBonus:0.12 },
  { id:'boots_t6', name:'시시리오 장화', type:'boots', atk:2, def:18, price:850, color:'#7d3c98', icon:'👢', tierNumber:6, speedBonus:0.18 },
  { id:'boots_t8', name:'엔트리아 장화', type:'boots', atk:6, def:28, price:3000, color:'#d4ac0d', icon:'👢', tierNumber:8, speedBonus:0.24 },
  { id:'boots_t10', name:'그랜드 장화', type:'boots', atk:10, def:42, price:11000, color:'#c0392b', icon:'👢', tierNumber:10, speedBonus:0.32 },
  { id:'shield_t4', name:'기사 방패', type:'shield', atk:0, def:20, price:220, color:'#95a5a6', icon:'🛡️', tierNumber:4 },
  { id:'shield_t6', name:'시시리오 방패', type:'shield', atk:4, def:36, price:980, color:'#8e44ad', icon:'🛡️', tierNumber:6 },
  { id:'shield_t8', name:'엔트리아 방패', type:'shield', atk:8, def:56, price:3600, color:'#f1c40f', icon:'🛡️', tierNumber:8 },
  { id:'shield_t10', name:'그랜드 방패', type:'shield', atk:14, def:88, price:13000, color:'#e74c3c', icon:'🛡️', tierNumber:10 },
  { id:'ring_t5', name:'왕실 공격 반지', type:'accessory', atk:22, def:8, price:900, color:'#e67e22', icon:'💍', tierNumber:5 },
  { id:'ring_t7', name:'용맹의 문양 반지', type:'accessory', atk:38, def:14, price:2400, color:'#9b59b6', icon:'💍', tierNumber:7, critBonus:4 },
  { id:'ring_t9', name:'그랑 파워 링', type:'accessory', atk:56, def:22, price:9200, color:'#1abc9c', icon:'💍', tierNumber:9, critBonus:6 },
  { id:'amulet_t5', name:'수호 부적', type:'accessory', atk:10, def:24, price:900, color:'#3498db', icon:'📿', tierNumber:5 },
  { id:'amulet_t7', name:'황혼 성휘 부적', type:'accessory', atk:18, def:42, price:2600, color:'#8e44ad', icon:'📿', tierNumber:7 },
  { id:'amulet_t9', name:'그랜드 수호 부적', type:'accessory', atk:26, def:68, price:9800, color:'#16a085', icon:'📿', tierNumber:9, goldBonus:15 },
  { id:'potion_t6', name:'상급 치유 비약', type:'potion', atk:0, def:0, price:220, color:'#c0392b', icon:'🧪', tierNumber:6, heal:260 },
  { id:'potion_t8', name:'엔트리아 치유 영약', type:'potion', atk:0, def:0, price:520, color:'#8e44ad', icon:'🧪', tierNumber:8, heal:520 },
  { id:'potion_t10', name:'그랜드 회복 영약', type:'potion', atk:0, def:0, price:1100, color:'#e74c3c', icon:'🧪', tierNumber:10, heal:960 },
].forEach(item => { ITEMS[item.id] = item; });

const SHOP_PROGRESS_BANDS = {
  general: {
    1: ['potion_hp', 'potion_hp2'],
    2: ['potion_hp', 'potion_hp2', 'potion_t6'],
    3: ['potion_hp2', 'potion_t6', 'potion_t8'],
    4: ['potion_t6', 'potion_t8', 'potion_t10'],
    5: ['potion_t8', 'potion_t10'],
  },
  weapon: {
    1: ['sword1', 'sword2', 'dagger1', 'axe1', 'weapon_t4'],
    2: ['weapon_t4', 'weapon_t5'],
    3: ['weapon_t6', 'weapon_t7'],
    4: ['weapon_t8'],
    5: ['weapon_t9', 'weapon_t10'],
  },
  armor: {
    1: ['leather1', 'iron1', 'robe1', 'helmet1', 'helmet2', 'boots1', 'boots2', 'shield1', 'shield2'],
    2: ['armor_t4', 'armor_t5', 'helmet_t4', 'boots_t4', 'shield_t4'],
    3: ['armor_t6', 'armor_t7', 'helmet_t6', 'boots_t6', 'shield_t6'],
    4: ['armor_t8', 'helmet_t8', 'boots_t8', 'shield_t8'],
    5: ['armor_t9', 'armor_t10', 'helmet_t10', 'boots_t10', 'shield_t10'],
  },
  accessory: {
    1: ['ring_atk', 'ring_def', 'amulet1', 'event1'],
    2: ['ring_t5', 'amulet_t5', 'event1'],
    3: ['ring_t7', 'amulet_t7', 'event1'],
    4: ['ring_t7', 'amulet_t7', 'ring_t9'],
    5: ['ring_t9', 'amulet_t9', 'event1'],
  },
};

function getShopProgressBand() {
  const tier = player && (player.tier || player.classRank) || 1;
  if (tier >= 9) return 5;
  if (tier >= 8) return 4;
  if (tier >= 6) return 3;
  if (tier >= 4) return 2;
  return 1;
}

function getNpcShopItems(npc) {
  if (!npc) return [];
  const band = getShopProgressBand();
  const base = Array.isArray(npc.shopItems) ? npc.shopItems.slice() : [];
  const dynamic = SHOP_PROGRESS_BANDS[npc.id] || null;
  if (!dynamic) return base;
  const merged = [];
  for (let idx = 1; idx <= band; idx++) {
    (dynamic[idx] || []).forEach(itemId => {
      if (!merged.includes(itemId)) merged.push(itemId);
    });
  }
  return merged;
}

const DROP_TABLE = {
  0: [{ itemId:'dagger1', chance:0.08 }, { itemId:'potion_hp', chance:0.15 }],
  1: [{ itemId:'dagger1', chance:0.12 }, { itemId:'leather1', chance:0.06 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet1', chance:0.05 }, { itemId:'boots1', chance:0.05 }],
  2: [{ itemId:'sword1', chance:0.10 }, { itemId:'leather1', chance:0.08 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet1', chance:0.06 }, { itemId:'shield1', chance:0.04 }],
  3: [{ itemId:'sword2', chance:0.08 }, { itemId:'iron1', chance:0.05 }, { itemId:'axe1', chance:0.04 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet2', chance:0.04 }, { itemId:'boots2', chance:0.04 }, { itemId:'shield1', chance:0.05 }],
  4: [{ itemId:'axe1', chance:0.10 }, { itemId:'iron1', chance:0.08 }, { itemId:'robe1', chance:0.06 }, { itemId:'potion_hp', chance:0.15 }, { itemId:'helmet2', chance:0.05 }, { itemId:'boots2', chance:0.05 }, { itemId:'shield2', chance:0.04 }, { itemId:'event1', chance:0.02 }],
  5: [{ itemId:'axe1', chance:0.12 }, { itemId:'iron1', chance:0.10 }, { itemId:'ring_atk', chance:0.07 }, { itemId:'potion_hp2', chance:0.15 }, { itemId:'helmet2', chance:0.06 }, { itemId:'boots2', chance:0.06 }, { itemId:'shield2', chance:0.06 }, { itemId:'event1', chance:0.03 }],
  6: [{ itemId:'sword2', chance:0.08 }, { itemId:'iron1', chance:0.12 }, { itemId:'robe1', chance:0.08 }, { itemId:'ring_def', chance:0.08 }, { itemId:'potion_hp2', chance:0.18 }, { itemId:'helmet2', chance:0.07 }, { itemId:'shield2', chance:0.07 }, { itemId:'amulet1', chance:0.05 }, { itemId:'event1', chance:0.03 }],
  7: [{ itemId:'axe1', chance:0.12 }, { itemId:'iron1', chance:0.12 }, { itemId:'ring_atk', chance:0.08 }, { itemId:'ring_def', chance:0.08 }, { itemId:'potion_hp2', chance:0.20 }, { itemId:'helmet2', chance:0.07 }, { itemId:'boots2', chance:0.07 }, { itemId:'shield2', chance:0.08 }, { itemId:'amulet1', chance:0.06 }, { itemId:'event1', chance:0.05 }],
  8: [{ itemId:'axe1', chance:0.15 }, { itemId:'iron1', chance:0.15 }, { itemId:'robe1', chance:0.10 }, { itemId:'ring_atk', chance:0.10 }, { itemId:'ring_def', chance:0.10 }, { itemId:'potion_hp2', chance:0.25 }, { itemId:'helmet2', chance:0.08 }, { itemId:'boots2', chance:0.08 }, { itemId:'shield2', chance:0.10 }, { itemId:'amulet1', chance:0.08 }, { itemId:'event1', chance:0.08 }],
};

const DUNGEON_DROP_POOLS = {
  0: [{ itemId: 'weapon_t4', chance: 0.05 }, { itemId: 'armor_t4', chance: 0.05 }, { itemId: 'helmet_t4', chance: 0.04 }],
  1: [{ itemId: 'weapon_t4', chance: 0.06 }, { itemId: 'armor_t4', chance: 0.05 }, { itemId: 'ring_t5', chance: 0.03 }],
  2: [{ itemId: 'weapon_t5', chance: 0.06 }, { itemId: 'armor_t5', chance: 0.05 }, { itemId: 'amulet_t5', chance: 0.04 }],
  3: [{ itemId: 'weapon_t6', chance: 0.07 }, { itemId: 'armor_t6', chance: 0.06 }, { itemId: 'shield_t6', chance: 0.05 }],
  4: [{ itemId: 'weapon_t7', chance: 0.07 }, { itemId: 'armor_t7', chance: 0.06 }, { itemId: 'ring_t7', chance: 0.04 }],
  5: [{ itemId: 'weapon_t8', chance: 0.08 }, { itemId: 'armor_t8', chance: 0.07 }, { itemId: 'helmet_t8', chance: 0.05 }, { itemId: 'potion_t8', chance: 0.1 }],
  6: [{ itemId: 'weapon_t8', chance: 0.09 }, { itemId: 'shield_t8', chance: 0.07 }, { itemId: 'amulet_t7', chance: 0.05 }],
  7: [{ itemId: 'weapon_t9', chance: 0.09 }, { itemId: 'armor_t9', chance: 0.08 }, { itemId: 'ring_t9', chance: 0.06 }],
  8: [{ itemId: 'weapon_t10', chance: 0.1 }, { itemId: 'armor_t10', chance: 0.08 }, { itemId: 'helmet_t10', chance: 0.06 }, { itemId: 'amulet_t9', chance: 0.05 }, { itemId: 'potion_t10', chance: 0.12 }],
};

function getDungeonDropPool() {
  if (currentDungeonId === undefined || currentDungeonId === null || currentDungeonId < 0) return [];
  return DUNGEON_DROP_POOLS[currentDungeonId] || [];
}

function getDungeonRewardMultiplier() {
  const multipliers = [1, 1.5, 2.5, 4, 6, 10, 16, 30, 60];
  if (currentDungeonId === undefined || currentDungeonId === null || currentDungeonId < 0) return 1;
  return multipliers[currentDungeonId] || 1;
}

const EQUIP_SLOTS = ['weapon','armor','helmet','boots','accessory1','accessory2','shield','event'];

// Shop NPCs
const NPCS = [
  { id:'general',   name:'잡화점',   x: 9*40+20,  y: 8*40+20,  shopItems:['potion_hp','potion_hp2'], color:'#2ecc71', hat:'#27ae60' },
  { id:'weapon',    name:'무기점',   x: 12*40+20, y: 8*40+20,  shopItems:['sword1','sword2','dagger1','axe1'], color:'#e74c3c', hat:'#c0392b' },
  { id:'armor',     name:'방어구점', x: 9*40+20,  y: 11*40+20, shopItems:['leather1','iron1','robe1','helmet1','helmet2','boots1','boots2','shield1','shield2'], color:'#3498db', hat:'#2980b9' },
  { id:'accessory', name:'장신구점', x: 12*40+20, y: 11*40+20, shopItems:['ring_atk','ring_def','amulet1','event1'], color:'#f39c12', hat:'#e67e22' },
];

// 마을 / 시설 / 업그레이드 로직은 js/data-town.js 로 분리됨.

function getEquipBonus() {
  let bonusAtk = 0, bonusDef = 0, speedBonus = 0, critBonus = 0, goldBonus = 0;
  const slots = EQUIP_SLOTS;
  slots.forEach(slot => {
    const inst = equipped[slot];
    if (inst && ITEMS[inst.itemId]) {
      const item = ITEMS[inst.itemId];
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
