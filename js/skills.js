'use strict';

// ─── Tier Banner ─────────────────────────────────────────────────────────
let tierBannerTimeout = null;
function showTierBanner(tierInfo) {
  AudioSystem.sfx.tierUp();
  const el = document.getElementById('tier-banner');
  el.textContent = '승급! ' + tierInfo.name;
  el.style.color = tierInfo.color;
  el.style.opacity = '1';
  if (tierBannerTimeout) clearTimeout(tierBannerTimeout);
  tierBannerTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// ─── Skill Slot UI ────────────────────────────────────────────────────────────
function renderSkillSlots() {
  skillSlotsDirty = false;
  const page = skillPages[currentSkillPage];
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById('skill-slot-' + i);
    const skillId = page[i];
    const skill = skillId ? getSkillById(skillId) : null;

    if (!skill) {
      el.className = 'skill-slot empty-slot';
      el.innerHTML = '+';
    } else {
      const cd = skillCooldowns[skillId] || 0;
      const cdPct = cd > 0 ? (cd / skill.cooldown * 100) : 0;
      const cdSec = cd > 0 ? (cd / 1000).toFixed(1) : '';
      el.className = cd > 0 ? 'skill-slot' : 'skill-slot ready';
      el.innerHTML =
        '<span style="position:relative;z-index:1;font-size:22px;">' + skill.icon + '</span>' +
        '<div class="skill-cd-overlay" style="height:' + cdPct + '%;"></div>' +
        (cd > 0 ? '<div class="skill-cd-text">' + cdSec + '</div>' : '') +
        '<div class="skill-mp-cost">' + skill.mpCost + '</div>';
    }
  }
  document.getElementById('skill-swap-btn').textContent = (currentSkillPage + 1) + '/3';
}

// Skill slot touch handlers
for (let i = 0; i < 4; i++) {
  const el = document.getElementById('skill-slot-' + i);
  function handleSkill(e) {
    e.preventDefault();
    e.stopPropagation();
    const page = skillPages[currentSkillPage];
    const skillId = page[i];
    if (!skillId) return;
    useSkill(skillId);
  }
  el.addEventListener('touchstart', handleSkill, { passive: false });
  el.addEventListener('click', handleSkill);
}

// Swap button
const swapBtn = document.getElementById('skill-swap-btn');
swapBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  currentSkillPage = (currentSkillPage + 1) % skillPages.length;
  renderSkillSlots();
}, { passive: false });
swapBtn.addEventListener('click', (e) => {
  e.preventDefault();
  currentSkillPage = (currentSkillPage + 1) % skillPages.length;
  renderSkillSlots();
});

function spawnSkillEffect(fx) {
  skillEffects.push(Object.assign({ timer: fx.maxTimer || 400, maxTimer: fx.maxTimer || 400 }, fx));
}

function getPlayerFacingVec() {
  const v = [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
  return v[player.dir] || v[0];
}

function playSkillVisual(skill) {
  const fwd = getPlayerFacingVec();
  const angle = Math.atan2(fwd.y, fwd.x);
  const px = player.x, py = player.y;
  const range = skill.range || 0;

  if (skill.id === 'fireball') {
    const tx = px + fwd.x * range;
    const ty = py + fwd.y * range;
    spawnSkillEffect({ kind: 'projectile', x: px, y: py, tx, ty, color: '#ff6b35', glow: '#ffd166', size: 14, maxTimer: 380 });
    spawnSkillEffect({ kind: 'ring', x: tx, y: ty, radius: 36, color: '#e74c3c', glow: '#ffb347', maxTimer: 360 });
    triggerShake(4);
  } else if (skill.id === 'heal') {
    spawnSkillEffect({ kind: 'aura', x: px, y: py, radius: 46, color: '#2ecc71', glow: '#7bed9f', maxTimer: 520, follow: 'player' });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      addParticles(px + Math.cos(a) * 22, py + Math.sin(a) * 22, '#2ecc71', 3);
    }
  } else if (skill.id === 'slash') {
    spawnSkillEffect({ kind: 'arc', x: px, y: py, angle, radius: range, color: '#f1c40f', maxTimer: 260, follow: 'player' });
    triggerShake(6);
  } else if (skill.id === 'shield') {
    spawnSkillEffect({ kind: 'barrier', x: px, y: py, radius: 32, color: '#3498db', glow: '#74b9ff', maxTimer: skill.duration || 5000, follow: 'player' });
  } else if (skill.id === 'poison') {
    spawnSkillEffect({ kind: 'cloud', x: px, y: py, radius: range, color: '#8e44ad', glow: '#9b59b6', maxTimer: 900, follow: 'player' });
  } else if (skill.id === 'sprint') {
    spawnSkillEffect({ kind: 'aura', x: px, y: py, radius: 30, color: '#48dbfb', glow: '#00d2d3', maxTimer: skill.duration || 3000, follow: 'player' });
  } else if (skill.id === 'thunder') {
    let tx = px + fwd.x * range, ty = py + fwd.y * range;
    let best = null, bd = range;
    enemies.forEach(e => { if (e.dead) return; const d = dist(player, e); if (d <= range && d < bd) { bd = d; best = e; } });
    if (best) { tx = best.x; ty = best.y; }
    spawnSkillEffect({ kind: 'bolt', x: tx, y: ty, color: '#f1c40f', glow: '#fff1b6', maxTimer: 340 });
    spawnSkillEffect({ kind: 'ring', x: tx, y: ty, radius: 40, color: '#f1c40f', glow: '#fff1b6', maxTimer: 300 });
    triggerShake(9);
  } else if (skill.id === 'drain') {
    let best = null, bd = range;
    enemies.forEach(e => { if (e.dead) return; const d = dist(player, e); if (d <= range && d < bd) { bd = d; best = e; } });
    if (best) spawnSkillEffect({ kind: 'beam', x: px, y: py, tx: best.x, ty: best.y, color: '#e74c3c', glow: '#ff7675', maxTimer: 360 });
  } else if (skill.id === 'whirlwind') {
    spawnSkillEffect({ kind: 'whirl', x: px, y: py, radius: range, color: '#00cec9', glow: '#81ecec', maxTimer: 520, follow: 'player' });
    triggerShake(10);
  } else if (skill.id === 'meteor') {
    let tx = px + fwd.x * range, ty = py + fwd.y * range;
    let best = null, bd = range;
    enemies.forEach(e => { if (e.dead) return; const d = dist(player, e); if (d <= range && d < bd) { bd = d; best = e; } });
    if (best) { tx = best.x; ty = best.y; }
    spawnSkillEffect({ kind: 'meteor', x: tx, y: ty, color: '#e67e22', glow: '#f1c40f', maxTimer: 620 });
    triggerShake(14);
  } else if (skill.id === 'iron_fortress') {
    spawnSkillEffect({ kind: 'hex', x: px, y: py, radius: 38, color: '#95a5a6', glow: '#dfe6e9', maxTimer: skill.duration || 6000, follow: 'player' });
  } else if (skill.id === 'life_drain') {
    let best = null, bd = range;
    enemies.forEach(e => { if (e.dead) return; const d = dist(player, e); if (d <= range && d < bd) { bd = d; best = e; } });
    if (best) spawnSkillEffect({ kind: 'beam', x: px, y: py, tx: best.x, ty: best.y, color: '#8e44ad', glow: '#d6a2e8', maxTimer: 420 });
    spawnSkillEffect({ kind: 'aura', x: px, y: py, radius: 34, color: '#8e44ad', glow: '#d6a2e8', maxTimer: 420, follow: 'player' });
  }
}

