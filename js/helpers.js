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

function findBestPotionEntry() {
  const preferredIds = ['potion_t10', 'potion_t8', 'potion_t6', 'potion_hp2', 'potion_hp'];
  for (const itemId of preferredIds) {
    const entry = inventory.find(item => item.itemId === itemId);
    if (entry) return entry;
  }
  return inventory.find(item => {
    const def = ITEMS[item.itemId];
    return !!(def && def.type === 'potion');
  }) || null;
}

function consumePotionEntry(invEntry, options = {}) {
  const {
    skipIfFullHp = true,
    saveMode = 'request',
  } = options;

  if (!invEntry) return false;
  const idx = inventory.indexOf(invEntry);
  if (idx === -1) return false;

  const item = ITEMS[invEntry.itemId];
  if (!item || item.type !== 'potion') return false;
  if (skipIfFullHp && player.hp >= player.maxHp) return false;

  const boostedHeal = Math.floor(item.heal * getHealingMultiplier());
  const healAmt = Math.min(boostedHeal, player.maxHp - player.hp);
  player.hp = Math.min(player.maxHp, player.hp + boostedHeal);
  inventory.splice(idx, 1);

  addParticles(player.x, player.y, '#e74c3c', 10);
  if (healAmt > 0) addDamageNumber(player.x, player.y, healAmt, 'heal');
  AudioSystem.sfx.heal();
  showToast(item.name + ' 사용');
  updateHUD();

  if (saveMode === 'immediate') autoSave();
  else if (saveMode !== 'none') requestAutoSave();

  return true;
}

function useBestPotion(options = {}) {
  const entry = findBestPotionEntry();
  if (!entry) {
    if (typeof showToast === 'function') showToast('포션이 없습니다');
    return false;
  }
  if (player.hp >= player.maxHp) {
    if (typeof showToast === 'function') showToast('이미 체력이 가득합니다');
    return false;
  }
  return consumePotionEntry(entry, options);
}

window.__rpgDebug = {
  addGold(amount = 1000) {
    player.gold += amount;
    updateHUD();
    autoSave();
  },
  addItem(itemId, count = 1) {
    for (let i = 0; i < count; i++) inventory.push(createItemInstance(itemId));
    if (invOpen && typeof renderInventory === 'function') renderInventory();
    autoSave();
  },
  grantXp(amount = 1000, characterId = null) {
    const targetCharacterId = characterId || (typeof getLoadedPlayerCharacterId === 'function' ? getLoadedPlayerCharacterId() : currentCommanderId);
    if (typeof gainCharacterXP === 'function') gainCharacterXP(targetCharacterId, amount);
  },
  setLine(lineId = 'infantry') {
    player.classLine = lineId;
    syncPlayerGrowthState();
    updateHUD();
    autoSave();
  },
  setLevel(level = 36) {
    player.level = level;
    syncPlayerGrowthState();
    player.xp = 0;
    player.xpNext = getXpToNextLevel(player.level, player.tier || player.classRank || 1);
    if (typeof checkTierCapMilestoneRewards === 'function') checkTierCapMilestoneRewards();
    updateHUD();
    autoSave();
  },
  prepareEmblemTrial(lineId = 'infantry') {
    player.classLine = lineId;
    player.level = 36;
    player.classRank = 7;
    player.tier = 7;
    player.gold += 20000;
    ['weapon_t8', 'armor_t8', 'helmet_t8', 'boots_t8', 'shield_t8', 'ring_t7', 'amulet_t7'].forEach(itemId => {
      inventory.push(createItemInstance(itemId));
    });
    syncPlayerGrowthState();
    updateHUD();
    autoSave();
  },
  // 합체 대상 라인 기본값: battleMaster. 'battle'/'tactics'/'magic' 별칭도 허용.
  prepareFusion(lineHint = 'battleMaster') {
    const aliasMap = {
      battle: 'battleMaster', battleMaster: 'battleMaster',
      tactics: 'tacticsMaster', tacticsMaster: 'tacticsMaster',
      magic: 'magicMaster', magicMaster: 'magicMaster',
      battle_master_emblem: 'battleMaster',
      tactics_master_emblem: 'tacticsMaster',
      magic_master_emblem: 'magicMaster',
    };
    const masterLineId = aliasMap[lineHint] || lineHint;
    const recipe = getFusionRecipeForLine(masterLineId);
    if (!recipe) return false;
    player.level = 36;
    player.classRank = 7;
    player.tier = 7;
    (recipe.materials || []).forEach(id => {
      if (!player.emblemIds.includes(id)) player.emblemIds.push(id);
    });
    syncPlayerGrowthState();
    ensurePlayerEmblemBonusesApplied();
    autoSave();
    return true;
  },
  // 8단/9단 만렙 보상 문장을 바로 지급 (수동 테스트용).
  prepareTier8Reward(masterLineId = 'battleMaster') {
    if (typeof grantTier8Emblem === 'function') return grantTier8Emblem(masterLineId);
    return false;
  },
  prepareTier9Reward(masterLineId = 'battleMaster') {
    if (typeof grantTier9Emblem === 'function') return grantTier9Emblem(masterLineId);
    return false;
  },
  prepareTier(tier = 8, lineId = 'battleMaster') {
    const targets = {
      8: { level: 100, gear: ['weapon_t8', 'armor_t8', 'helmet_t8', 'boots_t8', 'shield_t8', 'ring_t7', 'amulet_t7'] },
      9: { level: 200, gear: ['weapon_t9', 'armor_t9', 'boots_t10', 'shield_t8', 'ring_t9', 'amulet_t9'] },
      10: { level: 300, gear: ['weapon_t10', 'armor_t10', 'helmet_t10', 'boots_t10', 'shield_t10', 'ring_t9', 'amulet_t9'] },
    };
    const target = targets[tier];
    if (!target) return false;
    player.classLine = lineId;
    player.level = target.level;
    player.classRank = tier;
    player.tier = tier;
    // 마스터 라인이면 staged progression 상태도 선제 세팅
    if (EMBLEM_FUSION_RECIPES && EMBLEM_FUSION_RECIPES[lineId]) {
      player.tier8UnlockLineId = lineId;
      if (tier >= 8) {
        // 8단 도달 → tier8 문장도 같이 부여 (9단+ 테스트 편의)
        player.tier8EmblemId = EMBLEM_FUSION_RECIPES[lineId].tier8EmblemId;
        if (!player.emblemIds.includes(player.tier8EmblemId)) player.emblemIds.push(player.tier8EmblemId);
      }
      if (tier >= 9) {
        player.tier9EmblemId = EMBLEM_FUSION_RECIPES[lineId].tier9EmblemId;
        if (!player.emblemIds.includes(player.tier9EmblemId)) player.emblemIds.push(player.tier9EmblemId);
      }
    }
    target.gear.forEach(itemId => inventory.push(createItemInstance(itemId)));
    syncPlayerGrowthState();
    ensurePlayerEmblemBonusesApplied();
    updateHUD();
    autoSave();
    return true;
  },
};
