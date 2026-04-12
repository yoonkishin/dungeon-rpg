'use strict';

// ─── Joystick ─────────────────────────────────────────────────────────────────
const joyZone = document.getElementById('joystick-zone');
const joyThumb = document.getElementById('joystick-thumb');
const joyBase = document.getElementById('joystick-base');
let joyActive = false;
let joyId = -1;
let joyStartX = 0, joyStartY = 0;
let joyDx = 0, joyDy = 0;
const JOY_RADIUS = 45;
const JOY_DEAD = 0.12;

joyZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  joyId = t.identifier;
  joyActive = true;
  const rect = joyZone.getBoundingClientRect();
  joyStartX = rect.left + rect.width/2;
  joyStartY = rect.top + rect.height/2;
  updateJoy(t);
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  let handled = false;
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      if (!handled) {
        e.preventDefault();
        handled = true;
      }
      updateJoy(t);
    }
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyActive = false;
      joyId = -1;
      joyDx = 0; joyDy = 0;
      joyThumb.style.transform = 'translate(-50%, -50%)';
    }
  }
});

document.addEventListener('touchcancel', (e) => {
  for (let t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyActive = false;
      joyId = -1;
      joyDx = 0;
      joyDy = 0;
      joyThumb.style.transform = 'translate(-50%, -50%)';
    }
  }
});

function updateJoy(touch) {
  let dx = touch.clientX - joyStartX;
  let dy = touch.clientY - joyStartY;
  const dist2 = Math.sqrt(dx*dx + dy*dy);
  if (dist2 > JOY_RADIUS) {
    dx = dx / dist2 * JOY_RADIUS;
    dy = dy / dist2 * JOY_RADIUS;
  }
  joyDx = dx / JOY_RADIUS;
  joyDy = dy / JOY_RADIUS;
  joyThumb.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}

// ─── Attack Button ────────────────────────────────────────────────────────────
const attackBtn = document.getElementById('attack-btn');
let attackQueued = false;

attackBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  attackQueued = true;
  attackBtn.classList.add('pressed');
}, { passive: false });

attackBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  attackBtn.classList.remove('pressed');
}, { passive: false });

// ─── Potion Button ────────────────────────────────────────────────────────────
const potionBtn = document.getElementById('potion-btn');
potionBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  usePotion();
}, { passive: false });
potionBtn.addEventListener('click', (e) => {
  e.preventDefault();
  usePotion();
});

function usePotion() {
  if (player.hp >= player.maxHp) return;
  const idx = inventory.findIndex(e => e.itemId === 'potion_hp2');
  const idx2 = inventory.findIndex(e => e.itemId === 'potion_hp');
  const useIdx = idx >= 0 ? idx : idx2;
  if (useIdx < 0) return;
  const entry = inventory[useIdx];
  const itemId = entry.itemId;
  const item = ITEMS[itemId];
  if (!item || item.type !== 'potion') return;
  const boostedHeal = Math.floor(item.heal * getHealingMultiplier());
  const healAmt = Math.min(boostedHeal, player.maxHp - player.hp);
  player.hp = Math.min(player.hp + boostedHeal, player.maxHp);
  inventory.splice(useIdx, 1);
  addParticles(player.x, player.y, '#e74c3c', 10);
  if (healAmt > 0) addDamageNumber(player.x, player.y, healAmt, 'heal');
  AudioSystem.sfx.heal();
  updateHUD();
  requestAutoSave();
}
