'use strict';

function doAttack() {
  if (player.attackTimer > 0) return;
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

  let hitCount = 0;
  enemies.forEach(e => {
    if (e.dead) return;
    const d = dist(player, e);
    if (d > attackRange) return;
    const angle = Math.atan2(e.y - player.y, e.x - player.x);
    const diff = Math.abs(normalizeAngle(angle - player.attackAngle));
    if (diff < attackArcWidth) {
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
      addParticles(e.x, e.y, damageType === 'magic' ? '#9b59b6' : '#e74c3c', isCrit ? 12 : 8);
      addDamageNumber(e.x, e.y, dmg, isCrit ? 'critical' : damageType);
      enemyEffects.push({ kind:'slash', x:e.x, y:e.y, angle:angle, timer:8, maxTimer:8, color: isCrit ? '#f1c40f' : (damageType === 'magic' ? '#c39bd3' : '#fff') });
      if (isCrit) hitFreezeFrames = 3;
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
  if (cs.hp <= 0) {
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

    if (player.level >= getPlayerLevelCap()) {
      player.xp = 0;
      player.xpNext = 0;
      break;
    }
  }
  if (leveled) autoSave();
  updateHUD();
}


// ─── Kill Enemy Helper ───────────────────────────────────────────────────────
function killEnemy(e) {
  e.dead = true;
  AudioSystem.sfx.enemyDeath();
  const rewardMultiplier = getDungeonRewardMultiplier();
  gainXP(Math.max(1, Math.floor(e.xp * rewardMultiplier)));
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
