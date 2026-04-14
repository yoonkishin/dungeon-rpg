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

function drawSkillEffects() {
  skillEffects.forEach(fx => {
    const sx = fx.x - cameraX + screenShake.x;
    const sy = fx.y - cameraY + screenShake.y;
    const pct = Math.max(0, fx.timer / fx.maxTimer);
    const pulse = 0.5 + 0.5 * Math.sin((1 - pct) * Math.PI);

    ctx.save();
    if (fx.glow) { ctx.shadowColor = fx.glow; ctx.shadowBlur = 20; }
    ctx.strokeStyle = fx.color;
    ctx.fillStyle = fx.color;

    if (fx.kind === 'projectile') {
      const cx = (fx.cx ?? fx.x) - cameraX + screenShake.x;
      const cy = (fx.cy ?? fx.y) - cameraY + screenShake.y;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(cx, cy, fx.size || 12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(cx, cy, (fx.size || 12) * 1.6, 0, Math.PI * 2); ctx.fill();
    } else if (fx.kind === 'ring') {
      ctx.globalAlpha = pct * 0.8;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius * (1 + (1 - pct) * 0.8), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = pct * 0.3;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius * (1 + (1 - pct) * 0.8), 0, Math.PI * 2); ctx.fill();
    } else if (fx.kind === 'aura') {
      ctx.globalAlpha = 0.25 + pulse * 0.3;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius + pulse * 6, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius + pulse * 6, 0, Math.PI * 2); ctx.fill();
    } else if (fx.kind === 'arc') {
      ctx.globalAlpha = pct * 0.95;
      ctx.lineWidth = 6;
      const spread = 1.0;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius * (0.8 + (1 - pct) * 0.4), fx.angle - spread, fx.angle + spread); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.globalAlpha = pct * 0.5;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius * (1.0 + (1 - pct) * 0.3), fx.angle - spread * 0.7, fx.angle + spread * 0.7); ctx.stroke();
    } else if (fx.kind === 'barrier') {
      ctx.globalAlpha = 0.35 + pulse * 0.25;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, sy, fx.radius, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (1 - pct) * Math.PI * 2 + i * Math.PI / 3;
        const rx = sx + Math.cos(a) * fx.radius;
        const ry = sy + Math.sin(a) * fx.radius;
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
      }
    } else if (fx.kind === 'cloud') {
      ctx.globalAlpha = pct * 0.45;
      for (let i = 0; i < 5; i++) {
        const a = (1 - pct) * Math.PI * 1.5 + i * (Math.PI * 2 / 5);
        const r = fx.radius * (0.5 + 0.3 * Math.sin((1 - pct) * Math.PI * 2 + i));
        ctx.beginPath(); ctx.arc(sx + Math.cos(a) * r * 0.5, sy + Math.sin(a) * r * 0.5, fx.radius * 0.45, 0, Math.PI * 2); ctx.fill();
      }
    } else if (fx.kind === 'bolt') {
      ctx.globalAlpha = pct;
      ctx.lineWidth = 4;
      ctx.beginPath();
      let bx = sx, by = sy - 200;
      ctx.moveTo(bx, by);
      for (let i = 1; i <= 6; i++) {
        bx = sx + (Math.random() - 0.5) * 16;
        by = sy - 200 + (200 / 6) * i;
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.globalAlpha = pct * 0.6;
      ctx.beginPath(); ctx.arc(sx, sy, 14 + (1 - pct) * 8, 0, Math.PI * 2); ctx.fill();
    } else if (fx.kind === 'beam') {
      const ex = fx.tx - cameraX + screenShake.x;
      const ey = fx.ty - cameraY + screenShake.y;
      ctx.globalAlpha = pct * 0.85;
      ctx.lineWidth = 4 + pulse * 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.lineWidth = 2;
      ctx.globalAlpha = pct * 0.4;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex, ey, 8, 0, Math.PI * 2); ctx.fill();
    } else if (fx.kind === 'whirl') {
      ctx.globalAlpha = pct * 0.75;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const off = (1 - pct) * Math.PI * 4 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(sx, sy, fx.radius * (0.6 + i * 0.2), off, off + Math.PI * 1.1);
        ctx.stroke();
      }
    } else if (fx.kind === 'meteor') {
      const fall = Math.max(0, fx.timer - fx.maxTimer * 0.35);
      if (fall > 0) {
        const fp = fall / (fx.maxTimer * 0.65);
        const fy = sy - 260 * fp;
        ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.arc(sx, fy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx, fy); ctx.lineTo(sx, fy - 36); ctx.stroke();
      } else {
        const ip = 1 - fx.timer / (fx.maxTimer * 0.35);
        ctx.globalAlpha = (1 - ip) * 0.9;
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(sx, sy, 20 + ip * 60, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = (1 - ip) * 0.4;
        ctx.beginPath(); ctx.arc(sx, sy, 20 + ip * 60, 0, Math.PI * 2); ctx.fill();
      }
    } else if (fx.kind === 'hex') {
      ctx.globalAlpha = 0.4 + pulse * 0.3;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (1 - pct) * Math.PI + i * Math.PI / 3;
        const rx = sx + Math.cos(a) * fx.radius;
        const ry = sy + Math.sin(a) * fx.radius;
        if (i === 0) ctx.moveTo(rx, ry); else ctx.lineTo(rx, ry);
      }
      ctx.closePath(); ctx.stroke();
    }

    ctx.restore();
  });
  ctx.globalAlpha = 1;
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

