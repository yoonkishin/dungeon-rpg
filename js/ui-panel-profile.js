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

function profileStatRow(icon, label, value, bonus) {
  const bonusStr = bonus ? '<span class="s-bonus">(+' + bonus + ')</span>' : '';
  return '<div class="profile-stat-row">' +
    '<span class="s-icon">' + icon + '</span>' +
    '<span class="s-label">' + label + '</span>' +
    '<span class="s-value">' + value + '</span>' +
    bonusStr +
  '</div>';
}

function profileBarRow(cls, label, pct, text) {
  return '<div class="profile-bar-row">' +
    '<span class="profile-bar-label ' + cls + '">' + label + '</span>' +
    '<div class="profile-bar-track"><div class="profile-bar-fill ' + cls + '" style="width:' + pct + '%;"></div></div>' +
    '<span class="profile-bar-val">' + text + '</span>' +
  '</div>';
}

function profileProgItem(label, count, total, fillCls) {
  const pct = total > 0 ? Math.floor(count / total * 100) : 0;
  return '<div class="profile-prog-item">' +
    '<span class="p-label">' + label + '</span>' +
    '<div class="p-bar"><div class="p-fill ' + fillCls + '" style="width:' + pct + '%;"></div></div>' +
    '<span class="p-count">' + count + '/' + total + '</span>' +
  '</div>';
}

function profileMetaItem(label, value, cls) {
  return '<div class="profile-meta-item">' +
    '<span class="m-label">' + label + '</span>' +
    '<span class="m-value' + (cls ? ' ' + cls : '') + '">' + value + '</span>' +
  '</div>';
}

