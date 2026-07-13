/**
 * ============================================================
 * Butik — Portfolio + Blog
 * Vanilla JS (ES6+) · SPA navigation · localStorage blog
 * ============================================================
 */

'use strict';

/* ---------- Storage keys ---------- */
const KEYS = {
  THEME: 'ap_theme',
  ARTICLES: 'ap_articles',
  SEEDED: 'ap_seeded',
  MESSAGES: 'ap_messages',
};

/* ---------- State ---------- */
const state = {
  page: 'home',
  articleId: null,
  blogCategory: 'all',
  blogQuery: '',
  portfolioFilter: 'all',
  countersAnimated: false,
};

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const load = (key, fb = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fb;
  } catch {
    return fb;
  }
};

const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const escapeHtml = (str) => {
  const d = document.createElement('div');
  d.textContent = str ?? '';
  return d.innerHTML;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

function toast(message, type = 'info') {
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  $('#toasts')?.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = '0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
window.toast = toast;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Скопировано в буфер обмена', 'success');
  } catch {
    toast('Не удалось скопировать', 'error');
  }
}

/* ============================================================
   DEMO BLOG ARTICLES (seeded into localStorage)
   ============================================================ */
function getDemoArticles() {
  return [
    {
      id: 'a1',
      title: 'Как я ускорил LCP с 4.2s до 1.1s',
      excerpt: 'Практический разбор Core Web Vitals: изображения, шрифты, critical CSS и lazy hydration.',
      category: 'Frontend',
      tags: ['Performance', 'CWV', 'Next.js'],
      date: '2026-06-12',
      readTime: 8,
      hue: 250,
      icon: 'gauge-high',
      content: `
        <p>В проекте e-commerce LCP висел на 4.2 секунды. Пользователи ждали — и уходили. Разберём, что сработало.</p>
        <h2>1. Найти виновника</h2>
        <p>Lighthouse и WebPageTest показали: LCP-элемент — hero-баннер 2.4 МБ в PNG, плюс блокирующие веб-��рифты.</p>
        <pre><code class="language-javascript">// Приоритет LCP-изображения
&lt;Image
  src="/hero.webp"
  priority
  sizes="(max-width: 768px) 100vw, 1200px"
  alt="Hero"
/&gt;</code></pre>
        <h2>2. Шрифты без FOIT</h2>
        <p>Подключили <code>font-display: swap</code> и preload для основного начертания. Subset кириллицы сократил файл на 40%.</p>
        <h2>3. Critical CSS</h2>
        <p>Above-the-fold стили инлайним, остальное — async. Для Next.js достаточно правильного порядка импортов и CSS Modules.</p>
        <h3>Результат</h3>
        <ul>
          <li>LCP: 4.2s → 1.1s</li>
          <li>CLS: 0.18 → 0.02</li>
          <li>Конверсия лендинга +12%</li>
        </ul>
        <p>Главный урок: измеряйте на реальных устройствах, не только на desktop-Lighthouse.</p>
      `,
    },
    {
      id: 'a2',
      title: 'TypeScript: 7 паттернов, которые экономят часы',
      excerpt: 'Discriminated unions, branded types, satisfies и другие приёмы для типобезопасного кода.',
      category: 'JavaScript',
      tags: ['TypeScript', 'Patterns'],
      date: '2026-05-28',
      readTime: 10,
      hue: 200,
      icon: 'code',
      content: `
        <p>TypeScript полезен не «галочкой в вакансии», а когда типы документируют домен. Вот паттерны, которые я использую постоянно.</p>
        <h2>Discriminated unions</h2>
        <pre><code class="language-typescript">type RequestState&lt;T&gt; =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function render&lt;T&gt;(state: RequestState&lt;T&gt;) {
  switch (state.status) {
    case 'success':
      return state.data; // T — сужен
    case 'error':
      return state.error;
    default:
      return null;
  }
}</code></pre>
        <h2>satisfies вместо as</h2>
        <p>Оператор <code>satisfies</code> проверяет соответствие типу, не расширяя вывод. Меньше <code>as any</code> — меньше багов в проде.</p>
        <h2>Branded types для ID</h2>
        <p>Не путайте <code>UserId</code> и <code>OrderId</code>, даже если оба — string. Один generic-хелпер — и API становится безопаснее.</p>
        <p>Типы — это документация, которая не устаревает. Инвестируйте в них на старте домена.</p>
      `,
    },
    {
      id: 'a3',
      title: 'Дизайн-система с нуля за 2 спринта',
      excerpt: 'Токены, примитивы, композиция компонентов и Storybook — рабочий процесс для команды 5+ человек.',
      category: 'Дизайн',
      tags: ['Design System', 'Figma', 'Storybook'],
      date: '2026-05-10',
      readTime: 12,
      hue: 280,
      icon: 'palette',
      content: `
        <p>Без системы UI превращается в зоопарк. Расскажу, как мы собрали основу за две недели.</p>
        <h2>Неделя 1: токены</h2>
        <ul>
          <li>Цвет, типографика, spacing, radius, elevation</li>
          <li>Синхронизация Figma ↔ CSS variables</li>
          <li>Темы light / dark из коробки</li>
        </ul>
        <h2>Неделя 2: компоненты</h2>
        <p>Button, Input, Select, Modal, Toast — только то, что реально нужно. Остальное — композиция.</p>
        <pre><code class="language-css">:root {
  --color-accent: #8b5cf6;
  --space-4: 1rem;
  --radius-md: 10px;
}</code></pre>
        <p>Storybook стал единой точкой правды. Дизайнеры смотрят live-превью, разработчики — docs и controls.</p>
      `,
    },
    {
      id: 'a4',
      title: 'Как перейти из Middle в Senior',
      excerpt: 'Не про синтаксис, а про ownership, коммуникацию и влияние на продукт. Чеклист из моего опыта.',
      category: 'Карьера',
      tags: ['Career', 'Soft Skills'],
      date: '2026-04-22',
      readTime: 7,
      hue: 160,
      icon: 'rocket',
      content: `
        <p>Senior — это не «знаю все API React». Это ответственность за результат шире своей задачи.</p>
        <h2>Что отличает Senior</h2>
        <ol>
          <li>Берёт ownership end-to-end</li>
          <li>Упрощает, а не усложняет</li>
          <li>Поднимает команду через review и менторство</li>
          <li>Говорит на языке продукта и метрик</li>
        </ol>
        <h2>Практический чеклист</h2>
        <ul>
          <li>Один раз за квартал улучшите DX команды</li>
          <li>Ведите 1–2 junior/middle</li>
          <li>Пишите ADR по ключевым решениям</li>
          <li>Считайте влияние: latency, conversion, time-to-ship</li>
        </ul>
        <p>Грейд приходит как следствие поведения, а не как награда за стаж.</p>
      `,
    },
    {
      id: 'a5',
      title: 'React Server Components без магии',
      excerpt: 'Что реально меняется в архитектуре, где граница client/server и когда RSC не нужны.',
      category: 'Frontend',
      tags: ['React', 'RSC', 'Next.js'],
      date: '2026-04-05',
      readTime: 9,
      hue: 220,
      icon: 'react',
      content: `
        <p>RSC — не серебряная пуля, а другой способ думать о data-fetching и бандле.</p>
        <h2>Простая модель</h2>
        <p>Серверные компоненты рендерятся на сервере и не попадают в клиентский JS. Клиентские — интерактивны и помечены <code>'use client'</code>.</p>
        <pre><code class="language-javascript">// Server Component — данные рядом с UI
async function ProductList() {
  const products = await db.products.findMany();
  return &lt;ul&gt;{products.map(p =&gt; &lt;li key={p.id}&gt;{p.name}&lt;/li&gt;)}&lt;/ul&gt;;
}</code></pre>
        <h2>Когда не стоит</h2>
        <p>Сильно интерактивные SPA с offline, сложным client state — классический CSR/SPA может быть проще.</p>
        <p>Выбирайте архитектуру под продукт, а не под хайп.</p>
      `,
    },
    {
      id: 'a6',
      title: 'CSS: современные layout-техники 2026',
      excerpt: 'Container queries, :has(), subgrid и fluid typography — что уже можно в продакшене.',
      category: 'Дизайн',
      tags: ['CSS', 'Layout'],
      date: '2026-03-18',
      readTime: 6,
      hue: 320,
      icon: 'paintbrush',
      content: `
        <p>CSS вырос. Многие «хаки на JS» больше не нужны.</p>
        <h2>Container queries</h2>
        <pre><code class="language-css">.card-wrap {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 120px 1fr; }
}</code></pre>
        <h2>:has() — parent selector</h2>
        <p>Стилизация родителя по состоянию потомка: формы с ошибкой, карточки с картинкой, навигация с активным пунктом.</p>
        <h2>Fluid type</h2>
        <p><code>clamp(1rem, 0.9rem + 0.5vw, 1.25rem)</code> — меньше брейкпоинтов, ровнее масштаб.</p>
      `,
    },
    {
      id: 'a7',
      title: 'Тесты, которые не бесят команду',
      excerpt: 'Пирамида тестирования, Testing Library и когда e2e достаточно трёх сценариев.',
      category: 'JavaScript',
      tags: ['Testing', 'Quality'],
      date: '2026-03-01',
      readTime: 8,
      hue: 40,
      icon: 'vial',
      content: `
        <p>Плохие тесты хуже их отсутствия: тормозят CI и дают ложное чувство безопасности.</p>
        <h2>Принципы</h2>
        <ul>
          <li>Тестируйте поведение пользователя, не имплементацию</li>
          <li>Unit — чистая логика; Integration — связки; E2E — критические пути</li>
          <li>Удаляйте flaky-тесты безжалостно</li>
        </ul>
        <pre><code class="language-javascript">import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits contact form', async () => {
  render(&lt;ContactForm /&gt;);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.c');
  await userEvent.click(screen.getByRole('button', { name: /отправить/i }));
  expect(await screen.findByText(/спасибо/i)).toBeInTheDocument();
});</code></pre>
        <p>Три e2e: логин, основной happy-path, оплата/отправка. Остальное — ниже по пирамиде.</p>
      `,
    },
    {
      id: 'a8',
      title: 'Фриланс frontend: как не выгореть',
      excerpt: 'Оценка сроков, границы, договор и асинхронная коммуникация — операционка, о которой молчат.',
      category: 'Карьера',
      tags: ['Freelance', 'Business'],
      date: '2026-02-14',
      readTime: 5,
      hue: 10,
      icon: 'briefcase',
      content: `
        <p>Код — только часть фриланса. Другая — процессы, которые сохраняют энергию и репутацию.</p>
        <h2>Оценка</h2>
        <p>Берите x1.5 от «идеального» срока. Буфер — не лень, а профессионализм.</p>
        <h2>Границы</h2>
        <ul>
          <li>Окно ответа (например, 10:00–19:00 МСК)</li>
          <li>Change request = новый estimate</li>
          <li>50% предоплата на старте этапа</li>
        </ul>
        <h2>Коммуникация</h2>
        <p>Еженедельный async-update: что сделано, блокеры, план. Клиент спокоен — вы меньше дёргаетесь.</p>
        <p>Выгорание чаще от хаоса, чем от кода. Стройте систему.</p>
      `,
    },
  ];
}

