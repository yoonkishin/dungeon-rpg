'use strict';

// ─── Profile Panel ───────────────────────────────────────────────────────────
const profilePanel = document.getElementById('profile-panel');
bindTap(document.getElementById('profile-close'), () => closeProfile());

function openProfile() {
  profileOpen = true;
  showPanel(profilePanel);
  renderProfile();
}
function closeProfile() {
  profileOpen = false;
  hidePanel(profilePanel);
}
function buildProfileProgressDots(total, activeCheck, variant) {
  let html = '';
  for (let i = 0; i < total; i++) {
    const active = activeCheck(i);
    html += '<div class="profile-progress-dot ' + variant + (active ? ' active' : '') + '">' + (active ? '●' : '○') + '</div>';
  }
  return html;
}

function buildProfileMetric(label, value) {
  return '<div class="profile-metric-item"><span class="profile-metric-label">' + label + '</span><span class="profile-metric-value">' + value + '</span></div>';
}

function buildProfileCharacterCard(tier, lineName, glowColor, glowSize, armorColor) {
  return `
    <div class="profile-character-card">
      <div class="profile-character-glow" style="background:radial-gradient(circle at 50% 50%, ${glowColor}, transparent 60%);"></div>
      <div class="profile-character-inner">
        <div class="profile-character-figure">
          ${tier.tier >= 3 ? `<div class="profile-character-aura" style="background:radial-gradient(circle, ${tier.color}33, transparent 70%); box-shadow:0 0 ${glowSize}px ${tier.color}44;"></div>` : ''}
          <img src="./character.png" alt="캐릭터" class="profile-character-image" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="profile-character-fallback">
            <div class="profile-character-body" style="background:${armorColor || tier.bodyColor};"></div>
          </div>
        </div>
        <div class="profile-character-meta">
          <div class="profile-character-name">${lineName} 라인</div>
          <div class="profile-character-tier" style="color:${tier.color};">⭐ ${tier.tier}단 - ${tier.name}</div>
          <div class="profile-character-level">Lv. ${player.level}${player.level >= PLAYER_LEVEL_CAP ? ' (MAX)' : ''}</div>
        </div>
      </div>
    </div>
  `;
}

function buildProfileStatsCard(playerStats) {
  return `
    <div class="profile-stats-card">
      <div class="profile-resource-block">
        <div class="profile-resource-row"><span class="profile-resource-label hp">HP</span><span class="profile-resource-value">${playerStats.hpText}</span></div>
        <div class="profile-bar"><div class="profile-bar-fill hp" style="width:${playerStats.hpPct}%;"></div></div>
      </div>
      <div class="profile-resource-block profile-resource-gap">
        <div class="profile-resource-row"><span class="profile-resource-label mp">MP</span><span class="profile-resource-value">${playerStats.mpText}</span></div>
        <div class="profile-bar"><div class="profile-bar-fill mp" style="width:${playerStats.mpPct}%;"></div></div>
      </div>
      <div class="profile-metric-grid">
        ${buildProfileMetric('공격력', playerStats.atk)}
        ${buildProfileMetric('방어력', playerStats.def)}
        ${buildProfileMetric('크리티컬', playerStats.crit + '%')}
        ${buildProfileMetric('이동속도', playerStats.speed)}
      </div>
    </div>
  `;
}

function buildProfileTierCard(tier, nextTier, tierPct, tierProgressText, lineName) {
  return `
    <div class="profile-tier-card">
      <div class="profile-tier-head">
        <span class="profile-tier-text">클래스: <span class="profile-tier-name" style="color:${tier.color};">${tier.tier}단 ${tier.name}</span></span>
        ${nextTier ? `<span class="profile-tier-next">다음 승급: ${nextTier.name} (Lv.${nextTier.reqLevel})</span>` : '<span class="profile-tier-next max">현재 최종 승급</span>'}
      </div>
      <div class="profile-bar profile-tier-progress"><div class="profile-bar-fill tier" style="width:${tierPct}%; background:linear-gradient(90deg, ${tier.color}, ${tier.bodyColor});"></div></div>
      <div class="profile-tier-foot">${tierProgressText || `${lineName} 라인 진행 ${tierPct}%`}</div>
    </div>
  `;
}

function buildProfilePromotionNote(tier, nextTier, lineName) {
  const body = nextTier
    ? `${lineName} 라인 ${tier.name} 단계야. 다음 승급은 ${nextTier.name}, Lv.${nextTier.reqLevel}에서 열려.`
    : `${lineName} 라인의 최종 승급까지 왔어. 이제 장비와 동료 조합으로 후반 밸류를 올리면 돼.`;

  return `
    <div class="profile-promotion-note">
      <div class="profile-promotion-title">성장 해석</div>
      <div class="profile-promotion-body">${body}</div>
    </div>
  `;
}

function buildProfileProgressSection(dungeonCircles, companionCircles) {
  return `
    <div class="profile-progress-row">
      <div class="profile-progress-card">
        <div class="profile-progress-title">던전 ${dungeonsCleared.length}/9</div>
        <div class="profile-progress-dots">${dungeonCircles}</div>
      </div>
      <div class="profile-progress-card">
        <div class="profile-progress-title">동료 ${companions.length}/${getTotalCompanionCount()}</div>
        <div class="profile-progress-dots">${companionCircles}</div>
      </div>
    </div>
  `;
}

function renderProfile() {
  const bonus = getEquipBonus();
  const tier = getCurrentTier();
  const nextTier = getNextTier();
  const growthLine = getGrowthLine(player.classLine || 'infantry');
  const content = document.getElementById('profile-content');
  const armorColor = equipped.armor && ITEMS[equipped.armor] ? ITEMS[equipped.armor].color : null;
  const glowSize = Math.min(tier.tier * 4, 24);
  const glowOpacity = Math.min(tier.tier * 0.12, 0.7);

  let tierPct = 100;
  let tierProgressText = '최고 등급 달성!';
  if (nextTier) {
    const prevReq = tier.reqLevel;
    const nextReq = nextTier.reqLevel;
    tierPct = Math.min(100, Math.floor((player.level - prevReq) / (nextReq - prevReq) * 100));
    tierProgressText = '';
  }

  const playerStats = {
    hpPct: Math.max(0, Math.min(100, player.hp / player.maxHp * 100)),
    mpPct: Math.max(0, Math.min(100, player.mp / player.maxMp * 100)),
    hpText: Math.floor(player.hp) + '/' + player.maxHp,
    mpText: Math.floor(player.mp) + '/' + player.maxMp,
    atk: player.atk + bonus.atk,
    def: player.def + bonus.def,
    crit: Math.min(30, player.critChance + (bonus.critBonus || 0)),
    speed: (player.speed + (bonus.speedBonus || 0)).toFixed(2),
  };
  const dungeonCircles = buildProfileProgressDots(9, (idx) => dungeonsCleared.includes(idx), 'dungeon');
  const companionCircles = buildProfileProgressDots(getTotalCompanionCount(), (idx) => companions.includes(idx), 'companion');
  const glowColor = `${tier.color}${Math.round(glowOpacity * 255).toString(16).padStart(2, '0')}`;

  content.innerHTML =
    '<div class="profile-layout">' +
      buildProfileCharacterCard(tier, growthLine.lineName, glowColor, glowSize, armorColor) +
      buildProfileStatsCard(playerStats) +
    '</div>' +
    buildProfileTierCard(tier, nextTier, tierPct, tierProgressText, growthLine.lineName) +
    buildProfilePromotionNote(tier, nextTier, growthLine.lineName) +
    buildProfileProgressSection(dungeonCircles, companionCircles);
}

