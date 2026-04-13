'use strict';

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

// ─── Village Panel UI ────────────────────────────────────────────────────
const villagePanel = document.getElementById('village-panel');
bindTap(document.getElementById('village-panel-close'), () => closeVillagePanel());

function openVillagePanel() {
  villagePanelOpen = true;
  showPanel(villagePanel);
  renderVillagePanel();
}
function closeVillagePanel() {
  villagePanelOpen = false;
  hidePanel(villagePanel);
}
function buildVillageOverviewCard(tierLabel, completionPct, totalUpgradeLevel, nextUpgrade) {
  let html = '<div class="quest-card primary village-overview-card">';
  html += '<div class="quest-focus-head"><div class="quest-focus-title">마을 발전 요약</div><span class="quest-chip active">' + tierLabel + '</span></div>';
  html += '<div class="quest-focus-text">던전을 돌파할수록 마을이 성장하고, 시설 강화는 전투력과 경제 보너스로 이어집니다.</div>';
  html += '<div class="village-summary-grid">';
  html += '<div class="village-summary-item"><span class="village-summary-label">던전 확보율</span><span class="village-summary-value">' + dungeonsCleared.length + '/' + DUNGEON_INFO.length + '</span></div>';
  html += '<div class="village-summary-item"><span class="village-summary-label">성장률</span><span class="village-summary-value">' + completionPct + '%</span></div>';
  html += '<div class="village-summary-item"><span class="village-summary-label">총 업그레이드</span><span class="village-summary-value">Lv ' + totalUpgradeLevel + '</span></div>';
  html += '<div class="village-summary-item"><span class="village-summary-label">다음 투자</span><span class="village-summary-value">' + (nextUpgrade ? nextUpgrade.name : '완료') + '</span></div>';
  html += '</div>';
  if (nextUpgrade) {
    html += '<div class="village-tip-banner">다음 추천 투자: <strong>' + nextUpgrade.icon + ' ' + nextUpgrade.name + '</strong> · 비용 ' + getVillageUpgradeCost(nextUpgrade.key) + 'G</div>';
  }
  html += '</div>';
  return html;
}

function buildVillageBenefitRows(upgrade, currentLevel) {
  return upgrade.levels.map((levelInfo, idx) => {
    const reached = currentLevel > idx;
    const current = currentLevel === idx + 1;
    return '<div class="village-benefit-item ' + (reached ? 'reached' : '') + ' ' + (current ? 'current' : '') + '">' +
      '<span class="village-benefit-label">Lv ' + (idx + 1) + '</span>' +
      '<span class="village-benefit-value">' + levelInfo.bonus + '</span>' +
    '</div>';
  }).join('');
}

function buildVillageUpgradeCard(upgrade) {
  const currentLevel = villageUpgrades[upgrade.key] || 0;
  const nextLevelInfo = upgrade.levels[currentLevel] || null;
  const canUpgrade = canUpgradeVillage(upgrade.key);
  const nextCost = getVillageUpgradeCost(upgrade.key);

  let html = '<div class="village-upgrade-card">';
  html += '<div class="village-upgrade-top">';
  html += '<div><div class="village-upgrade-name">' + upgrade.icon + ' ' + upgrade.name + '</div><div class="village-upgrade-meta">현재 레벨 ' + currentLevel + ' / ' + upgrade.maxLevel + '</div></div>';
  html += '<div class="quest-chip ' + (currentLevel >= upgrade.maxLevel ? 'done' : 'active') + '">' + (currentLevel >= upgrade.maxLevel ? '완료' : '성장 가능') + '</div>';
  html += '</div>';
  html += '<div class="quest-desc">' + upgrade.description + '</div>';
  html += '<div class="village-next-upgrade">' + (nextLevelInfo ? ('다음 단계: Lv ' + (currentLevel + 1) + ' · ' + nextLevelInfo.bonus + ' · 비용 ' + nextCost + 'G') : '최대 레벨 달성') + '</div>';
  html += '<div class="village-upgrade-actions">';
  html += '<div class="village-upgrade-cost">' + (currentLevel >= upgrade.maxLevel ? '최대 레벨 완료' : ('보유 골드 ' + player.gold + 'G · 필요 골드 ' + nextCost + 'G')) + '</div>';
  html += '<button class="village-upgrade-btn" data-upgrade="' + upgrade.key + '" ' + ((currentLevel >= upgrade.maxLevel || !canUpgrade) ? 'disabled' : '') + '>' + (currentLevel >= upgrade.maxLevel ? '완료' : (canUpgrade ? '강화하기' : '골드 부족')) + '</button>';
  html += '</div>';
  html += '<div class="village-benefit-list">' + buildVillageBenefitRows(upgrade, currentLevel) + '</div>';
  html += '</div>';
  return html;
}

function bindVillageUpgradeActions(content) {
  content.querySelectorAll('.village-upgrade-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      const key = btn.getAttribute('data-upgrade');
      if (!key) return;
      upgradeVillage(key);
    }, { stopPropagation: true });
  });
}

function renderVillagePanel() {
  const content = document.getElementById('village-panel-content');
  const villageGoldEl = document.getElementById('village-gold');
  if (villageGoldEl) villageGoldEl.textContent = player.gold.toLocaleString();

  const upgrades = getVillageUpgradeDefinitions();
  const tierLabel = getVillageTierLabel();
  const completionPct = Math.min(100, Math.round((dungeonsCleared.length / DUNGEON_INFO.length) * 100));
  const totalUpgradeLevel = villageUpgrades.forge + villageUpgrades.guard + villageUpgrades.trade + villageUpgrades.alchemy;
  const nextUpgrade = upgrades
    .map(upgrade => ({ ...upgrade, currentLevel: villageUpgrades[upgrade.key] || 0 }))
    .filter(upgrade => upgrade.currentLevel < upgrade.maxLevel)
    .sort((a, b) => getVillageUpgradeCost(a.key) - getVillageUpgradeCost(b.key))[0];

  content.innerHTML =
    buildVillageOverviewCard(tierLabel, completionPct, totalUpgradeLevel, nextUpgrade) +
    '<div class="village-grid-2x2">' + upgrades.map(buildVillageUpgradeCard).join('') + '</div>';

  bindVillageUpgradeActions(content);
}