function seedArticles() {
  if (!load(KEYS.SEEDED)) {
    save(KEYS.ARTICLES, getDemoArticles());
    save(KEYS.SEEDED, true);
  }
}

function getArticles() {
  return load(KEYS.ARTICLES, getDemoArticles());
}

/* ============================================================
   PORTFOLIO DATA
   ============================================================ */
/**
 * Пути к демо — относительные от корня сайта (index.html, blog.html, file://).
 */
const PROJECTS = [
  {
    id: 'elegiya',
    title: 'Элегия Beauty Studio',
    category: 'web',
    tags: ['HTML', 'CSS', 'JavaScript', 'Telegram'],
    desc: 'Премиальный сайт салона красоты: онлайн-запись, календарь, личный кабинет, Telegram-бот.',
    full: 'One-page сайт премиум-салона «Элегия»: hero, услуги с ценами, мастера и портфолио, галерея, отзывы, акции. Главное — wizard онлайн-записи (услуга → мастер → календарь → слоты → форма) с localStorage, тёмной/светлой темой и адаптивом. Отдельно — Node.js Telegram-бот с записью кнопками, просмотром визитов и уведомлениями админу. Стек: HTML5, CSS3, vanilla JS, Tailwind CDN, Express + node-telegram-bot-api.',
    role: 'Frontend + Bot',
    year: '2026',
    icon: 'spa',
    url: 'works/elegiya/index.html',
    thumbClass: 'thumb--elegiya',
  },
  {
    id: 'soberi100',
    title: 'Собери100',
    category: 'web',
    tags: ['HTML', 'CSS', 'JavaScript', 'AI'],
    desc: 'AI-репетитор для подготовки к ЕГЭ, ОГЭ и школьным предметам: чат, план, решение задач, кабинет.',
    full: 'Многостраничный продукт: лендинг, чат с AI, планирование подготовки, страница решения задач и dashboard. Чистый HTML/CSS/JS, адаптивный UI и имитация AI-сценариев обучения.',
    role: 'Frontend',
    year: '2026',
    icon: 'graduation-cap',
    url: 'works/soberi100/index.html',
    thumbClass: 'thumb--soberi',
  },
  {
    id: 'stroy-master',
    title: 'СтройМастер',
    category: 'web',
    tags: ['HTML', 'CSS', 'JavaScript', 'CRM'],
    desc: 'Корпоративный сайт строительной компании + CRM-кабинет: проекты, клиенты, заявки, календарь.',
    full: 'SPA-имитация на vanilla JS: публичные страницы (услуги, портфолио, контакты) и личный кабинет с ролями клиент/менеджер, CRUD, localStorage и тёмной/светлой темой.',
    role: 'Frontend',
    year: '2026',
    icon: 'helmet-safety',
    url: 'works/stroy-master/index.html',
    thumbClass: 'thumb--stroy',
  },
  {
    id: 'kotodom',
    title: 'Котодом',
    category: 'web',
    tags: ['HTML', 'CSS', 'JavaScript', 'Tailwind'],
    desc: 'Доска объявлений о домашних животных в стиле Авито: каталог, фильтры, избранное, чат, личный кабинет.',
    full: 'SPA на vanilla JS и Tailwind CDN: поиск и фильтры по категориям, сортировка, галерея фото, форма размещения с загрузкой изображений, CRUD в личном кабинете, избранное, имитация чата с продавцом. Все данные в localStorage, адаптив с нижней навигацией, тёмная и светлая тема.',
    role: 'Frontend',
    year: '2026',
    icon: 'paw',
    url: 'works/kotodom/index.html',
    thumbClass: 'thumb--kotodom',
  },
];

