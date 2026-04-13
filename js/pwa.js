'use strict';

(function registerPwaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

  let refreshing = false;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(registration => {
        registration.update().catch(() => {});
      })
      .catch(err => {
        console.warn('[PWA] service worker registration failed:', err);
      });
  });

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
})();
