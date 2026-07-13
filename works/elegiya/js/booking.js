/**
 * Система онлайн-записи Элегия
 */
const Booking = (() => {
  const STEPS = ['service', 'master', 'datetime', 'form', 'success'];

  let state = createEmptyState();
  let stepIndex = 0;

  function createEmptyState() {
    return {
      serviceId: null,
      masterId: null,
      date: null,
      time: null,
      clientName: '',
      phone: '',
      comment: '',
      promoCode: '',
      bookingId: null,
    };
  }

  function reset() {
    state = createEmptyState();
    stepIndex = 0;
  }

  function getState() {
    return { ...state };
  }

  function getStep() {
    return STEPS[stepIndex];
  }

  function getStepIndex() {
    return stepIndex;
  }

  function canGoNext() {
    const step = getStep();
    if (step === 'service') return !!state.serviceId;
    if (step === 'master') return !!state.masterId;
    if (step === 'datetime') return !!state.date && !!state.time;
    if (step === 'form') return isFormValid();
    return false;
  }

  function isFormValid() {
    const nameOk = state.clientName.trim().length >= 2;
    const phoneDigits = state.phone.replace(/\D/g, '');
    const phoneOk = phoneDigits.length >= 10;
    return nameOk && phoneOk;
  }

  function next() {
    if (!canGoNext()) return false;
    if (stepIndex < STEPS.length - 1) {
      stepIndex += 1;
      return true;
    }
    return false;
  }

  function prev() {
    if (stepIndex > 0) {
      stepIndex -= 1;
      // При уходе с success сбрасываем
      if (STEPS[stepIndex] === 'form' && state.bookingId) {
        // остаёмся на form — не трогаем
      }
      return true;
    }
    return false;
  }

  function goTo(stepName) {
    const i = STEPS.indexOf(stepName);
    if (i >= 0) stepIndex = i;
  }

  function selectService(id) {
    state.serviceId = id;
    // Сброс мастера, если не делает услугу
    if (state.masterId) {
      const master = getMaster(state.masterId);
      if (master && !master.serviceIds.includes(id)) {
        state.masterId = null;
        state.date = null;
        state.time = null;
      }
    }
  }

  function selectMaster(id) {
    state.masterId = id;
    state.date = null;
    state.time = null;
  }

  function selectDate(iso) {
    state.date = iso;
    state.time = null;
  }

  function selectTime(time) {
    state.time = time;
  }

  function setFormField(field, value) {
    if (['clientName', 'phone', 'comment', 'promoCode'].includes(field)) {
      state[field] = value;
    }
  }

  function getService(id = state.serviceId) {
    return ELEGIA.services.find((s) => s.id === id) || null;
  }

  function getMaster(id = state.masterId) {
    return ELEGIA.masters.find((m) => m.id === id) || null;
  }

  function getMastersForService(serviceId = state.serviceId) {
    if (!serviceId) return ELEGIA.masters;
    return ELEGIA.masters.filter((m) => m.serviceIds.includes(serviceId));
  }

  /**
   * Генерация тайм-слотов на день с учётом длительности и занятости
   */
  function getAvailableSlots(masterId, date, serviceId) {
    if (!masterId || !date || !serviceId) return [];

    const service = getService(serviceId);
    if (!service) return [];

    const { openHour, closeHour, slotStep } = ELEGIA.schedule;
    const duration = service.duration;
    const slotsNeeded = Math.ceil(duration / slotStep);
    const result = [];

    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += slotStep) {
        const startMin = h * 60 + m;
        const endMin = startMin + duration;
        if (endMin > closeHour * 60) continue;

        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

        // Проверяем, что все слоты в диапазоне свободны
        let free = true;
        for (let i = 0; i < slotsNeeded; i++) {
          const tMin = startMin + i * slotStep;
          const th = Math.floor(tMin / 60);
          const tm = tMin % 60;
          const tStr = `${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;
          if (Storage.isSlotOccupied(masterId, date, tStr)) {
            free = false;
            break;
          }
        }
        result.push({ time, available: free });
      }
    }
    return result;
  }

  function applyPromo(price, code) {
    if (!code) return { price, discount: 0, promo: null };
    const promo = ELEGIA.promotions.find(
      (p) => p.code.toUpperCase() === code.trim().toUpperCase()
    );
    if (!promo) return { price, discount: 0, promo: null, error: 'Промокод не найден' };
    const discount = Math.round((price * promo.discount) / 100);
    return { price: price - discount, discount, promo };
  }

  /**
   * Подтверждение записи → localStorage + отправка в Telegram API
   */
  async function confirm() {
    if (!canGoNext() && getStep() !== 'form') return null;
    if (!isFormValid() || !state.serviceId || !state.masterId || !state.date || !state.time) {
      return null;
    }

    // Повторная проверка слота
    const slots = getAvailableSlots(state.masterId, state.date, state.serviceId);
    const slot = slots.find((s) => s.time === state.time);
    if (!slot || !slot.available) {
      return { error: 'К сожалению, это время уже занято. Выберите другой слот.' };
    }

    const service = getService();
    const master = getMaster();
    const promoResult = applyPromo(service.price, state.promoCode);

    const booking = {
      id: Storage.generateId(),
      serviceId: service.id,
      serviceName: service.name,
      masterId: master.id,
      masterName: master.name,
      date: state.date,
      time: state.time,
      duration: service.duration,
      price: promoResult.price,
      originalPrice: service.price,
      discount: promoResult.discount,
      promoCode: promoResult.promo ? promoResult.promo.code : '',
      clientName: state.clientName.trim(),
      phone: state.phone.trim(),
      comment: state.comment.trim(),
      status: 'confirmed',
      telegramSent: false,
      telegramDetail: null,
      createdAt: new Date().toISOString(),
    };

    // Отправка в бот (если сервер запущен)
    let telegramResult = null;
    if (typeof TelegramAPI !== 'undefined') {
      telegramResult = await TelegramAPI.sendBooking(booking);
      booking.telegramSent = Boolean(telegramResult.ok && telegramResult.telegram?.sent);
      booking.telegramDetail = telegramResult.telegram || null;
      booking.telegramMessage =
        telegramResult.message ||
        (telegramResult.offline
          ? 'Сервер бота недоступен — запись только на сайте'
          : '');
      // Синхронизируем id, если сервер вернул свой
      if (telegramResult.booking?.id) {
        booking.serverId = telegramResult.booking.id;
      }
    } else {
      booking.telegramMessage = 'Модуль Telegram API не подключён';
    }

    Storage.saveBooking(booking);

    Storage.setClient({
      name: booking.clientName,
      phone: booking.phone,
    });

    state.bookingId = booking.id;
    state.lastTelegramResult = telegramResult;
    stepIndex = STEPS.indexOf('success');

    return { booking, telegram: telegramResult };
  }

  return {
    STEPS,
    reset,
    getState,
    getStep,
    getStepIndex,
    canGoNext,
    isFormValid,
    next,
    prev,
    goTo,
    selectService,
    selectMaster,
    selectDate,
    selectTime,
    setFormField,
    getService,
    getMaster,
    getMastersForService,
    getAvailableSlots,
    applyPromo,
    confirm,
  };
})();