// ─── Inventory / Shop UI ────────────────────────────────────────────────────
const inventoryPanel = document.getElementById('inventory-panel');
const inventoryCloseBtn = inventoryPanel.querySelector('.inv-close');
const bagGrid = document.getElementById('bag-grid');
const bagCount = document.getElementById('bag-count');
const itemPopup = document.getElementById('item-popup');
const popupContent = document.getElementById('popup-content');
const shopPanel = document.getElementById('shop-panel');
const shopCloseBtn = document.getElementById('shop-close');
const shopTabBuy = document.getElementById('shop-tab-buy');
const shopTabSell = document.getElementById('shop-tab-sell');
const shopBuySection = document.getElementById('shop-buy-section');
const shopSellSection = document.getElementById('shop-sell-section');
const shopItemsList = document.getElementById('shop-items-list');
const shopSellList = document.getElementById('shop-sell-list');
const shopGold = document.getElementById('shop-gold');
const shopTitle = shopPanel.querySelector('.inv-header h2');
let invOpen = false;
let shopOpen = false;
let activeShopNpc = null;
let activeShopTab = 'buy';

const EQUIP_SLOT_META = {
  helmet: { icon: '⛑️', label: '투구' },
  weapon: { icon: '🗡️', label: '무기' },
  armor: { icon: '🧥', label: '갑옷' },
  shield: { icon: '🛡️', label: '방패' },
  boots: { icon: '👢', label: '신발' },
  accessory1: { icon: '💍', label: '장신구 1' },
  accessory2: { icon: '💍', label: '장신구 2' },
  event: { icon: '🍀', label: '특수 장비' },
};

bindTap(inventoryCloseBtn, () => closeInventory());
bindTap(shopCloseBtn, () => closeShop());
itemPopup.addEventListener('touchstart', (e) => {
  if (e.target === itemPopup) {
    e.preventDefault();
    closeItemPopup();
  }
}, { passive: false });
itemPopup.addEventListener('click', (e) => {
  if (e.target === itemPopup) closeItemPopup();
});
bindTap(shopTabBuy, () => switchShopTab('buy'));
bindTap(shopTabSell, () => switchShopTab('sell'));

Object.keys(EQUIP_SLOT_META).forEach(slot => {
  const slotEl = document.querySelector('.equip-slot[data-slot="' + slot + '"]');
  if (!slotEl) return;
  function handleSlotTap() {
    if (!invOpen) return;
    const itemId = equipped[slot];
    if (!itemId || !ITEMS[itemId]) return;
    openItemPopup({ itemId, source: 'equipped', slot });
  }
  bindTap(slotEl, handleSlotTap, { stopPropagation: true });
});

