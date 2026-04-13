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

function renderQuestPanel() {
  const content = document.getElementById('quest-panel-content');
  const summaryEl = document.getElementById('quest-summary');
  const nextDungeon = DUNGEON_INFO.find((_, idx) => !dungeonsCleared.includes(idx));
  const currentQuest = getCurrentMainQuest();
  const currentMainStatus = getMainQuestStatus(currentQuest);
  const acceptedCount = acceptedSubquests.length;
  const completedCount = completedSubquests.length;
  const availableSubquests = getAvailableSubquests();
  const acceptedDetails = getAcceptedSubquestsDetailed().slice().sort((a, b) => {
    if (a.readyToTurnIn !== b.readyToTurnIn) return a.readyToTurnIn ? -1 : 1;
    return a.quest.title.localeCompare(b.quest.title, 'ko');
  });
  const readySubCount = acceptedDetails.filter(d => d.readyToTurnIn).length;
  const readyTotal = (currentMainStatus.ready ? 1 : 0) + readySubCount;

  // Header summary
  if (summaryEl) {
    summaryEl.textContent = '\uBA54\uC778 ' + completedMainQuests.length + '/' + MAIN_QUESTS.length +
      ' \u00B7 \uC11C\uBE0C ' + completedCount + '/' + SUBQUESTS.length +
      (readyTotal > 0 ? ' \u00B7 \uBCF4\uACE0\uAC00\uB2A5 ' + readyTotal : '');
  }

  // Focus line
  let focusText = '';
  let focusCls = '';
  if (currentQuest && currentMainStatus.ready) {
    focusText = '\uD83D\uDFE2 ' + getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '\uC5D0\uAC8C \uBA54\uC778 \uBCF4\uACE0';
    focusCls = 'focus-ready';
  } else if (readySubCount > 0) {
    focusText = '\uD83D\uDFE2 \uC11C\uBE0C \uBCF4\uACE0 \uAC00\uB2A5 ' + readySubCount + '\uAC1C';
    focusCls = 'focus-ready';
  } else if (currentQuest) {
    focusText = '\uD83D\uDFE1 ' + (currentQuest.hint || currentQuest.title);
    focusCls = 'focus-active';
  } else {
    focusText = '\u2705 \uBA54\uC778 \uC644\uB8CC';
    focusCls = 'focus-done';
  }

  content.innerHTML =
    '<div class="quest-focus-line ' + focusCls + '">' + focusText + '</div>' +
    '<div class="quest-columns">' +

      // ── LEFT: Main + Sub quests ──
      '<div class="quest-left">' +
        buildMainQuestCompact(currentQuest, currentMainStatus) +
        buildSubQuestCompact(acceptedDetails, availableSubquests) +
      '</div>' +

      // ── RIGHT: Dungeon progress ──
      '<div class="quest-right">' +
        '<div class="quest-section-label">\uB358\uC804 \uC9C4\uD589 ' + dungeonsCleared.length + '/9</div>' +
        '<div class="quest-dungeon-table">' +
          DUNGEON_INFO.map((info, idx) => {
            const cleared = dungeonsCleared.includes(idx);
            const isNext = nextDungeon && nextDungeon.id === idx;
            const cls = cleared ? 'done' : isNext ? 'next' : '';
            return '<div class="quest-dg-row ' + cls + '">' +
              '<span class="dg-name">' + info.name + '</span>' +
              '<span class="dg-level">Lv.' + info.recommendedLevel + '</span>' +
              '<span class="dg-boss">' + info.bossName + '</span>' +
              '<span class="dg-reward">' + info.companionName + '</span>' +
              '<span class="dg-status">' + (cleared ? '\u2705' : isNext ? '\u25B6' : '\u2014') + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +

    '</div>';
}

function buildMainQuestCompact(quest, status) {
  if (!quest) {
    return '<div class="quest-compact-card">' +
      '<div class="quest-section-label">\uBA54\uC778 \uD038\uC2A4\uD2B8</div>' +
      '<div class="quest-compact-body">\uBAA8\uB4E0 \uBA54\uC778 \uD038\uC2A4\uD2B8 \uC644\uB8CC</div>' +
    '</div>';
  }
  const npcOffer = getQuestNpcName(getQuestOfferNpcId(quest));
  const npcTurnIn = getQuestNpcName(getQuestTurnInNpcId(quest));
  return '<div class="quest-compact-card main">' +
    '<div class="quest-section-label">\uBA54\uC778 \u00B7 ' + quest.title + '</div>' +
    '<div class="quest-compact-rows">' +
      '<div class="qc-row"><span class="qc-label">\uC0C1\uD0DC</span><span class="qc-val ' + (status.ready ? 'ready' : '') + '">' + status.label + '</span></div>' +
      '<div class="qc-row"><span class="qc-label">\uC758\uB8B0</span><span class="qc-val">' + npcOffer + '</span></div>' +
      '<div class="qc-row"><span class="qc-label">\uBCF4\uACE0</span><span class="qc-val">' + npcTurnIn + '</span></div>' +
      (quest.reward ? '<div class="qc-row"><span class="qc-label">\uBCF4\uC0C1</span><span class="qc-val gold">' + buildQuestRewardText(quest) + '</span></div>' : '') +
    '</div>' +
    '<div class="quest-compact-desc">' + quest.description + '</div>' +
  '</div>';
}

function buildSubQuestCompact(acceptedDetails, availableSubquests) {
  let html = '<div class="quest-compact-card">' +
    '<div class="quest-section-label">\uC11C\uBE0C \uD038\uC2A4\uD2B8 \u00B7 \uC9C4\uD589 ' + acceptedDetails.length + ' \u00B7 \uC218\uB77D\uAC00\uB2A5 ' + availableSubquests.length + '</div>';

  if (acceptedDetails.length > 0) {
    html += '<div class="quest-sub-list">';
    acceptedDetails.forEach(d => {
      const cls = d.readyToTurnIn ? 'ready' : '';
      html += '<div class="quest-sub-row ' + cls + '">' +
        '<span class="qs-name">' + d.quest.title + '</span>' +
        '<span class="qs-progress">' + d.progressText + '</span>' +
        '<span class="qs-status">' + (d.readyToTurnIn ? '\uBCF4\uACE0' : d.statusLabel) + '</span>' +
      '</div>';
    });
    html += '</div>';
  } else if (availableSubquests.length > 0) {
    html += '<div class="quest-compact-body">NPC\uC640 \uB300\uD654\uD574 \uC11C\uBE0C \uD038\uC2A4\uD2B8\uB97C \uBC1B\uC73C\uC138\uC694</div>';
  } else {
    html += '<div class="quest-compact-body">\uC9C4\uD589 \uC911\uC778 \uC11C\uBE0C \uD038\uC2A4\uD2B8 \uC5C6\uC74C</div>';
  }

  html += '</div>';
  return html;
}
