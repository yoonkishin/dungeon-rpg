const CACHE_NAME = 'dungeon-rpg-pwa-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './character.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/modules/base.css',
  './css/modules/hud.css',
  './css/modules/panels-common.css',
  './css/modules/panels-skill.css',
  './css/modules/panels-menu.css',
  './css/modules/hud-widgets.css',
  './css/modules/controls.css',
  './css/modules/panels-equip.css',
  './css/modules/panels-shop.css',
  './css/modules/panels-misc.css',
  './css/modules/panels-profile.css',
  './css/modules/panels-companion.css',
  './css/modules/panels-temple.css',
  './js/error-overlay.js',
  './js/constants.js',
  './js/audio.js',
  './js/maps.js',
  './js/data.js',
  './js/data-companions.js',
  './js/data-growth.js',
  './js/growth-runtime.js',
  './js/data-town.js',
  './js/data-quests.js',
  './js/quest-runtime.js',
  './js/state.js',
  './js/helpers.js',
  './js/enemies.js',
  './js/combat.js',
  './js/transitions.js',
  './js/skills.js',
  './js/companions.js',
  './js/render-map.js',
  './js/render-entities.js',
  './js/render-effects.js',
  './js/render-minimap.js',
  './js/rendering.js',
  './js/game-controls.js',
  './js/ui-manager.js',
  './js/ui-panel-profile.js',
  './js/ui-panel-equip.js',
  './js/ui-panel-shop.js',
  './js/ui-panel-companion.js',
  './js/ui-panel-temple.js',
  './js/ui-panel-skill.js',
  './js/ui-panel-quest.js',
  './js/ui-panel-training.js',
  './js/ui-panel-emblem.js',
  './js/ui-panel-village.js',
  './js/save.js',
  './js/main.js',
  './js/pwa.js',
];

function toCacheKey(input) {
  const url = new URL(input, self.location.origin);
  url.hash = '';
  url.search = '';
  return url.href;
}

function isSameOriginGet(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin;
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
}

async function putInCache(cache, request, response) {
  if (!response || !response.ok) return response;
  await cache.put(toCacheKey(request.url), response.clone());
  return response;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (!isSameOriginGet(request)) return;

  const url = new URL(request.url);
  const cacheKey = toCacheKey(request.url);

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-store' });
        await putInCache(cache, './index.html', response);
        return response;
      } catch (error) {
        return (await caches.match(cacheKey)) || (await caches.match(toCacheKey('./index.html')));
      }
    })());
    return;
  }

  if (isImageRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await caches.match(cacheKey);
      if (cached) return cached;
      const response = await fetch(request);
      await putInCache(cache, request, response);
      return response;
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request, { cache: 'no-store' });
      await putInCache(cache, request, response);
      return response;
    } catch (error) {
      const cached = await caches.match(cacheKey);
      if (cached) return cached;
      throw error;
    }
  })());
});