function openInventory() {
  if (shopOpen) closeShop();
  invOpen = true;
  showPanel(inventoryPanel);
  renderInventory();
}
function closeInventory() {
  invOpen = false;
  closeItemPopup();
  hidePanel(inventoryPanel);
}
function openShop(npc) {
  if (!npc) return;
  if (invOpen) closeInventory();
  activeShopNpc = npc;
  activeShopTab = 'buy';
  shopOpen = true;
  if (shopTitle) shopTitle.textContent = '🏪 ' + npc.name;
  showPanel(shopPanel);
  renderShop();
}
function closeShop() {
  shopOpen = false;
  activeShopNpc = null;
  hidePanel(shopPanel);
}
function switchShopTab(tab) {
  activeShopTab = tab === 'sell' ? 'sell' : 'buy';
  shopTabBuy.classList.toggle('active', activeShopTab === 'buy');
  shopTabSell.classList.toggle('active', activeShopTab === 'sell');
  shopBuySection.style.display = activeShopTab === 'buy' ? 'block' : 'none';
  shopSellSection.style.display = activeShopTab === 'sell' ? 'block' : 'none';
}
function getInventoryCounts() {
  const counts = {};
  inventory.forEach(id => {
    counts[id] = (counts[id] || 0) + 1;
  });
  return counts;
}
function getOwnedItemCount(itemId) {
  let count = inventory.filter(id => id === itemId).length;
  Object.keys(equipped).forEach(slot => {
    if (equipped[slot] === itemId) count++;
  });
  return count;
}
function getItemTypeLabel(item) {
  const labels = {
    weapon: '무기',
    armor: '갑옷',
    helmet: '투구',
    boots: '신발',
    shield: '방패',
    accessory: '장신구',
    event: '특수',
    potion: '포션'
  };
  return labels[item.type] || item.type;
}
function getItemSummary(item) {
  if (!item) return '';
  const parts = [];
  if (item.atk) parts.push('ATK +' + item.atk);
  if (item.def) parts.push('DEF +' + item.def);
  if (item.speedBonus) parts.push('속도 +' + item.speedBonus.toFixed(2));
  if (item.critBonus) parts.push('치명타 +' + item.critBonus + '%');
  if (item.goldBonus) parts.push('골드 +' + item.goldBonus + '%');
  if (item.heal) parts.push('회복 ' + Math.floor(item.heal * getHealingMultiplier()));
  return parts.length ? parts.join(' · ') : '기본 효과 없음';
}
function compareInventoryItems(aId, bId) {
  const a = ITEMS[aId] || null;
  const b = ITEMS[bId] || null;
  const typeOrder = {
    weapon: 0,
    armor: 1,
    helmet: 2,
    shield: 3,
    boots: 4,
    accessory: 5,
    event: 6,
    potion: 7,
  };
  const orderA = a ? (typeOrder[a.type] ?? 99) : 99;
  const orderB = b ? (typeOrder[b.type] ?? 99) : 99;
  if (orderA !== orderB) return orderA - orderB;
  const priceA = a ? (a.price || 0) : 0;
  const priceB = b ? (b.price || 0) : 0;
  if (priceA !== priceB) return priceB - priceA;
  return (a ? a.name : '').localeCompare(b ? b.name : '', 'ko');
}
function getPreferredEquipSlot(item) {
  if (!item) return null;
  if (item.type === 'accessory') {
    if (!equipped.accessory1) return 'accessory1';
    if (!equipped.accessory2) return 'accessory2';
    const acc1 = ITEMS[equipped.accessory1] || null;
    const acc2 = ITEMS[equipped.accessory2] || null;
    const score = target => target ? ((target.atk || 0) + (target.def || 0) + (target.critBonus || 0) + (target.goldBonus || 0) + ((target.speedBonus || 0) * 10)) : -1;
    return score(acc1) <= score(acc2) ? 'accessory1' : 'accessory2';
  }
  if (item.type === 'weapon' || item.type === 'armor' || item.type === 'helmet' || item.type === 'boots' || item.type === 'shield' || item.type === 'event') {
    return item.type;
  }
  return null;
}
function equipInventoryItem(itemId) {
  const item = ITEMS[itemId];
  if (!item) return;
  const slot = getPreferredEquipSlot(item);
  if (!slot) return;
  const invIdx = inventory.indexOf(itemId);
  if (invIdx === -1) return;
  const previous = equipped[slot];
  inventory.splice(invIdx, 1);
  equipped[slot] = itemId;
  if (previous) inventory.push(previous);
  AudioSystem.sfx.pickup();
  showToast(item.name + ' 장착');
  updateHUD();
  autoSave();
}
function unequipSlot(slot) {
  const itemId = equipped[slot];
  if (!itemId) return;
  inventory.push(itemId);
  equipped[slot] = null;
  AudioSystem.sfx.sell();
  showToast((ITEMS[itemId] ? ITEMS[itemId].name : '장비') + ' 해제');
  updateHUD();
  autoSave();
}
function consumeInventoryItem(itemId) {
  const item = ITEMS[itemId];
  const idx = inventory.indexOf(itemId);
  if (!item || item.type !== 'potion' || idx === -1) return;
  if (player.hp >= player.maxHp) {
    showToast('HP가 이미 가득합니다');
    return;
  }
  const boostedHeal = Math.floor(item.heal * getHealingMultiplier());
  const healAmt = Math.min(boostedHeal, player.maxHp - player.hp);
  player.hp = Math.min(player.maxHp, player.hp + boostedHeal);
  inventory.splice(idx, 1);
  if (healAmt > 0) addDamageNumber(player.x, player.y, healAmt, 'heal');
  AudioSystem.sfx.heal();
  showToast(item.name + ' 사용');
  updateHUD();
  autoSave();
}
function getItemStatEntries(item) {
  if (!item) return [];
  const healValue = item.heal ? Math.floor(item.heal * getHealingMultiplier()) : 0;
  const entries = [
    { label: 'ATK', value: item.atk || 0, display: String(item.atk || 0) },
    { label: 'DEF', value: item.def || 0, display: String(item.def || 0) },
    { label: 'SPD', value: item.speedBonus || 0, display: (item.speedBonus || 0).toFixed(2) },
    { label: '치명타', value: item.critBonus || 0, display: (item.critBonus || 0) + '%' },
    { label: '골드', value: item.goldBonus || 0, display: (item.goldBonus || 0) + '%' },
    { label: '회복', value: healValue, display: String(healValue) },
  ];
  return entries.filter(entry => entry.value > 0);
}
function buildItemStatRows(item) {
  const entries = getItemStatEntries(item);
  if (entries.length === 0) {
    return '<div class="popup-stat-row"><span class="label">효과</span><span class="val same">없음</span></div>';
  }
  return entries.map(entry => '<div class="popup-stat-row"><span class="label">' + entry.label + '</span><span class="val">' + entry.display + '</span></div>').join('');
}
function buildItemDeltaRows(currentItem, newItem) {
  const currentMap = new Map(getItemStatEntries(currentItem).map(entry => [entry.label, entry]));
  const nextEntries = getItemStatEntries(newItem);
  const labels = ['ATK', 'DEF', 'SPD', '치명타', '골드', '회복'];
  const rows = labels.map(label => {
    const currentValue = currentMap.has(label) ? currentMap.get(label).value : 0;
    const nextEntry = nextEntries.find(entry => entry.label === label);
    const nextValue = nextEntry ? nextEntry.value : 0;
    if (currentValue === 0 && nextValue === 0) return '';
    const diff = nextValue - currentValue;
    const className = diff > 0 ? 'better' : diff < 0 ? 'worse' : 'same';
    const display = diff === 0
      ? '변화 없음'
      : ((diff > 0 ? '+' : '') + (label === 'SPD' ? diff.toFixed(2) : diff) + (label === '치명타' || label === '골드' ? '%' : ''));
    return '<div class="popup-stat-row popup-delta-row"><span class="label">' + label + ' 변화</span><span class="val ' + className + '">' + display + '</span></div>';
  }).filter(Boolean);
  return rows.length ? rows.join('') : '<div class="popup-stat-row popup-delta-row"><span class="label">비교</span><span class="val same">변화 없음</span></div>';
}
function getItemScore(item) {
  if (!item) return -1;
  return (item.atk || 0) * 3 + (item.def || 0) * 2 + (item.speedBonus || 0) * 20 + (item.critBonus || 0) * 1.5 + (item.goldBonus || 0) * 0.5 + (item.heal || 0) * 0.08;
}
function getShopRecommendation(itemId) {
  const item = ITEMS[itemId];
  if (!item) return '';
  if (item.type === 'potion') {
    return getOwnedItemCount(itemId) < 2 ? '보충 추천' : '';
  }
  const slot = getPreferredEquipSlot(item);
  if (!slot) return '';
  const currentItem = equipped[slot] ? ITEMS[equipped[slot]] : null;
  if (!currentItem) return '첫 장비';
  return getItemScore(item) > getItemScore(currentItem) ? '업그레이드' : '';
}
function appendPopupActionButton(container, className, label, handler) {
  const btn = document.createElement('button');
  btn.className = 'popup-btn ' + className;
  btn.textContent = label;
  bindTap(btn, handler);
  container.appendChild(btn);
}

