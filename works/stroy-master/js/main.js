/**
 * ============================================================
 * СтройМастер — Corporate site + CRM Dashboard
 * Vanilla JS (ES6+) · SPA navigation · localStorage
 * ============================================================
 */

'use strict';

/* ============================================================
   STORAGE KEYS & CONSTANTS
   ============================================================ */
const STORAGE = {
  THEME: 'sm_theme',
  SESSION: 'sm_session',
  CLIENTS: 'sm_clients',
  PROJECTS: 'sm_projects',
  REQUESTS: 'sm_requests',
  DOCUMENTS: 'sm_documents',
  EVENTS: 'sm_events',
  LEADS: 'sm_leads',
  SEEDED: 'sm_seeded',
};

const PROJECT_STATUSES = {
  new: { label: 'Новый', badge: 'badge--new' },
  progress: { label: 'В работе', badge: 'badge--progress' },
  review: { label: 'На утверждении', badge: 'badge--review' },
  done: { label: 'Завершён', badge: 'badge--done' },
};

const CATEGORY_LABELS = {
  repair: 'Ремонт',
  house: 'Дома',
  commercial: 'Коммерция',
  design: 'Дизайн',
};

/** Demo users (password stored as plain text for demo only) */
const DEMO_USERS = [
  {
    id: 'u1',
    email: 'client@demo.ru',
    password: 'client123',
    name: 'Иван Петров',
    role: 'client',
    clientId: 'c1',
  },
  {
    id: 'u2',
    email: 'manager@demo.ru',
    password: 'manager123',
    name: 'Ольга Смирнова',
    role: 'manager',
    clientId: null,
  },
];

/* ============================================================
   STATE
   ============================================================ */
const state = {
  page: 'home',
  session: null,       // { userId, email, name, role, clientId, activeRole }
  dashView: 'overview',
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  confirmCallback: null,
  editContext: null,   // { type, id }
};

/* ============================================================
   UTILITIES
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMoney(n) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function statusBadge(status) {
  const s = PROJECT_STATUSES[status] || { label: status, badge: 'badge--muted' };
  return `<span class="badge ${s.badge}">${s.label}</span>`;
}

function toast(message, type = 'info') {
  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = '0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

/* ============================================================
   DEMO DATA SEED
   ============================================================ */
function seedDemoData() {
  if (load(STORAGE.SEEDED)) return;

  const clients = [
    { id: 'c1', name: 'Иван Петров', email: 'client@demo.ru', phone: '+7 (916) 111-22-33', company: 'Физлицо', createdAt: '2025-11-10' },
    { id: 'c2', name: 'Анна Ковалёва', email: 'anna.k@mail.ru', phone: '+7 (903) 444-55-66', company: 'Физлицо', createdAt: '2025-12-01' },
    { id: 'c3', name: 'Дмитрий Морозов', email: 'd.morozov@technoplus.ru', phone: '+7 (495) 222-33-44', company: 'ООО «ТехноПлюс»', createdAt: '2025-09-15' },
    { id: 'c4', name: 'Елена Соколова', email: 'e.sokolova@gmail.com', phone: '+7 (926) 777-88-99', company: 'Физлицо', createdAt: '2026-01-20' },
    { id: 'c5', name: 'Сергей Волков', email: 's.volkov@retail.ru', phone: '+7 (499) 555-66-77', company: 'АО «Ритейл Групп»', createdAt: '2025-08-05' },
    { id: 'c6', name: 'Мария Лебедева', email: 'm.lebedeva@yandex.ru', phone: '+7 (915) 333-22-11', company: 'ИП Лебедева', createdAt: '2026-02-14' },
  ];

  const projects = [
    {
      id: 'p1', clientId: 'c1', title: 'Ремонт 3-к квартиры, ЖК «Солнечный»',
      status: 'progress', budget: 1850000, area: 78, address: 'Москва, ул. Ленина, 45',
      startDate: '2026-03-01', endDate: '2026-06-15', progress: 55,
      category: 'repair', description: 'Капитальный ремонт с перепланировкой кухни-гостиной',
    },
    {
      id: 'p2', clientId: 'c2', title: 'Дизайн-проект студии 42 м²',
      status: 'review', budget: 180000, area: 42, address: 'Москва, пр. Мира, 12',
      startDate: '2026-04-10', endDate: '2026-05-20', progress: 90,
      category: 'design', description: 'Полный дизайн-проект с 3D и комплектацией',
    },
    {
      id: 'p3', clientId: 'c3', title: 'Fit-out офиса 400 м²',
      status: 'done', budget: 12500000, area: 400, address: 'Москва, БЦ «Империя»',
      startDate: '2025-06-01', endDate: '2025-11-30', progress: 100,
      category: 'commercial', description: 'Open-space + переговорные + серверная',
    },
    {
      id: 'p4', clientId: 'c4', title: 'Коттедж 180 м², Истринский р-н',
      status: 'progress', budget: 9800000, area: 180, address: 'МО, Истринский р-н, д. Покровское',
      startDate: '2025-10-01', endDate: '2026-08-30', progress: 40,
      category: 'house', description: 'Строительство дома из газобетона под ключ',
    },
    {
      id: 'p5', clientId: 'c5', title: 'Реконструкция магазина',
      status: 'new', budget: 3200000, area: 120, address: 'Москва, ул. Тверская, 8',
      startDate: '2026-05-01', endDate: '2026-07-15', progress: 5,
      category: 'commercial', description: 'Демонтаж, инженерия, чистовая отделка retail',
    },
    {
      id: 'p6', clientId: 'c6', title: 'Ремонт апартаментов',
      status: 'done', budget: 2100000, area: 65, address: 'Москва, ЖК «Сердце Столицы»',
      startDate: '2025-11-01', endDate: '2026-02-28', progress: 100,
      category: 'repair', description: 'Премиум-отделка с мебелью на заказ',
    },
  ];

  const requests = [
    { id: 'r1', clientId: 'c1', name: 'Иван Петров', phone: '+7 (916) 111-22-33', email: 'client@demo.ru', service: 'repair', message: 'Нужен расчёт доп. работ по электрике', status: 'new', createdAt: '2026-04-28' },
    { id: 'r2', clientId: null, name: 'Алексей Новиков', phone: '+7 (905) 123-45-67', email: 'a.novikov@mail.ru', service: 'house', message: 'Интересует строительство дома 150 м² в Подмосковье', status: 'new', createdAt: '2026-05-02' },
    { id: 'r3', clientId: 'c2', name: 'Анна Ковалёва', phone: '+7 (903) 444-55-66', email: 'anna.k@mail.ru', service: 'design', message: 'Правки по дизайн-проекту — ждёт согласования', status: 'progress', createdAt: '2026-04-15' },
  ];

  const documents = [
    { id: 'd1', clientId: 'c1', projectId: 'p1', title: 'Договор подряда №СМ-2026-041', type: 'pdf', size: '245 КБ', date: '2026-02-28' },
    { id: 'd2', clientId: 'c1', projectId: 'p1', title: 'Смета работ (редакция 2)', type: 'pdf', size: '1.2 МБ', date: '2026-03-05' },
    { id: 'd3', clientId: 'c1', projectId: 'p1', title: 'Акт скрытых работ — электрика', type: 'pdf', size: '180 КБ', date: '2026-04-12' },
    { id: 'd4', clientId: 'c2', projectId: 'p2', title: 'Договор на дизайн-проект', type: 'pdf', size: '210 КБ', date: '2026-04-08' },
    { id: 'd5', clientId: 'c3', projectId: 'p3', title: 'Акт сдачи-приёмки', type: 'pdf', size: '320 КБ', date: '2025-11-30' },
  ];

  // Dates relative to "today" in user environment (July 2026) so calendar shows events
  const events = [
    { id: 'e1', date: '2026-07-05', title: 'Замер на объекте (Тверская, 8)', projectId: 'p5' },
    { id: 'e2', date: '2026-07-08', title: 'Согласование сметы с клиентом', projectId: 'p1' },
    { id: 'e3', date: '2026-07-12', title: 'Приёмка черновых работ', projectId: 'p4' },
    { id: 'e4', date: '2026-07-15', title: 'Поставка материалов — плитка', projectId: 'p1' },
    { id: 'e5', date: '2026-07-20', title: 'Сдача дизайн-проекта', projectId: 'p2' },
    { id: 'e6', date: '2026-07-22', title: 'Планерка команды', projectId: null },
  ];

  save(STORAGE.CLIENTS, clients);
  save(STORAGE.PROJECTS, projects);
  save(STORAGE.REQUESTS, requests);
  save(STORAGE.DOCUMENTS, documents);
  save(STORAGE.EVENTS, events);
  save(STORAGE.LEADS, []);
  save(STORAGE.SEEDED, true);
}

