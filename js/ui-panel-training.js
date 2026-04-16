'use strict';

// ─── Training Room Panel UI ─────────────────────────────────────────────
const trainingPanel = document.getElementById('training-panel');
bindTap(document.getElementById('training-panel-close'), () => closeTrainingPanel());

function openTrainingPanel() {
  if (!requireLivingCommanderForProgression('유령 상태에서는 승급 수련을 진행할 수 없습니다. 신전에서 먼저 부활하세요')) return;
  trainingPanelOpen = true;
  showPanel(trainingPanel);
  renderTrainingPanel();
}
function closeTrainingPanel() {
  trainingPanelOpen = false;
  hidePanel(trainingPanel);
}

function buildTrainingDeltaBadges(delta, labelPrefix) {
  if (!delta) return '<div class="training-badge-row"><span class="quest-chip done">즉시 승급 가능</span></div>';
  const rows = [];
  if (delta.maxHp > 0) rows.push('HP +' + delta.maxHp);
  if (delta.maxMp > 0) rows.push('MP +' + delta.maxMp);
  if (delta.atk > 0) rows.push('ATK +' + delta.atk);
  if (delta.def > 0) rows.push('DEF +' + delta.def);
  if (delta.speed > 0) rows.push('이속 +' + delta.speed.toFixed(2));
  if (delta.critChance > 0) rows.push('치명 +' + delta.critChance.toFixed(2) + '%');
  if (rows.length === 0) rows.push('변화 없음');
  return '<div class="training-badge-row">' + rows.map(text => '<span class="training-delta-badge">' + labelPrefix + ' ' + text + '</span>').join('') + '</div>';
}

function buildTrainingSummaryCard(currentTier, growthLine, nextTier, promotionTarget) {
  let html = '<div class="quest-card primary training-summary-card">';
  html += '<div class="quest-focus-head"><div class="quest-focus-title">현재 수련 상태</div><span class="quest-chip ' + (promotionTarget ? 'done' : 'active') + '">' + (promotionTarget ? '승급 가능' : '수련 중') + '</span></div>';
  html += '<div class="quest-focus-text">' + growthLine.lineName + ' 라인 기준으로 클래스를 단계적으로 올릴 수 있습니다.</div>';
  html += '<div class="training-summary-grid">';
  html += '<div class="training-summary-item"><span class="training-summary-label">현재 클래스</span><span class="training-summary-value" style="color:' + currentTier.color + '">' + currentTier.name + '</span></div>';
  html += '<div class="training-summary-item"><span class="training-summary-label">현재 레벨</span><span class="training-summary-value">Lv ' + player.level + '</span></div>';
  html += '<div class="training-summary-item"><span class="training-summary-label">라인</span><span class="training-summary-value">' + growthLine.lineName + '</span></div>';
  html += '<div class="training-summary-item"><span class="training-summary-label">다음 단계</span><span class="training-summary-value">' + (nextTier ? nextTier.name : '최종 승급') + '</span></div>';
  html += '</div></div>';
  return html;
}

