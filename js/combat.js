'use strict';


// Player basic-attack projectiles - runtime only, not persisted.
const PLAYER_PROJECTILE_MAX = 40;
if (typeof playerProjectiles === 'undefined') var playerProjectiles = [];

function spawnPlayerProjectile(spec, originX, originY, dirAngle, damageBase, isCritRoll, ownerCharacterId = null) {
  if (playerProjectiles.length >= PLAYER_PROJECTILE_MAX) {
    playerProjectiles.shift();
  }
  playerProjectiles.push({
    x: originX,
    y: originY,
    vx: Math.cos(dirAngle) * spec.speed,
    vy: Math.sin(dirAngle) * spec.speed,
    traveled: 0,
    range: spec.range,
    size: spec.size,
    color: spec.color,
    glow: spec.glow,
    shape: spec.shape || 'orb',
    damageType: spec.damageType || 'normal',
    damageBase,
    critLocked: !!isCritRoll,
    pierce: spec.pierce || 0,
    pierced: 0,
    hitRadius: spec.hitRadius || 14,
    hitSet: new Set(),
    trailTimer: 0,
    ownerCharacterId,
  });
}

function updatePlayerProjectiles(dt) {
  if (!playerProjectiles.length) return;
  const step = dt / 16;
  for (let i = playerProjectiles.length - 1; i >= 0; i--) {
    const p = playerProjectiles[i];
    const mvx = p.vx * step;
    const mvy = p.vy * step;
    p.x += mvx;
    p.y += mvy;
    p.traveled += Math.hypot(mvx, mvy);
    p.trailTimer -= dt;
    if (p.trailTimer <= 0 && typeof addParticles === 'function') {
      addParticles(p.x, p.y, p.glow || p.color, 1);
      p.trailTimer = 40;
    }

    let consumed = false;
    for (const e of enemies) {
      if (e.dead) continue;
      if (p.hitSet.has(e)) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const hitRadius = p.hitRadius + 10;
      if (dx * dx + dy * dy <= hitRadius * hitRadius) {
        applyPlayerProjectileHit(p, e);
        p.hitSet.add(e);
        if (p.pierced >= p.pierce) {
          consumed = true;
          break;
        }
        p.pierced++;
      }
    }
    if (consumed || p.traveled >= p.range) {
      playerProjectiles.splice(i, 1);
    }
  }
}

function applyPlayerProjectileHit(p, e) {
  let dmg = Math.max(1, p.damageBase - Math.floor(Math.random() * 4));
  const isCrit = p.critLocked;
  if (isCrit) dmg = Math.floor(dmg * 1.5);
  e.hp -= dmg;
  e.flashTimer = 12;
  e.attackWindup = 0;
  e.hitStun = isCrit ? 220 : 140;
  const angle = Math.atan2(p.vy, p.vx);
  const kbPower = (e.isBoss ? 0.9 : 1.8) * (isCrit ? 1.3 : 1);
  e.knockbackVx = Math.cos(angle) * kbPower;
  e.knockbackVy = Math.sin(angle) * kbPower;
  if (typeof addParticles === 'function') {
    addParticles(e.x, e.y, p.color, isCrit ? 10 : 6);
  }
  if (typeof addDamageNumber === 'function') {
    addDamageNumber(e.x, e.y, dmg, isCrit ? 'critical' : p.damageType);
  }
  if (typeof enemyEffects !== 'undefined') {
    enemyEffects.push({
      kind: 'slash',
      x: e.x,
      y: e.y,
      angle,
      timer: 8,
      maxTimer: 8,
      color: isCrit ? '#f1c40f' : (p.damageType === 'magic' ? '#c39bd3' : '#fff')
    });
  }
  if (isCrit && typeof hitFreezeFrames !== 'undefined') hitFreezeFrames = 3;
  if (typeof triggerShake === 'function') triggerShake(isCrit ? 10 : 6);
  if (e.hp <= 0 && typeof killEnemy === 'function') killEnemy(e, p.ownerCharacterId || (typeof getLoadedPlayerCharacterId === 'function' ? getLoadedPlayerCharacterId() : currentCommanderId));
}

