'use strict';

// ─── Auto-Save System ────────────────────────────────────────────────────────
const SAVE_KEY = 'rpg_save_data';
let autoSaveTimer = 0;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// Persisted player scalar fields — single source of truth for save AND load.
// Value = fallback used on load when the save lacks the field. PLAYER_KEEP
// means "retain whatever state.js set as the current default". Fields that
// need real migrations (classRank, xpNext, emblemIds, etc.) stay special-cased
// in loadPlayerState() below.
const PLAYER_KEEP = Symbol('keep');
const PERSISTED_PLAYER_SCALARS = {
  x: PLAYER_KEEP,
  y: PLAYER_KEEP,
  hp: PLAYER_KEEP,
  maxHp: PLAYER_KEEP,
  mp: PLAYER_KEEP,
  maxMp: PLAYER_KEEP,
  level: PLAYER_KEEP,
  xp: 0,
  gold: 0,
  tier: 1,
  atk: PLAYER_KEEP,
  def: PLAYER_KEEP,
  speed: PLAYER_KEEP,
  critChance: 10,
  classLine: 'infantry',
  promotionPending: false,
  promotionBonusRankApplied: 1,
};
const PERSISTED_PLAYER_ARRAY_KEYS = [
  'classHistory',
  'emblemIds',
  'appliedEmblemBonusIds',
  'emblemFusionHistory',
];

function serializePlayer() {
  const out = {};
  for (const k of Object.keys(PERSISTED_PLAYER_SCALARS)) out[k] = player[k];
  // Special-cased scalars (migration-dependent) still flow through save.
  out.classRank = player.classRank;
  out.currentClassKey = player.currentClassKey;
  out.xpNext = player.xpNext;
  for (const k of PERSISTED_PLAYER_ARRAY_KEYS) {
    out[k] = Array.isArray(player[k]) ? player[k].slice() : [];
  }
  // Nullable singleton — preserve explicit null when absent/falsy.
  out.masterEmblemId = player.masterEmblemId || null;
  return out;
}

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function readValue(obj, key, fallback) {
  return hasOwn(obj, key) ? obj[key] : fallback;
}

function loadPlayerScalars(p) {
  for (const [k, fallback] of Object.entries(PERSISTED_PLAYER_SCALARS)) {
    if (hasOwn(p, k)) {
      player[k] = p[k];
    } else if (fallback !== PLAYER_KEEP) {
      player[k] = fallback;
    }
  }
}

