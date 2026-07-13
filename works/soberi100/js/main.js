/* ==========================================================================
   Собери100 — общий JS для всех страниц
   ========================================================================== */

/* ---------- Тема (тёмная по умолчанию) ---------- */
(function initTheme(){
  const saved = localStorage.getItem('soberi100-theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme','light');
})();

function toggleTheme(){
  const root = document.documentElement;
  const isLight = root.getAttribute('data-theme') === 'light';
  if (isLight){
    root.removeAttribute('data-theme');
    localStorage.setItem('soberi100-theme','dark');
  } else {
    root.setAttribute('data-theme','light');
    localStorage.setItem('soberi100-theme','light');
  }
  updateThemeIcon();
}

function updateThemeIcon(){
  document.querySelectorAll('.theme-toggle').forEach(btn=>{
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    btn.innerHTML = isLight ? iconMoon() : iconSun();
    btn.setAttribute('aria-label', isLight ? 'Включить тёмную тему' : 'Включить светлую тему');
  });
}
function iconSun(){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>';}
function iconMoon(){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.4A9 9 0 1 1 11.6 3a7 7 0 0 0 9.4 9.4Z"/></svg>';}

/* ---------- Появление элементов при скролле ---------- */
function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || items.length === 0){
    items.forEach(i=>i.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  },{threshold:.14, rootMargin:'0px 0px -40px 0px'});
  items.forEach(i=>io.observe(i));
}

/* ---------- Мобильное меню ---------- */
function initMobileNav(){
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');
  if (!burger || !links) return;
  burger.addEventListener('click', ()=>{
    const open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* ---------- Активная ссылка в навигации ---------- */
function markActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

/* ---------- Подсчёт числа в кольце прогресса ---------- */
function animateRingValue(el, target, duration=1400){
  const start = performance.now();
  function tick(now){
    const p = Math.min(1, (now-start)/duration);
    const eased = 1 - Math.pow(1-p, 3);
    el.textContent = Math.round(eased * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function initScoreRings(){
  document.querySelectorAll('.ring-num[data-target]').forEach(el=>{
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    animateRingValue(el, target);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateThemeIcon();
  initReveal();
  initMobileNav();
  markActiveNav();
  initScoreRings();
  document.querySelectorAll('.theme-toggle').forEach(b=>b.addEventListener('click', toggleTheme));
});
