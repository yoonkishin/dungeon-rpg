'use strict';

// ─── Emblem Room Panel UI ───────────────────────────────────────────────
const emblemRoomPanel = document.getElementById('emblem-room-panel');
bindTap(document.getElementById('emblem-room-panel-close'), () => closeEmblemRoomPanel());

function openEmblemRoomPanel() {
  emblemRoomPanelOpen = true;
  showPanel(emblemRoomPanel);
  renderEmblemRoomPanel();
}
function closeEmblemRoomPanel() {
  emblemRoomPanelOpen = false;
  hidePanel(emblemRoomPanel);
}

function formatEmblemBonus(bonus) {
  const parts = [];
  if (bonus.atk) parts.push('ATK+' + bonus.atk);
  if (bonus.def) parts.push('DEF+' + bonus.def);
  if (bonus.maxHp) parts.push('HP+' + bonus.maxHp);
  if (bonus.maxMp) parts.push('MP+' + bonus.maxMp);
  if (bonus.speed) parts.push('SPD+' + bonus.speed.toFixed(2));
  if (bonus.critChance) parts.push('CRIT+' + bonus.critChance + '%');
  return parts.join(' ');
}

function bindEmblemRoomActions(content) {
  content.querySelectorAll('.emblem-claim-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      const emblemId = btn.getAttribute('data-emblem-id');
      const emblem = getEmblemDef(emblemId);
      if (!startEmblemTrial(emblemId)) {
        showToast('아직 시험 조건이 부족하다');
        return;
      }
      closeEmblemRoomPanel();
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.emblem-fuse-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      const emblemId = btn.getAttribute('data-emblem-id');
      const emblem = getEmblemDef(emblemId);
      if (!fusePlayerMasterEmblem(emblemId)) {
        showToast('융합 재료가 부족하다');
        return;
      }
      addParticles(player.x, player.y, '#f1c40f', 30);
      showToast((emblem ? emblem.name : '마스터 문장') + ' 융합 완료!');
      updateHUD();
      if (profileOpen) renderProfile();
      renderEmblemRoomPanel();
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.emblem-equip-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      const emblemId = btn.getAttribute('data-emblem-id');
      if (!equipPlayerEmblem(emblemId, { silent: false })) {
        showToast('문장을 장착할 수 없다');
        return;
      }
      renderEmblemRoomPanel();
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.emblem-unequip-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      if (!unequipPlayerEmblem({ silent: false })) return;
      renderEmblemRoomPanel();
    }, { stopPropagation: true });
  });
}

function buildEmblemCompactRow(emblem) {
  const status = getPlayerEmblemTrialStatus(emblem.id);
  const isActive = player.activeEmblemId === emblem.id;
  const statusLabel = isActive ? '\u2694' : status.owned ? '\u2705' : status.canEnter ? '\u25B6' : '\uD83D\uDD12';
  const cls = isActive ? 'next' : status.owned ? 'done' : status.canEnter ? 'next' : '';
  return '<div class="emblem-row ' + cls + '">' +
    '<span class="emb-name">' + emblem.name + '</span>' +
    '<span class="emb-line">' + getOriginalLineLabel(emblem.targetLine) + '</span>' +
    '<span class="emb-bonus">' + formatEmblemBonus(emblem.bonus) + '</span>' +
    '<span class="emb-status">' + statusLabel + '</span>' +
    (status.canEnter && !status.owned ? '<button class="emb-btn emblem-claim-btn" data-emblem-id="' + emblem.id + '">\uB3C4\uC804</button>' : '') +
    (status.owned && !isActive ? '<button class="emb-btn emblem-equip-btn" data-emblem-id="' + emblem.id + '">\uC7A5\uCC29</button>' : '') +
    (isActive ? '<button class="emb-btn emblem-unequip-btn" data-emblem-id="' + emblem.id + '">\uD574\uC81C</button>' : '') +
  '</div>';
}

