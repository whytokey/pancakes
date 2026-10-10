/* КиноКадр: только локальный HTML5 video, без сторонних iframe/API. */
(() => {
  'use strict';
  const noop = () => {};
  function create(host, source, opts = {}) {
    const o = { start: 0, muted: false, volume: 1, timeout: 15000, onTime: noop, ...opts };
    if (!source || source.p !== 'file') {
      return { ready: Promise.resolve(false), el: null, play: noop, pause: noop,
        seek: noop, setMuted: noop, setVolume: noop, destroy: noop };
    }
    const v = document.createElement('video');
    v.className = 'clip-frame clip-file';
    v.playsInline = true;
    v.preload = 'auto';
    v.muted = !!o.muted;
    v.volume = Math.min(1, Math.max(0, o.volume));
    v.loop = o.start === 0;
    v.disablePictureInPicture = true;
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('aria-hidden', 'true');
    let destroyed = false, settled = false, successful = false, wantPlaying = true;
    let resolveReady;
    const ready = new Promise((resolve) => { resolveReady = resolve; });
    const settle = (ok) => {
      if (settled) return;
      settled = true; successful = ok;
      clearTimeout(timer);
      resolveReady(ok);
    };
    const timer = setTimeout(() => {
      console.warn('[KinoPlayer] Local video timeout', source.src);
      settle(false);
    }, o.timeout);
    const check = () => {
      if (!destroyed && !v.paused && !v.seeking && v.readyState >= 2 &&
          v.currentTime >= Math.max(0, o.start - 0.2)) settle(true);
    };
    const play = () => {
      wantPlaying = true;
      if (destroyed) return;
      v.play().catch((error) => {
        if (destroyed || !wantPlaying || error.name === 'AbortError') return;
        // Автозапуск со звуком может быть запрещён браузером.
        v.muted = true;
        v.play().catch((e) => {
          if (destroyed || !wantPlaying || e.name === 'AbortError') return;
          console.warn('[KinoPlayer] Local play failed', source.src, e.message);
          settle(false);
        });
      });
    };
    v.addEventListener('loadeddata', () => {
      if (destroyed) return;
      if (o.start > 0) {
        try { v.currentTime = o.start; } catch (e) { settle(false); return; }
      }
      if (wantPlaying) play();
    }, { once: true });
    v.addEventListener('playing', check);
    v.addEventListener('seeked', check);
    v.addEventListener('timeupdate', () => {
      check();
      if (!destroyed && successful) o.onTime(v.currentTime);
    });
    v.addEventListener('ended', () => {
      if (!destroyed && !v.loop && wantPlaying) { v.currentTime = o.start; play(); }
    });
    v.addEventListener('error', () => {
      if (destroyed) return;
      console.warn('[KinoPlayer] Local video error', source.src, v.error?.code);
      settle(false);
    }, { once: true });
    host.appendChild(v);
    v.src = source.src;
    v.load();
    return {
      ready, el: v,
      play,
      pause() { wantPlaying = false; v.pause(); },
      seek(sec) { if (!destroyed) { try { v.currentTime = sec; } catch (e) {} } },
      setMuted(m) { v.muted = !!m; },
      setVolume(x) { v.volume = Math.min(1, Math.max(0, x)); },
      destroy() {
        if (destroyed) return;
        destroyed = true; wantPlaying = false;
        clearTimeout(timer); settle(false);
        v.pause(); v.removeAttribute('src'); v.load(); v.remove();
      },
    };
  }
  window.KinoPlayer = { create, getDiagnostics: () => ({ mode: 'local-mp4' }) };
})();
