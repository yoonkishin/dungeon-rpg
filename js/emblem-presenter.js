'use strict';

// lightsaber_test emblem-transformation-presentation-spec.md §3~§5 기반 프리젠터.
//   7→8 합체 변신 (fusion):  총 4.8s, 스킵 1.2s 이후
//   8→9 단독 승급 변신 (ascension rank9): 총 4.1s, 스킵 0.9s 이후
//   9→10 최종 승급 변신 (ascension rank10): 총 5.0s, 스킵 1.4s 이후
// 공통 원칙: 결과 직업명/단수/성공 문구/다음 조건을 반드시 표시하고,
// 재료 문장은 합체 연출에서만 보여주며 승급 연출에서는 숨긴다.

let emblemPresenterOverlay = null;
let emblemPresenterSkipTimer = null;
let emblemPresenterCompleteTimer = null;
let emblemPresenterSkipHandler = null;

function ensureEmblemPresenterOverlay() {
  if (emblemPresenterOverlay) return emblemPresenterOverlay;
  const root = document.createElement('div');
  root.id = 'emblem-presenter';
  root.className = 'emblem-presenter hidden';
  root.innerHTML =
    '<div class="ep-backdrop"></div>' +
    '<div class="ep-flash"></div>' +
    '<div class="ep-rays"></div>' +
    '<div class="ep-particle-burst"></div>' +
    '<div class="ep-stage">' +
      '<div class="ep-materials"></div>' +
      '<div class="ep-result">' +
        '<div class="ep-result-silhouette"></div>' +
        '<div class="ep-result-label"></div>' +
        '<div class="ep-result-sub"></div>' +
        '<div class="ep-result-next"></div>' +
      '</div>' +
    '</div>' +
    '<button class="ep-skip" type="button">스킵</button>';
  document.body.appendChild(root);
  emblemPresenterOverlay = root;
  return root;
}

function closeEmblemPresenter() {
  if (!emblemPresenterOverlay) return;
  emblemPresenterOverlay.className = 'emblem-presenter hidden';
  if (emblemPresenterSkipTimer) { clearTimeout(emblemPresenterSkipTimer); emblemPresenterSkipTimer = null; }
  if (emblemPresenterCompleteTimer) { clearTimeout(emblemPresenterCompleteTimer); emblemPresenterCompleteTimer = null; }
  const skipBtn = emblemPresenterOverlay.querySelector('.ep-skip');
  if (skipBtn && emblemPresenterSkipHandler) {
    skipBtn.removeEventListener('click', emblemPresenterSkipHandler);
    skipBtn.removeEventListener('touchstart', emblemPresenterSkipHandler);
    emblemPresenterSkipHandler = null;
  }
}

function setEmblemPresenterColors(overlay, recipe) {
  overlay.style.setProperty('--ep-color-primary', recipe.colors.primary);
  overlay.style.setProperty('--ep-color-accent', recipe.colors.accent);
  overlay.style.setProperty('--ep-color-glow', recipe.colors.glow);
}

function scheduleEmblemPresenterSkip(skipAfterMs) {
  const overlay = emblemPresenterOverlay;
  const skipBtn = overlay.querySelector('.ep-skip');
  skipBtn.style.display = 'none';
  emblemPresenterSkipTimer = setTimeout(() => {
    skipBtn.style.display = 'block';
    emblemPresenterSkipHandler = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      closeEmblemPresenter();
    };
    skipBtn.addEventListener('click', emblemPresenterSkipHandler);
    skipBtn.addEventListener('touchstart', emblemPresenterSkipHandler, { passive: false });
  }, skipAfterMs);
}

function playEmblemPresenterSound(stage) {
  if (typeof AudioSystem === 'undefined' || !AudioSystem.sfx) return;
  if (stage === 'start' && typeof AudioSystem.sfx.levelup === 'function') AudioSystem.sfx.levelup();
  if (stage === 'peak' && typeof AudioSystem.sfx.tierUp === 'function') AudioSystem.sfx.tierUp();
}

function getFusionMaterialOffset(index, total) {
  const spacing = total >= 4 ? 132 : 156;
  const dx = Math.round((index - (total - 1) / 2) * spacing);
  let dy = 0;
  if (total === 3) dy = index === 1 ? 22 : -12;
  if (total === 4) dy = index === 0 || index === total - 1 ? -18 : 18;
  return { dx, dy };
}

