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
    const level = existing.level !== undefined ? existing.level : player.level;
    const currentTier = existing.currentTier !== undefined ? existing.currentTier : (player.tier || player.classRank || 1);
    const classRank = existing.classRank !== undefined
      ? existing.classRank
      : getRankForLevel(classLine, level).rank;
    const cooldowns = isCommander
      ? { ...skillCooldowns }
      : (runtimeState && runtimeState.skillTimer > 0 ? { skill: Math.floor(runtimeState.skillTimer) } : (existing.cooldowns && typeof existing.cooldowns === 'object' ? { ...existing.cooldowns } : {}));
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
      promotionPending: !!existing.promotionPending,
      promotionBonusRankApplied: existing.promotionBonusRankApplied || 1,
      stats: buildCompanionCharacterStats(cId, runtimeState),
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
  if (Array.isArray(entry.skillPages)) {
    applySkillPagesState(entry.skillPages);
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

function activateCompanion(cId) {
  if (!isValidCompanionId(cId)) return false;
  if (!companions.includes(cId)) return false;
  if (!canEditPartySetup()) return false;
  if (deadCompanions.includes(cId)) return false;
  if (activeCompanions.includes(cId)) return true;
  if (activeCompanions.length >= MAX_ACTIVE_COMPANIONS) return false;

  activeCompanions.push(cId);
  initCompanionState(cId);
  syncCommanderModelFromLegacyPartyState();
  return true;
}

function deactivateCompanion(cId, options = {}) {
  const { force = false } = options;
  if (!force && currentCommanderId === getCompanionCharacterId(cId)) return false;
  if (!activeCompanions.includes(cId)) return false;
  activeCompanions = activeCompanions.filter(id => id !== cId);
  delete companionStates[cId];
  syncCommanderModelFromLegacyPartyState();
  return true;
}

function markCompanionDead(cId, options = {}) {
  if (!isValidCompanionId(cId)) return false;
  const {
    hitX = null,
    hitY = null,
    showToastMessage = true,
    addDeathParticles = true,
  } = options;

  const cs = companionStates[cId] || null;
  if (cs) {
    cs.hp = 0;
    cs.flashTimer = 12;
  }
  if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
  deactivateCompanion(cId, { force: true });
  normalizeCommanderState();

  if (addDeathParticles) {
    const px = hitX ?? (cs ? cs.x : player.x);
    const py = hitY ?? (cs ? cs.y : player.y);
    addParticles(px, py, '#e74c3c', 15);
  }

  if (showToastMessage) {
    const cInfo = getCompanionRoster(cId);
    showToast((cInfo ? cInfo.name : '동료') + ' 쓰러짐!');
  }

  return true;
}

function clearActiveCompanions(options = {}) {
  const {
    markDead = false,
    preserveDeadList = true,
  } = options;

  if (markDead) {
    activeCompanions.forEach(cId => {
      if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
    });
  } else if (!preserveDeadList) {
    deadCompanions = deadCompanions.filter(cId => !activeCompanions.includes(cId));
  }

  activeCompanions = [];
  companionStates = {};
  syncCommanderModelFromLegacyPartyState();
}

function initActiveCompanionsForDungeon() {
  companionStates = {};
  activeCompanions = activeCompanions.filter(cId => !deadCompanions.includes(cId));
  activeCompanions.forEach(cId => initCompanionState(cId));
  syncCommanderModelFromLegacyPartyState();
  return activeCompanions.length;
}

function restoreActiveCompanionStates() {
  companionStates = {};
  activeCompanions = activeCompanions.filter(cId => isValidCompanionId(cId) && !deadCompanions.includes(cId));
  activeCompanions.forEach(cId => initCompanionState(cId));
  syncCommanderModelFromLegacyPartyState();
  return activeCompanions.length;
}

function reviveCompanion(cId) {
  if (!deadCompanions.includes(cId)) return false;
  deadCompanions = deadCompanions.filter(id => id !== cId);
  delete companionStates[cId];
  normalizeCommanderState();
  return true;
}

function reviveAllCompanions() {
  if (deadCompanions.length === 0) return false;
  deadCompanions = [];
  normalizeCommanderState();
  return true;
}

function getCompanionFollowPoint(cId, idx, profile, cs) {
  const mode = getCompanionAIMode(cId, cs);
  const offsetAngle = idx === 0 ? -Math.PI / 3 : Math.PI / 3;
  const dirAngle = player.dir === 0 ? 0 : player.dir === 1 ? Math.PI : player.dir === 2 ? -Math.PI / 2 : Math.PI / 2;
  const ranged = isCompanionRangedProfile(profile);
  const supportRole = isCompanionSupportProfile(profile);
  let baseDist = supportRole ? 46 : (ranged ? 54 : 34);

  if (mode === 'aggressive') baseDist += ranged ? -6 : -8;
  else if (mode === 'defensive') baseDist += ranged || supportRole ? 10 : 6;
  else if (mode === 'support') baseDist += ranged || supportRole ? 18 : 10;

  if (profile.unitType === 'FlyingKnight') baseDist += 4;
  if (profile.unitType === 'Lancer') baseDist += 6;

  return {
    x: player.x - baseDist * Math.cos(dirAngle + offsetAngle),
    y: player.y - baseDist * Math.sin(dirAngle + offsetAngle)
  };
}

function getCompanionModeBehavior(cId, cs, profile) {
  const mode = getCompanionAIMode(cId, cs);
  const ranged = isCompanionRangedProfile(profile);
  const supportRole = isCompanionSupportProfile(profile);

  const behavior = {
    mode,
    engageRadius: 170,
    leashRadius: 80,
    guardRadius: 92,
    preferredRange: getCompanionPreferredRange(cId),
    attackRange: getCompanionAttackRange(cId),
    chaseSpeed: 1.05,
    fallbackSpeed: 0.92,
    retreatSpeed: 0.88,
    skillTickMult: 1,
    attackCooldown: getCompanionAttackCooldown(cId, cs),
    supportHealThreshold: 0.80,
    protectThreshold: 0.55,
    prioritizePlayerThreat: false,
    finishOffBonus: 0,
    keepTighterFormation: false,
  };

  if (mode === 'aggressive') {
    behavior.engageRadius = supportRole ? 145 : (ranged ? 235 : 225);
    behavior.leashRadius = 120;
    behavior.guardRadius = 76;
    behavior.preferredRange += ranged ? -6 : -4;
    behavior.chaseSpeed = 1.18;
    behavior.fallbackSpeed = 0.84;
    behavior.retreatSpeed = 0.76;
    behavior.skillTickMult = supportRole ? 1.05 : 1.20;
    behavior.supportHealThreshold = 0.76;
    behavior.protectThreshold = 0.52;
    behavior.finishOffBonus += 22;
  } else if (mode === 'defensive') {
    behavior.engageRadius = 160;
    behavior.leashRadius = 58;
    behavior.guardRadius = 115;
    behavior.preferredRange += ranged || supportRole ? 12 : 6;
    behavior.chaseSpeed = 0.96;
    behavior.fallbackSpeed = 1.04;
    behavior.retreatSpeed = 1.00;
    behavior.skillTickMult = 0.96;
    behavior.supportHealThreshold = 0.85;
    behavior.protectThreshold = 0.68;
    behavior.prioritizePlayerThreat = true;
    behavior.keepTighterFormation = true;
  } else if (mode === 'support') {
    behavior.engageRadius = supportRole ? 145 : 130;
    behavior.leashRadius = 52;
    behavior.guardRadius = 130;
    behavior.preferredRange += ranged || supportRole ? 20 : 10;
    behavior.chaseSpeed = 0.90;
    behavior.fallbackSpeed = 1.08;
    behavior.retreatSpeed = 1.10;
    behavior.skillTickMult = supportRole ? 1.28 : 1.02;
    behavior.supportHealThreshold = 0.90;
    behavior.protectThreshold = 0.72;
    behavior.prioritizePlayerThreat = true;
    behavior.keepTighterFormation = true;
  }

  if (profile.unitType === 'FlyingKnight') {
    behavior.engageRadius += 15;
    behavior.chaseSpeed += 0.08;
    behavior.leashRadius += 10;
    behavior.finishOffBonus += 18;
  }
  if (profile.unitType === 'Cavalry') {
    behavior.chaseSpeed += 0.12;
    behavior.guardRadius += 8;
    behavior.protectThreshold += 0.03;
  }
  if (profile.unitType === 'NavalUnit') {
    behavior.guardRadius += 10;
    behavior.keepTighterFormation = true;
  }
  if (profile.unitType === 'Lancer') {
    behavior.preferredRange += 10;
    behavior.attackRange += 8;
  }
  if (profile.unitType === 'Archer') {
    behavior.engageRadius += 28;
    behavior.preferredRange += 8;
  }
  if (profile.unitType === 'Monk') {
    behavior.skillTickMult += 0.08;
    behavior.supportHealThreshold += 0.04;
  }
  if (profile.unitType === 'Priest') {
    behavior.supportHealThreshold += 0.08;
    behavior.guardRadius += 10;
  }
  if (profile.unitType === 'Mage' || profile.unitType === 'DarkPriest') {
    behavior.engageRadius += 18;
    behavior.preferredRange += 6;
  }

  return behavior;
}

function getCompanionPriorityEnemy(cId, cs, behavior) {
  const profile = getCompanionProfile(cId);
  let best = null;
  let bestScore = -Infinity;

  enemies.forEach(e => {
    if (e.dead) return;
    const d = dist(cs, e);
    if (d > behavior.engageRadius) return;

    const dPlayer = dist(player, e);
    let score = 200 - d;

    if (profile.unitType === 'FlyingKnight') score += (e.maxHp - e.hp) * 0.8;
    if (isCompanionFrontlineProfile(profile)) score += d < 70 ? 40 : 0;
    if (isCompanionRangedProfile(profile)) score += d > 60 ? 15 : 0;
    if (e.isBoss) score += behavior.mode === 'defensive' || behavior.mode === 'support' ? 40 : 25;

    if (behavior.prioritizePlayerThreat && dPlayer < behavior.guardRadius) score += 80 - dPlayer * 0.3;
    if (behavior.mode === 'aggressive') {
      score += (e.maxHp - e.hp) * 0.35;
      if (e.hp / e.maxHp < 0.35) score += behavior.finishOffBonus;
    } else if (behavior.mode !== 'aggressive' && dPlayer > behavior.guardRadius + 40) {
      score -= 55;
    }

    if (isCompanionSupportProfile(profile)) {
      score += dPlayer < behavior.guardRadius ? 28 : -30;
    }

    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  });

  return best;
}

function moveCompanionToward(cs, tx, ty, speedMul = 1) {
  const dx = tx - cs.x;
  const dy = ty - cs.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d <= 2) return;
  const speed = Math.min(d * 0.08, 3.2) * speedMul;
  const pos = resolveCollision({ x: cs.x, y: cs.y, w: 20, h: 20 }, cs.x + (dx / d) * speed, cs.y + (dy / d) * speed);
  cs.x = pos.x;
  cs.y = pos.y;
}

