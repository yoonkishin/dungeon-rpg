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
// Auto-dismiss quickly — any interaction hides it
setTimeout(() => {
  if (!firstInteractionBooted) dismissStartHint();
}, 800);

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

// ─── Update Sub-systems ─────────────────────────────────────────────────────
function updateTimers(dt) {
  if (screenShake.timer > 0) {
    screenShake.timer -= dt * 60 / 1000;
    const mag = screenShake.timer * 0.5;
    screenShake.x = (Math.random() - 0.5) * mag;
    screenShake.y = (Math.random() - 0.5) * mag;
  } else {
    screenShake.x = 0; screenShake.y = 0;
  }

  if (player.attackTimer > 0) player.attackTimer -= dt;
  if (player.isAttacking) {
    player.attackArc += dt * 0.012;
    if (player.attackArc >= 1) player.isAttacking = false;
  }
  if (player.invincible > 0) player.invincible -= dt;

  if (player.mp < player.maxMp) {
    player.mp = Math.min(player.maxMp, player.mp + 0.008 * dt);
    hudDirty = true;
  }

  for (const id in skillCooldowns) {
    if (skillCooldowns[id] > 0) {
      skillCooldowns[id] = Math.max(0, skillCooldowns[id] - dt);
      skillSlotsDirty = true;
    }
  }
  for (const id in skillBuffs) {
    if (skillBuffs[id].timer > 0) {
      skillBuffs[id].timer = Math.max(0, skillBuffs[id].timer - dt);
    }
  }
  if (skillSlotsDirty) renderSkillSlots();
}

function updateMovement(dt) {
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

    if (player.tier >= 6 && Math.random() < 0.3) {
      const tierInfo = getCurrentTier();
      addParticles(player.x + (Math.random()-0.5)*10, player.y + (Math.random()-0.5)*10, tierInfo.color, 1);
    }
  }

  return typeof tryHandleExitTileTransition === 'function' ? tryHandleExitTileTransition() : false;
}

function updateInput() {
  if (attackQueued || keys[' '] || keys['z']) {
    const handled = typeof tryHandlePrimaryContextAction === 'function' && tryHandlePrimaryContextAction();
    if (!handled) {
      doAttack();
    }
    attackQueued = false;
  }

  if (keys['e']) {
    if (typeof tryHandleInteractKeyAction !== 'function' || !tryHandleInteractKeyAction()) {
      checkPortal();
    }
  }
}

function updatePickups(dt) {
  droppedItems = droppedItems.filter(di => {
    di.timer -= dt * 0.001;
    if (di.timer <= 0) return false;
    if (dist(player, di) < 35) {
      inventory.push(createItemInstance(di.itemId));
      addParticles(di.x, di.y, ITEMS[di.itemId].color, 6);
      showPickupText(ITEMS[di.itemId].name);
      AudioSystem.sfx.pickup();
      requestAutoSave();
      return false;
    }
    return true;
  });
}

function updateCamera() {
  const camTargetX = player.x - cw() / 2;
  const camTargetY = player.y - ch() / 2;
  cameraX += (camTargetX - cameraX) * 0.3;
  cameraY += (camTargetY - cameraY) * 0.3;
  cameraX = Math.max(0, Math.min(mapW() * TILE - cw(), cameraX));
  cameraY = Math.max(0, Math.min(mapH() * TILE - ch(), cameraY));
}


function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.9; p.vy *= 0.9; p.vy += 0.08;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);

  damageNumbers.forEach(dn => {
    dn.y += dn.vy; dn.vy *= 0.96; dn.timer--;
  });
  damageNumbers = damageNumbers.filter(dn => dn.timer > 0);
}

// ─── Main Update ────────────────────────────────────────────────────────────
function update(dt) {
  if (hitFreezeFrames > 0) { hitFreezeFrames--; return; }
  if (player.dead) return;
  if (typeof isAnyPanelOpen === 'function' && isAnyPanelOpen()) return;

  updateTimers(dt);
  if (updateMovement(dt)) return;
  updateInput();
  updatePickups(dt);
  updateCamera();
  updateCompanion(dt);
  updateEnemyAI(dt);
  updateParticles();
  if (typeof updateSkillEffects === 'function') updateSkillEffects(dt);
  if (typeof updatePlayerProjectiles === 'function') updatePlayerProjectiles(dt);
  if (typeof updateAmbientParticles === 'function') updateAmbientParticles();
  if (typeof updateQuestRealtimeStatus === 'function') updateQuestRealtimeStatus();
  if (hudDirty) updateHUD();
}

// ─── Companion Update ────────────────────────────────────────────────────────

const loaded = loadSave();
if (loaded) {
  syncPlayerGrowthState();
  // data loaded silently
} else {
  syncPlayerGrowthState();
}
if (typeof normalizeCommanderState === 'function') normalizeCommanderState();

spawnEnemies();
updateHUD();
renderSkillSlots();
bootstrapInteraction();

if (currentMap === 'town') { showAreaLabel('마을'); AudioSystem.startBgm('town'); }
else if (currentMap === 'field') { showAreaLabel('필드'); AudioSystem.startBgm('field'); }
else if (currentMap === 'dungeon') {
  const info = currentDungeonId >= 0 ? DUNGEON_INFO[currentDungeonId] : null;
  const emblem = typeof getCurrentEmblemTrialDef === 'function' ? getCurrentEmblemTrialDef() : null;
  showAreaLabel(emblem ? (emblem.name + ' 시험') : (info ? info.name : '던전'));
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

