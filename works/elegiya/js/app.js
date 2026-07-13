/**
 * Элегия Beauty Studio — главный UI-контроллер
 */
const App = (() => {
  let serviceFilter = 'all';
  let galleryFilter = 'all';

  /* ========== INIT ========== */
  async function init() {
    Storage.ensureSeed();
    Theme.init();
    bindHeader();
    renderServices();
    renderMasters();
    renderReviews();
    renderGallery();
    renderPromotions();
    renderAbout();
    renderContacts();
    initBookingUI();
    bindCabinet();
    bindModals();
    observeAnimations();
    updateCabinetBadge();
    await initTelegramLink();

    // Deep link: #booking, #services, etc.
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }

  async function initTelegramLink() {
    if (typeof TelegramAPI === 'undefined') return;
    const { online, config } = await TelegramAPI.ping();
    if (config.botUrl) {
      ELEGIA.brand.telegramBot = config.botUrl;
      document.querySelectorAll('[data-telegram-link]').forEach((a) => {
        a.href = config.botUrl;
      });
    }
    const badge = document.getElementById('bot-status-badge');
    if (badge) {
      if (online && config.botReady) {
        badge.textContent = 'Telegram-бот онлайн';
        badge.className = 'bot-status bot-status--ok';
      } else if (online) {
        badge.textContent = 'API онлайн · укажите BOT_TOKEN';
        badge.className = 'bot-status bot-status--warn';
      } else {
        badge.textContent = 'Бот офлайн · запустите bot/start.bat';
        badge.className = 'bot-status bot-status--off';
      }
    }
  }

  /* ========== HEADER / NAV ========== */
  function bindHeader() {
    const header = document.getElementById('site-header');
    const burger = document.getElementById('burger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileClose = document.getElementById('mobile-nav-close');

    window.addEventListener('scroll', () => {
      header?.classList.toggle('is-scrolled', window.scrollY > 20);
      highlightNav();
    });

    burger?.addEventListener('click', () => {
      mobileNav?.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });

    const closeMobile = () => {
      mobileNav?.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    mobileClose?.addEventListener('click', closeMobile);
    mobileNav?.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', closeMobile);
    });

    document.querySelectorAll('[data-scroll-to]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-scroll-to');
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          closeMobile();
        }
      });
    });

    document.getElementById('open-cabinet-btn')?.addEventListener('click', () => openModal('cabinet-modal'));
    document.getElementById('open-cabinet-mobile')?.addEventListener('click', () => {
      closeMobile();
      openModal('cabinet-modal');
    });
  }

  function highlightNav() {
    const sections = ['hero', 'services', 'masters', 'booking', 'about', 'gallery', 'reviews', 'promos', 'contacts'];
    let current = 'hero';
    const offset = 120;
    for (const id of sections) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= offset) current = id;
    }
    document.querySelectorAll('.nav-link[href^="#"]').forEach((a) => {
      const href = a.getAttribute('href')?.slice(1);
      a.classList.toggle('is-active', href === current);
    });
  }

  /* ========== SERVICES ========== */
  function renderServices() {
    const chips = document.getElementById('service-filters');
    const grid = document.getElementById('services-grid');
    if (!chips || !grid) return;

    chips.innerHTML =
      `<button type="button" class="chip ${serviceFilter === 'all' ? 'is-active' : ''}" data-cat="all">Все</button>` +
      ELEGIA.categories
        .map(
          (c) =>
            `<button type="button" class="chip ${serviceFilter === c.id ? 'is-active' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>`
        )
        .join('');

    chips.querySelectorAll('.chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        serviceFilter = btn.dataset.cat;
        renderServices();
      });
    });

    const list =
      serviceFilter === 'all'
        ? ELEGIA.services
        : ELEGIA.services.filter((s) => s.category === serviceFilter);

    grid.innerHTML = list
      .map(
        (s) => `
      <article class="card fade-up group">
        <div class="relative overflow-hidden">
          <img src="${s.image}" alt="${escapeHtml(s.name)}" class="service-img transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </div>
        <div class="p-5">
          <div class="flex items-start justify-between gap-2 mb-2">
            <h3 class="font-display text-xl m-0">${escapeHtml(s.name)}</h3>
          </div>
          <p class="text-sm mb-4" style="color: var(--text-secondary)">${escapeHtml(s.description)}</p>
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div class="price-tag">${formatPrice(s.price)}</div>
              <div class="duration-badge mt-1">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ${formatDuration(s.duration)}
              </div>
            </div>
            <button type="button" class="btn btn-outline text-sm py-2 px-4" data-book-service="${s.id}">Записаться</button>
          </div>
        </div>
      </article>`
      )
      .join('');

    grid.querySelectorAll('[data-book-service]').forEach((btn) => {
      btn.addEventListener('click', () => startBookingWithService(btn.dataset.bookService));
    });

    observeAnimations();
  }

  /* ========== MASTERS ========== */
  function renderMasters() {
    const grid = document.getElementById('masters-grid');
    if (!grid) return;

    grid.innerHTML = ELEGIA.masters
      .map(
        (m) => `
      <article class="card fade-up">
        <img src="${m.photo}" alt="${escapeHtml(m.name)}" class="master-photo" loading="lazy" />
        <div class="p-5">
          <h3 class="font-display text-xl m-0 mb-1">${escapeHtml(m.name)}</h3>
          <p class="text-sm m-0 mb-2" style="color: var(--gold-deep)">${escapeHtml(m.role)}</p>
          <div class="flex items-center gap-2 mb-3">
            <span class="rating-stars">${starsHtml(m.rating)}</span>
            <span class="text-sm font-semibold">${m.rating}</span>
            <span class="text-xs" style="color: var(--text-muted)">(${m.reviewsCount})</span>
          </div>
          <p class="text-sm mb-4" style="color: var(--text-secondary)">${escapeHtml(m.bio)}</p>
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-xs" style="color: var(--text-muted)">Опыт: ${escapeHtml(m.experience)}</span>
            <div class="flex gap-2">
              <button type="button" class="btn btn-ghost text-sm" data-portfolio="${m.id}">Портфолио</button>
              <button type="button" class="btn btn-outline text-sm py-2 px-3" data-book-master="${m.id}">Запись</button>
            </div>
          </div>
        </div>
      </article>`
      )
      .join('');

    grid.querySelectorAll('[data-book-master]').forEach((btn) => {
      btn.addEventListener('click', () => startBookingWithMaster(btn.dataset.bookMaster));
    });

    grid.querySelectorAll('[data-portfolio]').forEach((btn) => {
      btn.addEventListener('click', () => openPortfolio(btn.dataset.portfolio));
    });
  }

  function openPortfolio(masterId) {
    const master = ELEGIA.masters.find((m) => m.id === masterId);
    if (!master) return;
    const body = document.getElementById('portfolio-modal-body');
    const title = document.getElementById('portfolio-modal-title');
    if (title) title.textContent = `Портфолио — ${master.name}`;
    if (body) {
      body.innerHTML = `
        <div class="flex items-center gap-4 mb-5">
          <img src="${master.photo}" alt="" class="w-16 h-16 rounded-full object-cover" />
          <div>
            <div class="font-display text-xl">${escapeHtml(master.name)}</div>
            <div class="text-sm" style="color: var(--text-secondary)">${escapeHtml(master.role)}</div>
            <div class="rating-stars text-sm mt-1">${starsHtml(master.rating)} ${master.rating}</div>
          </div>
        </div>
        <p class="text-sm mb-4" style="color: var(--text-secondary)">${escapeHtml(master.bio)}</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          ${master.portfolio
            .map(
              (src) =>
                `<button type="button" class="gallery-item" data-lightbox="${src}"><img src="${src}" alt="Работа мастера" loading="lazy" /></button>`
            )
            .join('')}
        </div>
        <div class="mt-5">
          <button type="button" class="btn btn-primary w-full" data-book-master-modal="${master.id}">Записаться к мастеру</button>
        </div>`;
      body.querySelectorAll('[data-lightbox]').forEach((el) => {
        el.addEventListener('click', () => openLightbox(el.dataset.lightbox));
      });
      body.querySelector('[data-book-master-modal]')?.addEventListener('click', () => {
        closeModal('portfolio-modal');
        startBookingWithMaster(master.id);
      });
    }
    openModal('portfolio-modal');
  }

  /* ========== REVIEWS ========== */
  function renderReviews() {
    const grid = document.getElementById('reviews-grid');
    if (!grid) return;
    grid.innerHTML = ELEGIA.reviews
      .map(
        (r) => `
      <article class="card card-static review-card p-5 fade-up">
        <div class="flex items-center gap-3 mb-3">
          <img src="${r.photo}" alt="" class="review-avatar" loading="lazy" />
          <div>
            <div class="font-semibold text-sm">${escapeHtml(r.name)}</div>
            <div class="rating-stars text-sm">${starsHtml(r.rating)}</div>
          </div>
        </div>
        <p class="text-sm m-0 mb-3" style="color: var(--text-secondary)">«${escapeHtml(r.text)}»</p>
        <div class="flex justify-between text-xs" style="color: var(--text-muted)">
          <span>${escapeHtml(r.service)}</span>
          <span>${formatDateRu(r.date)}</span>
        </div>
      </article>`
      )
      .join('');
  }

  /* ========== GALLERY ========== */
  function renderGallery() {
    const chips = document.getElementById('gallery-filters');
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const cats = [
      { id: 'all', name: 'Все' },
      { id: 'salon', name: 'Салон' },
      { id: 'hair', name: 'Волосы' },
      { id: 'nails', name: 'Ногти' },
      { id: 'makeup', name: 'Макияж' },
      { id: 'care', name: 'Уход' },
    ];

    if (chips) {
      chips.innerHTML = cats
        .map(
          (c) =>
            `<button type="button" class="chip ${galleryFilter === c.id ? 'is-active' : ''}" data-gcat="${c.id}">${c.name}</button>`
        )
        .join('');
      chips.querySelectorAll('.chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          galleryFilter = btn.dataset.gcat;
          renderGallery();
        });
      });
    }

    const list =
      galleryFilter === 'all'
        ? ELEGIA.gallery
        : ELEGIA.gallery.filter((g) => g.category === galleryFilter);

    grid.innerHTML = list
      .map(
        (g) => `
      <button type="button" class="gallery-item fade-up" data-lightbox="${g.src}" aria-label="${escapeHtml(g.alt)}">
        <img src="${g.src}" alt="${escapeHtml(g.alt)}" loading="lazy" />
      </button>`
      )
      .join('');

    grid.querySelectorAll('[data-lightbox]').forEach((el) => {
      el.addEventListener('click', () => openLightbox(el.dataset.lightbox));
    });
    observeAnimations();
  }

  /* ========== PROMOS ========== */
  function renderPromotions() {
    const grid = document.getElementById('promos-grid');
    if (!grid) return;
    grid.innerHTML = ELEGIA.promotions
      .map(
        (p) => `
      <article class="card fade-up overflow-hidden">
        <div class="relative">
          <img src="${p.image}" alt="" class="w-full h-44 object-cover" loading="lazy" />
          <span class="promo-badge absolute top-3 left-3">${escapeHtml(p.badge)}</span>
        </div>
        <div class="p-5">
          <h3 class="font-display text-xl m-0 mb-2">${escapeHtml(p.title)}</h3>
          <p class="text-sm mb-4" style="color: var(--text-secondary)">${escapeHtml(p.description)}</p>
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <code class="text-xs px-2 py-1 rounded" style="background: var(--bg-soft); color: var(--gold-deep)">${escapeHtml(p.code)}</code>
            <button type="button" class="btn btn-outline text-sm py-2 px-3" data-promo-book="${p.code}">Записаться</button>
          </div>
        </div>
      </article>`
      )
      .join('');

    grid.querySelectorAll('[data-promo-book]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Booking.reset();
        Booking.setFormField('promoCode', btn.dataset.promoBook);
        scrollToBooking();
        renderBookingStep();
        toast(`Промокод ${btn.dataset.promoBook} будет применён на шаге оформления`);
      });
    });
  }

  /* ========== ABOUT ========== */
  function renderAbout() {
    const a = ELEGIA.about;
    const lead = document.getElementById('about-lead');
    const text = document.getElementById('about-text');
    const stats = document.getElementById('about-stats');
    const img = document.getElementById('about-image');
    if (lead) lead.textContent = a.lead;
    if (text) {
      text.innerHTML = a.text.map((p) => `<p class="mb-3" style="color: var(--text-secondary)">${escapeHtml(p)}</p>`).join('');
    }
    if (stats) {
      stats.innerHTML = a.stats
        .map(
          (s) => `
        <div class="text-center p-4 rounded-2xl" style="background: var(--bg-soft)">
          <div class="font-display text-3xl text-gold">${escapeHtml(s.value)}</div>
          <div class="text-xs mt-1" style="color: var(--text-muted)">${escapeHtml(s.label)}</div>
        </div>`
        )
        .join('');
    }
    if (img) {
      img.src = a.heroImage;
      img.alt = 'Интерьер салона Элегия';
    }
  }

  /* ========== CONTACTS ========== */
  function renderContacts() {
    const b = ELEGIA.brand;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set('contact-address', b.address);
    set('contact-phone', b.phone);
    set('contact-email', b.email);
    set('contact-hours', b.hours);

    const phoneLink = document.getElementById('contact-phone-link');
    if (phoneLink) phoneLink.href = `tel:${b.phoneRaw}`;
    const emailLink = document.getElementById('contact-email-link');
    if (emailLink) emailLink.href = `mailto:${b.email}`;
    const map = document.getElementById('map-frame');
    if (map) map.src = b.mapEmbed;

    document.querySelectorAll('[data-telegram-link]').forEach((a) => {
      a.href = b.telegramBot;
    });
  }

  /* ========== BOOKING UI ========== */
  function initBookingUI() {
    document.getElementById('booking-next')?.addEventListener('click', onBookingNext);
    document.getElementById('booking-prev')?.addEventListener('click', onBookingPrev);
    document.getElementById('booking-restart')?.addEventListener('click', () => {
      Booking.reset();
      renderBookingStep();
    });

    // Hero / floating CTA
    document.querySelectorAll('[data-open-booking]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToBooking();
      });
    });

    renderBookingStep();
  }

  function scrollToBooking() {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  }

  function startBookingWithService(serviceId) {
    Booking.reset();
    Booking.selectService(serviceId);
    Booking.goTo('master');
    scrollToBooking();
    renderBookingStep();
  }

  function startBookingWithMaster(masterId) {
    Booking.reset();
    const master = ELEGIA.masters.find((m) => m.id === masterId);
    if (master && master.serviceIds.length === 1) {
      Booking.selectService(master.serviceIds[0]);
    }
    Booking.selectMaster(masterId);
    if (Booking.getState().serviceId) {
      Booking.goTo('datetime');
    } else {
      Booking.goTo('service');
    }
    scrollToBooking();
    renderBookingStep();
  }

  async function onBookingNext() {
    const step = Booking.getStep();
    if (step === 'form') {
      const nextBtn = document.getElementById('booking-next');
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Отправка…';
      }
      try {
        const result = await Booking.confirm();
        if (result?.error) {
          toast(result.error, 'error');
          if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Подтвердить запись';
          }
          return;
        }
        if (result?.booking) {
          const tg = result.telegram;
          if (tg?.ok && tg.telegram?.sent) {
            toast('Запись создана и отправлена в Telegram!');
          } else if (tg?.offline) {
            toast('Запись сохранена. Запустите бота (bot/start.bat)', 'error');
          } else {
            toast('Запись создана. ' + (tg?.message || ''));
          }
          updateCabinetBadge();
          renderBookingStep();
          return;
        }
        toast('Заполните имя и телефон', 'error');
      } catch (e) {
        toast('Ошибка: ' + (e.message || 'неизвестно'), 'error');
      } finally {
        if (nextBtn && Booking.getStep() === 'form') {
          nextBtn.disabled = false;
          nextBtn.textContent = 'Подтвердить запись';
        }
      }
      return;
    }
    if (Booking.next()) {
      renderBookingStep();
    } else {
      toast('Выберите значение, чтобы продолжить', 'error');
    }
  }

  function onBookingPrev() {
    if (Booking.getStep() === 'success') {
      Booking.reset();
      renderBookingStep();
      return;
    }
    Booking.prev();
    renderBookingStep();
  }

  function renderBookingStep() {
    const step = Booking.getStep();
    const body = document.getElementById('booking-body');
    const nextBtn = document.getElementById('booking-next');
    const prevBtn = document.getElementById('booking-prev');
    const restartBtn = document.getElementById('booking-restart');
    if (!body) return;

    // Steps indicator
    document.querySelectorAll('[data-step-id]').forEach((el) => {
      const id = el.dataset.stepId;
      const idx = Booking.STEPS.indexOf(id);
      const current = Booking.getStepIndex();
      el.classList.toggle('is-active', id === step);
      el.classList.toggle('is-done', idx < current && step !== 'success');
      if (step === 'success' && id !== 'success') el.classList.add('is-done');
    });

    if (step === 'success') {
      prevBtn && (prevBtn.style.display = 'none');
      nextBtn && (nextBtn.style.display = 'none');
      restartBtn && (restartBtn.style.display = 'inline-flex');
    } else {
      prevBtn && (prevBtn.style.display = Booking.getStepIndex() === 0 ? 'none' : 'inline-flex');
      nextBtn && (nextBtn.style.display = 'inline-flex');
      restartBtn && (restartBtn.style.display = 'none');
      if (nextBtn) {
        nextBtn.textContent = step === 'form' ? 'Подтвердить запись' : 'Далее';
        nextBtn.disabled = !Booking.canGoNext() && step !== 'form';
      }
    }

    if (step === 'service') renderStepService(body);
    else if (step === 'master') renderStepMaster(body);
    else if (step === 'datetime') renderStepDatetime(body);
    else if (step === 'form') renderStepForm(body);
    else if (step === 'success') renderStepSuccess(body);

    updateBookingSummarySidebar();
  }

  function renderStepService(body) {
    const selected = Booking.getState().serviceId;
    body.innerHTML = `
      <h3 class="font-display text-2xl m-0 mb-1">Выберите услугу</h3>
      <p class="text-sm mb-5" style="color: var(--text-secondary)">Стоимость и длительность указаны для одной процедуры</p>
      <div class="grid gap-3 sm:grid-cols-2">
        ${ELEGIA.services
          .map(
            (s) => `
          <button type="button" class="pick-card ${selected === s.id ? 'is-selected' : ''}" data-pick-service="${s.id}">
            <div class="flex gap-3">
              <img src="${s.image}" alt="" class="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div class="min-w-0 text-left">
                <div class="font-semibold text-sm">${escapeHtml(s.name)}</div>
                <div class="text-xs mt-0.5" style="color: var(--text-muted)">${formatDuration(s.duration)}</div>
                <div class="price-tag text-lg mt-1">${formatPrice(s.price)}</div>
              </div>
            </div>
          </button>`
          )
          .join('')}
      </div>`;

    body.querySelectorAll('[data-pick-service]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Booking.selectService(btn.dataset.pickService);
        renderBookingStep();
      });
    });
  }

  function renderStepMaster(body) {
    const masters = Booking.getMastersForService();
    const selected = Booking.getState().masterId;
    const service = Booking.getService();

    body.innerHTML = `
      <h3 class="font-display text-2xl m-0 mb-1">Выберите мастера</h3>
      <p class="text-sm mb-5" style="color: var(--text-secondary)">
        ${service ? `Для услуги «${escapeHtml(service.name)}»` : 'Сначала можно выбрать мастера'}
      </p>
      ${
        masters.length === 0
          ? `<p class="text-sm" style="color: var(--text-muted)">Нет мастеров для выбранной услуги</p>`
          : `<div class="grid gap-3 sm:grid-cols-2">
        ${masters
          .map(
            (m) => `
          <button type="button" class="pick-card ${selected === m.id ? 'is-selected' : ''}" data-pick-master="${m.id}">
            <div class="flex gap-3 items-center">
              <img src="${m.photo}" alt="" class="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              <div class="text-left min-w-0">
                <div class="font-semibold text-sm">${escapeHtml(m.name)}</div>
                <div class="text-xs" style="color: var(--gold-deep)">${escapeHtml(m.role)}</div>
                <div class="rating-stars text-xs mt-1">${starsHtml(m.rating)} <span class="font-semibold" style="color: var(--text)">${m.rating}</span></div>
              </div>
            </div>
          </button>`
          )
          .join('')}
      </div>`
      }`;

    body.querySelectorAll('[data-pick-master]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Booking.selectMaster(btn.dataset.pickMaster);
        renderBookingStep();
      });
    });
  }

  function renderStepDatetime(body) {
    const st = Booking.getState();
    body.innerHTML = `
      <h3 class="font-display text-2xl m-0 mb-1">Дата и время</h3>
      <p class="text-sm mb-5" style="color: var(--text-secondary)">Выберите удобный день и свободный слот</p>
      <div class="grid lg:grid-cols-2 gap-6">
        <div>
          <div class="text-sm font-semibold mb-3">Календарь</div>
          <div id="booking-calendar" class="calendar"></div>
        </div>
        <div>
          <div class="text-sm font-semibold mb-3">
            ${st.date ? `Слоты на ${formatDateRu(st.date)}` : 'Сначала выберите дату'}
          </div>
          <div id="booking-slots" class="slots-grid"></div>
          <div id="slots-hint" class="text-xs mt-3" style="color: var(--text-muted)"></div>
        </div>
      </div>`;

    Calendar.init('#booking-calendar', {
      selected: st.date,
      onSelect: (iso) => {
        Booking.selectDate(iso);
        renderSlots();
        updateNextBtn();
        updateBookingSummarySidebar();
      },
    });

    renderSlots();
  }

  function renderSlots() {
    const container = document.getElementById('booking-slots');
    const hint = document.getElementById('slots-hint');
    const st = Booking.getState();
    if (!container) return;

    if (!st.date || !st.masterId || !st.serviceId) {
      container.innerHTML = '';
      if (hint) hint.textContent = 'Выберите дату после услуги и мастера';
      return;
    }

    const slots = Booking.getAvailableSlots(st.masterId, st.date, st.serviceId);
    const free = slots.filter((s) => s.available);

    container.innerHTML = slots
      .map(
        (s) => `
      <button type="button"
        class="slot-btn ${st.time === s.time ? 'is-selected' : ''} ${!s.available ? 'is-busy' : ''}"
        data-time="${s.time}"
        ${s.available ? '' : 'disabled'}>
        ${s.time}
      </button>`
      )
      .join('');

    if (hint) {
      hint.textContent =
        free.length === 0
          ? 'На этот день нет свободных слотов. Выберите другую дату.'
          : `Доступно ${free.length} из ${slots.length} слотов. Длительность услуги учитывается автоматически.`;
    }

    container.querySelectorAll('.slot-btn:not(:disabled)').forEach((btn) => {
      btn.addEventListener('click', () => {
        Booking.selectTime(btn.dataset.time);
        container.querySelectorAll('.slot-btn').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        updateNextBtn();
        updateBookingSummarySidebar();
      });
    });
  }

  function updateNextBtn() {
    const nextBtn = document.getElementById('booking-next');
    if (nextBtn && Booking.getStep() !== 'success') {
      nextBtn.disabled = !Booking.canGoNext() && Booking.getStep() !== 'form';
    }
  }

  function renderStepForm(body) {
    const st = Booking.getState();
    const service = Booking.getService();
    const client = Storage.getClient();
    const name = st.clientName || client?.name || '';
    const phone = st.phone || client?.phone || '';
    const promo = st.promoCode || '';
    const promoResult = service ? Booking.applyPromo(service.price, promo) : null;

    body.innerHTML = `
      <h3 class="font-display text-2xl m-0 mb-1">Данные для записи</h3>
      <p class="text-sm mb-5" style="color: var(--text-secondary)">Мы отправим подтверждение в Telegram-бот</p>
      <div class="grid lg:grid-cols-2 gap-6">
        <div>
          <div class="form-group">
            <label class="form-label" for="bk-name">Имя *</label>
            <input id="bk-name" class="form-input" type="text" placeholder="Анна" value="${escapeAttr(name)}" autocomplete="name" />
          </div>
          <div class="form-group">
            <label class="form-label" for="bk-phone">Телефон *</label>
            <input id="bk-phone" class="form-input" type="tel" placeholder="+7 (999) 123-45-67" value="${escapeAttr(phone)}" autocomplete="tel" />
          </div>
          <div class="form-group">
            <label class="form-label" for="bk-comment">Комментарий</label>
            <textarea id="bk-comment" class="form-input" placeholder="Пожелания, аллергии, удобное время связи...">${escapeHtml(st.comment)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="bk-promo">Промокод</label>
            <input id="bk-promo" class="form-input" type="text" placeholder="FIRST15" value="${escapeAttr(promo)}" />
            <div id="promo-feedback" class="text-xs mt-1.5" style="color: var(--text-muted)"></div>
          </div>
        </div>
        <div>
          <div class="summary-box">
            <div class="font-display text-lg mb-3">Итого</div>
            <dl>
              <div class="summary-row"><dt>Услуга</dt><dd>${escapeHtml(service?.name || '—')}</dd></div>
              <div class="summary-row"><dt>Мастер</dt><dd>${escapeHtml(Booking.getMaster()?.name || '—')}</dd></div>
              <div class="summary-row"><dt>Дата</dt><dd>${st.date ? formatDateRu(st.date) : '—'}</dd></div>
              <div class="summary-row"><dt>Время</dt><dd>${st.time || '—'} · ${service ? formatDuration(service.duration) : ''}</dd></div>
              <div class="summary-row"><dt>Стоимость</dt><dd id="form-price">${
                promoResult
                  ? promoResult.discount
                    ? `<span class="line-through opacity-50 mr-1">${formatPrice(service.price)}</span> ${formatPrice(promoResult.price)}`
                    : formatPrice(service.price)
                  : '—'
              }</dd></div>
            </dl>
            <p class="text-xs mt-4 m-0" style="color: var(--text-muted)">
              Нажимая «Подтвердить запись», вы соглашаетесь с условиями обработки персональных данных.
            </p>
          </div>
        </div>
      </div>`;

    const bind = (id, field, transform) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => {
        let v = el.value;
        if (transform) v = transform(v, el);
        Booking.setFormField(field, v);
        updateNextBtn();
        if (field === 'promoCode') updatePromoFeedback();
      });
    };

    bind('bk-name', 'clientName');
    bind('bk-phone', 'phone', (v, el) => {
      const formatted = formatPhoneInput(v);
      el.value = formatted;
      return formatted;
    });
    bind('bk-comment', 'comment');
    bind('bk-promo', 'promoCode');

    // init promo feedback
    if (promo) updatePromoFeedback();
    updateNextBtn();
  }

  function updatePromoFeedback() {
    const st = Booking.getState();
    const service = Booking.getService();
    const fb = document.getElementById('promo-feedback');
    const priceEl = document.getElementById('form-price');
    if (!service || !fb) return;
    const result = Booking.applyPromo(service.price, st.promoCode);
    if (!st.promoCode.trim()) {
      fb.textContent = '';
      if (priceEl) priceEl.textContent = formatPrice(service.price);
      return;
    }
    if (result.error) {
      fb.textContent = result.error;
      fb.style.color = 'var(--danger)';
      if (priceEl) priceEl.textContent = formatPrice(service.price);
    } else if (result.promo) {
      fb.textContent = `Скидка ${result.promo.discount}% (−${formatPrice(result.discount)})`;
      fb.style.color = 'var(--success)';
      if (priceEl) {
        priceEl.innerHTML = `<span class="line-through opacity-50 mr-1">${formatPrice(service.price)}</span> ${formatPrice(result.price)}`;
      }
    }
  }

  function renderStepSuccess(body) {
    const st = Booking.getState();
    const bookings = Storage.getBookings();
    const booking = bookings.find((b) => b.id === st.bookingId);
    const b = ELEGIA.brand;
    const tgCfg =
      typeof TelegramAPI !== 'undefined' ? TelegramAPI.getConfig() : {};
    const botUrl = tgCfg.botUrl || b.telegramBot;
    const linkUrl =
      typeof TelegramAPI !== 'undefined' && booking?.phone
        ? TelegramAPI.linkPhoneUrl(booking.phone)
        : botUrl;

    const sent = booking?.telegramSent;
    const offline = st.lastTelegramResult?.offline;
    const detailMsg =
      booking?.telegramMessage ||
      st.lastTelegramResult?.message ||
      '';

    let noticeHtml;
    if (sent) {
      noticeHtml = `
        <div class="telegram-notice">
          <strong>Запись отправлена в Telegram-бот.</strong><br />
          Администратор получил уведомление.
          ${
            st.lastTelegramResult?.telegram?.clientNotified
              ? ' Подтверждение также отправлено вам в Telegram.'
              : ' Чтобы получать подтверждения лично — откройте бота и привяжите телефон (/link).'
          }
        </div>`;
    } else if (offline) {
      noticeHtml = `
        <div class="telegram-notice telegram-notice--warn">
          <strong>Запись сохранена на сайте.</strong><br />
          Сервер бота не запущен. Запустите <code>bot/start.bat</code> и настройте токен.
        </div>`;
    } else {
      noticeHtml = `
        <div class="telegram-notice telegram-notice--warn">
          <strong>Запись создана.</strong><br />
          ${escapeHtml(detailMsg || 'Проверьте настройки бота (BOT_TOKEN, ADMIN_CHAT_ID).')}
        </div>`;
    }

    body.innerHTML = `
      <div class="success-panel">
        <div class="success-icon">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75l6 6 9-13.5"/></svg>
        </div>
        <h3 class="font-display text-3xl m-0 mb-2">Вы записаны!</h3>
        <p class="text-sm mb-0" style="color: var(--text-secondary)">Спасибо, ${escapeHtml(booking?.clientName || '')}. Ждём вас в ${escapeHtml(b.name)}.</p>

        ${noticeHtml}

        ${
          booking
            ? `<div class="summary-box text-left max-w-md mx-auto mb-5">
          <dl>
            <div class="summary-row"><dt>Услуга</dt><dd>${escapeHtml(booking.serviceName)}</dd></div>
            <div class="summary-row"><dt>Мастер</dt><dd>${escapeHtml(booking.masterName)}</dd></div>
            <div class="summary-row"><dt>Когда</dt><dd>${formatDateRu(booking.date)}, ${booking.time}</dd></div>
            <div class="summary-row"><dt>Сумма</dt><dd>${formatPrice(booking.price)}</dd></div>
            <div class="summary-row"><dt>Номер записи</dt><dd class="text-xs">${escapeHtml(booking.id)}</dd></div>
          </dl>
        </div>`
            : ''
        }

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="${escapeAttr(linkUrl)}" target="_blank" rel="noopener" class="btn btn-telegram" data-telegram-link>
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            ${sent && st.lastTelegramResult?.telegram?.clientNotified ? 'Открыть Telegram-бот' : 'Привязать телефон в боте'}
          </a>
          <button type="button" class="btn btn-outline" id="success-cabinet">Личный кабинет</button>
        </div>
      </div>`;

    document.getElementById('success-cabinet')?.addEventListener('click', () => {
      openModal('cabinet-modal');
      renderCabinet();
    });
  }

  function updateBookingSummarySidebar() {
    const el = document.getElementById('booking-mini-summary');
    if (!el) return;
    const st = Booking.getState();
    const service = Booking.getService();
    const master = Booking.getMaster();
    if (!service && !master && !st.date) {
      el.innerHTML = `<p class="text-sm m-0" style="color: var(--text-muted)">Выберите услугу, чтобы начать запись</p>`;
      return;
    }
    el.innerHTML = `
      <dl>
        ${service ? `<div class="summary-row"><dt>Услуга</dt><dd>${escapeHtml(service.name)}</dd></div>` : ''}
        ${master ? `<div class="summary-row"><dt>Мастер</dt><dd>${escapeHtml(master.name)}</dd></div>` : ''}
        ${st.date ? `<div class="summary-row"><dt>Дата</dt><dd>${formatDateRu(st.date)}</dd></div>` : ''}
        ${st.time ? `<div class="summary-row"><dt>Время</dt><dd>${st.time}</dd></div>` : ''}
        ${service ? `<div class="summary-row"><dt>Цена</dt><dd>${formatPrice(service.price)}</dd></div>` : ''}
      </dl>`;
  }

  /* ========== CABINET ========== */
  function bindCabinet() {
    document.getElementById('cabinet-login-btn')?.addEventListener('click', () => {
      const phone = document.getElementById('cabinet-phone')?.value || '';
      const name = document.getElementById('cabinet-name')?.value || '';
      if (phone.replace(/\D/g, '').length < 10) {
        toast('Введите корректный телефон', 'error');
        return;
      }
      Storage.setClient({ phone, name: name || 'Гость' });
      renderCabinet();
      updateCabinetBadge();
    });

    document.getElementById('cabinet-logout')?.addEventListener('click', () => {
      Storage.clearClient();
      renderCabinet();
      updateCabinetBadge();
    });

    document.getElementById('cabinet-phone')?.addEventListener('input', (e) => {
      e.target.value = formatPhoneInput(e.target.value);
    });
  }

  function renderCabinet() {
    const client = Storage.getClient();
    const loginView = document.getElementById('cabinet-login');
    const dashView = document.getElementById('cabinet-dashboard');
    if (!loginView || !dashView) return;

    if (!client) {
      loginView.classList.remove('hidden');
      dashView.classList.add('hidden');
      return;
    }

    loginView.classList.add('hidden');
    dashView.classList.remove('hidden');

    const nameEl = document.getElementById('cabinet-user-name');
    const phoneEl = document.getElementById('cabinet-user-phone');
    if (nameEl) nameEl.textContent = client.name || 'Клиент';
    if (phoneEl) phoneEl.textContent = client.phone;

    const bookings = Storage.getBookingsByPhone(client.phone);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = bookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      const [y, m, d] = b.date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt >= now;
    });
    const past = bookings.filter((b) => {
      if (b.status === 'cancelled') return true;
      const [y, m, d] = b.date.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt < now;
    });

    const upEl = document.getElementById('cabinet-upcoming');
    const histEl = document.getElementById('cabinet-history');

    if (upEl) {
      upEl.innerHTML =
        upcoming.length === 0
          ? `<p class="text-sm" style="color: var(--text-muted)">Нет предстоящих визитов. <button type="button" class="underline" id="cab-go-book">Записаться</button></p>`
          : upcoming.map((b) => bookingCardHtml(b, true)).join('');
      document.getElementById('cab-go-book')?.addEventListener('click', () => {
        closeModal('cabinet-modal');
        scrollToBooking();
      });
      upEl.querySelectorAll('[data-cancel]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Отменить запись?')) return;
          const id = btn.dataset.cancel;
          Storage.cancelBooking(id);
          if (typeof TelegramAPI !== 'undefined') {
            await TelegramAPI.cancelBooking(id);
          }
          toast('Запись отменена');
          renderCabinet();
          updateCabinetBadge();
        });
      });
    }

    if (histEl) {
      histEl.innerHTML =
        past.length === 0
          ? `<p class="text-sm" style="color: var(--text-muted)">История пока пуста</p>`
          : past.map((b) => bookingCardHtml(b, false)).join('');
    }
  }

  function bookingCardHtml(b, canCancel) {
    const isCancelled = b.status === 'cancelled';
    let statusClass = 'status-confirmed';
    let statusText = 'Подтверждена';
    if (isCancelled) {
      statusClass = 'status-cancelled';
      statusText = 'Отменена';
    } else if (!canCancel) {
      statusClass = 'status-past';
      statusText = 'Завершена';
    }

    return `
      <div class="booking-history-item">
        <div class="flex justify-between gap-2 flex-wrap mb-2">
          <div class="font-semibold text-sm">${escapeHtml(b.serviceName)}</div>
          <span class="status-pill ${statusClass}">${statusText}</span>
        </div>
        <div class="text-xs space-y-1" style="color: var(--text-secondary)">
          <div>${formatDateRu(b.date)} · ${b.time}</div>
          <div>Мастер: ${escapeHtml(b.masterName)}</div>
          <div>${formatPrice(b.price)}${b.telegramSent ? ' · отправлено в Telegram' : ''}</div>
        </div>
        ${
          canCancel && !isCancelled
            ? `<button type="button" class="btn btn-ghost text-xs mt-2 px-0" style="color: var(--danger)" data-cancel="${b.id}">Отменить</button>`
            : ''
        }
      </div>`;
  }

  function updateCabinetBadge() {
    const client = Storage.getClient();
    const badge = document.getElementById('cabinet-badge');
    if (!badge) return;
    if (!client) {
      badge.classList.add('hidden');
      return;
    }
    const bookings = Storage.getBookingsByPhone(client.phone);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const count = bookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      const [y, m, d] = b.date.split('-').map(Number);
      return new Date(y, m - 1, d) >= now;
    }).length;
    if (count > 0) {
      badge.textContent = String(count);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  /* ========== MODALS / LIGHTBOX ========== */
  function bindModals() {
    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.modal-backdrop')?.id;
        if (id) closeModal(id);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal(backdrop.id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.is-open').forEach((m) => closeModal(m.id));
        closeLightbox();
      }
    });

    document.getElementById('lightbox')?.addEventListener('click', closeLightbox);
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (id === 'cabinet-modal') renderCabinet();
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-open');
    if (!document.querySelector('.modal-backdrop.is-open')) {
      document.body.style.overflow = '';
    }
  }

  function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img) return;
    img.src = src;
    lb.classList.add('is-open');
  }

  function closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('is-open');
  }

  /* ========== TOAST ========== */
  function toast(message, type = 'ok') {
    const box = document.getElementById('toast-container');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast';
    if (type === 'error') el.style.borderLeftColor = 'var(--danger)';
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  /* ========== ANIMATIONS ========== */
  function observeAnimations() {
    const els = document.querySelectorAll('.fade-up:not(.is-visible)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ========== UTILS ========== */
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }

  function formatPhoneInput(value) {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (digits.length && !digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);
    let res = '';
    if (digits.length > 0) res = '+7';
    if (digits.length > 1) res += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) res += ')';
    if (digits.length > 4) res += ' ' + digits.slice(4, 7);
    if (digits.length > 7) res += '-' + digits.slice(7, 9);
    if (digits.length > 9) res += '-' + digits.slice(9, 11);
    return res;
  }

  // Public
  return { init, openModal, toast, renderCabinet };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