function openItemPopup({ itemId, source, slot }) {
  const item = ITEMS[itemId];
  if (!item) return;
  const targetSlot = slot || getPreferredEquipSlot(item);
  const currentItem = targetSlot && equipped[targetSlot] ? ITEMS[equipped[targetSlot]] : null;
  const canEquip = source !== 'equipped' && !!targetSlot && item.type !== 'potion';
  const canUse = item.type === 'potion';
  const canUnequip = source === 'equipped';
  popupContent.innerHTML = '' +
    '<div class="popup-item-header">' +
      '<div class="popup-icon">' + item.icon + '</div>' +
      '<div>' +
        '<div class="popup-name">' + item.name + '</div>' +
        '<div class="popup-type">' + getItemTypeLabel(item) + (targetSlot && EQUIP_SLOT_META[targetSlot] ? ' · ' + EQUIP_SLOT_META[targetSlot].label : '') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="popup-compare">' +
      '<div class="popup-stat-box current"><div class="popup-stat-title">현재 장비</div><div class="popup-stat-row"><span class="label">이름</span><span class="val">' + (currentItem ? currentItem.name : '없음') + '</span></div>' + buildItemStatRows(currentItem) + '</div>' +
      '<div class="popup-stat-box new-item"><div class="popup-stat-title">선택 아이템</div><div class="popup-stat-row"><span class="label">이름</span><span class="val">' + item.name + '</span></div>' + buildItemStatRows(item) + '</div>' +
    '</div>' +
    '<div class="popup-stat-box popup-delta-box"><div class="popup-stat-title">장비 비교</div>' + buildItemDeltaRows(currentItem, item) + '</div>' +
    '<div class="popup-btns"></div>';

  const btns = popupContent.querySelector('.popup-btns');
  if (canEquip) {
    appendPopupActionButton(btns, 'equip', '장착', () => {
      equipInventoryItem(itemId);
      closeItemPopup();
      renderInventory();
    });
  }
  if (canUse) {
    appendPopupActionButton(btns, 'use', '사용', () => {
      consumeInventoryItem(itemId);
      closeItemPopup();
      renderInventory();
    });
  }
  if (canUnequip) {
    appendPopupActionButton(btns, 'unequip', '해제', () => {
      unequipSlot(slot);
      closeItemPopup();
      renderInventory();
    });
  }
  appendPopupActionButton(btns, 'close', '닫기', () => {
    closeItemPopup();
  });

  itemPopup.style.display = 'flex';
}
function closeItemPopup() {
  itemPopup.style.display = 'none';
  popupContent.innerHTML = '';
}
function renderInventory() {
  const counts = getInventoryCounts();
  bagCount.textContent = inventory.length;

  Object.keys(EQUIP_SLOT_META).forEach(slot => {
    const slotEl = document.querySelector('.equip-slot[data-slot="' + slot + '"]');
    if (!slotEl) return;
    const itemId = equipped[slot];
    const item = itemId ? ITEMS[itemId] : null;
    slotEl.classList.toggle('equipped', !!item);
    slotEl.innerHTML = item ? item.icon : EQUIP_SLOT_META[slot].icon;
    slotEl.title = item ? (EQUIP_SLOT_META[slot].label + ': ' + item.name) : EQUIP_SLOT_META[slot].label;
  });

  const sortedIds = Object.keys(counts).sort(compareInventoryItems);
  bagGrid.innerHTML = '';
  sortedIds.forEach(id => {
    const item = ITEMS[id];
    if (!item) return;
    const cell = document.createElement('button');
    cell.className = 'bag-cell' + (item.type === 'potion' ? ' potion-cell' : '');
    cell.innerHTML = item.icon + ((counts[id] || 0) > 1 ? '<span class="cell-count">' + counts[id] + '</span>' : '');
    cell.title = item.name;
    function handleBagTap() {
      openItemPopup({ itemId: id, source: 'inventory' });
    }
    bindTap(cell, handleBagTap, { stopPropagation: true });
    bagGrid.appendChild(cell);
  });
}
function buyItem(itemId) {
  const item = ITEMS[itemId];
  if (!item || player.gold < item.price) {
    showToast('골드가 부족합니다');
    return;
  }
  player.gold -= item.price;
  inventory.push(itemId);
  AudioSystem.sfx.buy();
  showToast(item.name + ' 구매');
  updateHUD();
  autoSave();
  renderShop();
}
function getSellPrice(itemId) {
  const item = ITEMS[itemId];
  if (!item) return 0;
  return Math.max(1, Math.floor((item.price || 0) * 0.5));
}
function sellItem(itemId) {
  const idx = inventory.indexOf(itemId);
  if (idx === -1) return;
  const item = ITEMS[itemId];
  inventory.splice(idx, 1);
  player.gold += getSellPrice(itemId);
  AudioSystem.sfx.sell();
  showToast((item ? item.name : '아이템') + ' 판매');
  updateHUD();
  autoSave();
  renderShop();
  if (invOpen) renderInventory();
}
function buildShopBuyCard(itemId) {
  const item = ITEMS[itemId];
  if (!item) return '';
  const recommendation = getShopRecommendation(itemId);
  const affordable = player.gold >= item.price;
  return '' +
    '<div class="shop-item' + (recommendation ? ' recommended' : '') + '">' +
      (recommendation ? '<div class="shop-badge">' + recommendation + '</div>' : '') +
      '<div class="icon">' + item.icon + '</div>' +
      '<div class="name">' + item.name + '</div>' +
      '<div class="stat">' + getItemSummary(item) + '</div>' +
      '<div class="price">💰 ' + item.price + '</div>' +
      '<div class="owned">보유 ' + getOwnedItemCount(itemId) + '</div>' +
      '<button class="btn" data-buy-item="' + itemId + '" ' + (affordable ? '' : 'disabled') + '>' + (affordable ? '구매' : '골드 부족') + '</button>' +
    '</div>';
}

function buildShopSellCard(itemId, count) {
  const item = ITEMS[itemId];
  if (!item) return '';
  return '' +
    '<div class="shop-item">' +
      '<div class="icon">' + item.icon + '</div>' +
      '<div class="name">' + item.name + '</div>' +
      '<div class="stat">' + getItemSummary(item) + '</div>' +
      '<div class="price">판매가 💰 ' + getSellPrice(itemId) + '</div>' +
      '<div class="owned">가방 x' + count + '</div>' +
      '<button class="btn" data-sell-item="' + itemId + '">판매</button>' +
    '</div>';
}

function bindShopActions() {
  shopItemsList.querySelectorAll('[data-buy-item]').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      buyItem(btn.getAttribute('data-buy-item'));
    }, { stopPropagation: true });
  });

  shopSellList.querySelectorAll('[data-sell-item]').forEach(btn => {
    bindTap(btn, () => {
      sellItem(btn.getAttribute('data-sell-item'));
    }, { stopPropagation: true });
  });
}

function renderShop() {
  switchShopTab(activeShopTab);
  shopGold.textContent = player.gold;

  const shopItems = activeShopNpc && Array.isArray(activeShopNpc.shopItems) ? activeShopNpc.shopItems : [];
  shopItemsList.innerHTML = shopItems.map(buildShopBuyCard).join('');

  const counts = getInventoryCounts();
  const sellIds = Object.keys(counts).sort(compareInventoryItems);
  shopSellList.innerHTML = sellIds.length === 0
    ? '<div class="quest-card shop-empty-card"><div class="quest-desc">판매할 아이템이 없습니다.</div></div>'
    : sellIds.map(itemId => buildShopSellCard(itemId, counts[itemId])).join('');

  bindShopActions();
}

// ─── Companion Panel ─────────────────────────────────────────────────────────
const companionPanel = document.getElementById('companion-panel');
bindTap(document.getElementById('companion-close'), () => closeCompanionPanel());

function openCompanionPanel() {
  companionPanelOpen = true;
  showPanel(companionPanel);
  renderCompanionPanel();
}
function closeCompanionPanel() {
  companionPanelOpen = false;
  hidePanel(companionPanel);
}
function buildCompanionSummaryCard(label, value, valueClass = '', extraClass = '') {
  return '<div class="companion-summary-card ' + extraClass + '">' +
    '<div class="summary-label">' + label + '</div>' +
    '<div class="summary-value ' + valueClass + '">' + value + '</div>' +
  '</div>';
}

function getCompanionActionState(cId, isActive, isDead) {
  if (isDead) {
    return { label: '사망', className: 'disabled', action: 'none', disabled: true };
  }
  if (isActive) {
    return { label: '해제', className: 'deactivate', action: 'deactivate', disabled: false };
  }
  if (activeCompanions.length >= 2) {
    return { label: '만석', className: 'disabled', action: 'none', disabled: true };
  }
  return { label: '선택', className: 'activate', action: 'activate', disabled: false };
}

