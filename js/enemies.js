'use strict';

// ─── Enemy Spawning ──────────────────────────────────────────────────────────
function spawnEnemies() {
  enemies = [];
  droppedItems = [];
  enemyEffects = [];
  if (currentMap === 'town') {
    // No enemies in town
  } else if (currentMap === 'field') {
    spawnFieldEnemies();
  } else if (currentMap === 'dungeon') {
    spawnDungeonEnemies();
  }
}

function spawnFieldEnemies() {
  // Near town (y > 40): weak enemies
  spawnFieldGroup(0, 6, [42,56], [2,77]);
  spawnFieldGroup(1, 5, [42,56], [2,77]);
  // Mid field (y 20-40): medium enemies
  spawnFieldGroup(1, 4, [22,38], [2,77]);
  spawnFieldGroup(2, 4, [22,38], [2,77]);
  spawnFieldGroup(3, 3, [22,38], [2,77]);
  // Far field (y < 20): strong enemies
  spawnFieldGroup(3, 4, [2,18], [2,77]);
  spawnFieldGroup(4, 3, [2,18], [2,77]);
}

function spawnFieldGroup(typeIdx, count, yRange, xRange) {
  const t = ENEMY_TYPES[typeIdx];
  for (let i = 0; i < count; i++) {
    const tx = xRange[0] + Math.random() * (xRange[1] - xRange[0]);
    const ty = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
    const gx = Math.floor(tx), gy = Math.floor(ty);
    const tile = maps.field[gy] && maps.field[gy][gx];
    if (tile === TILE_WATER || tile === TILE_TREE || tile === TILE_WALL || tile === TILE_PORTAL || tile === TILE_EXIT) continue;
    enemies.push(createEnemy(tx, ty, t, typeIdx));
  }
}

function spawnDungeonEnemies() {
  if (typeof isEmblemTrialActive === 'function' && isEmblemTrialActive()) {
    const emblem = getCurrentEmblemTrialDef();
    const trialProfile = emblem ? getEmblemTrialEnemyProfile(emblem.id) : null;
    if (trialProfile) {
      enemies.push({
        x: 10 * TILE + TILE/2,
        y: 6 * TILE + TILE/2,
        w: 34, h: 34,
        hp: trialProfile.hp,
        maxHp: trialProfile.hp,
        atk: trialProfile.atk,
        speed: trialProfile.speed,
        xp: trialProfile.xp,
        gold: trialProfile.gold,
        color: trialProfile.color,
        name: trialProfile.name,
        aggroRange: 320,
        attackRange: 42,
        state: 'wander',
        wanderTimer: Math.random() * 180,
        wanderDx: 0, wanderDy: 0,
        attackTimer: 0,
        attackCooldown: 980,
        flashTimer: 0,
        dead: false,
        frame: 0,
        frameTimer: 0,
        hitStun: 0,
        knockbackVx: 0,
        knockbackVy: 0,
        attackWindup: 0,
        specialTimer: 1200,
        specialCooldown: 2800,
        bossSkillType: trialProfile.bossSkillType,
        bossSkillName: trialProfile.bossSkillName,
        bossSkillColor: trialProfile.bossSkillColor,
        phaseThresholds: [0.55],
        phaseTriggered: [false],
        phaseRank: 0,
        summonTypeIdx: 0,
        eliteSupportTypeIdx: 0,
        typeIdx: 0,
        isBoss: true,
        isTrialBoss: true,
      });
    }
    return;
  }

  const info = currentDungeonId >= 0 ? DUNGEON_INFO[currentDungeonId] : null;
  const difficulty = currentDungeonId >= 0 ? currentDungeonId : 2;

  // Regular enemies scaled to dungeon difficulty
  const typeMin = Math.min(difficulty, ENEMY_TYPES.length - 1);
  const typeMax = Math.min(difficulty + 1, ENEMY_TYPES.length - 1);

  for (let i = 0; i < 5 + difficulty; i++) {
    const typeIdx = typeMin + Math.floor(Math.random() * (typeMax - typeMin + 1));
    const tx = 3 + Math.random() * 14;
    const ty = 3 + Math.random() * 9;
    const gx = Math.floor(tx), gy = Math.floor(ty);
    const tile = maps.dungeon[gy] && maps.dungeon[gy][gx];
    if (tile === TILE_WALL || tile === TILE_EXIT) continue;
    const e = createEnemy(tx, ty, ENEMY_TYPES[typeIdx], typeIdx);
    // Scale stats based on dungeon
    e.hp += difficulty * 20;
    e.maxHp = e.hp;
    e.atk += difficulty * 5;
    enemies.push(e);
  }

  // Dungeon elite enemy
  const eliteSpawned = spawnDungeonElite(typeMax, difficulty);

  // Boss enemy
  if (info) {
    const boss = {
      x: 10 * TILE + TILE/2,
      y: 6 * TILE + TILE/2,
      w: 36, h: 36,
      hp: info.bossHp + player.level * 10,
      maxHp: info.bossHp + player.level * 10,
      atk: info.bossAtk + player.level * 3,
      speed: 0.6,
      xp: 100 + difficulty * 30,
      gold: 50 + difficulty * 20,
      color: info.bossColor,
      name: info.bossName,
      aggroRange: 300,
      attackRange: 40,
      state: 'wander',
      wanderTimer: Math.random() * 180,
      wanderDx: 0, wanderDy: 0,
      attackTimer: 0,
      attackCooldown: 1000,
      flashTimer: 0,
      dead: false,
      frame: 0,
      frameTimer: 0,
      hitStun: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      attackWindup: 0,
      specialTimer: 1800,
      specialCooldown: Math.max(2600, 4200 - difficulty * 180),
      bossSkillType: info.bossSkillType,
      bossSkillName: info.bossSkillName,
      bossSkillColor: info.bossSkillColor,
      phaseThresholds: [0.7, 0.35],
      phaseTriggered: [false, false],
      phaseRank: 0,
      summonTypeIdx: typeMin,
      eliteSupportTypeIdx: typeMax,
      eliteSupportActive: eliteSpawned,
      typeIdx: Math.min(difficulty, ENEMY_TYPES.length - 1),
      isBoss: true,
    };
    enemies.push(boss);
  }
}

