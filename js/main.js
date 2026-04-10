'use strict';

// ─── Landscape Lock ──────────────────────────────────────────────────────────
const rotateNotice = document.getElementById('rotate-notice');
function checkOrientation() {
  const isPortrait = window.innerHeight > window.innerWidth;
  rotateNotice.style.display = isPortrait ? 'flex' : 'none';
}
window.addEventListener('resize', checkOrientation);
checkOrientation();
try { screen.orientation.lock('landscape').catch(()=>{}); } catch(e) {}

// ─── Fullscreen on tap ──────────────────────────────────────────────────────
const fsBtn = document.getElementById('fullscreen-btn');
let firstInteractionBooted = false;
function bootstrapInteraction() {
  if (firstInteractionBooted) return;
  firstInteractionBooted = true;
  AudioSystem.init();
  AudioSystem.ensureCtx();
  AudioSystem.startBgm(currentMap === 'dungeon' ? 'dungeon' : currentMap);
}
function dismissStartHint() {
  fsBtn.style.display = 'none';
}
function goFullscreen(e) {
  if (e) e.preventDefault();
  bootstrapInteraction();
  dismissStartHint();
  const el = document.documentElement;
  const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (rfs) {
    try {
      const p = rfs.call(el);
      if (p && p.then) p.then(()=>{
        try { screen.orientation.lock('landscape').catch(()=>{}); } catch(e2) {}
      }).catch(()=>{});
    } catch(e2) {}
  }
}
fsBtn.addEventListener('touchstart', goFullscreen, { passive: false });
fsBtn.addEventListener('click', goFullscreen);
window.addEventListener('touchstart', bootstrapInteraction, { passive: true, once: true });
window.addEventListener('click', bootstrapInteraction, { once: true });
setTimeout(() => {
  if (!firstInteractionBooted) dismissStartHint();
}, 1200);

// ─── Canvas Setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');
const MINIMAP_SIZE = 72;

minimapCanvas.width = MINIMAP_SIZE;
minimapCanvas.height = MINIMAP_SIZE;

let dpr = 1;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // minimap
  const mmSize = Math.round(MINIMAP_SIZE * dpr);
  minimapCanvas.width = mmSize;
  minimapCanvas.height = mmSize;
  minimapCanvas.style.width = MINIMAP_SIZE + 'px';
  minimapCanvas.style.height = MINIMAP_SIZE + 'px';
  mmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);
function cw() { return Math.round(canvas.width / dpr); }
function ch() { return Math.round(canvas.height / dpr); }

// ─── Constants ────────────────────────────────────────────────────────────────

