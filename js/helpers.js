'use strict';

function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}

function tileAt(wx, wy) {
  const tx = Math.floor(wx / TILE);
  const ty = Math.floor(wy / TILE);
  const m = getMap();
  if (ty < 0 || ty >= mapH() || tx < 0 || tx >= mapW()) return TILE_WALL;
  return m[ty][tx];
}

function isSolid(tile) {
  return tile === TILE_WATER || tile === TILE_TREE || tile === TILE_WALL;
}

function resolveCollision(entity, nx, ny) {
  const hw = entity.w/2 + 2, hh = entity.h/2 + 2;

  let rx = nx, ry = ny;
  const txc = [nx - hw, nx + hw];
  const tyc = [entity.y - hh, entity.y + hh];
  let blockX = false;
  outer: for (let tx of txc) for (let ty of tyc) if (isSolid(tileAt(tx, ty))) { blockX = true; break outer; }
  if (blockX) rx = entity.x;

  let blockY = false;
  outer2: for (let tx2 of [rx - hw, rx + hw]) for (let ty of [ny - hh, ny + hh]) if (isSolid(tileAt(tx2, ty))) { blockY = true; break outer2; }
  if (blockY) ry = entity.y;

  return { x: rx, y: ry };
}

function addParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 1.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 30 + Math.random() * 20,
      size: 3 + Math.random() * 4,
    });
  }
  if (particles.length > 300) particles.splice(0, particles.length - 300);
}

function triggerShake(intensity) {
  screenShake.timer = Math.max(screenShake.timer, intensity);
}

function addDamageNumber(x, y, amount, type) {
  const colors = {
    normal: '#ffffff',
    critical: '#f1c40f',
    magic: '#c39bd3',
    heal: '#2ecc71',
    received: '#e74c3c',
  };
  const sizes = {
    normal: 14,
    critical: 20,
    magic: 16,
    heal: 16,
    received: 16,
  };
  const prefix = type === 'heal' ? '+' : (type === 'received' ? '-' : '');
  damageNumbers.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y - 20,
    text: prefix + Math.floor(amount),
    color: colors[type] || '#fff',
    timer: 60,
    vy: -1.5,
    size: sizes[type] || 14,
    isCrit: type === 'critical',
  });
  if (damageNumbers.length > 50) damageNumbers.splice(0, damageNumbers.length - 50);
}

function drawDamageNumbers() {
  damageNumbers.forEach(dn => {
    const sx = dn.x - cameraX + screenShake.x;
    const sy = dn.y - cameraY + screenShake.y;
    const alpha = Math.min(1, dn.timer / 20);
    const scale = dn.isCrit ? 1 + (60 - dn.timer) * 0.01 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.floor(dn.size * scale)}px sans-serif`;
    ctx.textAlign = 'center';

    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(dn.text, sx, sy);

    ctx.fillStyle = dn.color;
    ctx.fillText(dn.text, sx, sy);

    ctx.restore();
  });
}

// ─── Kill Enemy Helper ───────────────────────────────────────────────────────