function getFusionMaterialMarkup(materialId, index, total) {
  const emblem = getEmblemDef(materialId);
  const lineId = emblem ? emblem.targetLine : '';
  const label = emblem ? emblem.name.replace(' 문장', '') : materialId;
  const styleDef = getFusionMaterialStyle(lineId) || {
    glyph: label.slice(0, 1),
    primary: '#f1c40f',
    accent: '#e67e22',
    glow: '#fff3b0',
  };
  const offset = getFusionMaterialOffset(index, total);
  return '<div class="ep-mat" data-line="' + lineId + '"' +
    ' style="--ep-mat-dx:' + offset.dx + 'px;--ep-mat-dy:' + offset.dy + 'px;' +
    '--ep-mat-primary:' + styleDef.primary + ';--ep-mat-accent:' + styleDef.accent + ';--ep-mat-glow:' + styleDef.glow + ';">' +
    '<div class="ep-mat-rune"><span class="ep-mat-glyph">' + styleDef.glyph + '</span></div>' +
    '<div class="ep-mat-label">' + label + '</div></div>';
}

function buildFusionSilhouetteSvg(masterLineId) {
  if (masterLineId === 'battleMaster') {
    return '' +
      '<svg viewBox="0 0 240 240" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="ep-silhouette-gradient" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="var(--ep-color-glow)"></stop>' +
            '<stop offset="55%" stop-color="var(--ep-color-primary)"></stop>' +
            '<stop offset="100%" stop-color="var(--ep-color-accent)"></stop>' +
          '</linearGradient>' +
        '</defs>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M113 22h14v38l27 27-11 11-16-16v78h-14V82L97 98 86 87l27-27z"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M172 48l9 10-27 27 38 38-10 10-38-38-18 18-9-10 18-18-38-38 10-10 38 38z" opacity="0.95"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M120 92c31 0 56 25 56 56 0 35-28 61-56 70-28-9-56-35-56-70 0-31 25-56 56-56zm0 16c-22 0-40 18-40 40 0 24 19 43 40 52 21-9 40-28 40-52 0-22-18-40-40-40z" opacity="0.92"></path>' +
      '</svg>';
  }
  if (masterLineId === 'tacticsMaster') {
    return '' +
      '<svg viewBox="0 0 240 240" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="ep-silhouette-gradient" x1="0%" y1="10%" x2="100%" y2="90%">' +
            '<stop offset="0%" stop-color="var(--ep-color-glow)"></stop>' +
            '<stop offset="50%" stop-color="var(--ep-color-primary)"></stop>' +
            '<stop offset="100%" stop-color="var(--ep-color-accent)"></stop>' +
          '</linearGradient>' +
        '</defs>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M46 181c47-5 85-43 90-90h18c-5 57-51 103-108 108z"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M194 59c-47 5-85 43-90 90H86c5-57 51-103 108-108z"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M163 46l22 22-16 4-14-14z"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M101 176l-22 22 16 4 14-14z"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M73 176l95-127 12 9-95 127z" opacity="0.95"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M164 41l24 10-18 18-12-10z"></path>' +
        '<path fill="url(#ep-silhouette-gradient)" d="M64 175l18 12-18 18-10-24z"></path>' +
      '</svg>';
  }
  return '' +
    '<svg viewBox="0 0 240 240" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="ep-silhouette-gradient" x1="10%" y1="0%" x2="90%" y2="100%">' +
          '<stop offset="0%" stop-color="var(--ep-color-glow)"></stop>' +
          '<stop offset="52%" stop-color="var(--ep-color-primary)"></stop>' +
          '<stop offset="100%" stop-color="var(--ep-color-accent)"></stop>' +
        '</linearGradient>' +
      '</defs>' +
      '<polygon fill="url(#ep-silhouette-gradient)" points="120,28 137,72 184,72 146,102 160,148 120,120 80,148 94,102 56,72 103,72" opacity="0.96"></polygon>' +
      '<polygon fill="url(#ep-silhouette-gradient)" points="120,52 133,88 170,88 140,110 150,145 120,124 90,145 100,110 70,88 107,88" opacity="0.72"></polygon>' +
      '<circle cx="120" cy="120" r="24" fill="none" stroke="url(#ep-silhouette-gradient)" stroke-width="10"></circle>' +
      '<path fill="url(#ep-silhouette-gradient)" d="M118 95h4v50h-4zM95 118h50v4H95z"></path>' +
      '<path fill="url(#ep-silhouette-gradient)" d="M103 103l7-7 27 27-7 7zM130 96l7 7-27 27-7-7z" opacity="0.88"></path>' +
    '</svg>';
}

