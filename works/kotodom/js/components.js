/**
 * UI-компоненты «Котодом»
 */
const Components = {
  formatPrice(price) {
    if (price === 0) return 'Бесплатно';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  },

  formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Сегодня';
    if (days === 1) return 'Вчера';
    if (days < 7) return days + ' дн. назад';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  },

  getCategoryName(id) {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : 'Другое';
  },

  toast(message, type = 'success') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-orange-500'
    };
    const el = document.createElement('div');
    el.className = `toast fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg ${colors[type]}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },

  renderHeader() {
    const favCount = Storage.getFavorites().length;
    return `
      <header class="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a href="#home" data-nav="home" class="flex items-center gap-2 shrink-0">
            <span class="text-2xl">🐾</span>
            <span class="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">Котодом</span>
          </a>

          <div class="flex-1 max-w-xl hidden md:block">
            <div class="relative">
              <input type="search" id="header-search" placeholder="Поиск питомцев..."
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm focus:ring-2 focus:ring-orange-500 dark:text-white">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button id="theme-toggle" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300" aria-label="Тема">
              <svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
              <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </button>
            <a href="#post" data-nav="post" class="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Разместить
            </a>
            <a href="#favorites" data-nav="favorites" class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hidden sm:block">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              ${favCount > 0 ? `<span class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center">${favCount}</span>` : ''}
            </a>
            <a href="#profile" data-nav="profile" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hidden sm:block">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </a>
          </div>
        </div>
      </header>
    `;
  },

  renderBottomNav(activeView) {
    const items = [
      { id: 'home', label: 'Главная', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>' },
      { id: 'catalog', label: 'Каталог', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>' },
      { id: 'post', label: 'Подать', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>', accent: true },
      { id: 'favorites', label: 'Избранное', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>' },
      { id: 'profile', label: 'Профиль', icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>' }
    ];

    return `
      <nav class="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
        <div class="flex justify-around items-center h-16">
          ${items.map(item => `
            <a href="#${item.id}" data-nav="${item.id}"
              class="bottom-nav-item flex flex-col items-center gap-0.5 text-xs ${activeView === item.id ? 'active' : 'text-gray-500'} ${item.accent ? 'relative -top-3' : ''}">
              ${item.accent ? `
                <span class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg>
                </span>
              ` : `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.icon}</svg>
                <span>${item.label}</span>
              `}
            </a>
          `).join('')}
        </div>
      </nav>
    `;
  },

  renderListingCard(listing, options = {}) {
    const isFav = Storage.isFavorite(listing.id);
    const img = listing.images?.[0] || '';
    const compact = options.compact;

    return `
      <article class="listing-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer" data-listing-id="${listing.id}">
        <div class="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img src="${img}" alt="${listing.title}" class="w-full h-full object-cover" loading="lazy"
            onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2248%22%3E🐾%3C/text%3E%3C/svg%3E'">
          <button class="fav-btn absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-gray-900/90 rounded-full flex items-center justify-center shadow ${isFav ? 'active' : ''}"
            data-fav="${listing.id}" onclick="event.stopPropagation()">
            <svg class="w-4 h-4 ${isFav ? 'text-red-500' : 'text-gray-400'}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
          </button>
          ${listing.price === 0 ? '<span class="absolute top-2 left-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">Бесплатно</span>' : ''}
        </div>
        <div class="p-3 ${compact ? 'p-2' : ''}">
          <p class="font-bold text-orange-600 dark:text-orange-400 ${compact ? 'text-sm' : 'text-lg'}">${this.formatPrice(listing.price)}</p>
          <h3 class="font-medium text-gray-900 dark:text-white line-clamp-2 ${compact ? 'text-sm' : 'text-base'} mt-0.5">${listing.title}</h3>
          <div class="flex items-center gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span>${listing.city}</span>
            <span>·</span>
            <span>${this.formatDate(listing.createdAt)}</span>
          </div>
        </div>
      </article>
    `;
  },

  renderEmptyState(title, description, actionHtml = '') {
    return `
      <div class="empty-state flex flex-col items-center justify-center py-16 px-4 text-center">
        <svg class="w-20 h-20 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">${title}</h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm max-w-sm">${description}</p>
        ${actionHtml ? `<div class="mt-4">${actionHtml}</div>` : ''}
      </div>
    `;
  },

  renderCategoryGrid(activeCategory = null) {
    return `
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
        ${CATEGORIES.map(cat => `
          <button data-category="${cat.id}"
            class="category-chip flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 ${cat.color} ${activeCategory === cat.id ? 'active' : ''}">
            <span class="text-2xl">${cat.icon}</span>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">${cat.name}</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  renderFiltersPanel(filters, mobile = false) {
    return `
      <div class="${mobile ? 'space-y-4' : 'space-y-5'}">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Категория</label>
          <select id="filter-category" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
            <option value="">Все категории</option>
            ${CATEGORIES.map(c => `<option value="${c.id}" ${filters.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Город</label>
          <select id="filter-city" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
            <option value="">Все города</option>
            ${CITIES.map(c => `<option value="${c}" ${filters.city === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Пол</label>
          <select id="filter-gender" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
            <option value="">Любой</option>
            <option value="male" ${filters.gender === 'male' ? 'selected' : ''}>Мальчик</option>
            <option value="female" ${filters.gender === 'female' ? 'selected' : ''}>Девочка</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Цена от</label>
            <input type="number" id="filter-price-min" value="${filters.priceMin || ''}" placeholder="0"
              class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Цена до</label>
            <input type="number" id="filter-price-max" value="${filters.priceMax || ''}" placeholder="∞"
              class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Возраст</label>
          <input type="text" id="filter-age" value="${filters.age || ''}" placeholder="Например: 3 месяца"
            class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Сортировка</label>
          <select id="filter-sort" class="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm">
            <option value="date" ${filters.sort === 'date' ? 'selected' : ''}>По дате</option>
            <option value="price-asc" ${filters.sort === 'price-asc' ? 'selected' : ''}>Цена: по возрастанию</option>
            <option value="price-desc" ${filters.sort === 'price-desc' ? 'selected' : ''}>Цена: по убыванию</option>
            <option value="popular" ${filters.sort === 'popular' ? 'selected' : ''}>По популярности</option>
          </select>
        </div>
        <button id="filter-reset" class="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 transition">
          Сбросить фильтры
        </button>
      </div>
    `;
  }
};