function renderPlayerProjectiles(ctx) {
  if (!playerProjectiles.length) return;
  ctx.save();
  for (const p of playerProjectiles) {
    const sx = p.x - cameraX + screenShake.x;
    const sy = p.y - cameraY + screenShake.y;
    const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * 1.8);
    gradient.addColorStop(0, p.glow || '#ffffff');
    gradient.addColorStop(0.5, p.color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size * 1.8, 0, Math.PI * 2);
    ctx.fill();
    if (p.shape === 'arrow') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.size, 0);
      ctx.lineTo(-p.size, -p.size * 0.4);
      ctx.lineTo(-p.size * 0.4, 0);
      ctx.lineTo(-p.size, p.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (p.shape === 'shard') {
      const angle = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(p.size, 0);
      ctx.lineTo(0, -p.size * 0.5);
      ctx.lineTo(-p.size, 0);
      ctx.lineTo(0, p.size * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function doAttack() {
  if (player.attackTimer > 0) return;
  const attackOwnerCharacterId = typeof getLoadedPlayerCharacterId === 'function' ? getLoadedPlayerCharacterId() : currentCommanderId;
  const commanderCombat = typeof getCommanderCombatProfile === 'function' ? getCommanderCombatProfile() : null;
  const spec = commanderCombat && commanderCombat.basicAttack ? commanderCombat.basicAttack : null;
  const attackRange = typeof playerAttackRangeValue === 'function' ? playerAttackRangeValue() : 62;
  const attackArcWidth = typeof playerAttackArcWidthValue === 'function' ? playerAttackArcWidthValue() : Math.PI * 0.68;
  const attackLunge = typeof playerAttackLungeDistanceValue === 'function' ? playerAttackLungeDistanceValue() : 10;
  const damageType = typeof playerAttackDamageTypeValue === 'function' ? playerAttackDamageTypeValue() : 'normal';
  AudioSystem.sfx.attack();
  player.isAttacking = true;
  player.attackTimer = typeof playerAttackCooldownValue === 'function' ? playerAttackCooldownValue() : player.attackCooldown;

  const angles = [0, Math.PI, -Math.PI/2, Math.PI/2];
  const dirVecs = [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
  player.attackAngle = angles[player.dir];
  player.attackArc = 0;

  const lunge = dirVecs[player.dir];
  const lungePos = resolveCollision(player, player.x + lunge.x * attackLunge, player.y + lunge.y * attackLunge);
  player.x = lungePos.x;
  player.y = lungePos.y;

  const swingOriginX = player.x;
  const swingOriginY = player.y;
  const swingAngle = player.attackAngle;
  const totalCritChance = player.critChance + (getEquipBonus().critBonus || 0);

  function applyHitTimerBonus(hitCount) {
    if (hitCount > 0) {
      player.attackTimer = Math.max(240, player.attackTimer - hitCount * 35);
    }
  }

  function collectArcTargets(range = attackRange, arcWidth = attackArcWidth, originX = swingOriginX, originY = swingOriginY, angle = swingAngle) {
    const targets = [];
    enemies.forEach(e => {
      if (e.dead) return;
      const dx = e.x - originX;
      const dy = e.y - originY;
      const distance = Math.hypot(dx, dy);
      if (distance > range) return;
      const enemyAngle = Math.atan2(dy, dx);
      const diff = Math.abs(normalizeAngle(enemyAngle - angle));
      if (diff < arcWidth) {
        targets.push({ enemy:e, angle:enemyAngle, distance });
      }
    });
    return targets;
  }

  function runArcSweep(options = {}) {
    const range = options.attackRange == null ? attackRange : options.attackRange;
    const arcWidth = options.attackArcWidth == null ? attackArcWidth : options.attackArcWidth;
    const originX = options.originX == null ? swingOriginX : options.originX;
    const originY = options.originY == null ? swingOriginY : options.originY;
    const angle = options.attackAngle == null ? swingAngle : options.attackAngle;
    const targets = collectArcTargets(range, arcWidth, originX, originY, angle);
    const hitEnemies = [];
    let hitCount = 0;

    targets.forEach(target => {
      const e = target.enemy;
      const damageBase = options.damageBase == null ? playerAtk() : options.damageBase;
      let dmg = Math.max(1, Math.floor(damageBase) - Math.floor(Math.random() * 5));
      if (e === options.mainTarget && options.mainTargetDamageMult) {
        dmg = Math.max(1, Math.floor(dmg * options.mainTargetDamageMult));
      }

      let isCrit = false;
      if (Math.random() * 100 < totalCritChance) {
        dmg = Math.floor(dmg * 1.5);
        isCrit = true;
      }

      e.hp -= dmg;
      e.flashTimer = 12;
      e.attackWindup = 0;
      e.hitStun = isCrit ? 260 : 170;
      const kbAngle = typeof options.knockbackAngle === 'function' ? options.knockbackAngle(target) : target.angle;
      const kbPower = ((e.isBoss ? 1.2 : 2.4) * (isCrit ? 1.35 : 1)) * (options.knockbackMult || 1);
      e.knockbackVx = Math.cos(kbAngle) * kbPower;
      e.knockbackVy = Math.sin(kbAngle) * kbPower;
      const hitColor = options.particleColor || (damageType === 'magic' ? '#9b59b6' : '#e74c3c');
      addParticles(e.x, e.y, hitColor, isCrit ? 12 : 8);
      addDamageNumber(e.x, e.y, dmg, isCrit ? 'critical' : damageType);
      enemyEffects.push({
        kind:'slash',
        x:e.x,
        y:e.y,
        angle:target.angle,
        timer:8,
        maxTimer:8,
        color: isCrit ? '#f1c40f' : (options.slashColor || (damageType === 'magic' ? '#c39bd3' : '#fff'))
      });
      if (isCrit) hitFreezeFrames = 3;
      hitCount++;
      if (!options.skipHitShake) {
        triggerShake(isCrit ? 14 : 9);
      }
      hitEnemies.push(e);

      if (typeof options.onHit === 'function') {
        options.onHit({ enemy:e, angle:target.angle, distance:target.distance, damage:dmg, isCrit });
      }
      if (e.hp <= 0) {
        killEnemy(e, attackOwnerCharacterId);
      }
    });

    return { hitCount, hitEnemies, targets };
  }

  if (spec && spec.kind === 'projectile') {
    const damageBase = playerAtk();
    const isCritRoll = Math.random() * 100 < totalCritChance;
    spawnPlayerProjectile(spec, player.x, player.y, player.attackAngle, damageBase, isCritRoll, attackOwnerCharacterId);
    if (typeof addParticles === 'function') {
      const muzzleX = player.x + Math.cos(player.attackAngle) * 12;
      const muzzleY = player.y + Math.sin(player.attackAngle) * 12;
      addParticles(muzzleX, muzzleY, spec.color, isCritRoll ? 8 : 5);
    }
    return;
  }

  if (spec && spec.kind === 'arc-aura') {
    const sweep = runArcSweep();
    applyHitTimerBonus(sweep.hitCount);

    const auraDamage = Math.max(1, Math.floor(playerAtk() * spec.auraDamageRatio));
    const auraType = commanderCombat && commanderCombat.damageType ? commanderCombat.damageType : damageType;
    if (typeof addParticles === 'function') {
      const ringBursts = 10;
      for (let i = 0; i < ringBursts; i++) {
        const ringAngle = (Math.PI * 2 * i) / ringBursts;
        addParticles(
          swingOriginX + Math.cos(ringAngle) * spec.auraRadius,
          swingOriginY + Math.sin(ringAngle) * spec.auraRadius,
          spec.color,
          1
        );
      }
    }
    enemies.forEach(e => {
      if (e.dead) return;
      if (Math.hypot(e.x - swingOriginX, e.y - swingOriginY) > spec.auraRadius) return;
      const angle = Math.atan2(e.y - swingOriginY, e.x - swingOriginX);
      e.hp -= auraDamage;
      e.flashTimer = 10;
      e.attackWindup = 0;
      e.hitStun = 110;
      const kbPower = (e.isBoss ? 0.55 : 1.15);
      e.knockbackVx = Math.cos(angle) * kbPower;
      e.knockbackVy = Math.sin(angle) * kbPower;
      addParticles(e.x, e.y, spec.color, 5);
      addDamageNumber(e.x, e.y, auraDamage, auraType);
      enemyEffects.push({ kind:'slash', x:e.x, y:e.y, angle:angle, timer:7, maxTimer:7, color:spec.glow || spec.color });
      triggerShake(4);
      if (e.hp <= 0) {
        killEnemy(e, attackOwnerCharacterId);
      }
    });
    return;
  }

  if (spec && spec.kind === 'arc-shock') {
    const sweep = runArcSweep();
    applyHitTimerBonus(sweep.hitCount);

    setTimeout(() => {
      const shockDamage = Math.max(1, Math.floor(playerAtk() * spec.shockDamageRatio));
      enemies.forEach(e => {
        if (e.dead) return;
        const dx = e.x - swingOriginX;
        const dy = e.y - swingOriginY;
        if (Math.hypot(dx, dy) > spec.shockRadius) return;
        const angle = Math.atan2(dy, dx);
        e.hp -= shockDamage;
        e.flashTimer = 10;
        e.attackWindup = 0;
        e.hitStun = 110;
        const kbPower = 2.4 * spec.shockKnockbackMult;
        e.knockbackVx = Math.cos(angle) * kbPower;
        e.knockbackVy = Math.sin(angle) * kbPower;
        addParticles(e.x, e.y, spec.shockColor, 3);
        addDamageNumber(e.x, e.y, shockDamage, 'normal');
        if (e.hp <= 0) {
          killEnemy(e, attackOwnerCharacterId);
        }
      });
      enemyEffects.push({ kind:'slash', x:swingOriginX, y:swingOriginY, angle:0, timer:12, maxTimer:12, color:spec.shockColor });
    }, spec.shockDelayMs);
    return;
  }

  if (spec && spec.kind === 'arc-combo') {
    const comboDamageBase = Math.floor(playerAtk() * spec.damagePerHit);
    const comboHits = Math.max(1, spec.hits || 2);

    const firstSweep = runArcSweep({ damageBase: comboDamageBase });
    applyHitTimerBonus(firstSweep.hitCount);

    if (comboHits > 1) {
      setTimeout(() => {
        const secondSweep = runArcSweep({
          damageBase: comboDamageBase,
          originX: swingOriginX,
          originY: swingOriginY,
          attackAngle: swingAngle,
          particleColor: spec.comboColor,
          slashColor: spec.comboGlow
        });
        applyHitTimerBonus(secondSweep.hitCount);
      }, spec.hitDelayMs);
    }
    return;
  }

  if (spec && spec.kind === 'lance-charge') {
    const forward = dirVecs[player.dir];
    let hitCount = 0;

    enemies.forEach(e => {
      if (e.dead) return;
      const relX = e.x - swingOriginX;
      const relY = e.y - swingOriginY;
      const t = relX * forward.x + relY * forward.y;
      if (t < 0 || t > spec.lineLength) return;
      const perpendicular = Math.abs(relX * forward.y - relY * forward.x);
      if (perpendicular > spec.lineWidth) return;

      let dmg = Math.max(1, Math.floor(playerAtk() * spec.damageMult) - Math.floor(Math.random() * 3));
      let isCrit = false;
      if (Math.random() * 100 < totalCritChance) {
        dmg = Math.floor(dmg * 1.5);
        isCrit = true;
      }

      e.hp -= dmg;
      e.flashTimer = 12;
      e.attackWindup = 0;
      e.hitStun = isCrit ? 260 : 170;
      const kbPower = (e.isBoss ? 1.2 : 2.4) * (isCrit ? 1.35 : 1);
      e.knockbackVx = forward.x * kbPower;
      e.knockbackVy = forward.y * kbPower;
      addParticles(e.x, e.y, spec.chargeColor, isCrit ? 12 : 8);
      addDamageNumber(e.x, e.y, dmg, isCrit ? 'critical' : damageType);
      enemyEffects.push({
        kind:'slash',
        x:e.x,
        y:e.y,
        angle:swingAngle,
        timer:8,
        maxTimer:8,
        color:isCrit ? '#f1c40f' : (spec.chargeGlow || spec.chargeColor)
      });
      if (isCrit) hitFreezeFrames = 3;
      hitCount++;
      if (e.hp <= 0) {
        killEnemy(e, attackOwnerCharacterId);
      }
    });

    enemyEffects.push({
      kind:'slash',
      x:swingOriginX + forward.x * spec.lineLength,
      y:swingOriginY + forward.y * spec.lineLength,
      angle:swingAngle,
      timer:10,
      maxTimer:10,
      color:spec.chargeGlow
    });
    [20, 40, 60, 80].forEach(k => {
      addParticles(swingOriginX + forward.x * k, swingOriginY + forward.y * k, spec.chargeGlow, 1);
    });
    triggerShake(8);
    applyHitTimerBonus(hitCount);
    return;
  }

  if (spec && spec.kind === 'arc-chill') {
    const sweep = runArcSweep({
      particleColor: spec.chillColor,
      onHit({ enemy }) {
        enemy.chillTimer = spec.chillDurationMs;
        enemy.chillMult = spec.chillSpeedMult;
        addParticles(enemy.x, enemy.y, spec.chillGlow, 4);
      }
    });
    applyHitTimerBonus(sweep.hitCount);
    return;
  }

  if (spec && spec.kind === 'arc-thrust') {
    const thrustRange = attackRange + spec.rangeBonus;
    const thrustArcWidth = spec.arcWidthOverride || attackArcWidth;
    const thrustTargets = collectArcTargets(thrustRange, thrustArcWidth);
    const mainTargetEntry = thrustTargets.reduce((closest, target) => {
      if (!closest || target.distance < closest.distance) return target;
      return closest;
    }, null);
    const mainTarget = mainTargetEntry ? mainTargetEntry.enemy : null;
    const sweep = runArcSweep({
      attackRange: thrustRange,
      attackArcWidth: thrustArcWidth,
      mainTarget,
      mainTargetDamageMult: spec.mainTargetDamageMult,
      onHit({ enemy, angle }) {
        if (enemy !== mainTarget) return;
        addParticles(enemy.x, enemy.y, spec.thrustColor, 8);
        enemyEffects.push({ kind:'slash', x:enemy.x, y:enemy.y, angle, timer:8, maxTimer:8, color:spec.thrustGlow });
      }
    });
    applyHitTimerBonus(sweep.hitCount);
    return;
  }

  const sweep = runArcSweep();
  applyHitTimerBonus(sweep.hitCount);
}

function damagePlayerFromEnemy(source, dmg, hitX, hitY, invincibleMs = 600) {
  player.hp -= dmg;
  player.invincible = invincibleMs;
  triggerShake(source && source.isBoss ? 14 : 10);
  addParticles(hitX ?? player.x, hitY ?? player.y, '#e74c3c', source && source.isBoss ? 10 : 6);
  addDamageNumber(hitX ?? player.x, hitY ?? player.y, dmg, 'received');
  AudioSystem.sfx.playerHit();
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    const runtimeState = getPartyRuntimeState(combatControlledCharacterId);
    if (runtimeState) {
      runtimeState.hp = 0;
      runtimeState.dead = true;
      runtimeState.x = player.x;
      runtimeState.y = player.y;
    }
    if (combatControlledCharacterId) {
      markCharacterGhost(combatControlledCharacterId, { skipNormalize: true });
    }
    const switched = handleControlledCharacterDeath();
    if (switched) {
      updateHUD();
      return;
    }
    AudioSystem.sfx.death();
    AudioSystem.stopBgm();
    returnPlayerToTownAfterDeath();
    return;
  }
  updateHUD();
}

function damageCompanionById(cId, dmg, hitX, hitY) {
  const cs = companionStates[cId];
  if (!cs) return false;
  cs.hp -= dmg;
  cs.flashTimer = 12;
  addDamageNumber(hitX ?? cs.x, hitY ?? cs.y, dmg, 'received');
  addParticles(hitX ?? cs.x, hitY ?? cs.y, '#e74c3c', 4);
  const runtimeState = getPartyRuntimeState(getCompanionCharacterId(cId));
  if (runtimeState) {
    runtimeState.hp = cs.hp;
    runtimeState.maxHp = cs.maxHp;
    runtimeState.x = cs.x;
    runtimeState.y = cs.y;
  }
  if (cs.hp <= 0) {
    if (runtimeState) {
      runtimeState.hp = 0;
      runtimeState.dead = true;
    }
    markCompanionDead(cId, { hitX, hitY });
  }
  return true;
}

function performEnemyAttack(e) {
  if (player.invincible <= 0) {
    const dmg = Math.max(1, e.atk - playerDef() - Math.floor(Math.random() * 4));
    damagePlayerFromEnemy(e, dmg, player.x, player.y, 600);
    return true;
  }

  if (currentMap === 'dungeon' && activeCompanions.length > 0) {
    let targetComp = null;
    let compDist = e.attackRange + 12;
    activeCompanions.forEach(cId => {
      const cs = companionStates[cId];
      if (!cs) return;
      const cd = dist(e, cs);
      if (cd < compDist) { targetComp = cId; compDist = cd; }
    });
    if (targetComp !== null) {
      const dmg = Math.max(1, e.atk - 2);
      damageCompanionById(targetComp, dmg);
      return true;
    }
  }

  return false;
}



// ─── Update ───────────────────────────────────────────────────────────────────
let lastTime = 0;


// ─── Level Up ────────────────────────────────────────────────────────────────
let maxLevelToastShown = false;
function gainXP(amount) {
  const levelCap = getPlayerLevelCap();
  if (player.level >= levelCap) {
    player.xp = 0;
    if (!maxLevelToastShown) {
      showToast('최대 레벨');
      maxLevelToastShown = true;
    }
    if (typeof snapshotPlayerStateToOwnedCharacter === 'function' && typeof getLoadedPlayerCharacterId === 'function') {
      snapshotPlayerStateToOwnedCharacter(getLoadedPlayerCharacterId());
    }
    updateHUD();
    return;
  }
  player.xp += amount;
  let leveled = false;
  while (player.xp >= player.xpNext && player.level < levelCap) {
    player.xp -= player.xpNext;
    player.level++;

    const growth = getLevelGrowthForRank(player.classLine || 'infantry', player.classRank || 1);
    player.xpNext = getXpToNextLevel(player.level, player.tier || player.classRank || 1);
    player.maxHp += growth.maxHp;
    player.hp = player.maxHp;
    player.maxMp += growth.maxMp;
    player.mp = player.maxMp;
    player.atk += growth.atk;
    player.def += growth.def;
    player.speed += growth.speed;
    player.critChance = Math.min(30, player.critChance + growth.critChance);
    showLevelup();
    addParticles(player.x, player.y, '#f1c40f', 20);
    leveled = true;

    const wasPending = !!player.promotionPending;
    syncPlayerGrowthState();
    const promotionTarget = getPlayerPromotionTarget();
    if (!wasPending && promotionTarget) {
      showToast('승급 가능! 수련의 방으로 가자');
      addParticles(player.x, player.y, promotionTarget.color, 25);
    }
    // lightsaber_test staged progression: 8단 Lv100/9단 Lv200 도달 시 상위 문장 자동 지급
    if (typeof checkTierCapMilestoneRewards === 'function') checkTierCapMilestoneRewards();

    if (player.level >= getPlayerLevelCap()) {
      player.xp = 0;
      player.xpNext = 0;
      break;
    }
  }
  if (typeof snapshotPlayerStateToOwnedCharacter === 'function' && typeof getLoadedPlayerCharacterId === 'function') {
    snapshotPlayerStateToOwnedCharacter(getLoadedPlayerCharacterId());
  }
  if (leveled) autoSave();
  updateHUD();
}

function gainCharacterXP(characterId, amount) {
  if (!characterId || !amount || amount <= 0) return false;
  const loadedCharacterId = typeof getLoadedPlayerCharacterId === 'function' ? getLoadedPlayerCharacterId() : (currentCommanderId || null);
  if (characterId === loadedCharacterId) {
    gainXP(amount);
    return true;
  }

  const entry = typeof getOwnedCharacter === 'function' ? getOwnedCharacter(characterId) : null;
  if (!entry || entry.dead) return false;

  const tier = entry.currentTier || entry.tier || entry.classRank || 1;
  const levelCap = getTierLevelCap(tier);
  if ((entry.level || 1) >= levelCap) {
    entry.exp = 0;
    entry.xpNext = 0;
    entry.expToNext = 0;
    return true;
  }

  entry.level = entry.level || 1;
  entry.exp = (entry.exp || 0) + amount;
  entry.xpNext = entry.xpNext || entry.expToNext || getXpToNextLevel(entry.level, tier);
  let leveled = false;

  while (entry.xpNext > 0 && entry.exp >= entry.xpNext && entry.level < levelCap) {
    entry.exp -= entry.xpNext;
    entry.level += 1;
    const growth = getLevelGrowthForRank(entry.classLine || 'infantry', entry.classRank || 1);
    entry.maxHp = (entry.maxHp || 0) + growth.maxHp;
    entry.hp = entry.maxHp;
    entry.maxMp = (entry.maxMp || 0) + growth.maxMp;
    entry.mp = entry.maxMp;
    entry.atk = (entry.atk || 0) + growth.atk;
    entry.def = (entry.def || 0) + growth.def;
    entry.speed = (entry.speed || 0) + growth.speed;
    entry.critChance = Math.min(30, (entry.critChance || 0) + growth.critChance);
    entry.xpNext = getXpToNextLevel(entry.level, tier);
    entry.expToNext = entry.xpNext;
    leveled = true;

    if (entry.level >= levelCap) {
      entry.exp = 0;
      entry.xpNext = 0;
      entry.expToNext = 0;
      break;
    }
  }

  if (!leveled) {
    entry.expToNext = entry.xpNext;
  }
  return true;
}


// ─── Kill Enemy Helper ───────────────────────────────────────────────────────
function killEnemy(e, killerCharacterId = null) {
  e.dead = true;
  AudioSystem.sfx.enemyDeath();
  const rewardMultiplier = getDungeonRewardMultiplier();
  const rewardCharacterId = killerCharacterId || (typeof getLoadedPlayerCharacterId === 'function' ? getLoadedPlayerCharacterId() : currentCommanderId);
  gainCharacterXP(rewardCharacterId, Math.max(1, Math.floor(e.xp * rewardMultiplier)));
  const earnedGold = Math.max(1, Math.floor(e.gold * getVillageGoldMultiplier() * rewardMultiplier));
  player.gold += earnedGold;
  totalGoldEarned += earnedGold;
  totalEnemiesKilled++;
  const drops = DROP_TABLE[e.typeIdx] || [];
  drops.forEach(d => {
    if (Math.random() < d.chance) {
      droppedItems.push({ x: e.x + (Math.random()-0.5)*20, y: e.y + (Math.random()-0.5)*20, itemId: d.itemId, timer: 600 });
    }
  });
  getDungeonDropPool().forEach(d => {
    if (Math.random() < d.chance) {
      droppedItems.push({ x: e.x + (Math.random()-0.5)*24, y: e.y + (Math.random()-0.5)*24, itemId: d.itemId, timer: 800 });
    }
  });
  if (e.isBoss) {
    const rewardPool = getDungeonDropPool();
    if (rewardPool.length > 0) {
      const guaranteed = rewardPool[Math.floor(Math.random() * rewardPool.length)];
      droppedItems.push({ x: e.x + (Math.random()-0.5)*18, y: e.y + (Math.random()-0.5)*18, itemId: guaranteed.itemId, timer: 1200 });
      if (typeof showToast === 'function' && ITEMS[guaranteed.itemId]) {
        setTimeout(() => showToast('보스 전리품: ' + ITEMS[guaranteed.itemId].name), 200);
      }
    }
  }
  addParticles(e.x, e.y, e.color, 8);
  addParticles(e.x, e.y, '#fff', 4);
  if (e.isBoss) {
    addParticles(e.x, e.y, '#f1c40f', 30);
    addParticles(e.x, e.y, '#e74c3c', 20);
    screenShake.timer = Math.max(screenShake.timer, 12);
    hitFreezeFrames = Math.max(hitFreezeFrames, 5);
  } else {
    addParticles(e.x, e.y, '#f1c40f', 12);
    screenShake.timer = Math.max(screenShake.timer, 4);
  }
  updateHUD();

  // Check dungeon clear
  if (currentMap === 'dungeon') {
    checkDungeonClear();
  }
}

// ─── Dungeon Clear Check ─────────────────────────────────────────────────────
let dungeonCleared = false;
function checkDungeonClear() {
  if (dungeonCleared) return;
  const alive = enemies.filter(e => !e.dead);
  if (alive.length === 0) {
    dungeonCleared = true;
    showDungeonClearBanner('던전 클리어!');

    if (isEmblemTrialActive()) {
      const emblem = getCurrentEmblemTrialDef();
      if (emblem && grantPlayerEmblem(emblem.id)) {
        setTimeout(() => {
          showToast(emblem.name + ' 획득!');
          addParticles(player.x, player.y, '#d6b3ff', 24);
        }, 500);
      }
      setTimeout(() => {
        if (typeof exitDungeon === 'function') exitDungeon();
      }, 1400);
      return;
    }

    if (currentDungeonId >= 0 && !dungeonsCleared.includes(currentDungeonId)) {
      dungeonsCleared.push(currentDungeonId);
      const info = DUNGEON_INFO[currentDungeonId];
      if (info && !companions.includes(currentDungeonId)) {
        if (typeof unlockCompanion === 'function') unlockCompanion(currentDungeonId, { silent: true });
        else companions.push(currentDungeonId);
        setTimeout(() => {
          showDungeonClearBanner('새로운 동료: ' + info.companionName + ' 획득!');
        }, 2000);
      }
      const quest = typeof getMainQuest === 'function' ? getMainQuest() : null;
      if (quest && quest.objectiveType === 'clearDungeon' && quest.objectiveTarget === currentDungeonId && typeof showToast === 'function') {
        setTimeout(() => {
          showToast('보고 대상에게 돌아가 퀘스트를 완료하세요!');
        }, 1000);
      }
    }
    autoSave();
  }
}

let dungeonClearTimeout = null;
function showDungeonClearBanner(text) {
  AudioSystem.sfx.dungeonClear();
  const el = document.getElementById('dungeon-clear-banner');
  el.textContent = text;
  el.style.opacity = '1';
  if (dungeonClearTimeout) clearTimeout(dungeonClearTimeout);
  dungeonClearTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// ─── UI Update ────────────────────────────────────────────────────────────────
