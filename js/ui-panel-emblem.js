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

function buildEmblemRequirementChip(ok, text) {
  return '<span class="quest-chip ' + (ok ? 'done' : 'active') + '">' + text + '</span>';
}

function buildEmblemRoomSummaryCard() {
  const lineLabel = getOriginalLineLabel(player.classLine || 'infantry');
  const levelCap = getPlayerLevelCap();
  return '<div class="quest-card primary training-summary-card">' +
    '<div class="quest-focus-head"><div class="quest-focus-title">문장의방 진입 현황</div><span class="quest-chip active">원본형 성장 루프</span></div>' +
    '<div class="quest-focus-text">7단 Lv35와 충분한 공격력/방어력을 만족하면 병종별 기본 문장 시험 전투에 도전할 수 있다.</div>' +
    '<div class="training-summary-grid">' +
      '<div class="training-summary-item"><span class="training-summary-label">현재 라인</span><span class="training-summary-value">' + lineLabel + '</span></div>' +
      '<div class="training-summary-item"><span class="training-summary-label">현재 단수</span><span class="training-summary-value">' + (player.tier || 1) + '단</span></div>' +
      '<div class="training-summary-item"><span class="training-summary-label">현재 레벨</span><span class="training-summary-value">Lv ' + player.level + ' / ' + levelCap + '</span></div>' +
      '<div class="training-summary-item"><span class="training-summary-label">전투 수치</span><span class="training-summary-value">ATK ' + playerAtk() + ' · DEF ' + playerDef() + '</span></div>' +
    '</div>' +
  '</div>';
}

function buildUnitEmblemCard(emblem) {
  const status = getPlayerEmblemTrialStatus(emblem.id);
  const chips = [
    buildEmblemRequirementChip(status.lineOk, '라인 ' + getOriginalLineLabel(emblem.targetLine)),
    buildEmblemRequirementChip(status.tierOk, '단수 ' + emblem.requiredTier + '+'),
    buildEmblemRequirementChip(status.levelOk, 'Lv ' + emblem.requiredLevel + '+'),
    buildEmblemRequirementChip(status.attackOk, 'ATK ' + emblem.requiredAttack),
    buildEmblemRequirementChip(status.defenseOk, 'DEF ' + emblem.requiredDefense),
  ].join('');
  const bonusRows = [];
  if (emblem.bonus.atk) bonusRows.push('ATK +' + emblem.bonus.atk);
  if (emblem.bonus.def) bonusRows.push('DEF +' + emblem.bonus.def);
  if (emblem.bonus.maxHp) bonusRows.push('HP +' + emblem.bonus.maxHp);
  if (emblem.bonus.maxMp) bonusRows.push('MP +' + emblem.bonus.maxMp);
  if (emblem.bonus.speed) bonusRows.push('이속 +' + emblem.bonus.speed.toFixed(2));
  if (emblem.bonus.critChance) bonusRows.push('치명 +' + emblem.bonus.critChance + '%');
  const actionLabel = status.owned ? '보유 완료' : (status.canEnter ? '시험 전투 시작' : '조건 부족');
  return '<div class="quest-card training-promo-card">' +
    '<div class="quest-focus-head"><div class="quest-focus-title">' + emblem.name + '</div><span class="quest-chip ' + (status.owned ? 'done' : (status.canEnter ? 'done' : 'active')) + '">' + (status.owned ? '보유 중' : (status.canEnter ? '도전 가능' : '잠김')) + '</span></div>' +
    '<div class="quest-desc">대상 라인: ' + getOriginalLineLabel(emblem.targetLine) + '</div>' +
    '<div class="training-badge-row">' + chips + '</div>' +
    '<div class="quest-desc">기본 보너스: ' + bonusRows.join(' / ') + '</div>' +
    '<div class="training-action-row"><button class="training-promote-btn emblem-claim-btn" data-emblem-id="' + emblem.id + '"' + (status.canEnter && !status.owned ? '' : ' disabled') + '>' + actionLabel + '</button></div>' +
  '</div>';
}

