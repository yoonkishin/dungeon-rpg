'use strict';

const HERO_CHARACTER_ID = 'hero';
const COMMANDER_PLAYER_SNAPSHOT_KEYS = [
  'hp',
  'maxHp',
  'mp',
  'maxMp',
  'level',
  'xp',
  'xpNext',
  'tier',
  'atk',
  'def',
  'speed',
  'critChance',
  'classLine',
  'classRank',
  'currentClassKey',
  'promotionPending',
  'promotionBonusRankApplied',
  'activeEmblemId',
  'masterEmblemId',
  'tier8UnlockLineId',
  'tier8EmblemId',
  'tier9EmblemId',
];
const COMMANDER_PLAYER_ARRAY_SNAPSHOT_KEYS = [
  'classHistory',
  'emblemIds',
  'appliedEmblemBonusIds',
  'emblemFusionHistory',
];

function getHeroCharacterId() {
  return HERO_CHARACTER_ID;
}

function getCompanionCharacterId(cId) {
  return 'companion:' + cId;
}

function parseCompanionCharacterId(characterId) {
  if (typeof characterId !== 'string' || !characterId.startsWith('companion:')) return null;
  const cId = parseInt(characterId.slice('companion:'.length), 10);
  return Number.isInteger(cId) && isValidCompanionId(cId) ? cId : null;
}

function isHeroCharacterId(characterId) {
  return characterId === HERO_CHARACTER_ID;
}

function isCompanionCharacterId(characterId) {
  return parseCompanionCharacterId(characterId) !== null;
}

function isCharacterDead(characterId) {
  const cId = parseCompanionCharacterId(characterId);
  return cId !== null ? deadCompanions.includes(cId) : false;
}

function getCharacterDisplayName(characterId) {
  if (isHeroCharacterId(characterId)) return '주인공';
  const cId = parseCompanionCharacterId(characterId);
  return cId !== null ? getCompanionName(cId) : '알 수 없는 캐릭터';
}

function getCommanderCompanionId() {
  return parseCompanionCharacterId(currentCommanderId);
}

function getCommanderCompanionProfile() {
  const cId = getCommanderCompanionId();
  return cId !== null ? getCompanionProfile(cId) : null;
}

function getCommanderClassIdForCompat() {
  const cId = typeof getCommanderCompanionId === 'function' ? getCommanderCompanionId() : null;
  const profile = cId !== null && typeof getCommanderCompanionProfile === 'function' ? getCommanderCompanionProfile() : null;
  return profile ? profile.classId : null;
}

function getCommanderCompanionRoster() {
  const cId = getCommanderCompanionId();
  return cId !== null ? getCompanionRoster(cId) : null;
}

function getCommanderCombatProfile() {
  const cId = getCommanderCompanionId();
  const profile = getCommanderCompanionProfile();
  if (cId === null || !profile) return null;

  const moveSpeedBonusByType = {
    Infantry: -0.08,
    FlyingKnight: 0.42,
    Cavalry: 0.28,
    NavalUnit: 0.04,
    Lancer: 0.12,
    Archer: 0.08,
    Monk: 0.02,
    Priest: -0.04,
    Mage: -0.08,
    DarkPriest: -0.02,
  };

  return {
    cId,
    profile,
    roster: getCommanderCompanionRoster(),
    baseDamage: getCompanionAtk(cId),
    attackCooldown: Math.max(360, Math.floor(profile.attackCooldown * 0.92)),
    attackRange: Math.max(60, Math.min(140, profile.attackRange)),
    arcWidth: isCompanionRangedProfile(profile) ? Math.PI * 0.34 : Math.PI * 0.68,
    lungeDistance: isCompanionRangedProfile(profile) ? 2 : (profile.unitType === 'Cavalry' ? 14 : profile.unitType === 'FlyingKnight' ? 10 : 8),
    moveSpeedBonus: moveSpeedBonusByType[profile.unitType] || 0,
    damageType: isCompanionMagicProfile(profile) ? 'magic' : 'normal',
    basicAttack: profile.basicAttack || null,
  };
}

function canEditPartySetup() {
  return currentMap !== 'dungeon';
}

