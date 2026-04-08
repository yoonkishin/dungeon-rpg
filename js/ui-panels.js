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
  content.innerHTML = '';

  // Active count display
  const countDiv = document.createElement('div');
  countDiv.style.cssText = 'color:#f1c40f;font-size:12px;margin-bottom:10px;text-align:center;';
  countDiv.textContent = '활성 동료: ' + activeCompanions.length + '/2' + (deadCompanions.length > 0 ? ' | 사망: ' + deadCompanions.length + '명' : '');
  content.appendChild(countDiv);

  companions.forEach(cId => {
    const info = DUNGEON_INFO[cId];
    if (!info) return;
    const isActive = activeCompanions.includes(cId);
    const isDead = deadCompanions.includes(cId);
    const maxHp = getCompanionMaxHp(cId);
    const currentHp = companionStates[cId] ? companionStates[cId].hp : maxHp;
    const div = document.createElement('div');
    div.className = 'companion-item' + (isActive ? ' active-companion' : '');
    if (isDead) div.style.opacity = '0.5';

    let btnLabel, btnColor, btnAction;
    if (isDead) {
      if (currentMap === 'town') {
        btnLabel = '부활 (100G)';
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

    const hpBarHtml = isDead
      ? '<div style="color:#e74c3c;font-size:10px;">사망</div>'
      : '<div style="height:4px;background:rgba(0,0,0,0.4);border-radius:2px;width:60px;overflow:hidden;"><div style="height:100%;width:' + (currentHp/maxHp*100) + '%;background:#2ecc71;border-radius:2px;"></div></div>';

    div.innerHTML =
      '<div class="comp-icon" style="background:' + info.companionColor + ';">★</div>' +
      '<span class="comp-name">' + info.companionName + '</span>' +
      '<span style="color:#aaa;font-size:10px;">ATK:' + getCompanionAtk(cId) + ' HP:' + Math.floor(currentHp) + '/' + maxHp + '</span>' +
      hpBarHtml +
      '<button class="comp-btn" style="background:' + btnColor + ';"' + (btnAction === 'none' ? ' disabled' : '') + '>' + btnLabel + '</button>';

    if (btnAction !== 'none') {
      function handleCompBtn(e) {
        e.preventDefault(); e.stopPropagation();
        if (btnAction === 'activate') {
          if (activeCompanions.length < 2) {
            activeCompanions.push(cId);
            initCompanionState(cId);
          }
        } else if (btnAction === 'deactivate') {
          activeCompanions = activeCompanions.filter(id => id !== cId);
          delete companionStates[cId];
        } else if (btnAction === 'revive') {
          if (player.gold >= 100) {
            player.gold -= 100;
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
      }
      div.querySelector('.comp-btn').addEventListener('click', handleCompBtn);
    }
    content.appendChild(div);
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
    const cost = 50 + cId * 25;
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
  const totalCost = deadCompanions.reduce((sum, cId) => sum + 50 + cId * 25, 0);
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
      const cost = 50 + cId * 25;
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
    const badgeColor = badgeColors[skill.type] || '#888';

    const div = document.createElement('div');
    div.className = 'skill-card';
    div.innerHTML = `
      <div class="skill-icon-circle" style="background:${skill.iconBg || badgeColor};">
        <span style="font-size:24px;">${skill.icon}</span>
      </div>
      <div class="skill-info">
        <div class="skill-name">${skill.name}</div>
        <div class="skill-desc">${skill.desc}</div>
        <div class="skill-stats">
          <span class="skill-stat mp">💧 MP ${skill.mpCost}</span>
          <span class="skill-stat cd">⏱ ${(skill.cooldown/1000).toFixed(0)}초</span>
          <span class="skill-type-badge" style="background:${badgeColor}33;color:${badgeColor};border:1px solid ${badgeColor}66;">${skill.typeLabel || skill.type}</span>
          ${skill.range > 0 ? '<span class="skill-stat" style="color:#ddd;">📏 ' + skill.range + '</span>' : ''}
        </div>
        <div class="skill-slot-info" style="color:${slotLabel ? '#f1c40f' : '#666'};">${slotLabel ? '⚡ ' + slotLabel : '미등록'}</div>
      </div>
    `;
    content.appendChild(div);
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
  const nextDungeon = DUNGEON_INFO.find(info => !dungeonsCleared.includes(info.id)) || null;
  const nextTier = getNextTier();
  const activeNames = activeCompanions.map(id => DUNGEON_INFO[id] && DUNGEON_INFO[id].companionName).filter(Boolean);
  const completionPct = Math.floor((dungeonsCleared.length / DUNGEON_INFO.length) * 100);

  const mainObjectiveTitle = nextDungeon ? `다음 던전: ${nextDungeon.name}` : '모든 던전 정복 완료';
  const mainObjectiveDesc = nextDungeon
    ? `${nextDungeon.bossName}을 쓰러뜨리고 동료 \"${nextDungeon.companionName}\"를 확보해봐. 현재 필드에서 포탈을 타고 던전에 진입하면 된다.`
    : '9개 던전을 모두 클리어했어. 이제는 빌드와 전투감을 더 다듬는 실험을 해볼 타이밍이다.';

  const tierText = nextTier
    ? `${nextTier.name}까지 Lv.${nextTier.reqLevel} 필요 (${Math.max(0, nextTier.reqLevel - player.level)} 남음)`
    : '최고 티어 도달';

  const companionGoal = activeCompanions.length >= 2
    ? `편성 완료 (${activeCompanions.length}/2)`
    : `${2 - activeCompanions.length}명 더 편성 가능`;

  content.innerHTML = `
    <div class="quest-card primary">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <div style="color:#fff;font-size:12px;font-weight:bold;">${mainObjectiveTitle}</div>
        <div class="quest-chip active">진행 중</div>
      </div>
      <div class="quest-desc">${mainObjectiveDesc}</div>
      <div style="margin-top:6px;">
        <span class="quest-chip ${nextDungeon ? 'warn' : 'done'}">${nextDungeon ? '보스 목표' : '완료'}</span>
        <span class="quest-chip ${currentMap === 'town' ? 'warn' : 'active'}">현재 위치: ${currentMap === 'town' ? '마을' : currentMap === 'field' ? '필드' : '던전'}</span>
      </div>
    </div>

    <div class="quest-section-title">탐험 진행도</div>
    <div class="quest-card">
      <div class="quest-row">
        <span class="quest-label">던전 클리어</span>
        <span class="quest-value">${dungeonsCleared.length}/${DUNGEON_INFO.length} (${completionPct}%)</span>
      </div>
      <div class="quest-row">
        <span class="quest-label">획득 동료</span>
        <span class="quest-value">${companions.length}/${DUNGEON_INFO.length}</span>
      </div>
      <div class="quest-row">
        <span class="quest-label">활성 동료</span>
        <span class="quest-value">${companionGoal}</span>
      </div>
      <div class="quest-row">
        <span class="quest-label">다음 티어</span>
        <span class="quest-value">${tierText}</span>
      </div>
    </div>

    <div class="quest-section-title">현재 파티 메모</div>
    <div class="quest-card">
      <div class="quest-desc">${activeNames.length > 0 ? '활성 동료: ' + activeNames.join(', ') : '아직 활성 동료가 없어. 던전을 클리어하고 동료 패널에서 최대 2명까지 편성해봐.'}</div>
      ${deadCompanions.length > 0 ? '<div class="quest-desc" style="color:#e74c3c;">쓰러진 동료 ' + deadCompanions.length + '명 있음. 마을 신전에서 부활 가능.</div>' : ''}
      <div style="margin-top:4px;">
        <span class="quest-chip ${player.gold >= 100 ? 'done' : 'warn'}">골드 ${player.gold}</span>
        <span class="quest-chip ${player.level >= 6 ? 'done' : 'warn'}">Lv.${player.level}</span>
      </div>
    </div>

    <div class="quest-section-title">추천 다음 행동</div>
    <div class="quest-card">
      <div class="quest-desc">1. 마을에서 장비/포션 확인</div>
      <div class="quest-desc">2. 필드에서 다음 던전 포탈 탐색</div>
      <div class="quest-desc">3. 보스 처치 후 동료 확보</div>
      <div class="quest-desc">4. 귀환해서 장비/파티 재정비</div>
    </div>
  `;
}


// ─── Inventory UI ────────────────────────────────────────────────────────────
const invPanel = document.getElementById('inventory-panel');
let invOpen = false;
let shopOpen = false;

invPanel.querySelector('.inv-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeInventory(); }, { passive: false });
invPanel.querySelector('.inv-close').addEventListener('click', closeInventory);

function openInventory() {
  if (shopOpen) return;
  invOpen = true;
  showPanel(invPanel);
  renderInventory();
}

function toggleInventory() {
  if (shopOpen) return;
  if (invOpen) {
    closeInventory();
  } else {
    invOpen = true;
    showPanel(invPanel);
    renderInventory();
  }
}

function closeInventory() {
  invOpen = false;
  hidePanel(invPanel);
}

function renderInventory() {
  // Update equipment slots on silhouette
  const slotMap = {
    helmet: 'eq-helmet', weapon: 'eq-weapon', armor: 'eq-armor',
    shield: 'eq-shield', boots: 'eq-boots', accessory1: 'eq-acc1',
    accessory2: 'eq-acc2', event: 'eq-event'
  };
  const defaultIcons = {
    helmet: '⛑️', weapon: '🗡️', armor: '🧥', shield: '🛡️',
    boots: '👢', accessory1: '💍', accessory2: '💍', event: '🍀'
  };

  Object.keys(slotMap).forEach(key => {
    const el = document.getElementById(slotMap[key]);
    const eqId = equipped[key];
    if (eqId && ITEMS[eqId]) {
      el.textContent = ITEMS[eqId].icon;
      el.classList.add('equipped');
    } else {
      el.textContent = defaultIcons[key];
      el.classList.remove('equipped');
    }
  });

  // Setup click handlers for equipment slots (to unequip)
  Object.keys(slotMap).forEach(key => {
    const el = document.getElementById(slotMap[key]);
    el.onclick = null;
    const eqId = equipped[key];
    if (eqId && ITEMS[eqId]) {
      el.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showItemPopup(eqId, -1, key);
      };
    }
  });

  // Render bag grid (icons only)
  const bagGrid = document.getElementById('bag-grid');
  bagGrid.innerHTML = '';
  document.getElementById('bag-count').textContent = inventory.length;

  if (inventory.length === 0) {
    bagGrid.innerHTML = '<div style="color:#666;font-size:9px;grid-column:1/-1;text-align:center;padding:10px;">아이템 없음</div>';
    return;
  }

  function isItemEquipped(itemId) {
    const allSlots = EQUIP_SLOTS;
    return allSlots.some(s => equipped[s] === itemId);
  }

  inventory.forEach((itemId, idx) => {
    const item = ITEMS[itemId];
    if (!item) return;
    const isEq = isItemEquipped(itemId);
    const cell = document.createElement('div');
    cell.className = 'bag-cell' + (isEq ? ' equipped-mark' : '') + (item.type === 'potion' ? ' potion-cell' : '');
    cell.textContent = item.icon;

    function handleCellClick(e) {
      e.preventDefault();
      e.stopPropagation();
      showItemPopup(itemId, idx, null);
    }
    cell.addEventListener('click', handleCellClick);
    bagGrid.appendChild(cell);
  });
}

function showItemPopup(itemId, invIdx, equippedSlotKey) {
  const item = ITEMS[itemId];
  if (!item) return;
  const popup = document.getElementById('item-popup');
  const content = document.getElementById('popup-content');

  const isEquipped = equippedSlotKey !== null;
  const isPotion = item.type === 'potion';

  // Type labels
  const typeLabels = { weapon:'무기', armor:'갑옷', helmet:'투구', boots:'장화', shield:'방패', accessory:'장신구', event:'이벤트', potion:'소비' };
  const typeLabel = typeLabels[item.type] || item.type;

  // Build stat list for an item
  function getStatLines(it) {
    const lines = [];
    if (it.atk > 0) lines.push({ label: '공격력', val: '+' + it.atk });
    if (it.def > 0) lines.push({ label: '방어력', val: '+' + it.def });
    if (it.speedBonus) lines.push({ label: '속도', val: '+' + it.speedBonus });
    if (it.critBonus) lines.push({ label: '크리티컬', val: '+' + it.critBonus + '%' });
    if (it.goldBonus) lines.push({ label: '골드보너스', val: '+' + it.goldBonus + '%' });
    if (it.heal) lines.push({ label: 'HP회복', val: '+' + it.heal });
    return lines;
  }

  // Find what's currently equipped in the same slot type
  function findEquipSlotForType(itemType) {
    if (itemType === 'weapon') return 'weapon';
    if (itemType === 'armor') return 'armor';
    if (itemType === 'helmet') return 'helmet';
    if (itemType === 'boots') return 'boots';
    if (itemType === 'shield') return 'shield';
    if (itemType === 'event') return 'event';
    if (itemType === 'accessory') return equipped.accessory1 ? 'accessory1' : 'accessory2';
    return null;
  }

  let compareHtml = '';
  if (!isPotion && !isEquipped) {
    const targetSlot = findEquipSlotForType(item.type);
    const currentEqId = targetSlot ? equipped[targetSlot] : null;
    const currentItem = currentEqId ? ITEMS[currentEqId] : null;

    if (currentItem) {
      const newStats = getStatLines(item);
      const curStats = getStatLines(currentItem);

      // Collect all stat keys
      const allLabels = [...new Set([...newStats.map(s=>s.label), ...curStats.map(s=>s.label)])];

      function getNumVal(stats, label) {
        const s = stats.find(x => x.label === label);
        if (!s) return 0;
        return parseFloat(s.val.replace(/[^0-9.]/g, '')) || 0;
      }

      let curRows = '';
      let newRows = '';
      allLabels.forEach(label => {
        const cv = getNumVal(curStats, label);
        const nv = getNumVal(newStats, label);
        const cls = nv > cv ? 'better' : nv < cv ? 'worse' : 'same';
        curRows += '<div class="popup-stat-row"><span class="label">' + label + '</span><span class="val">' + (cv > 0 ? '+' + cv : '0') + '</span></div>';
        newRows += '<div class="popup-stat-row"><span class="label">' + label + '</span><span class="val ' + cls + '">' + (nv > 0 ? '+' + nv : '0') + (nv > cv ? ' ▲' : nv < cv ? ' ▼' : '') + '</span></div>';
      });

      compareHtml = '<div class="popup-compare">' +
        '<div class="popup-stat-box current"><div class="popup-stat-title">현재: ' + currentItem.icon + ' ' + currentItem.name + '</div>' + curRows + '</div>' +
        '<div class="popup-stat-box new-item"><div class="popup-stat-title">선택: ' + item.icon + ' ' + item.name + '</div>' + newRows + '</div>' +
        '</div>';
    } else {
      // No current equipment, just show new item stats
      const newStats = getStatLines(item);
      let rows = '';
      newStats.forEach(s => {
        rows += '<div class="popup-stat-row"><span class="label">' + s.label + '</span><span class="val better">' + s.val + '</span></div>';
      });
      compareHtml = '<div class="popup-stat-box new-item" style="margin-bottom:8px;"><div class="popup-stat-title">스탯</div>' + rows + '</div>';
    }
  } else if (isPotion) {
    compareHtml = '<div class="popup-stat-box" style="margin-bottom:8px;border-color:rgba(231,76,60,0.3);"><div class="popup-stat-title">효과</div>' +
      '<div class="popup-stat-row"><span class="label">HP 회복</span><span class="val better">+' + item.heal + '</span></div>' +
      '</div>';
  } else if (isEquipped) {
    // Viewing equipped item
    const stats = getStatLines(item);
    let rows = '';
    stats.forEach(s => {
      rows += '<div class="popup-stat-row"><span class="label">' + s.label + '</span><span class="val">' + s.val + '</span></div>';
    });
    compareHtml = '<div class="popup-stat-box" style="margin-bottom:8px;border-color:rgba(241,196,15,0.3);"><div class="popup-stat-title">장착 중</div>' + rows + '</div>';
  }

  // Buttons
  let btnsHtml = '';
  if (isEquipped) {
    btnsHtml = '<button class="popup-btn unequip" id="popup-action">해제</button><button class="popup-btn close" id="popup-close-btn">닫기</button>';
  } else if (isPotion) {
    btnsHtml = '<button class="popup-btn use" id="popup-action">사용</button><button class="popup-btn close" id="popup-close-btn">닫기</button>';
  } else {
    btnsHtml = '<button class="popup-btn equip" id="popup-action">장착</button><button class="popup-btn close" id="popup-close-btn">닫기</button>';
  }

  content.innerHTML =
    '<div class="popup-item-header">' +
      '<div class="popup-icon">' + item.icon + '</div>' +
      '<div><div class="popup-name">' + item.name + '</div><div class="popup-type">' + typeLabel + (item.price > 0 ? ' · ' + item.price + 'G' : '') + '</div></div>' +
    '</div>' +
    compareHtml +
    '<div class="popup-btns">' + btnsHtml + '</div>';

  popup.style.display = 'flex';

  // Action button handler
  document.getElementById('popup-action').onclick = (e) => {
    e.preventDefault();
    if (isEquipped && equippedSlotKey) {
      unequipItem(equippedSlotKey);
      AudioSystem.sfx.buttonClick();
    } else if (isPotion) {
      const healAmt = Math.min(item.heal, player.maxHp - player.hp);
      player.hp = Math.min(player.hp + item.heal, player.maxHp);
      inventory.splice(invIdx, 1);
      addParticles(player.x, player.y, '#e74c3c', 10);
      if (healAmt > 0) addDamageNumber(player.x, player.y, healAmt, 'heal');
      AudioSystem.sfx.heal();
      updateHUD();
    } else {
      equipItem(itemId);
      AudioSystem.sfx.buttonClick();
    }
    popup.style.display = 'none';
    renderInventory();
    autoSave();
  };

  // Close button and backdrop
  document.getElementById('popup-close-btn').onclick = (e) => {
    e.preventDefault();
    popup.style.display = 'none';
  };
  popup.onclick = (e) => {
    if (e.target === popup) popup.style.display = 'none';
  };
}

function equipItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  let slot = null;
  if (item.type === 'weapon') slot = 'weapon';
  else if (item.type === 'armor') slot = 'armor';
  else if (item.type === 'helmet') slot = 'helmet';
  else if (item.type === 'boots') slot = 'boots';
  else if (item.type === 'shield') slot = 'shield';
  else if (item.type === 'event') slot = 'event';
  else if (item.type === 'accessory') {
    if (!equipped.accessory1) slot = 'accessory1';
    else if (!equipped.accessory2) slot = 'accessory2';
    else slot = 'accessory1';
  }
  if (slot) equipped[slot] = itemId;
}

function unequipItem(slot) {
  equipped[slot] = null;
}

// ─── Shop UI ─────────────────────────────────────────────────────────────────
const shopPanel = document.getElementById('shop-panel');
const shopItemsList = document.getElementById('shop-items-list');
const shopSellList = document.getElementById('shop-sell-list');
let shopTab = 'buy';

document.getElementById('shop-close').addEventListener('touchstart', (e) => { e.preventDefault(); closeShop(); }, { passive: false });
document.getElementById('shop-close').addEventListener('click', closeShop);

// Shop tabs
document.getElementById('shop-tab-buy').addEventListener('touchstart', (e) => { e.preventDefault(); switchShopTab('buy'); }, { passive: false });
document.getElementById('shop-tab-buy').addEventListener('click', () => switchShopTab('buy'));
document.getElementById('shop-tab-sell').addEventListener('touchstart', (e) => { e.preventDefault(); switchShopTab('sell'); }, { passive: false });
document.getElementById('shop-tab-sell').addEventListener('click', () => switchShopTab('sell'));

function switchShopTab(tab) {
  shopTab = tab;
  document.getElementById('shop-tab-buy').classList.toggle('active', tab === 'buy');
  document.getElementById('shop-tab-sell').classList.toggle('active', tab === 'sell');
  document.getElementById('shop-buy-section').style.display = tab === 'buy' ? 'block' : 'none';
  document.getElementById('shop-sell-section').style.display = tab === 'sell' ? 'block' : 'none';
  if (tab === 'sell') renderShopSell();
  else renderShop();
}

let currentShopNpc = null;

function openShop(npc) {
  if (invOpen) return;
  currentShopNpc = npc;
  shopOpen = true;
  shopTab = 'buy';
  showPanel(shopPanel);
  shopPanel.querySelector('.inv-header h2').textContent = '🏪 ' + npc.name;
  document.getElementById('shop-tab-buy').classList.add('active');
  document.getElementById('shop-tab-sell').classList.remove('active');
  document.getElementById('shop-buy-section').style.display = 'block';
  document.getElementById('shop-sell-section').style.display = 'none';
  renderShop();
}

function closeShop() {
  shopOpen = false;
  currentShopNpc = null;
  hidePanel(shopPanel);
}

function buildStatText(item) {
  let statText = '';
  if (item.type === 'potion') {
    statText = '회복: ' + item.heal + ' HP';
  } else if (item.atk > 0 && item.def > 0) {
    statText = '공격 +' + item.atk + ' / 방어 +' + item.def;
  } else if (item.type === 'weapon') {
    statText = '공격력 +' + item.atk;
  } else if (item.def > 0) {
    statText = '방어력 +' + item.def;
  }
  if (item.speedBonus) statText += (statText ? ' / ' : '') + '속도 +' + item.speedBonus;
  if (item.critBonus) statText += (statText ? ' / ' : '') + '크리 +' + item.critBonus + '%';
  if (item.goldBonus) statText += (statText ? ' / ' : '') + '골드 +' + item.goldBonus + '%';
  return statText;
}

function renderShop() {
  document.getElementById('shop-gold').textContent = player.gold;
  shopItemsList.innerHTML = '';
  if (!currentShopNpc) return;

  currentShopNpc.shopItems.forEach(itemId => {
    const item = ITEMS[itemId];
    if (!item) return;
    const owned = inventory.filter(i => i === itemId).length;
    const canAfford = player.gold >= item.price;
    const div = document.createElement('div');
    div.className = 'shop-item';
    const statText = buildStatText(item);
    div.innerHTML = `
      <div class="icon">${item.icon}</div>
      <div class="name">${item.name}</div>
      <div class="stat">${statText}</div>
      <div class="price">💰 ${item.price} 골드</div>
      <button class="btn" ${canAfford ? '' : 'disabled'}>${canAfford ? '구매' : '골드 부족'}</button>
      ${owned > 0 ? '<div class="owned">보유: ' + owned + '개</div>' : ''}
    `;
    if (canAfford) {
      div.querySelector('.btn').addEventListener('click', (e) => {
        e.stopPropagation();
        buyItem(itemId);
      });
    }
    shopItemsList.appendChild(div);
  });
}

function renderShopSell() {
  document.getElementById('shop-gold').textContent = player.gold;
  shopSellList.innerHTML = '';

  if (inventory.length === 0) {
    shopSellList.innerHTML = '<div style="color:#888;padding:20px;text-align:center;grid-column:1/-1;">판매할 아이템이 없습니다</div>';
    return;
  }

  inventory.forEach((itemId, idx) => {
    const item = ITEMS[itemId];
    if (!item) return;
    const allSlots = EQUIP_SLOTS;
    const isEquipped = allSlots.some(s => equipped[s] === itemId);
    const sellPrice = Math.max(1, Math.floor(item.price * 0.5));

    const div = document.createElement('div');
    div.className = 'shop-item';
    const statText = buildStatText(item);

    const btnLabel = isEquipped ? '장착중' : '판매';
    div.innerHTML = `
      <div class="icon">${item.icon}</div>
      <div class="name">${item.name}</div>
      <div class="stat">${statText}</div>
      <div class="price">💰 ${sellPrice} 골드</div>
      <button class="btn" ${isEquipped ? 'disabled' : ''} style="${!isEquipped ? 'background:linear-gradient(180deg,#e74c3c,#c0392b);' : ''}">${btnLabel}</button>
    `;
    if (!isEquipped) {
      div.querySelector('.btn').addEventListener('click', (e) => {
        e.stopPropagation();
        sellItem(idx);
      });
    }
    shopSellList.appendChild(div);
  });
}

function buyItem(itemId) {
  const item = ITEMS[itemId];
  if (!item || player.gold < item.price) return;
  player.gold -= item.price;
  inventory.push(itemId);
  AudioSystem.sfx.buy();
  updateHUD();
  renderShop();
  addParticles(player.x, player.y, '#f1c40f', 8);
  autoSave();
}

function sellItem(idx) {
  if (idx < 0 || idx >= inventory.length) return;
  const itemId = inventory[idx];
  const item = ITEMS[itemId];
  if (!item) return;
  const allSlots = EQUIP_SLOTS;
  const isEquipped = allSlots.some(s => equipped[s] === itemId);
  if (isEquipped) return;
  const sellPrice = Math.max(1, Math.floor(item.price * 0.5));
  player.gold += sellPrice;
  totalGoldEarned += sellPrice;
  inventory.splice(idx, 1);
  AudioSystem.sfx.sell();
  updateHUD();
  renderShopSell();
  addParticles(player.x, player.y, '#f1c40f', 6);
  showToast(item.name + ' 판매! +' + sellPrice + '골드');
  autoSave();
}

