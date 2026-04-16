'use strict';

const HERO_CHARACTER_ID = 'hero';
// 커맨더 전환 시 per-character로 스왑되는 필드들.
// 문장 관련 상태(emblemIds/activeEmblemId/masterEmblemId/tier8*/tier9*/emblemFusionHistory/
// appliedEmblemBonusIds)는 프로토타입에서 **글로벌 공유 풀**로 다룬다. lightsaber_test
// 정본은 per-character지만, 이 저장소는 플레이어 한 명이 모든 라인을 순회하며 재료를
// 모으는 구조라 공유 풀이 UX와 멘탈 모델에 훨씬 맞는다. 합체 판정(playerHasEmblem)도
// player.emblemIds를 직접 읽으므로 공유 저장소 하나로 충분하다.
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
];
const COMMANDER_PLAYER_ARRAY_SNAPSHOT_KEYS = [
  'classHistory',
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
  const entry = getOwnedCharacter(characterId);
  if (entry && entry.dead) return true;
  const cId = parseCompanionCharacterId(characterId);
  return cId !== null ? deadCompanions.includes(cId) : false;
}

function isCharacterGhost(characterId) {
  return isCharacterDead(characterId);
}

function isCurrentCommanderGhost() {
  return !!currentCommanderId && isCharacterGhost(currentCommanderId);
}

function requireLivingCommanderForProgression(message) {
  if (!isCurrentCommanderGhost()) return true;
  if (typeof showToast === 'function') {
    showToast(message || '현재 지휘관이 유령 상태입니다. 신전에서 먼저 부활하세요');
  }
  return false;
}

function getCharacterReviveCost(characterId) {
  return 200;
}

function getDeadCharacterIds() {
  syncOwnedCharactersFromRoster();
  return (Array.isArray(ownedCharacters) ? ownedCharacters : [])
    .filter(entry => entry && entry.dead)
    .map(entry => entry.characterId);
}

function markCharacterGhost(characterId, options = {}) {
  const { skipNormalize = false } = options;
  syncOwnedCharactersFromRoster();
  const entry = getOwnedCharacter(characterId);
  if (!entry) return false;

  entry.dead = true;
  entry.hp = 0;
  if (typeof entry.mp === 'number' && entry.mp < 0) entry.mp = 0;

  const cId = parseCompanionCharacterId(characterId);
  if (cId !== null) {
    if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
    activeCompanions = activeCompanions.filter(id => id !== cId);
    delete companionStates[cId];
  }

  if (!skipNormalize) normalizeCommanderState();
  return true;
}

function reviveCharacter(characterId, options = {}) {
  const { skipNormalize = false } = options;
  syncOwnedCharactersFromRoster();
  const entry = getOwnedCharacter(characterId);
  if (!entry || !entry.dead) return false;

  entry.dead = false;
  entry.hp = typeof entry.maxHp === 'number'
    ? entry.maxHp
    : (isHeroCharacterId(characterId) ? player.maxHp : getCompanionMaxHp(parseCompanionCharacterId(characterId)));
  if (typeof entry.maxMp === 'number') entry.mp = entry.maxMp;

  const cId = parseCompanionCharacterId(characterId);
  if (cId !== null) {
    deadCompanions = deadCompanions.filter(id => id !== cId);
    delete companionStates[cId];
  }

  if (!skipNormalize) normalizeCommanderState();
  if (currentCommanderId === characterId && typeof applyOwnedCharacterStateToPlayer === 'function') {
    applyOwnedCharacterStateToPlayer(characterId);
    player.dead = false;
    player.invincible = 0;
  }
  return true;
}

function reviveAllDeadCharacters() {
  const deadIds = getDeadCharacterIds();
  if (!deadIds.length) return false;
  deadIds.forEach(characterId => reviveCharacter(characterId, { skipNormalize: true }));
  normalizeCommanderState();
  if (typeof applyOwnedCharacterStateToPlayer === 'function' && currentCommanderId) {
    applyOwnedCharacterStateToPlayer(currentCommanderId);
    player.dead = false;
    player.invincible = 0;
  }
  return true;
}

