'use strict';

// ─── Emblem Room Panel UI ───────────────────────────────────────────────
const emblemRoomPanel = document.getElementById('emblem-room-panel');
bindTap(document.getElementById('emblem-room-panel-close'), () => closeEmblemRoomPanel());

function openEmblemRoomPanel() {
  if (!requireLivingCommanderForProgression('유령 상태에서는 문장 진행을 할 수 없습니다. 신전에서 먼저 부활하세요')) return;
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
      const masterLineId = btn.getAttribute('data-line-id');
      const recipe = getFusionRecipeForLine(masterLineId);
      if (!fuseTier7ToUnlockTier8(masterLineId)) {
        showToast('합체 재료가 부족하거나 이미 다른 라인이 해금됐다');
        return;
      }
      addParticles(player.x, player.y, recipe ? recipe.colors.primary : '#f1c40f', 36);
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
  const equipWarn = status.owned && !isActive && equipped.helmet ? '<span class="emb-warn">헬멧 해제</span>' : '';
  return '<div class="emblem-row ' + cls + '">' +
    '<span class="emb-name">' + emblem.name + '</span>' +
    '<span class="emb-line">' + getOriginalLineLabel(emblem.targetLine) + '</span>' +
    '<span class="emb-bonus">' + formatEmblemBonus(emblem.bonus) + '</span>' +
    '<span class="emb-status">' + statusLabel + '</span>' +
    (status.canEnter && !status.owned ? '<button class="emb-btn emblem-claim-btn" data-emblem-id="' + emblem.id + '">\uB3C4\uC804</button>' : '') +
    (status.owned && !isActive ? equipWarn + '<button class="emb-btn emblem-equip-btn" data-emblem-id="' + emblem.id + '">\uC7A5\uCC29</button>' : '') +
    (isActive ? '<button class="emb-btn emblem-unequip-btn" data-emblem-id="' + emblem.id + '">\uD574\uC81C</button>' : '') +
  '</div>';
}

function buildFusionRow(recipe) {
  const status = getPlayerFusionStatusForLine(recipe.masterLineId);
  const lineLabel = getOriginalLineLabel(recipe.masterLineId);
  let badge, cls;
  if (status.unlocked) { badge = '\u2705 \uD574\uAE08'; cls = 'done'; }
  else if (status.otherUnlock) { badge = '\uB2E4\uB978 \uB77C\uC778 \uACE0\uC815'; cls = ''; }
  else if (status.canFuse) { badge = '\u25B6 \uD569\uCCB4 \uAC00\uB2A5'; cls = 'next'; }
  else { badge = status.owned + '/' + status.total; cls = ''; }
  const materialNames = status.materials.map(mid => {
    const m = getEmblemDef(mid);
    const owned = playerHasEmblem(mid);
    return '<span class="fuse-mat' + (owned ? ' owned' : '') + '">' + (m ? m.name.replace(' 문장','') : mid) + '</span>';
  }).join('');
  const fuseBtn = status.canFuse
    ? '<button class="emb-btn emblem-fuse-btn" data-line-id="' + recipe.masterLineId + '">\uD569\uCCB4</button>'
    : '';
  return '<div class="emblem-row fusion ' + cls + '" style="border-left:3px solid ' + recipe.colors.primary + ';">' +
    '<span class="emb-name">' + lineLabel + ' \uD569\uCCB4</span>' +
    '<span class="emb-line">' + recipe.keyword + '</span>' +
    '<span class="emb-bonus">' + materialNames + '</span>' +
    '<span class="emb-status">' + badge + '</span>' +
    fuseBtn +
  '</div>';
}

function buildTierRewardRow(emblem, tierLabel) {
  const owned = playerHasEmblem(emblem.id);
  const isActive = player.activeEmblemId === emblem.id;
  const recipe = getAllFusionRecipes().find(r => r.tier8EmblemId === emblem.id || r.tier9EmblemId === emblem.id);
  const onThisLine = player.classLine === emblem.targetLine;
  const reqLevelMet = onThisLine && player.level >= emblem.requiredLevel && player.classRank >= emblem.requiredTier;
  let badge, cls;
  if (isActive) { badge = '\u2694'; cls = 'next'; }
  else if (owned) { badge = '\u2705'; cls = 'done'; }
  else if (reqLevelMet) { badge = '\u23F3'; cls = 'next'; }
  else { badge = '\uD83D\uDD12'; cls = ''; }
  const equipWarn = owned && !isActive && equipped.helmet ? '<span class="emb-warn">헬멧 해제</span>' : '';
  return '<div class="emblem-row master ' + cls + '" style="border-left:3px solid ' + (recipe ? recipe.colors.primary : '#888') + ';">' +
    '<span class="emb-name">' + emblem.name + '</span>' +
    '<span class="emb-line">' + tierLabel + ' · ' + getOriginalLineLabel(emblem.targetLine) + '</span>' +
    '<span class="emb-bonus">' + formatEmblemBonus(emblem.bonus) + '</span>' +
    '<span class="emb-status">' + badge + '</span>' +
    (owned && !isActive ? equipWarn + '<button class="emb-btn emblem-equip-btn" data-emblem-id="' + emblem.id + '">\uC7A5\uCC29</button>' : '') +
    (isActive ? '<button class="emb-btn emblem-unequip-btn" data-emblem-id="' + emblem.id + '">\uD574\uC81C</button>' : '') +
  '</div>';
}

