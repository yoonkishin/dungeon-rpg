'use strict';

// ─── Companion Update ────────────────────────────────────────────────────────
function updateCompanion(dt) {
  if (activeCompanions.length === 0 || currentMap !== 'dungeon') return;

  activeCompanions.forEach((cId, idx) => {
    const cs = companionStates[cId];
    if (!cs) return;

    // Flash timer
    if (cs.flashTimer > 0) cs.flashTimer -= 1;

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = 120;
    enemies.forEach(e => {
      if (e.dead) return;
      const d2 = Math.sqrt((cs.x - e.x)**2 + (cs.y - e.y)**2);
      if (d2 < nearestDist) {
        nearestEnemy = e;
        nearestDist = d2;
      }
    });

    // Movement: chase enemy if close, otherwise follow player
    let targetX, targetY;
    if (nearestEnemy && nearestDist < 100) {
      targetX = nearestEnemy.x;
      targetY = nearestEnemy.y;
    } else {
      const offsetAngle = idx === 0 ? -Math.PI/3 : Math.PI/3;
      const dirAngle = player.dir === 0 ? 0 : player.dir === 1 ? Math.PI : player.dir === 2 ? -Math.PI/2 : Math.PI/2;
      targetX = player.x - 35 * Math.cos(dirAngle + offsetAngle);
      targetY = player.y - 35 * Math.sin(dirAngle + offsetAngle);
    }

    const dx = targetX - cs.x;
    const dy = targetY - cs.y;
    const d = Math.sqrt(dx*dx + dy*dy);
    if (d > 5) {
      const speed = Math.min(d * 0.08, 3);
      cs.x += (dx / d) * speed;
      cs.y += (dy / d) * speed;
    }

    // Auto-attack
    if (cs.attackTimer > 0) {
      cs.attackTimer -= dt;
      return;
    }

    let nearest = null;
    let nDist = 55;
    enemies.forEach(e => {
      if (e.dead) return;
      const d2 = Math.sqrt((cs.x - e.x)**2 + (cs.y - e.y)**2);
      if (d2 < nDist) { nearest = e; nDist = d2; }
    });

    if (nearest) {
      cs.attackTimer = 1200;
      const dmg = getCompanionAtk(cId);
      nearest.hp -= dmg;
      nearest.flashTimer = 8;
      addDamageNumber(nearest.x, nearest.y, dmg, 'normal');
      addParticles(nearest.x, nearest.y, DUNGEON_INFO[cId].companionColor, 5);
      if (nearest.hp <= 0) killEnemy(nearest);
    }
  });
}

// ─── Rendering ────────────────────────────────────────────────────────────────
