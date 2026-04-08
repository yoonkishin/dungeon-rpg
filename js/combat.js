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

function performEnemyAttack(e) {
  if (player.invincible <= 0) {
    const dmg = Math.max(1, e.atk - playerDef() - Math.floor(Math.random() * 4));
    player.hp -= dmg;
    player.invincible = 600;
    triggerShake(e.isBoss ? 14 : 10);
    addParticles(player.x, player.y, '#e74c3c', e.isBoss ? 10 : 6);
    addDamageNumber(player.x, player.y, dmg, 'received');
    AudioSystem.sfx.playerHit();
    if (player.hp <= 0) {
      player.hp = 0;
      player.dead = true;
      AudioSystem.sfx.death();
      AudioSystem.stopBgm();
      document.getElementById('death-screen').style.display = 'flex';
    }
    updateHUD();
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
      const cs = companionStates[targetComp];
      const dmg = Math.max(1, e.atk - 2);
      cs.hp -= dmg;
      cs.flashTimer = 12;
      addDamageNumber(cs.x, cs.y, dmg, 'received');
      addParticles(cs.x, cs.y, '#e74c3c', 4);
      if (cs.hp <= 0) {
        cs.hp = 0;
        deadCompanions.push(targetComp);
        activeCompanions = activeCompanions.filter(id => id !== targetComp);
        const cInfo = DUNGEON_INFO[targetComp];
        showToast((cInfo ? cInfo.companionName : '동료') + ' 쓰러짐!');
        addParticles(cs.x, cs.y, '#e74c3c', 15);
      }
      return true;
    }
  }

  return false;
}


// ─── Update ───────────────────────────────────────────────────────────────────
let lastTime = 0;


// ─── Kill Enemy Helper ───────────────────────────────────────────────────────
function killEnemy(e) {
  e.dead = true;
  AudioSystem.sfx.enemyDeath();
  gainXP(e.xp);
  player.gold += e.gold;
  totalGoldEarned += e.gold;
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
