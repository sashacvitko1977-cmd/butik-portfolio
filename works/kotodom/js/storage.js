/**
 * Работа с localStorage для «Котодом»
 */
const Storage = {
  KEYS: {
    LISTINGS: 'kotodom_listings',
    FAVORITES: 'kotodom_favorites',
    USER: 'kotodom_user',
    CHATS: 'kotodom_chats',
    THEME: 'kotodom_theme',
    INITIALIZED: 'kotodom_initialized'
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  init() {
    if (!localStorage.getItem(this.KEYS.INITIALIZED)) {
      this.set(this.KEYS.LISTINGS, SEED_LISTINGS);
      this.set(this.KEYS.FAVORITES, []);
      this.set(this.KEYS.USER, {
        id: 'user-current',
        name: 'Вы',
        phone: '+7 (900) 000-00-00',
        city: 'Москва'
      });
      this.set(this.KEYS.CHATS, {});
      localStorage.setItem(this.KEYS.INITIALIZED, 'true');
    }
  },

  getListings() {
    return this.get(this.KEYS.LISTINGS, []);
  },

  getActiveListings() {
    return this.getListings().filter(l => l.status === 'active');
  },

  getListingById(id) {
    return this.getListings().find(l => l.id === id) || null;
  },

  saveListing(listing) {
    const listings = this.getListings();
    const idx = listings.findIndex(l => l.id === listing.id);
    if (idx >= 0) {
      listings[idx] = listing;
    } else {
      listings.unshift(listing);
    }
    this.set(this.KEYS.LISTINGS, listings);
    return listing;
  },

  deleteListing(id) {
    const listings = this.getListings().filter(l => l.id !== id);
    this.set(this.KEYS.LISTINGS, listings);
  },

  incrementViews(id) {
    const listing = this.getListingById(id);
    if (listing) {
      listing.views = (listing.views || 0) + 1;
      this.saveListing(listing);
    }
  },

  getUserListings() {
    const user = this.getUser();
    return this.getListings().filter(l => l.sellerId === user.id);
  },

  getUser() {
    return this.get(this.KEYS.USER, { id: 'user-current', name: 'Вы', phone: '', city: 'Москва' });
  },

  saveUser(user) {
    this.set(this.KEYS.USER, user);
  },

  getFavorites() {
    return this.get(this.KEYS.FAVORITES, []);
  },

  isFavorite(id) {
    return this.getFavorites().includes(id);
  },

  toggleFavorite(id) {
    let favs = this.getFavorites();
    if (favs.includes(id)) {
      favs = favs.filter(f => f !== id);
    } else {
      favs.push(id);
    }
    this.set(this.KEYS.FAVORITES, favs);
    return favs.includes(id);
  },

  getChat(sellerId) {
    const chats = this.get(this.KEYS.CHATS, {});
    return chats[sellerId] || [];
  },

  addChatMessage(sellerId, message) {
    const chats = this.get(this.KEYS.CHATS, {});
    if (!chats[sellerId]) chats[sellerId] = [];
    chats[sellerId].push({
      id: 'msg-' + Date.now(),
      text: message.text,
      from: message.from,
      time: new Date().toISOString()
    });
    this.set(this.KEYS.CHATS, chats);
    return chats[sellerId];
  },

  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  generateId() {
    return 'lst-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
};