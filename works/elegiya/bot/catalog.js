/**
 * Каталог услуг и мастеров (синхрон с сайтом)
 */
module.exports = {
  schedule: {
    openHour: 10,
    closeHour: 21,
    slotStep: 30,
  },

  categories: [
    { id: 'hair', name: 'Волосы', icon: '💇‍♀️' },
    { id: 'nails', name: 'Ногти', icon: '💅' },
    { id: 'makeup', name: 'Макияж', icon: '✨' },
    { id: 'brows', name: 'Брови и ресницы', icon: '👁' },
    { id: 'care', name: 'Уход за лицом', icon: '🌸' },
    { id: 'body', name: 'Тело', icon: '🧴' },
  ],

  services: [
    {
      id: 'svc-cut',
      category: 'hair',
      name: 'Женская стрижка',
      price: 4500,
      duration: 60,
    },
    {
      id: 'svc-color',
      category: 'hair',
      name: 'Окрашивание',
      price: 8900,
      duration: 150,
    },
    {
      id: 'svc-balayage',
      category: 'hair',
      name: 'Балаяж / Airtouch',
      price: 14500,
      duration: 210,
    },
    {
      id: 'svc-style',
      category: 'hair',
      name: 'Вечерняя укладка',
      price: 5500,
      duration: 60,
    },
    {
      id: 'svc-manicure',
      category: 'nails',
      name: 'Маникюр + гель-лак',
      price: 3200,
      duration: 90,
    },
    {
      id: 'svc-pedicure',
      category: 'nails',
      name: 'Педикюр SPA',
      price: 4200,
      duration: 90,
    },
    {
      id: 'svc-makeup',
      category: 'makeup',
      name: 'Вечерний макияж',
      price: 6500,
      duration: 75,
    },
    {
      id: 'svc-bridal',
      category: 'makeup',
      name: 'Свадебный образ',
      price: 18000,
      duration: 180,
    },
    {
      id: 'svc-brows',
      category: 'brows',
      name: 'Коррекция и окрашивание бровей',
      price: 2800,
      duration: 45,
    },
    {
      id: 'svc-lashes',
      category: 'brows',
      name: 'Ламинирование ресниц',
      price: 3900,
      duration: 60,
    },
    {
      id: 'svc-facial',
      category: 'care',
      name: 'Уходовая процедура лица',
      price: 7500,
      duration: 90,
    },
    {
      id: 'svc-massage',
      category: 'body',
      name: 'Массаж лица и декольте',
      price: 5500,
      duration: 60,
    },
  ],

  masters: [
    {
      id: 'm-anna',
      name: 'Анна Волкова',
      role: 'Арт-директор, колорист',
      serviceIds: ['svc-cut', 'svc-color', 'svc-balayage', 'svc-style'],
      rating: 4.98,
    },
    {
      id: 'm-maria',
      name: 'Мария Соколова',
      role: 'Топ-стилист',
      serviceIds: ['svc-cut', 'svc-style', 'svc-color'],
      rating: 4.95,
    },
    {
      id: 'm-elena',
      name: 'Елена Морозова',
      role: 'Nail-мастер',
      serviceIds: ['svc-manicure', 'svc-pedicure'],
      rating: 4.97,
    },
    {
      id: 'm-daria',
      name: 'Дарья Ким',
      role: 'Визажист',
      serviceIds: ['svc-makeup', 'svc-bridal'],
      rating: 4.99,
    },
    {
      id: 'm-sofia',
      name: 'София Орлова',
      role: 'Бровист / лашмейкер',
      serviceIds: ['svc-brows', 'svc-lashes'],
      rating: 4.96,
    },
    {
      id: 'm-victoria',
      name: 'Виктория Лебедева',
      role: 'Косметолог-эстетист',
      serviceIds: ['svc-facial', 'svc-massage'],
      rating: 4.94,
    },
  ],

  contacts: {
    phone: '+7 (495) 123-45-67',
    address: 'Москва, ул. Патриаршие Пруды, 12',
    hours: 'Ежедневно 10:00 — 21:00',
  },
};
