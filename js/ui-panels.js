'use strict';

// ─── Profile Panel ───────────────────────────────────────────────────────────
const profilePanel = document.getElementById('profile-panel');
document.getElementById('profile-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeProfile(); }, { passive: false });
document.getElementById('profile-close').addEventListener('click', closeProfile);

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
  const content = document.getElementById('profile-content');

  // Equipment display info
  const weaponIcon = equipped.weapon && ITEMS[equipped.weapon] ? ITEMS[equipped.weapon].icon : '';
  const armorColor = equipped.armor && ITEMS[equipped.armor] ? ITEMS[equipped.armor].color : null;
  const helmetColor = equipped.helmet && ITEMS[equipped.helmet] ? ITEMS[equipped.helmet].color : null;
  const helmetIcon = equipped.helmet && ITEMS[equipped.helmet] ? ITEMS[equipped.helmet].icon : '';

  // Tier glow intensity
  const glowSize = Math.min(tier.tier * 4, 24);
  const glowOpacity = Math.min(tier.tier * 0.12, 0.7);

  // HP/MP bar percentages
  const hpPct = Math.max(0, Math.min(100, player.hp / player.maxHp * 100));
  const mpPct = Math.max(0, Math.min(100, player.mp / player.maxMp * 100));

  // Tier progress
  let tierPct = 100;
  let tierProgressText = '최고 등급 달성!';
  if (nextTier) {
    const prevReq = tier.reqLevel;
    const nextReq = nextTier.reqLevel;
    tierPct = Math.min(100, Math.floor((player.level - prevReq) / (nextReq - prevReq) * 100));
    tierProgressText = '';
  }

  // Dungeon progress circles
  let dungeonCircles = '';
  for (let i = 0; i < 9; i++) {
    const cleared = dungeonsCleared.includes(i);
    dungeonCircles += '<div style="width:16px;height:16px;border-radius:50%;background:' +
      (cleared ? '#2ecc71' : 'rgba(255,255,255,0.08)') +
      ';border:2px solid ' + (cleared ? '#27ae60' : 'rgba(255,255,255,0.15)') +
      ';display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:' +
      (cleared ? '#fff' : '#555') + ';font-weight:bold;">' + (cleared ? '●' : '○') + '</div>';
  }

  // Companion circles
  let companionCircles = '';
  for (let i = 0; i < 9; i++) {
    const has = companions.includes(i);
    companionCircles += '<div style="width:16px;height:16px;border-radius:50%;background:' +
      (has ? '#3498db' : 'rgba(255,255,255,0.08)') +
      ';border:2px solid ' + (has ? '#2980b9' : 'rgba(255,255,255,0.15)') +
      ';display:inline-flex;align-items:center;justify-content:center;font-size:9px;color:' +
      (has ? '#fff' : '#555') + ';font-weight:bold;">' + (has ? '●' : '○') + '</div>';
  }

  const totalCrit = Math.min(30, player.critChance + (bonus.critBonus || 0));
  const totalSpeed = (player.speed + (bonus.speedBonus || 0)).toFixed(2);

  content.innerHTML = `
    <!-- Character + Stats (horizontal layout for landscape) -->
    <div style="display:flex;gap:10px;margin-bottom:8px;">
      <!-- Character Illustration -->
      <div style="position:relative;width:120px;min-width:120px;background:linear-gradient(180deg, #0a0c14, #1a1c24, #0a0c14);border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid rgba(255,255,255,0.06);padding:8px 0;">
        <div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, ${tier.color}${Math.round(glowOpacity*255).toString(16).padStart(2,'0')}, transparent 60%);"></div>
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <div style="position:relative;width:60px;height:60px;">
            ${tier.tier >= 3 ? '<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,'+tier.color+'33,transparent 70%);box-shadow:0 0 '+glowSize+'px '+tier.color+'44;"></div>' : ''}
            <img src="./character.png" alt="캐릭터" style="width:60px;height:60px;object-fit:contain;position:relative;z-index:2;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.7));" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
            <div style="display:none;width:40px;height:45px;margin:0 auto;align-items:center;justify-content:center;flex-direction:column;">
              <div style="width:24px;height:24px;background:${armorColor || tier.bodyColor};border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>
            </div>
          </div>
          <div style="text-align:center;margin-top:4px;">
            <div style="color:#fff;font-size:11px;font-weight:bold;">캐릭터</div>
            <div style="color:${tier.color};font-size:9px;font-weight:bold;margin-top:1px;">⭐ ${tier.tier}단 - ${tier.name}</div>
            <div style="color:#aaa;font-size:9px;margin-top:1px;">Lv. ${player.level}${player.level >= 35 ? ' (MAX)' : ''}</div>
          </div>
        </div>
      </div>
      <!-- Stats Section -->
      <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;">
        <div style="margin-bottom:4px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span style="color:#e74c3c;font-size:9px;font-weight:bold;">HP</span>
            <span style="color:#ddd;font-size:9px;">${Math.floor(player.hp)}/${player.maxHp}</span>
          </div>
          <div style="height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;">
            <div style="width:${hpPct}%;height:100%;background:linear-gradient(90deg,#ff6b6b,#e74c3c);border-radius:3px;"></div>
          </div>
        </div>
        <div style="margin-bottom:6px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span style="color:#3498db;font-size:9px;font-weight:bold;">MP</span>
            <span style="color:#ddd;font-size:9px;">${Math.floor(player.mp)}/${player.maxMp}</span>
          </div>
          <div style="height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;">
            <div style="width:${mpPct}%;height:100%;background:linear-gradient(90deg,#74b9ff,#0984e3);border-radius:3px;"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
          <div style="display:flex;justify-content:space-between;padding:3px 5px;background:rgba(255,255,255,0.04);border-radius:4px;">
            <span style="color:#aaa;font-size:9px;">공격력</span>
            <span style="color:#f1c40f;font-size:9px;font-weight:bold;">${player.atk + bonus.atk}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:3px 5px;background:rgba(255,255,255,0.04);border-radius:4px;">
            <span style="color:#aaa;font-size:9px;">방어력</span>
            <span style="color:#f1c40f;font-size:9px;font-weight:bold;">${player.def + bonus.def}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:3px 5px;background:rgba(255,255,255,0.04);border-radius:4px;">
            <span style="color:#aaa;font-size:9px;">크리티컬</span>
            <span style="color:#f1c40f;font-size:9px;font-weight:bold;">${totalCrit}%</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:3px 5px;background:rgba(255,255,255,0.04);border-radius:4px;">
            <span style="color:#aaa;font-size:9px;">이동속도</span>
            <span style="color:#f1c40f;font-size:9px;font-weight:bold;">${totalSpeed}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tier Progress -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="color:#ddd;font-size:10px;">승급: <span style="color:${tier.color};font-weight:bold;">${tier.tier}단 ${tier.name}</span></span>
        ${nextTier ? '<span style="color:#888;font-size:9px;">다음: ' + nextTier.name + ' (Lv.' + nextTier.reqLevel + ')</span>' : '<span style="color:#f1c40f;font-size:9px;">최고 등급</span>'}
      </div>
      <div style="height:6px;background:rgba(0,0,0,0.5);border-radius:3px;overflow:hidden;">
        <div style="width:${tierPct}%;height:100%;background:linear-gradient(90deg,${tier.color},${tier.bodyColor});border-radius:3px;"></div>
      </div>
      <div style="text-align:right;color:#aaa;font-size:8px;margin-top:2px;">${tierProgressText || tierPct + '%'}</div>
    </div>

    <!-- Dungeon & Companions (side by side) -->
    <div style="display:flex;gap:6px;margin-bottom:6px;">
    <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;">
      <div style="color:#aaa;font-size:9px;font-weight:bold;margin-bottom:4px;">던전 ${dungeonsCleared.length}/9</div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;">${dungeonCircles}</div>
    </div>

    <div style="flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;">
      <div style="color:#aaa;font-size:9px;font-weight:bold;margin-bottom:4px;">동료 ${companions.length}/9</div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;">${companionCircles}</div>
    </div>
    </div>
  `;
}

