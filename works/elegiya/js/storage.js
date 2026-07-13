/**
 * localStorage-слой для Элегия Beauty Studio
 */
const Storage = (() => {
  const KEYS = {
    bookings: 'elegiya_bookings',
    occupied: 'elegiya_occupied',
    client: 'elegiya_client',
    theme: 'elegiya_theme',
    seeded: 'elegiya_seeded',
  };

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeed() {
    if (get(KEYS.seeded)) return;
    set(KEYS.occupied, generateDemoOccupiedSlots());
    set(KEYS.bookings, []);
    set(KEYS.seeded, true);
  }

  /* —— Bookings —— */
  function getBookings() {
    ensureSeed();
    return get(KEYS.bookings, []);
  }

  function saveBooking(booking) {
    const list = getBookings();
    list.push(booking);
    set(KEYS.bookings, list);

    // Блокируем слоты на длительность услуги
    occupySlotsForBooking(booking);
    return booking;
  }

  function cancelBooking(id) {
    const list = getBookings().map((b) =>
      b.id === id ? { ...b, status: 'cancelled' } : b
    );
    set(KEYS.bookings, list);
    // Освобождаем слоты (пересобираем occupied из активных + демо-базу упрощённо)
    releaseSlotsForBooking(id);
    return list;
  }

  function getBookingsByPhone(phone) {
    const normalized = normalizePhone(phone);
    return getBookings()
      .filter((b) => normalizePhone(b.phone) === normalized)
      .sort((a, b) => {
        const da = `${a.date}T${a.time}`;
        const db = `${b.date}T${b.time}`;
        return db.localeCompare(da);
      });
  }

  /* —— Occupied slots —— */
  function getOccupied() {
    ensureSeed();
    return get(KEYS.occupied, []);
  }

  function setOccupied(slots) {
    set(KEYS.occupied, slots);
  }

  function isSlotOccupied(masterId, date, time) {
    return getOccupied().some(
      (s) => s.masterId === masterId && s.date === date && s.time === time
    );
  }

  function occupySlotsForBooking(booking) {
    const service = ELEGIA.services.find((s) => s.id === booking.serviceId);
    const duration = service ? service.duration : 60;
    const slotsNeeded = Math.ceil(duration / ELEGIA.schedule.slotStep);
    const occupied = getOccupied();
    let [h, m] = booking.time.split(':').map(Number);

    for (let i = 0; i < slotsNeeded; i++) {
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (
        !occupied.some(
          (s) =>
            s.masterId === booking.masterId &&
            s.date === booking.date &&
            s.time === time
        )
      ) {
        occupied.push({
          masterId: booking.masterId,
          date: booking.date,
          time,
          bookingId: booking.id,
        });
      }
      m += ELEGIA.schedule.slotStep;
      if (m >= 60) {
        h += 1;
        m -= 60;
      }
    }
    setOccupied(occupied);
  }

  function releaseSlotsForBooking(bookingId) {
    const occupied = getOccupied().filter((s) => s.bookingId !== bookingId);
    setOccupied(occupied);
  }

  /* —— Client session —— */
  function getClient() {
    return get(KEYS.client, null);
  }

  function setClient(client) {
    set(KEYS.client, client);
  }

  function clearClient() {
    localStorage.removeItem(KEYS.client);
  }

  /* —— Theme —— */
  function getTheme() {
    return localStorage.getItem(KEYS.theme) || 'light';
  }

  function setTheme(theme) {
    localStorage.setItem(KEYS.theme, theme);
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '').slice(-10);
  }

  function generateId() {
    return 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  return {
    KEYS,
    ensureSeed,
    getBookings,
    saveBooking,
    cancelBooking,
    getBookingsByPhone,
    getOccupied,
    isSlotOccupied,
    getClient,
    setClient,
    clearClient,
    getTheme,
    setTheme,
    normalizePhone,
    generateId,
  };
})();