function updateSkillEffects(dt) {
  for (let i = skillEffects.length - 1; i >= 0; i--) {
    const fx = skillEffects[i];
    fx.timer -= dt;
    if (fx.follow === 'player') { fx.x = player.x; fx.y = player.y; }
    if (fx.kind === 'projectile') {
      const t = 1 - Math.max(0, fx.timer) / fx.maxTimer;
      fx.cx = fx.x + (fx.tx - fx.x) * t;
      fx.cy = fx.y + (fx.ty - fx.y) * t;
    }
    if (fx.timer <= 0) skillEffects.splice(i, 1);
  }
}

function useSkill(skillId) {
  const skill = getSkillById(skillId);
  if (!skill) return;
  if (player.mp < skill.mpCost) { showToast('MP 부족!'); return; }
  if ((skillCooldowns[skillId] || 0) > 0) return;

  player.mp -= skill.mpCost;
  skillCooldowns[skillId] = skill.cooldown;
  skillSlotsDirty = true;
  AudioSystem.sfx.skillUse();
  playSkillVisual(skill);

  if (skill.type === 'self') {
    if (skill.heal) {
      const healAmt = skill.heal;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      addParticles(player.x, player.y, '#2ecc71', 12);
      addDamageNumber(player.x, player.y, healAmt, 'heal');
    }
  } else if (skill.type === 'buff') {
    skillBuffs[skillId] = {
      defBuff: skill.defBuff || 0,
      speedBuff: skill.speedBuff || 0,
      timer: skill.duration || 3000,
    };
    addParticles(player.x, player.y, '#f1c40f', 10);
  } else if (skill.type === 'melee') {
    enemies.forEach(e => {
      if (e.dead) return;
      const d = dist(player, e);
      if (d > skill.range) return;
      const dmg = Math.max(1, (skill.damage || 0) + playerAtk() * 0.3);
      e.hp -= dmg;
      e.flashTimer = 12;
      addParticles(e.x, e.y, '#e74c3c', 8);
      addDamageNumber(e.x, e.y, dmg, 'magic');
      triggerShake(8);
      if (skill.heal) {
        player.hp = Math.min(player.maxHp, player.hp + skill.heal);
        addParticles(player.x, player.y, '#2ecc71', 6);
        addDamageNumber(player.x, player.y, skill.heal, 'heal');
      }
      if (e.hp <= 0) {
        killEnemy(e);
      }
    });
  } else if (skill.type === 'projectile' || skill.type === 'aoe') {
    enemies.forEach(e => {
      if (e.dead) return;
      const d = dist(player, e);
      if (d > skill.range) return;
      let dmg;
      if (skill.ticks) {
        dmg = (skill.damage || 0) * skill.ticks;
      } else {
        dmg = Math.max(1, (skill.damage || 0) + playerAtk() * 0.2);
      }
      e.hp -= dmg;
      e.flashTimer = 12;
      const pColor = skill.type === 'aoe' ? '#9b59b6' : '#e67e22';
      addParticles(e.x, e.y, pColor, 10);
      addDamageNumber(e.x, e.y, dmg, 'magic');
      triggerShake(6);
      if (e.hp <= 0) {
        killEnemy(e);
      }
    });
  }

  if (hudDirty) updateHUD();
  if (skillSlotsDirty) renderSkillSlots();
}

// Keyboard fallback
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ─── Helpers ──────────────────────────────────────────────────────────────────
