/**
 * Клиент API Telegram-бота Элегия
 * Сервер: bot/server.js → http://localhost:3001
 */
const TelegramAPI = (() => {
  const DEFAULT_BASE =
    (typeof window !== 'undefined' &&
      window.ELEGIA_API_URL) ||
    'http://localhost:3001';

  let baseUrl = DEFAULT_BASE;
  let config = {
    botUsername: 'elegiya_beauty_bot',
    botUrl: 'https://t.me/elegiya_beauty_bot',
    botReady: false,
    adminConfigured: false,
  };
  let online = false;

  function setBaseUrl(url) {
    baseUrl = (url || DEFAULT_BASE).replace(/\/$/, '');
  }

  function getBaseUrl() {
    return baseUrl;
  }

  function getConfig() {
    return { ...config, online };
  }

  function isOnline() {
    return online;
  }

  async function request(path, options = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), options.timeout || 8000);
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.data = data;
        throw err;
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Проверка сервера + конфиг бота */
  async function ping() {
    try {
      const health = await request('/api/health', { timeout: 3000 });
      online = Boolean(health.ok);
      try {
        const cfg = await request('/api/config', { timeout: 3000 });
        config = {
          botUsername: cfg.botUsername || config.botUsername,
          botUrl: cfg.botUrl || `https://t.me/${cfg.botUsername || config.botUsername}`,
          botReady: Boolean(cfg.botReady),
          adminConfigured: Boolean(cfg.adminConfigured),
        };
      } catch {
        /* health ok is enough */
      }
      return { online, config: getConfig() };
    } catch {
      online = false;
      return { online: false, config: getConfig() };
    }
  }

  /**
   * Отправить запись в бот
   * @returns {{ ok, telegram, booking } | { ok:false, offline:true }}
   */
  async function sendBooking(booking) {
    const status = await ping();
    if (!status.online) {
      return {
        ok: false,
        offline: true,
        message:
          'Сервер бота недоступен. Запись сохранена на сайте. Запустите bot/start.bat',
      };
    }

    try {
      const data = await request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
        timeout: 12000,
      });
      if (data.telegram?.botUrl) {
        config.botUrl = data.telegram.botUrl;
      }
      return {
        ok: true,
        booking: data.booking,
        telegram: data.telegram,
        message: data.telegram?.message || 'Запись отправлена в Telegram.',
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message,
        message: 'Не удалось отправить в Telegram: ' + err.message,
      };
    }
  }

  async function cancelBooking(id) {
    if (!(await ping()).online) return { ok: false, offline: true };
    try {
      return await request(`/api/bookings/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
        body: '{}',
      });
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function fetchBookingsByPhone(phone) {
    if (!(await ping()).online) return { ok: false, offline: true, bookings: [] };
    try {
      return await request(
        `/api/bookings?phone=${encodeURIComponent(phone)}`,
        { timeout: 5000 }
      );
    } catch {
      return { ok: false, bookings: [] };
    }
  }

  /** Deep-link для привязки телефона в боте */
  function linkPhoneUrl(phone) {
    const digits = String(phone || '').replace(/\D/g, '').slice(-10);
    const user = config.botUsername || 'elegiya_beauty_bot';
    if (digits.length >= 10) {
      return `https://t.me/${user}?start=phone_${digits}`;
    }
    return config.botUrl || `https://t.me/${user}`;
  }

  return {
    setBaseUrl,
    getBaseUrl,
    getConfig,
    isOnline,
    ping,
    sendBooking,
    cancelBooking,
    fetchBookingsByPhone,
    linkPhoneUrl,
  };
})();
