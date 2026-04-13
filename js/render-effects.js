'use strict';

const ambientParticles = [];
const AMBIENT_MAX = 15;

function updateAmbientParticles() {
  if (currentMap === 'town') { ambientParticles.length = 0; return; }
  while (ambientParticles.length < AMBIENT_MAX) {
    const isDungeon = currentMap === 'dungeon';
    ambientParticles.push({
      x: cameraX + Math.random() * cw(),
      y: cameraY + Math.random() * ch(),
      vx: (Math.random() - 0.5) * 0.3,
      vy: isDungeon ? -0.15 - Math.random() * 0.25 : 0.08 + Math.random() * 0.15,
      size: 1 + Math.random() * 2,
      life: 200 + Math.random() * 200,
      color: isDungeon ? '#f39c12' : '#a08050'
    });
  }
  for (let i = ambientParticles.length - 1; i >= 0; i--) {
    const p = ambientParticles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0 || p.x < cameraX - 50 || p.x > cameraX + cw() + 50) {
      ambientParticles.splice(i, 1);
    }
  }
}

function drawAmbientParticles() {
  for (const p of ambientParticles) {
    ctx.globalAlpha = Math.min(0.45, p.life / 80);
    ctx.fillStyle = p.color;
    const sx = p.x - cameraX + screenShake.x;
    const sy = p.y - cameraY + screenShake.y;
    if (currentMap === 'dungeon') {
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 0.7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(sx, sy, p.size, p.size * 1.5);
    }
  }
  ctx.globalAlpha = 1;
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

// ─── Rendering ────────────────────────────────────────────────────────────────

function drawEnemyEffects() {
  enemyEffects.forEach(effect => {
    const sx = effect.x - cameraX + screenShake.x;
    const sy = effect.y - cameraY + screenShake.y;

    if (effect.kind === 'warning') {
      const pct = Math.max(0, effect.timer / effect.maxTimer);
      ctx.save();
      ctx.globalAlpha = 0.18 + (1 - pct) * 0.22;
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(sx, sy, effect.radius * (0.92 + (1 - pct) * 0.08), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (effect.label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(effect.label, sx, sy - effect.radius - 8);
      }
      ctx.restore();
    } else if (effect.kind === 'projectile') {
      ctx.save();
      ctx.fillStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(sx, sy, effect.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (effect.kind === 'slash') {
      const pct = effect.timer / effect.maxTimer;
      ctx.save();
      ctx.globalAlpha = pct * 0.9;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3 * pct;
      ctx.beginPath();
      ctx.arc(sx, sy, 18 + (1 - pct) * 8, effect.angle - 0.9, effect.angle + 0.9);
      ctx.stroke();
      ctx.restore();
    } else if (effect.kind === 'charge') {
      const pct = Math.max(0, effect.timer / effect.maxTimer);
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = effect.color;
      ctx.beginPath();
      ctx.arc(sx, sy, effect.radius + (1 - pct) * 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + effect.dirX * 28, sy + effect.dirY * 28);
      ctx.stroke();
      if (effect.label) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(effect.label, sx, sy - effect.radius - 10);
      }
      ctx.restore();
    }
  });
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / 50;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(p.x - cameraX + screenShake.x - p.size/2,
                 p.y - cameraY + screenShake.y - p.size/2,
                 p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawDayNight() {
  let r = 0, g = 0, b = 0, a = 0;
  const dn = dayNight;
  if (dn < 0.3) {
    a = 0;
  } else if (dn < 0.5) {
    const t = (dn - 0.3) / 0.2;
    r = 180; g = 80; b = 20; a = t * 0.35;
  } else if (dn < 0.8) {
    const t = (dn - 0.5) / 0.3;
    r = 10; g = 10; b = 60; a = 0.35 + t * 0.2;
  } else {
    const t = (dn - 0.8) / 0.2;
    r = 180; g = 80; b = 20; a = (1 - t) * 0.35;
  }
  if (a > 0) {
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.fillRect(0, 0, cw(), ch());
  }
}

