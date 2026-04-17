'use strict';

// Town NPCs (dialogue only)
const TOWN_NPCS = [
  { id:'chief', name:'촌장', x:10*40+20, y:10*40+20, color:'#e8d5b7', hat:'#8b4513',
    dialogue:['이 마을에 온 것을 환영합니다!','상점에서 장비를 구하고 밖으로 나가 모험을 시작하세요.','던전을 클리어하면 동료를 얻을 수 있습니다.'] },
  { id:'sage', name:'현자', x:7*40+20, y:12*40+20, color:'#ddd', hat:'#4a69bd',
    dialogue:['북쪽 숲 너머에 첫 번째 던전이 있다네...','9개의 던전을 모두 클리어하면 전설의 영웅들을 모을 수 있지.','각 던전의 보스는 점점 강해진다네. 준비를 철저히 하게.'] },
  { id:'guard', name:'경비병', x:14*40+20, y:14*40+20, color:'#95a5a6', hat:'#2c3e50',
    dialogue:['마을 밖은 위험합니다. 장비를 잘 챙기세요.','동쪽으로 가면 필드로 나갈 수 있습니다.','몬스터가 점점 강해지니 조심하십시오.'] },
  { id:'temple', name:'⛪ 신전', x:5*40+20, y:10*40+20, color:'#ffeaa7', hat:'#fdcb6e', isTemple:true,
    dialogue:['유령 상태의 지휘관과 동료를 이곳에서 부활시킬 수 있습니다.'] },
  { id:'training', name:'🏯 수련의 방', x:14*40+20, y:10*40+20, color:'#f8c471', hat:'#8e5a2b', isTrainingRoom:true,
    dialogue:['승급 자격이 생기면 이곳에서 클래스를 올릴 수 있습니다.'] },
  { id:'emblem_room', name:'🜂 문장의방', x:5*40+20, y:13*40+20, color:'#d6b3ff', hat:'#6c5ce7', isEmblemRoom:true,
    dialogue:['7단 Lv36과 병종 조건을 갖춘 자만 이곳의 시험에 도전할 수 있습니다.'] },
];

const TOWN_UPGRADES = {
  forge: { id:'forge', icon:'⚔️', name:'훈련장', maxLevel:5, baseCost:120, costStep:120, bonusText:'+2 공격력 / +1 동료 공격' },
  guard: { id:'guard', icon:'🛡️', name:'방비대', maxLevel:5, baseCost:140, costStep:140, bonusText:'+1 방어력 / +10 동료 체력' },
  trade: { id:'trade', icon:'💰', name:'상단 계약', maxLevel:5, baseCost:160, costStep:160, bonusText:'+12% 골드 획득' },
  alchemy: { id:'alchemy', icon:'🧪', name:'연금 공방', maxLevel:5, baseCost:180, costStep:180, bonusText:'+15% 포션 효율' },
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

function getReviveCost(characterId) {
  return getCharacterReviveCost(characterId);
}
