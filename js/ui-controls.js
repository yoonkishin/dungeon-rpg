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
  let handled = false;
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      if (!handled) {
        e.preventDefault();
        handled = true;
      }
      updateJoy(t);
    }
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyActive = false;
      joyId = -1;
      joyDx = 0; joyDy = 0;
      joyThumb.style.transform = 'translate(-50%, -50%)';
    }
  }
});

document.addEventListener('touchcancel', (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyActive = false;
      joyId = -1;
      joyDx = 0;
      joyDy = 0;
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
  const boostedHeal = Math.floor(item.heal * getHealingMultiplier());
  const healAmt = Math.min(boostedHeal, player.maxHp - player.hp);
  player.hp = Math.min(player.hp + boostedHeal, player.maxHp);
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
let villagePanelOpen = false;

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

function bindTap(el, handler, options = {}) {
  if (!el) return;
  const {
    preventDefault = true,
    stopPropagation = false,
    touchOnly = false,
  } = options;

  const wrapped = (e) => {
    if (preventDefault && e) e.preventDefault();
    if (stopPropagation && e) e.stopPropagation();
    handler(e);
  };

  el.addEventListener('touchstart', wrapped, { passive: false });
  if (!touchOnly) el.addEventListener('click', wrapped);
}

bindTap(document.getElementById('menu-btn'), () => openMenu());

// Click status bar to open profile
bindTap(document.getElementById('player-status'), () => {
  if (!profileOpen) openProfile();
});

bindTap(document.getElementById('settings-btn'), () => openSettings());

bindTap(document.getElementById('menu-close'), () => closeMenu());

bindTap(document.getElementById('settings-close'), () => closeSettings());

function openMenu() {
  if (settingsOpen) closeSettings();
  const townActionBtn = document.getElementById('town-action-btn');
  if (townActionBtn) {
    const labelEl = townActionBtn.querySelector('.m-label');
    if (labelEl) labelEl.textContent = currentMap === 'town' ? '마을발전' : '마을귀환';
  }
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
  function handleAction() {
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
      if (currentMap === 'town') {
        menuOpen = false;
        hidePanel(menuPanel);
        openVillagePanel();
      } else {
        if (currentMap === 'dungeon') {
          const shouldReturn = confirm('지금 마을로 귀환하면 출전 중인 동료가 쓰러진 상태로 처리됩니다. 정말 귀환할까요?');
          if (!shouldReturn) return;

          // Companions die when leaving dungeon early
          activeCompanions.forEach(cId => {
            if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
          });
          activeCompanions = [];
          companionStates = {};
        }
        menuOpen = false;
        hidePanel(menuPanel);
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
  bindTap(btn, handleAction, { stopPropagation: true });
});

// Settings rows
document.querySelectorAll('.settings-row').forEach(row => {
  function handleSetting() {
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
  bindTap(row, handleSetting);
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

bindTap(minimapToggle, () => toggleMinimap());

function toggleMinimap() {
  minimapVisible = !minimapVisible;
  minimapEl.style.display = minimapVisible ? 'block' : 'none';
  minimapToggle.textContent = minimapVisible ? '✕' : '🗺';
  try { localStorage.setItem('rpg_minimap_visible', String(minimapVisible)); } catch(ex) {}
}

// ─── Dialogue Panel ──────────────────────────────────────────────────────────
const dialoguePanel = document.getElementById('dialogue-panel');
const dialogueCloseBtn = dialoguePanel.querySelector('.dialogue-close');
let currentDialogueLines = [];
let currentDialogueIndex = 0;
let currentDialogueNpcName = '';

function renderDialogueStep() {
  dialoguePanel.querySelector('.npc-name').textContent = currentDialogueNpcName;
  dialoguePanel.querySelector('.npc-text').textContent = currentDialogueLines[currentDialogueIndex] || '';
  dialogueCloseBtn.textContent = currentDialogueIndex < currentDialogueLines.length - 1 ? '다음' : '닫기';
}

function advanceDialogue(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!dialogueOpen) return;
  if (currentDialogueIndex < currentDialogueLines.length - 1) {
    currentDialogueIndex++;
    renderDialogueStep();
  } else {
    closeDialogue();
  }
}

bindTap(dialogueCloseBtn, advanceDialogue, { stopPropagation: true });

function openDialogue(npc) {
  dialogueOpen = true;
  currentDialogueNpcName = npc.name;
  currentDialogueIndex = 0;
  currentDialogueLines = getNpcInteractionLines(npc);
  if (!Array.isArray(currentDialogueLines) || currentDialogueLines.length === 0) {
    currentDialogueLines = npc.dialogue && npc.dialogue.length ? npc.dialogue : ['...'];
  }
  dialoguePanel.style.display = 'flex';
  renderDialogueStep();
}

function closeDialogue() {
  dialogueOpen = false;
  dialoguePanel.style.display = 'none';
}

// Note: dialoguePanel doesn't use showPanel/hidePanel because it's bottom-anchored, not fullscreen overlay

function closeAllPanels(options = {}) {
  const { includeDialogue = true } = options;
  [
    closeInventory,
    closeShop,
    closeMenu,
    closeSettings,
    closeProfile,
    closeCompanionPanel,
    closeSkillPanel,
    closeQuestPanel,
    closeVillagePanel,
    closeTemple,
  ].forEach((closeFn) => {
    if (typeof closeFn === 'function') closeFn();
  });

  if (includeDialogue && typeof closeDialogue === 'function') {
    closeDialogue();
  }
}

// ─── Death return ─────────────────────────────────────────────────────────────
const respawnBtn = document.getElementById('respawn-btn');

function handleRespawn() {
  AudioSystem.sfx.respawn();
  if (typeof returnPlayerToTownAfterDeath === 'function') {
    returnPlayerToTownAfterDeath();
  }
}

bindTap(respawnBtn, handleRespawn, { stopPropagation: true });