function buildHeroCharacterStats() {
  return {
    attack: player.atk,
    defense: player.def,
    magicPower: null,
    magicAttack: null,
    magicDefense: null,
    hitRate: null,
    evasion: null,
    critRate: player.critChance,
    critDamage: null,
    commandRange: null,
    hp: player.maxHp,
    mp: player.maxMp,
    moveSpeed: player.speed,
    attackRange: typeof playerAttackRangeValue === 'function' ? playerAttackRangeValue() : 62,
    magicRange: null,
    attackSpeed: null,
  };
}

function buildCompanionCharacterStats(cId, runtimeState) {
  const state = runtimeState || companionStates[cId] || null;
  const profile = getCompanionProfile(cId);
  const maxHp = state ? state.maxHp : getCompanionMaxHp(cId);
  return {
    attack: getCompanionAtk(cId),
    defense: 0,
    magicPower: null,
    magicAttack: null,
    magicDefense: null,
    hitRate: null,
    evasion: null,
    critRate: 0,
    critDamage: null,
    commandRange: null,
    hp: maxHp,
    mp: null,
    moveSpeed: null,
    attackRange: profile ? profile.attackRange : null,
    magicRange: null,
    attackSpeed: null,
  };
}

function getScalarFromCharacterStats(entry, key, fallback) {
  const stats = entry && entry.stats && typeof entry.stats === 'object' ? entry.stats : null;
  if (!stats) return fallback;
  if (key === 'atk' && typeof stats.attack === 'number') return stats.attack;
  if (key === 'def' && typeof stats.defense === 'number') return stats.defense;
  if (key === 'critChance' && typeof stats.critRate === 'number') return stats.critRate;
  if (key === 'speed' && typeof stats.moveSpeed === 'number') return stats.moveSpeed;
  return fallback;
}

function getLineIdForUnitType(unitType) {
  const map = {
    Infantry: 'infantry',
    FlyingKnight: 'flyingKnight',
    Cavalry: 'cavalry',
    NavalUnit: 'navalUnit',
    Lancer: 'lancer',
    Archer: 'archer',
    Monk: 'monk',
    Priest: 'priest',
    Mage: 'mage',
    DarkPriest: 'darkPriest',
  };
  return map[unitType] || 'infantry';
}

function cloneSkillPagesState(source) {
  const pages = source || skillPages;
  return Array.isArray(pages)
    ? pages.map(page => Array.isArray(page) ? page.slice() : [])
    : [];
}

function applySkillPagesState(pages) {
  if (!Array.isArray(pages)) return;
  const nextPages = cloneSkillPagesState(pages);
  skillPages.length = 0;
  nextPages.forEach(page => skillPages.push(page));
}

function cloneLineup(lineup) {
  if (!Array.isArray(lineup)) return null;
  return lineup.map(page => Array.isArray(page) ? page.slice() : []);
}

function reconcileSkillPagesForClass(pages, classId) {
  if (!Array.isArray(pages)) return null;
  if (classId === null) return pages.map(page => Array.isArray(page) ? page.slice() : []);
  return pages.map(page => {
    if (!Array.isArray(page)) return [];
    return page.map(id => (id && !isSkillAllowedForClass(id, classId)) ? null : id);
  });
}

function getDefaultLineupForClass(classId) {
  const policy = classId !== null ? getClassSkillPolicy(classId) : null;
  return policy && policy.defaultLineup ? cloneLineup(policy.defaultLineup) : null;
}

function applyClassDefaultLineup(classId) {
  const def = getDefaultLineupForClass(classId);
  if (!def) return false;
  applySkillPagesState(def);
  return true;
}

function syncCharacterAIModesFromLegacy() {
  characterAIModes = {
    [HERO_CHARACTER_ID]: 'manual',
  };

  companions.forEach(cId => {
    characterAIModes[getCompanionCharacterId(cId)] = companionAIModes[cId] || getDefaultCompanionAIMode(cId);
  });
}

