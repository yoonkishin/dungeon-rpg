'use strict';

// HUD rendering (updateHUD/showLevelup/showAreaLabel) lives in ui-manager.js.
// Player progression (gainXP) lives in combat.js where XP rewards originate.

// ─── Portal / Transition ──────────────────────────────────────────────────────
function getPlayerTilePosition() {
  return {
    tx: Math.floor(player.x / TILE),
    ty: Math.floor(player.y / TILE),
  };
}

function getPlayerCurrentTile() {
  const { tx, ty } = getPlayerTilePosition();
  return getMap()[ty] && getMap()[ty][tx];
}

function tryHandleExitTileTransition() {
  const tile = getPlayerCurrentTile();
  if (tile !== TILE_EXIT) return false;
  if (currentMap === 'town') enterField();
  else if (currentMap === 'field') enterTown();
  else if (currentMap === 'dungeon') exitDungeon();
  else return false;
  return true;
}

function tryOpenNearbyShop() {
  if (currentMap !== 'town') return false;
  for (const npc of NPCS) {
    if (dist(player, npc) < 50) {
      openShop(npc);
      return true;
    }
  }
  return false;
}

function tryOpenNearbyTownNpcInteraction() {
  if (currentMap !== 'town') return false;
  for (const npc of TOWN_NPCS) {
    if (dist(player, npc) < 50) {
      if (npc.isTemple) openTemple();
      else if (npc.isTrainingRoom) openTrainingPanel();
      else if (npc.isEmblemRoom) openEmblemRoomPanel();
      else openDialogue(npc);
      return true;
    }
  }
  return false;
}

function tryHandlePrimaryContextAction() {
  if (tryOpenNearbyShop()) return true;
  if (tryOpenNearbyTownNpcInteraction()) return true;

  const tile = getPlayerCurrentTile();
  if (currentMap === 'field' && tile === TILE_PORTAL) {
    checkPortal();
    return true;
  }

  return false;
}

function tryHandleInteractKeyAction() {
  if (tryOpenNearbyShop()) return true;
  return checkPortal();
}

function checkPortal() {
  const { tx, ty } = getPlayerTilePosition();
  const tile = getPlayerCurrentTile();

  if (currentMap === 'town' && tile === TILE_EXIT) {
    enterField();
    return true;
  } else if (currentMap === 'field' && tile === TILE_EXIT) {
    enterTown();
    return true;
  } else if (currentMap === 'field' && tile === TILE_PORTAL) {
    // Find which dungeon portal
    for (const info of DUNGEON_INFO) {
      if ((tx === info.portalX || tx === info.portalX + 1) && ty === info.portalY) {
        enterDungeon(info.id);
        return true;
      }
    }
  } else if (currentMap === 'dungeon' && tile === TILE_EXIT) {
    exitDungeon();
    return true;
  }
  return false;
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
  initActiveCompanionsForDungeon();
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

  clearActiveCompanions({ markDead: true });
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
