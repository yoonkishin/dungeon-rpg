'use strict';

// ─── Enemy Spawning ──────────────────────────────────────────────────────────
function spawnEnemies() {
  enemies = [];
  droppedItems = [];
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
    typeIdx: typeIdx,
    isBoss: false,
  };
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

