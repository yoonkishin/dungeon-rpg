'use strict';

function getCompanionFollowPoint(cId, idx, profile, cs) {
  const mode = getCompanionAIMode(cId, cs);
  const offsetAngle = idx === 0 ? -Math.PI / 3 : Math.PI / 3;
  const dirAngle = player.dir === 0 ? 0 : player.dir === 1 ? Math.PI : player.dir === 2 ? -Math.PI / 2 : Math.PI / 2;
  const ranged = profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster';
  let baseDist = profile.roleKey === 'support' ? 46 : (ranged ? 54 : 34);

  if (mode === 'aggressive') baseDist += ranged ? -6 : -8;
  else if (mode === 'defensive') baseDist += ranged || profile.roleKey === 'support' ? 10 : 6;
  else if (mode === 'support') baseDist += ranged || profile.roleKey === 'support' ? 18 : 10;

  return {
    x: player.x - baseDist * Math.cos(dirAngle + offsetAngle),
    y: player.y - baseDist * Math.sin(dirAngle + offsetAngle)
  };
}

function getCompanionModeBehavior(cId, cs, profile) {
  const mode = getCompanionAIMode(cId, cs);
  const ranged = profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster';
  const supportRole = profile.roleKey === 'support';

  const behavior = {
    mode,
    engageRadius: 170,
    leashRadius: 80,
    guardRadius: 92,
    preferredRange: getCompanionPreferredRange(cId),
    attackRange: getCompanionAttackRange(cId),
    chaseSpeed: 1.05,
    fallbackSpeed: 0.92,
    retreatSpeed: 0.88,
    skillTickMult: 1,
    attackCooldown: getCompanionAttackCooldown(cId, cs),
    supportHealThreshold: 0.80,
    protectThreshold: 0.55,
    prioritizePlayerThreat: false,
    finishOffBonus: 0,
    keepTighterFormation: false,
  };

  if (mode === 'aggressive') {
    behavior.engageRadius = supportRole ? 145 : (ranged ? 235 : 225);
    behavior.leashRadius = 120;
    behavior.guardRadius = 76;
    behavior.preferredRange += ranged ? -6 : -4;
    behavior.chaseSpeed = 1.18;
    behavior.fallbackSpeed = 0.84;
    behavior.retreatSpeed = 0.76;
    behavior.skillTickMult = supportRole ? 1.05 : 1.20;
    behavior.supportHealThreshold = 0.76;
    behavior.protectThreshold = 0.52;
    behavior.finishOffBonus = 22;
  } else if (mode === 'defensive') {
    behavior.engageRadius = 160;
    behavior.leashRadius = 58;
    behavior.guardRadius = 115;
    behavior.preferredRange += ranged || supportRole ? 12 : 6;
    behavior.chaseSpeed = 0.96;
    behavior.fallbackSpeed = 1.04;
    behavior.retreatSpeed = 1.00;
    behavior.skillTickMult = 0.96;
    behavior.supportHealThreshold = 0.85;
    behavior.protectThreshold = 0.68;
    behavior.prioritizePlayerThreat = true;
    behavior.keepTighterFormation = true;
  } else if (mode === 'support') {
    behavior.engageRadius = supportRole ? 145 : 130;
    behavior.leashRadius = 52;
    behavior.guardRadius = 130;
    behavior.preferredRange += ranged || supportRole ? 20 : 10;
    behavior.chaseSpeed = 0.90;
    behavior.fallbackSpeed = 1.08;
    behavior.retreatSpeed = 1.10;
    behavior.skillTickMult = supportRole ? 1.28 : 1.02;
    behavior.supportHealThreshold = 0.90;
    behavior.protectThreshold = 0.72;
    behavior.prioritizePlayerThreat = true;
    behavior.keepTighterFormation = true;
  }

  return behavior;
}

