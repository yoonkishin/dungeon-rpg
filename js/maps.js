'use strict';

const OW_W = 40, OW_H = 30;
function buildTown() {
  const m = [];
  for (let y = 0; y < OW_H; y++) {
    m[y] = [];
    for (let x = 0; x < OW_W; x++) {
      m[y][x] = TILE_GRASS;
    }
  }
  // Border walls (was water)
  for (let x = 0; x < OW_W; x++) { m[0][x] = TILE_WALL; m[OW_H-1][x] = TILE_WALL; }
  for (let y = 0; y < OW_H; y++) { m[y][0] = TILE_WALL; m[y][OW_W-1] = TILE_WALL; }

  for (let x = 1; x < OW_W-1; x++) { m[15][x] = TILE_DIRT; m[14][x] = TILE_DIRT; }
  for (let y = 6; y < 15; y++) { m[y][10] = TILE_DIRT; m[y][11] = TILE_DIRT; }
  for (let y = 15; y < 25; y++) { m[y][28] = TILE_DIRT; m[y][29] = TILE_DIRT; }

  const villageTrees = [
    [5,5],[5,6],[6,5],[5,14],[6,14],[14,5],[14,6],[13,5],
    [5,18],[5,19],[6,18],[14,18],[14,19]
  ];
  villageTrees.forEach(([y,x]) => { if (x>0&&x<OW_W-1&&y>0&&y<OW_H-1) m[y][x] = TILE_TREE; });

  for (let y = 6; y < 14; y++) {
    for (let x = 7; x < 15; x++) {
      m[y][x] = TILE_GRASS;
    }
  }

  for (let x = 7; x < 15; x++) { m[9][x] = TILE_DIRT; m[10][x] = TILE_DIRT; }
  for (let y = 6; y < 14; y++) { m[y][10] = TILE_DIRT; m[y][11] = TILE_DIRT; }

  [[7,8],[7,9],[8,8],[8,9]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  [[7,12],[7,13],[8,12],[8,13]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  [[11,8],[11,9],[12,8],[12,9]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  [[11,12],[11,13],[12,12],[12,13]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });

  for (let y = 2; y < 13; y++) {
    for (let x = 22; x < OW_W-1; x++) {
      if ((x+y)%3 !== 0) m[y][x] = TILE_TREE;
    }
  }
  for (let x = 22; x < OW_W-2; x++) { m[7][x] = TILE_DIRT; }
  for (let y = 2; y < 13; y++) { m[y][26] = TILE_DIRT; }

  // Town exits (east side)
  m[14][OW_W-1] = TILE_EXIT;
  m[15][OW_W-1] = TILE_EXIT;
  // North exit
  m[0][19] = TILE_EXIT;
  m[0][20] = TILE_EXIT;

  return m;
}

// Field: 80x60 tiles
const FIELD_W = 80, FIELD_H = 60;
function buildField() {
  const m = [];
  for (let y = 0; y < FIELD_H; y++) {
    m[y] = [];
    for (let x = 0; x < FIELD_W; x++) {
      m[y][x] = TILE_GRASS;
    }
  }
  // Border walls
  for (let x = 0; x < FIELD_W; x++) { m[0][x] = TILE_WALL; m[FIELD_H-1][x] = TILE_WALL; }
  for (let y = 0; y < FIELD_H; y++) { m[y][0] = TILE_WALL; m[y][FIELD_W-1] = TILE_WALL; }

  // Town entrance at bottom-center
  for (let x = 38; x <= 41; x++) m[FIELD_H-2][x] = TILE_EXIT;

  // Dirt paths from town entrance spreading out
  for (let y = FIELD_H-3; y > 30; y--) { m[y][39] = TILE_DIRT; m[y][40] = TILE_DIRT; }
  // East-west path
  for (let x = 10; x < 70; x++) { m[30][x] = TILE_DIRT; }
  // North path
  for (let y = 5; y < 30; y++) { m[y][39] = TILE_DIRT; m[y][40] = TILE_DIRT; }

  // Forest patches
  const forestAreas = [
    {x:5, y:5, w:15, h:12, density:0.6},
    {x:60, y:5, w:18, h:15, density:0.5},
    {x:5, y:40, w:20, h:15, density:0.5},
    {x:55, y:35, w:20, h:15, density:0.4},
  ];
  forestAreas.forEach(f => {
    for (let y = f.y; y < f.y + f.h && y < FIELD_H-1; y++) {
      for (let x = f.x; x < f.x + f.w && x < FIELD_W-1; x++) {
        if (Math.random() < f.density && m[y][x] === TILE_GRASS) m[y][x] = TILE_TREE;
      }
    }
  });
  // Clear paths through forests
  forestAreas.forEach(f => {
    const midY = f.y + Math.floor(f.h/2);
    const midX = f.x + Math.floor(f.w/2);
    for (let x = f.x; x < f.x + f.w; x++) { if (m[midY]) m[midY][x] = TILE_DIRT; }
    for (let y = f.y; y < f.y + f.h; y++) { if (m[y]) m[y][midX] = TILE_DIRT; }
  });

  // Water/swamp areas
  for (let y = 20; y < 28; y++) {
    for (let x = 20; x < 30; x++) {
      if (Math.random() < 0.4) m[y][x] = TILE_WATER;
    }
  }

  // Scattered stones
  for (let i = 0; i < 30; i++) {
    const rx = 2 + Math.floor(Math.random() * (FIELD_W-4));
    const ry = 2 + Math.floor(Math.random() * (FIELD_H-4));
    if (m[ry][rx] === TILE_GRASS) m[ry][rx] = TILE_STONE;
  }

  // 9 Dungeon portals
  DUNGEON_INFO.forEach(dl => {
    m[dl.portalY][dl.portalX] = TILE_PORTAL;
    if (dl.portalX+1 < FIELD_W-1) m[dl.portalY][dl.portalX+1] = TILE_PORTAL;
    // Clear area around portal
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 2; dx++) {
        const ny = dl.portalY + dy, nx = dl.portalX + dx;
        if (ny > 0 && ny < FIELD_H-1 && nx > 0 && nx < FIELD_W-1 && m[ny][nx] !== TILE_PORTAL) {
          m[ny][nx] = TILE_DIRT;
        }
      }
    }
  });

  return m;
}

