/**
 * Главное приложение «Котодом» — роутинг и все разделы
 */
const App = {
  currentView: 'home',
  filters: {
    search: '',
    category: '',
    city: '',
    gender: '',
    priceMin: '',
    priceMax: '',
    age: '',
    sort: 'date'
  },
  catalogPage: 1,
  pageSize: 6,
  editingId: null,
  uploadImages: [],
  galleryIndex: 0,

  init() {
    Storage.init();
    Storage.setTheme(Storage.getTheme());
    Chat.init();
    this.bindGlobalEvents();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());
  },

  navigate(view, params = {}) {
    let hash = '#' + view;
    if (params.id) hash += '/' + params.id;
    if (location.hash !== hash) {
      location.hash = hash;
    } else {
      this.handleRoute();
    }
  },

  parseRoute() {
    const hash = location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    return { view: parts[0], id: parts[1] || null };
  },

  handleRoute() {
    const { view, id } = this.parseRoute();
    this.currentView = view;

    document.getElementById('app-header').innerHTML = Components.renderHeader();
    document.getElementById('app-bottom-nav').innerHTML = Components.renderBottomNav(view);

    this.bindHeaderEvents();

    const views = ['home', 'catalog', 'listing', 'post', 'profile', 'favorites'];
    views.forEach(v => {
      const el = document.getElementById('view-' + v);
      if (el) el.classList.toggle('active', v === view);
    });

    switch (view) {
      case 'home': this.renderHome(); break;
      case 'catalog': this.renderCatalog(); break;
      case 'listing': this.renderListing(id); break;
      case 'post': this.renderPost(id); break;
      case 'profile': this.renderProfile(); break;
      case 'favorites': this.renderFavorites(); break;
      default: this.navigate('home');
    }

    window.scrollTo(0, 0);
  },

  bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const favBtn = e.target.closest('[data-fav]');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = favBtn.dataset.fav;
        const isFav = Storage.toggleFavorite(id);
        favBtn.classList.toggle('active', isFav);
        const svg = favBtn.querySelector('svg');
        svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
        svg.classList.toggle('text-red-500', isFav);
        svg.classList.toggle('text-gray-400', !isFav);
        Components.toast(isFav ? 'Добавлено в избранное' : 'Удалено из избранного');
        document.getElementById('app-header').innerHTML = Components.renderHeader();
        this.bindHeaderEvents();
        return;
      }

      const card = e.target.closest('[data-listing-id]');
      if (card && !e.target.closest('[data-fav]')) {
        this.navigate('listing', { id: card.dataset.listingId });
        return;
      }

      const catBtn = e.target.closest('[data-category]');
      if (catBtn) {
        this.filters.category = catBtn.dataset.category;
        this.catalogPage = 1;
        this.navigate('catalog');
        return;
      }

      const navLink = e.target.closest('[data-nav]');
      if (navLink) {
        e.preventDefault();
        this.navigate(navLink.dataset.nav);
      }
    });
  },

  bindHeaderEvents() {
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.onclick = () => {
        const next = Storage.getTheme() === 'dark' ? 'light' : 'dark';
        Storage.setTheme(next);
      };
    }

    const search = document.getElementById('header-search');
    if (search) {
      search.value = this.filters.search;
      search.onkeydown = (e) => {
        if (e.key === 'Enter') {
          this.filters.search = search.value;
          this.catalogPage = 1;
          this.navigate('catalog');
        }
      };
    }
  },

  getFilteredListings(onlyActive = true) {
    let listings = onlyActive ? Storage.getActiveListings() : Storage.getListings();

    const f = this.filters;
    if (f.search) {
      const q = f.search.toLowerCase();
      listings = listings.filter(l =>
        l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }
    if (f.category) listings = listings.filter(l => l.category === f.category);
    if (f.city) listings = listings.filter(l => l.city === f.city);
    if (f.gender) listings = listings.filter(l => l.gender === f.gender);
    if (f.age) listings = listings.filter(l => l.age.toLowerCase().includes(f.age.toLowerCase()));
    if (f.priceMin) listings = listings.filter(l => l.price >= Number(f.priceMin));
    if (f.priceMax) listings = listings.filter(l => l.price <= Number(f.priceMax));

    switch (f.sort) {
      case 'price-asc': listings.sort((a, b) => a.price - b.price); break;
      case 'price-desc': listings.sort((a, b) => b.price - a.price); break;
      case 'popular': listings.sort((a, b) => (b.views || 0) - (a.views || 0)); break;
      default: listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return listings;
  },

  readFiltersFromDOM() {
    const get = (id) => document.getElementById(id);
    this.filters.category = get('filter-category')?.value || '';
    this.filters.city = get('filter-city')?.value || '';
    this.filters.gender = get('filter-gender')?.value || '';
    this.filters.priceMin = get('filter-price-min')?.value || '';
    this.filters.priceMax = get('filter-price-max')?.value || '';
    this.filters.age = get('filter-age')?.value || '';
    this.filters.sort = get('filter-sort')?.value || 'date';
    const mobileSearch = get('catalog-search');
    if (mobileSearch) this.filters.search = mobileSearch.value;
  },

  bindFilterEvents() {
    ['filter-category', 'filter-city', 'filter-gender', 'filter-sort'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.onchange = () => { this.readFiltersFromDOM(); this.catalogPage = 1; this.renderCatalogList(); };
    });

    ['filter-price-min', 'filter-price-max', 'filter-age'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = debounce(() => { this.readFiltersFromDOM(); this.catalogPage = 1; this.renderCatalogList(); }, 400);
    });

    const reset = document.getElementById('filter-reset');
    if (reset) {
      reset.onclick = () => {
        this.filters = { search: '', category: '', city: '', gender: '', priceMin: '', priceMax: '', age: '', sort: 'date' };
        this.catalogPage = 1;
        this.renderCatalog();
      };
    }

    const mobileSearch = document.getElementById('catalog-search');
    if (mobileSearch) {
      mobileSearch.oninput = debounce(() => {
        this.filters.search = mobileSearch.value;
        this.catalogPage = 1;
        this.renderCatalogList();
      }, 300);
    }

    const filterToggle = document.getElementById('filter-toggle');
    const filterDrawer = document.getElementById('filter-drawer');
    const filterOverlay = document.getElementById('filter-overlay');
    const filterClose = document.getElementById('filter-close');
    const closeFilters = () => {
      filterDrawer?.classList.remove('open');
      filterOverlay?.classList.add('hidden');
    };
    if (filterToggle && filterDrawer) {
      filterToggle.onclick = () => {
        filterDrawer.classList.add('open');
        filterOverlay?.classList.remove('hidden');
      };
      filterClose?.addEventListener('click', closeFilters);
      filterOverlay?.addEventListener('click', closeFilters);
    }

    const applyMobile = document.getElementById('filter-apply-mobile');
    if (applyMobile) {
      applyMobile.onclick = () => {
        this.readFiltersFromDOM();
        this.catalogPage = 1;
        closeFilters();
        this.renderCatalogList();
      };
    }
  },

  /* ─── ГЛАВНАЯ ─── */
  renderHome() {
    const popular = [...Storage.getActiveListings()].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 6);
    const recent = [...Storage.getActiveListings()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

    document.getElementById('view-home').innerHTML = `
      <section class="bg-gradient-to-br from-orange-500 to-amber-500 text-white">
        <div class="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <h1 class="text-3xl md:text-5xl font-bold mb-3">Найдите питомца мечты</h1>
          <p class="text-orange-100 text-lg mb-6 max-w-xl">Котодом — доска объявлений о домашних животных. Кошки, собаки, грызуны и не только.</p>
          <div class="flex gap-2 max-w-lg">
            <div class="relative flex-1">
              <input type="search" id="home-search" placeholder="Кого ищете?"
                class="w-full pl-4 pr-4 py-3 rounded-xl text-gray-900 text-base focus:ring-2 focus:ring-white/50">
            </div>
            <button id="home-search-btn" class="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition shrink-0">
              Найти
            </button>
          </div>
        </div>
      </section>

      <div class="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Категории</h2>
          ${Components.renderCategoryGrid()}
        </section>

        <section>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Популярные объявления</h2>
            <button data-nav="catalog" class="text-orange-500 text-sm font-medium hover:underline">Все →</button>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            ${popular.map(l => Components.renderListingCard(l)).join('')}
          </div>
        </section>

        <section>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Недавно добавленные</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${recent.map(l => Components.renderListingCard(l, { compact: true })).join('')}
          </div>
        </section>

        <section class="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-6 md:p-8 text-center">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Хотите продать или отдать питомца?</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4">Разместите объявление бесплатно за 2 минуты</p>
          <button data-nav="post" class="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition">
            Разместить объявление
          </button>
        </section>
      </div>
    `;

    const homeSearch = document.getElementById('home-search');
    const homeSearchBtn = document.getElementById('home-search-btn');
    const doSearch = () => {
      this.filters.search = homeSearch.value;
      this.catalogPage = 1;
      this.navigate('catalog');
    };
    homeSearchBtn.onclick = doSearch;
    homeSearch.onkeydown = (e) => { if (e.key === 'Enter') doSearch(); };
  },

  /* ─── КАТАЛОГ ─── */
  renderCatalog() {
    document.getElementById('view-catalog').innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Каталог</h1>
          <button id="filter-toggle" class="md:hidden flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Фильтры
          </button>
        </div>

        <div class="md:hidden mb-4">
          <input type="search" id="catalog-search" value="${this.filters.search}" placeholder="Поиск..."
            class="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm dark:text-white">
        </div>

        <div class="flex gap-6">
          <aside class="hidden md:block w-64 shrink-0">
            <div class="sticky top-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              ${Components.renderFiltersPanel(this.filters)}
            </div>
          </aside>

          <div class="flex-1 min-w-0">
            <div id="catalog-count" class="text-sm text-gray-500 dark:text-gray-400 mb-3"></div>
            <div id="catalog-grid" class="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"></div>
            <div id="catalog-load-more" class="mt-6 text-center"></div>
          </div>
        </div>
      </div>

      <!-- Мобильные фильтры -->
      <div id="filter-drawer" class="filter-drawer fixed inset-y-0 right-0 w-80 max-w-full bg-white dark:bg-gray-900 z-50 shadow-2xl p-4 overflow-y-auto md:hidden">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg dark:text-white">Фильтры</h3>
          <button id="filter-close" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg class="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        ${Components.renderFiltersPanel(this.filters, true)}
        <button id="filter-apply-mobile" class="w-full mt-4 py-3 bg-orange-500 text-white font-medium rounded-xl">Применить</button>
      </div>
      <div id="filter-overlay" class="fixed inset-0 bg-black/40 z-40 hidden md:hidden"></div>
    `;

    this.bindFilterEvents();
    this.renderCatalogList();
  },

  renderCatalogList() {
    const all = this.getFilteredListings();
    const shown = all.slice(0, this.catalogPage * this.pageSize);

    document.getElementById('catalog-count').textContent =
      `Найдено ${all.length} ${pluralize(all.length, 'объявление', 'объявления', 'объявлений')}`;

    const grid = document.getElementById('catalog-grid');
    if (all.length === 0) {
      grid.innerHTML = Components.renderEmptyState(
        'Ничего не найдено',
        'Попробуйте изменить фильтры или поисковый запрос',
        '<button id="filter-reset-inline" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Сбросить фильтры</button>'
      );
      document.getElementById('filter-reset-inline')?.addEventListener('click', () => {
        this.filters = { search: '', category: '', city: '', gender: '', priceMin: '', priceMax: '', age: '', sort: 'date' };
        this.catalogPage = 1;
        this.renderCatalog();
      });
    } else {
      grid.innerHTML = shown.map(l => Components.renderListingCard(l)).join('');
    }

    const loadMoreEl = document.getElementById('catalog-load-more');
    if (shown.length < all.length) {
      loadMoreEl.innerHTML = `
        <button id="load-more-btn" class="load-more-btn px-8 py-3 border-2 border-orange-500 text-orange-500 font-medium rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition">
          Загрузить ещё (${all.length - shown.length})
        </button>
      `;
      document.getElementById('load-more-btn').onclick = () => {
        this.catalogPage++;
        this.renderCatalogList();
      };
    } else {
      loadMoreEl.innerHTML = '';
    }
  },

  /* ─── ДЕТАЛЬНАЯ СТРАНИЦА ─── */
  renderListing(id) {
    if (!id) { this.navigate('catalog'); return; }

    const listing = Storage.getListingById(id);
    if (!listing || listing.status !== 'active') {
      document.getElementById('view-listing').innerHTML = Components.renderEmptyState(
        'Объявление не найдено',
        'Возможно, оно было снято с публикации',
        '<button data-nav="catalog" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">В каталог</button>'
      );
      return;
    }

    Storage.incrementViews(id);
    this.galleryIndex = 0;
    const isFav = Storage.isFavorite(id);
    const images = listing.images || [];

    document.getElementById('view-listing').innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-6">
        <button data-nav="catalog" class="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500 mb-4 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Назад к каталогу
        </button>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Галерея -->
          <div>
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer" id="gallery-main">
              <img id="gallery-main-img" src="${images[0] || ''}" alt="${listing.title}" class="w-full h-full object-cover"
                onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2248%22%3E🐾%3C/text%3E%3C/svg%3E'">
              ${images.length > 1 ? `<span class="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded">${images.length} фото</span>` : ''}
            </div>
            ${images.length > 1 ? `
              <div class="flex gap-2 mt-2 overflow-x-auto">
                ${images.map((img, i) => `
                  <button class="gallery-thumb w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 ${i === 0 ? 'border-orange-500 active' : 'border-transparent'}" data-gallery-idx="${i}">
                    <img src="${img}" class="w-full h-full object-cover" alt="">
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Информация -->
          <div>
            <div class="flex items-start justify-between gap-4">
              <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">${listing.title}</h1>
              <button class="fav-btn shrink-0 w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center ${isFav ? 'active' : ''}" data-fav="${id}">
                <svg class="w-5 h-5 ${isFav ? 'text-red-500' : 'text-gray-400'}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>

            <p class="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">${Components.formatPrice(listing.price)}</p>

            <div class="flex flex-wrap gap-2 mt-4">
              <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm dark:text-gray-300">${Components.getCategoryName(listing.category)}</span>
              <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm dark:text-gray-300">${GENDER_LABELS[listing.gender]}</span>
              <span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm dark:text-gray-300">${listing.age}</span>
            </div>

            <div class="mt-4 flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              ${listing.city}
              <span>·</span>
              <span>${Components.formatDate(listing.createdAt)}</span>
              <span>·</span>
              <span>${listing.views} просмотров</span>
            </div>

            <p class="mt-6 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">${listing.description}</p>

            <!-- Продавец -->
            <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-xl">👤</div>
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">${listing.sellerName}</p>
                  <p class="text-sm text-gray-500">${listing.sellerPhone}</p>
                </div>
              </div>
              <div class="flex gap-2 mt-4">
                <button id="chat-open-btn" class="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Написать
                </button>
                <a href="tel:${listing.sellerPhone.replace(/\D/g, '')}" class="flex-1 py-2.5 border border-orange-500 text-orange-500 font-medium rounded-xl transition text-center flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  Позвонить
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Галерея
    document.querySelectorAll('[data-gallery-idx]').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.galleryIdx);
        this.galleryIndex = idx;
        document.getElementById('gallery-main-img').src = images[idx];
        document.querySelectorAll('.gallery-thumb').forEach(t => {
          t.classList.toggle('border-orange-500', Number(t.dataset.galleryIdx) === idx);
          t.classList.toggle('active', Number(t.dataset.galleryIdx) === idx);
        });
      };
    });

    document.getElementById('gallery-main')?.addEventListener('click', () => {
      if (images.length) this.openPhotoModal(images, this.galleryIndex);
    });

    document.getElementById('chat-open-btn')?.addEventListener('click', () => {
      Chat.open(listing.sellerId, listing.sellerName);
    });
  },

  openPhotoModal(images, startIdx = 0) {
    let idx = startIdx;
    const modal = document.getElementById('photo-modal');
    const img = document.getElementById('photo-modal-img');
    const counter = document.getElementById('photo-modal-counter');

    const update = () => {
      img.src = images[idx];
      counter.textContent = `${idx + 1} / ${images.length}`;
    };

    update();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    document.getElementById('photo-prev').onclick = () => { idx = (idx - 1 + images.length) % images.length; update(); };
    document.getElementById('photo-next').onclick = () => { idx = (idx + 1) % images.length; update(); };
    document.getElementById('photo-close').onclick = () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    };
    modal.querySelector('.modal-overlay').onclick = (e) => {
      if (e.target === e.currentTarget) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    };
  },

  /* ─── РАЗМЕСТИТЬ ОБЪЯВЛЕНИЕ ─── */
  renderPost(editId) {
    this.editingId = editId || null;
    this.uploadImages = [];

    let listing = null;
    if (editId) {
      listing = Storage.getListingById(editId);
      if (listing) this.uploadImages = [...(listing.images || [])];
    }

    const user = Storage.getUser();

    document.getElementById('view-post').innerHTML = `
      <div class="max-w-2xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">${editId ? 'Редактировать объявление' : 'Разместить объявление'}</h1>

        <form id="post-form" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок *</label>
            <input type="text" name="title" required value="${listing?.title || ''}" maxlength="100"
              class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Например: Котёнок британской породы">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание *</label>
            <textarea name="description" required rows="5" maxlength="2000"
              class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="Расскажите о питомце подробнее...">${listing?.description || ''}</textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Категория *</label>
              <select name="category" required class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                ${CATEGORIES.map(c => `<option value="${c.id}" ${listing?.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Цена, ₽</label>
              <input type="number" name="price" min="0" value="${listing?.price ?? ''}" placeholder="0 = бесплатно"
                class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Возраст</label>
              <input type="text" name="age" value="${listing?.age || ''}" placeholder="3 месяца"
                class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пол</label>
              <select name="gender" class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                <option value="unknown" ${listing?.gender === 'unknown' ? 'selected' : ''}>Не указан</option>
                <option value="male" ${listing?.gender === 'male' ? 'selected' : ''}>Мальчик</option>
                <option value="female" ${listing?.gender === 'female' ? 'selected' : ''}>Девочка</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Город *</label>
              <select name="city" required class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                ${CITIES.map(c => `<option value="${c}" ${(listing?.city || user.city) === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон *</label>
              <input type="tel" name="phone" required value="${listing?.sellerPhone || user.phone}"
                class="w-full rounded-xl border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white" placeholder="+7 (900) 000-00-00">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Фотографии</label>
            <div id="photo-previews" class="flex flex-wrap gap-2 mb-3"></div>
            <label class="flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-orange-500 transition">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <span class="text-sm text-gray-500">Нажмите для загрузки (до 5 фото)</span>
              <input type="file" id="photo-input" accept="image/*" multiple class="hidden">
            </label>
          </div>

          <button type="submit" class="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition">
            ${editId ? 'Сохранить изменения' : 'Опубликовать объявление'}
          </button>
        </form>
      </div>
    `;

    this.renderPhotoPreviews();

    document.getElementById('photo-input').onchange = (e) => {
      const files = Array.from(e.target.files);
      const remaining = 5 - this.uploadImages.length;
      files.slice(0, remaining).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.uploadImages.push(ev.target.result);
          this.renderPhotoPreviews();
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };

    document.getElementById('post-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);

      if (!data.title.trim() || !data.description.trim()) {
        Components.toast('Заполните обязательные поля', 'error');
        return;
      }

      const listingData = {
        id: editId || Storage.generateId(),
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        price: Number(data.price) || 0,
        age: data.age || '—',
        city: data.city,
        gender: data.gender,
        images: this.uploadImages.length ? this.uploadImages : ['data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23fed7aa%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2248%22%3E🐾%3C/text%3E%3C/svg%3E'],
        views: listing?.views || 0,
        createdAt: listing?.createdAt || new Date().toISOString(),
        sellerId: user.id,
        sellerName: user.name,
        sellerPhone: data.phone,
        status: 'active'
      };

      Storage.saveListing(listingData);
      Components.toast(editId ? 'Объявление обновлено' : 'Объявление опубликовано!');
      this.navigate('listing', { id: listingData.id });
    };
  },

  renderPhotoPreviews() {
    const container = document.getElementById('photo-previews');
    if (!container) return;
    container.innerHTML = this.uploadImages.map((img, i) => `
      <div class="photo-preview w-20 h-20">
        <img src="${img}" class="w-full h-full object-cover rounded-lg" alt="">
        <button type="button" class="remove-btn w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center" data-remove-photo="${i}">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('[data-remove-photo]').forEach(btn => {
      btn.onclick = () => {
        this.uploadImages.splice(Number(btn.dataset.removePhoto), 1);
        this.renderPhotoPreviews();
      };
    });
  },

  /* ─── ЛИЧНЫЙ КАБИНЕТ ─── */
  renderProfile() {
    const user = Storage.getUser();
    const myListings = Storage.getUserListings();

    document.getElementById('view-profile').innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-6">
        <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-3xl">👤</div>
            <div class="flex-1">
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">${user.name}</h1>
              <p class="text-gray-500 text-sm">${user.phone} · ${user.city}</p>
            </div>
          </div>
          <form id="profile-form" class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input type="text" name="name" value="${user.name}" placeholder="Имя" class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
            <input type="tel" name="phone" value="${user.phone}" placeholder="Телефон" class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
            <select name="city" class="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm">
              ${CITIES.map(c => `<option value="${c}" ${user.city === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <button type="submit" class="sm:col-span-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">Сохранить профиль</button>
          </form>
        </div>

        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Мои объявления (${myListings.length})</h2>
          <button data-nav="post" class="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg">+ Новое</button>
        </div>

        <div id="profile-listings">
          ${myListings.length === 0 ? Components.renderEmptyState(
            'У вас пока нет объявлений',
            'Разместите первое объявление о вашем питомце',
            '<button data-nav="post" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Разместить</button>'
          ) : myListings.map(l => this.renderProfileListingRow(l)).join('')}
        </div>
      </div>
    `;

    document.getElementById('profile-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      Storage.saveUser({ ...user, name: fd.get('name'), phone: fd.get('phone'), city: fd.get('city') });
      Components.toast('Профиль сохранён');
    };

    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => this.navigate('post', { id: btn.dataset.edit });
    });

    document.querySelectorAll('[data-unpublish]').forEach(btn => {
      btn.onclick = () => {
        const listing = Storage.getListingById(btn.dataset.unpublish);
        if (listing) {
          listing.status = listing.status === 'active' ? 'draft' : 'active';
          Storage.saveListing(listing);
          Components.toast(listing.status === 'active' ? 'Объявление опубликовано' : 'Снято с публикации');
          this.renderProfile();
        }
      };
    });

    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Удалить объявление безвозвратно?')) {
          Storage.deleteListing(btn.dataset.delete);
          Components.toast('Объявление удалено');
          this.renderProfile();
        }
      };
    });
  },

  renderProfileListingRow(listing) {
    const statusBadge = listing.status === 'active'
      ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded">Активно</span>'
      : '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded">Снято</span>';

    return `
      <div class="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
        <img src="${listing.images?.[0] || ''}" class="w-20 h-20 rounded-lg object-cover shrink-0 bg-gray-100" alt="">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            ${statusBadge}
            <span class="text-xs text-gray-400">${listing.views} просм.</span>
          </div>
          <h3 class="font-medium text-gray-900 dark:text-white truncate">${listing.title}</h3>
          <p class="text-orange-600 font-bold text-sm">${Components.formatPrice(listing.price)}</p>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
          <button data-edit="${listing.id}" class="px-3 py-1 text-xs text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded">Изменить</button>
          <button data-unpublish="${listing.id}" class="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">${listing.status === 'active' ? 'Снять' : 'Опубликовать'}</button>
          <button data-delete="${listing.id}" class="px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">Удалить</button>
        </div>
      </div>
    `;
  },

  /* ─── ИЗБРАННОЕ ─── */
  renderFavorites() {
    const favIds = Storage.getFavorites();
    const listings = favIds.map(id => Storage.getListingById(id)).filter(l => l && l.status === 'active');

    document.getElementById('view-favorites').innerHTML = `
      <div class="max-w-6xl mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Избранное</h1>
        ${listings.length === 0 ? Components.renderEmptyState(
          'Избранное пусто',
          'Нажимайте на сердечко, чтобы сохранить понравившиеся объявления',
          '<button data-nav="catalog" class="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">Перейти в каталог</button>'
        ) : `
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            ${listings.map(l => Components.renderListingCard(l)).join('')}
          </div>
        `}
      </div>
    `;
  }
};

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function pluralize(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

document.addEventListener('DOMContentLoaded', () => App.init());