// ─── Companion Panel ─────────────────────────────────────────────────────────
const companionPanel = document.getElementById('companion-panel');
document.getElementById('companion-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeCompanionPanel(); }, { passive: false });
document.getElementById('companion-close').addEventListener('click', closeCompanionPanel);

function openCompanionPanel() {
  companionPanelOpen = true;
  showPanel(companionPanel);
  renderCompanionPanel();
}
function closeCompanionPanel() {
  companionPanelOpen = false;
  hidePanel(companionPanel);
}
function renderCompanionPanel() {
  const content = document.getElementById('companion-content');
  if (companions.length === 0) {
    content.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">아직 동료가 없습니다. 던전을 클리어하여 동료를 얻으세요!</div>';
    return;
  }

  const synergy = getActiveCompanionSynergy();
  content.innerHTML =
    '<div class="companion-summary-grid">' +
      '<div class="companion-summary-card">' +
        '<div class="summary-label">활성 동료</div>' +
        '<div class="summary-value">' + activeCompanions.length + '/2</div>' +
      '</div>' +
      '<div class="companion-summary-card">' +
        '<div class="summary-label">수집</div>' +
        '<div class="summary-value">' + companions.length + '/9</div>' +
      '</div>' +
      '<div class="companion-summary-card">' +
        '<div class="summary-label">사망</div>' +
        '<div class="summary-value ' + (deadCompanions.length > 0 ? 'warn' : '') + '">' + deadCompanions.length + '명</div>' +
      '</div>' +
      '<div class="companion-summary-card mercenary">' +
        '<div class="summary-label">용병 슬롯</div>' +
        '<div class="summary-value lock">잠김</div>' +
      '</div>' +
    '</div>' +
    '<div class="companion-synergy-banner">' + (synergy ? ('시너지: ' + synergy.name + ' · ' + synergy.desc) : '시너지 없음 — 조합에 따라 추가 보너스가 생긴다') + '</div>' +
    '<div class="companion-grid" id="companion-grid"></div>';

  const grid = document.getElementById('companion-grid');

  companions.forEach(cId => {
    const info = DUNGEON_INFO[cId];
    if (!info) return;
    const profile = getCompanionProfile(cId);
    const isActive = activeCompanions.includes(cId);
    const isDead = deadCompanions.includes(cId);
    const maxHp = getCompanionMaxHp(cId);
    const currentHp = companionStates[cId] ? companionStates[cId].hp : maxHp;
    const aiMode = getCompanionAIMode(cId, companionStates[cId]);
    const aiMeta = COMPANION_AI_MODES[aiMode] || COMPANION_AI_MODES.aggressive;

    let btnLabel, btnColor, btnAction;
    if (isDead) {
      if (currentMap === 'town') {
        btnLabel = '부활';
        btnColor = '#27ae60';
        btnAction = 'revive';
      } else {
        btnLabel = '사망';
        btnColor = '#666';
        btnAction = 'none';
      }
    } else if (isActive) {
      btnLabel = '해제';
      btnColor = '#e74c3c';
      btnAction = 'deactivate';
    } else {
      btnLabel = activeCompanions.length >= 2 ? '만석' : '선택';
      btnColor = activeCompanions.length >= 2 ? '#666' : '#2980b9';
      btnAction = activeCompanions.length >= 2 ? 'none' : 'activate';
    }

    const card = document.createElement('div');
    card.className = 'companion-card' + (isActive ? ' active' : '') + (isDead ? ' dead' : '');

    const hpPct = Math.max(0, Math.min(100, currentHp / maxHp * 100));
    const statusText = isDead
      ? '사망'
      : isActive
        ? '출전 중'
        : '대기';

    card.innerHTML =
      '<div class="companion-card-top">' +
        '<div class="companion-card-icon" style="background:' + info.companionColor + ';">★</div>' +
        '<div class="companion-card-main">' +
          '<div class="companion-card-name-row">' +
            '<div class="companion-card-name">' + info.companionName + '</div>' +
            '<div class="companion-status-badge ' + (isDead ? 'dead' : isActive ? 'active' : '') + '">' + statusText + '</div>' +
          '</div>' +
          '<div class="companion-card-role">' + profile.roleLabel + ' · ' + profile.skillName + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="companion-card-stats">' +
        '<span>ATK ' + getCompanionAtk(cId) + '</span>' +
        '<span>HP ' + Math.floor(currentHp) + '/' + maxHp + '</span>' +
      '</div>' +
      '<div class="companion-hp-bar"><div class="companion-hp-fill" style="width:' + hpPct + '%;"></div></div>' +
      '<div class="companion-card-actions">' +
        '<button class="comp-ai-btn companion-mini-btn" style="background:' + aiMeta.color + ';">AI: ' + aiMeta.label + '</button>' +
        '<button class="comp-btn companion-mini-btn" style="background:' + btnColor + ';"' + (btnAction === 'none' ? ' disabled' : '') + '>' + btnLabel + '</button>' +
      '</div>' +
      (btnAction === 'revive' ? '<div class="companion-cost-note">부활 비용: ' + getReviveCost(cId) + 'G</div>' : '');

    const aiBtn = card.querySelector('.comp-ai-btn');
    if (aiBtn) {
      aiBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextMode = cycleCompanionAIMode(cId);
        const nextMeta = COMPANION_AI_MODES[nextMode] || COMPANION_AI_MODES.aggressive;
        showToast(info.companionName + ' AI: ' + nextMeta.label);
        renderCompanionPanel();
        autoSave();
      });
    }

    if (btnAction !== 'none') {
      const actionBtn = card.querySelector('.comp-btn');
      actionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (btnAction === 'activate') {
          if (activeCompanions.length < 2) {
            activeCompanions.push(cId);
            initCompanionState(cId);
          }
        } else if (btnAction === 'deactivate') {
          activeCompanions = activeCompanions.filter(id => id !== cId);
          delete companionStates[cId];
        } else if (btnAction === 'revive') {
          const reviveCost = getReviveCost(cId);
          if (player.gold >= reviveCost) {
            player.gold -= reviveCost;
            deadCompanions = deadCompanions.filter(id => id !== cId);
            updateHUD();
            AudioSystem.sfx.heal();
            showToast(info.companionName + ' 부활!');
          } else {
            showToast('골드가 부족합니다!');
          }
        }
        renderCompanionPanel();
        autoSave();
      });
    }

    grid.appendChild(card);
  });
}

