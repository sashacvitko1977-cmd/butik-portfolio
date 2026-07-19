/**
 * Dotted Surface — animated 3D dotted wave (Three.js)
 * Inspired by 21st.dev/@sshahaider/components/dotted-surface
 * Scoped to #hero only, theme-aware, lightweight.
 */
import * as THREE from 'three';

(function initDottedSurface() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.getElementById('dottedSurface');
  const hero = document.getElementById('hero');
  if (!host || !hero || reduced) return;

  const isMobile = () =>
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  let renderer;
  let scene;
  let camera;
  let points;
  let positions;
  let count = 0;
  let raf = 0;
  let sep = 28;
  let amountX = 50;
  let amountY = 36;
  let running = false;

  function themeColor() {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    // mono site: soft gray dots
    return dark ? 0xb0b0b0 : 0x555555;
  }

  function buildGrid() {
    if (points) {
      scene.remove(points);
      points.geometry.dispose();
      points.material.dispose();
    }

    const mobile = isMobile();
    sep = mobile ? 36 : 28;
    amountX = mobile ? 36 : 52;
    amountY = mobile ? 26 : 38;

    const geo = new THREE.BufferGeometry();
    const num = amountX * amountY;
    positions = new Float32Array(num * 3);
    let i = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        positions[i] = ix * sep - (amountX * sep) / 2;
        positions[i + 1] = 0;
        positions[i + 2] = iy * sep - (amountY * sep) / 2;
        i += 3;
      }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: themeColor(),
      size: mobile ? 1.6 : 2.0,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    points = new THREE.Points(geo, mat);
    points.rotation.x = -0.45;
    scene.add(points);
  }

  function resize() {
    const w = hero.clientWidth || window.innerWidth;
    const h = hero.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2));
  }

  function animate() {
    if (!running) return;
    raf = requestAnimationFrame(animate);
    count += 0.045;

    const pos = points.geometry.attributes.position.array;
    let i = 0;
    for (let ix = 0; ix < amountX; ix++) {
      for (let iy = 0; iy < amountY; iy++) {
        pos[i + 1] =
          Math.sin((ix + count) * 0.28) * 18 +
          Math.sin((iy + count) * 0.45) * 16 +
          Math.sin((ix + iy + count) * 0.12) * 8;
        i += 3;
      }
    }
    points.geometry.attributes.position.needsUpdate = true;
    points.rotation.z = Math.sin(count * 0.08) * 0.04;
    renderer.render(scene, camera);
  }

  function start() {
    if (running) return;
    running = true;
    animate();
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onTheme() {
    if (points?.material) {
      points.material.color.setHex(themeColor());
    }
  }

  // Setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1, 1, 4000);
  camera.position.set(0, 220, 420);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  renderer.domElement.className = 'dotted-surface__canvas';

  buildGrid();
  resize();

  window.addEventListener('resize', () => {
    resize();
    buildGrid();
  }, { passive: true });

  // Theme toggle
  const mo = new MutationObserver(onTheme);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Pause when hero off-screen
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
