/**
 * Элегия Beauty Studio — Telegram-бот + REST API
 *
 * • Запись из бота (кнопки): услуга → мастер → дата → время → контакты
 * • Мои записи / отмена
 * • Приём записей с сайта
 * • Уведомления админу
 */

require('dotenv').config();
const dns = require('dns');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const flow = require('./flow');

// Windows / некоторые сети: IPv6 к api.telegram.org зависает
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {
  /* Node < 17 */
}
try {
  const net = require('net');
  if (typeof net.setDefaultAutoSelectFamily === 'function') {
    net.setDefaultAutoSelectFamily(false);
  }
} catch (_) {
  /* ignore */
}

const PORT = Number(process.env.PORT) || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN;
let ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID
  ? String(process.env.ADMIN_CHAT_ID).trim()
  : '';
const BOT_USERNAME = (process.env.BOT_USERNAME || 'elegiya_beauty_bot').replace(
  /^@/,
  ''
);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/**
 * Прокси: в РФ Telegram часто недоступен напрямую.
 * Берём HTTPS_PROXY / HTTP_PROXY / TELEGRAM_PROXY, иначе системный 127.0.0.1:10809
 */
function resolveProxy() {
  const fromEnv =
    process.env.TELEGRAM_PROXY ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy ||
    '';
  if (fromEnv) return fromEnv.trim();
  // Типичный локальный клиент (Clash / v2rayN / Hiddify)
  return 'http://127.0.0.1:10809';
}

const PROXY_URL = resolveProxy();
// Чтобы request внутри node-telegram-bot-api тоже видел прокси
if (PROXY_URL) {
  process.env.HTTPS_PROXY = process.env.HTTPS_PROXY || PROXY_URL;
  process.env.HTTP_PROXY = process.env.HTTP_PROXY || PROXY_URL;
  process.env.https_proxy = process.env.https_proxy || PROXY_URL;
  process.env.http_proxy = process.env.http_proxy || PROXY_URL;
}

const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

/* ========== Storage ========== */

function ensureData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BOOKINGS_FILE)) fs.writeFileSync(BOOKINGS_FILE, '[]');
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
  // Восстановить ADMIN_CHAT_ID из файла, если не задан в .env
  if (!ADMIN_CHAT_ID && fs.existsSync(ADMIN_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
      if (saved.chatId) ADMIN_CHAT_ID = String(saved.chatId);
    } catch (_) {
      /* ignore */
    }
  }
}

function setAdminChatId(chatId) {
  ADMIN_CHAT_ID = String(chatId);
  writeJson(ADMIN_FILE, {
    chatId: ADMIN_CHAT_ID,
    savedAt: new Date().toISOString(),
  });
  console.log(`👑 ADMIN_CHAT_ID сохранён: ${ADMIN_CHAT_ID}`);
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getBookings() {
  return readJson(BOOKINGS_FILE, []);
}

function saveBookings(list) {
  writeJson(BOOKINGS_FILE, list);
}

function getUsers() {
  return readJson(USERS_FILE, {});
}

function saveUsers(users) {
  writeJson(USERS_FILE, users);
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}

function formatDateRu(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });
}

function bookingText(b, title) {
  const lines = [
    title || '✨ Новая запись — Элегия',
    '',
    `📋 Услуга: ${b.serviceName}`,
    `👩‍🎨 Мастер: ${b.masterName}`,
    `📅 Дата: ${formatDateRu(b.date)}`,
    `🕐 Время: ${b.time}`,
    `⏱ Длительность: ${b.duration || '—'} мин`,
    `💰 Сумма: ${formatPrice(b.price)}`,
  ];
  if (b.promoCode) lines.push(`🏷 Промокод: ${b.promoCode}`);
  lines.push('', `👤 Клиент: ${b.clientName}`, `📞 Телефон: ${b.phone}`);
  if (b.comment) lines.push(`💬 Комментарий: ${b.comment}`);
  lines.push('', `🆔 ${b.id}`);
  return lines.join('\n');
}

/* ========== Telegram bot ========== */

let bot = null;
let botReady = false;
let botInfo = null;

