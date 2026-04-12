'use strict';

const drawBuffer = [];
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
function drawTile(tx, ty, tile) {
  const sx = tx * TILE - cameraX + screenShake.x;
  const sy = ty * TILE - cameraY + screenShake.y;
  const pal = AREA_PALETTE[currentMap] || AREA_PALETTE.field;

  if (tile === TILE_GRASS) {
    const hash = (tx * 7 + ty * 13) & 3;
    ctx.fillStyle = hash === 0 ? pal.grass : pal.grassAlt[hash - 1];
    ctx.fillRect(sx, sy, TILE, TILE);
    const h2 = (tx * 31 + ty * 17) % 7;
    if (h2 < 2) {
      ctx.fillStyle = 'rgba(0,60,0,0.18)';
      ctx.fillRect(sx + ((h2 * 11 + 5) % 28) + 4, sy + ((h2 * 17 + 3) % 26) + 6, 2, 4);
    }
    if ((tx * 3 + ty * 11) % 9 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(sx + 16, sy + 22, 3, 3);
    }
  } else if (tile === TILE_WALL) {
    ctx.fillStyle = pal.wall;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = pal.wallHighlight;
    ctx.fillRect(sx, sy, TILE, 2);
    ctx.fillStyle = pal.wallShadow;
    ctx.fillRect(sx, sy + TILE - 4, TILE, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(sx + TILE - 2, sy + 2, 2, TILE - 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 3, sy + 3, TILE - 6, TILE / 2 - 3);
    ctx.strokeRect(sx + TILE / 4, sy + TILE / 2 + 1, TILE / 2, TILE / 2 - 5);
  } else {
    ctx.fillStyle = TILE_COLORS[tile] || '#333';
    ctx.fillRect(sx, sy, TILE, TILE);
  }

  if (tile === TILE_TREE) {
    ctx.fillStyle = '#145214';
    ctx.fillRect(sx+4, sy+4, TILE-8, TILE-8);
    ctx.fillStyle = '#1e7a1e';
    ctx.beginPath();
    ctx.arc(sx + TILE/2, sy + TILE/2, TILE/2 - 4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#8b6040';
    ctx.fillRect(sx + TILE/2-3, sy + TILE-8, 6, 8);
  } else if (tile === TILE_WATER) {
    const shimmer = (Math.sin(Date.now() * 0.002 + tx * 0.5 + ty * 0.7) + 1) * 0.5;
    ctx.fillStyle = `rgba(100,180,255,${shimmer * 0.15})`;
    ctx.fillRect(sx, sy, TILE, TILE);
  } else if (tile === TILE_PORTAL) {
    ctx.fillStyle = `rgba(200,100,255,${0.5 + Math.sin(Date.now() * 0.004) * 0.3})`;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#fff';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', sx + TILE/2, sy + TILE/2 + 6);
  } else if (tile === TILE_EXIT) {
    ctx.fillStyle = `rgba(50,200,100,${0.5 + Math.sin(Date.now() * 0.004) * 0.3})`;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#fff';
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑', sx + TILE/2, sy + TILE/2 + 6);
  } else if (tile === TILE_DIRT) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    if ((tx * 7 + ty * 3) % 5 === 0) ctx.fillRect(sx+8, sy+8, 4, 4);
    if ((tx * 3 + ty * 11) % 7 === 0) ctx.fillRect(sx+24, sy+20, 3, 3);
  } else if (tile === TILE_WALL) {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx+1, sy+1, TILE-2, TILE-2);
  } else if (tile === TILE_FLOOR) {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    if ((tx + ty) % 2 === 0) ctx.fillRect(sx, sy, TILE, TILE);
  } else if (tile === TILE_STONE) {
    // Building walls
    ctx.fillStyle = '#8a7d6b';
    ctx.fillRect(sx, sy, TILE, TILE);
    // Brick pattern
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 2, sy + 2, TILE / 2 - 2, TILE / 2 - 2);
    ctx.strokeRect(sx + TILE / 2 + 1, sy + 2, TILE / 2 - 3, TILE / 2 - 2);
    ctx.strokeRect(sx + TILE / 4, sy + TILE / 2 + 1, TILE / 2, TILE / 2 - 3);
    // Side shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(sx + TILE - 3, sy, 3, TILE);
    // Bottom shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(sx, sy + TILE - 3, TILE, 3);
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(sx, sy, TILE, 2);
    // Window
    const m = getMap();
    ctx.fillStyle = '#3a3520';
    ctx.fillRect(sx + 12, sy + 8, 16, 12);
    ctx.fillStyle = '#5a7a9a';
    ctx.fillRect(sx + 13, sy + 9, 14, 10);
    ctx.strokeStyle = '#3a3520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 20, sy + 9); ctx.lineTo(sx + 20, sy + 19);
    ctx.moveTo(sx + 13, sy + 14); ctx.lineTo(sx + 27, sy + 14);
    ctx.stroke();
    // Window light glow
    ctx.fillStyle = 'rgba(255,220,120,0.15)';
    ctx.fillRect(sx + 13, sy + 9, 14, 10);
    // Roof: only if tile above is not TILE_STONE
    const above = m[ty - 1] && m[ty - 1][tx];
    if (above !== TILE_STONE) {
      ctx.fillStyle = '#6b3a2a';
      ctx.fillRect(sx - 3, sy - 4, TILE + 6, 7);
      ctx.fillStyle = '#5a2e1e';
      ctx.fillRect(sx - 3, sy - 4, TILE + 6, 2);
      ctx.fillStyle = '#7a4a38';
      ctx.fillRect(sx - 3, sy + 1, TILE + 6, 2);
    }
    // Door: only if tile below is not TILE_STONE
    const below = m[ty + 1] && m[ty + 1][tx];
    if (below !== TILE_STONE) {
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(sx + 14, sy + TILE - 16, 12, 16);
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(sx + 14, sy + TILE - 16, 12, 2);
      ctx.fillStyle = '#c8a040';
      ctx.fillRect(sx + 23, sy + TILE - 9, 2, 2);
    }
  }
}

