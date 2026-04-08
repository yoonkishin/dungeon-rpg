'use strict';

// ─── Joystick ─────────────────────────────────────────────────────────────────
const joyZone = document.getElementById('joystick-zone');
const joyThumb = document.getElementById('joystick-thumb');
const joyBase = document.getElementById('joystick-base');
let joyActive = false;
let joyId = -1;
let joyStartX = 0, joyStartY = 0;
let joyDx = 0, joyDy = 0;
const JOY_RADIUS = 45;
const JOY_DEAD = 0.12;

joyZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  joyId = t.identifier;
  joyActive = true;
  const rect = joyZone.getBoundingClientRect();
  joyStartX = rect.left + rect.width/2;
  joyStartY = rect.top + rect.height/2;
  updateJoy(t);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) updateJoy(t);
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyActive = false;
      joyDx = 0; joyDy = 0;
      joyThumb.style.transform = 'translate(-50%, -50%)';
    }
  }
});

function updateJoy(touch) {
  let dx = touch.clientX - joyStartX;
  let dy = touch.clientY - joyStartY;
  const dist2 = Math.sqrt(dx*dx + dy*dy);
  if (dist2 > JOY_RADIUS) {
    dx = dx / dist2 * JOY_RADIUS;
    dy = dy / dist2 * JOY_RADIUS;
  }
  joyDx = dx / JOY_RADIUS;
  joyDy = dy / JOY_RADIUS;
  joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

// ─── Attack Button ────────────────────────────────────────────────────────────
const attackBtn = document.getElementById('attack-btn');
let attackQueued = false;

attackBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  attackQueued = true;
  attackBtn.classList.add('pressed');
}, { passive: false });

attackBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  attackBtn.classList.remove('pressed');
}, { passive: false });

// ─── Potion Button ────────────────────────────────────────────────────────────
const potionBtn = document.getElementById('potion-btn');
potionBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  usePotion();
}, { passive: false });
potionBtn.addEventListener('click', (e) => {
  e.preventDefault();
  usePotion();
});

function usePotion() {
  const idx = inventory.findIndex(id => id === 'potion_hp2');
  const idx2 = inventory.findIndex(id => id === 'potion_hp');
  const useIdx = idx >= 0 ? idx : idx2;
  if (useIdx < 0) return;
  const itemId = inventory[useIdx];
  const item = ITEMS[itemId];
  if (!item || item.type !== 'potion') return;
  const healAmt = Math.min(item.heal, player.maxHp - player.hp);
  player.hp = Math.min(player.hp + item.heal, player.maxHp);
  inventory.splice(useIdx, 1);
  addParticles(player.x, player.y, '#e74c3c', 10);
  if (healAmt > 0) addDamageNumber(player.x, player.y, healAmt, 'heal');
  AudioSystem.sfx.heal();
  updateHUD();
}

// ─── Menu / Settings UI ──────────────────────────────────────────────────────
let menuOpen = false;
let settingsOpen = false;
let dialogueOpen = false;
let profileOpen = false;
let companionPanelOpen = false;
let skillPanelOpen = false;
let questPanelOpen = false;

const menuPanel = document.getElementById('menu-panel');
const settingsPanel = document.getElementById('settings-panel');
const toastEl = document.getElementById('toast');
let toastTimeout = null;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toastEl.style.opacity = '0'; }, 1500);
}

// ─── Panel show/hide helpers (flicker-free transitions) ─────────────────────
function showPanel(el) {
  el.style.display = 'flex';
  el.offsetHeight; // force reflow
  el.style.opacity = '1';
  AudioSystem.sfx.menuOpen();
}

function hidePanel(el, callback) {
  el.style.opacity = '0';
  AudioSystem.sfx.menuClose();
  setTimeout(() => {
    el.style.display = 'none';
    if (callback) callback();
  }, 150);
}

document.getElementById('menu-btn').addEventListener('touchstart', (e) => { e.preventDefault(); openMenu(); }, { passive: false });
document.getElementById('menu-btn').addEventListener('click', (e) => { e.preventDefault(); openMenu(); });

// Click status bar to open profile
document.getElementById('player-status').addEventListener('touchstart', (e) => { e.preventDefault(); if (!profileOpen) openProfile(); }, { passive: false });
document.getElementById('player-status').addEventListener('click', (e) => { e.preventDefault(); if (!profileOpen) openProfile(); });

document.getElementById('settings-btn').addEventListener('touchstart', (e) => { e.preventDefault(); openSettings(); }, { passive: false });
document.getElementById('settings-btn').addEventListener('click', (e) => { e.preventDefault(); openSettings(); });

