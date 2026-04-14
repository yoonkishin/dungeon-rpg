'use strict';

(function registerPwaServiceWorker() {
  const isSupported = ('serviceWorker' in navigator) &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (!isSupported) {
    window.triggerPwaSync = async () => false;
    return;
  }

  let refreshing = false;

  function notify(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else console.log('[PWA]', msg);
  }

  async function getActiveRegistration() {
    return await navigator.serviceWorker.getRegistration('./') || await navigator.serviceWorker.getRegistration();
  }

  window.triggerPwaSync = async function triggerPwaSync() {
    try {
      const registration = await getActiveRegistration();
      if (!registration) {
        notify('서비스워커 등록을 다시 확인합니다');
        window.location.reload();
        return true;
      }

      notify('업데이트 확인 중...');
      await registration.update().catch(() => {});

      if (registration.waiting) {
        notify('새 버전 적용 중...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }

      if (registration.installing) {
        notify('업데이트 다운로드 중...');
        await new Promise(resolve => {
          const worker = registration.installing;
          const finish = () => resolve();
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' || worker.state === 'activated' || worker.state === 'redundant') {
              finish();
            }
          });
          setTimeout(finish, 3000);
        });
        if (registration.waiting) {
          notify('새 버전 적용 중...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          return true;
        }
      }

      notify('최신 버전으로 새로고침합니다');
      window.location.reload();
      return true;
    } catch (err) {
      console.warn('[PWA] sync failed:', err);
      notify('업데이트 동기화 실패');
      return false;
    }
  };

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
