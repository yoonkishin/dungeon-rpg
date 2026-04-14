'use strict';

// ─── Menu / Settings UI ──────────────────────────────────────────────────────
let menuOpen = false;
let settingsOpen = false;
let dialogueOpen = false;
let profileOpen = false;
let companionPanelOpen = false;
let skillPanelOpen = false;
let questPanelOpen = false;
let villagePanelOpen = false;
let trainingPanelOpen = false;
let emblemRoomPanelOpen = false;
let developerPanelOpen = false;

const menuPanel = document.getElementById('menu-panel');
const settingsPanel = document.getElementById('settings-panel');
const toastEl = document.getElementById('toast');
const promotionShortcutBtn = document.getElementById('promotion-shortcut-btn');
let toastTimeout = null;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.style.opacity = '1';
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toastEl.style.opacity = '0'; }, 1500);
}

// ─── HUD Rendering ──────────────────────────────────────────────────────────
function updateHUD() {
  hudDirty = false;
  document.getElementById('hp-fill').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('hp-text').textContent = Math.floor(player.hp) + '/' + player.maxHp;
  document.getElementById('mp-fill').style.width = (player.mp / player.maxMp * 100) + '%';
  document.getElementById('mp-text').textContent = Math.floor(player.mp) + '/' + player.maxMp;
  document.getElementById('player-avatar').textContent = player.level;

  const tier = getCurrentTier();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const nextTier = getNextTier();
  const promotionTarget = getPlayerPromotionTarget();
  const statusClassLineEl = document.getElementById('status-class-line');
  const statusClassNextEl = document.getElementById('status-class-next');
  if (statusClassLineEl) statusClassLineEl.textContent = `${growthLine.lineName} 라인 · ${tier.name}`;
  if (statusClassNextEl) {
    statusClassNextEl.textContent = promotionTarget
      ? `승급 가능! ${promotionTarget.name} · 수련의 방 방문`
      : (nextTier ? `다음 승급 ${nextTier.name} · Lv.${nextTier.reqLevel}` : '최종 승급 완료');
  }
  if (promotionShortcutBtn) {
    promotionShortcutBtn.style.display = promotionTarget ? 'block' : 'none';
    promotionShortcutBtn.textContent = promotionTarget ? `승급: ${promotionTarget.name}` : '승급 가능';
  }

  const xpPct = player.xpNext > 0 ? (player.xp / player.xpNext * 100) : 0;
  document.getElementById('xp-fill').style.width = xpPct + '%';
  document.getElementById('xp-text').textContent = player.xp + '/' + player.xpNext;
  document.getElementById('gold-display').textContent = '💰 ' + player.gold;
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

// ─── Panel Registry ─────────────────────────────────────────────────────────
// Single source of truth for "is some panel open?" and "close them all".
// Adding a new panel = add one entry here. The arrows capture live bindings
// from other script files; by the time isAnyPanelOpen / closeAllPanels are
// ever called, every script tag has loaded, so cross-file references resolve.
const PANEL_REGISTRY = [
  { id: 'inventory', isOpen: () => invOpen,             close: () => closeInventory() },
  { id: 'shop',      isOpen: () => shopOpen,            close: () => closeShop() },
  { id: 'menu',      isOpen: () => menuOpen,            close: () => closeMenu() },
  { id: 'settings',  isOpen: () => settingsOpen,        close: () => closeSettings() },
  { id: 'dialogue',  isOpen: () => dialogueOpen,        close: () => closeDialogue() },
  { id: 'profile',   isOpen: () => profileOpen,         close: () => closeProfile() },
  { id: 'companion', isOpen: () => companionPanelOpen,  close: () => closeCompanionPanel() },
  { id: 'skill',     isOpen: () => skillPanelOpen,      close: () => closeSkillPanel() },
  { id: 'quest',     isOpen: () => questPanelOpen,      close: () => closeQuestPanel() },
  { id: 'village',   isOpen: () => villagePanelOpen,    close: () => closeVillagePanel() },
  { id: 'training',  isOpen: () => trainingPanelOpen,   close: () => closeTrainingPanel() },
  { id: 'emblem',    isOpen: () => emblemRoomPanelOpen, close: () => closeEmblemRoomPanel() },
  { id: 'developer', isOpen: () => developerPanelOpen,  close: () => closeDeveloperPanel() },
  { id: 'temple',    isOpen: () => templeOpen,          close: () => closeTemple() },
];

function isAnyPanelOpen() {
  for (const p of PANEL_REGISTRY) {
    if (p.isOpen()) return true;
  }
  return false;
}

// ─── Panel show/hide helpers (flicker-free transitions) ─────────────────────
function showPanel(el) {
  if (el._hideTid) { clearTimeout(el._hideTid); el._hideTid = null; }
  el.style.display = 'flex';
  el.offsetHeight; // force reflow
  el.classList.add('panel-visible');
  AudioSystem.sfx.menuOpen();
}

function hidePanel(el, callback) {
  el.classList.remove('panel-visible');
  AudioSystem.sfx.menuClose();
  el._hideTid = setTimeout(() => {
    el._hideTid = null;
    el.style.display = 'none';
    if (callback) callback();
  }, 180);
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

// Click status bar to open profile
bindTap(document.getElementById('player-status'), () => {
  if (!profileOpen) openProfile();
});

bindTap(document.getElementById('settings-btn'), () => openSettings());
bindTap(document.getElementById('developer-btn'), () => openDeveloperPanel());
bindTap(promotionShortcutBtn, () => openTrainingPanel(), { stopPropagation: true });

bindTap(document.getElementById('menu-close'), () => closeMenu());

bindTap(document.getElementById('settings-close'), () => closeSettings());

function refreshTownActionLabel() {
  const townActionBtn = document.getElementById('town-action-btn');
  if (townActionBtn) {
    const labelEl = townActionBtn.querySelector('.m-label');
    if (labelEl) labelEl.textContent = currentMap === 'town' ? '마을발전' : '마을귀환';
  }
}

function openMenu() {
  if (settingsOpen) closeSettings();
  refreshTownActionLabel();
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

function closeMenuIfOpen() {
  if (!menuOpen) return;
  menuOpen = false;
  hidePanel(menuPanel);
}

function handleHudAction(action) {
  if (action === 'equipment' || action === 'bag') {
    closeMenuIfOpen();
    openInventory();
  } else if (action === 'settings') {
    closeMenuIfOpen();
    showPanel(settingsPanel);
    settingsOpen = true;
  } else if (action === 'profile') {
    closeMenuIfOpen();
    openProfile();
  } else if (action === 'companion') {
    closeMenuIfOpen();
    openCompanionPanel();
  } else if (action === 'skill') {
    closeMenuIfOpen();
    openSkillPanel();
  } else if (action === 'town-return') {
    closeMenuIfOpen();
    if (currentMap === 'town') {
      openVillagePanel();
    } else {
      if (currentMap === 'dungeon') {
        const shouldReturn = confirm('지금 마을로 귀환하면 출전 중인 동료가 쓰러진 상태로 처리됩니다. 정말 귀환할까요?');
        if (!shouldReturn) return;

        // Companions die when leaving dungeon early
        clearActiveCompanions({ markDead: true });
      }
      enterTown();
      showToast('마을로 귀환했습니다');
      AudioSystem.sfx.portal();
      autoSave();
    }
  } else if (action === 'quests') {
    closeMenuIfOpen();
    openQuestPanel();
  }
}

document.querySelectorAll('.menu-grid-btn, .hud-quick-btn').forEach(btn => {
  function handleAction() {
    const action = btn.getAttribute('data-action');
    handleHudAction(action);
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
        try { localStorage.removeItem(SAVE_KEY); } catch(ex) {}
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
  for (const p of PANEL_REGISTRY) {
    if (p.id === 'dialogue' && !includeDialogue) continue;
    try {
      p.close();
    } catch (ex) {
      console.warn('[closeAllPanels] failed to close panel:', p.id, ex);
    }
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

// ─── Developer Panel ─────────────────────────────────────────────────────────
const developerPanel = document.getElementById('developer-panel');
const developerPanelCloseBtn = document.getElementById('developer-panel-close');
const developerPanelContent = document.getElementById('developer-panel-content');
const developerSummaryEl = document.getElementById('developer-summary');

bindTap(developerPanelCloseBtn, () => closeDeveloperPanel());

function openDeveloperPanel() {
  developerPanelOpen = true;
  showPanel(developerPanel);
  renderDeveloperPanel();
}

function closeDeveloperPanel() {
  developerPanelOpen = false;
  hidePanel(developerPanel);
}

function setPlayerToCurrentTierMaxLevel() {
  const levelCap = getPlayerLevelCap();
  if (player.level >= levelCap) {
    showToast('이미 현재 단수 만렙입니다');
    return;
  }
  player.level = levelCap;
  player.xp = 0;
  syncPlayerGrowthState();
  player.xpNext = getXpToNextLevel(player.level, player.tier || player.classRank || 1);
  addParticles(player.x, player.y, '#f1c40f', 18);
  showToast(`${getCurrentTier().name} 만렙 도달!`);
  updateHUD();
  if (profileOpen) renderProfile();
  if (trainingPanelOpen) renderTrainingPanel();
  if (emblemRoomPanelOpen) renderEmblemRoomPanel();
  autoSave();
  renderDeveloperPanel();
}

function renderDeveloperPanel() {
  const tier = getCurrentTier();
  const levelCap = getPlayerLevelCap();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const isMaxLevel = player.level >= levelCap;

  if (developerSummaryEl) {
    developerSummaryEl.textContent = `${tier.name} · Lv.${player.level}/${levelCap}`;
  }

  developerPanelContent.innerHTML =
    '<div class="developer-card">' +
      '<div class="developer-summary-grid">' +
        '<div class="developer-summary-item"><span class="dev-label">현재 라인</span><span class="dev-value">' + growthLine.lineName + '</span></div>' +
        '<div class="developer-summary-item"><span class="dev-label">현재 단수</span><span class="dev-value">' + tier.tier + '단</span></div>' +
        '<div class="developer-summary-item"><span class="dev-label">현재 레벨</span><span class="dev-value">Lv.' + player.level + '</span></div>' +
        '<div class="developer-summary-item"><span class="dev-label">현재 단수 만렙</span><span class="dev-value">Lv.' + levelCap + '</span></div>' +
      '</div>' +
      '<button id="developer-max-level-btn" class="developer-action-btn"' + (isMaxLevel ? ' disabled' : '') + '>현재 단수 만렙 도달</button>' +
      '<div class="developer-help-text">이 버튼은 현재 캐릭터를 해당 단수의 최대 레벨까지 즉시 올립니다. 예: 7단이면 Lv36, 8단이면 Lv100.</div>' +
    '</div>';

  const maxLevelBtn = document.getElementById('developer-max-level-btn');
  if (maxLevelBtn && !maxLevelBtn.disabled) {
    bindTap(maxLevelBtn, () => setPlayerToCurrentTierMaxLevel(), { stopPropagation: true });
  }
}
