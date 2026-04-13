'use strict';

// ─── Temple Panel UI ─────────────────────────────────────────────────────
const templePanel = document.getElementById('temple-panel');
let templeOpen = false;
bindTap(document.getElementById('temple-close'), () => closeTemple());

function openTemple() {
  templeOpen = true;
  showPanel(templePanel);
  renderTemple();
}
function closeTemple() {
  templeOpen = false;
  hidePanel(templePanel);
}
function buildTempleEmptyState() {
  return '<div class="temple-empty-state">' +
    '<div class="temple-empty-icon">✨</div>' +
    '<div class="temple-empty-title">모든 동료가 건강합니다</div>' +
    '<div class="temple-empty-text">부활이 필요한 동료가 없습니다.</div>' +
  '</div>';
}

function buildTempleReviveRow(cId) {
  const info = getCompanionRoster(cId);
  if (!info) return '';
  const cost = getReviveCost(cId);
  const canAfford = player.gold >= cost;
  return '<div class="temple-revive-row">' +
    '<div class="temple-revive-icon" style="background:' + info.color + ';">' + (info.portraitIcon || '★') + '</div>' +
    '<div class="temple-revive-main">' +
      '<div class="temple-revive-name">' + info.name + '</div>' +
      '<div class="temple-revive-state">쓰러짐</div>' +
    '</div>' +
    '<div class="temple-revive-cost">💰 ' + cost + '</div>' +
    '<button class="temple-revive-btn" data-cid="' + cId + '"' + (canAfford ? '' : ' disabled') + '>' + (canAfford ? '부활' : '골드 부족') + '</button>' +
  '</div>';
}

function reviveCompanionFromTemple(cId) {
  const cost = getReviveCost(cId);
  if (player.gold < cost) return;
  player.gold -= cost;
  deadCompanions = deadCompanions.filter(id => id !== cId);
  AudioSystem.sfx.heal();
  const cInfo = getCompanionRoster(cId);
  showToast((cInfo ? cInfo.name : '동료') + ' 부활!');
  updateHUD();
  autoSave();
  renderTemple();
}

function reviveAllCompanionsFromTemple(totalCost) {
  if (player.gold < totalCost) return;
  player.gold -= totalCost;
  deadCompanions = [];
  AudioSystem.sfx.tierUp();
  showToast('모든 동료가 부활했습니다!');
  updateHUD();
  autoSave();
  renderTemple();
}

function bindTempleActions(content, totalCost) {
  content.querySelectorAll('.temple-revive-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      reviveCompanionFromTemple(parseInt(btn.getAttribute('data-cid'), 10));
    }, { stopPropagation: true });
  });

  const allBtn = document.getElementById('temple-revive-all');
  if (allBtn && !allBtn.disabled) {
    bindTap(allBtn, () => {
      reviveAllCompanionsFromTemple(totalCost);
    }, { stopPropagation: true });
  }
}

function renderTemple() {
  const content = document.getElementById('temple-content');
  const templeGoldEl = document.getElementById('temple-gold');
  if (templeGoldEl) templeGoldEl.textContent = player.gold.toLocaleString();

  if (deadCompanions.length === 0) {
    content.innerHTML = buildTempleEmptyState();
    return;
  }

  const totalCost = deadCompanions.reduce((sum, cId) => sum + getReviveCost(cId), 0);
  const canAffordAll = player.gold >= totalCost && deadCompanions.length > 1;

  content.innerHTML =
    '<div class="temple-note">\uC4F0\uB7EC\uC9C4 \uB3D9\uB8CC\uB97C \uACE8\uB4DC\uB97C \uC0AC\uC6A9\uD558\uC5EC \uBD80\uD65C\uC2DC\uD0AC \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>' +
    deadCompanions.map(buildTempleReviveRow).join('') +
    '<div class="temple-actions">' +
      '<button id="temple-revive-all" class="temple-revive-all-btn"' + (canAffordAll ? '' : ' disabled') + '>\uC804\uCCB4 \uBD80\uD65C (\uD83D\uDCB0 ' + totalCost + ')</button>' +
    '</div>';

  bindTempleActions(content, totalCost);
}
