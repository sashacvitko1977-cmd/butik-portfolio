# Элегия Beauty Studio

Премиальный сайт салона красоты с системой онлайн-записи.  
Только HTML5, CSS3 и vanilla JavaScript + Tailwind CSS (CDN).

## Структура проекта

```
elegiya-beauty/
├── index.html          # Единая страница (SPA-навигация по секциям)
├── css/
│   └── styles.css
├── js/
│   ├── data.js
│   ├── storage.js
│   ├── theme.js
│   ├── calendar.js
│   ├── telegram-api.js # Клиент API бота
│   ├── booking.js
│   └── app.js
├── bot/                # Telegram-бот + REST API
│   ├── server.js
│   ├── package.json
│   ├── start.bat       # Запуск одним кликом
│   ├── .env.example
│   ├── BOT_SETUP.md    # Пошаговая настройка
│   └── data/           # bookings.json, users.json
└── README.md
```

## Запуск

Откройте `index.html` в браузере (двойной клик) или через локальный сервер:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .
```

Рекомендуется локальный сервер — так корректнее работают модули и пути.

## Функционал

- **Онлайн-запись**: услуга → мастер → дата → время → форма → подтверждение
- **Telegram-бот**: реальные уведомления админу и клиенту
- **Личный кабинет**: вход по телефону, история и предстоящие визиты
- **Календарь и тайм-слоты** с учётом занятых слотов
- **Отзывы, галерея, акции, портфолио мастеров**
- **Светлая / тёмная тема**
- Данные сайта в **localStorage**, записи бота — в `bot/data/`

## Telegram-бот (рабочий)

Подробно: [`bot/BOT_SETUP.md`](bot/BOT_SETUP.md)

```bat
cd E:\elegiya-beauty\bot
copy .env.example .env
:: вставьте BOT_TOKEN от @BotFather в .env
start.bat
```

1. Создайте бота у [@BotFather](https://t.me/BotFather)
2. Пропишите `BOT_TOKEN` в `bot/.env`
3. Запустите `bot/start.bat`
4. Напишите боту `/id` → вставьте число в `ADMIN_CHAT_ID`
5. Откройте сайт и сделайте запись — сообщение придёт в Telegram

## Цветовая палитра

Мягкий бежевый, пудровый розовый, золото, белый, глубокий чёрный — премиум-стиль.
