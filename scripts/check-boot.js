const fs = require('fs');
const vm = require('vm');
const path = require('path');

const base = path.resolve(__dirname, '..');
const files = [
  'js/error-overlay.js',
  'js/constants.js',
  'js/audio.js',
  'js/maps.js',
  'js/data.js',
  'js/data-companions.js',
  'js/data-growth.js',
  'js/data-emblems.js',
  'js/growth-runtime.js',
  'js/data-town.js',
  'js/data-quests.js',
  'js/quest-runtime.js',
  'js/state.js',
  'js/helpers.js',
  'js/enemies.js',
  'js/combat.js',
  'js/boss-effects.js',
  'js/transitions.js',
  'js/skills.js',
  'js/emblem-presenter.js',
  'js/character-model.js',
  'js/companion-party.js',
  'js/companion-ai.js',
  'js/render-map.js',
  'js/render-entities.js',
  'js/render-effects.js',
  'js/render-minimap.js',
  'js/rendering.js',
  'js/game-controls.js',
  'js/ui-manager.js',
  'js/ui-panel-developer.js',
  'js/ui-panel-profile.js',
  'js/ui-panel-equip.js',
  'js/ui-panel-shop.js',
  'js/ui-panel-companion.js',
  'js/ui-panel-temple.js',
  'js/ui-panel-skill.js',
  'js/ui-panel-quest.js',
  'js/ui-panel-training.js',
  'js/ui-panel-emblem.js',
  'js/ui-panel-village.js',
  'js/save.js',
  'js/main.js',
  'js/pwa.js',
];

function makeElement(id) {
  return {
    id,
    style: {},
    className: '',
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    width: 0,
    height: 0,
    clientWidth: 1280,
    clientHeight: 720,
    children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    dataset: {},
    appendChild(child) { this.children.push(child); return child; },
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    querySelector() { return makeElement('query'); },
    querySelectorAll() { return []; },
    getContext() {
      return {
        setTransform() {}, clearRect() {}, fillRect() {}, strokeRect() {}, beginPath() {}, closePath() {},
        moveTo() {}, lineTo() {}, arc() {}, fill() {}, stroke() {}, save() {}, restore() {}, translate() {},
        scale() {}, rotate() {}, drawImage() {}, fillText() {}, strokeText() {}, measureText() { return { width: 20 }; },
        roundRect() {}, clip() {}, createLinearGradient() { return { addColorStop() {} }; },
        createRadialGradient() { return { addColorStop() {} }; },
      };
    },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    focus() {}, blur() {}, click() {},
    offsetHeight: 720,
  };
}

const elements = new Map();
const document = {
  documentElement: makeElement('documentElement'),
  body: makeElement('body'),
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  },
  createElement(tag) { return makeElement(tag); },
  querySelector(sel) { return makeElement(sel); },
  querySelectorAll() { return []; },
  addEventListener() {},
  removeEventListener() {},
};
document.documentElement.requestFullscreen = () => Promise.resolve();

const storage = {};
const context = {
  console,
  Math,
  Date,
  JSON,
  setTimeout(fn) { return 1; },
  clearTimeout() {},
  setInterval() { return 1; },
  clearInterval() {},
  requestAnimationFrame() { return 1; },
  cancelAnimationFrame() {},
  performance: { now: () => 0 },
  Image: function() { return makeElement('img'); },
  Audio: function() { return { play() {}, pause() {}, currentTime: 0, volume: 1, loop: false }; },
  AudioContext: function() {
    return {
      state: 'running',
      resume() { return Promise.resolve(); },
      createOscillator() { return { connect() {}, start() {}, stop() {}, type: 'sine', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} } }; },
      createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; },
      destination: {},
      currentTime: 0,
    };
  },
  webkitAudioContext: function() { return this.AudioContext(); },
  screen: { orientation: { lock() { return Promise.resolve(); } } },
  localStorage: {
    getItem(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; },
    setItem(k, v) { storage[k] = String(v); },
    removeItem(k) { delete storage[k]; },
  },
  navigator: { userAgent: 'node' },
  window: null,
  document,
};
context.window = context;
context.window.innerWidth = 1280;
context.window.innerHeight = 720;
context.window.devicePixelRatio = 1;
context.window.addEventListener = () => {};
context.window.removeEventListener = () => {};
context.window.dispatchEvent = () => {};
context.globalThis = context;
context.self = context;
context.alert = () => {};
context.confirm = () => true;

vm.createContext(context);

for (const file of files) {
  const full = path.join(base, file);
  const code = fs.readFileSync(full, 'utf8');
  try {
    vm.runInContext(code, context, { filename: full });
    console.log('[boot-check] OK', file);
  } catch (err) {
    console.error('[boot-check] FAIL', file);
    console.error(err && err.stack || err);
    process.exit(1);
  }
}

console.log('[boot-check] BOOT CHECK COMPLETE');