/** Нормализация URL демо — работает с index.html, blog.html, localhost и file:// */
function demoHref(url) {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  return url.replace(/^\.\//, '').replace(/^\//, '');
}

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  // Always black-gray dark palette (toggle = two charcoal depths)
  const saved = localStorage.getItem(KEYS.THEME) || 'dark';
  applyTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
  $('#themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEYS.THEME, theme);
  const icon = $('#themeIcon');
  if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
function initNavigation() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    navigateTo(link.getAttribute('data-nav'));
    closeMobileMenu();
  });

  window.addEventListener('hashchange', () => {
    const { page, articleId } = parseHash();
    if (page !== state.page || articleId !== state.articleId) {
      navigateTo(page, articleId, false);
    }
  });

  // Header scroll style
  window.addEventListener('scroll', () => {
    $('#header')?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  const { page, articleId } = parseHash();
  navigateTo(page, articleId, false);
}

function isBlogEntry() {
  return document.body?.dataset?.entry === 'blog'
    || /blog\.html/i.test(location.pathname);
}

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const isBlogPage = isBlogEntry();

  // blog.html#a1 or index.html#blog/a1
  if (raw.startsWith('blog/')) {
    return { page: 'blog', articleId: raw.slice(5) || null };
  }
  if (raw.startsWith('article/')) {
    return { page: 'blog', articleId: raw.slice(8) || null };
  }

  // On dedicated blog.html: empty hash = list, any other id = article
  if (isBlogPage) {
    if (!raw || raw === 'blog') return { page: 'blog', articleId: null };
    return { page: 'blog', articleId: raw };
  }

  const valid = ['home', 'about', 'services', 'portfolio', 'reviews', 'blog', 'contact'];
  return { page: raw && valid.includes(raw) ? raw : 'home', articleId: null };
}