const DG_W = 20, DG_H = 15;

function createDungeonGrid(fill = TILE_WALL) {
  const m = [];
  for (let y = 0; y < DG_H; y++) {
    m[y] = [];
    for (let x = 0; x < DG_W; x++) m[y][x] = fill;
  }
  return m;
}

function carveRect(m, x1, y1, x2, y2, tile = TILE_FLOOR) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (x > 0 && x < DG_W - 1 && y > 0 && y < DG_H - 1) m[y][x] = tile;
    }
  }
}

function carveH(m, y, x1, x2, tile = TILE_FLOOR) {
  carveRect(m, Math.min(x1, x2), y, Math.max(x1, x2), y, tile);
}

function carveV(m, x, y1, y2, tile = TILE_FLOOR) {
  carveRect(m, x, Math.min(y1, y2), x, Math.max(y1, y2), tile);
}

function addExitAndSpawnLane(m) {
  carveRect(m, 9, 10, 12, 12, TILE_FLOOR);
  carveRect(m, 9, 2, 12, 6, TILE_FLOOR);
  carveV(m, 10, 2, 12, TILE_FLOOR);
  carveV(m, 11, 2, 12, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
}

function buildOpenDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 2, 2, 17, 12, TILE_FLOOR);
  [[4,4],[4,15],[10,4],[10,15],[6,9],[8,11]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  addExitAndSpawnLane(m);
  return m;
}

function buildForkDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 8, 10, 12, 12, TILE_FLOOR);
  carveV(m, 10, 3, 12, TILE_FLOOR);
  carveV(m, 11, 3, 12, TILE_FLOOR);
  carveRect(m, 3, 3, 7, 6, TILE_FLOOR);
  carveRect(m, 12, 3, 16, 6, TILE_FLOOR);
  carveRect(m, 8, 4, 12, 7, TILE_FLOOR);
  carveH(m, 6, 7, 12, TILE_FLOOR);
  carveH(m, 6, 10, 12, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildCatacombDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 9, 10, 12, 12, TILE_FLOOR);
  carveV(m, 10, 2, 12, TILE_FLOOR);
  carveV(m, 11, 2, 12, TILE_FLOOR);
  carveH(m, 4, 3, 16, TILE_FLOOR);
  carveH(m, 8, 3, 16, TILE_FLOOR);
  carveV(m, 4, 4, 10, TILE_FLOOR);
  carveV(m, 8, 4, 10, TILE_FLOOR);
  carveV(m, 13, 4, 10, TILE_FLOOR);
  [[4,6],[4,14],[8,6],[8,10],[8,14],[10,8],[10,13]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildFortressDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 7, 2, 12, 12, TILE_FLOOR);
  carveRect(m, 3, 5, 16, 9, TILE_FLOOR);
  [[5,5],[5,14],[9,5],[9,14],[7,9],[7,10]].forEach(([y,x]) => { m[y][x] = TILE_WALL; });
  carveRect(m, 9, 10, 12, 12, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildMazeDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 2, 2, 17, 12, TILE_FLOOR);
  for (let x = 4; x <= 15; x += 3) {
    for (let y = 3; y <= 11; y++) {
      if (y === 5 || y === 9) continue;
      m[y][x] = TILE_WALL;
    }
  }
  carveRect(m, 9, 10, 12, 12, TILE_FLOOR);
  carveRect(m, 9, 2, 12, 4, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildLavaDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 2, 2, 17, 12, TILE_FLOOR);
  for (let x = 3; x <= 16; x++) {
    if (x === 9 || x === 10 || x === 11) continue;
    if (x % 2 === 0) m[7][x] = TILE_WALL;
  }
  [[4,7],[4,12],[10,7],[10,12],[6,9]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  addExitAndSpawnLane(m);
  return m;
}

function buildHallDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 8, 2, 12, 12, TILE_FLOOR);
  carveRect(m, 4, 4, 7, 6, TILE_FLOOR);
  carveRect(m, 13, 4, 16, 6, TILE_FLOOR);
  carveRect(m, 4, 8, 7, 10, TILE_FLOOR);
  carveRect(m, 13, 8, 16, 10, TILE_FLOOR);
  carveH(m, 5, 7, 13, TILE_FLOOR);
  carveH(m, 9, 7, 13, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildLaneDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 3, 2, 5, 12, TILE_FLOOR);
  carveRect(m, 8, 2, 11, 12, TILE_FLOOR);
  carveRect(m, 14, 2, 16, 12, TILE_FLOOR);
  carveH(m, 11, 5, 14, TILE_FLOOR);
  carveH(m, 4, 5, 14, TILE_FLOOR);
  carveRect(m, 9, 10, 11, 12, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildFinalDungeon() {
  const m = createDungeonGrid();
  carveRect(m, 7, 2, 12, 12, TILE_FLOOR);
  carveRect(m, 3, 4, 16, 10, TILE_FLOOR);
  [[4,4],[4,15],[10,4],[10,15],[7,7],[7,12],[9,7],[9,12]].forEach(([y,x]) => { m[y][x] = TILE_STONE; });
  [[6,10],[8,10]].forEach(([y,x]) => { m[y][x] = TILE_WALL; });
  carveRect(m, 9, 10, 12, 12, TILE_FLOOR);
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

function buildDungeon() {
  const id = (typeof currentDungeonId !== 'undefined' && currentDungeonId >= 0) ? currentDungeonId : 0;
  switch (id) {
    case 0: return buildOpenDungeon();
    case 1: return buildForkDungeon();
    case 2: return buildCatacombDungeon();
    case 3: return buildFortressDungeon();
    case 4: return buildMazeDungeon();
    case 5: return buildLavaDungeon();
    case 6: return buildHallDungeon();
    case 7: return buildLaneDungeon();
    case 8: return buildFinalDungeon();
    default: return buildOpenDungeon();
  }
}

// ─── State ────────────────────────────────────────────────────────────────────
