'use strict';

// ─── Map / World State ───────────────────────────────────────────────────────
let currentMap = 'town';
let currentDungeonId = -1;
let currentEmblemTrial = null;
const initialFieldSeed = Date.now();
let maps = {
  town: buildTown(),
  field: buildField(initialFieldSeed),
  dungeon: buildDungeon()
};

function getMap() { return maps[currentMap]; }
function mapW() {
  if (currentMap === 'town') return OW_W;
  if (currentMap === 'field') return FIELD_W;
  return DG_W;
}
function mapH() {
  if (currentMap === 'town') return OW_H;
  if (currentMap === 'field') return FIELD_H;
  return DG_H;
}

// ─── Player / Companion Progress State ───────────────────────────────────────
const player = {
  x: 10 * TILE + TILE/2,
  y: 15 * TILE + TILE/2,
  w: 28, h: 28,
  speed: 1.5,
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  level: 1,
  xp: 0, xpNext: getXpToNextLevel(1),
  gold: 5000,
  tier: 1,
  atk: 15,
  def: 3,
  dir: 0,
  frame: 0,
  frameTimer: 0,
  attackTimer: 0,
  attackCooldown: 600,
  isAttacking: false,
  attackAngle: 0,
  attackArc: 0,
  invincible: 0,
  dead: false,
  vx: 0, vy: 0,
  critChance: 10,
  classLine: 'infantry',
  classRank: 1,
  currentClassKey: 'infantry_rank1',
  classHistory: ['infantry_rank1'],
  emblemIds: [],
  appliedEmblemBonusIds: [],
  masterEmblemId: null,
  emblemFusionHistory: [],
  promotionPending: false,
  promotionBonusRankApplied: 1,
};

let dungeonsCleared = [];
let companions = [];
let activeCompanions = [];  // array of companion IDs, max 2
let deadCompanions = [];    // IDs of dead companions
let companionStates = {};
let companionAIModes = {};

let totalGoldEarned = 0;
let totalEnemiesKilled = 0;

// ─── Skill Runtime State ─────────────────────────────────────────────────────
let currentSkillPage = 0;
const skillCooldowns = {};
const skillBuffs = {};

// ─── Inventory / Equipment State ─────────────────────────────────────────────
const inventory = [];
const equipped = { weapon: null, armor: null, helmet: null, boots: null, accessory1: null, accessory2: null, shield: null, event: null };
let droppedItems = [];

// ─── NPC / Quest Runtime State ───────────────────────────────────────────────
let npcDialogueIdx = {};
let mainQuestIndex = 0;
let completedMainQuests = [];
let villageUpgrades = { forge: 0, guard: 0, trade: 0, alchemy: 0 };
let acceptedSubquests = [];
let completedSubquests = [];
let subquestProgress = {};
let questRealtimeNoticeState = {
  mainReadyQuestId: null,
  subReadyQuestIds: {},
  snapshot: ''
};

// ─── UI / Combat Runtime State ───────────────────────────────────────────────
let pickupTextTimer = 0;
let pickupTextContent = '';
let enemies = [];
let particles = [];
let damageNumbers = [];
let enemyEffects = [];
let hudDirty = true;
let skillSlotsDirty = true;
let screenShake = { x:0, y:0, timer:0 };
let dayNight = 0;
let dayNightDir = 1;
let cameraX = 0, cameraY = 0;