function ensureUser(msg) {
  const chatId = msg.chat.id;
  const users = getUsers();
  const key = String(chatId);
  if (!users[key]) {
    users[key] = {
      chatId,
      username: msg.from?.username || '',
      firstName: msg.from?.first_name || '',
      phone: '',
      name: msg.from?.first_name || '',
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
  }
  return users[key];
}

function updateUser(chatId, patch) {
  const users = getUsers();
  const key = String(chatId);
  users[key] = { ...(users[key] || { chatId }), ...patch, chatId };
  saveUsers(users);
  return users[key];
}

function getUserBookings(chatId, phone, includePast = false) {
  const user = getUsers()[String(chatId)];
  const phones = new Set();
  if (phone) phones.add(normalizePhone(phone));
  if (user?.phone) phones.add(normalizePhone(user.phone));

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return getBookings()
    .filter((b) => {
      if (b.status === 'cancelled' && !includePast) return false;
      const byPhone =
        phones.size && phones.has(normalizePhone(b.phone));
      const byChat = String(b.telegramChatId) === String(chatId);
      if (!byPhone && !byChat) return false;
      if (includePast) return true;
      return new Date(b.date + 'T00:00:00') >= now && b.status !== 'cancelled';
    })
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

async function sendMainMenu(instance, chatId, text) {
  await instance.sendMessage(
    chatId,
    text ||
      '✨ *Элегия Beauty Studio*\n\nВыберите действие в меню ниже или нажмите «📅 Записаться».',
    {
      parse_mode: 'Markdown',
      reply_markup: flow.mainKeyboard(isAdmin(chatId)),
    }
  );
}

async function startBooking(instance, chatId) {
  flow.setSession(chatId, {
    step: 'service',
    serviceId: null,
    masterId: null,
    date: null,
    time: null,
    clientName: '',
    phone: '',
  });
  await instance.sendMessage(chatId, '📅 *Новая запись*\n\nВыберите услугу:', {
    parse_mode: 'Markdown',
    reply_markup: flow.servicesKeyboard(),
  });
}

async function showMyBookings(instance, chatId) {
  const list = getUserBookings(chatId);
  if (!list.length) {
    await instance.sendMessage(
      chatId,
      '📋 У вас нет предстоящих записей.\nНажмите «📅 Записаться», чтобы выбрать услугу.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Записаться', callback_data: 'b:start' }],
          ],
        },
      }
    );
    return;
  }
  const text =
    '📋 *Ваши записи*\n\n' +
    list
      .map(
        (b, i) =>
          `${i + 1}. *${b.serviceName}*\n` +
          `   ${flow.formatDateRu(b.date)} · ${b.time}\n` +
          `   ${b.masterName} · ${flow.formatPrice(b.price)}\n` +
          `   ${b.status === 'cancelled' ? '❌ отменена' : '✅ подтверждена'}`
      )
      .join('\n\n');
  await instance.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: flow.myBookingsKeyboard(list.filter((b) => b.status !== 'cancelled')),
  });
}

async function showToday(instance, chatId) {
  if (!isAdmin(chatId)) {
    await instance.sendMessage(chatId, 'Команда только для администратора.');
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const list = getBookings()
    .filter((b) => b.date === today && b.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));
  if (!list.length) {
    await instance.sendMessage(chatId, 'На сегодня записей нет.');
    return;
  }
  const text =
    `🗂 *Сегодня (${today})* — ${list.length}\n\n` +
    list
      .map(
        (b) =>
          `• *${b.time}* ${b.serviceName}\n  ${b.clientName} · ${b.phone}\n  ${b.masterName}`
      )
      .join('\n\n');
  await instance.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function showAllBookings(instance, chatId) {
  if (!isAdmin(chatId)) {
    await instance.sendMessage(chatId, 'Команда только для администратора.');
    return;
  }
  const list = getBookings()
    .filter((b) => b.status !== 'cancelled')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, 20);
  if (!list.length) {
    await instance.sendMessage(chatId, 'Записей пока нет.');
    return;
  }
  const text =
    `📑 *Последние записи* (${list.length})\n\n` +
    list
      .map(
        (b) =>
          `• ${flow.formatDateRu(b.date)} ${b.time}\n  ${b.serviceName} · ${b.clientName}\n  ${b.phone}${b.source === 'telegram' ? ' · TG' : ' · сайт'}`
      )
      .join('\n\n');
  await instance.sendMessage(chatId, text, { parse_mode: 'Markdown' });
}

