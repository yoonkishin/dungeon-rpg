'use strict';

function doAttack() {
  if (player.attackTimer > 0) return;
  AudioSystem.sfx.attack();
  player.isAttacking = true;
  player.attackTimer = player.attackCooldown;

  const angles = [0, Math.PI, -Math.PI/2, Math.PI/2];
  player.attackAngle = angles[player.dir];
  player.attackArc = 0;

  enemies.forEach(e => {
    if (e.dead) return;
    const d = dist(player, e);
    if (d > 55) return;
    const angle = Math.atan2(e.y - player.y, e.x - player.x);
    const diff = Math.abs(normalizeAngle(angle - player.attackAngle));
    if (diff < Math.PI * 0.6) {
      let dmg = Math.max(1, playerAtk() - Math.floor(Math.random() * 5));
      let isCrit = false;
      const totalCritChance = player.critChance + (getEquipBonus().critBonus || 0);
      if (Math.random() * 100 < totalCritChance) {
        dmg = Math.floor(dmg * 1.5);
        isCrit = true;
      }
      e.hp -= dmg;
      e.flashTimer = 12;
      addParticles(e.x, e.y, '#e74c3c', 8);
      addDamageNumber(e.x, e.y, dmg, isCrit ? 'critical' : 'normal');
      triggerShake(isCrit ? 12 : 8);
      if (e.hp <= 0) {
        killEnemy(e);
      }
    }
  });
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
