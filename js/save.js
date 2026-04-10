'use strict';

// ─── Auto-Save System ────────────────────────────────────────────────────────
let autoSaveTimer = 0;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

function autoSave() {
  try {
    const saveData = {
      player: {
        x: player.x, y: player.y,
        hp: player.hp, maxHp: player.maxHp,
        mp: player.mp, maxMp: player.maxMp,
        level: player.level, xp: player.xp, xpNext: player.xpNext,
        tier: player.tier,
        classLine: player.classLine, classRank: player.classRank, promotionPending: player.promotionPending, promotionBonusRankApplied: player.promotionBonusRankApplied,
        gold: player.gold, atk: player.atk, def: player.def, speed: player.speed, critChance: player.critChance,
      },
      inventory: inventory.slice(),
      equipped: { weapon: equipped.weapon, armor: equipped.armor, helmet: equipped.helmet, boots: equipped.boots, accessory1: equipped.accessory1, accessory2: equipped.accessory2, shield: equipped.shield, event: equipped.event },
      currentMap: currentMap,
      dungeonsCleared: dungeonsCleared.slice(),
      companions: companions.slice(),
      activeCompanions: activeCompanions.slice(),
      deadCompanions: deadCompanions.slice(),
      companionAIModes: { ...companionAIModes },
      totalGoldEarned: totalGoldEarned,
      totalEnemiesKilled: totalEnemiesKilled,
      currentDungeonId: currentDungeonId,
      mainQuestIndex: mainQuestIndex,
      completedMainQuests: completedMainQuests.slice(),
      villageUpgrades: { ...villageUpgrades },
      acceptedSubquests: acceptedSubquests.slice(),
      completedSubquests: completedSubquests.slice(),
      subquestProgress: JSON.parse(JSON.stringify(subquestProgress)),
    };
    localStorage.setItem('rpg_save_data', JSON.stringify(saveData));
  } catch(ex) {
    // localStorage may be unavailable
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem('rpg_save_data');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.player) return false;

    // Restore player
    const p = data.player;
    player.x = p.x || player.x;
    player.y = p.y || player.y;
    player.hp = p.hp || player.hp;
    player.maxHp = p.maxHp || player.maxHp;
    player.mp = p.mp || player.mp;
    player.maxMp = p.maxMp || player.maxMp;
    player.level = p.level || player.level;
    player.xp = p.xp || 0;
    player.gold = (p.gold !== undefined) ? p.gold : 0;
    player.tier = p.tier || 1;
    player.classLine = p.classLine || 'infantry';
    player.classRank = p.classRank || p.tier || getRankForLevel(player.classLine, player.level).rank;
    player.promotionPending = !!p.promotionPending;
    player.promotionBonusRankApplied = p.promotionBonusRankApplied || 1;
    player.xpNext = getXpToNextLevel(player.level);
    player.atk = p.atk || player.atk;
    player.def = p.def || player.def;
    player.speed = p.speed || player.speed;
    player.critChance = p.critChance !== undefined ? p.critChance : 10;
    if (p.promotionBonusRankApplied === undefined && player.classRank > 1) {
      applyPromotionBonus(getPromotionBonusDelta(player.classLine, 1, player.classRank));
      player.promotionBonusRankApplied = player.classRank;
    }
    syncPlayerGrowthState();

    // Restore inventory
    inventory.length = 0;
    if (Array.isArray(data.inventory)) {
      data.inventory.forEach(id => { if (ITEMS[id]) inventory.push(id); });
    }

    // Restore equipped (backward compatible with old 3-slot saves)
    if (data.equipped) {
      equipped.weapon = data.equipped.weapon || null;
      equipped.armor = data.equipped.armor || null;
      equipped.helmet = data.equipped.helmet || null;
      equipped.boots = data.equipped.boots || null;
      equipped.shield = data.equipped.shield || null;
      equipped.event = data.equipped.event || null;
      // Backward compat: old 'accessory' -> accessory1
      if (data.equipped.accessory1 !== undefined) {
        equipped.accessory1 = data.equipped.accessory1 || null;
        equipped.accessory2 = data.equipped.accessory2 || null;
      } else {
        equipped.accessory1 = data.equipped.accessory || null;
        equipped.accessory2 = null;
      }
    }

    // Restore map
    if (data.currentMap === 'town' || data.currentMap === 'field' || data.currentMap === 'dungeon') {
      currentMap = data.currentMap;
    }
    // Handle legacy 'overworld' save
    if (data.currentMap === 'overworld') {
      currentMap = 'town';
    }

    // Restore dungeons
    if (Array.isArray(data.dungeonsCleared)) {
      dungeonsCleared = data.dungeonsCleared.slice();
    }
    if (Array.isArray(data.companions)) {
      companions = data.companions.filter(isValidCompanionId);
    }
    // Support old single-companion saves
    if (Array.isArray(data.activeCompanions)) {
      activeCompanions = data.activeCompanions.filter(isValidCompanionId);
    } else if (data.activeCompanion !== undefined && data.activeCompanion !== null) {
      activeCompanions = isValidCompanionId(data.activeCompanion) ? [data.activeCompanion] : [];
    } else {
      activeCompanions = [];
    }
    deadCompanions = Array.isArray(data.deadCompanions) ? data.deadCompanions.filter(isValidCompanionId) : [];
    companionAIModes = data.companionAIModes && typeof data.companionAIModes === 'object' ? { ...data.companionAIModes } : {};
    companions.forEach(cId => {
      if (!companionAIModes[cId]) companionAIModes[cId] = getDefaultCompanionAIMode(cId);
    });
    activeCompanions.forEach(cId => initCompanionState(cId));

    totalGoldEarned = data.totalGoldEarned || 0;
    totalEnemiesKilled = data.totalEnemiesKilled || 0;
    currentDungeonId = data.currentDungeonId !== undefined ? data.currentDungeonId : -1;
    mainQuestIndex = data.mainQuestIndex !== undefined ? data.mainQuestIndex : 0;
    completedMainQuests = Array.isArray(data.completedMainQuests) ? data.completedMainQuests.slice() : [];
    if (data.villageUpgrades && typeof data.villageUpgrades === 'object') {
      villageUpgrades = {
        forge: data.villageUpgrades.forge || 0,
        guard: data.villageUpgrades.guard || 0,
        trade: data.villageUpgrades.trade || 0,
        alchemy: data.villageUpgrades.alchemy || 0,
      };
    }
    acceptedSubquests = Array.isArray(data.acceptedSubquests) ? data.acceptedSubquests.slice() : [];
    completedSubquests = Array.isArray(data.completedSubquests) ? data.completedSubquests.slice() : [];
    subquestProgress = data.subquestProgress && typeof data.subquestProgress === 'object' ? data.subquestProgress : {};

    // If saved in dungeon, rebuild it
    if (currentMap === 'dungeon' && currentDungeonId >= 0) {
      maps.dungeon = buildDungeon();
    }

    return true;
  } catch(ex) {
    return false;
  }
}

// Periodic auto-save in game loop
function tickAutoSave(dt) {
  autoSaveTimer += dt;
  if (autoSaveTimer >= AUTO_SAVE_INTERVAL) {
    autoSaveTimer = 0;
    autoSave();
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
// Load save data before spawning
