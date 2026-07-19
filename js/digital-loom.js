/**
 * Digital Loom Background
 * Inspired by 21st.dev/@dhileepkumargm/components/digital-loom-background
 * Animated interwoven threads on canvas — hero only.
 */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.getElementById('digitalLoom');
  const hero = document.getElementById('hero');
  if (!host || !hero || reduced) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'digital-loom__canvas';
  host.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let t = 0;
  let threads = [];

  function isMobile() {
    return (
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(pointer: coarse)').matches
    );
  }

  function isLight() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function makeThreads() {
    const n = isMobile() ? 18 : 32;
    threads = [];
    for (let i = 0; i < n; i++) {
      const band = i / n;
      threads.push({
        // vertical position base (0–1)
        y: 0.05 + band * 0.9 + (Math.random() - 0.5) * 0.04,
        amp: 18 + Math.random() * 48,
        freq: 0.004 + Math.random() * 0.012,
        speed: 0.35 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        // second harmonic for interweave
        amp2: 8 + Math.random() * 22,
        freq2: 0.008 + Math.random() * 0.02,
        phase2: Math.random() * Math.PI * 2,
        width: 0.8 + Math.random() * 1.6,
        alpha: 0.25 + Math.random() * 0.55,
        // slight purple tint variation
        hue: 230 + Math.random() * 40,
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
    w = hero.clientWidth || window.innerWidth;
    h = hero.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function strokeThread(th, time) {
    const light = isLight();
    const baseY = th.y * h;
    const step = isMobile() ? 10 : 6;

    ctx.beginPath();
    for (let x = -40; x <= w + 40; x += step) {
      const y =
        baseY +
        Math.sin(x * th.freq + time * th.speed + th.phase) * th.amp +
        Math.sin(x * th.freq2 - time * th.speed * 0.7 + th.phase2) * th.amp2 +
        Math.sin(x * 0.002 + time * 0.4 + th.phase) * 6;

      if (x === -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // soft outer glow
    ctx.strokeStyle = light
      ? `hsla(${th.hue}, 40%, 35%, ${th.alpha * 0.25})`
      : `hsla(${th.hue}, 70%, 72%, ${th.alpha * 0.35})`;
    ctx.lineWidth = th.width + 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // bright core
    ctx.strokeStyle = light
      ? `hsla(${th.hue}, 30%, 25%, ${th.alpha * 0.7})`
      : `hsla(${th.hue}, 80%, 88%, ${th.alpha})`;
    ctx.lineWidth = th.width;
    ctx.stroke();
  }

  function draw() {
    if (!running) return;
    raf = requestAnimationFrame(draw);
    t += 0.016;

    ctx.clearRect(0, 0, w, h);

    // faint grid of background threads (warp)
    const light = isLight();
    const warpCount = isMobile() ? 10 : 16;
    ctx.save();
    ctx.globalAlpha = light ? 0.06 : 0.08;
    for (let i = 0; i < warpCount; i++) {
      const x = (i / (warpCount - 1)) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.sin(t * 0.5 + i) * 8, h);
      ctx.strokeStyle = light ? '#333' : '#888';
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
    ctx.restore();

    // weft — flowing horizontal threads
    for (let i = 0; i < threads.length; i++) {
      strokeThread(threads[i], t);
    }
  }

  function start() {
    if (running) return;
    running = true;
    draw();
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onResize() {
    resize();
    makeThreads();
  }

  resize();
  makeThreads();

  window.addEventListener('resize', onResize, { passive: true });
  new MutationObserver(() => {}).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) start();
      else stop();
    },
    { threshold: 0.05 }
  );
  io.observe(hero);
  start();
})();
