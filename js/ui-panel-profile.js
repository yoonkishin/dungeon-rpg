'use strict';

// ─── Profile Panel ───────────────────────────────────────────────────────────
const profilePanel = document.getElementById('profile-panel');
bindTap(document.getElementById('profile-close'), () => closeProfile());

function openProfile() {
  profileOpen = true;
  showPanel(profilePanel);
  renderProfile();
}
function closeProfile() {
  profileOpen = false;
  hidePanel(profilePanel);
}

function renderProfile() {
  const bonus = getEquipBonus();
  const tier = getCurrentTier();
  const nextTier = getNextTier();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const content = document.getElementById('profile-content');
  const armorColor = equipped.armor && ITEMS[equipped.armor.itemId] ? ITEMS[equipped.armor.itemId].color : null;
  const promotionTarget = getPlayerPromotionTarget();

  // EXP calculation
  const expForNext = player.xpNext || 1;
  const expPct = expForNext > 0 ? Math.min(100, Math.floor(player.xp / expForNext * 100)) : 100;
  const isMaxLevel = player.level >= getPlayerLevelCap();

  // Tier progress
  let tierPct = 100;
  if (nextTier) {
    const prevReq = tier.reqLevel;
    const nextReq = nextTier.reqLevel;
    tierPct = Math.min(100, Math.floor((player.level - prevReq) / (nextReq - prevReq) * 100));
  }

  // Stats
  const totalAtk = player.atk + bonus.atk;
  const totalDef = player.def + bonus.def;
  const totalCrit = Math.min(30, player.critChance + (bonus.critBonus || 0));
  const totalSpeed = (player.speed + (bonus.speedBonus || 0)).toFixed(2);

  // Progress
  const dungeonCount = dungeonsCleared.length;
  const dungeonTotal = 9;
  const companionCount = companions.length;
  const companionTotal = getTotalCompanionCount();

  // Glow
  const glowOpacity = Math.min(tier.tier * 0.15, 0.7);
  const glowColor = tier.color || '#f1c40f';

  content.innerHTML =
    // ── Hero Card ──
    '<div class="profile-hero">' +
      '<div class="profile-hero-bg" style="background:linear-gradient(135deg, ' + glowColor + ', transparent);"></div>' +
      '<div class="profile-hero-figure">' +
        (tier.tier >= 3 ? '<div class="profile-hero-aura" style="background:radial-gradient(circle, ' + glowColor + '33, transparent 70%); box-shadow:0 0 ' + Math.min(tier.tier * 4, 24) + 'px ' + glowColor + '44;"></div>' : '') +
        '<img src="./character.png" alt="" class="profile-hero-image" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="profile-hero-fallback"><div class="profile-hero-body" style="background:' + (armorColor || tier.bodyColor || '#555') + ';"></div></div>' +
      '</div>' +
      '<div class="profile-hero-info">' +
        '<div class="profile-hero-class">' + growthLine.lineName + ' \u00B7 ' + tier.tier + '\uB2E8</div>' +
        '<div class="profile-hero-name" style="color:' + glowColor + ';">' + tier.name + '</div>' +
        '<div class="profile-hero-level">Lv. ' + player.level + (isMaxLevel ? ' <span class="max-tag">MAX</span>' : '') + '</div>' +
        '<div class="profile-exp-row">' +
          '<span class="profile-exp-label">EXP</span>' +
          '<div class="profile-exp-bar"><div class="profile-exp-fill" style="width:' + (isMaxLevel ? 100 : expPct) + '%;"></div></div>' +
          '<span class="profile-exp-text">' + (isMaxLevel ? 'MAX' : player.xp + '/' + expForNext) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +

    // ── Stat Chips ──
    '<div class="profile-stats-row">' +
      buildStatChip('\u2694\uFE0F', totalAtk, bonus.atk, '\uACF5\uACA9\uB825') +
      buildStatChip('\uD83D\uDEE1\uFE0F', totalDef, bonus.def, '\uBC29\uC5B4\uB825') +
      buildStatChip('\uD83C\uDFAF', totalCrit + '%', bonus.critBonus || 0, '\uD06C\uB9AC') +
      buildStatChip('\uD83D\uDC62', totalSpeed, bonus.speedBonus || 0, '\uC18D\uB3C4') +
    '</div>' +

    // ── Promotion Card ──
    '<div class="profile-promo-card">' +
      '<div class="profile-promo-header">' +
        '<span class="profile-promo-title">\uC2B9\uAE09 \uC9C4\uD589</span>' +
        (promotionTarget
          ? '<span class="profile-promo-badge ready">\uC2B9\uAE09 \uAC00\uB2A5!</span>'
          : (nextTier
            ? '<span class="profile-promo-badge locked">Lv.' + nextTier.reqLevel + ' \uD544\uC694</span>'
            : '<span class="profile-promo-badge ready">\uCD5C\uC885 \uB2E8\uACC4</span>')) +
      '</div>' +
      '<div class="profile-promo-flow">' +
        '<div class="profile-promo-tier current" style="border-color:' + glowColor + '55;">' + tier.name + '</div>' +
        (nextTier
          ? '<span class="profile-promo-arrow">\u25B6</span><div class="profile-promo-tier next">' + nextTier.name + '</div>'
          : '') +
      '</div>' +
      '<div class="profile-promo-bar"><div class="profile-promo-fill" style="width:' + tierPct + '%; background:linear-gradient(90deg, ' + glowColor + ', ' + (tier.bodyColor || glowColor) + ');"></div></div>' +
      '<div class="profile-promo-info">' +
        '<span>' + growthLine.lineName + ' \uB77C\uC778</span>' +
        '<span>' + tierPct + '%</span>' +
      '</div>' +
    '</div>' +

    // ── Progress Cards ──
    '<div class="profile-progress-row">' +
      '<div class="profile-progress-card">' +
        '<div class="profile-progress-head">' +
          '<span class="profile-progress-title">\uB358\uC804 \uD074\uB9AC\uC5B4</span>' +
          '<span class="profile-progress-count">' + dungeonCount + '/' + dungeonTotal + '</span>' +
        '</div>' +
        '<div class="profile-progress-bar"><div class="profile-progress-fill dungeon" style="width:' + Math.floor(dungeonCount / dungeonTotal * 100) + '%;"></div></div>' +
      '</div>' +
      '<div class="profile-progress-card">' +
        '<div class="profile-progress-head">' +
          '<span class="profile-progress-title">\uB3D9\uB8CC \uC218\uC9D1</span>' +
          '<span class="profile-progress-count">' + companionCount + '/' + companionTotal + '</span>' +
        '</div>' +
        '<div class="profile-progress-bar"><div class="profile-progress-fill companion" style="width:' + (companionTotal > 0 ? Math.floor(companionCount / companionTotal * 100) : 0) + '%;"></div></div>' +
      '</div>' +
    '</div>';
}

function buildStatChip(icon, value, equipBonus, label) {
  const bonusStr = equipBonus > 0 ? '(+' + (typeof equipBonus === 'number' && equipBonus % 1 !== 0 ? equipBonus.toFixed(2) : equipBonus) + ')' : '';
  return '<div class="profile-stat-chip">' +
    '<span class="profile-stat-icon">' + icon + '</span>' +
    '<span class="profile-stat-value">' + value + '</span>' +
    (bonusStr ? '<span class="profile-stat-bonus">' + bonusStr + '</span>' : '') +
    '<span class="profile-stat-label">' + label + '</span>' +
  '</div>';
}