function syncOwnedCharactersFromRoster() {
  const existingById = new Map(Array.isArray(ownedCharacters)
    ? ownedCharacters.map(entry => [entry.characterId, entry])
    : []);
  const next = [];
  const heroExisting = existingById.get(HERO_CHARACTER_ID) || {};
  const heroCooldowns = currentCommanderId === HERO_CHARACTER_ID
    ? { ...skillCooldowns }
    : (heroExisting.cooldowns && typeof heroExisting.cooldowns === 'object' ? { ...heroExisting.cooldowns } : {});

  next.push({
    ...heroExisting,
    characterId: HERO_CHARACTER_ID,
    sourceType: 'player',
    sourceId: null,
    name: '주인공',
    unlocked: true,
    dead: false,
    level: player.level,
    currentTier: player.tier || player.classRank || 1,
    tier: player.tier || player.classRank || 1,
    exp: player.xp,
    expToNext: player.xpNext,
    xpNext: player.xpNext,
    atk: player.atk,
    def: player.def,
    speed: player.speed,
    critChance: player.critChance,
    hp: currentCommanderId === HERO_CHARACTER_ID ? player.hp : (typeof heroExisting.hp === 'number' ? heroExisting.hp : player.hp),
    maxHp: currentCommanderId === HERO_CHARACTER_ID ? player.maxHp : (typeof heroExisting.maxHp === 'number' ? heroExisting.maxHp : player.maxHp),
    mp: currentCommanderId === HERO_CHARACTER_ID ? player.mp : (typeof heroExisting.mp === 'number' ? heroExisting.mp : player.mp),
    maxMp: currentCommanderId === HERO_CHARACTER_ID ? player.maxMp : (typeof heroExisting.maxMp === 'number' ? heroExisting.maxMp : player.maxMp),
    classLine: player.classLine,
    classRank: player.classRank,
    currentClassKey: player.currentClassKey,
    classHistory: Array.isArray(player.classHistory) ? player.classHistory.slice() : [],
    emblemIds: Array.isArray(player.emblemIds) ? player.emblemIds.slice() : [],
    activeEmblemId: player.activeEmblemId || null,
    masterEmblemId: player.masterEmblemId || null,
    tier8UnlockLineId: player.tier8UnlockLineId || null,
    tier8EmblemId: player.tier8EmblemId || null,
    tier9EmblemId: player.tier9EmblemId || null,
    stats: buildHeroCharacterStats(),
    cooldowns: heroCooldowns,
    equipment: currentCommanderId === HERO_CHARACTER_ID ? cloneEquippedState() : (heroExisting.equipment && typeof heroExisting.equipment === 'object' ? cloneEquippedState(heroExisting.equipment) : buildEmptyEquippedState()),
    skills: currentCommanderId === HERO_CHARACTER_ID ? skillPages.flat().filter(Boolean) : (Array.isArray(heroExisting.skills) ? heroExisting.skills.slice() : skillPages.flat().filter(Boolean)),
    skillPages: currentCommanderId === HERO_CHARACTER_ID ? cloneSkillPagesState() : (Array.isArray(heroExisting.skillPages) ? cloneSkillPagesState(heroExisting.skillPages) : cloneSkillPagesState()),
    skillPageIndex: currentCommanderId === HERO_CHARACTER_ID ? currentSkillPage : (typeof heroExisting.skillPageIndex === 'number' ? heroExisting.skillPageIndex : 0),
    aiBehavior: null,
  });

  companions.forEach(cId => {
    const characterId = getCompanionCharacterId(cId);
    const existing = existingById.get(characterId) || {};
    const profile = getCompanionProfile(cId);
    const runtimeState = companionStates[cId] || null;
    const isCommander = currentCommanderId === characterId;
    const classLine = existing.classLine || getLineIdForUnitType(profile ? profile.unitType : null);
    // Inference from spec: companions must not inherit the current commander's
    // growth state. When no per-character state exists yet, initialize them to
    // a neutral baseline instead of mirroring player level/tier.
    const level = existing.level !== undefined ? existing.level : 1;
    const currentTier = existing.currentTier !== undefined ? existing.currentTier : 1;
    const classRank = existing.classRank !== undefined
      ? existing.classRank
      : getRankForLevel(classLine, level).rank;
    const cooldowns = isCommander
      ? { ...skillCooldowns }
      : (runtimeState && runtimeState.skillTimer > 0 ? { skill: Math.floor(runtimeState.skillTimer) } : (existing.cooldowns && typeof existing.cooldowns === 'object' ? { ...existing.cooldowns } : {}));
    const stats = buildCompanionCharacterStats(cId, runtimeState);
    next.push({
      ...existing,
      characterId,
      sourceType: 'companion',
      sourceId: cId,
      name: getCompanionName(cId),
      unlocked: true,
      dead: deadCompanions.includes(cId),
      classId: profile ? profile.classId : existing.classId,
      unitType: profile ? profile.unitType : existing.unitType,
      level,
      currentTier,
      tier: currentTier,
      exp: existing.exp !== undefined ? existing.exp : 0,
      expToNext: existing.expToNext !== undefined ? existing.expToNext : getXpToNextLevel(level, currentTier),
      xpNext: existing.xpNext !== undefined ? existing.xpNext : (existing.expToNext !== undefined ? existing.expToNext : getXpToNextLevel(level, currentTier)),
      atk: isCommander ? player.atk : (existing.atk !== undefined ? existing.atk : stats.attack),
      def: isCommander ? player.def : (existing.def !== undefined ? existing.def : stats.defense),
      speed: isCommander ? player.speed : (existing.speed !== undefined ? existing.speed : 1.5),
      critChance: isCommander ? player.critChance : (existing.critChance !== undefined ? existing.critChance : stats.critRate),
      hp: isCommander ? player.hp : (runtimeState ? runtimeState.hp : (typeof existing.hp === 'number' ? existing.hp : getCompanionMaxHp(cId))),
      maxHp: isCommander ? player.maxHp : (runtimeState ? runtimeState.maxHp : (typeof existing.maxHp === 'number' ? existing.maxHp : getCompanionMaxHp(cId))),
      mp: isCommander ? player.mp : existing.mp,
      maxMp: isCommander ? player.maxMp : existing.maxMp,
      classLine,
      classRank,
      currentClassKey: existing.currentClassKey || (classLine + '_rank' + classRank),
      classHistory: Array.isArray(existing.classHistory) ? existing.classHistory.slice() : [],
      emblemIds: Array.isArray(existing.emblemIds) ? existing.emblemIds.slice() : [],
      appliedEmblemBonusIds: Array.isArray(existing.appliedEmblemBonusIds) ? existing.appliedEmblemBonusIds.slice() : [],
      emblemFusionHistory: Array.isArray(existing.emblemFusionHistory) ? existing.emblemFusionHistory.slice() : [],
      activeEmblemId: existing.activeEmblemId || null,
      masterEmblemId: existing.masterEmblemId || null,
      tier8UnlockLineId: existing.tier8UnlockLineId || null,
      tier8EmblemId: existing.tier8EmblemId || null,
      tier9EmblemId: existing.tier9EmblemId || null,
      promotionPending: !!existing.promotionPending,
      promotionBonusRankApplied: existing.promotionBonusRankApplied || 1,
      stats,
      cooldowns,
      equipment: isCommander ? cloneEquippedState() : (existing.equipment && typeof existing.equipment === 'object' ? cloneEquippedState(existing.equipment) : buildEmptyEquippedState()),
      skills: isCommander ? skillPages.flat().filter(Boolean) : (Array.isArray(existing.skills) ? existing.skills.slice() : skillPages.flat().filter(Boolean)),
      skillPages: isCommander ? cloneSkillPagesState() : (Array.isArray(existing.skillPages) ? cloneSkillPagesState(existing.skillPages) : cloneSkillPagesState()),
      skillPageIndex: isCommander ? currentSkillPage : (typeof existing.skillPageIndex === 'number' ? existing.skillPageIndex : 0),
      aiBehavior: characterAIModes[characterId] || companionAIModes[cId] || getDefaultCompanionAIMode(cId),
    });
  });

  ownedCharacters = next;
}