/* Data accessors */
const getClients = () => load(STORAGE.CLIENTS, []);
const getProjects = () => load(STORAGE.PROJECTS, []);
const getRequests = () => load(STORAGE.REQUESTS, []);
const getDocuments = () => load(STORAGE.DOCUMENTS, []);
const getEvents = () => load(STORAGE.EVENTS, []);
const setClients = (d) => save(STORAGE.CLIENTS, d);
const setProjects = (d) => save(STORAGE.PROJECTS, d);
const setRequests = (d) => save(STORAGE.REQUESTS, d);
const setDocuments = (d) => save(STORAGE.DOCUMENTS, d);
const setEvents = (d) => save(STORAGE.EVENTS, d);

/* ============================================================
   THEME
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem(STORAGE.THEME) || 'light';
  applyTheme(saved);
  $('#themeToggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE.THEME, theme);
  const icon = $('#themeIcon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
}

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
function initNavigation() {
  // All elements with data-page attribute
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-page]');
    if (!link) return;
    e.preventDefault();
    const page = link.getAttribute('data-page');
    navigateTo(page);
    closeMobileMenu();
  });

  // Hash on load / change
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || 'home';
    if (hash !== state.page) navigateTo(hash, false);
  });

  const initial = location.hash.replace('#', '') || 'home';
  navigateTo(initial, false);
}

function navigateTo(page, updateHash = true) {
  // Protect dashboard
  if (page === 'dashboard' && !state.session) {
    openModal('loginModal');
    toast('Войдите, чтобы открыть личный кабинет', 'info');
    return;
  }

  const validPages = ['home', 'about', 'services', 'portfolio', 'contacts', 'dashboard'];
  if (!validPages.includes(page)) page = 'home';

  state.page = page;

  // Toggle pages
  $$('.page').forEach((p) => {
    p.classList.toggle('page--active', p.dataset.pageView === page);
  });

  // Nav active state
  $$('.nav__link').forEach((l) => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  // Body class for dashboard layout
  document.body.classList.toggle('dashboard-mode', page === 'dashboard');

  if (updateHash) {
    history.replaceState(null, '', `#${page}`);
  }

  // Scroll top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'dashboard') {
    renderDashboard();
  }
  if (page === 'portfolio') {
    renderPortfolio();
  }
}

/* Mobile menu */
function initMobileMenu() {
  const burger = $('#burgerBtn');
  const menu = $('#mobileMenu');
  burger?.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.querySelector('i').className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    menu.setAttribute('aria-hidden', !open);
  });
}

function closeMobileMenu() {
  const menu = $('#mobileMenu');
  const burger = $('#burgerBtn');
  if (!menu) return;
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  if (burger) {
    burger.setAttribute('aria-expanded', 'false');
    burger.querySelector('i').className = 'fa-solid fa-bars';
  }
}

/* ============================================================
   MODALS
   ============================================================ */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  // Focus first input
  setTimeout(() => {
    const input = modal.querySelector('input, select, textarea, button:not([data-close-modal])');
    input?.focus();
  }, 50);
}

function closeModal(id) {
  const modal = id ? document.getElementById(id) : null;
  if (modal) {
    modal.hidden = true;
  } else {
    $$('.modal').forEach((m) => { m.hidden = true; });
  }
  // If no open modals left
  if ($$('.modal').every((m) => m.hidden)) {
    document.body.style.overflow = '';
  }
}

function initModals() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-modal]')) {
      const modal = e.target.closest('.modal');
      if (modal) closeModal(modal.id);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  $('#confirmOkBtn')?.addEventListener('click', () => {
    if (typeof state.confirmCallback === 'function') {
      state.confirmCallback();
      state.confirmCallback = null;
    }
    closeModal('confirmModal');
  });
}

function confirmAction(title, text, onConfirm) {
  $('#confirmModalTitle').textContent = title;
  $('#confirmModalText').textContent = text;
  state.confirmCallback = onConfirm;
  openModal('confirmModal');
}

/* ============================================================
   AUTH
   ============================================================ */
function initAuth() {
  // Restore session
  const session = load(STORAGE.SESSION);
  if (session) {
    state.session = session;
  }
  updateAuthUI();

  $('#loginBtn')?.addEventListener('click', () => openModal('loginModal'));
  $('#logoutBtn')?.addEventListener('click', logout);

  $('#loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
  });

  // Role switch
  $('#roleSwitch')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-role]');
    if (!btn || !state.session) return;
    state.session.activeRole = btn.dataset.role;
    // Manager can switch freely; client account switching to manager is allowed for demo
    save(STORAGE.SESSION, state.session);
    state.dashView = 'overview';
    renderDashboard();
    toast(`Режим: ${btn.dataset.role === 'manager' ? 'Менеджер' : 'Клиент'}`, 'info');
  });
}