function useCompanionSkill(cId, cs, target, behavior) {
  const profile = getCompanionProfile(cId);
  if (!profile) return false;
  const modeBehavior = behavior || getCompanionModeBehavior(cId, cs, profile);
  const effectColor = profile.companionColor || '#7dd3fc';
  if (cs.skillTimer > 0) return false;

  const skillReady = () => { cs.skillTimer = profile.skillCooldown; };
  const splashHit = (cx, cy, radius, dmg, color, stun = 0) => {
    let hit = false;
    enemies.forEach(e => {
      if (e.dead) return;
      const d = Math.sqrt((e.x - cx) ** 2 + (e.y - cy) ** 2);
      if (d <= radius) {
        e.hp -= dmg;
        e.flashTimer = 10;
        if (stun) e.hitStun = Math.max(e.hitStun || 0, stun);
        addDamageNumber(e.x, e.y, dmg, 'magic');
        addParticles(e.x, e.y, color, 6);
        if (e.hp <= 0) killEnemy(e);
        hit = true;
      }
    });
    return hit;
  };
  const directHit = (enemy, dmg, type = 'normal', stun = 0) => {
    if (!enemy || enemy.dead) return false;
    enemy.hp -= dmg;
    enemy.flashTimer = 12;
    if (stun) enemy.hitStun = Math.max(enemy.hitStun || 0, stun);
    addDamageNumber(enemy.x, enemy.y, dmg, type);
    addParticles(enemy.x, enemy.y, effectColor, 10);
    if (enemy.hp <= 0) killEnemy(enemy);
    return true;
  };
  const distanceToTarget = () => target ? dist(target, cs) : Infinity;

  if (profile.skillId === 'holy_prayer') {
    const allies = [{ kind: 'player', hp: player.hp, maxHp: player.maxHp }];
    activeCompanions.forEach(id => {
      const state = companionStates[id];
      if (state) allies.push({ kind: id, hp: state.hp, maxHp: state.maxHp });
    });
    const lowest = allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    if (!lowest || (lowest.hp / lowest.maxHp) > modeBehavior.supportHealThreshold) return false;
    const healAmt = Math.floor((22 + cId * 3) * getHealingMultiplier());
    player.hp = Math.min(player.maxHp, player.hp + Math.floor(healAmt * 0.8));
    addDamageNumber(player.x, player.y, Math.floor(healAmt * 0.8), 'heal');
    addParticles(player.x, player.y, effectColor, 10);
    if (lowest.kind !== 'player') {
      const ally = companionStates[lowest.kind];
      if (ally) {
        ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
        addDamageNumber(ally.x, ally.y, healAmt, 'heal');
        addParticles(ally.x, ally.y, effectColor, 8);
      }
    }
    showToast(profile.skillName + '!');
    updateHUD();
    skillReady();
    return true;
  }

  if (!target) return false;

  if (profile.skillId === 'slime_guard') {
    if (distanceToTarget() > 72) return false;
    if (splashHit(cs.x, cs.y, 62, Math.floor(getCompanionAtk(cId) * 0.9), effectColor, 280)) {
      triggerShake(8);
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'arrow_barrage') {
    const targets = enemies.filter(e => !e.dead).sort((a, b) => dist(cs, a) - dist(cs, b)).slice(0, 2);
    if (targets.length === 0) return false;
    let hit = false;
    targets.forEach(e => {
      if (dist(cs, e) > 150) return;
      hit = directHit(e, Math.floor(getCompanionAtk(cId) * 1.15), 'normal') || hit;
    });
    if (hit) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'bone_nova') {
    if (splashHit(target.x, target.y, 58, Math.floor(getCompanionAtk(cId) * 1.1), effectColor, 120)) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'war_cleave') {
    if (distanceToTarget() > 76) return false;
    if (splashHit(target.x, target.y, 48, Math.floor(getCompanionAtk(cId) * 1.2), effectColor)) {
      triggerShake(7);
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'shadow_strike') {
    if (distanceToTarget() > 160) return false;
    const angle = Math.atan2(player.y - target.y, player.x - target.x);
    cs.x = target.x + Math.cos(angle) * 18;
    cs.y = target.y + Math.sin(angle) * 18;
    if (directHit(target, Math.floor(getCompanionAtk(cId) * 1.55), 'critical', 180)) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'flame_burst') {
    if (splashHit(target.x, target.y, 44, Math.floor(getCompanionAtk(cId) * 1.25), effectColor)) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'frost_lock') {
    if (distanceToTarget() > 110) return false;
    if (directHit(target, Math.floor(getCompanionAtk(cId) * 1.05), 'magic', 360)) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'dark_aegis') {
    if (player.hp / player.maxHp > modeBehavior.protectThreshold) return false;
    const healAmt = Math.floor((12 + cId * 2) * getHealingMultiplier());
    player.hp = Math.min(player.maxHp, player.hp + healAmt);
    player.invincible = Math.max(player.invincible, 500);
    addDamageNumber(player.x, player.y, healAmt, 'heal');
    addParticles(player.x, player.y, effectColor, 10);
    if (target && distanceToTarget() < 70) {
      directHit(target, Math.floor(getCompanionAtk(cId) * 1.15), 'normal');
    }
    showToast(profile.skillName + '!');
    updateHUD();
    skillReady();
    return true;
  }

  return false;
}

// ─── Companion Update ────────────────────────────────────────────────────────
function updateCompanion(dt) {
  if (activeCompanions.length === 0 || currentMap !== 'dungeon') return;

  activeCompanions.forEach((cId, idx) => {
    if (deadCompanions.includes(cId)) return;
    const cs = companionStates[cId];
    if (!cs) return;
    const profile = getCompanionProfile(cId);
    if (!profile) return;
    const behavior = getCompanionModeBehavior(cId, cs, profile);
    const followPoint = getCompanionFollowPoint(cId, idx, profile, cs);

    if (cs.flashTimer > 0) cs.flashTimer -= 1;
    if (cs.attackTimer > 0) cs.attackTimer -= dt;
    if (cs.skillTimer > 0) cs.skillTimer = Math.max(0, cs.skillTimer - dt * behavior.skillTickMult);

    if (cs.targetCooldown > 0) {
      cs.targetCooldown -= dt;
      if (cs.targetCache && (cs.targetCache.dead || dist(cs, cs.targetCache) > behavior.engageRadius * 1.5)) {
        cs.targetCache = null;
        cs.targetCooldown = 0;
      }
    }
    if (cs.targetCooldown <= 0) {
      cs.targetCache = getCompanionPriorityEnemy(cId, cs, behavior);
      cs.targetCooldown = 166;
    }
    const target = cs.targetCache;
    const preferredRange = behavior.preferredRange;
    const attackRange = behavior.attackRange;

    if (target) {
      const d = dist(cs, target);
      const targetPlayerDist = dist(player, target);
      const lowHp = cs.hp / cs.maxHp < (behavior.mode === 'aggressive' ? 0.25 : 0.40);
      const rangedRole = isCompanionRangedProfile(profile);
      const supportRole = isCompanionSupportProfile(profile);
      const shouldHoldLine = behavior.keepTighterFormation && dist(cs, followPoint) > behavior.leashRadius && targetPlayerDist > behavior.guardRadius && !target.isBoss;

      if (supportRole) {
        moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
        if (d < preferredRange - 10) {
          moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), behavior.retreatSpeed);
        }
      } else if (shouldHoldLine) {
        moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
      } else if (lowHp && d < attackRange + 10) {
        moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), behavior.retreatSpeed);
      } else if (d > preferredRange + 10) {
        moveCompanionToward(cs, target.x, target.y, behavior.chaseSpeed);
      } else if (d < preferredRange - 10 && rangedRole) {
        moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), behavior.retreatSpeed);
      } else if (dist(cs, followPoint) > behavior.leashRadius && !target.isBoss) {
        moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
      }

      if (useCompanionSkill(cId, cs, target, behavior)) return;

      if (cs.attackTimer <= 0 && d <= attackRange) {
        cs.attackTimer = behavior.attackCooldown;
        const dmg = getCompanionAtk(cId);
        target.hp -= dmg;
        target.flashTimer = 8;
        if (profile.unitType === 'Infantry' || profile.unitType === 'NavalUnit') {
          target.hitStun = Math.max(target.hitStun || 0, 120);
        }
        addDamageNumber(target.x, target.y, dmg, isCompanionMagicProfile(profile) ? 'magic' : 'normal');
        addParticles(target.x, target.y, profile.companionColor || '#7dd3fc', 5);
        if (target.hp <= 0) killEnemy(target);
      }
    } else {
      moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
      useCompanionSkill(cId, cs, null, behavior);
    }
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────