function buildTrainingPromotionCard(currentTier, nextTier, promotionTarget, growthLine) {
  if (!nextTier) {
    return '<div class="quest-card"><div class="quest-focus-head"><div class="quest-focus-title">최종 승급 완료</div><span class="quest-chip done">완료</span></div><div class="quest-focus-text">지금은 ' + currentTier.name + ' 단계야. 더 이상 승급은 없고, 장비와 동료 조합 최적화가 다음 성장 포인트다.</div></div>';
  }

  const gateBlock = typeof getPlayerPromotionGateBlock === 'function' ? getPlayerPromotionGateBlock() : null;
  const growthDelta = promotionTarget ? getPlayerPromotionGrowthDelta() : null;
  const statBonus = promotionTarget ? getPlayerPromotionStatBonus() : null;
  let html = '<div class="quest-card training-promo-card">';
  let chipLabel;
  if (promotionTarget) chipLabel = '지금 가능';
  else if (gateBlock) chipLabel = gateBlock.reason === 'needTier8' ? '8단 만렙 필요' : '9단 만렙 필요';
  else chipLabel = 'Lv ' + nextTier.reqLevel + ' 필요';
  html += '<div class="quest-focus-head"><div class="quest-focus-title">다음 승급 안내</div><span class="quest-chip ' + (promotionTarget ? 'done' : 'active') + '">' + chipLabel + '</span></div>';
  html += '<div class="quest-row"><span class="quest-label">현재</span><span class="quest-value">' + currentTier.name + '</span></div>';
  html += '<div class="quest-row"><span class="quest-label">다음</span><span class="quest-value" style="color:' + nextTier.color + '">' + nextTier.name + '</span></div>';
  html += '<div class="quest-row"><span class="quest-label">조건</span><span class="quest-value">Lv ' + nextTier.reqLevel + ' 이상' + (nextTier.rank === 9 ? ' · 배틀/택틱스/매직마스터 문장' : nextTier.rank === 10 ? ' · 그랑 계열 문장' : '') + '</span></div>';
  let desc;
  if (promotionTarget) desc = '조건을 만족했다. 승급을 확정하면 즉시 능력치 보너스를 받고, 이후 레벨업 성장 보정도 함께 올라간다.';
  else if (gateBlock) desc = gateBlock.reason === 'needTier8'
      ? '8단 만렙(Lv100)을 달성해야 상위 문장이 해금되고 9단 승급이 열린다. 지금은 Lv ' + player.level + '이다.'
      : '9단 만렙(Lv200)을 달성해야 최종 문장이 해금되고 10단 승급이 열린다. 지금은 Lv ' + player.level + '이다.';
  else desc = '아직 수련이 더 필요하다. 현재 레벨은 Lv ' + player.level + '이고, ' + growthLine.lineName + ' 라인 다음 승급은 Lv ' + nextTier.reqLevel + '에서 열린다.';
  html += '<div class="quest-desc">' + desc + '</div>';
  if (promotionTarget) {
    html += '<div class="training-subtitle">즉시 보너스</div>';
    html += buildTrainingDeltaBadges(statBonus, '즉시');
    html += '<div class="training-subtitle">이후 레벨업 성장</div>';
    html += buildTrainingDeltaBadges(growthDelta, '성장');
  }
  html += '<div class="training-action-row"><button id="training-promote-btn" class="training-promote-btn"' + (promotionTarget ? '' : ' disabled') + '>' + (promotionTarget ? ('승급 확정: ' + promotionTarget.name) : '아직 승급 불가') + '</button></div>';
  html += '</div>';
  return html;
}

function getBaseLineSwitchOptions() {
  return [
    'infantry',
    'flyingKnight',
    'cavalry',
    'navalUnit',
    'lancer',
    'archer',
    'monk',
    'priest',
    'mage',
    'darkPriest',
  ];
}

function canSwitchBaseLine() {
  // 합체 전까지만 기본 병종 라인을 자유 전환할 수 있다.
  return !player.tier8UnlockLineId && !player.masterEmblemId && (player.tier || player.classRank || 1) >= 7;
}

function switchPlayerGrowthLine(lineId) {
  if (!canSwitchBaseLine()) {
    showToast('지금은 라인을 바꿀 수 없습니다');
    return;
  }
  if (player.classLine === lineId) return;
  player.classLine = lineId;
  syncPlayerGrowthState();
  showToast(getOriginalLineLabel(lineId) + ' 라인으로 전환');
  updateHUD();
  if (profileOpen) renderProfile();
  if (emblemRoomPanelOpen) renderEmblemRoomPanel();
  autoSave();
  renderTrainingPanel();
}

