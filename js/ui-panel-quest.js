'use strict';

// ─── Quest Panel UI ──────────────────────────────────────────────────────
const questPanel = document.getElementById('quest-panel');
bindTap(document.getElementById('quest-panel-close'), () => closeQuestPanel());

function openQuestPanel() {
  questPanelOpen = true;
  showPanel(questPanel);
  renderQuestPanel();
}
function closeQuestPanel() {
  questPanelOpen = false;
  hidePanel(questPanel);
}
function buildQuestRow(label, value) {
  return '<div class="quest-row"><span class="quest-label">' + label + '</span><span class="quest-value">' + value + '</span></div>';
}

function buildQuestFocusSection({ focusTitle, focusText, focusChip, focusChipClass, currentMainStatus, readySubCount, acceptedCount, nextDungeon }) {
  let html = '<div class="quest-card primary quest-focus-card">';
  html += '<div class="quest-focus-head"><div class="quest-focus-title">' + focusTitle + '</div><span class="quest-chip ' + focusChipClass + '">' + focusChip + '</span></div>';
  html += '<div class="quest-focus-text">' + focusText + '</div>';
  html += '<div class="quest-summary-grid">';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">메인 진행</span><span class="quest-summary-value">' + completedMainQuests.length + '/' + MAIN_QUESTS.length + '</span></div>';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">서브 진행</span><span class="quest-summary-value">' + acceptedCount + '개</span></div>';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">보고 가능</span><span class="quest-summary-value">' + ((currentMainStatus.ready ? 1 : 0) + readySubCount) + '개</span></div>';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">다음 던전</span><span class="quest-summary-value">' + (nextDungeon ? nextDungeon.name : '완료') + '</span></div>';
  html += '</div></div>';
  return html;
}

function buildMainQuestSection(currentQuest, currentMainStatus) {
  let html = '<div class="quest-section-title">메인 진행</div><div class="quest-card primary">';
  html += buildQuestRow('현재 목표', currentQuest ? currentQuest.title : '모든 메인 퀘스트 완료');
  if (currentQuest) {
    html += buildQuestRow('의뢰 NPC', getQuestNpcName(getQuestOfferNpcId(currentQuest)));
    html += buildQuestRow('보고 NPC', getQuestNpcName(getQuestTurnInNpcId(currentQuest)));
    html += buildQuestRow('상태', currentMainStatus.label);
    if (currentQuest.reward) html += buildQuestRow('보상', buildQuestRewardText(currentQuest));
    html += '<div class="quest-desc">' + currentQuest.description + '</div>';
    html += '<div class="quest-desc quest-desc-emphasis">' +
      (currentMainStatus.ready
        ? ('목표 달성 완료. <span class="quest-inline-highlight">' + getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '</span>에게 돌아가 보상을 수령하세요.')
        : ('다음 행동: ' + (currentQuest.hint || currentQuest.description))) +
      '</div>';
  } else {
    html += buildQuestRow('진행도', completedMainQuests.length + '/' + MAIN_QUESTS.length);
    html += '<div class="quest-desc">메인 루프를 전부 완료했습니다. 동료 조합과 장비를 계속 시험해볼 수 있습니다.</div>';
  }
  html += '</div>';
  return html;
}