function getOwnedCharacter(characterId) {
  return Array.isArray(ownedCharacters)
    ? ownedCharacters.find(entry => entry && entry.characterId === characterId) || null
    : null;
}

function getActivePartyCharacters() {
  return (Array.isArray(activePartyCharacterIds) ? activePartyCharacterIds : [])
    .map(characterId => getOwnedCharacter(characterId))
    .filter(Boolean);
}

function cloneEquippedState(source) {
  const base = source || equipped;
  const out = {};
  Object.keys(equipped).forEach(slot => {
    out[slot] = base[slot] ? { ...base[slot] } : null;
  });
  return out;
}

function buildEmptyEquippedState() {
  const out = {};
  Object.keys(equipped).forEach(slot => {
    out[slot] = null;
  });
  return out;
}

function snapshotPlayerStateToOwnedCharacter(characterId) {
  const entry = getOwnedCharacter(characterId);
  if (!entry) return null;

  COMMANDER_PLAYER_SNAPSHOT_KEYS.forEach(key => {
    entry[key] = player[key];
  });
  COMMANDER_PLAYER_ARRAY_SNAPSHOT_KEYS.forEach(key => {
    entry[key] = Array.isArray(player[key]) ? player[key].slice() : [];
  });
  entry.stats = buildHeroCharacterStats();
  entry.cooldowns = { ...skillCooldowns };
  entry.equipment = cloneEquippedState();
  entry.skills = skillPages.flat().filter(Boolean);
  entry.skillPages = cloneSkillPagesState();
  entry.skillPageIndex = currentSkillPage;
  entry.dead = false;

  return entry;
}