async function cancelBookingById(instance, chatId, id) {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx < 0) {
    await instance.sendMessage(chatId, 'Запись не найдена.');
    return;
  }
  const b = bookings[idx];
  const user = getUsers()[String(chatId)];
  const isOwner =
    String(b.telegramChatId) === String(chatId) ||
    (user?.phone && normalizePhone(user.phone) === normalizePhone(b.phone));
  if (!isOwner && !isAdmin(chatId)) {
    await instance.sendMessage(chatId, 'Нельзя отменить чужую запись.');
    return;
  }
  if (b.status === 'cancelled') {
    await instance.sendMessage(chatId, 'Эта запись уже отменена.');
    return;
  }
  bookings[idx] = {
    ...b,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  };
  saveBookings(bookings);
  await instance.sendMessage(
    chatId,
    `❌ Запись отменена:\n${b.serviceName}\n${flow.formatDateRu(b.date)} · ${b.time}`
  );
  if (ADMIN_CHAT_ID && String(chatId) !== String(ADMIN_CHAT_ID)) {
    await safeSend(
      ADMIN_CHAT_ID,
      `❌ Клиент отменил запись\n${bookingText(bookings[idx], 'Отмена')}`
    );
  }
}

async function finalizeBooking(instance, chatId, draft) {
  const booking = flow.buildBooking(draft, chatId);
  if (!booking) {
    await instance.sendMessage(chatId, 'Ошибка данных записи. Начните снова: «📅 Записаться»');
    flow.clearSession(chatId);
    return;
  }

  // проверка слота
  const free = flow.getAvailableSlots(
    booking.masterId,
    booking.date,
    booking.serviceId,
    getBookings()
  );
  if (!free.includes(booking.time)) {
    await instance.sendMessage(
      chatId,
      'К сожалению, это время только что заняли. Выберите другое.',
      { reply_markup: flow.timesKeyboard(free) }
    );
    draft.step = 'time';
    flow.setSession(chatId, draft);
    return;
  }

  const list = getBookings();
  list.push(booking);
  saveBookings(list);

  updateUser(chatId, {
    phone: booking.phone,
    name: booking.clientName,
    firstName: booking.clientName,
  });

  flow.clearSession(chatId);

  await instance.sendMessage(
    chatId,
    `✅ *Вы записаны!*\n\n` +
      `📋 ${booking.serviceName}\n` +
      `👩‍🎨 ${booking.masterName}\n` +
      `📅 ${flow.formatDateRu(booking.date)} · ${booking.time}\n` +
      `💰 ${flow.formatPrice(booking.price)}\n\n` +
      `Ждём вас в салоне Элегия ✨`,
    {
      parse_mode: 'Markdown',
      reply_markup: flow.mainKeyboard(isAdmin(chatId)),
    }
  );

  // админу (не дублировать, если клиент = админ)
  if (ADMIN_CHAT_ID && String(ADMIN_CHAT_ID) !== String(chatId)) {
    await safeSend(
      ADMIN_CHAT_ID,
      bookingText(booking, '✨ Новая запись (Telegram)')
    );
  } else if (ADMIN_CHAT_ID && String(ADMIN_CHAT_ID) === String(chatId)) {
    // админ сам записался — просто ок
  } else if (!ADMIN_CHAT_ID) {
    /* no admin */
  }
}