function navigateTo(page, articleId = null, updateHash = true) {
  const valid = ['home', 'about', 'services', 'portfolio', 'reviews', 'blog', 'contact'];

  // On blog.html stay within blog (external links go to index.html)
  if (isBlogEntry()) {
    page = 'blog';
  }

  if (!valid.includes(page)) page = 'home';

  state.page = page;
  state.articleId = articleId;

  $$('.page').forEach((p) => {
    p.classList.toggle('page--active', p.dataset.page === page);
  });

  $$('.nav__link').forEach((l) => {
    const nav = l.dataset.nav;
    if (nav) l.classList.toggle('active', nav === page);
  });

  if (updateHash) {
    let h;
    if (isBlogEntry()) {
      h = articleId || '';
    } else {
      h = articleId ? `blog/${articleId}` : page;
    }
    history.replaceState(null, '', h ? `#${h}` : (isBlogEntry() ? location.pathname : `#${page}`));
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Page-specific renders
  if (page === 'portfolio') renderPortfolio();
  if (page === 'reviews') {
    window.ReviewsApp?.refresh?.();
  }
  if (page === 'blog') {
    if (articleId) showArticle(articleId);
    else showBlogList();
  }
  if (page === 'home') {
    state.countersAnimated = false;
    setTimeout(animateCounters, 400);
  }

  requestAnimationFrame(() => {
    const activePage = $(`.page[data-page="${page}"]`);
    window.PageDrop?.animate(activePage);
    if (page !== 'home') observeReveals();
  });
}

/* Mobile menu */
function initMobileMenu() {
  const btn = $('#burgerBtn');
  const menu = $('#mobileMenu');
  btn?.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
}

function closeMobileMenu() {
  const menu = $('#mobileMenu');
  const btn = $('#burgerBtn');
  if (!menu) return;
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  btn?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
let revealObserver;

function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = Number(entry.target.dataset.delay || 0);
            setTimeout(() => entry.target.classList.add('is-visible'), delay);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
  }
  $$('.reveal:not(.is-visible)').forEach((el) => revealObserver.observe(el));
}

