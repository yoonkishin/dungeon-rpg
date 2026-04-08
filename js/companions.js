'use strict';

function getCompanionFollowPoint(idx, profile) {
  const offsetAngle = idx === 0 ? -Math.PI / 3 : Math.PI / 3;
  const dirAngle = player.dir === 0 ? 0 : player.dir === 1 ? Math.PI : player.dir === 2 ? -Math.PI / 2 : Math.PI / 2;
  const baseDist = profile.roleKey === 'support' ? 46 : (profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster' ? 54 : 34);
  return {
    x: player.x - baseDist * Math.cos(dirAngle + offsetAngle),
    y: player.y - baseDist * Math.sin(dirAngle + offsetAngle)
  };
}

function getCompanionPriorityEnemy(cId, cs) {
  const profile = getCompanionProfile(cId);
  let best = null;
  let bestScore = -Infinity;

  enemies.forEach(e => {
    if (e.dead) return;
    const d = Math.sqrt((cs.x - e.x) ** 2 + (cs.y - e.y) ** 2);
    if (d > 170) return;

    let score = 200 - d;
    if (profile.roleKey === 'assassin') score += (e.maxHp - e.hp) * 0.8;
    if (profile.roleKey === 'tank' || profile.roleKey === 'bruiser' || profile.roleKey === 'guardian' || profile.roleKey === 'paladin') score += d < 70 ? 40 : 0;
    if (profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster') score += d > 60 ? 15 : 0;
    if (e.isBoss) score += 25;

    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  });

  return best;
}

function moveCompanionToward(cs, tx, ty, speedMul = 1) {
  const dx = tx - cs.x;
  const dy = ty - cs.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d <= 2) return;
  const speed = Math.min(d * 0.08, 3.2) * speedMul;
  const pos = resolveCollision({ x: cs.x, y: cs.y, w: 20, h: 20 }, cs.x + (dx / d) * speed, cs.y + (dy / d) * speed);
  cs.x = pos.x;
  cs.y = pos.y;
}

function useCompanionSkill(cId, cs, target) {
  const profile = getCompanionProfile(cId);
  if (cs.skillTimer > 0) return false;

  const skillReady = () => { cs.skillTimer = profile.skillCooldown; };
  const splashHit = (cx, cy, radius, dmg, color, stun = 0) => {
    let hit = false;
    enemies.forEach(e => {
      if (e.dead) return;
      const d = Math.sqrt((e.x - cx) ** 2 + (e.y - cy) ** 2);
      if (d <= radius) {
        e.hp -= dmg;
        e.flashTimer = 10;
        if (stun) e.hitStun = Math.max(e.hitStun || 0, stun);
        addDamageNumber(e.x, e.y, dmg, 'magic');
        addParticles(e.x, e.y, color, 6);
        if (e.hp <= 0) killEnemy(e);
        hit = true;
      }
    });
    return hit;
  };

  if (profile.skillId === 'holy_prayer') {
    const allies = [{ kind: 'player', hp: player.hp, maxHp: player.maxHp }];
    activeCompanions.forEach(id => {
      const state = companionStates[id];
      if (state) allies.push({ kind: id, hp: state.hp, maxHp: state.maxHp });
    });
    const lowest = allies.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    if (!lowest || (lowest.hp / lowest.maxHp) > 0.8) return false;
    const healAmt = Math.floor((22 + cId * 3) * getHealingMultiplier());
    player.hp = Math.min(player.maxHp, player.hp + Math.floor(healAmt * 0.8));
    addDamageNumber(player.x, player.y, Math.floor(healAmt * 0.8), 'heal');
    addParticles(player.x, player.y, DUNGEON_INFO[cId].companionColor, 10);
    if (lowest.kind !== 'player') {
      const ally = companionStates[lowest.kind];
      if (ally) {
        ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
        addDamageNumber(ally.x, ally.y, healAmt, 'heal');
        addParticles(ally.x, ally.y, DUNGEON_INFO[cId].companionColor, 8);
      }
    }
    showToast(profile.skillName + '!');
    updateHUD();
    skillReady();
    return true;
  }

  if (!target) return false;

  if (profile.skillId === 'slime_guard') {
    if (Math.sqrt((target.x - cs.x) ** 2 + (target.y - cs.y) ** 2) > 72) return false;
    if (splashHit(cs.x, cs.y, 62, Math.floor(getCompanionAtk(cId) * 0.9), DUNGEON_INFO[cId].companionColor, 280)) {
      triggerShake(8);
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'arrow_barrage') {
    const targets = enemies.filter(e => !e.dead).sort((a, b) => dist(cs, a) - dist(cs, b)).slice(0, 2);
    if (targets.length === 0) return false;
    targets.forEach(e => {
      if (dist(cs, e) > 150) return;
      const dmg = Math.floor(getCompanionAtk(cId) * 1.15);
      e.hp -= dmg;
      e.flashTimer = 10;
      addDamageNumber(e.x, e.y, dmg, 'normal');
      addParticles(e.x, e.y, DUNGEON_INFO[cId].companionColor, 5);
      if (e.hp <= 0) killEnemy(e);
    });
    showToast(profile.skillName + '!');
    skillReady();
    return true;
  }

  if (profile.skillId === 'bone_nova') {
    if (splashHit(target.x, target.y, 58, Math.floor(getCompanionAtk(cId) * 1.1), DUNGEON_INFO[cId].companionColor, 120)) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'war_cleave') {
    if (Math.sqrt((target.x - cs.x) ** 2 + (target.y - cs.y) ** 2) > 76) return false;
    if (splashHit(target.x, target.y, 48, Math.floor(getCompanionAtk(cId) * 1.2), DUNGEON_INFO[cId].companionColor)) {
      triggerShake(7);
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'shadow_strike') {
    if (Math.sqrt((target.x - cs.x) ** 2 + (target.y - cs.y) ** 2) > 160) return false;
    const angle = Math.atan2(player.y - target.y, player.x - target.x);
    cs.x = target.x + Math.cos(angle) * 18;
    cs.y = target.y + Math.sin(angle) * 18;
    const dmg = Math.floor(getCompanionAtk(cId) * 1.55);
    target.hp -= dmg;
    target.flashTimer = 12;
    target.hitStun = Math.max(target.hitStun || 0, 180);
    addDamageNumber(target.x, target.y, dmg, 'critical');
    addParticles(target.x, target.y, DUNGEON_INFO[cId].companionColor, 10);
    if (target.hp <= 0) killEnemy(target);
    showToast(profile.skillName + '!');
    skillReady();
    return true;
  }

  if (profile.skillId === 'flame_burst') {
    if (splashHit(target.x, target.y, 44, Math.floor(getCompanionAtk(cId) * 1.25), DUNGEON_INFO[cId].companionColor)) {
      showToast(profile.skillName + '!');
      skillReady();
      return true;
    }
  }

  if (profile.skillId === 'frost_lock') {
    if (Math.sqrt((target.x - cs.x) ** 2 + (target.y - cs.y) ** 2) > 110) return false;
    const dmg = Math.floor(getCompanionAtk(cId) * 1.05);
    target.hp -= dmg;
    target.flashTimer = 12;
    target.hitStun = Math.max(target.hitStun || 0, 360);
    addDamageNumber(target.x, target.y, dmg, 'magic');
    addParticles(target.x, target.y, DUNGEON_INFO[cId].companionColor, 9);
    if (target.hp <= 0) killEnemy(target);
    showToast(profile.skillName + '!');
    skillReady();
    return true;
  }

  if (profile.skillId === 'dark_aegis') {
    if (player.hp / player.maxHp > 0.55) return false;
    const healAmt = Math.floor((12 + cId * 2) * getHealingMultiplier());
    player.hp = Math.min(player.maxHp, player.hp + healAmt);
    player.invincible = Math.max(player.invincible, 500);
    addDamageNumber(player.x, player.y, healAmt, 'heal');
    addParticles(player.x, player.y, DUNGEON_INFO[cId].companionColor, 10);
    if (target && Math.sqrt((target.x - cs.x) ** 2 + (target.y - cs.y) ** 2) < 70) {
      const dmg = Math.floor(getCompanionAtk(cId) * 1.15);
      target.hp -= dmg;
      target.flashTimer = 10;
      addDamageNumber(target.x, target.y, dmg, 'normal');
      if (target.hp <= 0) killEnemy(target);
    }
    showToast(profile.skillName + '!');
    updateHUD();
    skillReady();
    return true;
  }

  return false;
}

// ─── Companion Update ────────────────────────────────────────────────────────
function updateCompanion(dt) {
  if (activeCompanions.length === 0 || currentMap !== 'dungeon') return;

  activeCompanions.forEach((cId, idx) => {
    const cs = companionStates[cId];
    if (!cs) return;
    const profile = getCompanionProfile(cId);

    if (cs.flashTimer > 0) cs.flashTimer -= 1;
    if (cs.attackTimer > 0) cs.attackTimer -= dt;
    if (cs.skillTimer > 0) cs.skillTimer -= dt;

    const target = getCompanionPriorityEnemy(cId, cs);
    const followPoint = getCompanionFollowPoint(idx, profile);
    const preferredRange = getCompanionPreferredRange(cId);
    const attackRange = getCompanionAttackRange(cId);

    if (target) {
      const d = Math.sqrt((cs.x - target.x) ** 2 + (cs.y - target.y) ** 2);
      if (profile.roleKey === 'support') {
        moveCompanionToward(cs, followPoint.x, followPoint.y, 0.95);
      } else if (d > preferredRange + 10) {
        moveCompanionToward(cs, target.x, target.y, 1.05);
      } else if (d < preferredRange - 10 && (profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster')) {
        moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), 0.85);
      } else if (dist(cs, followPoint) > 80 && !target.isBoss) {
        moveCompanionToward(cs, followPoint.x, followPoint.y, 0.9);
      }

      if (useCompanionSkill(cId, cs, target)) return;

      if (cs.attackTimer <= 0 && d <= attackRange) {
        cs.attackTimer = getCompanionAttackCooldown(cId);
        const dmg = getCompanionAtk(cId);
        target.hp -= dmg;
        target.flashTimer = 8;
        if (profile.roleKey === 'tank' || profile.roleKey === 'guardian') {
          target.hitStun = Math.max(target.hitStun || 0, 120);
        }
        addDamageNumber(target.x, target.y, dmg, profile.roleKey === 'caster' || profile.roleKey === 'mage' ? 'magic' : 'normal');
        addParticles(target.x, target.y, DUNGEON_INFO[cId].companionColor, 5);
        if (target.hp <= 0) killEnemy(target);
      }
    } else {
      moveCompanionToward(cs, followPoint.x, followPoint.y, 0.95);
      useCompanionSkill(cId, cs, null);
    }
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────
