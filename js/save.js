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
  // Nullable singletons — preserve explicit null when absent/falsy.
  out.activeEmblemId = player.activeEmblemId || null;
  out.masterEmblemId = player.masterEmblemId || null;       // DEPRECATED (migration only)
  out.tier8UnlockLineId = player.tier8UnlockLineId || null;
  out.tier8EmblemId = player.tier8EmblemId || null;
  out.tier9EmblemId = player.tier9EmblemId || null;
  return out;
}

function serializeOwnedCharacters() {
  return (Array.isArray(ownedCharacters) ? ownedCharacters : []).map(entry => {
    const out = {
      characterId: entry.characterId,
      name: entry.name,
      unlocked: entry.unlocked !== false,
      dead: !!entry.dead,
      aiBehavior: entry.aiBehavior || (characterAIModes && entry.characterId ? characterAIModes[entry.characterId] : null) || null,
      sourceType: entry.sourceType,
      sourceId: entry.sourceId,
    };

    [
      'classId',
      'unitType',
      'level',
      'currentTier',
      'tier',
      'exp',
      'expToNext',
      'xpNext',
      'hp',
      'maxHp',
      'mp',
      'maxMp',
      'atk',
      'def',
      'speed',
      'critChance',
      'classLine',
      'classRank',
      'currentClassKey',
      'activeEmblemId',
      'masterEmblemId',
      'tier8UnlockLineId',
      'tier8EmblemId',
      'tier9EmblemId',
      'skillPageIndex',
    ].forEach(key => {
      if (entry[key] !== undefined) out[key] = entry[key];
    });

    if (Array.isArray(entry.classHistory)) out.classHistory = entry.classHistory.slice();
    if (Array.isArray(entry.emblemIds)) out.emblemIds = entry.emblemIds.slice();
    if (Array.isArray(entry.appliedEmblemBonusIds)) out.appliedEmblemBonusIds = entry.appliedEmblemBonusIds.slice();
    if (Array.isArray(entry.emblemFusionHistory)) out.emblemFusionHistory = entry.emblemFusionHistory.slice();
    if (entry.cooldowns && typeof entry.cooldowns === 'object') out.cooldowns = { ...entry.cooldowns };
    if (entry.stats && typeof entry.stats === 'object') out.stats = JSON.parse(JSON.stringify(entry.stats));
    if (entry.equipment && typeof entry.equipment === 'object') out.equipment = JSON.parse(JSON.stringify(entry.equipment));
    if (Array.isArray(entry.skills)) out.skills = entry.skills.slice();
    if (Array.isArray(entry.skillPages)) out.skillPages = entry.skillPages.map(page => Array.isArray(page) ? page.slice() : []);

    return out;
  });
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
  let restoreControlledId = null;
  let restoreCooldownMs = 0;
  let restoreNotice = null;

  try {
    if (isCombatControlActive()) {
      restoreControlledId = combatControlledCharacterId;
      restoreCooldownMs = combatSwitchCooldownMs;
      restoreNotice = combatSwitchNotice ? { ...combatSwitchNotice } : null;
      if (typeof snapshotControlledPlayerToRuntimeState === 'function') snapshotControlledPlayerToRuntimeState();
      if (typeof syncPartyRuntimeStatesToOwnedCharacters === 'function') syncPartyRuntimeStatesToOwnedCharacters();
      if (restoreControlledId && restoreControlledId !== currentCommanderId && typeof applyOwnedCharacterStateToPlayer === 'function') {
        applyOwnedCharacterStateToPlayer(currentCommanderId || (typeof getHeroCharacterId === 'function' ? getHeroCharacterId() : 'hero'));
      }
    }

    if (typeof normalizeCommanderState === 'function') normalizeCommanderState();
    const saveData = {
      saveVersion: 1,
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
      ownedCharacters: serializeOwnedCharacters(),
      currentCommanderId: currentCommanderId,
      activePartyCharacterIds: Array.isArray(activePartyCharacterIds) ? activePartyCharacterIds.slice() : [],
      characterAIModes: { ...characterAIModes },
      world: {
        playerPosition: {
          x: player.x,
          y: player.y,
        },
      },
      totalGoldEarned: totalGoldEarned,
      totalEnemiesKilled: totalEnemiesKilled,
      currentDungeonId: currentDungeonId,
      fieldSeed: fieldSeedOriginal,
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
  } finally {
    if (restoreControlledId && restoreControlledId !== currentCommanderId && typeof applyRuntimeStateToPlayer === 'function') {
      applyRuntimeStateToPlayer(restoreControlledId);
      combatControlledCharacterId = restoreControlledId;
      combatSwitchCooldownMs = restoreCooldownMs;
      combatSwitchNotice = restoreNotice;
    }
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
  player.activeEmblemId = p.activeEmblemId && getEmblemDef(p.activeEmblemId) && player.emblemIds.includes(p.activeEmblemId)
    ? p.activeEmblemId
    : null;
  player.masterEmblemId = p.masterEmblemId && getEmblemDef(p.masterEmblemId) ? p.masterEmblemId : null;

  // staged progression 신규 필드 — 원본 세이브가 있으면 직접 읽고,
  // 없으면 구버전 masterEmblemId에서 파생해 마이그레이션한다.
  player.tier8UnlockLineId = (typeof p.tier8UnlockLineId === 'string' && EMBLEM_FUSION_RECIPES[p.tier8UnlockLineId])
    ? p.tier8UnlockLineId
    : null;
  player.tier8EmblemId = (p.tier8EmblemId && getEmblemDef(p.tier8EmblemId)) ? p.tier8EmblemId : null;
  player.tier9EmblemId = (p.tier9EmblemId && getEmblemDef(p.tier9EmblemId)) ? p.tier9EmblemId : null;
  if (player.masterEmblemId && !player.tier8UnlockLineId) {
    const legacyMaster = getEmblemDef(player.masterEmblemId);
    if (legacyMaster && EMBLEM_FUSION_RECIPES[legacyMaster.targetLine]) {
      player.tier8UnlockLineId = legacyMaster.targetLine;
      // 구 세이브는 masterEmblemId=보유를 전제로 하므로 tier8 문장도 함께 획득한 것으로 본다.
      if (!player.tier8EmblemId) player.tier8EmblemId = player.masterEmblemId;
    }
  }

  player.emblemFusionHistory = Array.isArray(p.emblemFusionHistory) ? p.emblemFusionHistory.slice() : [];
  player.xpNext = hasOwn(p, 'xpNext') ? p.xpNext : getXpToNextLevel(player.level, player.tier || player.classRank || 1);
  if (player.appliedEmblemBonusIds.length && typeof removeLegacyAppliedEmblemBonuses === 'function') {
    removeLegacyAppliedEmblemBonuses(player.appliedEmblemBonusIds);
    player.appliedEmblemBonusIds = [];
  }
  if (!player.activeEmblemId && player.masterEmblemId && player.emblemIds.includes(player.masterEmblemId)) {
    player.activeEmblemId = player.masterEmblemId;
  } else if (!player.activeEmblemId && player.emblemIds.length > 0) {
    player.activeEmblemId = player.emblemIds[0];
  }
  if (p.promotionBonusRankApplied === undefined && player.classRank > 1) {
    const baseRank = getGrowthLine(player.classLine).ranks[0].rank;
    applyPromotionBonus(getPromotionBonusDelta(player.classLine, baseRank, player.classRank));
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
    if (player.activeEmblemId && equipped.helmet) {
      inventory.push(equipped.helmet);
      equipped.helmet = null;
      if (typeof showToast === 'function') {
        setTimeout(() => showToast('문장이 투구 슬롯을 차지해 투구가 가방으로 이동했습니다'), 400);
      }
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
  restoreActiveCompanionStates();
}

function loadCommanderState(data) {
  if (Array.isArray(data.ownedCharacters)) {
    ownedCharacters = data.ownedCharacters
      .filter(entry => entry && typeof entry.characterId === 'string')
      .map(entry => ({
        ...entry,
        characterId: entry.characterId,
        sourceType: entry.sourceType || (isHeroCharacterId(entry.characterId) ? 'player' : 'companion'),
        sourceId: entry.sourceId ?? parseCompanionCharacterId(entry.characterId),
        name: entry.name || getCharacterDisplayName(entry.characterId),
        unlocked: entry.unlocked !== false,
        dead: !!entry.dead,
        aiBehavior: entry.aiBehavior || null,
        classHistory: Array.isArray(entry.classHistory) ? entry.classHistory.slice() : entry.classHistory,
        emblemIds: Array.isArray(entry.emblemIds) ? entry.emblemIds.slice() : entry.emblemIds,
        appliedEmblemBonusIds: Array.isArray(entry.appliedEmblemBonusIds) ? entry.appliedEmblemBonusIds.slice() : entry.appliedEmblemBonusIds,
        emblemFusionHistory: Array.isArray(entry.emblemFusionHistory) ? entry.emblemFusionHistory.slice() : entry.emblemFusionHistory,
        cooldowns: entry.cooldowns && typeof entry.cooldowns === 'object' ? { ...entry.cooldowns } : entry.cooldowns,
        stats: entry.stats && typeof entry.stats === 'object' ? JSON.parse(JSON.stringify(entry.stats)) : entry.stats,
        equipment: entry.equipment && typeof entry.equipment === 'object' ? JSON.parse(JSON.stringify(entry.equipment)) : entry.equipment,
        skills: Array.isArray(entry.skills) ? entry.skills.slice() : entry.skills,
        skillPages: Array.isArray(entry.skillPages) ? entry.skillPages.map(page => Array.isArray(page) ? page.slice() : []) : entry.skillPages,
      }));
  } else {
    ownedCharacters = [];
  }

  currentCommanderId = (typeof data.currentCommanderId === 'string' && data.currentCommanderId)
    ? data.currentCommanderId
    : getHeroCharacterId();

  activePartyCharacterIds = Array.isArray(data.activePartyCharacterIds)
    ? data.activePartyCharacterIds.filter(id => typeof id === 'string')
    : [];

  if (data.characterAIModes && typeof data.characterAIModes === 'object') {
    characterAIModes = { ...data.characterAIModes };
    Object.keys(characterAIModes).forEach(characterId => {
      const cId = parseCompanionCharacterId(characterId);
      if (cId !== null && companions.includes(cId)) {
        companionAIModes[cId] = normalizeCompanionAIMode(characterAIModes[characterId]);
      }
    });
  } else {
    characterAIModes = {};
  }

  ownedCharacters.forEach(entry => {
    if (!entry || !entry.characterId) return;
    if (entry.aiBehavior) {
      characterAIModes[entry.characterId] = entry.aiBehavior;
      const cId = parseCompanionCharacterId(entry.characterId);
      if (cId !== null && companions.includes(cId)) {
        companionAIModes[cId] = normalizeCompanionAIMode(entry.aiBehavior);
      }
    }
  });

  if (typeof normalizeCommanderState === 'function') normalizeCommanderState();
  if (typeof applyOwnedCharacterStateToPlayer === 'function') {
    applyOwnedCharacterStateToPlayer(currentCommanderId || (typeof getHeroCharacterId === 'function' ? getHeroCharacterId() : 'hero'));
  }
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

  const savedWorldPosition = data.world && data.world.playerPosition
    && typeof data.world.playerPosition.x === 'number'
    && typeof data.world.playerPosition.y === 'number'
    ? data.world.playerPosition
    : null;

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
    clearActiveCompanions({ markDead: true });
    currentDungeonId = -1;
  }

  // Safety net: dungeon map with neither a valid id nor a trial is a
  // corrupted state. Route to town so we don't boot into a fake dungeon.
  if (currentMap === 'dungeon') {
    currentMap = 'town';
    player.x = 20 * TILE + TILE / 2;
    player.y = 15 * TILE + TILE / 2;
  }

  // Normalize: a non-dungeon map must not retain a dungeon id or an active
  // emblem trial. Clears leftover flags from already-corrupted saves so they
  // don't keep re-persisting.
  if (currentMap !== 'dungeon') {
    currentDungeonId = -1;
    currentEmblemTrial = null;
    if (savedWorldPosition) {
      player.x = savedWorldPosition.x;
      player.y = savedWorldPosition.y;
    }
  }
}

function resetCombatRuntimeStateAfterLoad() {
  combatControlledCharacterId = null;
  combatSwitchCooldownMs = 0;
  combatSwitchNotice = null;
  partyRuntimeStates = {};
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
    loadCommanderState(data);
    loadQuestState(data);
    loadMapState(data);
    if (typeof normalizeCommanderState === 'function') normalizeCommanderState();
    resetCombatRuntimeStateAfterLoad();

    // Flush normalized state so corrupted blobs don't linger on disk.
    autoSave();
    return true;
  } catch(ex) {
    return false;
  }
}

function requestAutoSave() {
  autoSaveTimer = AUTO_SAVE_INTERVAL;
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
