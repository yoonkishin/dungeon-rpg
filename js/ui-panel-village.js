'use strict';

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
    '<div class="quest-section-title">시설 업그레이드</div>' +
    upgrades.map(buildVillageUpgradeCard).join('');

  bindVillageUpgradeActions(content);
}
