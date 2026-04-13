'use strict';

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

