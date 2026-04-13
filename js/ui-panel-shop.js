'use strict';

// ─── Shop Panel UI ──────────────────────────────────────────────────────────
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
let shopOpen = false;
let activeShopNpc = null;
let activeShopTab = 'buy';

bindTap(shopCloseBtn, () => closeShop());
bindTap(shopTabBuy, () => switchShopTab('buy'));
bindTap(shopTabSell, () => switchShopTab('sell'));

function openShop(npc) {
  if (!npc) return;
  if (invOpen) closeInventory();
  activeShopNpc = npc;
  activeShopTab = 'buy';
  shopOpen = true;
  if (shopTitle) shopTitle.textContent = '\uD83C\uDFEA ' + npc.name;
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
function buyItem(itemId) {
  const item = ITEMS[itemId];
  if (!item || player.gold < item.price) {
    showToast('\uACE8\uB4DC\uAC00 \uBD80\uC871\uD569\uB2C8\uB2E4');
    return;
  }
  player.gold -= item.price;
  inventory.push(createItemInstance(itemId));
  AudioSystem.sfx.buy();
  showToast(item.name + ' \uAD6C\uB9E4');
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
  showToast((item ? item.name : '\uC544\uC774\uD15C') + ' \uD310\uB9E4');
  updateHUD();
  autoSave();
  renderShop();
  if (invOpen) renderInventory();
}
function isItemEquipped(itemId) {
  return Object.values(equipped).some(inst => inst && inst.itemId === itemId);
}
function buildShopBuyCard(itemId) {
  const item = ITEMS[itemId];
  if (!item) return '';
  const recommendation = getShopRecommendation(itemId);
  const affordable = player.gold >= item.price;
  const isUpgrade = recommendation === '\uC5C5\uADF8\uB808\uC774\uB4DC';
  const isFirst = recommendation === '\uCCAB \uC7A5\uBE44';
  const isRestock = recommendation === '\uBCF4\uCDA9 \uCD94\uCC9C';
  const badgeCls = isUpgrade ? 'upgrade' : isFirst ? 'first' : isRestock ? 'restock' : '';
  const btnCls = isUpgrade ? ' btn-upgrade' : '';
  return '' +
    '<div class="shop-item' + (recommendation ? ' recommended' : '') + '">' +
      (recommendation ? '<div class="shop-badge ' + badgeCls + '">' + recommendation + '</div>' : '') +
      '<div class="icon">' + item.icon + '</div>' +
      '<div class="name">' + item.name + '</div>' +
      '<div class="stat">' + getItemSummary(item) + '</div>' +
      '<div class="price">\uD83D\uDCB0 ' + item.price + '</div>' +
      '<div class="owned">\uBCF4\uC720 ' + getOwnedItemCount(itemId) + '</div>' +
      '<button class="btn' + btnCls + '" data-buy-item="' + itemId + '" ' + (affordable ? '' : 'disabled') + '>' + (affordable ? '\uAD6C\uB9E4' : '\uACE8\uB4DC \uBD80\uC871') + '</button>' +
    '</div>';
}
function buildShopSellCard(itemId, count) {
  const item = ITEMS[itemId];
  if (!item) return '';
  const equippedMark = isItemEquipped(itemId);
  return '' +
    '<div class="shop-item">' +
      '<div class="icon">' + item.icon + '</div>' +
      '<div class="name">' + item.name + '</div>' +
      '<div class="stat">' + getItemSummary(item) + '</div>' +
      '<div class="price">\uD310\uB9E4\uAC00 \uD83D\uDCB0 ' + getSellPrice(itemId) + '</div>' +
      '<div class="owned">\uAC00\uBC29 x' + count + (equippedMark ? ' <span class="equipped-tag">\uC7A5\uCC29\uC911</span>' : '') + '</div>' +
      '<button class="btn" data-sell-item="' + itemId + '">\uD310\uB9E4</button>' +
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
    ? '<div class="quest-card shop-empty-card"><div class="quest-desc">\uD310\uB9E4\uD560 \uC544\uC774\uD15C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div></div>'
    : sellIds.map(itemId => buildShopSellCard(itemId, counts[itemId])).join('');
  bindShopActions();
}