document.getElementById('menu-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeMenu(); }, { passive: false });
document.getElementById('menu-close').addEventListener('click', closeMenu);

document.getElementById('settings-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeSettings(); }, { passive: false });
document.getElementById('settings-close').addEventListener('click', closeSettings);

function openMenu() {
  if (settingsOpen) closeSettings();
  menuOpen = true;
  showPanel(menuPanel);
}
function closeMenu() {
  menuOpen = false;
  hidePanel(menuPanel);
}
function openSettings() {
  if (menuOpen) closeMenu();
  settingsOpen = true;
  showPanel(settingsPanel);
}
function closeSettings() {
  settingsOpen = false;
  hidePanel(settingsPanel);
}

// Menu grid actions
document.querySelectorAll('.menu-grid-btn').forEach(btn => {
  function handleAction(e) {
    e.preventDefault();
    e.stopPropagation();
    const action = btn.getAttribute('data-action');
    if (action === 'equipment' || action === 'bag') {
      openInventory();
      menuOpen = false;
      hidePanel(menuPanel);
    } else if (action === 'settings') {
      showPanel(settingsPanel);
      settingsOpen = true;
      menuOpen = false;
      hidePanel(menuPanel);
    } else if (action === 'profile') {
      openProfile();
      menuOpen = false;
      hidePanel(menuPanel);
    } else if (action === 'companion') {
      openCompanionPanel();
      menuOpen = false;
      hidePanel(menuPanel);
    } else if (action === 'skill') {
      openSkillPanel();
      menuOpen = false;
      hidePanel(menuPanel);
    } else if (action === 'town-return') {
      menuOpen = false;
      hidePanel(menuPanel);
      if (currentMap === 'town') {
        showToast('이미 마을에 있습니다');
      } else {
        if (currentMap === 'dungeon') {
          // Companions die when leaving dungeon early
          activeCompanions.forEach(cId => {
            if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
          });
          activeCompanions = [];
          companionStates = {};
        }
        enterTown();
        showToast('마을로 귀환했습니다');
        AudioSystem.sfx.portal();
        autoSave();
      }
    } else if (action === 'quests') {
      openQuestPanel();
      menuOpen = false;
      hidePanel(menuPanel);
    }
  }
  btn.addEventListener('touchstart', handleAction, { passive: false });
  btn.addEventListener('click', handleAction);
});

// Settings rows
document.querySelectorAll('.settings-row').forEach(row => {
  function handleSetting(e) {
    e.preventDefault();
    const setting = row.getAttribute('data-setting');
    if (setting === 'fullscreen') {
      closeSettings();
      goFullscreen();
    } else if (setting === 'sound' || setting === 'music') {
      const toggle = row.querySelector('.s-toggle');
      const newState = toggle.textContent === 'ON' ? 'OFF' : 'ON';
      toggle.textContent = newState;
      if (setting === 'sound') AudioSystem.setSound(newState === 'ON');
      if (setting === 'music') {
        AudioSystem.setMusic(newState === 'ON');
        if (newState === 'ON') AudioSystem.startBgm(currentMap === 'dungeon' ? 'dungeon' : currentMap);
      }
    } else if (setting === 'reset') {
      if (confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try { localStorage.removeItem('rpg_save_data'); } catch(ex) {}
        location.reload();
      }
    } else {
      showToast('준비 중...');
    }
  }
  row.addEventListener('touchstart', handleSetting, { passive: false });
  row.addEventListener('click', handleSetting);
});

// ─── Minimap Toggle ──────────────────────────────────────────────────────────
let minimapVisible = true;
const minimapToggle = document.getElementById('minimap-toggle');
const minimapEl = document.getElementById('minimap');

// Load minimap visibility from localStorage
try {
  const mmVis = localStorage.getItem('rpg_minimap_visible');
  if (mmVis === 'false') {
    minimapVisible = false;
    minimapEl.style.display = 'none';
    minimapToggle.textContent = '🗺';
  }
} catch(ex) {}

minimapToggle.addEventListener('touchstart', (e) => { e.preventDefault(); toggleMinimap(); }, { passive: false });
minimapToggle.addEventListener('click', (e) => { e.preventDefault(); toggleMinimap(); });

function toggleMinimap() {
  minimapVisible = !minimapVisible;
  minimapEl.style.display = minimapVisible ? 'block' : 'none';
  minimapToggle.textContent = minimapVisible ? '✕' : '🗺';
  try { localStorage.setItem('rpg_minimap_visible', String(minimapVisible)); } catch(ex) {}
}

// ─── Dialogue Panel ──────────────────────────────────────────────────────────
const dialoguePanel = document.getElementById('dialogue-panel');
const dialogueCloseBtn = dialoguePanel.querySelector('.dialogue-close');

dialogueCloseBtn.addEventListener('touchstart', (e) => { e.preventDefault(); closeDialogue(); }, { passive: false });
dialogueCloseBtn.addEventListener('click', closeDialogue);
dialoguePanel.addEventListener('touchstart', (e) => { e.preventDefault(); closeDialogue(); }, { passive: false });
dialoguePanel.addEventListener('click', closeDialogue);

function openDialogue(npc) {
  dialogueOpen = true;
  if (!npcDialogueIdx[npc.id]) npcDialogueIdx[npc.id] = 0;
  const idx = npcDialogueIdx[npc.id] % npc.dialogue.length;
  dialoguePanel.querySelector('.npc-name').textContent = npc.name;
  dialoguePanel.querySelector('.npc-text').textContent = npc.dialogue[idx];
  dialoguePanel.style.display = 'flex';
  npcDialogueIdx[npc.id] = idx + 1;
}

function closeDialogue() {
  dialogueOpen = false;
  dialoguePanel.style.display = 'none';
}

// Note: dialoguePanel doesn't use showPanel/hidePanel because it's bottom-anchored, not fullscreen overlay


// ─── Respawn ──────────────────────────────────────────────────────────────────
document.getElementById('respawn-btn').addEventListener('click', () => {
  AudioSystem.sfx.respawn();
  AudioSystem.startBgm(currentMap === 'dungeon' ? 'dungeon' : currentMap);
  // Reset companions on death
  activeCompanions.forEach(cId => {
    if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
  });
  activeCompanions = [];
  companionStates = {};
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.dead = false;
  player.invincible = 1000;
  closeInventory();
  closeShop();
  closeMenu();
  closeSettings();
  closeDialogue();
  closeProfile();
  closeCompanionPanel();
  closeSkillPanel();
  if (currentMap === 'dungeon') {
    exitDungeon();
  } else if (currentMap === 'field') {
    enterTown();
  } else {
    player.x = 10 * TILE + TILE/2;
    player.y = 15 * TILE + TILE/2;
    spawnEnemies();
  }
  document.getElementById('death-screen').style.display = 'none';
  updateHUD();
});