/* ============================================================
   COUNTERS
   ============================================================ */
function animateCounters() {
  if (state.countersAnimated) return;
  const counters = $$('.counter');
  if (!counters.length) return;
  state.countersAnimated = true;

  counters.forEach((el) => {
    const target = Number(el.dataset.target || 0);
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/* ============================================================
   PORTFOLIO
   ============================================================ */
function renderPortfolio() {
  const grid = $('#portfolioGrid');
  if (!grid) return;

  grid.innerHTML = PROJECTS.map((p) => `
    <article class="portfolio-card" data-cat="${p.category}" data-id="${p.id}">
      <div class="portfolio-card__thumb ${p.thumbClass || ''}">
        <i class="fa-solid fa-${p.icon}"></i>
        <span class="portfolio-card__folder">${escapeHtml(p.id)}</span>
      </div>
      <div class="portfolio-card__body">
        <div class="portfolio-card__tags">
          ${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
        </div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.desc)}</p>
        <div class="portfolio-card__actions">
          <a class="btn btn--primary btn--sm" href="${escapeHtml(demoHref(p.url))}" target="_blank" rel="noopener" data-open-demo>
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Открыть демо
          </a>
          <button type="button" class="btn btn--ghost btn--sm" data-open-details>Подробнее</button>
        </div>
      </div>
    </article>
  `).join('');

  requestAnimationFrame(() => {
    window.PageDrop?.animateIn(grid, 0);
    setTimeout(() => {
      grid.querySelectorAll('.portfolio-card').forEach((card) => {
        card.classList.add('is-visible', 'is-landed');
      });
    }, 1500);
  });
}

function initPortfolio() {
  $('#portfolioGrid')?.addEventListener('click', (e) => {
    // Direct demo link — let browser handle it
    if (e.target.closest('[data-open-demo]')) return;

    const detailsBtn = e.target.closest('[data-open-details]');
    const card = e.target.closest('.portfolio-card');
    if (!card) return;

    // "Подробнее" or whole card (except demo link)
    if (detailsBtn || !e.target.closest('a')) {
      e.preventDefault();
      openProjectModal(card.dataset.id);
    }
  });
}

function openProjectModal(id) {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return;
  $('#portfolioModalBody').innerHTML = `
    <div class="modal-project">
      <div class="modal-project__thumb ${p.thumbClass || ''}">
        <i class="fa-solid fa-${p.icon}"></i>
      </div>
      <div class="modal-project__tags">
        ${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
      </div>
      <h2>${escapeHtml(p.title)}</h2>
      <p>${escapeHtml(p.full)}</p>
      <div class="modal-project__meta">
        <div><strong>Роль</strong>${escapeHtml(p.role)}</div>
        <div><strong>Год</strong>${escapeHtml(p.year)}</div>
        <div><strong>Папка</strong><code>${escapeHtml(p.id)}</code></div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.65rem">
        <a href="${escapeHtml(demoHref(p.url))}" class="btn btn--primary" target="_blank" rel="noopener">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Открыть демо
        </a>
        <a href="https://t.me/butik_43" class="btn btn--ghost" target="_blank" rel="noopener" data-close-modal>
          <i class="fa-brands fa-telegram"></i> @butik_43
        </a>
      </div>
    </div>
  `;
  openModal('portfolioModal');
}

/* ============================================================
   BLOG
   ============================================================ */
const CATEGORIES = ['all', 'Frontend', 'JavaScript', 'Дизайн', 'Карьера'];

function initBlog() {
  const cats = $('#blogCategories');
  if (cats) {
    cats.innerHTML = CATEGORIES.map((c) => `
      <button type="button" class="chip ${c === 'all' ? 'active' : ''}" data-cat="${c}">
        ${c === 'all' ? 'Все' : escapeHtml(c)}
      </button>
    `).join('');

    cats.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      $$('#blogCategories .chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.blogCategory = chip.dataset.cat;
      renderBlogGrid(true);
    });
  }

  let searchTimer;
  $('#blogSearch')?.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.blogQuery = e.target.value.trim().toLowerCase();
      renderBlogGrid(true);
    }, 180);
  });

  $('#blogGrid')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-article-id]');
    if (!card) return;
    navigateTo('blog', card.dataset.articleId);
  });

  $('#articleBack')?.addEventListener('click', () => {
    navigateTo('blog');
  });
}

