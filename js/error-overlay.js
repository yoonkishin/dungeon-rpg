'use strict';

(function initRuntimeErrorOverlay() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__runtimeErrorOverlayInstalled) return;
  window.__runtimeErrorOverlayInstalled = true;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureOverlay() {
    let overlay = document.getElementById('runtime-error-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'runtime-error-overlay';
    overlay.style.cssText = [
      'display:none',
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'background:rgba(7,10,18,0.96)',
      'color:#f8fafc',
      'padding:14px',
      'font-family:system-ui,-apple-system,Segoe UI,sans-serif',
      'pointer-events:all',
      'overflow:auto',
      'touch-action:pan-y'
    ].join(';');

    overlay.innerHTML =
      '<div style="max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:10px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
          '<div>' +
            '<div style="color:#ff7675;font-size:18px;font-weight:800;">⚠️ Runtime Error</div>' +
            '<div style="color:#cbd5e1;font-size:12px;line-height:1.45;">게임이 중단되었습니다. 아래 오류를 확인한 뒤 새로고침하거나 수정이 필요합니다.</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0;">' +
            '<button id="runtime-error-reload" style="border:none;border-radius:8px;padding:8px 12px;background:#2980b9;color:#fff;font-size:12px;font-weight:700;">새로고침</button>' +
            '<button id="runtime-error-close" style="border:none;border-radius:8px;padding:8px 12px;background:#3b4252;color:#fff;font-size:12px;font-weight:700;">닫기</button>' +
          '</div>' +
        '</div>' +
        '<div id="runtime-error-body" style="display:flex;flex-direction:column;gap:8px;"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    const reloadBtn = document.getElementById('runtime-error-reload');
    const closeBtn = document.getElementById('runtime-error-close');
    if (reloadBtn) reloadBtn.addEventListener('click', () => window.location.reload());
    if (closeBtn) closeBtn.addEventListener('click', () => { overlay.style.display = 'none'; });

    return overlay;
  }

  function showRuntimeErrorOverlay(payload) {
    const overlay = ensureOverlay();
    const body = document.getElementById('runtime-error-body');
    if (!body) return;

    const message = payload && payload.message ? payload.message : '알 수 없는 오류';
    const source = payload && payload.source ? payload.source : '';
    const stack = payload && payload.stack ? payload.stack : '';
    const detailRows = [];

    if (source) detailRows.push('<div style="color:#93c5fd;font-size:12px;">위치: ' + escapeHtml(source) + '</div>');
    detailRows.push('<div style="color:#f8fafc;font-size:13px;font-weight:700;line-height:1.5;">' + escapeHtml(message) + '</div>');
    if (stack) {
      detailRows.push(
        '<pre style="white-space:pre-wrap;word-break:break-word;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;color:#cbd5e1;font-size:11px;line-height:1.5;overflow:auto;">' +
        escapeHtml(stack) +
        '</pre>'
      );
    }

    body.innerHTML =
      '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;">' +
      detailRows.join('') +
      '</div>';

    overlay.style.display = 'block';
  }

  window.__showRuntimeErrorOverlay = showRuntimeErrorOverlay;

  window.addEventListener('error', (event) => {
    const filename = event && event.filename ? event.filename.split('/').slice(-1)[0] : '';
    const line = event && event.lineno ? ':' + event.lineno : '';
    const col = event && event.colno ? ':' + event.colno : '';
    const source = filename ? (filename + line + col) : '';
    const stack = event && event.error && event.error.stack ? event.error.stack : '';
    showRuntimeErrorOverlay({
      message: event && event.message ? event.message : '스크립트 오류가 발생했습니다.',
      source,
      stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event && event.reason;
    const message = reason && reason.message ? reason.message : String(reason || '처리되지 않은 Promise 오류');
    const stack = reason && reason.stack ? reason.stack : '';
    showRuntimeErrorOverlay({
      message,
      source: 'unhandledrejection',
      stack,
    });
  });
})();