function buildTrainingLineSwitchCard() {
  if (!canSwitchBaseLine()) {
    if (player.tier8UnlockLineId || player.masterEmblemId) {
      const unlockLine = player.tier8UnlockLineId
        || (player.masterEmblemId ? (getEmblemDef(player.masterEmblemId) || {}).targetLine : null);
      const lineLabel = unlockLine ? getOriginalLineLabel(unlockLine) : '마스터';
      return '<div class="quest-card"><div class="quest-focus-head"><div class="quest-focus-title">라인 고정</div><span class="quest-chip done">' + lineLabel + ' 계열</span></div><div class="quest-focus-text">' +
        lineLabel + ' 합체를 완료한 뒤에는 기본 병종 라인으로 되돌릴 수 없다.</div></div>';
    }
    return '';
  }
  const options = getBaseLineSwitchOptions();
  return '<div class="quest-card training-line-card">' +
    '<div class="quest-focus-head"><div class="quest-focus-title">원형 병종 라인 전환</div><span class="quest-chip active">문장 수집 준비</span></div>' +
    '<div class="quest-desc">7단 이후에는 기본 병종 라인을 바꿔 각 문장의방 시험을 준비할 수 있다. 마스터 문장 융합 전까지 자유롭게 전환 가능하다.</div>' +
    '<div class="training-badge-row">' +
    options.map(lineId => {
      const active = player.classLine === lineId;
      return '<button class="training-line-btn' + (active ? ' active' : '') + '" data-line-id="' + lineId + '">' + getOriginalLineLabel(lineId) + '</button>';
    }).join('') +
    '</div></div>';
}

function promotePlayerClass() {
  const target = getPlayerPromotionTarget();
  if (!target) {
    showToast('아직 승급할 수 없습니다');
    return;
  }
  const statBonus = getPlayerPromotionStatBonus();
  if (statBonus) applyPromotionBonus(statBonus);
  player.classRank = target.rank;
  player.promotionBonusRankApplied = target.rank;
  syncPlayerGrowthState();
  // lightsaber_test: 9단/10단은 단독 승급 변신 연출 (재료 캐릭터 없음).
  // 7→8은 합체 플로우에서 이미 별도로 처리되므로 여기선 rank 9/10만 프리젠터로 띄운다.
  if ((target.rank === 9 || target.rank === 10) && typeof queueAscensionTransformation === 'function') {
    queueAscensionTransformation(target.rank, player.classLine, target);
  } else {
    showTierBanner(target);
  }
  addParticles(player.x, player.y, target.color, 28);
  showToast(target.name + ' 승급 완료!');
  updateHUD();
  if (profileOpen) renderProfile();
  autoSave();
  renderTrainingPanel();
}

function bindTrainingActions(content) {
  const promoteBtn = content.querySelector('#training-promote-btn');
  if (promoteBtn && !promoteBtn.disabled) {
    bindTap(promoteBtn, () => promotePlayerClass(), { stopPropagation: true });
  }
  content.querySelectorAll('.training-line-btn').forEach(btn => {
    bindTap(btn, () => {
      const lineId = btn.getAttribute('data-line-id');
      switchPlayerGrowthLine(lineId);
    }, { stopPropagation: true });
  });
}

function renderTrainingPanel() {
  const content = document.getElementById('training-panel-content');
  const summaryEl = document.getElementById('training-summary');
  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const promotionTarget = getPlayerPromotionTarget();
  const commanderName = typeof getCharacterDisplayName === 'function'
    ? getCharacterDisplayName(currentCommanderId || (typeof getHeroCharacterId === 'function' ? getHeroCharacterId() : 'hero'))
    : '주인공';

  if (summaryEl) {
    summaryEl.textContent = commanderName + ' \u00B7 ' + currentTier.name + ' \u00B7 ' + growthLine.lineName + (promotionTarget ? ' \u00B7 \uC2B9\uAE09\uAC00\uB2A5' : '');
    summaryEl.style.color = promotionTarget ? '#2ecc71' : '#aaa';
  }

  content.innerHTML =
    buildTrainingSummaryCard(currentTier, growthLine, nextTier, promotionTarget) +
    buildTrainingPromotionCard(currentTier, nextTier, promotionTarget, growthLine) +
    buildTrainingLineSwitchCard();

  bindTrainingActions(content);
}
