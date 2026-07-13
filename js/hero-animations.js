/**
 * ============================================================
 * Hero Animations — главная страница
 * Падение сверху · печать кода · parallax · частицы
 * ============================================================
 */

'use strict';

(function initHeroAnimations() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let typingTimer = null;
  let cardFloating = false;
  let parallaxAbort = null;

  const CODE_PLAIN = `const developer = {
  nick: "Butik",
  role: "Frontend",
  tg: "@butik_43",
  available: true,
};`;

  const CODE_HTML = `<span class="tok-kw">const</span> <span class="tok-fn">developer</span> = {
  nick: <span class="tok-str">"Butik"</span>,
  role: <span class="tok-str">"Frontend"</span>,
  tg: <span class="tok-str">"@butik_43"</span>,
  available: <span class="tok-bool">true</span>,
};`;

  /** Задержка до приземления карточки (для печати кода) */
  function getCardLandDelay() {
    const card = document.getElementById('heroCard');
    if (!card) return 1600;
    const dropI = parseInt(card.style.getPropertyValue('--drop-i') || '11', 10);
    const delay = 100 + dropI * 70;
    const duration = 1400;
    return Math.round(delay + duration);
  }

  /* ---------- Печать кода после приземления карточки ---------- */
  function initCodeTyping() {
    const el = document.getElementById('heroCode');
    if (!el) return;

    if (reduced) {
      el.innerHTML = CODE_HTML;
      return;
    }

    clearTimeout(typingTimer);
    const startDelay = getCardLandDelay();
    let i = 0;
    const charDelay = 28;

    function type() {
      if (i <= CODE_PLAIN.length) {
        el.textContent = CODE_PLAIN.slice(0, i);
        i += 1;
        typingTimer = setTimeout(type, charDelay);
      } else {
        el.innerHTML = CODE_HTML;
        el.closest('.hero-card__code')?.classList.add('is-typed');
      }
    }

    typingTimer = setTimeout(type, startDelay);
  }

  /* ---------- После приземления — парящая карточка + parallax ---------- */
  function initCardParallax() {
    const visual = document.getElementById('heroVisual');
    const card = document.getElementById('heroCard');
    if (!card) return;

    const startFloating = () => {
      if (reduced || cardFloating) return;
      cardFloating = true;
      card.classList.add('is-floating');

      if (!visual) return;

      if (parallaxAbort) parallaxAbort.abort();
      parallaxAbort = new AbortController();
      const { signal } = parallaxAbort;

      let targetX = -4;
      let targetY = 2;
      let currentX = -4;
      let currentY = 2;

      visual.addEventListener('mousemove', (e) => {
        const rect = visual.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = nx * 14 - 4;
        targetY = ny * -10 + 2;
      }, { signal });

      visual.addEventListener('mouseleave', () => {
        targetX = -4;
        targetY = 2;
      }, { signal });

      function tick() {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        card.style.setProperty('--tilt-x', `${currentY}deg`);
        card.style.setProperty('--tilt-y', `${currentX}deg`);
        requestAnimationFrame(tick);
      }

      tick();
    };

    if (reduced) return;

    card.addEventListener('animationend', (e) => {
      if (e.animationName !== 'heroCardDrop') return;
      card.classList.add('is-landed');
      startFloating();
    }, { once: true });

    // На случай если анимация не сработала
    setTimeout(() => {
      if (!card.classList.contains('is-floating')) {
        card.classList.add('is-landed');
        startFloating();
      }
    }, getCardLandDelay() + 200);
  }

  /* ---------- Помечаем элементы после приземления ---------- */
  function initDropLandmarks() {
    if (reduced) return;

    document.querySelectorAll('.hero-drop:not(.hero-drop--card)').forEach((el) => {
      el.addEventListener('animationend', (e) => {
        if (e.animationName === 'heroDropLand') {
          el.classList.add('is-landed');
        }
      });
    });
  }

  /* ---------- Частицы на фоне ---------- */
  function initParticles() {
    const canvas = document.getElementById('heroParticles');
    if (!canvas || reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = [];
    let w = 0;
    let h = 0;
    let animId = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function create() {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.05),
        alpha: Math.random() * 0.35 + 0.08,
      };
    }

    function init() {
      const count = Math.min(60, Math.floor((w * h) / 18000));
      particles = Array.from({ length: count }, create);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
        if (p.x < 0 || p.x > w) p.vx *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 220, 220, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    function start() {
      resize();
      init();
      if (animId) cancelAnimationFrame(animId);
      draw();
    }

    window.addEventListener('resize', start, { passive: true });
    start();
  }

  /* ---------- Магнитный эффект на кнопках (после приземления) ---------- */
  function initMagneticButtons() {
    if (reduced) return;

    const cta = document.querySelector('.hero__cta');
    if (!cta) return;

    const enable = () => {
      cta.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = '';
        });
      });
    };

    cta.addEventListener('animationend', (e) => {
      if (e.animationName === 'heroDropLand') enable();
    }, { once: true });

    setTimeout(enable, 1800);
  }

  function resetHeroCard() {
    const card = document.getElementById('heroCard');
    if (!card) return;
    if (parallaxAbort) parallaxAbort.abort();
    cardFloating = false;
    card.classList.remove('is-floating', 'is-landed');
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    const code = document.getElementById('heroCode');
    if (code) code.textContent = '';
    code?.closest('.hero-card__code')?.classList.remove('is-typed');
  }

  function boot() {
    initDropLandmarks();
    initCodeTyping();
    initCardParallax();
    initParticles();
    initMagneticButtons();
  }

  /* Повтор при возврате на главную */
  document.addEventListener('home-drop-replay', () => {
    resetHeroCard();
    setTimeout(() => {
      initCodeTyping();
      initCardParallax();
    }, 100);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();