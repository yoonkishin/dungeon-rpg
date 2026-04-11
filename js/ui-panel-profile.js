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
function buildProfileProgressDots(total, activeCheck, variant) {
  let html = '';
  for (let i = 0; i < total; i++) {
    const active = activeCheck(i);
    html += '<div class="profile-progress-dot ' + variant + (active ? ' active' : '') + '">' + (active ? '●' : '○') + '</div>';
  }
  return html;
}

function buildProfileMetric(label, value) {
  return '<div class="profile-metric-item"><span class="profile-metric-label">' + label + '</span><span class="profile-metric-value">' + value + '</span></div>';
}

function buildProfileCharacterCard(tier, lineName, glowColor, glowSize, armorColor) {
  return `
    <div class="profile-character-card">
      <div class="profile-character-glow" style="background:radial-gradient(circle at 50% 50%, ${glowColor}, transparent 60%);"></div>
      <div class="profile-character-inner">
        <div class="profile-character-figure">
          ${tier.tier >= 3 ? `<div class="profile-character-aura" style="background:radial-gradient(circle, ${tier.color}33, transparent 70%); box-shadow:0 0 ${glowSize}px ${tier.color}44;"></div>` : ''}
          <img src="./character.png" alt="캐릭터" class="profile-character-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="profile-character-fallback">
            <div class="profile-character-body" style="background:${armorColor || tier.bodyColor};"></div>
          </div>
        </div>
        <div class="profile-character-meta">
          <div class="profile-character-name">${lineName} 라인</div>
          <div class="profile-character-tier" style="color:${tier.color};">⭐ ${tier.tier}단 - ${tier.name}</div>
          <div class="profile-character-level">Lv. ${player.level}${player.level >= getPlayerLevelCap() ? ' (MAX)' : ''}</div>
        </div>
      </div>
    </div>
  `;
}

function buildProfileStatsCard(playerStats) {
  return `
    <div class="profile-stats-card">
      <div class="profile-resource-block">
        <div class="profile-resource-row"><span class="profile-resource-label hp">HP</span><span class="profile-resource-value">${playerStats.hpText}</span></div>
        <div class="profile-bar"><div class="profile-bar-fill hp" style="width:${playerStats.hpPct}%;"></div></div>
      </div>
      <div class="profile-resource-block profile-resource-gap">
        <div class="profile-resource-row"><span class="profile-resource-label mp">MP</span><span class="profile-resource-value">${playerStats.mpText}</span></div>
        <div class="profile-bar"><div class="profile-bar-fill mp" style="width:${playerStats.mpPct}%;"></div></div>
      </div>
      <div class="profile-metric-grid">
        ${buildProfileMetric('공격력', playerStats.atk)}
        ${buildProfileMetric('방어력', playerStats.def)}
        ${buildProfileMetric('크리티컬', playerStats.crit + '%')}
        ${buildProfileMetric('이동속도', playerStats.speed)}
      </div>
    </div>
  `;
}

function buildProfileTierCard(tier, nextTier, tierPct, tierProgressText, lineName) {
  return `
    <div class="profile-tier-card">
      <div class="profile-tier-head">
        <span class="profile-tier-text">클래스: <span class="profile-tier-name" style="color:${tier.color};">${tier.tier}단 ${tier.name}</span></span>
        ${nextTier ? `<span class="profile-tier-next">다음 승급: ${nextTier.name} (Lv.${nextTier.reqLevel})</span>` : '<span class="profile-tier-next max">현재 최종 승급</span>'}
      </div>
      <div class="profile-bar profile-tier-progress"><div class="profile-bar-fill tier" style="width:${tierPct}%; background:linear-gradient(90deg, ${tier.color}, ${tier.bodyColor});"></div></div>
      <div class="profile-tier-foot">${tierProgressText || `${lineName} 라인 진행 ${tierPct}%`}</div>
    </div>
  `;
}

function buildProfilePromotionNote(tier, nextTier, lineName) {
  const promotionTarget = getPlayerPromotionTarget();
  const body = promotionTarget
    ? `${lineName} 라인 ${tier.name} 단계에서 승급 조건을 채웠어. 마을의 수련의 방에서 ${promotionTarget.name} 승급을 확정할 수 있어.`
    : nextTier
      ? `${lineName} 라인 ${tier.name} 단계야. 다음 승급은 ${nextTier.name}, Lv.${nextTier.reqLevel}에서 열려.`
      : `${lineName} 라인의 최종 승급까지 왔어. 이제 장비와 동료 조합으로 후반 밸류를 올리면 돼.`;

  return `
    <div class="profile-promotion-note">
      <div class="profile-promotion-title">성장 해석</div>
      <div class="profile-promotion-body">${body}</div>
    </div>
  `;
}

function buildProfileProgressSection(dungeonCircles, companionCircles) {
  return `
    <div class="profile-progress-row">
      <div class="profile-progress-card">
        <div class="profile-progress-title">던전 ${dungeonsCleared.length}/9</div>
        <div class="profile-progress-dots">${dungeonCircles}</div>
      </div>
      <div class="profile-progress-card">
        <div class="profile-progress-title">동료 ${companions.length}/${getTotalCompanionCount()}</div>
        <div class="profile-progress-dots">${companionCircles}</div>
      </div>
    </div>
  `;
}

function renderProfile() {
  const bonus = getEquipBonus();
  const tier = getCurrentTier();
  const nextTier = getNextTier();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const content = document.getElementById('profile-content');
  const armorColor = equipped.armor && ITEMS[equipped.armor.itemId] ? ITEMS[equipped.armor.itemId].color : null;
  const glowSize = Math.min(tier.tier * 4, 24);
  const glowOpacity = Math.min(tier.tier * 0.12, 0.7);

  let tierPct = 100;
  let tierProgressText = '최고 등급 달성!';
  if (nextTier) {
    const prevReq = tier.reqLevel;
    const nextReq = nextTier.reqLevel;
    tierPct = Math.min(100, Math.floor((player.level - prevReq) / (nextReq - prevReq) * 100));
    tierProgressText = '';
  }

  const playerStats = {
    hpPct: Math.max(0, Math.min(100, player.hp / player.maxHp * 100)),
    mpPct: Math.max(0, Math.min(100, player.mp / player.maxMp * 100)),
    hpText: Math.floor(player.hp) + '/' + player.maxHp,
    mpText: Math.floor(player.mp) + '/' + player.maxMp,
    atk: player.atk + bonus.atk,
    def: player.def + bonus.def,
    crit: Math.min(30, player.critChance + (bonus.critBonus || 0)),
    speed: (player.speed + (bonus.speedBonus || 0)).toFixed(2),
  };
  const dungeonCircles = buildProfileProgressDots(9, (idx) => dungeonsCleared.includes(idx), 'dungeon');
  const companionCircles = buildProfileProgressDots(getTotalCompanionCount(), (idx) => companions.includes(idx), 'companion');
  const glowColor = `${tier.color}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`;

  content.innerHTML =
    '<div class="profile-layout">' +
      buildProfileCharacterCard(tier, growthLine.lineName, glowColor, glowSize, armorColor) +
      buildProfileStatsCard(playerStats) +
    '</div>' +
    buildProfileTierCard(tier, nextTier, tierPct, tierProgressText, growthLine.lineName) +
    buildProfilePromotionNote(tier, nextTier, growthLine.lineName) +
    buildProfileProgressSection(dungeonCircles, companionCircles);
}