function handleLogin() {
  const form = $('#loginForm');
  const emailInput = form.querySelector('#login-email');
  const passwordInput = form.querySelector('#login-password');
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const errorEl = $('#loginError');
  errorEl.textContent = '';

  // Clear field errors
  form.querySelectorAll('.form__error').forEach((el) => {
    if (el.id !== 'loginError') el.textContent = '';
  });
  form.querySelectorAll('input').forEach((i) => i.classList.remove('is-invalid'));

  let valid = true;
  if (!email) {
    form.querySelector('[data-error="email"]').textContent = 'Введите email';
    emailInput.classList.add('is-invalid');
    valid = false;
  }
  if (!password) {
    form.querySelector('[data-error="password"]').textContent = 'Введите пароль';
    passwordInput.classList.add('is-invalid');
    valid = false;
  }
  if (!valid) return;

  const user = DEMO_USERS.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    errorEl.textContent = 'Неверный email или пароль';
    return;
  }

  state.session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
    activeRole: user.role, // default to account role
  };
  save(STORAGE.SESSION, state.session);
  closeModal('loginModal');
  form.reset();
  updateAuthUI();
  toast(`Добро пожаловать, ${user.name}!`, 'success');
  navigateTo('dashboard');
}

function logout() {
  state.session = null;
  localStorage.removeItem(STORAGE.SESSION);
  updateAuthUI();
  navigateTo('home');
  toast('Вы вышли из аккаунта', 'info');
}

function updateAuthUI() {
  const loggedIn = !!state.session;
  $('#loginBtn')?.classList.toggle('hidden', loggedIn);
  $('#dashboardBtn')?.classList.toggle('hidden', !loggedIn);
}

function getActiveRole() {
  return state.session?.activeRole || state.session?.role || 'client';
}

/* ============================================================
   CONTACT FORM
   ============================================================ */
function initContactForm() {
  const form = $('#contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = {
      name: String(fd.get('name') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      email: String(fd.get('email') || '').trim(),
      service: String(fd.get('service') || ''),
      message: String(fd.get('message') || '').trim(),
      agree: form.querySelector('#cf-agree')?.checked || false,
    };

    // Clear errors
    form.querySelectorAll('.form__error').forEach((el) => { el.textContent = ''; });
    form.querySelectorAll('input, textarea, select').forEach((el) => el.classList.remove('is-invalid'));

    let valid = true;

    if (!data.name || data.name.length < 2) {
      setFieldError(form, 'name', 'Укажите имя (минимум 2 символа)');
      valid = false;
    }
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
      setFieldError(form, 'phone', 'Укажите корректный телефон');
      valid = false;
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setFieldError(form, 'email', 'Некорректный email');
      valid = false;
    }
    if (!data.message || data.message.length < 10) {
      setFieldError(form, 'message', 'Опишите задачу (минимум 10 символов)');
      valid = false;
    }
    if (!data.agree) {
      setFieldError(form, 'agree', 'Необходимо согласие на обработку данных');
      valid = false;
    }

    if (!valid) return;

    // Save as lead / request
    const requests = getRequests();
    requests.unshift({
      id: uid('r'),
      clientId: state.session?.clientId || null,
      name: data.name,
      phone: data.phone,
      email: data.email,
      service: data.service || 'other',
      message: data.message,
      status: 'new',
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setRequests(requests);

    form.reset();
    toast('Заявка отправлена! Мы свяжемся с вами в ближайшее время.', 'success');
  });
}

function setFieldError(form, field, message) {
  const err = form.querySelector(`[data-error="${field}"]`);
  if (err) err.textContent = message;
  const input = form.querySelector(`[name="${field}"]`);
  if (input) input.classList.add('is-invalid');
}

/* ============================================================
   PORTFOLIO
   ============================================================ */
const PORTFOLIO_ITEMS = [
  { id: 1, cat: 'repair', title: 'Квартира 95 м², Хамовники', desc: 'Капитальный ремонт в классическом стиле', hue: 210, year: 2025 },
  { id: 2, cat: 'house', title: 'Коттедж 220 м², Новая Рига', desc: 'Дом из кирпича с панорамными окнами', hue: 25, year: 2024 },
  { id: 3, cat: 'commercial', title: 'Офис IT-компании 350 м²', desc: 'Open-space + переговорные + lounge', hue: 200, year: 2025 },
  { id: 4, cat: 'design', title: 'Дизайн лофта 68 м²', desc: 'Индустриальный стиль с тёплым деревом', hue: 160, year: 2026 },
  { id: 5, cat: 'repair', title: 'Апартаменты 55 м²', desc: 'Премиум-отделка под ключ', hue: 280, year: 2025 },
  { id: 6, cat: 'commercial', title: 'Ресторан 180 м²', desc: 'Реконструкция и fit-out', hue: 10, year: 2024 },
  { id: 7, cat: 'house', title: 'Таунхаус 140 м²', desc: 'Каркас + отделка + инженерия', hue: 40, year: 2025 },
  { id: 8, cat: 'design', title: 'Офис-шоурум', desc: 'Концепция и визуализация', hue: 190, year: 2026 },
];