function createEnemy(tx, ty, t, typeIdx) {
  return {
    x: tx * TILE + TILE/2,
    y: ty * TILE + TILE/2,
    w: t.size, h: t.size,
    hp: t.hp + (player.level - 1) * 5,
    maxHp: t.hp + (player.level - 1) * 5,
    atk: t.atk + (player.level - 1) * 2,
    speed: t.speed,
    xp: t.xp,
    gold: t.gold,
    color: t.color,
    name: t.name,
    aggroRange: t.aggroRange,
    attackRange: t.attackRange,
    state: 'wander',
    wanderTimer: Math.random() * 180,
    wanderDx: 0, wanderDy: 0,
    attackTimer: 0,
    attackCooldown: 1200 + Math.random() * 400,
    flashTimer: 0,
    dead: false,
    frame: 0,
    frameTimer: 0,
    hitStun: 0,
    knockbackVx: 0,
    knockbackVy: 0,
    attackWindup: 0,
    typeIdx: typeIdx,
    isBoss: false,
    isElite: false,
  };
}

function createEliteEnemy(tx, ty, typeIdx, difficulty, titlePrefix = '정예') {
  const base = createEnemy(tx, ty, ENEMY_TYPES[typeIdx], typeIdx);
  base.isElite = true;
  base.name = titlePrefix + ' ' + base.name;
  base.w += 4;
  base.h += 4;
  base.hp = Math.floor(base.hp * 1.8) + difficulty * 30;
  base.maxHp = base.hp;
  base.atk += 8 + difficulty * 4;
  base.speed += 0.08;
  base.attackCooldown = Math.max(780, base.attackCooldown - 180);
  base.xp = Math.floor(base.xp * 2.2);
  base.gold = Math.floor(base.gold * 2);
  return base;
}

function spawnDungeonElite(typeIdx, difficulty) {
  for (let tries = 0; tries < 12; tries++) {
    const tx = 4 + Math.random() * 12;
    const ty = 4 + Math.random() * 7;
    const gx = Math.floor(tx), gy = Math.floor(ty);
    const tile = maps.dungeon[gy] && maps.dungeon[gy][gx];
    if (tile === TILE_WALL || tile === TILE_EXIT) continue;
    enemies.push(createEliteEnemy(tx, ty, typeIdx, difficulty));
    return true;
  }
  return false;
}

function spawnBossReinforcements(boss, count, typeIdx) {
  const difficulty = currentDungeonId >= 0 ? currentDungeonId : 0;
  for (let i = 0; i < count; i++) {
    for (let tries = 0; tries < 10; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const distTiles = 1.8 + Math.random() * 2.4;
      const tx = (boss.x / TILE) + Math.cos(angle) * distTiles;
      const ty = (boss.y / TILE) + Math.sin(angle) * distTiles;
      const gx = Math.floor(tx), gy = Math.floor(ty);
      const tile = maps.dungeon[gy] && maps.dungeon[gy][gx];
      if (tile === TILE_WALL || tile === TILE_EXIT) continue;
      const add = createEnemy(tx, ty, ENEMY_TYPES[typeIdx], typeIdx);
      add.hp += difficulty * 12;
      add.maxHp = add.hp;
      add.atk += difficulty * 3;
      enemies.push(add);
      addParticles(add.x, add.y, boss.bossSkillColor || boss.color, 8);
      break;
    }
  }
}

function spawnGroup(typeIdx, count, yRange, xRange, id) {
  const t = ENEMY_TYPES[typeIdx];
  for (let i = 0; i < count; i++) {
    const tx = xRange[0] + Math.random() * (xRange[1] - xRange[0]);
    const ty = yRange[0] + Math.random() * (yRange[1] - yRange[0]);
    const gx = Math.floor(tx), gy = Math.floor(ty);
    const tile = getMap()[gy] && getMap()[gy][gx];
    if (tile === TILE_WATER || tile === TILE_TREE || tile === TILE_WALL) continue;
    enemies.push(createEnemy(tx, ty, t, typeIdx));
  }
}

