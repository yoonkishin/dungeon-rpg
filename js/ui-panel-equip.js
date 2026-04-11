'use strict';

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
    const inst = equipped[slot];
    if (!inst || !ITEMS[inst.itemId]) return;
    openItemPopup({ itemId: inst.itemId, source: 'equipped', slot });
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
  inventory.forEach(e => {
    counts[e.itemId] = (counts[e.itemId] || 0) + 1;
  });
  return counts;
}
function getOwnedItemCount(itemId) {
  let count = inventory.filter(e => e.itemId === itemId).length;
  Object.keys(equipped).forEach(slot => {
    if (equipped[slot] && equipped[slot].itemId === itemId) count++;
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
    const acc1 = equipped.accessory1 ? ITEMS[equipped.accessory1.itemId] : null;
    const acc2 = equipped.accessory2 ? ITEMS[equipped.accessory2.itemId] : null;
    const score = target => target ? ((target.atk || 0) + (target.def || 0) + (target.critBonus || 0) + (target.goldBonus || 0) + ((target.speedBonus || 0) * 10)) : -1;
    return score(acc1) <= score(acc2) ? 'accessory1' : 'accessory2';
  }
  if (item.type === 'weapon' || item.type === 'armor' || item.type === 'helmet' || item.type === 'boots' || item.type === 'shield' || item.type === 'event') {
    return item.type;
  }
  return null;
}
function equipInventoryItem(invEntry) {
  const item = ITEMS[invEntry.itemId];
  if (!item) return;
  const slot = getPreferredEquipSlot(item);
  if (!slot) return;
  const invIdx = inventory.indexOf(invEntry);
  if (invIdx === -1) return;
  const previous = equipped[slot];
  inventory.splice(invIdx, 1);
  equipped[slot] = invEntry;
  if (previous) inventory.push(previous);
  AudioSystem.sfx.pickup();
  showToast(item.name + ' 장착');
  updateHUD();
  autoSave();
}
function unequipSlot(slot) {
  const inst = equipped[slot];
  if (!inst) return;
  inventory.push(inst);
  equipped[slot] = null;
  AudioSystem.sfx.sell();
  showToast((ITEMS[inst.itemId] ? ITEMS[inst.itemId].name : '장비') + ' 해제');
  updateHUD();
  autoSave();
}
function consumeInventoryItem(invEntry) {
  const item = ITEMS[invEntry.itemId];
  const idx = inventory.indexOf(invEntry);
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
  const currentStatMap = new Map(getItemStatEntries(currentItem).map(entry => [entry.label, entry]));
  const nextEntries = getItemStatEntries(newItem);
  const labels = ['ATK', 'DEF', 'SPD', '치명타', '골드', '회복'];
  const rows = labels.map(label => {
    const currentValue = currentStatMap.has(label) ? currentStatMap.get(label).value : 0;
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
  const currentItem = equipped[slot] ? ITEMS[equipped[slot].itemId] : null;
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

function openItemPopup({ itemId, source, slot, invEntry }) {
  const item = ITEMS[itemId];
  if (!item) return;
  const targetSlot = slot || getPreferredEquipSlot(item);
  const currentItem = targetSlot && equipped[targetSlot] ? ITEMS[equipped[targetSlot].itemId] : null;
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
      equipInventoryItem(invEntry);
      closeItemPopup();
      renderInventory();
    });
  }
  if (canUse) {
    appendPopupActionButton(btns, 'use', '사용', () => {
      consumeInventoryItem(invEntry);
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
    const inst = equipped[slot];
    const item = inst ? ITEMS[inst.itemId] : null;
    slotEl.classList.toggle('equipped', !!item);
    slotEl.innerHTML = item ? item.icon : EQUIP_SLOT_META[slot].icon;
    slotEl.title = item ? (EQUIP_SLOT_META[slot].label + ': ' + item.name) : EQUIP_SLOT_META[slot].label;
  });

  const sortedIds = Object.keys(counts).sort(compareInventoryItems);
  bagGrid.innerHTML = '';
  sortedIds.forEach(id => {
    const item = ITEMS[id];
    if (!item) return;
    // Find the first inventory entry for this itemId to pass as invEntry
    const firstEntry = inventory.find(e => e.itemId === id);
    const cell = document.createElement('button');
    cell.className = 'bag-cell' + (item.type === 'potion' ? ' potion-cell' : '');
    cell.innerHTML = item.icon + ((counts[id] || 0) > 1 ? '<span class="cell-count">' + counts[id] + '</span>' : '');
    cell.title = item.name;
    function handleBagTap() {
      openItemPopup({ itemId: id, source: 'inventory', invEntry: firstEntry });
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
  inventory.push(createItemInstance(itemId));
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
function sellItem(invEntry) {
  const idx = inventory.indexOf(invEntry);
  if (idx === -1) return;
  const item = ITEMS[invEntry.itemId];
  inventory.splice(idx, 1);
  player.gold += getSellPrice(invEntry.itemId);
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
      const sellId = btn.getAttribute('data-sell-item');
      const entry = inventory.find(e => e.itemId === sellId);
      if (entry) sellItem(entry);
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