function drawMap() {
  const startX = Math.max(0, Math.floor(cameraX / TILE) - 1);
  const startY = Math.max(0, Math.floor(cameraY / TILE) - 1);
  const endX = Math.min(mapW(), startX + Math.ceil(cw() / TILE) + 2);
  const endY = Math.min(mapH(), startY + Math.ceil(ch() / TILE) + 2);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      drawTile(x, y, getMap()[y][x]);
    }
  }

  // Draw dungeon portal labels in field
  if (currentMap === 'field') {
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    DUNGEON_INFO.forEach(dl => {
      const sx = dl.portalX * TILE - cameraX + screenShake.x + TILE;
      const sy = dl.portalY * TILE - cameraY + screenShake.y - 8;
      if (sx > -100 && sx < cw() + 100 && sy > -50 && sy < ch() + 50) {
        const labelW = dl.name.length * 8 + 12;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(sx - labelW/2, sy - 8, labelW, 16);
        ctx.fillStyle = dungeonsCleared.includes(dl.id) ? '#2ecc71' : '#e74c3c';
        ctx.fillText(dl.name, sx, sy + 3);
      }
    });
  }
}

function drawHpBar(x, y, hp, maxHp, w, color) {
  const bx = x - w/2;
  const by = y - 6;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(bx - 1, by - 1, w + 2, 6);
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, Math.max(0, w * hp/maxHp), 4);
}