function autoSave() {
  try {
    const saveData = {
      player: serializePlayer(),
      inventory: inventory.map(e => ({ uid: e.uid, itemId: e.itemId })),
      nextItemUid: nextItemUid,
      equipped: Object.fromEntries(EQUIP_SLOTS.map(s => [s, equipped[s] ? { uid: equipped[s].uid, itemId: equipped[s].itemId } : null])),
      currentMap: currentMap,
      dungeonsCleared: dungeonsCleared.slice(),
      companions: companions.slice(),
      activeCompanions: activeCompanions.slice(),
      deadCompanions: deadCompanions.slice(),
      companionAIModes: { ...companionAIModes },
      totalGoldEarned: totalGoldEarned,
      totalEnemiesKilled: totalEnemiesKilled,
      currentDungeonId: currentDungeonId,
      fieldSeed: fieldSeed,
      currentEmblemTrial: currentEmblemTrial ? { ...currentEmblemTrial } : null,
      mainQuestIndex: mainQuestIndex,
      completedMainQuests: completedMainQuests.slice(),
      villageUpgrades: { ...villageUpgrades },
      acceptedSubquests: acceptedSubquests.slice(),
      completedSubquests: completedSubquests.slice(),
      subquestProgress: JSON.parse(JSON.stringify(subquestProgress)),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch(ex) {
    // localStorage may be unavailable
  }
}

function loadPlayerState(p) {
  loadPlayerScalars(p);
  // Special-cased: migrations / computed fallbacks.
  player.classRank = hasOwn(p, 'classRank') ? p.classRank : (hasOwn(p, 'tier') ? p.tier : getRankForLevel(player.classLine, player.level).rank);
  player.currentClassKey = readValue(p, 'currentClassKey', `${player.classLine}_rank${player.classRank}`);
  player.classHistory = Array.isArray(p.classHistory) && p.classHistory.length ? p.classHistory.slice() : [player.currentClassKey];
  player.emblemIds = Array.isArray(p.emblemIds) ? p.emblemIds.filter(id => !!getEmblemDef(id)) : [];
  player.appliedEmblemBonusIds = Array.isArray(p.appliedEmblemBonusIds) ? p.appliedEmblemBonusIds.filter(id => !!getEmblemDef(id)) : [];
  player.masterEmblemId = p.masterEmblemId && getEmblemDef(p.masterEmblemId) ? p.masterEmblemId : null;
  player.emblemFusionHistory = Array.isArray(p.emblemFusionHistory) ? p.emblemFusionHistory.slice() : [];
  player.promotionPending = !!player.promotionPending;
  player.xpNext = getXpToNextLevel(player.level, player.tier || player.classRank || 1);
  if (p.promotionBonusRankApplied === undefined && player.classRank > 1) {
    applyPromotionBonus(getPromotionBonusDelta(player.classLine, 1, player.classRank));
    player.promotionBonusRankApplied = player.classRank;
  }
  if (typeof ensurePlayerEmblemBonusesApplied === 'function') ensurePlayerEmblemBonusesApplied();
  syncPlayerGrowthState();
}

function loadInventoryState(data) {
  inventory.length = 0;
  let maxUid = 0;
  if (Array.isArray(data.inventory)) {
    data.inventory.forEach(entry => {
      if (typeof entry === 'string') {
        if (ITEMS[entry]) inventory.push({ uid: ++maxUid, itemId: entry });
      } else if (entry && entry.itemId && ITEMS[entry.itemId]) {
        const uid = entry.uid || ++maxUid;
        inventory.push({ uid: uid, itemId: entry.itemId });
        if (uid > maxUid) maxUid = uid;
      }
    });
  }
  nextItemUid = (data.nextItemUid && data.nextItemUid > maxUid) ? data.nextItemUid : maxUid + 1;

  if (data.equipped) {
    const loadSlot = (val) => {
      if (!val) return null;
      if (typeof val === 'string') return ITEMS[val] ? { uid: nextItemUid++, itemId: val } : null;
      if (val.itemId && ITEMS[val.itemId]) return { uid: val.uid || nextItemUid++, itemId: val.itemId };
      return null;
    };
    equipped.weapon = loadSlot(readValue(data.equipped, 'weapon', null));
    equipped.armor = loadSlot(readValue(data.equipped, 'armor', null));
    equipped.helmet = loadSlot(readValue(data.equipped, 'helmet', null));
    equipped.boots = loadSlot(readValue(data.equipped, 'boots', null));
    equipped.shield = loadSlot(readValue(data.equipped, 'shield', null));
    equipped.event = loadSlot(readValue(data.equipped, 'event', null));
    if (hasOwn(data.equipped, 'accessory1')) {
      equipped.accessory1 = loadSlot(readValue(data.equipped, 'accessory1', null));
      equipped.accessory2 = loadSlot(readValue(data.equipped, 'accessory2', null));
    } else {
      equipped.accessory1 = loadSlot(readValue(data.equipped, 'accessory', null));
      equipped.accessory2 = null;
    }
  }
}

function loadCompanionState(data) {
  if (Array.isArray(data.dungeonsCleared)) dungeonsCleared = data.dungeonsCleared.slice();
  if (Array.isArray(data.companions)) companions = data.companions.filter(isValidCompanionId);
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
  activeCompanions = activeCompanions.filter(cId => !deadCompanions.includes(cId));
  companionStates = {};
  activeCompanions.forEach(cId => initCompanionState(cId));
}

function loadQuestState(data) {
  totalGoldEarned = readValue(data, 'totalGoldEarned', 0);
  totalEnemiesKilled = readValue(data, 'totalEnemiesKilled', 0);
  currentDungeonId = data.currentDungeonId !== undefined ? data.currentDungeonId : -1;
  currentEmblemTrial = data.currentEmblemTrial && data.currentEmblemTrial.emblemId && getEmblemDef(data.currentEmblemTrial.emblemId)
    ? { emblemId: data.currentEmblemTrial.emblemId }
    : null;
  mainQuestIndex = data.mainQuestIndex !== undefined ? data.mainQuestIndex : 0;
  completedMainQuests = Array.isArray(data.completedMainQuests) ? data.completedMainQuests.slice() : [];
  if (data.villageUpgrades && typeof data.villageUpgrades === 'object') {
    villageUpgrades = {
      forge: readValue(data.villageUpgrades, 'forge', 0),
      guard: readValue(data.villageUpgrades, 'guard', 0),
      trade: readValue(data.villageUpgrades, 'trade', 0),
      alchemy: readValue(data.villageUpgrades, 'alchemy', 0),
    };
  }
  acceptedSubquests = Array.isArray(data.acceptedSubquests) ? data.acceptedSubquests.slice() : [];
  completedSubquests = Array.isArray(data.completedSubquests) ? data.completedSubquests.slice() : [];
  subquestProgress = data.subquestProgress && typeof data.subquestProgress === 'object' ? data.subquestProgress : {};
}

function loadMapState(data) {
  if (data.currentMap === 'town' || data.currentMap === 'field' || data.currentMap === 'dungeon') {
    currentMap = data.currentMap;
  }
  if (data.currentMap === 'overworld') currentMap = 'town';

  if (data.fieldSeed !== undefined) {
    maps.field = buildField(data.fieldSeed);
  }

  // Emblem trial resume policy: treat as transient, return to town on reload.
  // Must run BEFORE the generic dungeon resume branch so corrupted saves that
  // carry both a stale dungeon id and an active trial still route to the
  // trial exit spawn instead of the dungeon portal.
  if (currentMap === 'dungeon' && currentEmblemTrial) {
    currentMap = 'town';
    currentEmblemTrial = null;
    player.x = EMBLEM_TRIAL_EXIT_SPAWN.x;
    player.y = EMBLEM_TRIAL_EXIT_SPAWN.y;
  }

  // Dungeon resume policy: disallow resume, safely return to field
  if (currentMap === 'dungeon' && currentDungeonId >= 0) {
    const info = DUNGEON_INFO[currentDungeonId];
    currentMap = 'field';
    if (info) {
      player.x = info.portalX * TILE + TILE / 2;
      player.y = (info.portalY + 1) * TILE + TILE / 2;
    } else {
      player.x = 40 * TILE;
      player.y = (FIELD_H - 3) * TILE + TILE / 2;
    }
    activeCompanions.forEach(cId => {
      if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
    });
    activeCompanions = [];
    companionStates = {};
    currentDungeonId = -1;
  }

  // Normalize: a non-dungeon map must not retain a dungeon id or an active
  // emblem trial. Clears leftover flags from already-corrupted saves so they
  // don't keep re-persisting.
  if (currentMap !== 'dungeon') {
    currentDungeonId = -1;
    currentEmblemTrial = null;
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.player) return false;

    loadPlayerState(data.player);
    loadInventoryState(data);
    loadCompanionState(data);
    loadQuestState(data);
    loadMapState(data);

    // Flush normalized state so corrupted blobs don't linger on disk.
    autoSave();
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
