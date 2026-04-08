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
      el.className = 'skill-slot';
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

function useSkill(skillId) {
  const skill = getSkillById(skillId);
  if (!skill) return;
  if (player.mp < skill.mpCost) { showToast('MP 부족!'); return; }
  if ((skillCooldowns[skillId] || 0) > 0) return;

  player.mp -= skill.mpCost;
  skillCooldowns[skillId] = skill.cooldown;
  skillSlotsDirty = true;
  AudioSystem.sfx.skillUse();

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