function buildMasterEmblemCard(emblem) {
  const owned = playerHasEmblem(emblem.id);
  const ready = canPlayerFuseMasterEmblem(emblem.id);
  const materials = (emblem.fusionMaterials || []).map(id => {
    const material = getEmblemDef(id);
    return '<span class="quest-chip ' + (playerHasEmblem(id) ? 'done' : 'active') + '">' + (material ? material.name : id) + '</span>';
  }).join('');
  const bonusRows = [];
  if (emblem.bonus.atk) bonusRows.push('ATK +' + emblem.bonus.atk);
  if (emblem.bonus.def) bonusRows.push('DEF +' + emblem.bonus.def);
  if (emblem.bonus.maxHp) bonusRows.push('HP +' + emblem.bonus.maxHp);
  if (emblem.bonus.maxMp) bonusRows.push('MP +' + emblem.bonus.maxMp);
  if (emblem.bonus.critChance) bonusRows.push('치명 +' + emblem.bonus.critChance + '%');
  const actionLabel = owned ? '융합 완료' : (ready ? '마스터 문장 융합' : '재료 부족');
  return '<div class="quest-card">' +
    '<div class="quest-focus-head"><div class="quest-focus-title">' + emblem.name + '</div><span class="quest-chip ' + (owned ? 'done' : (ready ? 'done' : 'active')) + '">' + (owned ? '보유 중' : (ready ? '융합 가능' : '잠김')) + '</span></div>' +
    '<div class="quest-desc">계열: ' + getOriginalLineLabel(emblem.targetLine) + '</div>' +
    '<div class="training-badge-row">' + materials + '</div>' +
    '<div class="quest-desc">마스터 보너스: ' + bonusRows.join(' / ') + '</div>' +
    '<div class="training-action-row"><button class="training-promote-btn emblem-fuse-btn" data-emblem-id="' + emblem.id + '"' + (ready && !owned ? '' : ' disabled') + '>' + actionLabel + '</button></div>' +
  '</div>';
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
}

function buildEmblemCompactRow(emblem) {
  const status = getPlayerEmblemTrialStatus(emblem.id);
  const bonusParts = [];
  if (emblem.bonus.atk) bonusParts.push('ATK+' + emblem.bonus.atk);
  if (emblem.bonus.def) bonusParts.push('DEF+' + emblem.bonus.def);
  if (emblem.bonus.maxHp) bonusParts.push('HP+' + emblem.bonus.maxHp);
  if (emblem.bonus.maxMp) bonusParts.push('MP+' + emblem.bonus.maxMp);
  if (emblem.bonus.speed) bonusParts.push('SPD+' + emblem.bonus.speed.toFixed(2));
  if (emblem.bonus.critChance) bonusParts.push('CRIT+' + emblem.bonus.critChance + '%');
  const statusLabel = status.owned ? '\u2705' : status.canEnter ? '\u25B6' : '\uD83D\uDD12';
  const cls = status.owned ? 'done' : status.canEnter ? 'next' : '';
  return '<div class="emblem-row ' + cls + '">' +
    '<span class="emb-name">' + emblem.name + '</span>' +
    '<span class="emb-line">' + getOriginalLineLabel(emblem.targetLine) + '</span>' +
    '<span class="emb-bonus">' + bonusParts.join(' ') + '</span>' +
    '<span class="emb-status">' + statusLabel + '</span>' +
    (status.canEnter && !status.owned ? '<button class="emb-btn emblem-claim-btn" data-emblem-id="' + emblem.id + '">\uB3C4\uC804</button>' : '') +
  '</div>';
}

function buildMasterEmblemCompactRow(emblem) {
  const owned = playerHasEmblem(emblem.id);
  const ready = canPlayerFuseMasterEmblem(emblem.id);
  const matCount = (emblem.fusionMaterials || []).filter(id => playerHasEmblem(id)).length;
  const matTotal = (emblem.fusionMaterials || []).length;
  const bonusParts = [];
  if (emblem.bonus.atk) bonusParts.push('ATK+' + emblem.bonus.atk);
  if (emblem.bonus.def) bonusParts.push('DEF+' + emblem.bonus.def);
  if (emblem.bonus.maxHp) bonusParts.push('HP+' + emblem.bonus.maxHp);
  if (emblem.bonus.critChance) bonusParts.push('CRIT+' + emblem.bonus.critChance + '%');
  const statusLabel = owned ? '\u2705' : ready ? '\u25B6' : matCount + '/' + matTotal;
  const cls = owned ? 'done' : ready ? 'next' : '';
  return '<div class="emblem-row master ' + cls + '">' +
    '<span class="emb-name">' + emblem.name + '</span>' +
    '<span class="emb-line">' + getOriginalLineLabel(emblem.targetLine) + '</span>' +
    '<span class="emb-bonus">' + bonusParts.join(' ') + '</span>' +
    '<span class="emb-status">' + statusLabel + '</span>' +
    (ready && !owned ? '<button class="emb-btn emblem-fuse-btn" data-emblem-id="' + emblem.id + '">\uC735\uD569</button>' : '') +
  '</div>';
}

function renderEmblemRoomPanel() {
  const content = document.getElementById('emblem-room-panel-content');
  const summaryEl = document.getElementById('emblem-summary');
  const unitEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.unit);
  const masterEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.master);
  const ownedCount = (player.emblemIds || []).length;

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
          '<div class="emb-info-row"><span>ATK</span><span>' + playerAtk() + '</span></div>' +
          '<div class="emb-info-row"><span>DEF</span><span>' + playerDef() + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  bindEmblemRoomActions(content);
}