function showBlogList() {
  $('#blogListView')?.classList.remove('hidden');
  $('#blogArticleView')?.classList.add('hidden');
  renderBlogGrid();
}

function showArticle(id) {
  const article = getArticles().find((a) => a.id === id);
  if (!article) {
    toast('Статья не найдена', 'error');
    navigateTo('blog');
    return;
  }

  $('#blogListView')?.classList.add('hidden');
  $('#blogArticleView')?.classList.remove('hidden');

  const content = $('#articleContent');
  content.innerHTML = `
    <div class="article__cover" style="background: linear-gradient(135deg, #2a2a2a, #101010)">
      <i class="fa-solid fa-${article.icon === 'react' ? 'atom' : article.icon}"></i>
    </div>
    <div class="article__meta">
      <span class="cat">${escapeHtml(article.category)}</span>
      <span><i class="fa-regular fa-calendar"></i> ${formatDate(article.date)}</span>
      <span><i class="fa-regular fa-clock"></i> ${article.readTime} мин чтения</span>
    </div>
    <h1>${escapeHtml(article.title)}</h1>
    <p class="article__lead">${escapeHtml(article.excerpt)}</p>
    <div class="article__body">${article.content}</div>
    <div class="article__tags">
      ${article.tags.map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}
    </div>
  `;

  // Highlight code with Prism
  if (window.Prism) {
    content.querySelectorAll('pre code').forEach((block) => {
      // Unescape for display if we used HTML entities in seed - content has real tags in template
      Prism.highlightElement(block);
    });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderBlogGrid(replayDrop = false) {
  const grid = $('#blogGrid');
  const empty = $('#blogEmpty');
  if (!grid) return;

  let articles = getArticles();

  if (state.blogCategory !== 'all') {
    articles = articles.filter((a) => a.category === state.blogCategory);
  }
  if (state.blogQuery) {
    const q = state.blogQuery;
    articles = articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
    );
  }

  // Sort by date desc
  articles = [...articles].sort((a, b) => b.date.localeCompare(a.date));

  if (!articles.length) {
    grid.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }
  empty?.classList.add('hidden');

  grid.innerHTML = articles.map((a, i) => {
    const g1 = 30 + (i % 5) * 3;
    const g2 = 12 + (i % 4) * 2;
    return `
    <article class="blog-card reveal" data-article-id="${a.id}">
      <div class="blog-card__cover" style="background: linear-gradient(135deg, #${g1.toString(16).padStart(2,'0').repeat(3)}, #${g2.toString(16).padStart(2,'0').repeat(3)})">
        <i class="fa-solid fa-${a.icon === 'react' ? 'atom' : a.icon}"></i>
      </div>
      <div class="blog-card__body">
        <div class="blog-card__meta">
          <span class="blog-card__cat">${escapeHtml(a.category)}</span>
          <span>${formatDate(a.date)}</span>
          <span>${a.readTime} мин</span>
        </div>
        <h3>${escapeHtml(a.title)}</h3>
        <p>${escapeHtml(a.excerpt)}</p>
        <div class="blog-card__tags">
          ${a.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
  }).join('');

  if (replayDrop) {
    requestAnimationFrame(() => {
      window.PageDrop?.animateIn($('#blogGrid'), 3);
    });
  }
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  if (id) {
    const m = document.getElementById(id);
    if (m) m.hidden = true;
  } else {
    $$('.modal').forEach((m) => { m.hidden = true; });
  }
  if ($$('.modal').every((m) => m.hidden)) {
    document.body.style.overflow = '';
  }
}

function initModals() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-modal]')) {
      const modal = e.target.closest('.modal');
      if (modal) closeModal(modal.id);
      // Allow nav after close
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        setTimeout(() => navigateTo(nav.getAttribute('data-nav')), 50);
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ============================================================
   CONTACT FORM + COPY + CV
   ============================================================ */
function initContact() {
  // Copy buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    e.preventDefault();
    copyText(btn.getAttribute('data-copy'));
  });

}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  seedArticles();
  initTheme();
  initNavigation();
  initMobileMenu();
  initModals();
  initPortfolio();
  initBlog();
  initContact();

  // Initial page content
  if (state.page === 'portfolio') renderPortfolio();
  if (state.page === 'blog') {
    if (state.articleId) showArticle(state.articleId);
    else showBlogList();
  }
  if (state.page === 'home') setTimeout(animateCounters, 500);

  console.info(
    '%cButik Portfolio',
    'color:#888;font-weight:bold;font-size:13px',
    '\n@butik_43 · SPA ready'
  );
}

document.addEventListener('DOMContentLoaded', init);