function drawNPC(npc) {
  const nx = npc.x - cameraX + screenShake.x;
  const ny = npc.y - cameraY + screenShake.y;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(nx, ny + 12, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#3a3020';
  ctx.fillRect(nx - 5, ny + 4, 4, 8);
  ctx.fillRect(nx + 1, ny + 4, 4, 8);

  // Body (small torso)
  ctx.fillStyle = npc.color;
  ctx.fillRect(nx - 8, ny - 4, 16, 10);

  // Arms
  ctx.fillRect(nx - 11, ny - 2, 3, 8);
  ctx.fillRect(nx + 8, ny - 2, 3, 8);

  // Head (round, chibi)
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(nx, ny - 10, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hat
  ctx.fillStyle = npc.hat;
  ctx.beginPath();
  ctx.arc(nx, ny - 13, 10, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.fillRect(nx - 12, ny - 17, 24, 5);

  // Eyes
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(nx - 4, ny - 11, 3, 3);
  ctx.fillRect(nx + 1, ny - 11, 3, 3);
  ctx.fillStyle = '#fff';
  ctx.fillRect(nx - 3, ny - 11, 1, 1);
  ctx.fillRect(nx + 2, ny - 11, 1, 1);

  // Name label
  const labelW = npc.name.length * 8 + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(nx - labelW / 2, ny - 32, labelW, 14);
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, nx, ny - 21);

  // Interaction prompt (!) when player is nearby
  const d = dist(player, npc);
  if (d < 55) {
    const bob = Math.sin(Date.now() * 0.005) * 2;
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('!', nx, ny - 38 + bob);
  }
}

function drawPlayer() {
  const sx = player.x - cameraX + screenShake.x;
  const sy = player.y - cameraY + screenShake.y;
  const tierInfo = getCurrentTier();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 12, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.invincible > 0 && Math.floor(player.invincible / 80) % 2 === 0) return;

  const bodyY = sy + 2;
  const headY = sy - 10;
  const headR = 11 + Math.min(player.tier - 1, 3);

  // Legs (animated)
  const legOff = player.frame === 0 ? 3 : -3;
  ctx.fillStyle = '#1a252f';
  ctx.fillRect(sx - 6, bodyY + 4, 5, 8 + legOff);
  ctx.fillRect(sx + 1, bodyY + 4, 5, 8 - legOff);

  // Body (small torso)
  if (player.tier >= 4) {
    ctx.save();
    ctx.shadowColor = tierInfo.color;
    ctx.shadowBlur = 8 + Math.sin(Date.now() * 0.003) * 4;
    ctx.fillStyle = tierInfo.bodyColor;
    ctx.fillRect(sx - 8, bodyY - 6, 16, 12);
    ctx.restore();
  } else {
    ctx.fillStyle = tierInfo.bodyColor;
    ctx.fillRect(sx - 8, bodyY - 6, 16, 12);
  }

  // Arms
  const armSwing = player.frame === 0 ? 2 : -2;
  ctx.fillStyle = tierInfo.bodyColor;
  ctx.fillRect(sx - 12, bodyY - 4 + armSwing, 4, 10);
  ctx.fillRect(sx + 8, bodyY - 4 - armSwing, 4, 10);

  // Head (round, chibi)
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(sx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#5a3825';
  ctx.beginPath();
  ctx.arc(sx, headY - 2, headR, Math.PI * 1.1, Math.PI * 1.9);
  ctx.fill();
  ctx.fillRect(sx - headR, headY - headR + 2, headR * 2, 5);

  // Eyes (directional)
  ctx.fillStyle = '#2c3e50';
  if (player.dir === 0) {
    ctx.fillRect(sx + 2, headY - 1, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + 3, headY - 1, 1, 1);
  } else if (player.dir === 1) {
    ctx.fillRect(sx - 5, headY - 1, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 4, headY - 1, 1, 1);
  } else if (player.dir === 2) {
    ctx.fillRect(sx - 4, headY - 2, 3, 3);
    ctx.fillRect(sx + 1, headY - 2, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 3, headY - 2, 1, 1);
    ctx.fillRect(sx + 2, headY - 2, 1, 1);
  } else {
    // facing down — no eyes visible, just hair
  }

  // Attack animation
  if (player.isAttacking) {
    const baseAngle = player.attackAngle;
    const swing = (player.attackArc - 0.5) * Math.PI * 0.9;
    const sAngle = baseAngle + swing;
    const sLen = 38;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(sAngle);
    ctx.fillStyle = '#d5d8dc';
    ctx.fillRect(10, -2, sLen, 5);
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(10, -1, sLen - 4, 3);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(8, -5, 6, 11);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, sLen + 5, baseAngle - Math.PI * 0.4, sAngle + 0.1);
    ctx.stroke();
    ctx.restore();
  }

  drawHpBar(sx, headY - headR - 6, player.hp, player.maxHp, 36, '#2ecc71');
}

function drawCompanion(cId, cs) {
  const info = getCompanionRoster(cId);
  if (!info) return;
  const profile = getCompanionProfile(cId);
  const unitType = profile ? profile.unitType : 'Infantry';
  const sx = cs.x - cameraX + screenShake.x;
  const sy = cs.y - cameraY + screenShake.y;
  const color = (cs.flashTimer > 0 && cs.flashTimer % 4 < 2) ? '#fff' : info.color;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 10, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body by unit type
  ctx.fillStyle = color;
  if (unitType === 'Infantry' || unitType === 'NavalUnit') {
    // Stocky body + shield
    ctx.fillRect(sx - 7, sy - 6, 14, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(sx - 10, sy - 4, 4, 8); // shield
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 10, sy - 4, 4, 8);
  } else if (unitType === 'Archer') {
    // Slim body + bow
    ctx.fillRect(sx - 5, sy - 6, 10, 12);
    ctx.strokeStyle = '#8b6040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx + 9, sy, 8, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 9, sy - 7); ctx.lineTo(sx + 9, sy + 7);
    ctx.stroke();
  } else if (unitType === 'Mage' || unitType === 'DarkPriest') {
    // Robe (trapezoid)
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 6);
    ctx.lineTo(sx + 5, sy - 6);
    ctx.lineTo(sx + 8, sy + 8);
    ctx.lineTo(sx - 8, sy + 8);
    ctx.closePath();
    ctx.fill();
    // Staff
    ctx.fillStyle = '#8b6040';
    ctx.fillRect(sx + 9, sy - 12, 2, 22);
    ctx.fillStyle = unitType === 'DarkPriest' ? '#e74c3c' : '#74b9ff';
    ctx.beginPath();
    ctx.arc(sx + 10, sy - 13, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (unitType === 'Priest' || unitType === 'Monk') {
    // Robe with cross/prayer beads
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 6);
    ctx.lineTo(sx + 5, sy - 6);
    ctx.lineTo(sx + 7, sy + 8);
    ctx.lineTo(sx - 7, sy + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(sx - 1, sy - 4, 2, 8);
    ctx.fillRect(sx - 3, sy - 1, 6, 2);
  } else if (unitType === 'Cavalry') {
    // Wide body + shoulder charge
    ctx.fillRect(sx - 8, sy - 5, 16, 11);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(sx - 10, sy - 5, 3, 5);
    ctx.fillRect(sx + 7, sy - 5, 3, 5);
  } else if (unitType === 'Lancer') {
    // Slim + spear
    ctx.fillRect(sx - 6, sy - 6, 12, 12);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(sx + 7, sy - 16, 2, 26);
    ctx.fillStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy - 18);
    ctx.lineTo(sx + 5, sy - 14);
    ctx.lineTo(sx + 11, sy - 14);
    ctx.closePath();
    ctx.fill();
  } else if (unitType === 'FlyingKnight') {
    // Small body + wings
    ctx.fillRect(sx - 5, sy - 5, 10, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    const wingFlap = Math.sin(Date.now() * 0.01) * 3;
    ctx.beginPath();
    ctx.moveTo(sx - 5, sy - 2);
    ctx.lineTo(sx - 14, sy - 8 + wingFlap);
    ctx.lineTo(sx - 5, sy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 5, sy - 2);
    ctx.lineTo(sx + 14, sy - 8 + wingFlap);
    ctx.lineTo(sx + 5, sy + 2);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillRect(sx - 7, sy - 7, 14, 14);
  }

  // Head (chibi round)
  ctx.fillStyle = (cs.flashTimer > 0 && cs.flashTimer % 4 < 2) ? '#fff' : '#f5cba7';
  ctx.beginPath();
  ctx.arc(sx, sy - 11, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#2c3e50';
  ctx.fillRect(sx - 3, sy - 12, 2, 2);
  ctx.fillRect(sx + 1, sy - 12, 2, 2);

  // HP bar
  const hpPct = cs.hp / cs.maxHp;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - 12, sy - 22, 24, 3);
  ctx.fillStyle = hpPct > 0.3 ? '#2ecc71' : '#e74c3c';
  ctx.fillRect(sx - 12, sy - 22, 24 * hpPct, 3);

  // Name label
  const labelW = info.name.length * 7 + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - labelW / 2, sy - 32, labelW, 12);
  ctx.fillStyle = '#7dd3fc';
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(info.name, sx, sy - 23);
}

function drawEnemyBody(sx, sy, e, color) {
  const shape = ENEMY_TYPES[e.typeIdx] ? ENEMY_TYPES[e.typeIdx].shape : 'humanoid';
  const hw = e.w / 2, hh = e.h / 2;

  if (shape === 'blob') {
    const bounce = Math.sin(Date.now() * 0.006 + e.x) * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(sx, sy + bounce, hw + 2, hh - 1 + bounce * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx - 3, sy - 4 + bounce, 4, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx - 4, sy - 2 + bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 4, sy - 2 + bounce, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(sx - 3, sy - 1 + bounce, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 5, sy - 1 + bounce, 1.5, 0, Math.PI * 2); ctx.fill();
    return;
  }

  if (shape === 'skeleton') {
    // thin body
    ctx.fillStyle = color;
    ctx.fillRect(sx - 5, sy - hh + 4, 10, e.h - 6);
    // round skull
    ctx.beginPath(); ctx.arc(sx, sy - hh, 8, 0, Math.PI * 2); ctx.fill();
    // hollow eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(sx - 5, sy - hh - 2, 4, 4);
    ctx.fillRect(sx + 1, sy - hh - 2, 4, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(sx - 4, sy - hh - 1, 2, 2);
    ctx.fillRect(sx + 2, sy - hh - 1, 2, 2);
    // ribs
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) ctx.strokeRect(sx - 4, sy - 4 + i * 5, 8, 3);
    // legs
    const legBob = e.frame * 2;
    ctx.fillStyle = color;
    ctx.fillRect(sx - 4, sy + hh - 5, 3, 5 + legBob);
    ctx.fillRect(sx + 1, sy + hh - 5, 3, 5 - legBob);
    return;
  }

  // Default body: rect
  ctx.fillStyle = color;
  ctx.fillRect(sx - hw, sy - hh, e.w, e.h);
  const legBob = e.frame * 2;

  if (shape === 'goblin') {
    // pointy ears
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(sx - hw - 3, sy - hh + 6); ctx.lineTo(sx - hw, sy - hh); ctx.lineTo(sx - hw, sy - hh + 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx + hw + 3, sy - hh + 6); ctx.lineTo(sx + hw, sy - hh); ctx.lineTo(sx + hw, sy - hh + 8); ctx.fill();
  } else if (shape === 'brute') {
    // wider shoulders
    ctx.fillRect(sx - hw - 3, sy - hh + 2, 3, 8);
    ctx.fillRect(sx + hw, sy - hh + 2, 3, 8);
    // tusks
    ctx.fillStyle = '#f5f0e0';
    ctx.fillRect(sx - 4, sy - hh + e.h * 0.45, 2, 4);
    ctx.fillRect(sx + 2, sy - hh + e.h * 0.45, 2, 4);
  } else if (shape === 'knight') {
    // shoulder pads
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(sx - hw - 2, sy - hh + 1, hw + 2, 5);
    ctx.fillRect(sx, sy - hh + 1, hw + 2, 5);
    // helmet visor
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx - 6, sy - hh + 3, 12, 4);
  }

  // eyes (non-blob, non-skeleton)
  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 5, sy - hh + 4, 4, 4);
  ctx.fillRect(sx + 1, sy - hh + 4, 4, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 4, sy - hh + 5, 2, 2);
  ctx.fillRect(sx + 2, sy - hh + 5, 2, 2);

  // legs
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(sx - hw, sy + hh - 5, hw - 1, 5 + legBob);
  ctx.fillRect(sx + 1, sy + hh - 5, hw - 1, 5 - legBob);
}

