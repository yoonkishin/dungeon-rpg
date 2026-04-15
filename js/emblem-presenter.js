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

function queueFusionTransformation(masterLineId, promotedRank) {
  const recipe = getFusionRecipeForLine(masterLineId);
  if (!recipe) return;
  const overlay = ensureEmblemPresenterOverlay();
  overlay.className = 'emblem-presenter fusion line-' + masterLineId;
  setEmblemPresenterColors(overlay, recipe);

  const matsEl = overlay.querySelector('.ep-materials');
  matsEl.innerHTML = (recipe.materials || []).map(mid => {
    const m = getEmblemDef(mid);
    const label = m ? m.name.replace(' 문장', '') : mid;
    return '<div class="ep-mat"><div class="ep-mat-rune"></div><div class="ep-mat-label">' + label + '</div></div>';
  }).join('');

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
