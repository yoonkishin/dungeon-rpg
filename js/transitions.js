'use strict';

// HUD rendering (updateHUD/showLevelup/showAreaLabel) lives in ui-manager.js.
// Player progression (gainXP) lives in combat.js where XP rewards originate.

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
  clearEmblemTrial();
  currentDungeonId = -1;
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
  clearEmblemTrial();
  currentDungeonId = -1;
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
  clearEmblemTrial();
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

const EMBLEM_TRIAL_EXIT_SPAWN = { x: 6 * TILE + TILE / 2, y: 13 * TILE + TILE / 2 };

function enterEmblemTrial(emblemId) {
  currentDungeonId = -1;
  currentMap = 'dungeon';
  dungeonCleared = false;
  clearEmblemTrial();
  currentEmblemTrial = { emblemId: emblemId };
  maps.dungeon = buildDungeon();
  player.x = 10 * TILE + TILE/2;
  player.y = 12 * TILE + TILE/2;
  spawnEnemies();
  const emblem = getEmblemDef(emblemId);
  showAreaLabel(emblem ? (emblem.name + ' 시험') : '문장 시험');
  if (typeof showToast === 'function') {
    setTimeout(() => showToast('수호자를 쓰러뜨리면 문장을 얻는다'), 200);
  }
  AudioSystem.sfx.portal();
  AudioSystem.startBgm('dungeon');
  autoSave();
  updateHUD();
}

function exitDungeon() {
  if (isEmblemTrialActive()) {
    clearEmblemTrial();
    currentDungeonId = -1;
    currentMap = 'town';
    player.x = EMBLEM_TRIAL_EXIT_SPAWN.x;
    player.y = EMBLEM_TRIAL_EXIT_SPAWN.y;
    AudioSystem.sfx.portal();
    AudioSystem.startBgm('town');
    spawnEnemies();
    showAreaLabel('마을');
    autoSave();
    updateHUD();
    return;
  }

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