// ─── Temple Panel UI ─────────────────────────────────────────────────────
const templePanel = document.getElementById('temple-panel');
let templeOpen = false;
document.getElementById('temple-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeTemple(); }, { passive: false });
document.getElementById('temple-close').addEventListener('click', closeTemple);

function openTemple() {
  templeOpen = true;
  showPanel(templePanel);
  renderTemple();
}
function closeTemple() {
  templeOpen = false;
  hidePanel(templePanel);
}
function renderTemple() {
  const content = document.getElementById('temple-content');

  if (deadCompanions.length === 0) {
    content.innerHTML = '<div style="text-align:center;padding:30px 10px;">' +
      '<div style="font-size:32px;margin-bottom:10px;">✨</div>' +
      '<div style="color:#2ecc71;font-size:13px;font-weight:bold;margin-bottom:6px;">모든 동료가 건강합니다</div>' +
      '<div style="color:#888;font-size:10px;">부활이 필요한 동료가 없습니다.</div>' +
      '</div>';
    return;
  }

  let html = '<div style="color:#aaa;font-size:10px;margin-bottom:8px;text-align:center;">쓰러진 동료를 골드를 사용하여 부활시킬 수 있습니다.</div>';
  html += '<div style="color:#f1c40f;font-size:11px;text-align:center;margin-bottom:10px;">💰 보유 골드: ' + player.gold + '</div>';

  deadCompanions.forEach(cId => {
    const info = DUNGEON_INFO[cId];
    if (!info) return;
    const cost = getReviveCost(cId);
    const canAfford = player.gold >= cost;
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;margin-bottom:5px;">' +
      '<div style="width:28px;height:28px;border-radius:6px;background:' + info.companionColor + ';display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;opacity:0.5;">★</div>' +
      '<div style="flex:1;">' +
        '<div style="color:#ddd;font-size:11px;font-weight:bold;">' + info.companionName + '</div>' +
        '<div style="color:#e74c3c;font-size:9px;">쓰러짐</div>' +
      '</div>' +
      '<div style="color:#f1c40f;font-size:10px;margin-right:6px;">💰 ' + cost + '</div>' +
      '<button class="temple-revive-btn" data-cid="' + cId + '" style="padding:4px 10px;border:none;border-radius:6px;font-size:10px;font-weight:bold;color:#fff;cursor:pointer;pointer-events:all;' +
        (canAfford ? 'background:linear-gradient(180deg,#2ecc71,#27ae60);' : 'background:#555;cursor:not-allowed;') + '"' +
        (canAfford ? '' : ' disabled') + '>' + (canAfford ? '부활' : '골드 부족') + '</button>' +
      '</div>';
  });

  // Revive all button
  const totalCost = deadCompanions.reduce((sum, cId) => sum + getReviveCost(cId), 0);
  const canAffordAll = player.gold >= totalCost && deadCompanions.length > 1;
  html += '<div style="margin-top:10px;text-align:center;">' +
    '<button id="temple-revive-all" style="padding:6px 16px;border:none;border-radius:8px;font-size:11px;font-weight:bold;color:#fff;cursor:pointer;pointer-events:all;' +
    (canAffordAll ? 'background:linear-gradient(180deg,#f39c12,#e67e22);' : 'background:#555;cursor:not-allowed;') + '"' +
    (canAffordAll ? '' : ' disabled') + '>전체 부활 (💰 ' + totalCost + ')</button>' +
    '</div>';

  content.innerHTML = html;

  // Wire up individual revive buttons
  content.querySelectorAll('.temple-revive-btn').forEach(btn => {
    if (btn.disabled) return;
    function handleRevive(e) {
      e.preventDefault(); e.stopPropagation();
      const cId = parseInt(btn.getAttribute('data-cid'));
      const cost = getReviveCost(cId);
      if (player.gold < cost) return;
      player.gold -= cost;
      deadCompanions = deadCompanions.filter(id => id !== cId);
      AudioSystem.sfx.heal();
      const cInfo = DUNGEON_INFO[cId];
      showToast((cInfo ? cInfo.companionName : '동료') + ' 부활!');
      updateHUD();
      autoSave();
      renderTemple();
    }
    btn.addEventListener('click', handleRevive);
  });

  // Wire up revive all button
  const allBtn = document.getElementById('temple-revive-all');
  if (allBtn && !allBtn.disabled) {
    allBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (player.gold < totalCost) return;
      player.gold -= totalCost;
      deadCompanions = [];
      AudioSystem.sfx.tierUp();
      showToast('모든 동료가 부활했습니다!');
      updateHUD();
      autoSave();
      renderTemple();
    });
  }
}