function renderPortfolio() {
  const grid = $('#portfolioGrid');
  if (!grid) return;

  grid.innerHTML = PORTFOLIO_ITEMS.map((item) => `
    <article class="card portfolio-card" data-cat="${item.cat}" data-id="${item.id}">
      <div class="portfolio-card__thumb" style="background: linear-gradient(135deg, hsl(${item.hue}, 45%, 35%), hsl(${item.hue}, 55%, 22%))">
        <i class="fa-solid fa-${item.cat === 'house' ? 'house' : item.cat === 'commercial' ? 'building' : item.cat === 'design' ? 'pencil-ruler' : 'paint-roller'}"></i>
      </div>
      <div class="portfolio-card__body">
        <div class="portfolio-card__cat">${CATEGORY_LABELS[item.cat] || item.cat}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.desc)} · ${item.year}</p>
      </div>
    </article>
  `).join('');

  // Filters
  const filters = $('#portfolioFilters');
  if (filters && !filters.dataset.bound) {
    filters.dataset.bound = '1';
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      $$('.filter-btn', filters).forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      $$('.portfolio-card', grid).forEach((card) => {
        const show = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('hidden-filter', !show);
      });
    });
  }

  // Card click
  if (!grid.dataset.bound) {
    grid.dataset.bound = '1';
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.portfolio-card');
      if (!card) return;
      const item = PORTFOLIO_ITEMS.find((i) => String(i.id) === card.dataset.id);
      if (!item) return;
      $('#portfolioModalBody').innerHTML = `
        <div class="portfolio-card__thumb" style="height:200px;border-radius:12px;margin-bottom:1.25rem;background:linear-gradient(135deg,hsl(${item.hue},45%,35%),hsl(${item.hue},55%,22%))">
          <i class="fa-solid fa-image" style="font-size:3rem"></i>
        </div>
        <span class="badge badge--info">${CATEGORY_LABELS[item.cat]}</span>
        <h2 style="margin:0.75rem 0 0.5rem">${escapeHtml(item.title)}</h2>
        <p class="text-muted">${escapeHtml(item.desc)}</p>
        <p class="text-sm text-muted mt-2">Год сдачи: ${item.year}</p>
        <button type="button" class="btn btn--primary mt-2" data-page="contacts" data-close-modal>
          <i class="fa-solid fa-paper-plane"></i> Хочу похожий проект
        </button>
      `;
      openModal('portfolioModal');
    });
  }
}

/* ============================================================
   DASHBOARD / CRM
   ============================================================ */
function renderDashboard() {
  if (!state.session) return;

  const role = getActiveRole();
  const user = state.session;

  // User info
  const initials = user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  $('#dashUserInfo').innerHTML = `
    <div class="avatar">${initials}</div>
    <div>
      <strong>${escapeHtml(user.name)}</strong>
      <span>${escapeHtml(user.email)}</span>
    </div>
  `;

  // Role switch buttons
  $$('#roleSwitch .role-switch__btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  $('#dashRoleBadge').textContent = role === 'manager' ? 'Менеджер' : 'Клиент';

  // Navigation by role
  const clientNav = [
    { id: 'overview', icon: 'fa-house', label: 'Обзор' },
    { id: 'my-projects', icon: 'fa-folder-open', label: 'Мои проекты' },
    { id: 'my-requests', icon: 'fa-inbox', label: 'Заявки' },
    { id: 'new-request', icon: 'fa-plus-circle', label: 'Новая заявка' },
    { id: 'documents', icon: 'fa-file-lines', label: 'Документы' },
  ];
  const managerNav = [
    { id: 'overview', icon: 'fa-chart-pie', label: 'Статистика' },
    { id: 'projects', icon: 'fa-diagram-project', label: 'Проекты' },
    { id: 'clients', icon: 'fa-users', label: 'Клиенты' },
    { id: 'requests', icon: 'fa-clipboard-list', label: 'Заявки' },
    { id: 'calendar', icon: 'fa-calendar-days', label: 'Календарь' },
  ];

  const nav = role === 'manager' ? managerNav : clientNav;
  // Ensure current view is valid for role
  if (!nav.find((n) => n.id === state.dashView)) {
    state.dashView = 'overview';
  }

  $('#dashNav').innerHTML = nav.map((item) => `
    <button type="button" class="dash__nav-link ${state.dashView === item.id ? 'active' : ''}" data-dash-view="${item.id}">
      <i class="fa-solid ${item.icon}"></i> ${item.label}
    </button>
  `).join('');

  // Titles
  const titles = {
    overview: role === 'manager' ? 'Панель статистики' : 'Личный кабинет',
    'my-projects': 'Мои проекты',
    'my-requests': 'Мои заявки',
    'new-request': 'Новая заявка',
    documents: 'Документы',
    projects: 'Управление проектами',
    clients: 'Клиенты',
    requests: 'Заявки',
    calendar: 'Календарь',
  };
  $('#dashTitle').textContent = titles[state.dashView] || 'Кабинет';

  // Content
  const content = $('#dashContent');
  if (role === 'manager') {
    renderManagerView(content, state.dashView);
  } else {
    renderClientView(content, state.dashView);
  }
}

function initDashboardEvents() {
  // Sidebar nav
  $('#dashNav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dash-view]');
    if (!btn) return;
    state.dashView = btn.dataset.dashView;
    renderDashboard();
    // Close mobile sidebar
    $('#dashSidebar')?.classList.remove('open');
    $('#dashOverlay')?.remove();
  });

  // Mobile sidebar toggle
  $('#dashMenuToggle')?.addEventListener('click', () => {
    const sidebar = $('#dashSidebar');
    const isOpen = sidebar.classList.toggle('open');
    if (isOpen) {
      const overlay = document.createElement('div');
      overlay.className = 'dash__sidebar-overlay';
      overlay.id = 'dashOverlay';
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.remove();
      });
      document.body.appendChild(overlay);
    } else {
      $('#dashOverlay')?.remove();
    }
  });

  // Delegated CRM actions in content
  $('#dashContent')?.addEventListener('click', handleDashClick);
  $('#dashContent')?.addEventListener('submit', handleDashSubmit);
  $('#dashContent')?.addEventListener('input', handleDashFilter);
  $('#dashContent')?.addEventListener('change', handleDashFilter);
}

function handleDashClick(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  const id = target.dataset.id;

  switch (action) {
    case 'add-project':
      openProjectForm();
      break;
    case 'edit-project':
      openProjectForm(id);
      break;
    case 'delete-project':
      confirmAction('Удалить проект?', 'Это действие нельзя отменить.', () => {
        setProjects(getProjects().filter((p) => p.id !== id));
        toast('Проект удалён', 'success');
        renderDashboard();
      });
      break;
    case 'add-client':
      openClientForm();
      break;
    case 'edit-client':
      openClientForm(id);
      break;
    case 'delete-client':
      confirmAction('Удалить клиента?', 'Связанные проекты останутся без клиента.', () => {
        setClients(getClients().filter((c) => c.id !== id));
        toast('Клиент удалён', 'success');
        renderDashboard();
      });
      break;
    case 'delete-request':
      confirmAction('Удалить заявку?', 'Заявка будет удалена безвозвратно.', () => {
        setRequests(getRequests().filter((r) => r.id !== id));
        toast('Заявка удалена', 'success');
        renderDashboard();
      });
      break;
    case 'view-request':
      viewRequest(id);
      break;
    case 'set-request-status': {
      const status = target.dataset.status;
      const requests = getRequests();
      const req = requests.find((r) => r.id === id);
      if (req) {
        req.status = status;
        setRequests(requests);
        toast('Статус обновлён', 'success');
        renderDashboard();
      }
      break;
    }
    case 'view-doc':
      toast('Документ открыт (имитация). В продакшене — скачивание PDF.', 'info');
      break;
    case 'cal-prev':
      state.calendarMonth--;
      if (state.calendarMonth < 0) {
        state.calendarMonth = 11;
        state.calendarYear--;
      }
      renderDashboard();
      break;
    case 'cal-next':
      state.calendarMonth++;
      if (state.calendarMonth > 11) {
        state.calendarMonth = 0;
        state.calendarYear++;
      }
      renderDashboard();
      break;
    default:
      break;
  }
}

