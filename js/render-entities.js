'use strict';

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
  const commanderRoster = typeof getCommanderCompanionRoster === 'function' ? getCommanderCompanionRoster() : null;
  const commanderProfile = typeof getCommanderCompanionProfile === 'function' ? getCommanderCompanionProfile() : null;
  const usingCompanionCommander = !!(commanderRoster && commanderProfile);
  const bodyColor = usingCompanionCommander ? commanderRoster.color : tierInfo.bodyColor;
  const glowColor = usingCompanionCommander ? commanderRoster.color : tierInfo.color;
  const hairColor = usingCompanionCommander ? '#e8edf2' : '#5a3825';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 12, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isCombatControlActive()) {
    ctx.strokeStyle = 'rgba(241,196,15,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 12, 17, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

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
  if (player.tier >= 4 || usingCompanionCommander) {
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = (usingCompanionCommander ? 6 : 8) + Math.sin(Date.now() * 0.003) * 4;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - 8, bodyY - 6, 16, 12);
    ctx.restore();
  } else {
    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx - 8, bodyY - 6, 16, 12);
  }

  // Arms
  const armSwing = player.frame === 0 ? 2 : -2;
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx - 12, bodyY - 4 + armSwing, 4, 10);
  ctx.fillRect(sx + 8, bodyY - 4 - armSwing, 4, 10);

  // Head (round, chibi)
  ctx.fillStyle = '#f5cba7';
  ctx.beginPath();
  ctx.arc(sx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = hairColor;
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
  } else if (player.dir === 3) {
    ctx.fillRect(sx - 4, headY - 2, 3, 3);
    ctx.fillRect(sx + 1, headY - 2, 3, 3);
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx - 3, headY - 2, 1, 1);
    ctx.fillRect(sx + 2, headY - 2, 1, 1);
  } else {
    // facing up — no eyes visible, just hair/back of head
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

  if (usingCompanionCommander) {
    const labelText = commanderRoster.name;
    const labelW = labelText.length * 7 + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(sx - labelW / 2, headY - headR - 20, labelW, 12);
    ctx.fillStyle = commanderRoster.color;
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, sx, headY - headR - 11);
  }
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

