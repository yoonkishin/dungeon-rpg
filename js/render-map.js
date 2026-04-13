'use strict';

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
    const t = Date.now() * 0.003;
    // Dark base
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(sx, sy, TILE, TILE);
    // Swirl rings
    const cx = sx + TILE / 2, cy = sy + TILE / 2;
    for (let i = 0; i < 3; i++) {
      const r = 6 + i * 5;
      const a = 0.4 - i * 0.1 + Math.sin(t + i) * 0.15;
      ctx.strokeStyle = `rgba(180,100,255,${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, t + i * 2, t + i * 2 + Math.PI * 1.4);
      ctx.stroke();
    }
    // Center glow
    ctx.fillStyle = `rgba(200,120,255,${0.35 + Math.sin(t * 1.5) * 0.15})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
    // Light rays
    for (let i = 0; i < 4; i++) {
      const angle = t * 0.5 + i * Math.PI / 2;
      ctx.strokeStyle = `rgba(220,180,255,${0.2 + Math.sin(t + i) * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 16, cy + Math.sin(angle) * 16);
      ctx.stroke();
    }
  } else if (tile === TILE_EXIT) {
    const t = Date.now() * 0.003;
    // Dark green base
    ctx.fillStyle = '#0a2a15';
    ctx.fillRect(sx, sy, TILE, TILE);
    // Upward light pillar
    const cx = sx + TILE / 2;
    const shimmer = 0.3 + Math.sin(t * 1.2) * 0.15;
    ctx.fillStyle = `rgba(50,200,100,${shimmer})`;
    ctx.fillRect(cx - 8, sy, 16, TILE);
    ctx.fillStyle = `rgba(100,255,150,${shimmer * 0.5})`;
    ctx.fillRect(cx - 4, sy, 8, TILE);
    // Floating arrows
    for (let i = 0; i < 3; i++) {
      const ay = sy + TILE - ((Date.now() * 0.04 + i * 14) % TILE);
      const alpha = 0.5 + Math.sin(t + i) * 0.2;
      ctx.fillStyle = `rgba(200,255,200,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(cx, ay - 4);
      ctx.lineTo(cx - 4, ay + 2);
      ctx.lineTo(cx + 4, ay + 2);
      ctx.closePath();
      ctx.fill();
    }
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

