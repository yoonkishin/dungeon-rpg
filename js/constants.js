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

const MAX_ACTIVE_COMPANIONS = 2;

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

const AREA_PALETTE = {
  town:    { grass:'#3d8b3d', grassAlt:['#358035','#459545','#3a8838'], wall:'#5a5a5a', wallShadow:'#3a3a3a', wallHighlight:'#727272' },
  field:   { grass:'#3d8b3d', grassAlt:['#358035','#459545','#3a8838'], wall:'#5a5a5a', wallShadow:'#3a3a3a', wallHighlight:'#727272' },
  dungeon: { grass:'#3d5a3d', grassAlt:['#354a35','#3d5a3d','#2a4a2a'], wall:'#4a4a4a', wallShadow:'#2a2a2a', wallHighlight:'#636363' },
};

// ─── Dungeon Info ────────────────────────────────────────────────────────────