// ─── Skill Panel UI ──────────────────────────────────────────────────────
const skillPanel = document.getElementById('skill-panel');
document.getElementById('skill-panel-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeSkillPanel(); }, { passive: false });
document.getElementById('skill-panel-close').addEventListener('click', closeSkillPanel);

function openSkillPanel() {
  skillPanelOpen = true;
  showPanel(skillPanel);
  renderSkillPanel();
}
function closeSkillPanel() {
  skillPanelOpen = false;
  hidePanel(skillPanel);
}
function renderSkillPanel() {
  const content = document.getElementById('skill-panel-content');
  content.innerHTML = '';
  SKILLS.forEach(skill => {
    // Find which slot this skill is assigned to
    let slotLabel = '';
    for (let p = 0; p < skillPages.length; p++) {
      for (let s = 0; s < skillPages[p].length; s++) {
        if (skillPages[p][s] === skill.id) {
          slotLabel = '슬롯 ' + (p+1) + '-' + (s+1) + ' 등록됨';
        }
      }
    }

    const badgeColors = {
      projectile: '#e74c3c',
      melee: '#e67e22',
      self: '#2ecc71',
      buff: '#3498db',
      aoe: '#8e44ad',
    };

    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <div class="skill-icon-circle" style="background:${skill.iconBg || '#444'}22;border:1px solid ${skill.iconBg || '#666'}55;">${skill.icon}</div>
      <div class="skill-info">
        <div class="skill-name">${skill.name} <span class="skill-type-badge" style="background:${badgeColors[skill.type] || '#555'}22;color:${badgeColors[skill.type] || '#ccc'};border:1px solid ${badgeColors[skill.type] || '#666'}44;">${skill.typeLabel || skill.type}</span></div>
        <div class="skill-desc">${skill.desc}</div>
        ${slotLabel ? `<div class="skill-slot-info">${slotLabel}</div>` : ''}
      </div>
      <div class="skill-stats">
        <div class="skill-stat mp">💧 ${skill.mpCost}</div>
        <div class="skill-stat cd">⏱ ${(skill.cooldown/1000).toFixed(1)}s</div>
      </div>
    `;
    content.appendChild(card);
  });
}

// ─── Quest Panel UI ──────────────────────────────────────────────────────
const questPanel = document.getElementById('quest-panel');
document.getElementById('quest-panel-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeQuestPanel(); }, { passive: false });
document.getElementById('quest-panel-close').addEventListener('click', closeQuestPanel);

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
  const nextDungeon = DUNGEON_INFO.find((_, idx) => !dungeonsCleared.includes(idx));
  const currentQuest = getCurrentMainQuest();
  const currentMainStatus = getMainQuestStatus(currentQuest);
  const totalSubquests = SUBQUESTS.length;
  const acceptedCount = acceptedSubquests.length;
  const completedCount = completedSubquests.length;
  const availableSubquests = getAvailableSubquests();
  const acceptedDetails = getAcceptedSubquestsDetailed();

  let html = '';

  html += '<div class="quest-section-title">메인 진행</div>';
  html += '<div class="quest-card primary">';
  html += '<div class="quest-row"><span class="quest-label">현재 목표</span><span class="quest-value">' + (currentQuest ? currentQuest.title : '모든 메인 퀘스트 완료') + '</span></div>';
  if (currentQuest) {
    html += '<div class="quest-row"><span class="quest-label">의뢰 NPC</span><span class="quest-value">' + getQuestNpcName(getQuestOfferNpcId(currentQuest)) + '</span></div>';
    html += '<div class="quest-row"><span class="quest-label">보고 / 보상 수령 NPC</span><span class="quest-value">' + getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '</span></div>';
    html += '<div class="quest-row"><span class="quest-label">상태</span><span class="quest-value">' + currentMainStatus.label + '</span></div>';
    html += '<div class="quest-row"><span class="quest-label">설명</span><span class="quest-value">' + currentQuest.description + '</span></div>';
    if (currentQuest.reward) {
      html += '<div class="quest-row"><span class="quest-label">보상</span><span class="quest-value">' + buildQuestRewardText(currentQuest) + '</span></div>';
    }
    html += '<div class="quest-desc">';
    html += currentMainStatus.ready
      ? ('목표 달성 완료. <span style="color:#f1c40f;font-weight:bold;">' + getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '</span>에게 돌아가 보상을 수령하세요.')
      : ('다음 행동: ' + (currentQuest.hint || currentQuest.description));
    html += '</div>';
  } else {
    html += '<div class="quest-row"><span class="quest-label">진행도</span><span class="quest-value">' + completedMainQuests.length + '/' + MAIN_QUESTS.length + '</span></div>';
    html += '<div class="quest-desc">메인 루프를 전부 완료했습니다. 동료 조합과 장비를 계속 시험해볼 수 있습니다.</div>';
  }
  html += '</div>';

  html += '<div class="quest-section-title">던전 진행</div>';
  html += '<div class="quest-dungeon-list">';
  DUNGEON_INFO.forEach((info, idx) => {
    const cleared = dungeonsCleared.includes(idx);
    const isNext = nextDungeon && nextDungeon.id === idx;
    html += '<div class="quest-dungeon-item ' + (cleared ? 'done' : '') + ' ' + (isNext ? 'next' : '') + '">';
    html += '<div class="quest-dungeon-head">';
    html += '<div><div class="quest-dungeon-name">' + info.name + '</div><div class="quest-dungeon-meta">추천 Lv ' + info.recommendedLevel + ' · 지역 ' + info.zone + '</div></div>';
    html += '<div class="quest-chip ' + (cleared ? 'done' : isNext ? 'active' : '') + '">' + (cleared ? '완료' : isNext ? '다음 목표' : '미완료') + '</div>';
    html += '</div>';
    html += '<div class="quest-dungeon-boss">보스: ' + info.bossName + ' · 패턴: ' + info.bossSkillName + '</div>';
    html += '<div class="quest-dungeon-reward">동료 보상: ' + info.companionName + '</div>';
    html += '</div>';
  });
  html += '</div>';

  html += '<div class="quest-section-title">진행 중인 서브 퀘스트</div>';
  html += '<div class="quest-card">';
  html += '<div class="quest-row"><span class="quest-label">수락 중</span><span class="quest-value">' + acceptedCount + '</span></div>';
  html += '<div class="quest-row"><span class="quest-label">완료</span><span class="quest-value">' + completedCount + '/' + totalSubquests + '</span></div>';
  html += '<div class="quest-row"><span class="quest-label">현재 수락 가능</span><span class="quest-value">' + availableSubquests.length + '</span></div>';
  html += '</div>';

  if (acceptedDetails.length > 0) {
    acceptedDetails.forEach(detail => {
      html += '<div class="quest-card">';
      html += '<div class="quest-row"><span class="quest-label">퀘스트</span><span class="quest-value">' + detail.quest.title + '</span></div>';
      html += '<div style="margin-bottom:4px;">' +
        '<span class="quest-chip ' + (detail.readyToTurnIn ? 'done' : 'active') + '">' + detail.statusLabel + '</span>' +
        '<span class="quest-chip">진행도 ' + detail.progressText + '</span>' +
      '</div>';
      html += '<div class="quest-row"><span class="quest-label">의뢰 NPC</span><span class="quest-value">' + detail.offerNpcName + '</span></div>';
      html += '<div class="quest-row"><span class="quest-label">보고 / 보상 수령 NPC</span><span class="quest-value">' + detail.turnInNpcName + '</span></div>';
      html += '<div class="quest-row"><span class="quest-label">보상</span><span class="quest-value">' + (detail.rewardText || '없음') + '</span></div>';
      html += '<div class="quest-desc">' + detail.quest.description + '</div>';
      html += '<div class="quest-desc" style="margin-top:4px;color:' + (detail.readyToTurnIn ? '#f1c40f' : '#9aa3b2') + ';">' +
        (detail.readyToTurnIn
          ? ('목표 달성 완료. ' + detail.turnInNpcName + '에게 돌아가 보상을 수령하세요.')
          : ('아직 진행 중입니다. 완료 후 ' + detail.turnInNpcName + '에게 보고하세요.')) +
        '</div>';
      html += '</div>';
    });
  } else {
    html += '<div class="quest-card"><div class="quest-desc">현재 진행 중인 서브 퀘스트가 없습니다.</div></div>';
  }

  if (availableSubquests.length > 0) {
    html += '<div class="quest-section-title">수락 가능한 서브 퀘스트</div>';
    availableSubquests.forEach(quest => {
      html += '<div class="quest-card">';
      html += '<div class="quest-row"><span class="quest-label">퀘스트</span><span class="quest-value">' + quest.title + '</span></div>';
      html += '<div style="margin-bottom:4px;"><span class="quest-chip active">수락 가능</span></div>';
      html += '<div class="quest-row"><span class="quest-label">의뢰 NPC</span><span class="quest-value">' + getQuestNpcName(getQuestOfferNpcId(quest)) + '</span></div>';
      html += '<div class="quest-row"><span class="quest-label">보상 수령 NPC</span><span class="quest-value">' + getQuestNpcName(getQuestTurnInNpcId(quest)) + '</span></div>';
      html += '<div class="quest-row"><span class="quest-label">예상 보상</span><span class="quest-value">' + (buildQuestRewardText(quest) || '없음') + '</span></div>';
      html += '<div class="quest-desc">' + quest.description + '</div>';
      html += '</div>';
    });
  }

  content.innerHTML = html;
}

// ─── Village Panel UI ────────────────────────────────────────────────────
const villagePanel = document.getElementById('village-panel');
document.getElementById('village-panel-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeVillagePanel(); }, { passive: false });
document.getElementById('village-panel-close').addEventListener('click', closeVillagePanel);

function openVillagePanel() {
  villagePanelOpen = true;
  showPanel(villagePanel);
  renderVillagePanel();
}
function closeVillagePanel() {
  villagePanelOpen = false;
  hidePanel(villagePanel);
}
function renderVillagePanel() {
  const content = document.getElementById('village-panel-content');
  const upgrades = getVillageUpgradeDefinitions();
  const tierLabel = getVillageTierLabel();
  const completionPct = Math.min(100, Math.round((dungeonsCleared.length / DUNGEON_INFO.length) * 100));
  const totalUpgradeLevel = villageUpgrades.forge + villageUpgrades.guard + villageUpgrades.trade + villageUpgrades.alchemy;

  let html = '';
  html += '<div class="quest-section-title">마을 상태</div>';
  html += '<div class="quest-card primary">';
  html += '<div class="quest-row"><span class="quest-label">현재 단계</span><span class="quest-value">' + tierLabel + '</span></div>';
  html += '<div class="quest-row"><span class="quest-label">던전 확보율</span><span class="quest-value">' + dungeonsCleared.length + '/' + DUNGEON_INFO.length + ' (' + completionPct + '%)</span></div>';
  html += '<div class="quest-row"><span class="quest-label">총 업그레이드</span><span class="quest-value">Lv 합계 ' + totalUpgradeLevel + '</span></div>';
  html += '<div class="quest-desc">던전을 돌파할수록 마을이 성장하고, 각 시설 강화는 전투와 경제 보너스로 이어집니다.</div>';
  html += '</div>';

  html += '<div class="quest-section-title">시설 업그레이드</div>';
  upgrades.forEach(upgrade => {
    const currentLevel = villageUpgrades[upgrade.key] || 0;
    html += '<div class="village-upgrade-card">';
    html += '<div class="village-upgrade-top">';
    html += '<div><div class="village-upgrade-name">' + upgrade.icon + ' ' + upgrade.name + '</div><div class="village-upgrade-meta">현재 레벨 ' + currentLevel + ' / ' + upgrade.maxLevel + '</div></div>';
    html += '<div class="quest-chip ' + (currentLevel >= upgrade.maxLevel ? 'done' : 'active') + '">' + (currentLevel >= upgrade.maxLevel ? '완료' : '진행 가능') + '</div>';
    html += '</div>';
    html += '<div class="quest-desc">' + upgrade.description + '</div>';
    html += '<div class="village-benefit-list">';
    upgrade.levels.forEach((levelInfo, idx) => {
      const reached = currentLevel > idx;
      html += '<div class="village-benefit-item ' + (reached ? 'reached' : '') + '">';
      html += '<span class="village-benefit-label">Lv ' + (idx + 1) + '</span>';
      html += '<span class="village-benefit-value">' + levelInfo.bonus + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  });

  content.innerHTML = html;
}
