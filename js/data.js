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

// 마을 / 시설 / 업그레이드 로직은 js/data-town.js 로 분리됨.

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