function buildDungeonProgressSection(nextDungeon) {
  let html = '<div class="quest-section-title">던전 진행</div><div class="quest-dungeon-list">';
  DUNGEON_INFO.forEach((info, idx) => {
    const cleared = dungeonsCleared.includes(idx);
    const isNext = nextDungeon && nextDungeon.id === idx;
    html += '<div class="quest-dungeon-item ' + (cleared ? 'done' : '') + ' ' + (isNext ? 'next' : '') + '">';
    html += '<div class="quest-dungeon-head">';
    html += '<div><div class="quest-dungeon-name">' + info.name + '</div><div class="quest-dungeon-meta">추천 Lv ' + info.recommendedLevel + ' · 지역 ' + info.zone + '</div></div>';
    html += '<div class="quest-chip ' + (cleared ? 'done' : isNext ? 'active' : '') + '">' + (cleared ? '완료' : isNext ? '다음 목표' : '미완료') + '</div>';
    html += '</div>';
    html += '<div class="quest-dungeon-boss">보스: ' + info.bossName + ' · 패턴: ' + info.bossSkillName + '</div>';
    html += '<div class="quest-dungeon-reward">동료 보상: ' + info.companionName + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function buildSubquestStatusSection({ acceptedCount, completedCount, totalSubquests, availableSubquests, acceptedDetails }) {
  let html = '<div class="quest-section-title">서브 퀘스트 현황</div><div class="quest-card">';
  html += buildQuestRow('수락 중', acceptedCount);
  html += buildQuestRow('완료', completedCount + '/' + totalSubquests);
  html += buildQuestRow('새로 수락 가능', availableSubquests.length);
  html += '</div>';

  if (acceptedDetails.length > 0) {
    acceptedDetails.forEach(detail => {
      html += '<div class="quest-card">';
      html += buildQuestRow('퀘스트', detail.quest.title);
      html += '<div class="quest-chip-row">' +
        '<span class="quest-chip ' + (detail.readyToTurnIn ? 'done' : 'active') + '">' + detail.statusLabel + '</span>' +
        '<span class="quest-chip">진행도 ' + detail.progressText + '</span>' +
      '</div>';
      html += buildQuestRow('의뢰 NPC', detail.offerNpcName);
      html += buildQuestRow('보고 NPC', detail.turnInNpcName);
      html += buildQuestRow('보상', detail.rewardText || '없음');
      html += '<div class="quest-desc">' + detail.quest.description + '</div>';
      html += '<div class="quest-desc quest-desc-emphasis ' + (detail.readyToTurnIn ? 'ready' : 'pending') + '">' +
        (detail.readyToTurnIn
          ? ('목표 달성 완료. ' + detail.turnInNpcName + '에게 돌아가 보상을 수령하세요.')
          : ('아직 진행 중입니다. 완료 후 ' + detail.turnInNpcName + '에게 보고하세요.')) +
        '</div>';
      html += '</div>';
    });
  } else {
    html += '<div class="quest-card"><div class="quest-desc">현재 진행 중인 서브 퀘스트가 없습니다.</div></div>';
  }

  if (availableSubquests.length > 0) {
    html += '<div class="quest-section-title">수락 가능한 서브 퀘스트</div>';
    availableSubquests.forEach(quest => {
      html += '<div class="quest-card">';
      html += buildQuestRow('퀘스트', quest.title);
      html += '<div class="quest-chip-row"><span class="quest-chip active">수락 가능</span></div>';
      html += buildQuestRow('의뢰 NPC', getQuestNpcName(getQuestOfferNpcId(quest)));
      html += buildQuestRow('보상 수령 NPC', getQuestNpcName(getQuestTurnInNpcId(quest)));
      html += buildQuestRow('예상 보상', buildQuestRewardText(quest) || '없음');
      html += '<div class="quest-desc">' + quest.description + '</div>';
      html += '</div>';
    });
  }
  return html;
}

function renderQuestPanel() {
  const content = document.getElementById('quest-panel-content');
  const nextDungeon = DUNGEON_INFO.find((_, idx) => !dungeonsCleared.includes(idx));
  const currentQuest = getCurrentMainQuest();
  const currentMainStatus = getMainQuestStatus(currentQuest);
  const totalSubquests = SUBQUESTS.length;
  const acceptedCount = acceptedSubquests.length;
  const completedCount = completedSubquests.length;
  const availableSubquests = getAvailableSubquests();
  const acceptedDetails = getAcceptedSubquestsDetailed().slice().sort((a, b) => {
    if (a.readyToTurnIn !== b.readyToTurnIn) return a.readyToTurnIn ? -1 : 1;
    return a.quest.title.localeCompare(b.quest.title, 'ko');
  });
  const readySubCount = acceptedDetails.filter(detail => detail.readyToTurnIn).length;

  let focusTitle = '지금 할 일';
  let focusText = '다음 퀘스트를 확인해 진행을 이어가세요.';
  let focusChip = '진행 중';
  let focusChipClass = 'active';

  if (currentQuest && currentMainStatus.ready) {
    focusText = getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '에게 가서 메인 퀘스트 보상을 받으세요.';
    focusChip = '메인 보고 가능';
    focusChipClass = 'done';
  } else if (readySubCount > 0) {
    focusText = '서브 퀘스트 ' + readySubCount + '개를 바로 보고할 수 있습니다.';
    focusChip = '서브 보고 가능';
    focusChipClass = 'done';
  } else if (currentQuest) {
    focusText = currentQuest.hint || currentQuest.description;
    focusChip = currentMainStatus.label;
  } else if (availableSubquests.length > 0) {
    focusText = '마을 NPC와 대화해 새 서브 퀘스트를 받아보세요.';
    focusChip = '수락 가능';
  } else {
    focusTitle = '현재 상태';
    focusText = '메인 루프를 완료했습니다. 장비와 동료 조합을 다듬으며 계속 성장할 수 있습니다.';
    focusChip = '완료';
    focusChipClass = 'done';
  }

  content.innerHTML = [
    buildQuestFocusSection({ focusTitle, focusText, focusChip, focusChipClass, currentMainStatus, readySubCount, acceptedCount, nextDungeon }),
    buildMainQuestSection(currentQuest, currentMainStatus),
    buildDungeonProgressSection(nextDungeon),
    buildSubquestStatusSection({ acceptedCount, completedCount, totalSubquests, availableSubquests, acceptedDetails })
  ].join('');
}