function drawEnemy(e) {
  const sx = e.x - cameraX + screenShake.x;
  const sy = e.y - cameraY + screenShake.y;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + e.h/2 - 2, e.w/2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hit flash
  let color = e.color;
  if (e.flashTimer > 0 && e.flashTimer % 4 < 2) color = '#fff';

  // Elite glow
  if (e.isElite) {
    ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - e.w/2 - 2, sy - e.h/2 - 2, e.w + 4, e.h + 4);
  }

  drawEnemyBody(sx, sy, e, color);

  // Name tag (above HP bar)
  const namePrefix = e.isBoss ? '⭐ ' : (e.isElite ? '◆ ' : '');
  const nameText = namePrefix + e.name;
  const nameW = nameText.length * (e.isBoss ? 9 : 8) + 8;
  ctx.fillStyle = e.isBoss ? 'rgba(80,60,0,0.8)' : (e.isElite ? 'rgba(80,60,0,0.72)' : 'rgba(0,0,0,0.6)');
  ctx.fillRect(sx - nameW/2, sy - e.h/2 - 26, nameW, 11);
  ctx.fillStyle = e.isBoss ? '#f1c40f' : (e.isElite ? '#f6d365' : '#fff');
  ctx.font = e.isBoss ? 'bold 10px sans-serif' : '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(nameText, sx, sy - e.h/2 - 17);

  // HP bar (below name, above enemy)
  drawHpBar(sx, sy - e.h/2 - 8, e.hp, e.maxHp, e.isBoss ? 48 : (e.isElite ? 38 : 32), '#e74c3c');

  if (e.attackWindup > 0) {
    const windupPct = Math.min(1, e.attackWindup / (e.isBoss ? 420 : 240));
    ctx.strokeStyle = e.isBoss ? 'rgba(241,196,15,0.9)' : 'rgba(231,76,60,0.85)';
    ctx.lineWidth = e.isBoss ? 3 : 2;
    ctx.beginPath();
    ctx.arc(sx, sy, e.attackRange * (1.05 - windupPct * 0.18), 0, Math.PI * 2);
    ctx.stroke();
  }

  // Boss crown / elite marker
  if (e.isBoss) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy - e.h/2 - 2);
    ctx.lineTo(sx - 6, sy - e.h/2 - 8);
    ctx.lineTo(sx - 2, sy - e.h/2 - 4);
    ctx.lineTo(sx, sy - e.h/2 - 10);
    ctx.lineTo(sx + 2, sy - e.h/2 - 4);
    ctx.lineTo(sx + 6, sy - e.h/2 - 8);
    ctx.lineTo(sx + 8, sy - e.h/2 - 2);
    ctx.closePath();
    ctx.fill();
  } else if (e.isElite) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(sx, sy - e.h/2 - 10);
    ctx.lineTo(sx + 5, sy - e.h/2 - 5);
    ctx.lineTo(sx, sy - e.h/2);
    ctx.lineTo(sx - 5, sy - e.h/2 - 5);
    ctx.closePath();
    ctx.fill();
  }
}

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