function buildMasterEmblemCompactRow(emblem) {
  const owned = playerHasEmblem(emblem.id);
  const ready = canPlayerFuseMasterEmblem(emblem.id);
  const isActive = player.activeEmblemId === emblem.id;
  const matCount = (emblem.fusionMaterials || []).filter(id => playerHasEmblem(id)).length;
  const matTotal = (emblem.fusionMaterials || []).length;
  const statusLabel = isActive ? '\u2694' : owned ? '\u2705' : ready ? '\u25B6' : matCount + '/' + matTotal;
  const cls = isActive ? 'next' : owned ? 'done' : ready ? 'next' : '';
  return '<div class="emblem-row master ' + cls + '">' +
    '<span class="emb-name">' + emblem.name + '</span>' +
    '<span class="emb-line">' + getOriginalLineLabel(emblem.targetLine) + '</span>' +
    '<span class="emb-bonus">' + formatEmblemBonus(emblem.bonus) + '</span>' +
    '<span class="emb-status">' + statusLabel + '</span>' +
    (ready && !owned ? '<button class="emb-btn emblem-fuse-btn" data-emblem-id="' + emblem.id + '">\uC735\uD569</button>' : '') +
    (owned && !isActive ? '<button class="emb-btn emblem-equip-btn" data-emblem-id="' + emblem.id + '">\uC7A5\uCC29</button>' : '') +
    (isActive ? '<button class="emb-btn emblem-unequip-btn" data-emblem-id="' + emblem.id + '">\uD574\uC81C</button>' : '') +
  '</div>';
}

function renderEmblemRoomPanel() {
  const content = document.getElementById('emblem-room-panel-content');
  const summaryEl = document.getElementById('emblem-summary');
  const unitEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.unit);
  const masterEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.master);
  const ownedCount = (player.emblemIds || []).length;
  const activeEmblem = typeof getActivePlayerEmblem === 'function' ? getActivePlayerEmblem() : null;

  if (summaryEl) {
    summaryEl.textContent = '\uBCF4\uC720 ' + ownedCount + '/' + (unitEmblems.length + masterEmblems.length);
    summaryEl.style.color = '#aaa';
  }

  content.innerHTML =
    '<div class="emblem-columns">' +
      '<div class="emblem-col">' +
        '<div class="quest-section-label">\uAE30\uBCF8 \uBB38\uC7A5 ' + unitEmblems.length + '\uC885</div>' +
        '<div class="emblem-table">' + unitEmblems.map(buildEmblemCompactRow).join('') + '</div>' +
      '</div>' +
      '<div class="emblem-col emblem-col-right">' +
        '<div class="quest-section-label">\uB9C8\uC2A4\uD130 \uBB38\uC7A5 ' + masterEmblems.length + '\uC885</div>' +
        '<div class="emblem-table">' + masterEmblems.map(buildMasterEmblemCompactRow).join('') + '</div>' +
        '<div class="emblem-info-box">' +
          '<div class="quest-section-label">\uD604\uC7AC \uC0C1\uD0DC</div>' +
          '<div class="emb-info-row"><span>\uB77C\uC778</span><span>' + getOriginalLineLabel(player.classLine || 'infantry') + '</span></div>' +
          '<div class="emb-info-row"><span>\uB2E8\uC218</span><span>' + (player.tier || 1) + '\uB2E8</span></div>' +
          '<div class="emb-info-row"><span>\uB808\uBCA8</span><span>Lv.' + player.level + '</span></div>' +
          '<div class="emb-info-row"><span>\uD65C\uC131 \uBB38\uC7A5</span><span>' + (activeEmblem ? activeEmblem.name : '\uC5C6\uC74C') + '</span></div>' +
          '<div class="emb-info-row"><span>ATK</span><span>' + playerAtk() + '</span></div>' +
          '<div class="emb-info-row"><span>DEF</span><span>' + playerDef() + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  bindEmblemRoomActions(content);
}