function handleDashSubmit(e) {
  if (e.target.id === 'clientRequestForm') {
    e.preventDefault();
    submitClientRequest(e.target);
  }
}

function handleDashFilter(e) {
  if (e.target.matches('[data-filter-table]')) {
    // Re-render current manager table views with filters
    const content = $('#dashContent');
    const view = state.dashView;
    if (view === 'projects') renderManagerProjects(content);
    if (view === 'clients') renderManagerClients(content);
    if (view === 'requests') renderManagerRequests(content);
  }
}

/* ---------- Client views ---------- */
function renderClientView(container, view) {
  switch (view) {
    case 'overview':
      renderClientOverview(container);
      break;
    case 'my-projects':
      renderClientProjects(container);
      break;
    case 'my-requests':
      renderClientRequests(container);
      break;
    case 'new-request':
      renderClientNewRequest(container);
      break;
    case 'documents':
      renderClientDocuments(container);
      break;
    default:
      container.innerHTML = '<p>Раздел не найден</p>';
  }
}

function renderClientOverview(container) {
  const clientId = state.session.clientId;
  const projects = getProjects().filter((p) => p.clientId === clientId);
  const requests = getRequests().filter(
    (r) => r.clientId === clientId || r.email === state.session.email
  );
  const docs = getDocuments().filter((d) => d.clientId === clientId);
  const active = projects.filter((p) => p.status !== 'done').length;
  const done = projects.filter((p) => p.status === 'done').length;

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--orange"><i class="fa-solid fa-folder-open"></i></div>
        <div class="stat-card__label">Всего проектов</div>
        <div class="stat-card__value">${projects.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue"><i class="fa-solid fa-spinner"></i></div>
        <div class="stat-card__label">В работе</div>
        <div class="stat-card__value">${active}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green"><i class="fa-solid fa-check"></i></div>
        <div class="stat-card__label">Завершено</div>
        <div class="stat-card__value">${done}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--yellow"><i class="fa-solid fa-file"></i></div>
        <div class="stat-card__label">Документы</div>
        <div class="stat-card__value">${docs.length}</div>
      </div>
    </div>

    <h3 class="mb-2">Активные проекты</h3>
    ${projects.filter((p) => p.status !== 'done').length
      ? `<div class="project-cards">${projects.filter((p) => p.status !== 'done').map(projectCardHTML).join('')}</div>`
      : `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>Нет активных проектов</p></div>`
    }

    <h3 class="mb-2 mt-2" style="margin-top:1.5rem">Последние заявки</h3>
    ${requests.length
      ? tableHTML(
        ['Дата', 'Услуга', 'Сообщение', 'Статус'],
        requests.slice(0, 5).map((r) => [
          formatDate(r.createdAt),
          CATEGORY_LABELS[r.service] || r.service || '—',
          escapeHtml((r.message || '').slice(0, 50)) + ((r.message || '').length > 50 ? '…' : ''),
          statusBadge(r.status === 'progress' ? 'progress' : r.status === 'done' ? 'done' : 'new'),
        ])
      )
      : `<div class="empty-state"><i class="fa-regular fa-inbox"></i><p>Заявок пока нет</p></div>`
    }
  `;
}

function projectCardHTML(p) {
  return `
    <article class="project-card">
      <div class="project-card__head">
        <h3>${escapeHtml(p.title)}</h3>
        ${statusBadge(p.status)}
      </div>
      <div class="project-card__meta">
        <span><i class="fa-solid fa-location-dot"></i>${escapeHtml(p.address || '—')}</span>
        <span><i class="fa-solid fa-ruble-sign"></i>${formatMoney(p.budget)}</span>
        <span><i class="fa-regular fa-calendar"></i>${formatDate(p.startDate)} — ${formatDate(p.endDate)}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill" style="width:${p.progress || 0}%"></div>
      </div>
      <div class="progress-label">${p.progress || 0}% выполнено</div>
    </article>
  `;
}

function renderClientProjects(container) {
  const projects = getProjects().filter((p) => p.clientId === state.session.clientId);
  container.innerHTML = projects.length
    ? `<div class="project-cards">${projects.map(projectCardHTML).join('')}</div>`
    : `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>У вас пока нет проектов</p>
         <button type="button" class="btn btn--primary mt-2" data-dash-view-go="new-request">Оставить заявку</button></div>`;

  container.querySelector('[data-dash-view-go]')?.addEventListener('click', (e) => {
    state.dashView = e.target.dataset.dashViewGo;
    renderDashboard();
  });
}

function renderClientRequests(container) {
  const requests = getRequests().filter(
    (r) => r.clientId === state.session.clientId || r.email === state.session.email
  );
  container.innerHTML = requests.length
    ? tableHTML(
      ['Дата', 'Услуга', 'Сообщение', 'Статус'],
      requests.map((r) => [
        formatDate(r.createdAt),
        CATEGORY_LABELS[r.service] || r.service || '—',
        escapeHtml(r.message || ''),
        statusBadge(r.status === 'progress' ? 'progress' : r.status === 'done' ? 'done' : 'new'),
      ])
    )
    : `<div class="empty-state"><i class="fa-regular fa-inbox"></i><p>Заявок нет</p></div>`;
}

function renderClientNewRequest(container) {
  container.innerHTML = `
    <form class="dash-form" id="clientRequestForm" novalidate>
      <p class="form__hint">Опишите задачу — менеджер свяжется с вами</p>
      <div class="form__group">
        <label>Услуга</label>
        <select name="service" required>
          <option value="repair">Ремонт</option>
          <option value="house">Строительство дома</option>
          <option value="commercial">Коммерческий объект</option>
          <option value="design">Проектирование</option>
          <option value="other">Другое</option>
        </select>
      </div>
      <div class="form__group">
        <label>Телефон</label>
        <input type="tel" name="phone" value="${escapeHtml(getClients().find((c) => c.id === state.session.clientId)?.phone || '')}" required />
      </div>
      <div class="form__group">
        <label>Сообщение</label>
        <textarea name="message" rows="4" required placeholder="Что нужно сделать?"></textarea>
      </div>
      <button type="submit" class="btn btn--primary">
        <i class="fa-solid fa-paper-plane"></i> Отправить
      </button>
    </form>
  `;
}

function submitClientRequest(form) {
  const fd = new FormData(form);
  const service = String(fd.get('service') || 'other');
  const phone = String(fd.get('phone') || '').trim();
  const message = String(fd.get('message') || '').trim();
  if (!phone || !message) {
    toast('Заполните телефон и сообщение', 'error');
    return;
  }
  const requests = getRequests();
  requests.unshift({
    id: uid('r'),
    clientId: state.session.clientId,
    name: state.session.name,
    phone,
    email: state.session.email,
    service,
    message,
    status: 'new',
    createdAt: new Date().toISOString().slice(0, 10),
  });
  setRequests(requests);
  form.reset();
  toast('Заявка отправлена!', 'success');
  state.dashView = 'my-requests';
  renderDashboard();
}

function renderClientDocuments(container) {
  const docs = getDocuments().filter((d) => d.clientId === state.session.clientId);
  container.innerHTML = docs.length
    ? `<div class="doc-list">${docs.map((d) => `
        <div class="doc-item">
          <div class="doc-item__icon"><i class="fa-solid fa-file-pdf"></i></div>
          <div class="doc-item__info">
            <strong>${escapeHtml(d.title)}</strong>
            <span>${formatDate(d.date)} · ${escapeHtml(d.size)} · ${escapeHtml(d.type.toUpperCase())}</span>
          </div>
          <button type="button" class="btn btn--outline btn--sm" data-action="view-doc" data-id="${d.id}">
            <i class="fa-solid fa-eye"></i> Открыть
          </button>
        </div>
      `).join('')}</div>`
    : `<div class="empty-state"><i class="fa-regular fa-file"></i><p>Документов пока нет</p></div>`;
}

/* ---------- Manager views ---------- */
function renderManagerView(container, view) {
  switch (view) {
    case 'overview':
      renderManagerOverview(container);
      break;
    case 'projects':
      renderManagerProjects(container);
      break;
    case 'clients':
      renderManagerClients(container);
      break;
    case 'requests':
      renderManagerRequests(container);
      break;
    case 'calendar':
      renderCalendar(container);
      break;
    default:
      container.innerHTML = '<p>Раздел не найден</p>';
  }
}

function renderManagerOverview(container) {
  const projects = getProjects();
  const clients = getClients();
  const requests = getRequests();
  const byStatus = {
    new: projects.filter((p) => p.status === 'new').length,
    progress: projects.filter((p) => p.status === 'progress').length,
    review: projects.filter((p) => p.status === 'review').length,
    done: projects.filter((p) => p.status === 'done').length,
  };
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const newRequests = requests.filter((r) => r.status === 'new').length;

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--orange"><i class="fa-solid fa-diagram-project"></i></div>
        <div class="stat-card__label">Проекты</div>
        <div class="stat-card__value">${projects.length}</div>
        <div class="stat-card__meta">В работе: ${byStatus.progress}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue"><i class="fa-solid fa-users"></i></div>
        <div class="stat-card__label">Клиенты</div>
        <div class="stat-card__value">${clients.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--yellow"><i class="fa-solid fa-inbox"></i></div>
        <div class="stat-card__label">Новые заявки</div>
        <div class="stat-card__value">${newRequests}</div>
        <div class="stat-card__meta">Всего: ${requests.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green"><i class="fa-solid fa-ruble-sign"></i></div>
        <div class="stat-card__label">Сумма бюджетов</div>
        <div class="stat-card__value" style="font-size:1.25rem">${formatMoney(totalBudget)}</div>
      </div>
    </div>

    <div class="grid grid--2" style="margin-bottom:1.5rem">
      <div class="stat-card">
        <div class="stat-card__label">По статусам</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
          ${Object.entries(byStatus).map(([k, v]) => `
            <span class="badge ${PROJECT_STATUSES[k].badge}">${PROJECT_STATUSES[k].label}: ${v}</span>
          `).join('')}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__label">Быстрые действия</div>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
          <button type="button" class="btn btn--primary btn--sm" data-action="add-project">
            <i class="fa-solid fa-plus"></i> Проект
          </button>
          <button type="button" class="btn btn--outline btn--sm" data-action="add-client">
            <i class="fa-solid fa-user-plus"></i> Клиент
          </button>
        </div>
      </div>
    </div>

    <h3 class="mb-2">Последние проекты</h3>
    ${projectsTableHTML(projects.slice(0, 5), false)}
  `;
}

function getFilterValues() {
  const search = $('#dashContent [data-filter-table="search"]')?.value?.toLowerCase() || '';
  const status = $('#dashContent [data-filter-table="status"]')?.value || '';
  return { search, status };
}

function renderManagerProjects(container) {
  // Preserve filter values if re-rendering
  const prevSearch = container.querySelector('[data-filter-table="search"]')?.value || '';
  const prevStatus = container.querySelector('[data-filter-table="status"]')?.value || '';

  let projects = getProjects();
  const search = prevSearch.toLowerCase();
  const status = prevStatus;
  if (search) {
    projects = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        (p.address || '').toLowerCase().includes(search)
    );
  }
  if (status) {
    projects = projects.filter((p) => p.status === status);
  }

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar__search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="Поиск проектов..." data-filter-table="search" value="${escapeHtml(prevSearch)}" />
      </div>
      <select data-filter-table="status">
        <option value="">Все статусы</option>
        ${Object.entries(PROJECT_STATUSES).map(([k, v]) =>
          `<option value="${k}" ${status === k ? 'selected' : ''}>${v.label}</option>`
        ).join('')}
      </select>
      <button type="button" class="btn btn--primary btn--sm" data-action="add-project">
        <i class="fa-solid fa-plus"></i> Добавить
      </button>
    </div>
    ${projectsTableHTML(projects, true)}
  `;
}

function projectsTableHTML(projects, withActions) {
  if (!projects.length) {
    return `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>Проекты не найдены</p></div>`;
  }
  const clients = getClients();
  const headers = ['Проект', 'Клиент', 'Статус', 'Бюджет', 'Прогресс', 'Сроки'];
  if (withActions) headers.push('Действия');

  const rows = projects.map((p) => {
    const client = clients.find((c) => c.id === p.clientId);
    const cells = [
      `<strong>${escapeHtml(p.title)}</strong><br><span class="text-sm text-muted">${escapeHtml(p.address || '')}</span>`,
      escapeHtml(client?.name || '—'),
      statusBadge(p.status),
      formatMoney(p.budget),
      `${p.progress || 0}%`,
      `${formatDate(p.startDate)} — ${formatDate(p.endDate)}`,
    ];
    if (withActions) {
      cells.push(`
        <div class="actions">
          <button type="button" class="btn-action btn-action--edit" data-action="edit-project" data-id="${p.id}" title="Редактировать">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button type="button" class="btn-action btn-action--delete" data-action="delete-project" data-id="${p.id}" title="Удалить">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `);
    }
    return cells;
  });

  return tableHTML(headers, rows);
}

function renderManagerClients(container) {
  const prevSearch = container.querySelector('[data-filter-table="search"]')?.value || '';
  let clients = getClients();
  if (prevSearch) {
    const s = prevSearch.toLowerCase();
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.company || '').toLowerCase().includes(s) ||
        (c.phone || '').includes(s)
    );
  }

  const projects = getProjects();

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar__search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="Поиск клиентов..." data-filter-table="search" value="${escapeHtml(prevSearch)}" />
      </div>
      <button type="button" class="btn btn--primary btn--sm" data-action="add-client">
        <i class="fa-solid fa-user-plus"></i> Добавить
      </button>
    </div>
    ${clients.length
      ? tableHTML(
        ['Имя', 'Компания', 'Телефон', 'Email', 'Проектов', 'Действия'],
        clients.map((c) => [
          escapeHtml(c.name),
          escapeHtml(c.company || '—'),
          escapeHtml(c.phone || '—'),
          escapeHtml(c.email || '—'),
          String(projects.filter((p) => p.clientId === c.id).length),
          `<div class="actions">
            <button type="button" class="btn-action btn-action--edit" data-action="edit-client" data-id="${c.id}" title="Редактировать">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn-action btn-action--delete" data-action="delete-client" data-id="${c.id}" title="Удалить">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`,
        ])
      )
      : `<div class="empty-state"><i class="fa-regular fa-user"></i><p>Клиенты не найдены</p></div>`
    }
  `;
}

function renderManagerRequests(container) {
  const prevSearch = container.querySelector('[data-filter-table="search"]')?.value || '';
  const prevStatus = container.querySelector('[data-filter-table="status"]')?.value || '';
  let requests = getRequests();

  if (prevSearch) {
    const s = prevSearch.toLowerCase();
    requests = requests.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(s) ||
        (r.message || '').toLowerCase().includes(s) ||
        (r.phone || '').includes(s)
    );
  }
  if (prevStatus) {
    requests = requests.filter((r) => r.status === prevStatus);
  }

  container.innerHTML = `
    <div class="toolbar">
      <div class="toolbar__search">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" placeholder="Поиск заявок..." data-filter-table="search" value="${escapeHtml(prevSearch)}" />
      </div>
      <select data-filter-table="status">
        <option value="">Все статусы</option>
        <option value="new" ${prevStatus === 'new' ? 'selected' : ''}>Новый</option>
        <option value="progress" ${prevStatus === 'progress' ? 'selected' : ''}>В работе</option>
        <option value="done" ${prevStatus === 'done' ? 'selected' : ''}>Завершён</option>
      </select>
    </div>
    ${requests.length
      ? tableHTML(
        ['Дата', 'Клиент', 'Телефон', 'Услуга', 'Сообщение', 'Статус', 'Действия'],
        requests.map((r) => [
          formatDate(r.createdAt),
          escapeHtml(r.name),
          escapeHtml(r.phone || '—'),
          CATEGORY_LABELS[r.service] || r.service || '—',
          escapeHtml((r.message || '').slice(0, 40)) + ((r.message || '').length > 40 ? '…' : ''),
          statusBadge(r.status === 'progress' ? 'progress' : r.status === 'done' ? 'done' : 'new'),
          `<div class="actions">
            <button type="button" class="btn-action btn-action--view" data-action="view-request" data-id="${r.id}" title="Подробнее">
              <i class="fa-solid fa-eye"></i>
            </button>
            ${r.status !== 'progress' ? `<button type="button" class="btn-action" data-action="set-request-status" data-id="${r.id}" data-status="progress" title="В работу"><i class="fa-solid fa-play"></i></button>` : ''}
            ${r.status !== 'done' ? `<button type="button" class="btn-action" data-action="set-request-status" data-id="${r.id}" data-status="done" title="Закрыть"><i class="fa-solid fa-check"></i></button>` : ''}
            <button type="button" class="btn-action btn-action--delete" data-action="delete-request" data-id="${r.id}" title="Удалить">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`,
        ])
      )
      : `<div class="empty-state"><i class="fa-regular fa-inbox"></i><p>Заявки не найдены</p></div>`
    }
  `;
}

function viewRequest(id) {
  const r = getRequests().find((x) => x.id === id);
  if (!r) return;
  $('#formModalTitle').textContent = 'Заявка';
  $('#formModalBody').innerHTML = `
    <div class="form__group"><label>Клиент</label><p>${escapeHtml(r.name)}</p></div>
    <div class="form__group"><label>Телефон</label><p><a href="tel:${escapeHtml(r.phone)}">${escapeHtml(r.phone)}</a></p></div>
    <div class="form__group"><label>Email</label><p>${escapeHtml(r.email || '—')}</p></div>
    <div class="form__group"><label>Услуга</label><p>${CATEGORY_LABELS[r.service] || r.service || '—'}</p></div>
    <div class="form__group"><label>Сообщение</label><p>${escapeHtml(r.message)}</p></div>
    <div class="form__group"><label>Статус</label><p>${statusBadge(r.status === 'progress' ? 'progress' : r.status === 'done' ? 'done' : 'new')}</p></div>
    <div class="form__group"><label>Дата</label><p>${formatDate(r.createdAt)}</p></div>
    <div class="modal__actions">
      <button type="button" class="btn btn--ghost" data-close-modal>Закрыть</button>
    </div>
  `;
  openModal('formModal');
}

/* ---------- CRUD forms ---------- */
function openProjectForm(id = null) {
  const project = id ? getProjects().find((p) => p.id === id) : null;
  const clients = getClients();
  state.editContext = { type: 'project', id };

  $('#formModalTitle').textContent = project ? 'Редактировать проект' : 'Новый проект';
  $('#formModalBody').innerHTML = `
    <form id="crudProjectForm" novalidate>
      <div class="form__group">
        <label>Название *</label>
        <input type="text" name="title" required value="${escapeHtml(project?.title || '')}" />
      </div>
      <div class="form__group">
        <label>Клиент</label>
        <select name="clientId">
          <option value="">— Не выбран —</option>
          ${clients.map((c) => `
            <option value="${c.id}" ${project?.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form__row">
        <div class="form__group">
          <label>Статус</label>
          <select name="status">
            ${Object.entries(PROJECT_STATUSES).map(([k, v]) =>
              `<option value="${k}" ${project?.status === k ? 'selected' : ''}>${v.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form__group">
          <label>Категория</label>
          <select name="category">
            ${Object.entries(CATEGORY_LABELS).map(([k, v]) =>
              `<option value="${k}" ${project?.category === k ? 'selected' : ''}>${v}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form__row">
        <div class="form__group">
          <label>Бюджет (₽)</label>
          <input type="number" name="budget" min="0" value="${project?.budget ?? ''}" />
        </div>
        <div class="form__group">
          <label>Прогресс (%)</label>
          <input type="number" name="progress" min="0" max="100" value="${project?.progress ?? 0}" />
        </div>
      </div>
      <div class="form__group">
        <label>Адрес</label>
        <input type="text" name="address" value="${escapeHtml(project?.address || '')}" />
      </div>
      <div class="form__row">
        <div class="form__group">
          <label>Начало</label>
          <input type="date" name="startDate" value="${project?.startDate || ''}" />
        </div>
        <div class="form__group">
          <label>Окончание</label>
          <input type="date" name="endDate" value="${project?.endDate || ''}" />
        </div>
      </div>
      <div class="form__group">
        <label>Описание</label>
        <textarea name="description" rows="3">${escapeHtml(project?.description || '')}</textarea>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close-modal>Отмена</button>
        <button type="submit" class="btn btn--primary">${project ? 'Сохранить' : 'Создать'}</button>
      </div>
    </form>
  `;
  openModal('formModal');

  $('#crudProjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const fd = new FormData(f);
    const title = String(fd.get('title') || '').trim();
    if (!title) {
      toast('Укажите название проекта', 'error');
      return;
    }
    const payload = {
      title,
      clientId: String(fd.get('clientId') || '') || null,
      status: String(fd.get('status') || 'new'),
      category: String(fd.get('category') || 'repair'),
      budget: Number(fd.get('budget')) || 0,
      progress: Math.min(100, Math.max(0, Number(fd.get('progress')) || 0)),
      address: String(fd.get('address') || '').trim(),
      startDate: String(fd.get('startDate') || ''),
      endDate: String(fd.get('endDate') || ''),
      description: String(fd.get('description') || '').trim(),
      area: project?.area || 0,
    };

    let list = getProjects();
    if (id) {
      list = list.map((p) => (p.id === id ? { ...p, ...payload } : p));
      toast('Проект обновлён', 'success');
    } else {
      list.unshift({ id: uid('p'), ...payload });
      toast('Проект создан', 'success');
    }
    setProjects(list);
    closeModal('formModal');
    renderDashboard();
  });
}

function openClientForm(id = null) {
  const client = id ? getClients().find((c) => c.id === id) : null;
  state.editContext = { type: 'client', id };

  $('#formModalTitle').textContent = client ? 'Редактировать клиента' : 'Новый клиент';
  $('#formModalBody').innerHTML = `
    <form id="crudClientForm" novalidate>
      <div class="form__group">
        <label>Имя *</label>
        <input type="text" name="name" required value="${escapeHtml(client?.name || '')}" />
      </div>
      <div class="form__group">
        <label>Компания</label>
        <input type="text" name="company" value="${escapeHtml(client?.company || '')}" />
      </div>
      <div class="form__row">
        <div class="form__group">
          <label>Телефон</label>
          <input type="tel" name="phone" value="${escapeHtml(client?.phone || '')}" />
        </div>
        <div class="form__group">
          <label>Email</label>
          <input type="email" name="email" value="${escapeHtml(client?.email || '')}" />
        </div>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close-modal>Отмена</button>
        <button type="submit" class="btn btn--primary">${client ? 'Сохранить' : 'Создать'}</button>
      </div>
    </form>
  `;
  openModal('formModal');

  $('#crudClientForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const fd = new FormData(f);
    const name = String(fd.get('name') || '').trim();
    if (!name) {
      toast('Укажите имя клиента', 'error');
      return;
    }
    const payload = {
      name,
      company: String(fd.get('company') || '').trim(),
      phone: String(fd.get('phone') || '').trim(),
      email: String(fd.get('email') || '').trim(),
    };

    let list = getClients();
    if (id) {
      list = list.map((c) => (c.id === id ? { ...c, ...payload } : c));
      toast('Клиент обновлён', 'success');
    } else {
      list.unshift({
        id: uid('c'),
        ...payload,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      toast('Клиент добавлен', 'success');
    }
    setClients(list);
    closeModal('formModal');
    renderDashboard();
  });
}

/* ---------- Calendar ---------- */
function renderCalendar(container) {
  const year = state.calendarYear;
  const month = state.calendarMonth;
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ];
  const dow = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Mon-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const events = getEvents();

  const eventDates = new Set(
    events
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((e) => new Date(e.date).getDate())
  );

  let daysHTML = dow.map((d) => `<div class="calendar__dow">${d}</div>`).join('');
  for (let i = 0; i < startDow; i++) {
    daysHTML += `<div class="calendar__day empty"></div>`;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day;
    const hasEvent = eventDates.has(day);
    daysHTML += `
      <div class="calendar__day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}">
        ${day}
      </div>`;
  }

  const monthEvents = events
    .filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  container.innerHTML = `
    <div class="calendar">
      <div class="calendar__header">
        <h3>${monthNames[month]} ${year}</h3>
        <div class="calendar__nav">
          <button type="button" class="btn-icon" data-action="cal-prev" aria-label="Предыдущий месяц">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <button type="button" class="btn-icon" data-action="cal-next" aria-label="Следующий месяц">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
      <div class="calendar__grid">${daysHTML}</div>
      <div class="calendar__events">
        <h4>События месяца</h4>
        ${monthEvents.length
          ? monthEvents.map((e) => `
              <div class="cal-event">
                <span class="cal-event__date">${formatDate(e.date)}</span>
                <span>${escapeHtml(e.title)}</span>
              </div>
            `).join('')
          : `<p class="text-muted text-sm">Нет событий в этом месяце</p>`
        }
      </div>
    </div>
  `;
}

/* ---------- Table helper ---------- */
function tableHTML(headers, rows) {
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   INIT
   ============================================================ */
function init() {
  seedDemoData();
  initTheme();
  initNavigation();
  initMobileMenu();
  initModals();
  initAuth();
  initContactForm();
  initDashboardEvents();
  renderPortfolio();

  console.info(
    '%cСтройМастер CRM',
    'color:#f97316;font-weight:bold;font-size:14px',
    '\nДемо: client@demo.ru / client123  |  manager@demo.ru / manager123'
  );
}

document.addEventListener('DOMContentLoaded', init);
