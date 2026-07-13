/**
 * Логика записи и меню Telegram-бота Элегия
 */
const catalog = require('./catalog');

const sessions = new Map(); // chatId -> draft

function getSession(chatId) {
  return sessions.get(String(chatId)) || null;
}

function setSession(chatId, data) {
  sessions.set(String(chatId), data);
}

function clearSession(chatId) {
  sessions.delete(String(chatId));
}

function getService(id) {
  return catalog.services.find((s) => s.id === id) || null;
}

function getMaster(id) {
  return catalog.masters.find((m) => m.id === id) || null;
}

function mastersForService(serviceId) {
  return catalog.masters.filter((m) => m.serviceIds.includes(serviceId));
}

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}

function formatDuration(min) {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

function formatDateRu(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
}

function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function mainKeyboard(isAdmin) {
  const rows = [
    [{ text: '📅 Записаться' }, { text: '📋 Мои записи' }],
    [{ text: '💅 Услуги' }, { text: '👩‍🎨 Мастера' }],
    [{ text: '📞 Контакты' }, { text: '❓ Помощь' }],
  ];
  if (isAdmin) {
    rows.push([{ text: '🗂 Сегодня' }, { text: '📑 Все записи' }]);
  }
  return {
    keyboard: rows,
    resize_keyboard: true,
    is_persistent: true,
  };
}

function cancelInline() {
  return {
    inline_keyboard: [[{ text: '❌ Отменить запись', callback_data: 'b:x' }]],
  };
}

function servicesKeyboard() {
  const rows = catalog.services.map((s) => [
    {
      text: `${s.name} · ${formatPrice(s.price)}`,
      callback_data: `b:s:${s.id}`,
    },
  ]);
  rows.push([{ text: '« В меню', callback_data: 'menu' }]);
  return { inline_keyboard: rows };
}

function mastersKeyboard(serviceId) {
  const list = mastersForService(serviceId);
  const rows = list.map((m) => [
    {
      text: `${m.name} ★${m.rating}`,
      callback_data: `b:m:${m.id}`,
    },
  ]);
  rows.push([
    { text: '« Услуги', callback_data: 'b:start' },
    { text: '❌ Отмена', callback_data: 'b:x' },
  ]);
  return { inline_keyboard: rows };
}

function datesKeyboard() {
  const rows = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let row = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    // пропускаем воскресенье? оставляем все дни
    const iso = toISO(d);
    const label = d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    });
    row.push({ text: label, callback_data: `b:d:${iso}` });
    if (row.length === 2) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  rows.push([
    { text: '« Мастера', callback_data: 'b:back:master' },
    { text: '❌ Отмена', callback_data: 'b:x' },
  ]);
  return { inline_keyboard: rows };
}

/**
 * Свободные слоты с учётом существующих записей
 */
function getAvailableSlots(masterId, date, serviceId, bookings) {
  const service = getService(serviceId);
  if (!service) return [];
  const { openHour, closeHour, slotStep } = catalog.schedule;
  const duration = service.duration;
  const slotsNeeded = Math.ceil(duration / slotStep);

  const occupied = new Set();
  for (const b of bookings) {
    if (b.status === 'cancelled') continue;
    if (b.masterId !== masterId || b.date !== date) continue;
    const bDur = b.duration || 60;
    const bSlots = Math.ceil(bDur / slotStep);
    let [h, m] = b.time.split(':').map(Number);
    for (let i = 0; i < bSlots; i++) {
      occupied.add(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      );
      m += slotStep;
      if (m >= 60) {
        h += 1;
        m -= 60;
      }
    }
  }

  const result = [];
  for (let h = openHour; h < closeHour; h++) {
    for (let m = 0; m < 60; m += slotStep) {
      const startMin = h * 60 + m;
      if (startMin + duration > closeHour * 60) continue;
      const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      let free = true;
      for (let i = 0; i < slotsNeeded; i++) {
        const tMin = startMin + i * slotStep;
        const th = Math.floor(tMin / 60);
        const tm = tMin % 60;
        const tStr = `${String(th).padStart(2, '0')}:${String(tm).padStart(2, '0')}`;
        if (occupied.has(tStr)) {
          free = false;
          break;
        }
      }
      if (free) result.push(time);
    }
  }
  return result;
}