function applyOwnedCharacterStateToPlayer(characterId) {
  const entry = getOwnedCharacter(characterId);
  if (!entry) return false;

  if (Array.isArray(player.appliedEmblemBonusIds) && player.appliedEmblemBonusIds.length
    && typeof removeLegacyAppliedEmblemBonuses === 'function') {
    removeLegacyAppliedEmblemBonuses(player.appliedEmblemBonusIds);
  }

  COMMANDER_PLAYER_SNAPSHOT_KEYS.forEach(key => {
    if (entry[key] !== undefined) player[key] = entry[key];
    else player[key] = getScalarFromCharacterStats(entry, key, player[key]);
  });
  COMMANDER_PLAYER_ARRAY_SNAPSHOT_KEYS.forEach(key => {
    if (Array.isArray(entry[key])) player[key] = entry[key].slice();
  });

  Object.keys(skillCooldowns).forEach(key => delete skillCooldowns[key]);
  if (entry.cooldowns && typeof entry.cooldowns === 'object') {
    Object.entries(entry.cooldowns).forEach(([key, value]) => {
      skillCooldowns[key] = value;
    });
  }
  if (entry.equipment && typeof entry.equipment === 'object') {
    Object.keys(equipped).forEach(slot => {
      equipped[slot] = entry.equipment[slot] ? { ...entry.equipment[slot] } : null;
    });
  }
  const classId = getCommanderClassIdForCompat();
  const reconciled = reconcileSkillPagesForClass(entry.skillPages, classId);
  const pagesEmpty = !Array.isArray(reconciled) || reconciled.every(page => !Array.isArray(page) || page.every(id => !id));
  if (pagesEmpty) {
    applyClassDefaultLineup(classId);
  } else {
    applySkillPagesState(reconciled);
  }
  if (typeof entry.skillPageIndex === 'number') {
    currentSkillPage = Math.max(0, Math.min(skillPages.length - 1, entry.skillPageIndex));
  }

  if (typeof syncPlayerGrowthState === 'function') syncPlayerGrowthState();
  if (typeof ensurePlayerEmblemBonusesApplied === 'function') ensurePlayerEmblemBonusesApplied();
  hudDirty = true;
  skillSlotsDirty = true;
  return true;
}

function syncCommanderModelFromLegacyPartyState() {
  syncOwnedCharactersFromRoster();
  if (!getOwnedCharacter(currentCommanderId)) currentCommanderId = HERO_CHARACTER_ID;
  if (isCharacterDead(currentCommanderId)) currentCommanderId = HERO_CHARACTER_ID;

  const nextParty = [];
  const pushCharacter = (characterId) => {
    if (!characterId) return;
    if (nextParty.includes(characterId)) return;
    if (!getOwnedCharacter(characterId)) return;
    if (isCharacterDead(characterId)) return;
    if (nextParty.length >= MAX_ACTIVE_COMPANIONS + 1) return;
    nextParty.push(characterId);
  };

  pushCharacter(currentCommanderId);
  activeCompanions.forEach(cId => pushCharacter(getCompanionCharacterId(cId)));

  activePartyCharacterIds = nextParty;
  syncCharacterAIModesFromLegacy();
}