function renderProfile() {
  const bonus = getEquipBonus();
  const tier = getCurrentTier();
  const nextTier = getNextTier();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const content = document.getElementById('profile-content');
  const armorColor = equipped.armor && ITEMS[equipped.armor.itemId] ? ITEMS[equipped.armor.itemId].color : null;
  const promotionTarget = getPlayerPromotionTarget();
  const synergy = getActiveCompanionSynergy();
  const glowColor = tier.color || '#f1c40f';
  const isMaxLevel = player.level >= getPlayerLevelCap();

  // Resource values
  const hpPct = player.maxHp > 0 ? Math.min(100, Math.floor(player.hp / player.maxHp * 100)) : 0;
  const mpPct = player.maxMp > 0 ? Math.min(100, Math.floor(player.mp / player.maxMp * 100)) : 0;
  const expNext = player.xpNext || 1;
  const expPct = isMaxLevel ? 100 : Math.min(100, Math.floor(player.xp / expNext * 100));

  // Tier progress
  let tierPct = 100;
  if (nextTier) {
    const prevReq = tier.reqLevel;
    const nextReq = nextTier.reqLevel;
    tierPct = Math.min(100, Math.floor((player.level - prevReq) / (nextReq - prevReq) * 100));
  }

  // Stat bonuses
  const villageAtk = typeof getVillageAttackBonus === 'function' ? getVillageAttackBonus() : 0;
  const villageDef = typeof getVillageDefenseBonus === 'function' ? getVillageDefenseBonus() : 0;
  const synergyAtk = synergy && synergy.playerAtkBonus ? synergy.playerAtkBonus : 0;
  const synergyDef = synergy && synergy.playerDefBonus ? synergy.playerDefBonus : 0;
  const totalEquipAtk = bonus.atk + villageAtk + synergyAtk;
  const totalEquipDef = bonus.def + villageDef + synergyDef;
  const totalAtk = player.atk + totalEquipAtk;
  const totalDef = player.def + totalEquipDef;
  const totalCrit = Math.min(30, player.critChance + (bonus.critBonus || 0));
  const totalSpeed = (player.speed + (bonus.speedBonus || 0)).toFixed(2);
  const goldBonusPct = bonus.goldBonus || 0;
  const healMult = typeof getHealingMultiplier === 'function' ? getHealingMultiplier() : 1;
  const atkCooldown = (player.attackCooldown / 1000).toFixed(2);

  // Progress
  const dungeonCount = dungeonsCleared.length;
  const companionCount = companions.length;
  const companionTotal = getTotalCompanionCount();
  const activeCount = activeCompanions.length;

  const profileGoldEl = document.getElementById('profile-gold');
  if (profileGoldEl) profileGoldEl.textContent = player.gold.toLocaleString();

  content.innerHTML =
  '<div class="profile-columns">' +

    // ── LEFT COLUMN ──
    '<div class="profile-left">' +

      // Character ID
      '<div class="profile-id">' +
        '<div class="profile-id-bg" style="background:linear-gradient(135deg, ' + glowColor + ', transparent);"></div>' +
        '<div class="profile-id-figure">' +
          (tier.tier >= 3 ? '<div class="profile-id-aura" style="background:radial-gradient(circle, ' + glowColor + '33, transparent 70%);"></div>' : '') +
          '<img src="./character.png" alt="" class="profile-id-image" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
          '<div class="profile-id-fallback"><div class="profile-id-body" style="background:' + (armorColor || tier.bodyColor || '#555') + ';"></div></div>' +
        '</div>' +
        '<div class="profile-id-info">' +
          '<div class="profile-id-class">' + growthLine.lineName + ' \u00B7 ' + tier.tier + '\uB2E8</div>' +
          '<div class="profile-id-name" style="color:' + glowColor + ';">' + tier.name + '</div>' +
          '<div class="profile-id-level">Lv. ' + player.level + (isMaxLevel ? ' <span class="max-tag">MAX</span>' : '') + '</div>' +
        '</div>' +
      '</div>' +

      // Resource Bars
      '<div class="profile-bars">' +
        profileBarRow('hp', 'HP', hpPct, Math.floor(player.hp) + '/' + player.maxHp) +
        profileBarRow('mp', 'MP', mpPct, Math.floor(player.mp) + '/' + player.maxMp) +
        profileBarRow('exp', 'EXP', expPct, isMaxLevel ? 'MAX' : player.xp + '/' + expNext) +
      '</div>' +

      // Combat Stats (2-col grid)
      '<div class="profile-stat-grid">' +
        profileStatRow('\u2694', '\uACF5\uACA9\uB825', totalAtk, totalEquipAtk || null) +
        profileStatRow('\uD83D\uDEE1', '\uBC29\uC5B4\uB825', totalDef, totalEquipDef || null) +
        profileStatRow('\uD83C\uDFAF', '\uD06C\uB9AC\uD2F0\uCEEC', totalCrit + '%', bonus.critBonus || null) +
        profileStatRow('\uD83D\uDC62', '\uC774\uB3D9\uC18D\uB3C4', totalSpeed, bonus.speedBonus ? bonus.speedBonus.toFixed(2) : null) +
        profileStatRow('\u2764', '\uCD5C\uB300HP', player.maxHp, null) +
        profileStatRow('\uD83D\uDCA7', '\uCD5C\uB300MP', player.maxMp, null) +
        profileStatRow('\u23F1', '\uACF5\uACA9\uC18D\uB3C4', atkCooldown + '\uCD08', null) +
        profileStatRow('\uD83D\uDCB0', '\uACE8\uB4DC\uBCF4\uB108\uC2A4', goldBonusPct > 0 ? '+' + goldBonusPct + '%' : '0%', null) +
        profileStatRow('\uD83D\uDC9A', '\uD68C\uBCF5\uBC30\uC728', '\u00D7' + healMult.toFixed(2), healMult > 1 ? ('+' + ((healMult - 1) * 100).toFixed(0) + '%') : null) +
      '</div>' +

    '</div>' +

    // ── RIGHT COLUMN ──
    '<div class="profile-right">' +

      // Promotion Card
      '<div class="profile-promo">' +
        '<div class="profile-promo-head">' +
          '<span class="profile-promo-title">\uC2B9\uAE09 \uC9C4\uD589</span>' +
          (promotionTarget
            ? '<span class="profile-promo-badge ready">\uC2B9\uAE09 \uAC00\uB2A5!</span>'
            : nextTier
              ? '<span class="profile-promo-badge locked">Lv.' + nextTier.reqLevel + ' \uD544\uC694</span>'
              : '<span class="profile-promo-badge ready">\uCD5C\uC885 \uB2E8\uACC4</span>') +
        '</div>' +
        '<div class="profile-promo-flow">' +
          '<div class="profile-promo-chip current" style="border-color:' + glowColor + '55;">' + tier.name + '</div>' +
          (nextTier ? '<span class="profile-promo-arrow">\u25B6</span><div class="profile-promo-chip next">' + nextTier.name + '</div>' : '') +
        '</div>' +
        '<div class="profile-promo-bar"><div class="profile-promo-fill" style="width:' + tierPct + '%; background:linear-gradient(90deg, ' + glowColor + ', ' + (tier.bodyColor || glowColor) + ');"></div></div>' +
        '<div class="profile-promo-foot"><span>' + growthLine.lineName + ' \uB77C\uC778</span><span>' + tierPct + '%</span></div>' +
      '</div>' +

      // Progress
      '<div class="profile-progress">' +
        profileProgItem('\uB358\uC804 \uD074\uB9AC\uC5B4', dungeonCount, 9, 'dungeon') +
        profileProgItem('\uB3D9\uB8CC \uC218\uC9D1', companionCount, companionTotal, 'companion') +
        '<div class="profile-prog-item">' +
          '<span class="p-label">\uD65C\uC131 \uB3D9\uB8CC</span>' +
          '<div class="p-bar"></div>' +
          '<span class="p-count">' + activeCount + '/' + MAX_ACTIVE_COMPANIONS + '</span>' +
        '</div>' +
      '</div>' +

      // Game Stats
      '<div class="profile-meta">' +
        profileMetaItem('\uBCF4\uC720 \uACE8\uB4DC', player.gold.toLocaleString(), 'gold') +
        profileMetaItem('\uCD1D \uCC98\uCE58', totalEnemiesKilled.toLocaleString(), '') +
        profileMetaItem('\uCD1D \uD68D\uB4DD \uACE8\uB4DC', totalGoldEarned.toLocaleString(), 'gold') +
        profileMetaItem('\uC7A5\uBE44 \uC2AC\uB86F', Object.values(equipped).filter(Boolean).length + '/8', '') +
        profileMetaItem('\uAC00\uBC29 \uC544\uC774\uD15C', inventory.length + '\uAC1C', '') +
        profileMetaItem('\uBB38\uC7A5 \uC218\uC9D1', (player.emblemIds || []).length + '\uAC1C', '') +
      '</div>' +

    '</div>' +
  '</div>';
}
