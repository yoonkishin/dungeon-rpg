'use strict';

function doAttack() {
  if (player.attackTimer > 0) return;
  AudioSystem.sfx.attack();
  player.isAttacking = true;
  player.attackTimer = player.attackCooldown;

  const angles = [0, Math.PI, -Math.PI/2, Math.PI/2];
  const dirVecs = [{x:1,y:0},{x:-1,y:0},{x:0,y:-1},{x:0,y:1}];
  player.attackAngle = angles[player.dir];
  player.attackArc = 0;

  const lunge = dirVecs[player.dir];
  const lungePos = resolveCollision(player, player.x + lunge.x * 10, player.y + lunge.y * 10);
  player.x = lungePos.x;
  player.y = lungePos.y;

  let hitCount = 0;
  enemies.forEach(e => {
    if (e.dead) return;
    const d = dist(player, e);
    if (d > 62) return;
    const angle = Math.atan2(e.y - player.y, e.x - player.x);
    const diff = Math.abs(normalizeAngle(angle - player.attackAngle));
    if (diff < Math.PI * 0.68) {
      let dmg = Math.max(1, playerAtk() - Math.floor(Math.random() * 5));
      let isCrit = false;
      const totalCritChance = player.critChance + (getEquipBonus().critBonus || 0);
      if (Math.random() * 100 < totalCritChance) {
        dmg = Math.floor(dmg * 1.5);
        isCrit = true;
      }
      e.hp -= dmg;
      e.flashTimer = 12;
      e.attackWindup = 0;
      e.hitStun = isCrit ? 260 : 170;
      const kbPower = (e.isBoss ? 1.2 : 2.4) * (isCrit ? 1.35 : 1);
      e.knockbackVx = Math.cos(angle) * kbPower;
      e.knockbackVy = Math.sin(angle) * kbPower;
      addParticles(e.x, e.y, '#e74c3c', isCrit ? 12 : 8);
      addDamageNumber(e.x, e.y, dmg, isCrit ? 'critical' : 'normal');
      hitCount++;
      triggerShake(isCrit ? 14 : 9);
      if (e.hp <= 0) {
        killEnemy(e);
      }
    }
  });

  if (hitCount > 0) {
    player.attackTimer = Math.max(240, player.attackTimer - hitCount * 35);
  }
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
    AudioSystem.sfx.death();
    AudioSystem.stopBgm();
    if (typeof returnPlayerToTownAfterDeath === 'function') {
      returnPlayerToTownAfterDeath();
      return;
    }
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
  if (cs.hp <= 0) {
    cs.hp = 0;
    if (!deadCompanions.includes(cId)) deadCompanions.push(cId);
    activeCompanions = activeCompanions.filter(id => id !== cId);
    const cInfo = getCompanionRoster(cId);
    showToast((cInfo ? cInfo.name : '동료') + ' 쓰러짐!');
    addParticles(hitX ?? cs.x, hitY ?? cs.y, '#e74c3c', 15);
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
      const cd = Math.sqrt((e.x - cs.x)**2 + (e.y - cs.y)**2);
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

function spawnBossWarningEffect(e, options = {}) {
  const timer = options.timer || 950;
  enemyEffects.push({
    kind: 'warning',
    x: options.x ?? e.x,
    y: options.y ?? e.y,
    radius: options.radius ?? 48,
    timer,
    maxTimer: timer,
    damage: options.damage ?? Math.max(8, Math.floor(e.atk * 0.9)),
    color: options.color || e.bossSkillColor || e.color,
    followBoss: !!options.followBoss,
    ownerId: e.name,
    label: options.label || e.bossSkillName || '위험'
  });
}

function spawnBossProjectileVolley(e, shots = 1, spreadStep = 0.2, speed = 3.2, damage = null) {
  const skillColor = e.bossSkillColor || e.color;
  const baseAngle = Math.atan2(player.y - e.y, player.x - e.x);
  const dmg = damage ?? Math.max(8, Math.floor(e.atk * 0.9)) + 6;
  const center = (shots - 1) / 2;
  for (let i = 0; i < shots; i++) {
    const angle = baseAngle + (i - center) * spreadStep;
    enemyEffects.push({
      kind: 'projectile',
      x: e.x,
      y: e.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 12,
      life: 1800,
      damage: dmg,
      color: skillColor,
      label: e.bossSkillName || '투사체',
      ownerId: e.name
    });
  }
  addParticles(e.x, e.y, skillColor, Math.min(20, 8 + shots * 2));
}

function triggerBossPhaseGimmick(e) {
  if (!e || !e.isBoss || !Array.isArray(e.phaseThresholds) || !Array.isArray(e.phaseTriggered)) return;
  const hpPct = e.maxHp > 0 ? (e.hp / e.maxHp) : 1;
  const skillColor = e.bossSkillColor || e.color;

  e.phaseThresholds.forEach((threshold, idx) => {
    if (e.phaseTriggered[idx] || hpPct > threshold) return;
    e.phaseTriggered[idx] = true;
    e.phaseRank = Math.max(e.phaseRank || 0, idx + 1);
    e.specialCooldown = Math.max(1700, e.specialCooldown - 350);
    e.attackCooldown = Math.max(760, e.attackCooldown - 80);
    e.specialTimer = Math.min(e.specialTimer, 650);
    addParticles(e.x, e.y, skillColor, 18 + idx * 4);
    triggerShake(10 + idx * 2);

    if (e.bossSkillType === 'slam') {
      spawnBossWarningEffect(e, {
        x: player.x,
        y: player.y,
        radius: 58 + idx * 12,
        timer: 820,
        damage: Math.max(10, Math.floor(e.atk * 0.95)) + 10 + idx * 4,
        label: idx === 0 ? '광폭 강타' : '연속 강타'
      });
      if (typeof spawnBossReinforcements === 'function') {
        spawnBossReinforcements(e, 1 + idx, e.summonTypeIdx || e.typeIdx || 0);
      }
    } else if (e.bossSkillType === 'bolt') {
      spawnBossProjectileVolley(e, 3 + idx * 2, 0.2 + idx * 0.05, 3.4 + idx * 0.3, Math.max(10, Math.floor(e.atk * 0.9)) + 8 + idx * 4);
    } else if (e.bossSkillType === 'nova') {
      spawnBossWarningEffect(e, {
        x: e.x,
        y: e.y,
        radius: e.attackRange + 46 + idx * 14,
        timer: 920,
        damage: Math.max(10, Math.floor(e.atk)) + 10 + idx * 4,
        followBoss: true,
        label: idx === 0 ? '망령 집결' : '심연 파동'
      });
      if (typeof spawnBossReinforcements === 'function') {
        spawnBossReinforcements(e, 1 + idx, e.summonTypeIdx || e.typeIdx || 0);
      }
    } else if (e.bossSkillType === 'charge') {
      spawnBossWarningEffect(e, {
        x: e.x,
        y: e.y,
        radius: 42 + idx * 10,
        timer: 780,
        damage: Math.max(10, Math.floor(e.atk * 0.85)) + 8 + idx * 4,
        label: idx === 0 ? '전장의 함성' : '파괴의 함성'
      });
      if (typeof spawnBossReinforcements === 'function') {
        spawnBossReinforcements(e, 1 + idx, e.eliteSupportTypeIdx || e.summonTypeIdx || e.typeIdx || 0);
      }
    }

    showToast(idx === 0 ? (e.name + ' 분노 개시!') : (e.name + ' 최종 분노!'));
  });
}

function queueBossSpecial(e) {
  if (!e || !e.isBoss || !e.bossSkillType) return;
  const skillColor = e.bossSkillColor || e.color;
  const baseDamage = Math.max(8, Math.floor(e.atk * 0.9));
  const phaseRank = e.phaseRank || 0;

  if (e.bossSkillType === 'slam') {
    spawnBossWarningEffect(e, {
      x: player.x,
      y: player.y,
      radius: 48 + phaseRank * 10,
      timer: Math.max(720, 950 - phaseRank * 80),
      damage: baseDamage + 8 + phaseRank * 4,
      color: skillColor,
      label: e.bossSkillName || '강타'
    });
    showToast((e.bossSkillName || e.name) + ' 준비!');
  } else if (e.bossSkillType === 'nova') {
    spawnBossWarningEffect(e, {
      x: e.x,
      y: e.y,
      radius: e.attackRange + 36 + phaseRank * 12,
      timer: Math.max(860, 1100 - phaseRank * 70),
      damage: baseDamage + 12 + phaseRank * 5,
      color: skillColor,
      followBoss: true,
      label: e.bossSkillName || '파동'
    });
    showToast((e.bossSkillName || e.name) + ' 시전!');
  } else if (e.bossSkillType === 'bolt') {
    spawnBossProjectileVolley(e, 1 + phaseRank * 2, 0.18 + phaseRank * 0.05, 3.2 + phaseRank * 0.2, baseDamage + 6 + phaseRank * 3);
  } else if (e.bossSkillType === 'charge') {
    const angle = Math.atan2(player.y - e.y, player.x - e.x);
    enemyEffects.push({
      kind: 'charge',
      x: e.x,
      y: e.y,
      radius: 22 + phaseRank * 3,
      timer: Math.max(760, 900 - phaseRank * 60),
      maxTimer: Math.max(760, 900 - phaseRank * 60),
      damage: baseDamage + 10 + phaseRank * 5,
      color: skillColor,
      dirX: Math.cos(angle),
      dirY: Math.sin(angle),
      ownerId: e.name,
      hitPlayer: false,
      hitCompanions: {},
      label: e.bossSkillName || '돌진'
    });
    showToast((e.bossSkillName || e.name) + ' 돌진!');
  }
}

function updateEnemyEffects(dt) {
  enemyEffects = enemyEffects.filter(effect => {
    if (effect.kind === 'warning') {
      if (effect.followBoss) {
        const owner = enemies.find(en => !en.dead && en.isBoss && en.name === effect.ownerId);
        if (owner) {
          effect.x = owner.x;
          effect.y = owner.y;
        }
      }
      effect.timer -= dt;
      if (effect.timer <= 0) {
        if (dist({ x: effect.x, y: effect.y }, player) <= effect.radius && player.invincible <= 0) {
          damagePlayerFromEnemy({ isBoss: true }, effect.damage, effect.x, effect.y, 550);
        }
        if (currentMap === 'dungeon') {
          activeCompanions.slice().forEach(cId => {
            const cs = companionStates[cId];
            if (!cs) return;
            const cd = Math.sqrt((cs.x - effect.x)**2 + (cs.y - effect.y)**2);
            if (cd <= effect.radius) {
              damageCompanionById(cId, Math.max(1, effect.damage - 4), effect.x, effect.y);
            }
          });
        }
        addParticles(effect.x, effect.y, effect.color, 18);
        triggerShake(12);
        return false;
      }
      return true;
    }

    if (effect.kind === 'projectile') {
      effect.life -= dt;
      effect.x += effect.vx * (dt / 16.666);
      effect.y += effect.vy * (dt / 16.666);
      if (dist({ x: effect.x, y: effect.y }, player) <= effect.radius + player.w * 0.4 && player.invincible <= 0) {
        damagePlayerFromEnemy({ isBoss: true }, effect.damage, effect.x, effect.y, 450);
        addParticles(effect.x, effect.y, effect.color, 12);
        return false;
      }
      if (currentMap === 'dungeon') {
        for (const cId of activeCompanions.slice()) {
          const cs = companionStates[cId];
          if (!cs) continue;
          const cd = Math.sqrt((cs.x - effect.x)**2 + (cs.y - effect.y)**2);
          if (cd <= effect.radius + 10) {
            damageCompanionById(cId, Math.max(1, effect.damage - 5), effect.x, effect.y);
            addParticles(effect.x, effect.y, effect.color, 10);
            return false;
          }
        }
      }
      return effect.life > 0;
    }

    if (effect.kind === 'charge') {
      effect.timer -= dt;
      const owner = enemies.find(en => !en.dead && en.isBoss && en.name === effect.ownerId);
      if (!owner) return false;
      const phasePct = 1 - Math.max(0, effect.timer) / effect.maxTimer;
      const speed = (phasePct > 0.45 ? 5.2 : 0.8) * (dt / 16.666);
      const pos = resolveCollision(owner, owner.x + effect.dirX * speed, owner.y + effect.dirY * speed);
      owner.x = pos.x;
      owner.y = pos.y;
      effect.x = owner.x;
      effect.y = owner.y;
      if (phasePct > 0.45) {
        if (!effect.hitPlayer && dist(owner, player) <= effect.radius + 10 && player.invincible <= 0) {
          effect.hitPlayer = true;
          damagePlayerFromEnemy(owner, effect.damage, owner.x, owner.y, 500);
        }
        if (currentMap === 'dungeon') {
          activeCompanions.slice().forEach(cId => {
            const cs = companionStates[cId];
            if (!cs || effect.hitCompanions[cId]) return;
            const cd = Math.sqrt((cs.x - owner.x)**2 + (cs.y - owner.y)**2);
            if (cd <= effect.radius + 6) {
              effect.hitCompanions[cId] = true;
              damageCompanionById(cId, Math.max(1, effect.damage - 5), owner.x, owner.y);
            }
          });
        }
      }
      return effect.timer > 0;
    }

    return false;
  });
}


// ─── Update ───────────────────────────────────────────────────────────────────
let lastTime = 0;


// ─── Kill Enemy Helper ───────────────────────────────────────────────────────
function killEnemy(e) {
  e.dead = true;
  AudioSystem.sfx.enemyDeath();
  gainXP(e.xp);
  const earnedGold = Math.max(1, Math.floor(e.gold * getVillageGoldMultiplier()));
  player.gold += earnedGold;
  totalGoldEarned += earnedGold;
  totalEnemiesKilled++;
  const drops = DROP_TABLE[e.typeIdx] || [];
  drops.forEach(d => {
    if (Math.random() < d.chance) {
      droppedItems.push({ x: e.x + (Math.random()-0.5)*20, y: e.y + (Math.random()-0.5)*20, itemId: d.itemId, timer: 600 });
    }
  });
  if (e.isBoss) {
    addParticles(e.x, e.y, '#f1c40f', 30);
    addParticles(e.x, e.y, '#e74c3c', 20);
  } else {
    addParticles(e.x, e.y, '#f1c40f', 12);
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
    showDungeonClearBanner();

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
        companions.push(currentDungeonId);
        setTimeout(() => {
          showDungeonClearBanner2(info.companionName);
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
function showDungeonClearBanner() {
  AudioSystem.sfx.dungeonClear();
  const el = document.getElementById('dungeon-clear-banner');
  el.textContent = '던전 클리어!';
  el.style.opacity = '1';
  if (dungeonClearTimeout) clearTimeout(dungeonClearTimeout);
  dungeonClearTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}
function showDungeonClearBanner2(compName) {
  const el = document.getElementById('dungeon-clear-banner');
  el.textContent = '새로운 동료: ' + compName + ' 획득!';
  el.style.opacity = '1';
  if (dungeonClearTimeout) clearTimeout(dungeonClearTimeout);
  dungeonClearTimeout = setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

// ─── UI Update ────────────────────────────────────────────────────────────────