function getCompanionPriorityEnemy(cId, cs, behavior) {
  const profile = getCompanionProfile(cId);
  let best = null;
  let bestScore = -Infinity;

  enemies.forEach(e => {
    if (e.dead) return;
    const d = Math.sqrt((cs.x - e.x) ** 2 + (cs.y - e.y) ** 2);
    if (d > behavior.engageRadius) return;

    const dPlayer = Math.sqrt((player.x - e.x) ** 2 + (player.y - e.y) ** 2);
    let score = 200 - d;

    if (profile.roleKey === 'assassin') score += (e.maxHp - e.hp) * 0.8;
    if (profile.roleKey === 'tank' || profile.roleKey === 'bruiser' || profile.roleKey === 'guardian' || profile.roleKey === 'paladin') score += d < 70 ? 40 : 0;
    if (profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster') score += d > 60 ? 15 : 0;
    if (e.isBoss) score += behavior.mode === 'defensive' || behavior.mode === 'support' ? 40 : 25;

    if (behavior.prioritizePlayerThreat && dPlayer < behavior.guardRadius) score += 80 - dPlayer * 0.3;
    if (behavior.mode === 'aggressive') {
      score += (e.maxHp - e.hp) * 0.35;
      if (e.hp / e.maxHp < 0.35) score += behavior.finishOffBonus;
    } else if (behavior.mode !== 'aggressive' && dPlayer > behavior.guardRadius + 40) {
      score -= 55;
    }

    if (profile.roleKey === 'support') {
      score += dPlayer < behavior.guardRadius ? 28 : -30;
    }

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

function useCompanionSkill(cId, cs, target, behavior) {
  const profile = getCompanionProfile(cId);
  const modeBehavior = behavior || getCompanionModeBehavior(cId, cs, profile);
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
    if (!lowest || (lowest.hp / lowest.maxHp) > modeBehavior.supportHealThreshold) return false;
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
    if (player.hp / player.maxHp > modeBehavior.protectThreshold) return false;
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
    const behavior = getCompanionModeBehavior(cId, cs, profile);
    const followPoint = getCompanionFollowPoint(cId, idx, profile, cs);

    if (cs.flashTimer > 0) cs.flashTimer -= 1;
    if (cs.attackTimer > 0) cs.attackTimer -= dt;
    if (cs.skillTimer > 0) cs.skillTimer = Math.max(0, cs.skillTimer - dt * behavior.skillTickMult);

    const target = getCompanionPriorityEnemy(cId, cs, behavior);
    const preferredRange = behavior.preferredRange;
    const attackRange = behavior.attackRange;

    if (target) {
      const d = Math.sqrt((cs.x - target.x) ** 2 + (cs.y - target.y) ** 2);
      const targetPlayerDist = Math.sqrt((player.x - target.x) ** 2 + (player.y - target.y) ** 2);
      const lowHp = cs.hp / cs.maxHp < (behavior.mode === 'aggressive' ? 0.25 : 0.40);
      const rangedRole = profile.roleKey === 'ranger' || profile.roleKey === 'mage' || profile.roleKey === 'caster';
      const shouldHoldLine = behavior.keepTighterFormation && dist(cs, followPoint) > behavior.leashRadius && targetPlayerDist > behavior.guardRadius && !target.isBoss;

      if (profile.roleKey === 'support') {
        moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
        if (d < preferredRange - 10) {
          moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), behavior.retreatSpeed);
        }
      } else if (shouldHoldLine) {
        moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
      } else if (lowHp && d < attackRange + 10) {
        moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), behavior.retreatSpeed);
      } else if (d > preferredRange + 10) {
        moveCompanionToward(cs, target.x, target.y, behavior.chaseSpeed);
      } else if (d < preferredRange - 10 && rangedRole) {
        moveCompanionToward(cs, cs.x - (target.x - cs.x), cs.y - (target.y - cs.y), behavior.retreatSpeed);
      } else if (dist(cs, followPoint) > behavior.leashRadius && !target.isBoss) {
        moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
      }

      if (useCompanionSkill(cId, cs, target, behavior)) return;

      if (cs.attackTimer <= 0 && d <= attackRange) {
        cs.attackTimer = behavior.attackCooldown;
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
      moveCompanionToward(cs, followPoint.x, followPoint.y, behavior.fallbackSpeed);
      useCompanionSkill(cId, cs, null, behavior);
    }
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────
