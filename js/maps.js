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
function buildDungeon() {
  const m = [];
  for (let y = 0; y < DG_H; y++) {
    m[y] = [];
    for (let x = 0; x < DG_W; x++) {
      m[y][x] = TILE_WALL;
    }
  }
  for (let y = 2; y < DG_H-2; y++) {
    for (let x = 2; x < DG_W-2; x++) {
      m[y][x] = TILE_FLOOR;
    }
  }
  [[4,4],[4,8],[4,12],[8,4],[8,8],[8,12],[10,6],[10,10]].forEach(([y,x]) => {
    if (y>=2&&y<DG_H-2&&x>=2&&x<DG_W-2) m[y][x] = TILE_WALL;
  });
  m[2][10] = TILE_EXIT;
  m[2][11] = TILE_EXIT;
  return m;
}

// ─── State ────────────────────────────────────────────────────────────────────