function buildCompanionCard(cId) {
  const profile = getCompanionProfile(cId);
  const info = getCompanionRoster(cId);
  if (!info || !profile) return '';
  const isActive = activeCompanions.includes(cId);
  const isDead = deadCompanions.includes(cId);
  const maxHp = getCompanionMaxHp(cId);
  const currentHp = companionStates[cId] ? companionStates[cId].hp : maxHp;
  const hpPct = Math.max(0, Math.min(100, currentHp / maxHp * 100));
  const aiMode = getCompanionAIMode(cId, companionStates[cId]);
  const aiMeta = COMPANION_AI_MODES[aiMode] || COMPANION_AI_MODES.aggressive;
  const actionState = getCompanionActionState(cId, isActive, isDead);
  const statusText = isDead ? '사망' : isActive ? '출전 중' : '대기';
  const statusClass = isDead ? 'dead' : isActive ? 'active' : '';

  return '<div class="companion-card' + (isActive ? ' active' : '') + (isDead ? ' dead' : '') + '">' +
    '<div class="companion-card-top">' +
      '<div class="companion-card-icon" style="background:' + info.color + ';">' + (info.portraitIcon || '★') + '</div>' +
      '<div class="companion-card-main">' +
        '<div class="companion-card-name-row">' +
          '<div class="companion-card-name">' + info.name + '</div>' +
          '<div class="companion-status-badge ' + statusClass + '">' + statusText + '</div>' +
        '</div>' +
        '<div class="companion-card-role">' + profile.className + ' · ' + profile.roleLabel + '</div>' +
        '<div class="companion-card-skill">' + profile.skillName + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="companion-card-stats">' +
      '<span>ATK ' + getCompanionAtk(cId) + '</span>' +
      '<span>HP ' + Math.floor(currentHp) + '/' + maxHp + '</span>' +
    '</div>' +
    '<div class="companion-hp-bar"><div class="companion-hp-fill" style="width:' + hpPct + '%;"></div></div>' +
    '<div class="companion-card-actions">' +
      '<button class="comp-ai-btn companion-mini-btn" data-cid="' + cId + '" style="background:' + aiMeta.color + ';">AI: ' + aiMeta.label + '</button>' +
      '<button class="comp-btn companion-mini-btn ' + actionState.className + '" data-cid="' + cId + '" data-action="' + actionState.action + '"' + (actionState.disabled ? ' disabled' : '') + '>' + actionState.label + '</button>' +
    '</div>' +
    (isDead ? '<div class="companion-cost-note">신전에서 부활 가능</div>' : '') +
  '</div>';
}

function handleCompanionAiTap(cId) {
  const info = getCompanionRoster(cId);
  const nextMode = cycleCompanionAIMode(cId);
  const nextMeta = COMPANION_AI_MODES[nextMode] || COMPANION_AI_MODES.aggressive;
  showToast((info ? info.name : '동료') + ' AI: ' + nextMeta.label);
  renderCompanionPanel();
  autoSave();
}

function handleCompanionAction(cId, action) {
  if (action === 'activate') {
    if (activeCompanions.length < 2) {
      activeCompanions.push(cId);
      initCompanionState(cId);
    }
  } else if (action === 'deactivate') {
    activeCompanions = activeCompanions.filter(id => id !== cId);
    delete companionStates[cId];
  } else {
    return;
  }
  renderCompanionPanel();
  autoSave();
}

function bindCompanionPanelActions(content) {
  content.querySelectorAll('.comp-ai-btn').forEach(btn => {
    bindTap(btn, () => {
      handleCompanionAiTap(parseInt(btn.getAttribute('data-cid'), 10));
    }, { stopPropagation: true });
  });

  content.querySelectorAll('.comp-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      handleCompanionAction(
        parseInt(btn.getAttribute('data-cid'), 10),
        btn.getAttribute('data-action')
      );
    }, { stopPropagation: true });
  });
}

function renderCompanionPanel() {
  const content = document.getElementById('companion-content');
  if (companions.length === 0) {
    content.innerHTML = '<div class="companion-empty-state">아직 동료가 없습니다. 던전을 클리어하여 동료를 얻으세요!</div>';
    return;
  }

  const synergy = getActiveCompanionSynergy();
  content.innerHTML =
    '<div class="companion-summary-grid">' +
      buildCompanionSummaryCard('활성 동료', activeCompanions.length + '/2') +
      buildCompanionSummaryCard('수집', companions.length + '/' + getTotalCompanionCount()) +
      buildCompanionSummaryCard('사망', deadCompanions.length + '명', deadCompanions.length > 0 ? 'warn' : '') +
      buildCompanionSummaryCard('용병 슬롯', '잠김', 'lock', 'mercenary') +
    '</div>' +
    '<div class="companion-synergy-banner">' + (synergy ? ('시너지: ' + synergy.name + ' · ' + synergy.desc) : '시너지 없음 — 조합에 따라 추가 보너스가 생긴다') + '</div>' +
    '<div class="companion-grid">' + companions.map(buildCompanionCard).join('') + '</div>';

  bindCompanionPanelActions(content);
}

// ─── Temple Panel UI ─────────────────────────────────────────────────────
const templePanel = document.getElementById('temple-panel');
let templeOpen = false;
bindTap(document.getElementById('temple-close'), () => closeTemple());

function openTemple() {
  templeOpen = true;
  showPanel(templePanel);
  renderTemple();
}
function closeTemple() {
  templeOpen = false;
  hidePanel(templePanel);
}
function buildTempleEmptyState() {
  return '<div class="temple-empty-state">' +
    '<div class="temple-empty-icon">✨</div>' +
    '<div class="temple-empty-title">모든 동료가 건강합니다</div>' +
    '<div class="temple-empty-text">부활이 필요한 동료가 없습니다.</div>' +
  '</div>';
}

function buildTempleReviveRow(cId) {
  const info = getCompanionRoster(cId);
  if (!info) return '';
  const cost = getReviveCost(cId);
  const canAfford = player.gold >= cost;
  return '<div class="temple-revive-row">' +
    '<div class="temple-revive-icon" style="background:' + info.color + ';">' + (info.portraitIcon || '★') + '</div>' +
    '<div class="temple-revive-main">' +
      '<div class="temple-revive-name">' + info.name + '</div>' +
      '<div class="temple-revive-state">쓰러짐</div>' +
    '</div>' +
    '<div class="temple-revive-cost">💰 ' + cost + '</div>' +
    '<button class="temple-revive-btn" data-cid="' + cId + '"' + (canAfford ? '' : ' disabled') + '>' + (canAfford ? '부활' : '골드 부족') + '</button>' +
  '</div>';
}

function reviveCompanionFromTemple(cId) {
  const cost = getReviveCost(cId);
  if (player.gold < cost) return;
  player.gold -= cost;
  deadCompanions = deadCompanions.filter(id => id !== cId);
  AudioSystem.sfx.heal();
  const cInfo = getCompanionRoster(cId);
  showToast((cInfo ? cInfo.name : '동료') + ' 부활!');
  updateHUD();
  autoSave();
  renderTemple();
}

function reviveAllCompanionsFromTemple(totalCost) {
  if (player.gold < totalCost) return;
  player.gold -= totalCost;
  deadCompanions = [];
  AudioSystem.sfx.tierUp();
  showToast('모든 동료가 부활했습니다!');
  updateHUD();
  autoSave();
  renderTemple();
}

function bindTempleActions(content, totalCost) {
  content.querySelectorAll('.temple-revive-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      reviveCompanionFromTemple(parseInt(btn.getAttribute('data-cid'), 10));
    }, { stopPropagation: true });
  });

  const allBtn = document.getElementById('temple-revive-all');
  if (allBtn && !allBtn.disabled) {
    bindTap(allBtn, () => {
      reviveAllCompanionsFromTemple(totalCost);
    }, { stopPropagation: true });
  }
}

