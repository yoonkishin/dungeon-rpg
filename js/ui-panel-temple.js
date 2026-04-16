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
    '<div class="temple-empty-title">모든 파티원이 건강합니다</div>' +
    '<div class="temple-empty-text">부활이 필요한 지휘관이나 동료가 없습니다.</div>' +
  '</div>';
}

function getTempleCharacterVisual(characterId) {
  if (isHeroCharacterId(characterId)) {
    return {
      name: getCharacterDisplayName(characterId),
      icon: '⚔️',
      color: '#f1c40f',
      stateText: currentCommanderId === characterId ? '유령 지휘관' : '유령',
    };
  }

  const cId = parseCompanionCharacterId(characterId);
  const info = cId !== null ? getCompanionRoster(cId) : null;
  return {
    name: getCharacterDisplayName(characterId),
    icon: info && info.portraitIcon ? info.portraitIcon : '★',
    color: info && info.color ? info.color : '#7f8c8d',
    stateText: currentCommanderId === characterId ? '유령 지휘관' : '쓰러짐',
  };
}

function buildTempleReviveRow(characterId) {
  const visual = getTempleCharacterVisual(characterId);
  const cost = getReviveCost(characterId);
  const canAfford = player.gold >= cost;
  return '<div class="temple-revive-row">' +
    '<div class="temple-revive-icon" style="background:' + visual.color + ';">' + visual.icon + '</div>' +
    '<div class="temple-revive-main">' +
      '<div class="temple-revive-name">' + visual.name + '</div>' +
      '<div class="temple-revive-state">' + visual.stateText + '</div>' +
    '</div>' +
    '<div class="temple-revive-cost">💰 ' + cost + '</div>' +
    '<button class="temple-revive-btn" data-character-id="' + characterId + '"' + (canAfford ? '' : ' disabled') + '>' + (canAfford ? '부활' : '골드 부족') + '</button>' +
  '</div>';
}

function reviveCharacterFromTemple(characterId) {
  const cost = getReviveCost(characterId);
  if (player.gold < cost) return;
  if (!reviveCharacter(characterId)) return;
  player.gold -= cost;
  AudioSystem.sfx.heal();
  showToast(getCharacterDisplayName(characterId) + ' 부활!');
  updateHUD();
  if (typeof renderCompanionPanel === 'function' && companionPanelOpen) renderCompanionPanel();
  autoSave();
  renderTemple();
}

function reviveAllCharactersFromTemple(totalCost) {
  if (player.gold < totalCost) return;
  if (!reviveAllDeadCharacters()) return;
  player.gold -= totalCost;
  AudioSystem.sfx.tierUp();
  showToast('모든 유령 파티원이 부활했습니다!');
  updateHUD();
  if (typeof renderCompanionPanel === 'function' && companionPanelOpen) renderCompanionPanel();
  autoSave();
  renderTemple();
}

function bindTempleActions(content, totalCost) {
  content.querySelectorAll('.temple-revive-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      reviveCharacterFromTemple(btn.getAttribute('data-character-id'));
    }, { stopPropagation: true });
  });

  const allBtn = document.getElementById('temple-revive-all');
  if (allBtn && !allBtn.disabled) {
    bindTap(allBtn, () => {
      reviveAllCharactersFromTemple(totalCost);
    }, { stopPropagation: true });
  }
}

function renderTemple() {
  const content = document.getElementById('temple-content');
  const templeGoldEl = document.getElementById('temple-gold');
  if (templeGoldEl) templeGoldEl.textContent = player.gold.toLocaleString();

  const deadCharacterIds = getDeadCharacterIds();
  if (deadCharacterIds.length === 0) {
    content.innerHTML = buildTempleEmptyState();
    return;
  }

  const totalCost = deadCharacterIds.reduce((sum, characterId) => sum + getReviveCost(characterId), 0);
  const canAffordAll = player.gold >= totalCost && deadCharacterIds.length > 1;

  content.innerHTML =
    '<div class="temple-note">유령 상태의 지휘관과 동료를 1인당 200G로 부활시킬 수 있습니다.</div>' +
    deadCharacterIds.map(buildTempleReviveRow).join('') +
    '<div class="temple-actions">' +
      '<button id="temple-revive-all" class="temple-revive-all-btn"' + (canAffordAll ? '' : ' disabled') + '>전체 부활 (💰 ' + totalCost + ')</button>' +
    '</div>';

  bindTempleActions(content, totalCost);
}