function markEntireActivePartyGhost() {
  const partyIds = Array.isArray(activePartyCharacterIds) ? activePartyCharacterIds.slice() : [];
  if (!partyIds.length) return false;
  partyIds.forEach(characterId => markCharacterGhost(characterId, { skipNormalize: true }));
  normalizeCommanderState();
  return true;
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
    dead: !!heroExisting.dead,
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
  entry.dead = !!entry.dead;

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

function createPartyPusher(partyArray) {
  return (characterId, options = {}) => {
    const { includeDead = false } = options;
    if (!characterId) return;
    if (partyArray.includes(characterId)) return;
    if (!getOwnedCharacter(characterId)) return;
    if (!includeDead && isCharacterDead(characterId)) return;
    if (partyArray.length >= MAX_ACTIVE_COMPANIONS + 1) return;
    partyArray.push(characterId);
  };
}

function syncCommanderModelFromLegacyPartyState() {
  syncOwnedCharactersFromRoster();
  if (!getOwnedCharacter(currentCommanderId)) currentCommanderId = HERO_CHARACTER_ID;

  const preservedDeadParty = (Array.isArray(activePartyCharacterIds) ? activePartyCharacterIds : [])
    .filter(characterId => characterId !== currentCommanderId && getOwnedCharacter(characterId) && isCharacterDead(characterId));
  const nextParty = [];
  const pushCharacter = createPartyPusher(nextParty);

  pushCharacter(currentCommanderId, { includeDead: true });
  preservedDeadParty.forEach(characterId => pushCharacter(characterId, { includeDead: true }));
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
  if (!getOwnedCharacter(currentCommanderId)) {
    currentCommanderId = HERO_CHARACTER_ID;
  }

  if (!Array.isArray(activePartyCharacterIds) || activePartyCharacterIds.length === 0) {
    syncCommanderModelFromLegacyPartyState();
  } else {
    const nextParty = [];
    const pushCharacter = createPartyPusher(nextParty);

    pushCharacter(currentCommanderId, { includeDead: true });
    activePartyCharacterIds.forEach(characterId => pushCharacter(characterId, { includeDead: true }));
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
  if (isCurrentCommanderGhost()) return false;
  if (!getOwnedCharacter(characterId)) return false;
  if (isCharacterDead(characterId)) return false;
  if (currentCommanderId === characterId) return true;

  snapshotPlayerStateToOwnedCharacter(currentCommanderId || HERO_CHARACTER_ID);

  currentCommanderId = characterId;

  const nextParty = [];
  const pushCharacter = createPartyPusher(nextParty);

  pushCharacter(characterId, { includeDead: true });

  const fallbackCandidates = []
    .concat(activePartyCharacterIds || [])
    .concat(activeCompanions.map(cId => getCompanionCharacterId(cId)));
  fallbackCandidates.forEach(candidateId => pushCharacter(candidateId, { includeDead: true }));

  activePartyCharacterIds = nextParty;
  syncLegacyPartyStateFromCommanderModel();
  syncCommanderModelFromLegacyPartyState();
  applyOwnedCharacterStateToPlayer(characterId);
  return true;
}

function buildRuntimeStateForCharacter(characterId) {
  const entry = getOwnedCharacter(characterId);
  if (!entry) return null;

  const usingCurrentPlayerSnapshot = currentCommanderId === characterId;
  const companionId = parseCompanionCharacterId(characterId);
  const companionState = companionId !== null ? companionStates[companionId] : null;
  return {
    characterId,
    hp: typeof entry.hp === 'number' ? entry.hp : (companionState ? companionState.hp : (usingCurrentPlayerSnapshot ? player.hp : player.maxHp)),
    maxHp: typeof entry.maxHp === 'number' ? entry.maxHp : (companionState ? companionState.maxHp : (usingCurrentPlayerSnapshot ? player.maxHp : player.maxHp)),
    mp: typeof entry.mp === 'number' ? entry.mp : (usingCurrentPlayerSnapshot ? player.mp : player.maxMp),
    maxMp: typeof entry.maxMp === 'number' ? entry.maxMp : (usingCurrentPlayerSnapshot ? player.maxMp : player.maxMp),
    dead: !!entry.dead || isCharacterDead(characterId),
    x: companionState ? companionState.x : player.x,
    y: companionState ? companionState.y : player.y,
    dir: player.dir || 0,
    attackTimer: usingCurrentPlayerSnapshot ? (player.attackTimer || 0) : (companionState ? (companionState.attackTimer || 0) : 0),
    invincible: usingCurrentPlayerSnapshot ? (player.invincible || 0) : 0,
    skillCooldowns: usingCurrentPlayerSnapshot ? { ...skillCooldowns } : (entry.cooldowns && typeof entry.cooldowns === 'object' ? { ...entry.cooldowns } : {}),
    skillPageIndex: usingCurrentPlayerSnapshot ? currentSkillPage : (typeof entry.skillPageIndex === 'number' ? entry.skillPageIndex : 0),
    skillPages: usingCurrentPlayerSnapshot ? cloneSkillPagesState() : (Array.isArray(entry.skillPages) ? cloneSkillPagesState(entry.skillPages) : cloneSkillPagesState()),
    equipment: usingCurrentPlayerSnapshot ? cloneEquippedState() : (entry.equipment && typeof entry.equipment === 'object' ? cloneEquippedState(entry.equipment) : buildEmptyEquippedState()),
    aiBehavior: entry.aiBehavior || characterAIModes[characterId] || null,
  };
}

function initializePartyRuntimeStates() {
  syncOwnedCharactersFromRoster();
  partyRuntimeStates = {};

  (activePartyCharacterIds || []).forEach(characterId => {
    const runtimeState = buildRuntimeStateForCharacter(characterId);
    if (!runtimeState) return;
    runtimeState.x = player.x;
    runtimeState.y = player.y;
    partyRuntimeStates[characterId] = runtimeState;
  });

  combatSwitchCooldownMs = 0;
  combatSwitchNotice = null;
  return Object.keys(partyRuntimeStates).length;
}

function getPartyRuntimeState(characterId) {
  return partyRuntimeStates && partyRuntimeStates[characterId]
    ? partyRuntimeStates[characterId]
    : null;
}

function syncCompanionStateToRuntimeState(cId) {
  const runtimeState = getPartyRuntimeState(getCompanionCharacterId(cId));
  const companionState = companionStates[cId];
  if (!runtimeState || !companionState) return null;

  runtimeState.hp = companionState.hp;
  runtimeState.maxHp = companionState.maxHp;
  runtimeState.dead = companionState.hp <= 0;
  runtimeState.x = companionState.x;
  runtimeState.y = companionState.y;
  runtimeState.attackTimer = companionState.attackTimer || 0;
  return runtimeState;
}

function syncRuntimeStateToCompanionState(cId) {
  const runtimeState = getPartyRuntimeState(getCompanionCharacterId(cId));
  if (!runtimeState) return null;

  const nextState = companionStates[cId] || {};
  nextState.x = typeof runtimeState.x === 'number' ? runtimeState.x : player.x;
  nextState.y = typeof runtimeState.y === 'number' ? runtimeState.y : player.y;
  nextState.hp = typeof runtimeState.hp === 'number' ? runtimeState.hp : getCompanionMaxHp(cId);
  nextState.maxHp = typeof runtimeState.maxHp === 'number' ? runtimeState.maxHp : getCompanionMaxHp(cId);
  nextState.attackTimer = runtimeState.attackTimer || 0;
  nextState.skillTimer = typeof nextState.skillTimer === 'number' ? nextState.skillTimer : Math.random() * 1200;
  nextState.flashTimer = nextState.flashTimer || 0;
  nextState.aiMode = getCompanionAIMode(cId);
  nextState.targetCache = null;
  nextState.targetCooldown = 0;
  companionStates[cId] = nextState;
  return nextState;
}

function syncControlledCompanionPresence(previousCharacterId, nextCharacterId) {
  const previousCompanionId = parseCompanionCharacterId(previousCharacterId);
  const nextCompanionId = parseCompanionCharacterId(nextCharacterId);

  if (previousCompanionId !== null && previousCompanionId !== nextCompanionId) {
    const previousRuntimeState = getPartyRuntimeState(getCompanionCharacterId(previousCompanionId));
    syncRuntimeStateToCompanionState(previousCompanionId);
    if (previousRuntimeState && !previousRuntimeState.dead && previousRuntimeState.hp > 0 && !activeCompanions.includes(previousCompanionId)) {
      activeCompanions.push(previousCompanionId);
    }
  }

  if (nextCompanionId !== null) {
    syncCompanionStateToRuntimeState(nextCompanionId);
    activeCompanions = activeCompanions.filter(id => id !== nextCompanionId);
    delete companionStates[nextCompanionId];
  }
}

function syncPartyRuntimeStateToOwnedCharacter(characterId) {
  const runtimeState = getPartyRuntimeState(characterId);
  const entry = getOwnedCharacter(characterId);
  if (!runtimeState || !entry) return null;

  entry.hp = runtimeState.hp;
  entry.maxHp = runtimeState.maxHp;
  entry.mp = runtimeState.mp;
  entry.maxMp = runtimeState.maxMp;
  entry.dead = !!runtimeState.dead;
  entry.cooldowns = { ...(runtimeState.skillCooldowns || {}) };
  entry.skillPageIndex = runtimeState.skillPageIndex;
  entry.skillPages = Array.isArray(runtimeState.skillPages) ? cloneSkillPagesState(runtimeState.skillPages) : [];
  entry.skills = entry.skillPages.flat().filter(Boolean);
  entry.equipment = runtimeState.equipment && typeof runtimeState.equipment === 'object'
    ? cloneEquippedState(runtimeState.equipment)
    : buildEmptyEquippedState();
  return entry;
}

function syncPartyRuntimeStatesToOwnedCharacters() {
  Object.keys(partyRuntimeStates || {}).forEach(characterId => {
    syncPartyRuntimeStateToOwnedCharacter(characterId);
  });
}

function snapshotControlledPlayerToRuntimeState() {
  if (!combatControlledCharacterId) return null;
  const runtimeState = getPartyRuntimeState(combatControlledCharacterId);
  if (!runtimeState) return null;

  runtimeState.hp = player.hp;
  runtimeState.maxHp = player.maxHp;
  runtimeState.mp = player.mp;
  runtimeState.maxMp = player.maxMp;
  runtimeState.dead = !!player.dead || player.hp <= 0;
  runtimeState.x = player.x;
  runtimeState.y = player.y;
  runtimeState.dir = player.dir || 0;
  runtimeState.attackTimer = player.attackTimer || 0;
  runtimeState.invincible = player.invincible || 0;
  runtimeState.skillCooldowns = { ...skillCooldowns };
  runtimeState.skillPageIndex = currentSkillPage;
  runtimeState.skillPages = cloneSkillPagesState();
  runtimeState.equipment = cloneEquippedState();
  return runtimeState;
}

function applyRuntimeStateToPlayer(characterId) {
  const runtimeState = getPartyRuntimeState(characterId);
  if (!runtimeState) return false;
  if (!applyOwnedCharacterStateToPlayer(characterId)) return false;

  player.hp = typeof runtimeState.hp === 'number' ? runtimeState.hp : player.hp;
  player.maxHp = typeof runtimeState.maxHp === 'number' ? runtimeState.maxHp : player.maxHp;
  player.mp = typeof runtimeState.mp === 'number' ? runtimeState.mp : player.mp;
  player.maxMp = typeof runtimeState.maxMp === 'number' ? runtimeState.maxMp : player.maxMp;
  player.dead = !!runtimeState.dead;
  player.x = typeof runtimeState.x === 'number' ? runtimeState.x : player.x;
  player.y = typeof runtimeState.y === 'number' ? runtimeState.y : player.y;
  player.dir = runtimeState.dir || 0;
  player.attackTimer = runtimeState.attackTimer || 0;
  player.invincible = runtimeState.invincible || 0;

  Object.keys(skillCooldowns).forEach(key => delete skillCooldowns[key]);
  Object.entries(runtimeState.skillCooldowns || {}).forEach(([key, value]) => {
    skillCooldowns[key] = value;
  });

  if (Array.isArray(runtimeState.skillPages)) {
    applySkillPagesState(runtimeState.skillPages);
  }
  currentSkillPage = typeof runtimeState.skillPageIndex === 'number' ? runtimeState.skillPageIndex : 0;

  if (runtimeState.equipment && typeof runtimeState.equipment === 'object') {
    Object.keys(equipped).forEach(slot => {
      equipped[slot] = runtimeState.equipment[slot] ? { ...runtimeState.equipment[slot] } : null;
    });
  }

  hudDirty = true;
  skillSlotsDirty = true;
  return true;
}

function setCombatControlledCharacter(characterId, reason = 'manual') {
  if (!getPartyRuntimeState(characterId)) return false;
  if (combatControlledCharacterId === characterId) return true;

  const previousCharacterId = combatControlledCharacterId;
  if (combatControlledCharacterId) snapshotControlledPlayerToRuntimeState();
  syncControlledCompanionPresence(previousCharacterId, characterId);
  if (!applyRuntimeStateToPlayer(characterId)) return false;

  combatControlledCharacterId = characterId;
  combatSwitchCooldownMs = 1000;
  combatSwitchNotice = {
    characterId,
    timerMs: 1200,
    reason,
  };

  if (typeof updateHUD === 'function') updateHUD();
  if (typeof renderSkillSlots === 'function') renderSkillSlots();
  if (typeof updateCombatSwitchHud === 'function') updateCombatSwitchHud();
  return true;
}

function clearPartyRuntimeStates(options = {}) {
  const { restoreCommanderPlayerState = true } = options;

  if (combatControlledCharacterId) {
    snapshotControlledPlayerToRuntimeState();
    syncControlledCompanionPresence(combatControlledCharacterId, null);
  }
  syncPartyRuntimeStatesToOwnedCharacters();

  if (restoreCommanderPlayerState && getOwnedCharacter(currentCommanderId || HERO_CHARACTER_ID)) {
    applyOwnedCharacterStateToPlayer(currentCommanderId || HERO_CHARACTER_ID);
    player.dead = false;
    player.invincible = 0;
  }

  combatControlledCharacterId = null;
  combatSwitchCooldownMs = 0;
  combatSwitchNotice = null;
  partyRuntimeStates = {};
}

function getLivingPartyCharacterIds() {
  return (activePartyCharacterIds || []).filter(characterId => {
    const runtimeState = getPartyRuntimeState(characterId);
    return !!(runtimeState && !runtimeState.dead && runtimeState.hp > 0);
  });
}

function canSwitchToCharacter(characterId) {
  if (!isCombatControlActive()) return false;
  if (!characterId) return false;
  if (characterId === combatControlledCharacterId) return false;
  if (!(activePartyCharacterIds || []).includes(characterId)) return false;

  const runtimeState = getPartyRuntimeState(characterId);
  if (!runtimeState) return false;
  if (runtimeState.dead || runtimeState.hp <= 0) return false;
  if (combatSwitchCooldownMs > 0) return false;
  return true;
}

function getSwitchablePartyCharacterIds() {
  return (activePartyCharacterIds || []).filter(characterId => canSwitchToCharacter(characterId));
}

function interruptCurrentControlledCharacterAction() {
  player.isAttacking = false;
  player.attackArc = 0;
}

function forceRefreshControlledHud() {
  hudDirty = true;
  skillSlotsDirty = true;
  if (typeof updateHUD === 'function') updateHUD();
  if (typeof renderSkillSlots === 'function') renderSkillSlots();
  if (typeof updateCombatSwitchHud === 'function') updateCombatSwitchHud();
}

function requestCombatCharacterSwitch(targetCharacterId) {
  if (!canSwitchToCharacter(targetCharacterId)) return false;
  const companionId = parseCompanionCharacterId(targetCharacterId);
  if (companionId !== null) syncCompanionStateToRuntimeState(companionId);
  interruptCurrentControlledCharacterAction();
  const switched = setCombatControlledCharacter(targetCharacterId, 'manual');
  if (!switched) return false;
  forceRefreshControlledHud();
  return true;
}

function findNextLivingPartyCharacterId(fromCharacterId) {
  const party = activePartyCharacterIds || [];
  const startIndex = party.indexOf(fromCharacterId);
  if (startIndex < 0) return null;

  for (let i = startIndex + 1; i < party.length; i++) {
    const candidateId = party[i];
    const runtimeState = getPartyRuntimeState(candidateId);
    if (runtimeState && !runtimeState.dead && runtimeState.hp > 0) return candidateId;
  }

  for (let i = 0; i < startIndex; i++) {
    const candidateId = party[i];
    const runtimeState = getPartyRuntimeState(candidateId);
    if (runtimeState && !runtimeState.dead && runtimeState.hp > 0) return candidateId;
  }

  return null;
}

function handleControlledCharacterDeath() {
  if (!combatControlledCharacterId) return false;
  const currentId = combatControlledCharacterId;
  const runtimeState = getPartyRuntimeState(currentId);
  if (!runtimeState) return false;
  if (!runtimeState.dead && runtimeState.hp > 0) return false;

  const nextId = findNextLivingPartyCharacterId(currentId);
  if (!nextId) return false;
  const switched = setCombatControlledCharacter(nextId, 'auto');
  if (!switched) return false;
  forceRefreshControlledHud();
  return true;
}