function renderTemple() {
  const content = document.getElementById('temple-content');

  if (deadCompanions.length === 0) {
    content.innerHTML = buildTempleEmptyState();
    return;
  }

  const totalCost = deadCompanions.reduce((sum, cId) => sum + getReviveCost(cId), 0);
  const canAffordAll = player.gold >= totalCost && deadCompanions.length > 1;

  content.innerHTML =
    '<div class="temple-note">쓰러진 동료를 골드를 사용하여 부활시킬 수 있습니다.</div>' +
    '<div class="temple-gold">💰 보유 골드: ' + player.gold + '</div>' +
    deadCompanions.map(buildTempleReviveRow).join('') +
    '<div class="temple-actions">' +
      '<button id="temple-revive-all" class="temple-revive-all-btn"' + (canAffordAll ? '' : ' disabled') + '>전체 부활 (💰 ' + totalCost + ')</button>' +
    '</div>';

  bindTempleActions(content, totalCost);
}

// ─── Skill Panel UI ──────────────────────────────────────────────────────
const skillPanel = document.getElementById('skill-panel');
bindTap(document.getElementById('skill-panel-close'), () => closeSkillPanel());

function openSkillPanel() {
  skillPanelOpen = true;
  showPanel(skillPanel);
  renderSkillPanel();
}
function closeSkillPanel() {
  skillPanelOpen = false;
  hidePanel(skillPanel);
}
const SKILL_BADGE_COLORS = {
  projectile: '#e74c3c',
  melee: '#e67e22',
  self: '#2ecc71',
  buff: '#3498db',
  aoe: '#8e44ad',
};

function getSkillSlotLabel(skillId) {
  for (let p = 0; p < skillPages.length; p++) {
    for (let s = 0; s < skillPages[p].length; s++) {
      if (skillPages[p][s] === skillId) {
        return '슬롯 ' + (p + 1) + '-' + (s + 1) + ' 등록됨';
      }
    }
  }
  return '';
}

function buildSkillCard(skill) {
  const slotLabel = getSkillSlotLabel(skill.id);
  const badgeColor = SKILL_BADGE_COLORS[skill.type] || '#555';
  const iconBg = skill.iconBg || '#444';
  return `
    <div class="skill-card">
      <div class="skill-icon-circle" style="--skill-icon-bg:${iconBg}22;--skill-icon-border:${iconBg}55;">${skill.icon}</div>
      <div class="skill-info">
        <div class="skill-name">${skill.name} <span class="skill-type-badge" style="--skill-type-bg:${badgeColor}22;--skill-type-color:${badgeColor};--skill-type-border:${badgeColor}44;">${skill.typeLabel || skill.type}</span></div>
        <div class="skill-desc">${skill.desc}</div>
        ${slotLabel ? `<div class="skill-slot-info">${slotLabel}</div>` : ''}
      </div>
      <div class="skill-stats">
        <div class="skill-stat mp">💧 ${skill.mpCost}</div>
        <div class="skill-stat cd">⏱ ${(skill.cooldown / 1000).toFixed(1)}s</div>
      </div>
    </div>
  `;
}

function renderSkillPanel() {
  const content = document.getElementById('skill-panel-content');
  content.innerHTML = SKILLS.map(buildSkillCard).join('');
}

// ─── Quest Panel UI ──────────────────────────────────────────────────────
const questPanel = document.getElementById('quest-panel');
bindTap(document.getElementById('quest-panel-close'), () => closeQuestPanel());

function openQuestPanel() {
  questPanelOpen = true;
  showPanel(questPanel);
  renderQuestPanel();
}
function closeQuestPanel() {
  questPanelOpen = false;
  hidePanel(questPanel);
}
function buildQuestRow(label, value) {
  return '<div class="quest-row"><span class="quest-label">' + label + '</span><span class="quest-value">' + value + '</span></div>';
}

function buildQuestFocusSection({ focusTitle, focusText, focusChip, focusChipClass, currentMainStatus, readySubCount, acceptedCount, nextDungeon }) {
  let html = '<div class="quest-card primary quest-focus-card">';
  html += '<div class="quest-focus-head"><div class="quest-focus-title">' + focusTitle + '</div><span class="quest-chip ' + focusChipClass + '">' + focusChip + '</span></div>';
  html += '<div class="quest-focus-text">' + focusText + '</div>';
  html += '<div class="quest-summary-grid">';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">메인 진행</span><span class="quest-summary-value">' + completedMainQuests.length + '/' + MAIN_QUESTS.length + '</span></div>';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">서브 진행</span><span class="quest-summary-value">' + acceptedCount + '개</span></div>';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">보고 가능</span><span class="quest-summary-value">' + ((currentMainStatus.ready ? 1 : 0) + readySubCount) + '개</span></div>';
  html += '<div class="quest-summary-item"><span class="quest-summary-label">다음 던전</span><span class="quest-summary-value">' + (nextDungeon ? nextDungeon.name : '완료') + '</span></div>';
  html += '</div></div>';
  return html;
}

function buildMainQuestSection(currentQuest, currentMainStatus) {
  let html = '<div class="quest-section-title">메인 진행</div><div class="quest-card primary">';
  html += buildQuestRow('현재 목표', currentQuest ? currentQuest.title : '모든 메인 퀘스트 완료');
  if (currentQuest) {
    html += buildQuestRow('의뢰 NPC', getQuestNpcName(getQuestOfferNpcId(currentQuest)));
    html += buildQuestRow('보고 NPC', getQuestNpcName(getQuestTurnInNpcId(currentQuest)));
    html += buildQuestRow('상태', currentMainStatus.label);
    if (currentQuest.reward) html += buildQuestRow('보상', buildQuestRewardText(currentQuest));
    html += '<div class="quest-desc">' + currentQuest.description + '</div>';
    html += '<div class="quest-desc quest-desc-emphasis">' +
      (currentMainStatus.ready
        ? ('목표 달성 완료. <span class="quest-inline-highlight">' + getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '</span>에게 돌아가 보상을 수령하세요.')
        : ('다음 행동: ' + (currentQuest.hint || currentQuest.description))) +
      '</div>';
  } else {
    html += buildQuestRow('진행도', completedMainQuests.length + '/' + MAIN_QUESTS.length);
    html += '<div class="quest-desc">메인 루프를 전부 완료했습니다. 동료 조합과 장비를 계속 시험해볼 수 있습니다.</div>';
  }
  html += '</div>';
  return html;
}