function renderEmblemRoomPanel() {
  const content = document.getElementById('emblem-room-panel-content');
  const summaryEl = document.getElementById('emblem-summary');
  const unitEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.unit);
  const tier8Emblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.tier8);
  const tier9Emblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.tier9);
  const fusionRecipes = getAllFusionRecipes();
  const ownedCount = (player.emblemIds || []).length;
  const activeEmblem = typeof getActivePlayerEmblem === 'function' ? getActivePlayerEmblem() : null;
  const totalEmblems = unitEmblems.length + tier8Emblems.length + tier9Emblems.length;
  const commanderName = typeof getCharacterDisplayName === 'function'
    ? getCharacterDisplayName(currentCommanderId || (typeof getHeroCharacterId === 'function' ? getHeroCharacterId() : 'hero'))
    : '주인공';

  if (summaryEl) {
    summaryEl.textContent = commanderName + ' \u00B7 \uBCF4\uC720 ' + ownedCount + '/' + totalEmblems;
    summaryEl.style.color = '#aaa';
  }

  content.innerHTML =
    '<div class="emblem-columns">' +
      '<div class="emblem-col">' +
        '<div class="quest-section-label">\uAE30\uBCF8 \uBB38\uC7A5 ' + unitEmblems.length + '\uC885</div>' +
        '<div class="emblem-table">' + unitEmblems.map(buildEmblemCompactRow).join('') + '</div>' +
        '<div class="quest-section-label">8\uB2E8 \uD569\uCCB4 (\uC9C4\uC785\uAD8C)</div>' +
        '<div class="emblem-table">' + fusionRecipes.map(buildFusionRow).join('') + '</div>' +
      '</div>' +
      '<div class="emblem-col emblem-col-right">' +
        '<div class="quest-section-label">8\uB2E8 \uBB38\uC7A5 · Lv100 \uBCF4\uC0C1</div>' +
        '<div class="emblem-table">' + tier8Emblems.map(e => buildTierRewardRow(e, '8\uB2E8')).join('') + '</div>' +
        '<div class="quest-section-label">9\uB2E8 \uBB38\uC7A5 · Lv200 \uBCF4\uC0C1</div>' +
        '<div class="emblem-table">' + tier9Emblems.map(e => buildTierRewardRow(e, '9\uB2E8')).join('') + '</div>' +
        '<div class="emblem-info-box">' +
          '<div class="quest-section-label">\uD604\uC7AC \uC0C1\uD0DC · ' + commanderName + '</div>' +
          '<div class="emb-info-row"><span>\uB77C\uC778</span><span>' + getOriginalLineLabel(player.classLine || 'infantry') + '</span></div>' +
          '<div class="emb-info-row"><span>\uB2E8\uC218</span><span>' + (player.tier || 1) + '\uB2E8</span></div>' +
          '<div class="emb-info-row"><span>\uB808\uBCA8</span><span>Lv.' + player.level + '</span></div>' +
          '<div class="emb-info-row"><span>\uD574\uAE08 \uB77C\uC778</span><span>' + (player.tier8UnlockLineId ? getOriginalLineLabel(player.tier8UnlockLineId) : '\uC5C6\uC74C') + '</span></div>' +
          '<div class="emb-info-row"><span>8\uB2E8 \uBB38\uC7A5</span><span>' + (player.tier8EmblemId ? (getEmblemDef(player.tier8EmblemId) || {}).name || '\uBCF4\uC720' : '\uBBF8\uD68D\uB4DD') + '</span></div>' +
          '<div class="emb-info-row"><span>9\uB2E8 \uBB38\uC7A5</span><span>' + (player.tier9EmblemId ? (getEmblemDef(player.tier9EmblemId) || {}).name || '\uBCF4\uC720' : '\uBBF8\uD68D\uB4DD') + '</span></div>' +
          '<div class="emb-info-row"><span>\uD65C\uC131 \uBB38\uC7A5</span><span>' + (activeEmblem ? activeEmblem.name : '\uC5C6\uC74C') + '</span></div>' +
          '<div class="emb-info-row"><span>ATK</span><span>' + playerAtk() + '</span></div>' +
          '<div class="emb-info-row"><span>DEF</span><span>' + playerDef() + '</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  bindEmblemRoomActions(content);
}