function buildFusionParticlesMarkup(count) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.round((360 / count) * i + (i % 2 === 0 ? -4 : 5));
    const distance = 116 + (i % 6) * 14;
    const size = 5 + (i % 4) * 2;
    const duration = 0.88 + (i % 5) * 0.06;
    parts.push('<span class="ep-particle" style="--ep-angle:' + angle + 'deg;--ep-distance:' + distance + 'px;--ep-size:' + size + 'px;--ep-particle-duration:' + duration + 's;"></span>');
  }
  return parts.join('');
}

function applyFusionVisuals(overlay, masterLineId) {
  overlay.querySelector('.ep-result-silhouette').innerHTML = buildFusionSilhouetteSvg(masterLineId);
  overlay.querySelector('.ep-particle-burst').innerHTML = buildFusionParticlesMarkup(36);
}

function resetFusionVisuals(overlay) {
  overlay.querySelector('.ep-result-silhouette').innerHTML = '';
  overlay.querySelector('.ep-particle-burst').innerHTML = '';
}

function queueFusionTransformation(masterLineId, promotedRank) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return;
  const overlay = ensureEmblemPresenterOverlay();
  overlay.className = 'emblem-presenter fusion line-' + masterLineId;
  setEmblemPresenterColors(overlay, recipe);
  applyFusionVisuals(overlay, masterLineId);

  const matsEl = overlay.querySelector('.ep-materials');
  matsEl.innerHTML = (recipe.materials || []).map((mid, index, list) => getFusionMaterialMarkup(mid, index, list.length)).join('');

  const className = promotedRank && promotedRank.className
    ? promotedRank.className
    : recipe.lineName + '마스터';
  overlay.querySelector('.ep-result-label').textContent = className;
  overlay.querySelector('.ep-result-sub').textContent = '합체! 8단 진입';
  const tier8Name = (getEmblemDef(recipe.tier8EmblemId) || {}).name || '8단 문장';
  overlay.querySelector('.ep-result-next').textContent = '다음: Lv100에서 ' + tier8Name + ' 획득';

  overlay.classList.remove('hidden');
  playEmblemPresenterSound('start');
  setTimeout(() => playEmblemPresenterSound('peak'), 2100);  // Stage D flash peak
  requestAnimationFrame(() => overlay.classList.add('playing'));

  scheduleEmblemPresenterSkip(1200);
  emblemPresenterCompleteTimer = setTimeout(() => {
    if (promotedRank && typeof showTierBanner === 'function') showTierBanner(promotedRank);
    closeEmblemPresenter();
  }, 4800);
}

function queueAscensionTransformation(targetRank, masterLineId, targetRankObj) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return;
  const isFinal = targetRank === 10;
  const totalMs = isFinal ? 5000 : 4100;
  const skipMs = isFinal ? 1400 : 900;

  const overlay = ensureEmblemPresenterOverlay();
  overlay.className = 'emblem-presenter ascension ' + (isFinal ? 'rank10' : 'rank9') + ' line-' + masterLineId;
  setEmblemPresenterColors(overlay, recipe);
  resetFusionVisuals(overlay);

  // 9/10단 승급은 재료 표시 금지 (spec §4.7)
  overlay.querySelector('.ep-materials').innerHTML = '';

  const className = targetRankObj && (targetRankObj.className || targetRankObj.name)
    ? (targetRankObj.className || targetRankObj.name)
    : (isFinal ? '그랜드' + recipe.lineName : '그랑' + recipe.lineName);
  overlay.querySelector('.ep-result-label').textContent = className;
  overlay.querySelector('.ep-result-sub').textContent = isFinal
    ? className + '로 각성했다!'
    : className + '로 승급했다!';
  if (isFinal) {
    overlay.querySelector('.ep-result-next').textContent = '최종형 각성 완료';
  } else {
    const tier9Name = (getEmblemDef(recipe.tier9EmblemId) || {}).name || '9단 문장';
    overlay.querySelector('.ep-result-next').textContent = '다음: Lv200에서 ' + tier9Name + ' 획득';
  }

  overlay.classList.remove('hidden');
  playEmblemPresenterSound('start');
  setTimeout(() => playEmblemPresenterSound('peak'), isFinal ? 2200 : 1800);
  requestAnimationFrame(() => overlay.classList.add('playing'));

  scheduleEmblemPresenterSkip(skipMs);
  emblemPresenterCompleteTimer = setTimeout(() => {
    if (targetRankObj && typeof showTierBanner === 'function') showTierBanner(targetRankObj);
    closeEmblemPresenter();
  }, totalMs);
}
