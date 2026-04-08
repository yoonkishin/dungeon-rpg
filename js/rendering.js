'use strict';

// ─── Rendering ────────────────────────────────────────────────────────────────
function drawTile(tx, ty, tile) {
  const sx = tx * TILE - cameraX + screenShake.x;
  const sy = ty * TILE - cameraY + screenShake.y;
  const color = TILE_COLORS[tile] || '#333';

  ctx.fillStyle = color;
  ctx.fillRect(sx, sy, TILE, TILE);

  if (tile === TILE_GRASS) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(sx, sy, TILE, TILE);
  } else if (tile === TILE_TREE) {
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
    ctx.fillStyle = '#6d7880';
    ctx.beginPath();
    ctx.arc(sx + TILE/2, sy + TILE/2, TILE/2 - 5, 0, Math.PI*2);
    ctx.fill();
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
  ctx.fillStyle = npc.color;
  ctx.fillRect(nx - 14, ny - 14, 28, 28);
  ctx.fillStyle = '#f5cba7';
  ctx.fillRect(nx - 8, ny - 22, 16, 14);
  ctx.fillStyle = npc.hat;
  ctx.fillRect(nx - 10, ny - 28, 20, 8);
  const labelW = npc.name.length * 8 + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(nx - labelW/2, ny - 42, labelW, 14);
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(npc.name, nx, ny - 31);
}

function drawPlayer() {
  const sx = player.x - cameraX + screenShake.x;
  const sy = player.y - cameraY + screenShake.y;
  const tierInfo = getCurrentTier();

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + player.h/2 - 2, player.w/2, 6, 0, 0, Math.PI*2);
  ctx.fill();

  if (player.invincible > 0 && Math.floor(player.invincible / 80) % 2 === 0) return;

  // Tier 4+ glow/aura
  if (player.tier >= 4) {
    ctx.save();
    ctx.shadowColor = tierInfo.color;
    ctx.shadowBlur = 8 + Math.sin(Date.now() * 0.003) * 4;
    ctx.fillStyle = tierInfo.bodyColor;
    ctx.fillRect(sx - player.w/2, sy - player.h/2, player.w, player.h);
    ctx.restore();
  } else {
    ctx.fillStyle = tierInfo.bodyColor;
    ctx.fillRect(sx - player.w/2, sy - player.h/2, player.w, player.h);
  }

  // Head - slightly larger at higher tiers
  const headExtra = Math.min(player.tier - 1, 3);
  ctx.fillStyle = '#f5cba7';
  ctx.fillRect(sx - 8 - headExtra/2, sy - player.h/2 - 8 - headExtra/2, 16 + headExtra, 14 + headExtra/2);

  ctx.fillStyle = '#2c3e50';
  if (player.dir === 0) {
    ctx.fillRect(sx + 2, sy - player.h/2 - 4, 3, 3);
  } else if (player.dir === 1) {
    ctx.fillRect(sx - 5, sy - player.h/2 - 4, 3, 3);
  } else if (player.dir === 2) {
    ctx.fillRect(sx - 3, sy - player.h/2 - 6, 3, 3);
    ctx.fillRect(sx + 1, sy - player.h/2 - 6, 3, 3);
  }

  ctx.fillStyle = '#1a252f';
  const legOff = player.frame === 0 ? 3 : -3;
  ctx.fillRect(sx - player.w/2, sy + player.h/2 - 8, 10, 8 + legOff);
  ctx.fillRect(sx + player.w/2 - 10, sy + player.h/2 - 8, 10, 8 - legOff);

  if (player.isAttacking) {
    const baseAngle = player.attackAngle;
    const swing = (player.attackArc - 0.5) * Math.PI * 0.9;
    const sAngle = baseAngle + swing;
    const sLen = 38;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(sAngle);
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(10, -3, sLen, 6);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(8, -7, 6, 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, sLen + 5, baseAngle - Math.PI*0.4, sAngle + 0.1);
    ctx.stroke();
    ctx.restore();
  }

  drawHpBar(sx, sy - player.h/2 - 12, player.hp, player.maxHp, 36, '#2ecc71');
}