function update(dt) {
  if (player.dead) return;
  if (invOpen || shopOpen || menuOpen || settingsOpen || dialogueOpen || profileOpen || companionPanelOpen || skillPanelOpen || questPanelOpen || villagePanelOpen) return;

  // Day/night cycle
  // Day/night cycle disabled - always daytime
  // dayNight += 0.0002 * dayNightDir;
  // if (dayNight >= 1) { dayNight = 1; dayNightDir = -1; }
  // if (dayNight <= 0) { dayNight = 0; dayNightDir = 1; }

  // Screen shake decay
  if (screenShake.timer > 0) {
    screenShake.timer -= dt * 60 / 1000;
    const mag = screenShake.timer * 0.5;
    screenShake.x = (Math.random() - 0.5) * mag;
    screenShake.y = (Math.random() - 0.5) * mag;
  } else {
    screenShake.x = 0; screenShake.y = 0;
  }

  // Attack timer
  if (player.attackTimer > 0) player.attackTimer -= dt;
  if (player.isAttacking) {
    player.attackArc += dt * 0.012;
    if (player.attackArc >= 1) player.isAttacking = false;
  }
  if (player.invincible > 0) player.invincible -= dt;

  // MP regen
  if (player.mp < player.maxMp) {
    player.mp = Math.min(player.maxMp, player.mp + 0.008 * dt);
    hudDirty = true;
  }

  // Skill cooldowns
  Object.keys(skillCooldowns).forEach(id => {
    if (skillCooldowns[id] > 0) {
      skillCooldowns[id] = Math.max(0, skillCooldowns[id] - dt);
      skillSlotsDirty = true;
    }
  });

  // Buff timers
  Object.keys(skillBuffs).forEach(id => {
    if (skillBuffs[id].timer > 0) {
      skillBuffs[id].timer = Math.max(0, skillBuffs[id].timer - dt);
    }
  });

  renderSkillSlots();

  // Movement
  let moveX = 0, moveY = 0;
  if (joyActive) {
    if (Math.abs(joyDx) > JOY_DEAD) moveX = joyDx;
    if (Math.abs(joyDy) > JOY_DEAD) moveY = joyDy;
  }
  if (keys['ArrowLeft'] || keys['a']) moveX = -1;
  if (keys['ArrowRight'] || keys['d']) moveX = 1;
  if (keys['ArrowUp'] || keys['w']) moveY = -1;
  if (keys['ArrowDown'] || keys['s']) moveY = 1;

  const mag = Math.sqrt(moveX*moveX + moveY*moveY);
  if (mag > 1) { moveX /= mag; moveY /= mag; }

  const spd = playerSpeed() * 1.8;
  const nx = player.x + moveX * spd;
  const ny = player.y + moveY * spd;

  if (moveX !== 0 || moveY !== 0) {
    const pos = resolveCollision(player, nx, ny);
    player.x = pos.x;
    player.y = pos.y;

    if (Math.abs(moveX) > Math.abs(moveY)) {
      player.dir = moveX > 0 ? 0 : 1;
    } else {
      player.dir = moveY > 0 ? 3 : 2;
    }

    player.frameTimer += dt;
    if (player.frameTimer > 200) {
      player.frameTimer = 0;
      player.frame = 1 - player.frame;
    }

    // Tier 6+ particle trail when moving
    if (player.tier >= 6 && Math.random() < 0.3) {
      const tierInfo = getCurrentTier();
      addParticles(player.x + (Math.random()-0.5)*10, player.y + (Math.random()-0.5)*10, tierInfo.color, 1);
    }
  }

  // Check map edge transitions (walking onto EXIT tiles)
  const ptx = Math.floor(player.x / TILE);
  const pty = Math.floor(player.y / TILE);
  const ptile = getMap()[pty] && getMap()[pty][ptx];
  if (ptile === TILE_EXIT || ptile === TILE_PORTAL) {
    // Auto-transition for EXIT tiles when walking on them
    if (ptile === TILE_EXIT) {
      if (currentMap === 'town') { enterField(); return; }
      else if (currentMap === 'field') { enterTown(); return; }
      else if (currentMap === 'dungeon') { exitDungeon(); return; }
    }
  }

  // Attack input
  if (attackQueued || keys[' '] || keys['z']) {
    let handled = false;
    if (currentMap === 'town') {
      // Check shop NPCs
      for (const npc of NPCS) {
        const nd = Math.sqrt((player.x - npc.x)**2 + (player.y - npc.y)**2);
        if (nd < 50) {
          openShop(npc);
          attackQueued = false;
          handled = true;
          break;
        }
      }
      // Check town NPCs (dialogue or temple)
      if (!handled) {
        for (const npc of TOWN_NPCS) {
          const nd = Math.sqrt((player.x - npc.x)**2 + (player.y - npc.y)**2);
          if (nd < 50) {
            if (npc.isTemple) {
              openTemple();
            } else {
              openDialogue(npc);
            }
            attackQueued = false;
            handled = true;
            break;
          }
        }
      }
    }
    if (!handled && currentMap === 'field') {
      if (ptile === TILE_PORTAL) {
        checkPortal();
        attackQueued = false;
        handled = true;
      }
    }
    if (!handled) {
      doAttack();
      attackQueued = false;
    }
  }

  if (keys['e']) {
    if (currentMap === 'town') {
      for (const npc of NPCS) {
        const nd = Math.sqrt((player.x - npc.x)**2 + (player.y - npc.y)**2);
        if (nd < 50) { openShop(npc); break; }
      }
    }
    checkPortal();
  }

  // Item pickup
  droppedItems = droppedItems.filter(di => {
    di.timer -= dt * 0.001;
    if (di.timer <= 0) return false;
    const d2 = dist(player, di);
    if (d2 < 35) {
      inventory.push(di.itemId);
      addParticles(di.x, di.y, ITEMS[di.itemId].color, 6);
      showPickupText(ITEMS[di.itemId].name);
      AudioSystem.sfx.pickup();
      autoSave();
      return false;
    }
    return true;
  });

  // Camera
  const camTargetX = player.x - cw() / 2;
  const camTargetY = player.y - ch() / 2;
  cameraX += (camTargetX - cameraX) * 0.3;
  cameraY += (camTargetY - cameraY) * 0.3;
  const maxCamX = mapW() * TILE - cw();
  const maxCamY = mapH() * TILE - ch();
  cameraX = Math.max(0, Math.min(maxCamX, cameraX));
  cameraY = Math.max(0, Math.min(maxCamY, cameraY));

  // Update companion
  updateCompanion(dt);

  // Update enemies
  enemies.forEach(e => {
    if (e.dead) return;
    const d = dist(player, e);

    if (e.flashTimer > 0) e.flashTimer--;
    if (e.attackTimer > 0) e.attackTimer -= dt;
    if (e.isBoss && e.specialTimer > 0) e.specialTimer -= dt;

    e.frameTimer += dt;
    if (e.frameTimer > 300) { e.frameTimer = 0; e.frame = 1 - e.frame; }

    if (e.hitStun > 0) {
      e.hitStun -= dt;
      const pos = resolveCollision(e, e.x + e.knockbackVx, e.y + e.knockbackVy);
      e.x = pos.x; e.y = pos.y;
      e.knockbackVx *= 0.86;
      e.knockbackVy *= 0.86;
      return;
    }

    if (e.state === 'wander') {
      e.wanderTimer -= dt;
      if (e.wanderTimer <= 0) {
        e.wanderTimer = 1000 + Math.random() * 2000;
        const angle = Math.random() * Math.PI * 2;
        e.wanderDx = Math.cos(angle) * e.speed * 0.5;
        e.wanderDy = Math.sin(angle) * e.speed * 0.5;
      }
      const ex = e.x + e.wanderDx;
      const ey = e.y + e.wanderDy;
      const pos = resolveCollision(e, ex, ey);
      e.x = pos.x; e.y = pos.y;
      if (d < e.aggroRange) e.state = 'chase';
    } else if (e.state === 'chase') {
      if (d > e.aggroRange * 1.35) {
        e.state = 'wander';
        e.attackWindup = 0;
        return;
      }
      if (e.isBoss && e.specialTimer <= 0 && d < 220) {
        queueBossSpecial(e);
        e.specialTimer = e.specialCooldown;
      }
      if (d > e.attackRange + 8) {
        e.attackWindup = 0;
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        const ex2 = e.x + Math.cos(angle) * e.speed * 1.55;
        const ey2 = e.y + Math.sin(angle) * e.speed * 1.55;
        const pos = resolveCollision(e, ex2, ey2);
        e.x = pos.x; e.y = pos.y;
      } else {
        if (e.attackWindup > 0) {
          e.attackWindup -= dt;
          if (d > e.attackRange + 18) {
            e.attackWindup = 0;
          } else if (e.attackWindup <= 0) {
            e.attackTimer = e.attackCooldown;
            performEnemyAttack(e);
          }
        } else if (e.attackTimer <= 0) {
          e.attackWindup = e.isBoss ? 420 : 240;
        }
      }
    }
  });

  updateEnemyEffects(dt);

  enemies = enemies.filter(e => !e.dead || e.flashTimer > 0);

  // Safety net: re-check dungeon clear after dead enemies are fully removed
  if (currentMap === 'dungeon' && !dungeonCleared) {
    checkDungeonClear();
  }

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.9;
    p.vy *= 0.9;
    p.vy += 0.08;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  damageNumbers.forEach(dn => {
    dn.y += dn.vy;
    dn.vy *= 0.96;
    dn.timer--;
  });
  damageNumbers = damageNumbers.filter(dn => dn.timer > 0);

  if (typeof updateQuestRealtimeStatus === 'function') updateQuestRealtimeStatus();
  updateHUD();
}

// ─── Companion Update ────────────────────────────────────────────────────────

const loaded = loadSave();
if (loaded) {
  // Recalculate tier from level in case save is from before tier system
  const calcTier = getCurrentTier();
  if (calcTier.tier > player.tier) player.tier = calcTier.tier;
  // data loaded silently
}

spawnEnemies();
updateHUD();
renderSkillSlots();
bootstrapInteraction();

if (currentMap === 'town') { showAreaLabel('마을'); AudioSystem.startBgm('town'); }
else if (currentMap === 'field') { showAreaLabel('필드'); AudioSystem.startBgm('field'); }
else if (currentMap === 'dungeon') {
  const info = currentDungeonId >= 0 ? DUNGEON_INFO[currentDungeonId] : null;
  showAreaLabel(info ? info.name : '던전');
  AudioSystem.startBgm('dungeon');
}

function gameLoop(ts) {
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;
  tickAutoSave(dt);
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((ts) => {
  lastTime = ts;
  gameLoop(ts);
});

// Prevent context menu on long press
window.addEventListener('contextmenu', e => e.preventDefault());