function timesKeyboard(slots) {
  const rows = [];
  let row = [];
  for (const t of slots) {
    row.push({ text: t, callback_data: `b:t:${t}` });
    if (row.length === 4) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  rows.push([
    { text: '« Дата', callback_data: 'b:back:date' },
    { text: '❌ Отмена', callback_data: 'b:x' },
  ]);
  return { inline_keyboard: rows };
}

function confirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить', callback_data: 'b:ok' },
        { text: '❌ Отмена', callback_data: 'b:x' },
      ],
    ],
  };
}

function myBookingsKeyboard(list) {
  const rows = list.map((b) => [
    {
      text: `❌ Отменить ${b.time} ${b.serviceName.slice(0, 18)}`,
      callback_data: `c:${b.id}`,
    },
  ]);
  rows.push([
    { text: '📅 Новая запись', callback_data: 'b:start' },
    { text: '« Меню', callback_data: 'menu' },
  ]);
  return { inline_keyboard: rows };
}

function servicesListText() {
  const byCat = {};
  for (const c of catalog.categories) byCat[c.id] = [];
  for (const s of catalog.services) {
    if (!byCat[s.category]) byCat[s.category] = [];
    byCat[s.category].push(s);
  }
  let text = '💅 *Услуги салона Элегия*\n\n';
  for (const c of catalog.categories) {
    const list = byCat[c.id] || [];
    if (!list.length) continue;
    text += `${c.icon} *${c.name}*\n`;
    for (const s of list) {
      text += `• ${s.name} — ${formatPrice(s.price)} (${formatDuration(s.duration)})\n`;
    }
    text += '\n';
  }
  text += 'Нажмите «📅 Записаться», чтобы выбрать услугу.';
  return text;
}

function mastersListText() {
  let text = '👩‍🎨 *Наши мастера*\n\n';
  for (const m of catalog.masters) {
    text += `*${m.name}* ★${m.rating}\n${m.role}\n\n`;
  }
  return text;
}

function contactsText() {
  const c = catalog.contacts;
  return (
    `📞 *Контакты Элегия*\n\n` +
    `📍 ${c.address}\n` +
    `☎️ ${c.phone}\n` +
    `🕐 ${c.hours}`
  );
}

function draftSummary(draft) {
  const s = getService(draft.serviceId);
  const m = getMaster(draft.masterId);
  return (
    `📋 *Проверьте запись*\n\n` +
    `Услуга: ${s ? s.name : '—'}\n` +
    `Мастер: ${m ? m.name : '—'}\n` +
    `Дата: ${formatDateRu(draft.date)}\n` +
    `Время: ${draft.time}\n` +
    `Длительность: ${s ? formatDuration(s.duration) : '—'}\n` +
    `Цена: ${s ? formatPrice(s.price) : '—'}\n` +
    `Имя: ${draft.clientName || '—'}\n` +
    `Телефон: ${draft.phone || '—'}`
  );
}

/**
 * Создаёт объект записи из черновика
 */
function buildBooking(draft, chatId) {
  const s = getService(draft.serviceId);
  const m = getMaster(draft.masterId);
  if (!s || !m || !draft.date || !draft.time) return null;
  return {
    id: `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    serviceId: s.id,
    serviceName: s.name,
    masterId: m.id,
    masterName: m.name,
    date: draft.date,
    time: draft.time,
    duration: s.duration,
    price: s.price,
    originalPrice: s.price,
    discount: 0,
    promoCode: '',
    clientName: (draft.clientName || '').trim(),
    phone: (draft.phone || '').trim(),
    comment: draft.comment || '',
    status: 'confirmed',
    source: 'telegram',
    telegramChatId: chatId,
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  catalog,
  getSession,
  setSession,
  clearSession,
  getService,
  getMaster,
  mastersForService,
  formatPrice,
  formatDuration,
  formatDateRu,
  mainKeyboard,
  servicesKeyboard,
  mastersKeyboard,
  datesKeyboard,
  timesKeyboard,
  confirmKeyboard,
  myBookingsKeyboard,
  cancelInline,
  servicesListText,
  mastersListText,
  contactsText,
  draftSummary,
  getAvailableSlots,
  buildBooking,
};
