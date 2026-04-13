'use strict';

const drawBuffer = [];

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
    const bob = Math.sin(Date.now() * 0.005 + di.x) * 3;
    const t = Date.now() * 0.003;

    // Rarity border color by price
    const price = item.price || 0;
    const rarityColor = price >= 400 ? '#f1c40f' : price >= 150 ? '#8e44ad' : price >= 60 ? '#3498db' : '#95a5a6';

    // Ground glow
    ctx.fillStyle = `rgba(${price >= 150 ? '255,220,100' : '200,200,150'},${0.15 + Math.sin(t) * 0.08})`;
    ctx.beginPath();
    ctx.arc(sx, sy + bob + 2, 16, 0, Math.PI * 2);
    ctx.fill();

    // Item box with rarity border
    ctx.fillStyle = 'rgba(20,15,30,0.85)';
    ctx.fillRect(sx - 9, sy - 9 + bob, 18, 18);
    ctx.fillStyle = item.color;
    ctx.fillRect(sx - 7, sy - 7 + bob, 14, 14);
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = price >= 150 ? 2 : 1;
    ctx.strokeRect(sx - 9, sy - 9 + bob, 18, 18);

    // Sparkle for rare+
    if (price >= 150) {
      const sparkAngle = t * 2;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(t * 2) * 0.3})`;
      for (let i = 0; i < 2; i++) {
        const a = sparkAngle + i * Math.PI;
        const sparkX = sx + Math.cos(a) * 12;
        const sparkY = sy + bob + Math.sin(a) * 12;
        ctx.fillRect(sparkX - 1, sparkY - 1, 2, 2);
      }
    }

    // Icon
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

