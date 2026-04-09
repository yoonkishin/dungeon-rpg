'use strict';

function updateHUD() {
  hudDirty = false;
  document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('hp-text').textContent = Math.floor(player.hp) + '/' + player.maxHp;
  document.getElementById('mp-fill').style.width = (player.mp / player.maxMp * 100) + '%';
  document.getElementById('mp-text').textContent = Math.floor(player.mp) + '/' + player.maxMp;
  document.getElementById('player-avatar').textContent = player.level;
  // XP bar in status panel
  const xpPct = player.xpNext > 0 ? (player.xp / player.xpNext * 100) : 0;
  document.getElementById('xp-fill').style.width = xpPct + '%';
  document.getElementById('xp-text').textContent = player.xp + '/' + player.xpNext;
  // Gold display (top-right)
  document.getElementById('gold-display').textContent = '💰 ' + player.gold;
  // Update avatar border color to tier color
  const tier = getCurrentTier();
  document.getElementById('player-avatar').style.borderColor = tier.color;
  document.getElementById('player-avatar').style.background = 'linear-gradient(135deg, ' + tier.bodyColor + ', ' + tier.color + ')';
}

let levelupTimeout = null;
function showLevelup() {
  AudioSystem.sfx.levelUp();
  const el = document.getElementById('levelup-banner');
  el.style.opacity = '1';
  if (levelupTimeout) clearTimeout(levelupTimeout);
  levelupTimeout = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

let areaTimeout = null;
function showAreaLabel(text) {
  const el = document.getElementById('area-label');
  el.textContent = text;
  el.style.opacity = '1';
  if (areaTimeout) clearTimeout(areaTimeout);
  areaTimeout = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

// ─── Level Up ─────────────────────────────────────────────────────────────────
let maxLevelToastShown = false;
function gainXP(amount) {
  if (player.level >= 35) {
    player.xp = 0;
    if (!maxLevelToastShown) {
      showToast('최대 레벨');
      maxLevelToastShown = true;
    }
    updateHUD();
    return;
  }
  player.xp += amount;
  let leveled = false;
  while (player.xp >= player.xpNext && player.level < 35) {
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.4);
    player.maxHp += 20;
    player.hp = player.maxHp;
    player.maxMp += 10;
    player.mp = player.maxMp;
    player.atk += 5;
    player.def += 1;
    player.speed += 0.05;
    player.critChance = Math.min(30, player.critChance + 1);
    showLevelup();
    addParticles(player.x, player.y, '#f1c40f', 20);
    leveled = true;

    // Check tier promotion
    const oldTier = player.tier;
    const newTier = getCurrentTier();
    if (newTier.tier > oldTier) {
      player.tier = newTier.tier;
      showTierBanner(newTier);
      addParticles(player.x, player.y, newTier.color, 25);
    }

    if (player.level >= 35) {
      player.xp = 0;
      break;
    }
  }
  if (leveled) autoSave();
  updateHUD();
}

// ─── Portal / Transition ──────────────────────────────────────────────────────
function checkPortal() {
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  const tile = getMap()[ty] && getMap()[ty][tx];

  if (currentMap === 'town' && tile === TILE_EXIT) {
    enterField();
  } else if (currentMap === 'field' && tile === TILE_EXIT) {
    enterTown();
  } else if (currentMap === 'field' && tile === TILE_PORTAL) {
    // Find which dungeon portal
    for (const info of DUNGEON_INFO) {
      if ((tx === info.portalX || tx === info.portalX + 1) && ty === info.portalY) {
        enterDungeon(info.id);
        return;
      }
    }
  } else if (currentMap === 'dungeon' && tile === TILE_EXIT) {
    exitDungeon();
  }
}

function enterField() {
  currentMap = 'field';
  player.x = 40 * TILE;
  player.y = (FIELD_H - 3) * TILE + TILE/2;
  spawnEnemies();
  showAreaLabel('필드');
  AudioSystem.sfx.portal();
  AudioSystem.startBgm('field');
  autoSave();
  updateHUD();
}

function enterTown() {
  currentMap = 'town';
  player.x = 20 * TILE + TILE/2;
  player.y = 15 * TILE + TILE/2;
  spawnEnemies();
  showAreaLabel('마을');
  AudioSystem.sfx.portal();
  AudioSystem.startBgm('town');
  autoSave();
  updateHUD();
}

function enterDungeon(dungeonId) {
  currentDungeonId = dungeonId;
  dungeonCleared = false;
  currentMap = 'dungeon';
  maps.dungeon = buildDungeon();
  player.x = 10 * TILE + TILE/2;
  player.y = 12 * TILE + TILE/2;
  spawnEnemies();
  const info = DUNGEON_INFO[dungeonId];
  showAreaLabel(info ? info.name : '던전');
  if (info && info.layoutHint && typeof showToast === 'function') {
    setTimeout(() => showToast(info.layoutHint), 200);
  }
  AudioSystem.sfx.portal();
  AudioSystem.startBgm('dungeon');
  // Initialize companion states for dungeon
  activeCompanions.forEach(cId => {
    if (!deadCompanions.includes(cId)) {
      initCompanionState(cId);
    }
  });
  // Remove dead ones from active
  activeCompanions = activeCompanions.filter(cId => !deadCompanions.includes(cId));
  autoSave();
  updateHUD();
}

function exitDungeon() {
  const info = currentDungeonId >= 0 ? DUNGEON_INFO[currentDungeonId] : null;
  currentMap = 'field';
  if (info) {
    player.x = info.portalX * TILE + TILE/2;
    player.y = (info.portalY + 1) * TILE + TILE/2;
  } else {
    player.x = 40 * TILE;
    player.y = (FIELD_H - 3) * TILE + TILE/2;
  }
  currentDungeonId = -1;
  AudioSystem.sfx.portal();
  AudioSystem.startBgm('field');
  spawnEnemies();
  showAreaLabel('필드');
  autoSave();
  updateHUD();
}

function returnPlayerToTownAfterDeath() {
  const deathScreen = document.getElementById('death-screen');
  if (deathScreen) deathScreen.style.display = 'none';

  activeCompanions.forEach(cId => {
    if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
  });
  activeCompanions = [];
  companionStates = {};
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.dead = false;
  player.invincible = 1000;

  if (typeof closeAllPanels === 'function') {
    closeAllPanels();
  }

  enterTown();
  if (typeof showToast === 'function') {
    showToast('쓰러져 마을로 돌아왔습니다');
  }
}

// ─── Combat ───────────────────────────────────────────────────────────────────
