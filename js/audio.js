'use strict';

// ─── Audio System (Web Audio API) ────────────────────────────────────────────
const AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let soundEnabled = true;
  let musicEnabled = true;
  let currentBgm = null;
  let bgmInterval = null;
  let bgmArea = '';

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.35;
      musicGain.connect(masterGain);
      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(masterGain);
    } catch(e) {}
  }

  function ensureCtx() {
    if (!ctx) init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return !!ctx;
  }

  // ── SFX helpers ──
  function playTone(freq, dur, type, vol, dest) {
    if (!ensureCtx() || !soundEnabled) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime((vol || 0.3), t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest || sfxGain);
    o.start(t);
    o.stop(t + dur);
  }

  function playNoise(dur, vol) {
    if (!ensureCtx() || !soundEnabled) return;
    const t = ctx.currentTime;
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(g);
    g.connect(sfxGain);
    src.start(t);
  }

  // ── Sound Effects ──
  const sfx = {
    attack() {
      playNoise(0.1, 0.2);
      playTone(200, 0.1, 'sawtooth', 0.2);
      playTone(150, 0.08, 'square', 0.15);
    },
    hit() {
      playTone(120, 0.15, 'square', 0.25);
      playNoise(0.08, 0.15);
    },
    enemyDeath() {
      playTone(400, 0.08, 'square', 0.2);
      playTone(300, 0.1, 'square', 0.15);
      playTone(200, 0.15, 'sawtooth', 0.1);
    },
    playerHit() {
      playTone(80, 0.2, 'sawtooth', 0.25);
      playTone(60, 0.15, 'square', 0.2);
    },
    levelUp() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.25, 'square', 0.2), i * 100);
      });
    },
    heal() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [440, 554, 659];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.2, 'sine', 0.2), i * 80);
      });
    },
    buy() {
      playTone(880, 0.08, 'square', 0.15);
      setTimeout(() => playTone(1100, 0.12, 'square', 0.15), 60);
    },
    sell() {
      playTone(660, 0.08, 'square', 0.15);
      setTimeout(() => playTone(880, 0.1, 'square', 0.12), 50);
    },
    pickup() {
      playTone(700, 0.06, 'sine', 0.2);
      setTimeout(() => playTone(900, 0.1, 'sine', 0.2), 50);
    },
    portal() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [330, 440, 554, 659, 880];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sine', 0.15), i * 70);
      });
    },
    death() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [300, 250, 200, 150, 100];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sawtooth', 0.2), i * 120);
      });
    },
    menuOpen() {
      playTone(600, 0.06, 'sine', 0.12);
    },
    menuClose() {
      playTone(400, 0.06, 'sine', 0.1);
    },
    tierUp() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [523, 659, 784, 1047, 1319, 1568];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.35, 'square', 0.2), i * 120);
      });
    },
    dungeonClear() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sine', 0.2), i * 130);
      });
    },
    buttonClick() {
      playTone(500, 0.04, 'sine', 0.08);
    },
    skillUse() {
      playTone(440, 0.06, 'sawtooth', 0.15);
      playTone(660, 0.1, 'sine', 0.12);
    },
    respawn() {
      if (!ensureCtx() || !soundEnabled) return;
      const notes = [262, 330, 392, 523];
      notes.forEach((f, i) => {
        setTimeout(() => playTone(f, 0.3, 'sine', 0.18), i * 150);
      });
    }
  };

  // ── BGM System ──
  const BGM_PATTERNS = {
    town: {
      notes: [262, 294, 330, 349, 392, 349, 330, 294, 262, 330, 392, 523, 392, 330, 294, 262],
      tempo: 320,
      type: 'sine',
      vol: 0.12,
      bass: [131, 131, 165, 165, 196, 196, 165, 165, 131, 131, 165, 165, 196, 196, 131, 131],
      bassVol: 0.06
    },
    field: {
      notes: [392, 440, 494, 523, 587, 523, 494, 440, 392, 494, 587, 659, 587, 494, 440, 392],
      tempo: 260,
      type: 'triangle',
      vol: 0.1,
      bass: [196, 196, 220, 220, 262, 262, 220, 220, 196, 196, 247, 247, 262, 262, 196, 196],
      bassVol: 0.05
    },
    dungeon: {
      notes: [220, 233, 262, 220, 196, 233, 262, 294, 262, 233, 220, 196, 175, 196, 220, 175],
      tempo: 350,
      type: 'sawtooth',
      vol: 0.07,
      bass: [110, 110, 117, 117, 131, 131, 117, 117, 110, 110, 98, 98, 88, 88, 110, 110],
      bassVol: 0.04
    }
  };

  function startBgm(area) {
    if (!ensureCtx()) return;
    if (bgmArea === area && bgmInterval) return;
    stopBgm();
    bgmArea = area;
    if (!musicEnabled) return;
    const p = BGM_PATTERNS[area];
    if (!p) return;
    let i = 0;
    function playNote() {
      if (!musicEnabled || !ctx) { stopBgm(); return; }
      const freq = p.notes[i % p.notes.length];
      const bassFreq = p.bass[i % p.bass.length];
      const t = ctx.currentTime;
      // Melody
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = p.type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(p.vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + p.tempo / 1000 * 0.9);
      o.connect(g);
      g.connect(musicGain);
      o.start(t);
      o.stop(t + p.tempo / 1000);
      o.onended = () => { o.disconnect(); g.disconnect(); };
      // Bass
      const ob = ctx.createOscillator();
      const gb = ctx.createGain();
      ob.type = 'sine';
      ob.frequency.setValueAtTime(bassFreq, t);
      gb.gain.setValueAtTime(p.bassVol, t);
      gb.gain.exponentialRampToValueAtTime(0.001, t + p.tempo / 1000 * 0.9);
      ob.connect(gb);
      gb.connect(musicGain);
      ob.start(t);
      ob.stop(t + p.tempo / 1000);
      ob.onended = () => { ob.disconnect(); gb.disconnect(); };
      i++;
    }
    playNote();
    bgmInterval = setInterval(playNote, p.tempo);
  }

  function stopBgm() {
    if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; }
    bgmArea = '';
  }

  function setSound(on) {
    soundEnabled = on;
  }

  function setMusic(on) {
    musicEnabled = on;
    if (!on) stopBgm();
    else if (bgmArea) { const a = bgmArea; bgmArea = ''; startBgm(a); }
  }

  function isSoundOn() { return soundEnabled; }
  function isMusicOn() { return musicEnabled; }

  return { init, sfx, startBgm, stopBgm, setSound, setMusic, isSoundOn, isMusicOn, ensureCtx };
})();

function onTap(el, handler) {
  el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handler(e); }, { passive: false });
  el.addEventListener('click', (e) => { e.stopPropagation(); handler(e); });
}

// Initialize audio on first user interaction
['touchstart', 'click', 'keydown'].forEach(evt => {
  document.addEventListener(evt, function initAudio() {
    AudioSystem.init();
    AudioSystem.ensureCtx();
    document.removeEventListener(evt, initAudio);
  }, { once: true });
});