function initBot() {
  if (!BOT_TOKEN || BOT_TOKEN.includes('xxxx') || BOT_TOKEN.length < 20) {
    console.warn(
      '\n⚠️  BOT_TOKEN не задан. Пропишите токен в bot/.env\n'
    );
    return null;
  }

  console.log(`🌐 Прокси для Telegram: ${PROXY_URL || 'нет'}`);

  const instance = new TelegramBot(BOT_TOKEN, {
    polling: {
      interval: 1000,
      autoStart: true,
      params: { timeout: 10 },
    },
    request: {
      proxy: PROXY_URL || undefined,
      timeout: 60000,
      forever: true,
    },
  });

  instance
    .getMe()
    .then((me) => {
      botInfo = me;
      botReady = true;
      console.log(`🤖 Бот @${me.username} запущен (id: ${me.id})`);
      if (ADMIN_CHAT_ID) console.log(`👑 Админ chat id: ${ADMIN_CHAT_ID}`);
      else
        console.log(
          'ℹ️  Напишите боту /start — первый пользователь станет админом'
        );
    })
    .catch((err) => {
      console.error('❌ Ошибка Telegram:', err.message);
      botReady = false;
    });

  instance.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
  });

  /* —— /start —— */
  instance.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const payload = (match[1] || '').trim();
    ensureUser(msg);

    if (!ADMIN_CHAT_ID) {
      setAdminChatId(chatId);
      await instance.sendMessage(
        chatId,
        `👑 Вы назначены администратором.\nЗаписи с сайта и из бота будут приходить сюда.`
      );
    }

    if (payload.startsWith('phone_')) {
      const phone = normalizePhone(payload.replace('phone_', ''));
      if (phone.length >= 10) {
        updateUser(chatId, { phone, linkedAt: new Date().toISOString() });
        await instance.sendMessage(chatId, '✅ Телефон привязан.');
      }
    }

    if (payload === 'book' || payload.startsWith('book')) {
      await startBooking(instance, chatId);
      return;
    }

    const name = msg.from?.first_name || 'гость';
    await sendMainMenu(
      instance,
      chatId,
      `Здравствуйте, ${name}! ✨\n\n` +
        `*Элегия Beauty Studio*\n` +
        `Запишитесь на услугу прямо здесь или посмотрите свои визиты.`
    );
  });

  instance.onText(/\/help|\/menu/, async (msg) => {
    ensureUser(msg);
    await sendMainMenu(
      instance,
      msg.chat.id,
      `📖 *Помощь*\n\n` +
        `📅 *Записаться* — мастер, дата и время\n` +
        `📋 *Мои записи* — визиты и отмена\n` +
        `💅 *Услуги* / 👩‍🎨 *Мастера* — каталог\n` +
        `Можно писать команды: /book /my /services\n` +
        (isAdmin(msg.chat.id)
          ? `\n*Админ:* 🗂 Сегодня · 📑 Все записи`
          : '')
    );
  });

  instance.onText(/\/book|\/zapis/i, async (msg) => {
    ensureUser(msg);
    await startBooking(instance, msg.chat.id);
  });

  instance.onText(/\/my/, async (msg) => {
    ensureUser(msg);
    await showMyBookings(instance, msg.chat.id);
  });

  instance.onText(/\/services|\/uslugi/i, async (msg) => {
    await instance.sendMessage(msg.chat.id, flow.servicesListText(), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📅 Записаться', callback_data: 'b:start' }]],
      },
    });
  });

  instance.onText(/\/masters/i, async (msg) => {
    await instance.sendMessage(msg.chat.id, flow.mastersListText(), {
      parse_mode: 'Markdown',
    });
  });

  instance.onText(/\/id/, async (msg) => {
    await instance.sendMessage(
      msg.chat.id,
      `Chat ID: \`${msg.chat.id}\`\nАдмин: ${isAdmin(msg.chat.id) ? 'да' : 'нет'}`,
      { parse_mode: 'Markdown' }
    );
  });

  instance.onText(/\/today/, async (msg) => {
    await showToday(instance, msg.chat.id);
  });

  instance.onText(/\/list/, async (msg) => {
    await showAllBookings(instance, msg.chat.id);
  });

  instance.onText(/\/link(?:\s+(.+))?/, async (msg, match) => {
    const raw = (match[1] || '').trim();
    if (!raw) {
      await instance.sendMessage(
        msg.chat.id,
        'Отправьте: `/link +7 999 123-45-67`\nили нажмите кнопку контакта при записи.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
    const phone = normalizePhone(raw);
    if (phone.length < 10) {
      await instance.sendMessage(msg.chat.id, 'Некорректный телефон.');
      return;
    }
    updateUser(msg.chat.id, { phone, linkedAt: new Date().toISOString() });
    await instance.sendMessage(msg.chat.id, '✅ Телефон привязан. /my');
  });

  instance.onText(/\/cancel(?:\s+|_)(.+)/, async (msg, match) => {
    const id = (match[1] || '').trim().replace(/\\_/g, '_');
    await cancelBookingById(instance, msg.chat.id, id);
  });

  /* —— Кнопки меню (текст) —— */
  instance.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    ensureUser(msg);

    // черновик: ввод имени / телефона
    const draft = flow.getSession(chatId);
    if (draft?.step === 'name') {
      if (text.length < 2) {
        await instance.sendMessage(chatId, 'Введите имя (минимум 2 буквы).');
        return;
      }
      draft.clientName = text;
      draft.step = 'phone';
      flow.setSession(chatId, draft);
      const user = getUsers()[String(chatId)];
      await instance.sendMessage(
        chatId,
        'Отправьте номер телефона или нажмите кнопку:',
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 Отправить мой телефон', request_contact: true }],
              ...(user?.phone
                ? [[{ text: `Использовать ${user.phone}` }]]
                : []),
              [{ text: '❌ Отменить запись' }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return;
    }

    if (draft?.step === 'phone') {
      if (text === '❌ Отменить запись') {
        flow.clearSession(chatId);
        await sendMainMenu(instance, chatId, 'Запись отменена.');
        return;
      }
      let phone = text;
      const user = getUsers()[String(chatId)];
      if (text.startsWith('Использовать ') && user?.phone) {
        phone = user.phone;
      }
      const norm = normalizePhone(phone);
      if (norm.length < 10) {
        await instance.sendMessage(chatId, 'Введите телефон, например +7 999 123-45-67');
        return;
      }
      draft.phone = phone;
      draft.step = 'confirm';
      flow.setSession(chatId, draft);
      await instance.sendMessage(chatId, flow.draftSummary(draft), {
        parse_mode: 'Markdown',
        reply_markup: flow.confirmKeyboard(),
      });
      await instance.sendMessage(chatId, 'Меню:', {
        reply_markup: flow.mainKeyboard(isAdmin(chatId)),
      });
      return;
    }

    // главное меню
    if (text === '📅 Записаться' || text === 'Записаться') {
      await startBooking(instance, chatId);
      return;
    }
    if (text === '📋 Мои записи' || text === 'Мои записи') {
      await showMyBookings(instance, chatId);
      return;
    }
    if (text === '💅 Услуги' || text === 'Услуги') {
      await instance.sendMessage(chatId, flow.servicesListText(), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Записаться', callback_data: 'b:start' }],
          ],
        },
      });
      return;
    }
    if (text === '👩‍🎨 Мастера' || text === 'Мастера') {
      await instance.sendMessage(chatId, flow.mastersListText(), {
        parse_mode: 'Markdown',
      });
      return;
    }
    if (text === '📞 Контакты' || text === 'Контакты') {
      await instance.sendMessage(chatId, flow.contactsText(), {
        parse_mode: 'Markdown',
      });
      return;
    }
    if (text === '❓ Помощь' || text === 'Помощь') {
      await sendMainMenu(
        instance,
        chatId,
        'Нажмите «📅 Записаться» и следуйте шагам: услуга → мастер → дата → время.'
      );
      return;
    }
    if (text === '🗂 Сегодня') {
      await showToday(instance, chatId);
      return;
    }
    if (text === '📑 Все записи') {
      await showAllBookings(instance, chatId);
      return;
    }
    if (text === '❌ Отменить запись') {
      flow.clearSession(chatId);
      await sendMainMenu(instance, chatId, 'Запись отменена.');
    }
  });

  /* —— Контакт —— */
  instance.on('contact', async (msg) => {
    if (!msg.contact) return;
    const chatId = msg.chat.id;
    const phone = normalizePhone(msg.contact.phone_number);
    updateUser(chatId, {
      phone,
      linkedAt: new Date().toISOString(),
      name: msg.contact.first_name || msg.from?.first_name || '',
    });

    const draft = flow.getSession(chatId);
    if (draft?.step === 'phone' || draft?.step === 'name') {
      if (!draft.clientName) {
        draft.clientName =
          msg.contact.first_name || msg.from?.first_name || 'Клиент';
      }
      draft.phone = msg.contact.phone_number;
      draft.step = 'confirm';
      flow.setSession(chatId, draft);
      await instance.sendMessage(chatId, flow.draftSummary(draft), {
        parse_mode: 'Markdown',
        reply_markup: flow.confirmKeyboard(),
      });
      await instance.sendMessage(chatId, 'Меню:', {
        reply_markup: flow.mainKeyboard(isAdmin(chatId)),
      });
      return;
    }

    await instance.sendMessage(
      chatId,
      '✅ Телефон сохранён. «📋 Мои записи» — ваши визиты.',
      { reply_markup: flow.mainKeyboard(isAdmin(chatId)) }
    );
  });

  /* —— Inline-кнопки —— */
  instance.on('callback_query', async (q) => {
    const chatId = q.message.chat.id;
    const data = q.data || '';
    ensureUser({ chat: q.message.chat, from: q.from });

    try {
      await instance.answerCallbackQuery(q.id);
    } catch (_) {
      /* ignore */
    }

    // меню
    if (data === 'menu') {
      flow.clearSession(chatId);
      await sendMainMenu(instance, chatId);
      return;
    }

    // отмена записи по id
    if (data.startsWith('c:')) {
      const id = data.slice(2);
      await cancelBookingById(instance, chatId, id);
      await showMyBookings(instance, chatId);
      return;
    }

    // отмена мастера записи
    if (data === 'b:x') {
      flow.clearSession(chatId);
      await instance.sendMessage(chatId, 'Запись отменена.', {
        reply_markup: flow.mainKeyboard(isAdmin(chatId)),
      });
      return;
    }

    if (data === 'b:start') {
      await startBooking(instance, chatId);
      return;
    }

    // выбор услуги
    if (data.startsWith('b:s:')) {
      const serviceId = data.slice(4);
      const service = flow.getService(serviceId);
      if (!service) return;
      flow.setSession(chatId, {
        step: 'master',
        serviceId,
        masterId: null,
        date: null,
        time: null,
        clientName: '',
        phone: '',
      });
      await instance.sendMessage(
        chatId,
        `✅ Услуга: *${service.name}*\n${flow.formatPrice(service.price)} · ${flow.formatDuration(service.duration)}\n\nВыберите мастера:`,
        {
          parse_mode: 'Markdown',
          reply_markup: flow.mastersKeyboard(serviceId),
        }
      );
      return;
    }

    // выбор мастера
    if (data.startsWith('b:m:')) {
      const masterId = data.slice(4);
      const draft = flow.getSession(chatId) || {};
      if (!draft.serviceId) {
        await startBooking(instance, chatId);
        return;
      }
      const master = flow.getMaster(masterId);
      if (!master) return;
      draft.masterId = masterId;
      draft.step = 'date';
      flow.setSession(chatId, draft);
      await instance.sendMessage(
        chatId,
        `✅ Мастер: *${master.name}*\n\nВыберите дату:`,
        {
          parse_mode: 'Markdown',
          reply_markup: flow.datesKeyboard(),
        }
      );
      return;
    }

    // назад
    if (data === 'b:back:master') {
      const draft = flow.getSession(chatId);
      if (!draft?.serviceId) {
        await startBooking(instance, chatId);
        return;
      }
      draft.step = 'master';
      flow.setSession(chatId, draft);
      await instance.sendMessage(chatId, 'Выберите мастера:', {
        reply_markup: flow.mastersKeyboard(draft.serviceId),
      });
      return;
    }

    if (data === 'b:back:date') {
      const draft = flow.getSession(chatId);
      if (!draft) {
        await startBooking(instance, chatId);
        return;
      }
      draft.step = 'date';
      flow.setSession(chatId, draft);
      await instance.sendMessage(chatId, 'Выберите дату:', {
        reply_markup: flow.datesKeyboard(),
      });
      return;
    }

    // дата
    if (data.startsWith('b:d:')) {
      const date = data.slice(4);
      const draft = flow.getSession(chatId);
      if (!draft?.serviceId || !draft?.masterId) {
        await startBooking(instance, chatId);
        return;
      }
      draft.date = date;
      draft.step = 'time';
      flow.setSession(chatId, draft);
      const slots = flow.getAvailableSlots(
        draft.masterId,
        date,
        draft.serviceId,
        getBookings()
      );
      if (!slots.length) {
        await instance.sendMessage(
          chatId,
          `На ${flow.formatDateRu(date)} нет свободного времени.\nВыберите другую дату:`,
          { reply_markup: flow.datesKeyboard() }
        );
        return;
      }
      await instance.sendMessage(
        chatId,
        `📅 ${flow.formatDateRu(date)}\nВыберите время:`,
        { reply_markup: flow.timesKeyboard(slots) }
      );
      return;
    }

    // время
    if (data.startsWith('b:t:')) {
      const time = data.slice(4);
      const draft = flow.getSession(chatId);
      if (!draft?.serviceId || !draft?.masterId || !draft?.date) {
        await startBooking(instance, chatId);
        return;
      }
      draft.time = time;
      const user = getUsers()[String(chatId)];
      draft.clientName = user?.name || user?.firstName || q.from?.first_name || '';
      draft.phone = user?.phone || '';

      if (draft.clientName && draft.phone && normalizePhone(draft.phone).length >= 10) {
        draft.step = 'confirm';
        flow.setSession(chatId, draft);
        await instance.sendMessage(chatId, flow.draftSummary(draft), {
          parse_mode: 'Markdown',
          reply_markup: flow.confirmKeyboard(),
        });
        return;
      }

      draft.step = 'name';
      flow.setSession(chatId, draft);
      await instance.sendMessage(
        chatId,
        draft.clientName
          ? `Ваше имя: *${draft.clientName}*\nЕсли верно — отправьте его ещё раз или введите другое.`
          : 'Как вас зовут? Напишите имя:',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // подтверждение
    if (data === 'b:ok') {
      const draft = flow.getSession(chatId);
      if (!draft || draft.step !== 'confirm') {
        await instance.sendMessage(
          chatId,
          'Сессия устарела. Нажмите «📅 Записаться».'
        );
        return;
      }
      await finalizeBooking(instance, chatId, draft);
    }
  });

  return instance;
}

function isAdmin(chatId) {
  return ADMIN_CHAT_ID && String(chatId) === String(ADMIN_CHAT_ID);
}

async function safeSend(chatId, text, options) {
  if (!bot || !chatId) return { ok: false, error: 'bot_or_chat_missing' };
  try {
    await bot.sendMessage(chatId, text, options);
    return { ok: true };
  } catch (err) {
    console.error('sendMessage failed:', err.message);
    return { ok: false, error: err.message };
  }
}

function findUserChatByPhone(phone) {
  const n = normalizePhone(phone);
  const users = getUsers();
  for (const u of Object.values(users)) {
    if (u.phone && normalizePhone(u.phone) === n) return u.chatId;
  }
  return null;
}

/**
 * Уведомления: админ + клиент (если привязан)
 */
async function notifyBooking(booking) {
  const results = { admin: null, client: null };

  if (ADMIN_CHAT_ID) {
    results.admin = await safeSend(
      ADMIN_CHAT_ID,
      bookingText(booking, '✨ Новая запись — Элегия')
    );
  } else {
    results.admin = { ok: false, error: 'ADMIN_CHAT_ID not set' };
  }

  const clientChat = findUserChatByPhone(booking.phone);
  if (clientChat) {
    results.client = await safeSend(
      clientChat,
      bookingText(
        booking,
        '✅ Ваша запись подтверждена — Элегия Beauty Studio'
      ) +
        '\n\nЖдём вас! Если планы изменятся — /my'
    );
  } else {
    results.client = {
      ok: false,
      error: 'client_not_linked',
      hint: 'Клиент ещё не привязал телефон в боте (/link)',
    };
  }

  return results;
}

/* ========== HTTP API ========== */

function createApp() {
  const app = express();
  app.use(
    cors({
      origin:
        CORS_ORIGIN === '*'
          ? true
          : CORS_ORIGIN.split(',').map((s) => s.trim()),
    })
  );
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'elegiya-bot',
      botReady,
      botUsername: botInfo?.username || BOT_USERNAME,
      adminConfigured: Boolean(ADMIN_CHAT_ID),
      time: new Date().toISOString(),
    });
  });

  app.get('/api/config', (_req, res) => {
    const username = botInfo?.username || BOT_USERNAME;
    res.json({
      botUsername: username,
      botUrl: `https://t.me/${username}`,
      botReady,
      adminConfigured: Boolean(ADMIN_CHAT_ID),
    });
  });

  /** Создать запись с сайта */
  app.post('/api/bookings', async (req, res) => {
    try {
      const body = req.body || {};
      const required = [
        'serviceName',
        'masterName',
        'date',
        'time',
        'clientName',
        'phone',
      ];
      for (const key of required) {
        if (!body[key]) {
          return res.status(400).json({ ok: false, error: `Поле ${key} обязательно` });
        }
      }

      const booking = {
        id: body.id || `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        serviceId: body.serviceId || '',
        serviceName: String(body.serviceName),
        masterId: body.masterId || '',
        masterName: String(body.masterName),
        date: String(body.date),
        time: String(body.time),
        duration: Number(body.duration) || 60,
        price: Number(body.price) || 0,
        originalPrice: Number(body.originalPrice) || Number(body.price) || 0,
        discount: Number(body.discount) || 0,
        promoCode: body.promoCode || '',
        clientName: String(body.clientName).trim(),
        phone: String(body.phone).trim(),
        comment: body.comment ? String(body.comment).trim() : '',
        status: 'confirmed',
        source: 'website',
        createdAt: new Date().toISOString(),
      };

      const list = getBookings();
      list.push(booking);
      saveBookings(list);

      let telegram = { admin: null, client: null };
      if (botReady) {
        telegram = await notifyBooking(booking);
      }

      const clientNotified = Boolean(telegram.client?.ok);
      const adminNotified = Boolean(telegram.admin?.ok);

      res.json({
        ok: true,
        booking,
        telegram: {
          sent: adminNotified || clientNotified,
          adminNotified,
          clientNotified,
          botReady,
          botUrl: `https://t.me/${botInfo?.username || BOT_USERNAME}`,
          message: clientNotified
            ? 'Подтверждение отправлено вам в Telegram.'
            : adminNotified
              ? 'Запись отправлена администратору в Telegram. Чтобы получать подтверждения лично — откройте бота и выполните /link с вашим телефоном.'
              : botReady
                ? 'Бот запущен, но ADMIN_CHAT_ID не настроен. Запись сохранена.'
                : 'Сервер принял запись. Telegram-бот не подключён (нет BOT_TOKEN).',
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  /** Список записей по телефону (для ЛК / синхронизации) */
  app.get('/api/bookings', (req, res) => {
    const phone = normalizePhone(req.query.phone || '');
    if (phone.length < 10) {
      return res.status(400).json({ ok: false, error: 'Укажите phone' });
    }
    const list = getBookings()
      .filter((b) => normalizePhone(b.phone) === phone)
      .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
    res.json({ ok: true, bookings: list });
  });

  /** Отмена с сайта */
  app.post('/api/bookings/:id/cancel', async (req, res) => {
    const list = getBookings();
    const idx = list.findIndex((b) => b.id === req.params.id);
    if (idx < 0) return res.status(404).json({ ok: false, error: 'not_found' });

    list[idx] = {
      ...list[idx],
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    };
    saveBookings(list);

    if (ADMIN_CHAT_ID && botReady) {
      await safeSend(
        ADMIN_CHAT_ID,
        bookingText(list[idx], '❌ Отмена записи (сайт)')
      );
    }

    res.json({ ok: true, booking: list[idx] });
  });

  return app;
}

/* ========== Boot ========== */

ensureData();
bot = initBot();
const app = createApp();

app.listen(PORT, () => {
  console.log(`\n🌿 Элегия API: http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
  console.log(`   Config:  http://localhost:${PORT}/api/config`);
  console.log(`   Bot:     https://t.me/${BOT_USERNAME}\n`);
});
