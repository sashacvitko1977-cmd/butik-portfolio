/**
 * Элегия Beauty Studio — демо-данные и константы
 */
const ELEGIA = {
  brand: {
    name: 'Элегия',
    fullName: 'Элегия Beauty Studio',
    tagline: 'Искусство красоты в каждой детали',
    phone: '+7 (495) 123-45-67',
    phoneRaw: '+74951234567',
    email: 'hello@elegiya.studio',
    address: 'Москва, ул. Патриаршие Пруды, 12',
    hours: 'Ежедневно 10:00 — 21:00',
    telegramBot: 'https://t.me/elegiya_beauty_bot', // живой бот @elegiya_beauty_bot
    instagram: 'https://instagram.com/elegiya.studio',
    mapEmbed:
      'https://yandex.ru/map-widget/v1/?ll=37.5925%2C55.7636&z=16&pt=37.5925,55.7636,pm2rdm',
  },

  /** Рабочие часы и шаг слота (минуты) */
  schedule: {
    openHour: 10,
    closeHour: 21,
    slotStep: 30,
  },

  categories: [
    { id: 'hair', name: 'Волосы', icon: '💇‍♀️' },
    { id: 'nails', name: 'Ногти', icon: '💅' },
    { id: 'makeup', name: 'Макияж', icon: '✨' },
    { id: 'brows', name: 'Брови и ресницы', icon: '👁️' },
    { id: 'care', name: 'Уход за лицом', icon: '🌸' },
    { id: 'body', name: 'Тело', icon: '🧴' },
  ],

  services: [
    {
      id: 'svc-cut',
      category: 'hair',
      name: 'Женская стрижка',
      description: 'Консультация, мытьё, стрижка и укладка. Индивидуальный подход к форме лица.',
      price: 4500,
      duration: 60,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
    },
    {
      id: 'svc-color',
      category: 'hair',
      name: 'Окрашивание',
      description: 'Полное окрашивание премиум-красителями. Включает уход и укладку.',
      price: 8900,
      duration: 150,
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    },
    {
      id: 'svc-balayage',
      category: 'hair',
      name: 'Балаяж / Airtouch',
      description: 'Мягкое мелирование и растяжка цвета. Естественный премиальный результат.',
      price: 14500,
      duration: 210,
      image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=80',
    },
    {
      id: 'svc-style',
      category: 'hair',
      name: 'Вечерняя укладка',
      description: 'Локоны, волны или гладкие причёски для особых случаев.',
      price: 5500,
      duration: 60,
      image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80',
    },
    {
      id: 'svc-manicure',
      category: 'nails',
      name: 'Маникюр + гель-лак',
      description: 'Аппаратный/комбинированный маникюр, покрытие премиум-гелем, дизайн по желанию.',
      price: 3200,
      duration: 90,
      image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
    },
    {
      id: 'svc-pedicure',
      category: 'nails',
      name: 'Педикюр SPA',
      description: 'Уход за стопами, маска, покрытие. Расслабляющий ритуал красоты.',
      price: 4200,
      duration: 90,
      image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80',
    },
    {
      id: 'svc-makeup',
      category: 'makeup',
      name: 'Вечерний макияж',
      description: 'Стойкий макияж люксовой косметикой. Идеально для мероприятий и съёмок.',
      price: 6500,
      duration: 75,
      image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=600&q=80',
    },
    {
      id: 'svc-bridal',
      category: 'makeup',
      name: 'Свадебный образ',
      description: 'Макияж + причёска. Пробный визит и день свадьбы — по запросу.',
      price: 18000,
      duration: 180,
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    },
    {
      id: 'svc-brows',
      category: 'brows',
      name: 'Коррекция и окрашивание бровей',
      description: 'Архитектура бровей, окрашивание краской или хной, фиксация.',
      price: 2800,
      duration: 45,
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    },
    {
      id: 'svc-lashes',
      category: 'brows',
      name: 'Ламинирование ресниц',
      description: 'Lift, питание и тонирование. Эффект «открытого взгляда» до 6 недель.',
      price: 3900,
      duration: 60,
      image: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=600&q=80',
    },
    {
      id: 'svc-facial',
      category: 'care',
      name: 'Уходовая процедура лица',
      description: 'Очищение, пилинг, маска и массаж. Косметика премиум-класса.',
      price: 7500,
      duration: 90,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
    },
    {
      id: 'svc-massage',
      category: 'body',
      name: 'Массаж лица и зоны декольте',
      description: 'Лимфодренажный и скульптурирующий массаж. Сияние и тонус кожи.',
      price: 5500,
      duration: 60,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80',
    },
  ],

  masters: [
    {
      id: 'm-anna',
      name: 'Анна Волкова',
      role: 'Арт-директор, колорист',
      specializations: ['hair'],
      serviceIds: ['svc-cut', 'svc-color', 'svc-balayage', 'svc-style'],
      rating: 4.98,
      reviewsCount: 214,
      experience: '12 лет',
      bio: 'Эксперт по сложным окрашиваниям и естественным оттенкам. Обучалась в Париже и Милане.',
      photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
        'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80',
      ],
    },
    {
      id: 'm-maria',
      name: 'Мария Соколова',
      role: 'Топ-стилист',
      specializations: ['hair'],
      serviceIds: ['svc-cut', 'svc-style', 'svc-color'],
      rating: 4.95,
      reviewsCount: 168,
      experience: '9 лет',
      bio: 'Мастер точных стрижек и идеальных укладок. Любит архитектурные формы и мягкие линии.',
      photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80',
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&q=80',
      ],
    },
    {
      id: 'm-elena',
      name: 'Елена Морозова',
      role: 'Nail-мастер',
      specializations: ['nails'],
      serviceIds: ['svc-manicure', 'svc-pedicure'],
      rating: 4.97,
      reviewsCount: 192,
      experience: '8 лет',
      bio: 'Минималистичный дизайн и безупречная техника. Работает только на премиум-материалах.',
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80',
        'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&q=80',
        'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&q=80',
      ],
    },
    {
      id: 'm-daria',
      name: 'Дарья Ким',
      role: 'Визажист',
      specializations: ['makeup'],
      serviceIds: ['svc-makeup', 'svc-bridal'],
      rating: 4.99,
      reviewsCount: 143,
      experience: '10 лет',
      bio: 'Свадебные и fashion-образы. Работала на показах и съёмках глянцевых изданий.',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&q=80',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80',
      ],
    },
    {
      id: 'm-sofia',
      name: 'София Орлова',
      role: 'Бровист / лашмейкер',
      specializations: ['brows'],
      serviceIds: ['svc-brows', 'svc-lashes'],
      rating: 4.96,
      reviewsCount: 127,
      experience: '6 лет',
      bio: 'Естественная архитектура бровей и мягкий lash-lift. Акцент на гармонию лица.',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80',
        'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?w=400&q=80',
      ],
    },
    {
      id: 'm-victoria',
      name: 'Виктория Лебедева',
      role: 'Косметолог-эстетист',
      specializations: ['care', 'body'],
      serviceIds: ['svc-facial', 'svc-massage'],
      rating: 4.94,
      reviewsCount: 98,
      experience: '11 лет',
      bio: 'Авторские протоколы ухода. Комбинирует аппаратные и ручные техники.',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80',
      portfolio: [
        'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80',
        'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80',
      ],
    },
  ],

  reviews: [
    {
      id: 'r1',
      name: 'Алина К.',
      photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&q=80',
      rating: 5,
      text: 'Делала балаяж у Анны — результат превзошёл ожидания. Цвет живой, уход на высшем уровне. Салон очень уютный и стильный.',
      service: 'Балаяж / Airtouch',
      date: '2026-06-12',
    },
    {
      id: 'r2',
      name: 'Екатерина М.',
      photo: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&h=100&fit=crop&q=80',
      rating: 5,
      text: 'Маникюр у Елены — эталон. Аккуратно, быстро, дизайн как с Pinterest. Записываюсь только сюда.',
      service: 'Маникюр + гель-лак',
      date: '2026-06-20',
    },
    {
      id: 'r3',
      name: 'Полина В.',
      photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop&q=80',
      rating: 5,
      text: 'Свадебный образ с Дарьей — просто вау. Всё держалось до утра, фотографии восхитительные. Спасибо, Элегия!',
      service: 'Свадебный образ',
      date: '2026-05-28',
    },
    {
      id: 'r4',
      name: 'Ирина С.',
      photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&q=80',
      rating: 5,
      text: 'Уходовая процедура у Виктории — кожа сияет уже вторую неделю. Атмосфера салона как в бутике Парижа.',
      service: 'Уходовая процедура лица',
      date: '2026-06-05',
    },
  ],

  gallery: [
    {
      id: 'g1',
      src: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      alt: 'Интерьер салона',
      category: 'salon',
    },
    {
      id: 'g2',
      src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
      alt: 'Окрашивание',
      category: 'hair',
    },
    {
      id: 'g3',
      src: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
      alt: 'Маникюр',
      category: 'nails',
    },
    {
      id: 'g4',
      src: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&q=80',
      alt: 'Макияж',
      category: 'makeup',
    },
    {
      id: 'g5',
      src: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80',
      alt: 'Стрижка',
      category: 'hair',
    },
    {
      id: 'g6',
      src: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
      alt: 'Уход',
      category: 'care',
    },
    {
      id: 'g7',
      src: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800&q=80',
      alt: 'Дизайн ногтей',
      category: 'nails',
    },
    {
      id: 'g8',
      src: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80',
      alt: 'Укладка',
      category: 'hair',
    },
  ],

  promotions: [
    {
      id: 'promo1',
      title: 'Первый визит −15%',
      description: 'Скидка 15% на любую услугу при первой записи онлайн. Укажите промокод FIRST15.',
      badge: 'NEW',
      code: 'FIRST15',
      discount: 15,
      validUntil: '2026-12-31',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80',
    },
    {
      id: 'promo2',
      title: 'Комплекс «Сияние»',
      description: 'Маникюр + уход за лицом со скидкой 20%. Идеально перед важным событием.',
      badge: 'HIT',
      code: 'SHINE20',
      discount: 20,
      validUntil: '2026-09-30',
      image: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=600&q=80',
    },
    {
      id: 'promo3',
      title: 'Будние дни −10%',
      description: 'Скидка 10% на окрашивание и балаяж при записи с понедельника по среду.',
      badge: 'WEEKDAY',
      code: 'WEEK10',
      discount: 10,
      validUntil: '2026-12-31',
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
    },
  ],

  about: {
    title: 'О салоне Элегия',
    lead: 'Пространство, где красота становится искусством.',
    text: [
      'Элегия — премиальный beauty-studio в самом сердце Москвы. Мы объединили лучших мастеров, люксовую косметику и атмосферу спокойной роскоши.',
      'Каждый визит — продуманный ритуал: от чашки авторского чая до финального штриха укладки. Мы ценим ваше время и индивидуальность.',
      'Наша философия — естественная элегантность. Никаких шаблонов: только образ, который подчёркивает вас.',
    ],
    stats: [
      { value: '8+', label: 'лет на рынке' },
      { value: '12', label: 'мастеров' },
      { value: '5000+', label: 'довольных клиентов' },
      { value: '4.9', label: 'средний рейтинг' },
    ],
    heroImage: 'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&q=80',
  },
};

/**
 * Генерирует занятые слоты на ближайшие 14 дней (демо)
 */
function generateDemoOccupiedSlots() {
  const slots = [];
  const masters = ELEGIA.masters;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 0; d < 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    // Воскресенье — выходной (опционально оставляем рабочие)
    const dateStr = formatDateISO(date);

    masters.forEach((master, mi) => {
      // 2–4 занятых слота в день у мастера
      const count = 2 + ((mi + d) % 3);
      const usedHours = new Set();
      for (let i = 0; i < count; i++) {
        let hour = 10 + ((mi * 2 + d + i * 3) % 10);
        if (hour >= 20) hour = 11 + i;
        if (usedHours.has(hour)) continue;
        usedHours.add(hour);
        const mm = i % 2 === 0 ? '00' : '30';
        slots.push({
          masterId: master.id,
          date: dateStr,
          time: `${String(hour).padStart(2, '0')}:${mm}`,
        });
      }
    });
  }
  return slots;
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });
}

function starsHtml(rating, max = 5) {
  const full = Math.floor(rating);
  let html = '';
  for (let i = 0; i < max; i++) {
    html += i < full ? '★' : '☆';
  }
  return html;
}