function drawEnemy(e) {
  const sx = e.x - cameraX + screenShake.x;
  const sy = e.y - cameraY + screenShake.y;

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + e.h/2 - 2, e.w/2, 5, 0, 0, Math.PI*2);
  ctx.fill();

  let color = e.color;
  if (e.flashTimer > 0 && e.flashTimer % 4 < 2) color = '#e74c3c';

  ctx.fillStyle = color;
  ctx.fillRect(sx - e.w/2, sy - e.h/2, e.w, e.h);

  ctx.fillStyle = '#fff';
  ctx.fillRect(sx - 5, sy - e.h/2 + 4, 4, 4);
  ctx.fillRect(sx + 1, sy - e.h/2 + 4, 4, 4);
  ctx.fillStyle = '#000';
  ctx.fillRect(sx - 4, sy - e.h/2 + 5, 2, 2);
  ctx.fillRect(sx + 2, sy - e.h/2 + 5, 2, 2);

  const legBob = e.frame * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(sx - e.w/2, sy + e.h/2 - 5, e.w/2 - 1, 5 + legBob);
  ctx.fillRect(sx + 1, sy + e.h/2 - 5, e.w/2 - 1, 5 - legBob);

  // Name tag (above HP bar)
  const namePrefix = e.isBoss ? '⭐ ' : '';
  const nameText = namePrefix + e.name;
  const nameW = nameText.length * (e.isBoss ? 9 : 8) + 8;
  ctx.fillStyle = e.isBoss ? 'rgba(80,60,0,0.8)' : 'rgba(0,0,0,0.6)';
  ctx.fillRect(sx - nameW/2, sy - e.h/2 - 26, nameW, 11);
  ctx.fillStyle = e.isBoss ? '#f1c40f' : '#fff';
  ctx.font = e.isBoss ? 'bold 10px sans-serif' : '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(nameText, sx, sy - e.h/2 - 17);

  // HP bar (below name, above enemy)
  drawHpBar(sx, sy - e.h/2 - 8, e.hp, e.maxHp, e.isBoss ? 48 : 32, '#e74c3c');

  // Boss crown
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
  }
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
  const mw = 64, mh = 64;
  const tw = mapW(), th = mapH();
  const scaleX = mw / tw;
  const scaleY = mh / th;

  mmCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
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

  const entities = [
    { y: player.y, draw: drawPlayer },
    ...enemies.filter(e => !e.dead).map(e => ({ y: e.y, draw: () => drawEnemy(e) }))
  ];
  if (activeCompanions.length > 0 && currentMap === 'dungeon') {
    activeCompanions.forEach(cId => {
      const cs = companionStates[cId];
      if (cs) {
        entities.push({ y: cs.y, draw: () => {
          // draw individual companion inline
          const info = DUNGEON_INFO[cId];
          if (!info) return;
          const sx = cs.x - cameraX + screenShake.x;
          const sy = cs.y - cameraY + screenShake.y;
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.ellipse(sx, sy + 10, 10, 4, 0, 0, Math.PI*2);
          ctx.fill();
          if (cs.flashTimer > 0 && cs.flashTimer % 4 < 2) ctx.fillStyle = '#fff';
          else ctx.fillStyle = info.companionColor;
          ctx.fillRect(sx - 10, sy - 10, 20, 20);
          ctx.fillStyle = '#fff';
          ctx.fillRect(sx - 4, sy - 6, 3, 3);
          ctx.fillRect(sx + 1, sy - 6, 3, 3);
          ctx.fillStyle = '#000';
          ctx.fillRect(sx - 3, sy - 5, 2, 2);
          ctx.fillRect(sx + 2, sy - 5, 2, 2);
          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('★', sx, sy - 14);
          const hpPct = cs.hp / cs.maxHp;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(sx - 12, sy - 22, 24, 3);
          ctx.fillStyle = hpPct > 0.3 ? '#2ecc71' : '#e74c3c';
          ctx.fillRect(sx - 12, sy - 22, 24 * hpPct, 3);
          const labelW = info.companionName.length * 7 + 8;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(sx - labelW/2, sy - 32, labelW, 12);
          ctx.fillStyle = '#7dd3fc';
          ctx.font = '8px sans-serif';
          ctx.fillText(info.companionName, sx, sy - 23);
        }});
      }
    });
  }
  entities.sort((a, b) => a.y - b.y);
  entities.forEach(e => e.draw());

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

  drawMinimap();
}

