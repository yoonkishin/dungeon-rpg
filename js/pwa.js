'use strict';

(function registerPwaServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => {
        console.warn('[PWA] service worker registration failed:', err);
      });
  });
})();