function buildDungeonProgressSection(nextDungeon) {
  let html = '<div class="quest-section-title">던전 진행</div><div class="quest-dungeon-list">';
  DUNGEON_INFO.forEach((info, idx) => {
    const cleared = dungeonsCleared.includes(idx);
    const isNext = nextDungeon && nextDungeon.id === idx;
    html += '<div class="quest-dungeon-item ' + (cleared ? 'done' : '') + ' ' + (isNext ? 'next' : '') + '">';
    html += '<div class="quest-dungeon-head">';
    html += '<div><div class="quest-dungeon-name">' + info.name + '</div><div class="quest-dungeon-meta">추천 Lv ' + info.recommendedLevel + ' · 지역 ' + info.zone + '</div></div>';
    html += '<div class="quest-chip ' + (cleared ? 'done' : isNext ? 'active' : '') + '">' + (cleared ? '완료' : isNext ? '다음 목표' : '미완료') + '</div>';
    html += '</div>';
    html += '<div class="quest-dungeon-boss">보스: ' + info.bossName + ' · 패턴: ' + info.bossSkillName + '</div>';
    html += '<div class="quest-dungeon-reward">동료 보상: ' + info.companionName + '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function buildSubquestStatusSection({ acceptedCount, completedCount, totalSubquests, availableSubquests, acceptedDetails }) {
  let html = '<div class="quest-section-title">서브 퀘스트 현황</div><div class="quest-card">';
  html += buildQuestRow('수락 중', acceptedCount);
  html += buildQuestRow('완료', completedCount + '/' + totalSubquests);
  html += buildQuestRow('새로 수락 가능', availableSubquests.length);
  html += '</div>';

  if (acceptedDetails.length > 0) {
    acceptedDetails.forEach(detail => {
      html += '<div class="quest-card">';
      html += buildQuestRow('퀘스트', detail.quest.title);
      html += '<div class="quest-chip-row">' +
        '<span class="quest-chip ' + (detail.readyToTurnIn ? 'done' : 'active') + '">' + detail.statusLabel + '</span>' +
        '<span class="quest-chip">진행도 ' + detail.progressText + '</span>' +
      '</div>';
      html += buildQuestRow('의뢰 NPC', detail.offerNpcName);
      html += buildQuestRow('보고 NPC', detail.turnInNpcName);
      html += buildQuestRow('보상', detail.rewardText || '없음');
      html += '<div class="quest-desc">' + detail.quest.description + '</div>';
      html += '<div class="quest-desc quest-desc-emphasis ' + (detail.readyToTurnIn ? 'ready' : 'pending') + '">' +
        (detail.readyToTurnIn
          ? ('목표 달성 완료. ' + detail.turnInNpcName + '에게 돌아가 보상을 수령하세요.')
          : ('아직 진행 중입니다. 완료 후 ' + detail.turnInNpcName + '에게 보고하세요.')) +
        '</div>';
      html += '</div>';
    });
  } else {
    html += '<div class="quest-card"><div class="quest-desc">현재 진행 중인 서브 퀘스트가 없습니다.</div></div>';
  }

  if (availableSubquests.length > 0) {
    html += '<div class="quest-section-title">수락 가능한 서브 퀘스트</div>';
    availableSubquests.forEach(quest => {
      html += '<div class="quest-card">';
      html += buildQuestRow('퀘스트', quest.title);
      html += '<div class="quest-chip-row"><span class="quest-chip active">수락 가능</span></div>';
      html += buildQuestRow('의뢰 NPC', getQuestNpcName(getQuestOfferNpcId(quest)));
      html += buildQuestRow('보상 수령 NPC', getQuestNpcName(getQuestTurnInNpcId(quest)));
      html += buildQuestRow('예상 보상', buildQuestRewardText(quest) || '없음');
      html += '<div class="quest-desc">' + quest.description + '</div>';
      html += '</div>';
    });
  }
  return html;
}

function renderQuestPanel() {
  const content = document.getElementById('quest-panel-content');
  const nextDungeon = DUNGEON_INFO.find((_, idx) => !dungeonsCleared.includes(idx));
  const currentQuest = getCurrentMainQuest();
  const currentMainStatus = getMainQuestStatus(currentQuest);
  const totalSubquests = SUBQUESTS.length;
  const acceptedCount = acceptedSubquests.length;
  const completedCount = completedSubquests.length;
  const availableSubquests = getAvailableSubquests();
  const acceptedDetails = getAcceptedSubquestsDetailed().slice().sort((a, b) => {
    if (a.readyToTurnIn !== b.readyToTurnIn) return a.readyToTurnIn ? -1 : 1;
    return a.quest.title.localeCompare(b.quest.title, 'ko');
  });
  const readySubCount = acceptedDetails.filter(detail => detail.readyToTurnIn).length;

  let focusTitle = '지금 할 일';
  let focusText = '다음 퀘스트를 확인해 진행을 이어가세요.';
  let focusChip = '진행 중';
  let focusChipClass = 'active';

  if (currentQuest && currentMainStatus.ready) {
    focusText = getQuestNpcName(getQuestTurnInNpcId(currentQuest)) + '에게 가서 메인 퀘스트 보상을 받으세요.';
    focusChip = '메인 보고 가능';
    focusChipClass = 'done';
  } else if (readySubCount > 0) {
    focusText = '서브 퀘스트 ' + readySubCount + '개를 바로 보고할 수 있습니다.';
    focusChip = '서브 보고 가능';
    focusChipClass = 'done';
  } else if (currentQuest) {
    focusText = currentQuest.hint || currentQuest.description;
    focusChip = currentMainStatus.label;
  } else if (availableSubquests.length > 0) {
    focusText = '마을 NPC와 대화해 새 서브 퀘스트를 받아보세요.';
    focusChip = '수락 가능';
  } else {
    focusTitle = '현재 상태';
    focusText = '메인 루프를 완료했습니다. 장비와 동료 조합을 다듬으며 계속 성장할 수 있습니다.';
    focusChip = '완료';
    focusChipClass = 'done';
  }

  content.innerHTML = [
    buildQuestFocusSection({ focusTitle, focusText, focusChip, focusChipClass, currentMainStatus, readySubCount, acceptedCount, nextDungeon }),
    buildMainQuestSection(currentQuest, currentMainStatus),
    buildDungeonProgressSection(nextDungeon),
    buildSubquestStatusSection({ acceptedCount, completedCount, totalSubquests, availableSubquests, acceptedDetails })
  ].join('');
}

function getVillageUpgradeDefinitions() {
  return Object.keys(TOWN_UPGRADES).map(key => {
    const def = TOWN_UPGRADES[key];
    return {
      key,
      icon: def.icon,
      name: def.name,
      maxLevel: def.maxLevel,
      description: def.bonusText,
      nextCost: getVillageUpgradeCost(key),
      levels: Array.from({ length: def.maxLevel }, (_, idx) => ({
        level: idx + 1,
        bonus: key === 'forge'
          ? ('공격력 +' + ((idx + 1) * 2) + ' / 동료 공격 +' + (idx + 1))
          : key === 'guard'
            ? ('방어력 +' + (idx + 1) + ' / 동료 체력 +' + ((idx + 1) * 10))
            : key === 'trade'
              ? ('골드 획득 +' + ((idx + 1) * 12) + '%')
              : ('포션 효율 +' + ((idx + 1) * 15) + '% / 부활비 할인 ' + Math.min(50, (idx + 1) * 10) + '%')
      }))
    };
  });
}

function getVillageTierLabel() {
  const cleared = dungeonsCleared.length;
  const totalUpgradeLevel = villageUpgrades.forge + villageUpgrades.guard + villageUpgrades.trade + villageUpgrades.alchemy;
  const score = cleared * 2 + totalUpgradeLevel;
  if (score >= 24) return '영웅의 도시';
  if (score >= 18) return '요새화된 거점';
  if (score >= 12) return '활기찬 정착지';
  if (score >= 6) return '성장하는 마을';
  return '개척 마을';
}
function canUpgradeVillage(key) {
  const def = TOWN_UPGRADES[key];
  if (!def) return false;
  const currentLevel = villageUpgrades[key] || 0;
  if (currentLevel >= def.maxLevel) return false;
  return player.gold >= getVillageUpgradeCost(key);
}
function upgradeVillage(key) {
  const def = TOWN_UPGRADES[key];
  if (!def) return;
  const currentLevel = villageUpgrades[key] || 0;
  if (currentLevel >= def.maxLevel) {
    showToast(def.name + '은 이미 최대 레벨입니다');
    return;
  }
  const cost = getVillageUpgradeCost(key);
  if (player.gold < cost) {
    showToast('골드가 부족합니다');
    return;
  }
  player.gold -= cost;
  villageUpgrades[key] = currentLevel + 1;
  AudioSystem.sfx.buy();
  showToast(def.name + ' 강화 Lv ' + villageUpgrades[key]);
  updateHUD();
  autoSave();
  renderVillagePanel();
}

// ─── Village Panel UI ────────────────────────────────────────────────────
const villagePanel = document.getElementById('village-panel');
bindTap(document.getElementById('village-panel-close'), () => closeVillagePanel());

function openVillagePanel() {
  villagePanelOpen = true;
  showPanel(villagePanel);
  renderVillagePanel();
}
function closeVillagePanel() {
  villagePanelOpen = false;
  hidePanel(villagePanel);
}
function buildVillageOverviewCard(tierLabel, completionPct, totalUpgradeLevel, nextUpgrade) {
  let html = '<div class="quest-card primary village-overview-card">';
  html += '<div class="quest-focus-head"><div class="quest-focus-title">마을 발전 요약</div><span class="quest-chip active">' + tierLabel + '</span></div>';
  html += '<div class="quest-focus-text">던전을 돌파할수록 마을이 성장하고, 시설 강화는 전투력과 경제 보너스로 이어집니다.</div>';
  html += '<div class="village-summary-grid">';
  html += '<div class="village-summary-item"><span class="village-summary-label">던전 확보율</span><span class="village-summary-value">' + dungeonsCleared.length + '/' + DUNGEON_INFO.length + '</span></div>';
  html += '<div class="village-summary-item"><span class="village-summary-label">성장률</span><span class="village-summary-value">' + completionPct + '%</span></div>';
  html += '<div class="village-summary-item"><span class="village-summary-label">총 업그레이드</span><span class="village-summary-value">Lv ' + totalUpgradeLevel + '</span></div>';
  html += '<div class="village-summary-item"><span class="village-summary-label">다음 투자</span><span class="village-summary-value">' + (nextUpgrade ? nextUpgrade.name : '완료') + '</span></div>';
  html += '</div>';
  if (nextUpgrade) {
    html += '<div class="village-tip-banner">다음 추천 투자: <strong>' + nextUpgrade.icon + ' ' + nextUpgrade.name + '</strong> · 비용 ' + getVillageUpgradeCost(nextUpgrade.key) + 'G</div>';
  }
  html += '</div>';
  return html;
}

function buildVillageBenefitRows(upgrade, currentLevel) {
  return upgrade.levels.map((levelInfo, idx) => {
    const reached = currentLevel > idx;
    const current = currentLevel === idx + 1;
    return '<div class="village-benefit-item ' + (reached ? 'reached' : '') + ' ' + (current ? 'current' : '') + '">' +
      '<span class="village-benefit-label">Lv ' + (idx + 1) + '</span>' +
      '<span class="village-benefit-value">' + levelInfo.bonus + '</span>' +
    '</div>';
  }).join('');
}

function buildVillageUpgradeCard(upgrade) {
  const currentLevel = villageUpgrades[upgrade.key] || 0;
  const nextLevelInfo = upgrade.levels[currentLevel] || null;
  const canUpgrade = canUpgradeVillage(upgrade.key);
  const nextCost = getVillageUpgradeCost(upgrade.key);

  let html = '<div class="village-upgrade-card">';
  html += '<div class="village-upgrade-top">';
  html += '<div><div class="village-upgrade-name">' + upgrade.icon + ' ' + upgrade.name + '</div><div class="village-upgrade-meta">현재 레벨 ' + currentLevel + ' / ' + upgrade.maxLevel + '</div></div>';
  html += '<div class="quest-chip ' + (currentLevel >= upgrade.maxLevel ? 'done' : 'active') + '">' + (currentLevel >= upgrade.maxLevel ? '완료' : '성장 가능') + '</div>';
  html += '</div>';
  html += '<div class="quest-desc">' + upgrade.description + '</div>';
  html += '<div class="village-next-upgrade">' + (nextLevelInfo ? ('다음 단계: Lv ' + (currentLevel + 1) + ' · ' + nextLevelInfo.bonus + ' · 비용 ' + nextCost + 'G') : '최대 레벨 달성') + '</div>';
  html += '<div class="village-upgrade-actions">';
  html += '<div class="village-upgrade-cost">' + (currentLevel >= upgrade.maxLevel ? '최대 레벨 완료' : ('보유 골드 ' + player.gold + 'G · 필요 골드 ' + nextCost + 'G')) + '</div>';
  html += '<button class="village-upgrade-btn" data-upgrade="' + upgrade.key + '" ' + ((currentLevel >= upgrade.maxLevel || !canUpgrade) ? 'disabled' : '') + '>' + (currentLevel >= upgrade.maxLevel ? '완료' : (canUpgrade ? '강화하기' : '골드 부족')) + '</button>';
  html += '</div>';
  html += '<div class="village-benefit-list">' + buildVillageBenefitRows(upgrade, currentLevel) + '</div>';
  html += '</div>';
  return html;
}

function bindVillageUpgradeActions(content) {
  content.querySelectorAll('.village-upgrade-btn').forEach(btn => {
    if (btn.disabled) return;
    bindTap(btn, () => {
      const key = btn.getAttribute('data-upgrade');
      if (!key) return;
      upgradeVillage(key);
    }, { stopPropagation: true });
  });
}

function renderVillagePanel() {
  const content = document.getElementById('village-panel-content');
  const upgrades = getVillageUpgradeDefinitions();
  const tierLabel = getVillageTierLabel();
  const completionPct = Math.min(100, Math.round((dungeonsCleared.length / DUNGEON_INFO.length) * 100));
  const totalUpgradeLevel = villageUpgrades.forge + villageUpgrades.guard + villageUpgrades.trade + villageUpgrades.alchemy;
  const nextUpgrade = upgrades
    .map(upgrade => ({ ...upgrade, currentLevel: villageUpgrades[upgrade.key] || 0 }))
    .filter(upgrade => upgrade.currentLevel < upgrade.maxLevel)
    .sort((a, b) => getVillageUpgradeCost(a.key) - getVillageUpgradeCost(b.key))[0];

  content.innerHTML =
    buildVillageOverviewCard(tierLabel, completionPct, totalUpgradeLevel, nextUpgrade) +
    '<div class="quest-section-title">시설 업그레이드</div>' +
    upgrades.map(buildVillageUpgradeCard).join('');

  bindVillageUpgradeActions(content);
}
