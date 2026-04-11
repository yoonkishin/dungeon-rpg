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

function renderEmblemRoomPanel() {
  const content = document.getElementById('emblem-room-panel-content');
  const unitEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.unit);
  const masterEmblems = getAllEmblemDefs().filter(def => def.type === EMBLEM_TYPES.master);

  content.innerHTML =
    buildEmblemRoomSummaryCard() +
    '<div class="quest-card"><div class="quest-focus-head"><div class="quest-focus-title">기본 문장 시험</div><span class="quest-chip active">10종</span></div><div class="quest-focus-text">조건을 만족한 문장은 즉시 지급되지 않고, 전용 시험 전투에서 수호자를 쓰러뜨려야 획득할 수 있다.</div></div>' +
    unitEmblems.map(buildUnitEmblemCard).join('') +
    '<div class="quest-card"><div class="quest-focus-head"><div class="quest-focus-title">마스터 문장 융합</div><span class="quest-chip active">3종</span></div><div class="quest-focus-text">라인별 기본 문장을 모두 모으면 배틀마스터 / 택틱스마스터 / 매직마스터 문장으로 융합할 수 있다.</div></div>' +
    masterEmblems.map(buildMasterEmblemCard).join('');

  bindEmblemRoomActions(content);
}

function getVillageUpgradeDefinitions() {
  return Object.keys(TOWN_UPGRADES).map(key => {
    const def = TOWN_UPGRADES[key];
    return {
      key,
      icon: def.icon,
      name: def.name,
      maxLevel: def.maxLevel,
      description: def.bonusText,
      nextCost: getVillageUpgradeCost(key),
      levels: Array.from({ length: def.maxLevel }, (_, idx) => ({
        level: idx + 1,
        bonus: key === 'forge'
          ? ('공격력 +' + ((idx + 1) * 2) + ' / 동료 공격 +' + (idx + 1))
          : key === 'guard'
            ? ('방어력 +' + (idx + 1) + ' / 동료 체력 +' + ((idx + 1) * 10))
            : key === 'trade'
              ? ('골드 획득 +' + ((idx + 1) * 12) + '%')
              : ('포션 효율 +' + ((idx + 1) * 15) + '% / 부활비 할인 ' + Math.min(50, (idx + 1) * 10) + '%')
      }))
    };
  });
}

function getVillageTierLabel() {
  const cleared = dungeonsCleared.length;
  const totalUpgradeLevel = villageUpgrades.forge + villageUpgrades.guard + villageUpgrades.trade + villageUpgrades.alchemy;
  const score = cleared * 2 + totalUpgradeLevel;
  if (score >= 24) return '영웅의 도시';
  if (score >= 18) return '요새화된 거점';
  if (score >= 12) return '활기찬 정착지';
  if (score >= 6) return '성장하는 마을';
  return '개척 마을';
}
function canUpgradeVillage(key) {
  const def = TOWN_UPGRADES[key];
  if (!def) return false;
  const currentLevel = villageUpgrades[key] || 0;
  if (currentLevel >= def.maxLevel) return false;
  return player.gold >= getVillageUpgradeCost(key);
}
function upgradeVillage(key) {
  const def = TOWN_UPGRADES[key];
  if (!def) return;
  const currentLevel = villageUpgrades[key] || 0;
  if (currentLevel >= def.maxLevel) {
    showToast(def.name + '은 이미 최대 레벨입니다');
    return;
  }
  const cost = getVillageUpgradeCost(key);
  if (player.gold < cost) {
    showToast('골드가 부족합니다');
    return;
  }
  player.gold -= cost;
  villageUpgrades[key] = currentLevel + 1;
  AudioSystem.sfx.buy();
  showToast(def.name + ' 강화 Lv ' + villageUpgrades[key]);
  updateHUD();
  autoSave();
  renderVillagePanel();
}