function syncLegacyPartyStateFromCommanderModel() {
  syncOwnedCharactersFromRoster();
  const nextActiveCompanions = [];
  (Array.isArray(activePartyCharacterIds) ? activePartyCharacterIds : []).forEach(characterId => {
    if (characterId === currentCommanderId) return;
    const cId = parseCompanionCharacterId(characterId);
    if (cId === null) return;
    if (deadCompanions.includes(cId)) return;
    if (!companions.includes(cId)) return;
    if (nextActiveCompanions.includes(cId)) return;
    if (nextActiveCompanions.length >= MAX_ACTIVE_COMPANIONS) return;
    nextActiveCompanions.push(cId);
  });

  activeCompanions = nextActiveCompanions;
  companions.forEach(cId => {
    if (!companionAIModes[cId]) companionAIModes[cId] = getDefaultCompanionAIMode(cId);
  });
  syncCharacterAIModesFromLegacy();
}

function normalizeCommanderState() {
  syncOwnedCharactersFromRoster();
  if (!getOwnedCharacter(currentCommanderId) || isCharacterDead(currentCommanderId)) {
    currentCommanderId = HERO_CHARACTER_ID;
  }

  if (!Array.isArray(activePartyCharacterIds) || activePartyCharacterIds.length === 0) {
    syncCommanderModelFromLegacyPartyState();
  } else {
    const nextParty = [];
    const pushCharacter = (characterId) => {
      if (!characterId) return;
      if (nextParty.includes(characterId)) return;
      if (!getOwnedCharacter(characterId)) return;
      if (isCharacterDead(characterId)) return;
      if (nextParty.length >= MAX_ACTIVE_COMPANIONS + 1) return;
      nextParty.push(characterId);
    };

    pushCharacter(currentCommanderId);
    activePartyCharacterIds.forEach(pushCharacter);
    activeCompanions.forEach(cId => pushCharacter(getCompanionCharacterId(cId)));
    activePartyCharacterIds = nextParty;
  }

  if (activePartyCharacterIds[0] !== currentCommanderId) {
    activePartyCharacterIds = [currentCommanderId].concat(activePartyCharacterIds.filter(id => id !== currentCommanderId));
    activePartyCharacterIds = activePartyCharacterIds.slice(0, MAX_ACTIVE_COMPANIONS + 1);
  }

  syncLegacyPartyStateFromCommanderModel();
  syncCommanderModelFromLegacyPartyState();
}

function assignCommanderCharacter(characterId) {
  if (!canEditPartySetup()) return false;
  if (!getOwnedCharacter(characterId)) return false;
  if (isCharacterDead(characterId)) return false;
  if (currentCommanderId === characterId) return true;

  snapshotPlayerStateToOwnedCharacter(currentCommanderId || HERO_CHARACTER_ID);

  currentCommanderId = characterId;

  const nextParty = [];
  const pushCharacter = (candidateId) => {
    if (!candidateId) return;
    if (nextParty.includes(candidateId)) return;
    if (!getOwnedCharacter(candidateId)) return;
    if (isCharacterDead(candidateId)) return;
    if (nextParty.length >= MAX_ACTIVE_COMPANIONS + 1) return;
    nextParty.push(candidateId);
  };

  pushCharacter(characterId);

  const fallbackCandidates = []
    .concat(activePartyCharacterIds || [])
    .concat(activeCompanions.map(cId => getCompanionCharacterId(cId)));
  fallbackCandidates.forEach(pushCharacter);

  activePartyCharacterIds = nextParty;
  syncLegacyPartyStateFromCommanderModel();
  syncCommanderModelFromLegacyPartyState();
  applyOwnedCharacterStateToPlayer(characterId);
  return true;
}
