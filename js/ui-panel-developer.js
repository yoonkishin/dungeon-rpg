'use strict';

let developerPanelOpen = false;

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