function drawMinimap() {
  if (!minimapVisible) return;
  const mw = Math.round(minimapCanvas.width / dpr);
  const mh = Math.round(minimapCanvas.height / dpr);
  const tw = mapW(), th = mapH();
  const scaleX = mw / tw;
  const scaleY = mh / th;

  mmCtx.clearRect(0, 0, mw, mh);
  const m = getMap();

  // For large maps, skip some tiles
  const step = (tw > 60 || th > 40) ? 2 : 1;

  for (let y = 0; y < th; y += step) {
    for (let x = 0; x < tw; x += step) {
      const tile = m[y][x];
      let c = '#2d5a1b';
      if (tile === TILE_DIRT) c = '#8b6040';
      else if (tile === TILE_WATER) c = '#1e6fa0';
      else if (tile === TILE_TREE) c = '#1a4a1a';
      else if (tile === TILE_WALL) c = '#444';
      else if (tile === TILE_FLOOR) c = '#6b5b45';
      else if (tile === TILE_PORTAL) c = '#8e44ad';
      else if (tile === TILE_EXIT) c = '#27ae60';
      mmCtx.fillStyle = c;
      mmCtx.fillRect(x * scaleX, y * scaleY, scaleX * step + 0.5, scaleY * step + 0.5);
    }
  }

  mmCtx.fillStyle = '#e74c3c';
  enemies.forEach(e => {
    if (e.dead) return;
    const ex = (e.x / TILE) * scaleX;
    const ey = (e.y / TILE) * scaleY;
    mmCtx.fillRect(ex - 1, ey - 1, 2, 2);
  });

  // Dungeon portal markers (field map only)
  if (currentMap === 'field') {
    DUNGEON_INFO.forEach((info, i) => {
      const dx = info.portalX * scaleX;
      const dy = info.portalY * scaleY;
      const cleared = dungeonsCleared.includes(i);
      mmCtx.fillStyle = cleared ? '#27ae60' : '#8e44ad';
      mmCtx.beginPath();
      mmCtx.arc(dx, dy, 2.5, 0, Math.PI * 2);
      mmCtx.fill();
      mmCtx.strokeStyle = '#fff';
      mmCtx.lineWidth = 0.5;
      mmCtx.stroke();
    });
  }

  const px = (player.x / TILE) * scaleX;
  const py = (player.y / TILE) * scaleY;
  mmCtx.fillStyle = '#3498db';
  mmCtx.beginPath();
  mmCtx.arc(px, py, 3, 0, Math.PI*2);
  mmCtx.fill();
  mmCtx.strokeStyle = '#fff';
  mmCtx.lineWidth = 1;
  mmCtx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, cw(), ch());
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, cw(), ch());

  drawMap();

  // Draw NPCs in town
  if (currentMap === 'town') {
    NPCS.forEach(npc => drawNPC(npc));
    TOWN_NPCS.forEach(npc => drawNPC(npc));
  }

  droppedItems.forEach(di => {
    const item = ITEMS[di.itemId];
    if (!item) return;
    const sx = di.x - cameraX + screenShake.x;
    const sy = di.y - cameraY + screenShake.y;
    const bob = Math.sin(Date.now() * 0.005) * 3;
    ctx.fillStyle = 'rgba(255,255,200,0.3)';
    ctx.beginPath();
    ctx.arc(sx, sy + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.color;
    ctx.fillRect(sx - 8, sy - 8 + bob, 16, 16);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 8, sy - 8 + bob, 16, 16);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.fillText(item.icon, sx, sy + 4 + bob);
  });

  drawBuffer.length = 0;
  drawBuffer.push({ y: player.y, draw: drawPlayer });
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (!e.dead) drawBuffer.push({ y: e.y, draw: () => drawEnemy(e) });
  }
  if (activeCompanions.length > 0 && currentMap === 'dungeon') {
    activeCompanions.forEach(cId => {
      if (deadCompanions.includes(cId)) return;
      const cs = companionStates[cId];
      if (cs) {
        drawBuffer.push({ y: cs.y, draw: () => {
          drawCompanion(cId, cs);
        }});
      }
    });
  }
  drawBuffer.sort((a, b) => a.y - b.y);
  for (let i = 0; i < drawBuffer.length; i++) drawBuffer[i].draw();

  drawEnemyEffects();
  drawParticles();
  drawDamageNumbers();
  drawDayNight();

  if (pickupTextTimer > 0) {
    pickupTextTimer--;
    const alpha = Math.min(1, pickupTextTimer / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(cw()/2 - 80, ch() - 60, 160, 30);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.strokeRect(cw()/2 - 80, ch() - 60, 160, 30);
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pickupTextContent, cw()/2, ch() - 40);
    ctx.globalAlpha = 1;
  }

  // Ambient particles
  drawAmbientParticles();

  // Dungeon vignette
  if (currentMap === 'dungeon') {
    const cx = cw() / 2, cy = ch() / 2;
    const inner = Math.min(cx, cy) * 0.55;
    const outer = Math.max(cx, cy) * 1.1;
    const grd = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, cw(), ch());
  }

  drawMinimap();
}

