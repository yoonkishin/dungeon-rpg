'use strict';

const TILE = 40;
const TILE_GRASS = 0;
const TILE_DIRT = 1;
const TILE_WATER = 2;
const TILE_TREE = 3;
const TILE_WALL = 4;
const TILE_FLOOR = 5;
const TILE_PORTAL = 6;
const TILE_EXIT = 7;
const TILE_STONE = 8;

const TILE_COLORS = {
  [TILE_GRASS]: '#3d8b3d',
  [TILE_DIRT]:  '#a07040',
  [TILE_WATER]: '#2980b9',
  [TILE_TREE]:  '#1a5c1a',
  [TILE_WALL]:  '#5a5a5a',
  [TILE_FLOOR]: '#8b7355',
  [TILE_PORTAL]:'#8e44ad',
  [TILE_EXIT]:  '#27ae60',
  [TILE_STONE]: '#7f8c8d',
};

// ─── Dungeon Info ────────────────────────────────────────────────────────────
