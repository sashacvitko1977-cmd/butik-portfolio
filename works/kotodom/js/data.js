/**
 * Демо-данные для первой загрузки «Котодом»
 */
const SEED_LISTINGS = [
  {
    id: 'lst-001',
    title: 'Британский котёнок, 3 месяца',
    description: 'Продаётся чистокровный британский котёнок голубого окраса. Приучен к лотку, когтеточке и сухому корму Royal Canin Kitten. Очень ласковый и спокойный, без агрессии. Родители с документами WCF, привиты по возрасту. Возможна доставка по Москве.',
    category: 'cats',
    price: 25000,
    age: '3 месяца',
    city: 'Москва',
    gender: 'male',
    images: [
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop'
    ],
    views: 342,
    createdAt: '2026-07-08T10:00:00.000Z',
    sellerId: 'user-demo-1',
    sellerName: 'Анна',
    sellerPhone: '+7 (916) 123-45-67',
    status: 'active'
  },
  {
    id: 'lst-002',
    title: 'Щенок лабрадора, документы РКФ',
    description: 'Щенок лабрадора-ретривера, окрас шоколад. Родился 15 апреля 2026. Привит, чипирован, есть ветпаспорт. Родители — чемпионы выставок. Отлично подойдёт для семьи с детьми. Продаём из-за переезда.',
    category: 'dogs',
    price: 45000,
    age: '2 месяца',
    city: 'Санкт-Петербург',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop'
    ],
    views: 518,
    createdAt: '2026-07-07T14:30:00.000Z',
    sellerId: 'user-demo-2',
    sellerName: 'Дмитрий',
    sellerPhone: '+7 (921) 987-65-43',
    status: 'active'
  },
  {
    id: 'lst-003',
    title: 'Мейн-кун, девочка с родословной',
    description: 'Котёнок мейн-кун, девочка, возраст 4 месяца. Крупная порода, отличный характер. Приучена к лотку, ест сухой и влажный корм. Родители — заводчик с 10-летним стажем. Возможен видеозвонок для знакомства.',
    category: 'cats',
    price: 55000,
    age: '4 месяца',
    city: 'Казань',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=600&h=400&fit=crop'
    ],
    views: 289,
    createdAt: '2026-07-06T09:15:00.000Z',
    sellerId: 'user-demo-3',
    sellerName: 'Елена',
    sellerPhone: '+7 (843) 555-12-34',
    status: 'active'
  },
  {
    id: 'lst-004',
    title: 'Кролик карликовый, 6 месяцев',
    description: 'Декоративный карликовый кролик, окрас голландский. Очень ручной, любит сидеть на руках. В комплекте клетка, поилка, кормушка и запас сена. Идеален для квартиры — не пахнет, не лает.',
    category: 'rodents',
    price: 3500,
    age: '6 месяцев',
    city: 'Новосибирск',
    gender: 'male',
    images: [
      'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&h=400&fit=crop'
    ],
    views: 156,
    createdAt: '2026-07-05T16:45:00.000Z',
    sellerId: 'user-demo-4',
    sellerName: 'Ольга',
    sellerPhone: '+7 (913) 456-78-90',
    status: 'active'
  },
  {
    id: 'lst-005',
    title: 'Щенок корги, мальчик',
    description: 'Вельш-корги пемброк, мальчик, 2.5 месяца. Уши уже встают! Привит, обработан от глистов. Очень активный и умный малыш. Родители — рабочие собаки с отличной родословной.',
    category: 'dogs',
    price: 60000,
    age: '2.5 месяца',
    city: 'Москва',
    gender: 'male',
    images: [
      'https://images.unsplash.com/photo-1611003228941-98852dae6223?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=400&fit=crop'
    ],
    views: 721,
    createdAt: '2026-07-04T11:20:00.000Z',
    sellerId: 'user-demo-1',
    sellerName: 'Анна',
    sellerPhone: '+7 (916) 123-45-67',
    status: 'active'
  },
  {
    id: 'lst-006',
    title: 'Попугай волнистый с клеткой',
    description: 'Волнистый попугайчик, возраст 1 год, умеет говорить «привет» и «пока». Клетка 40×30 см в подарок. Куплен в зоомагазине, здоров, активен. Продаём — аллергия у ребёнка.',
    category: 'birds',
    price: 2500,
    age: '1 год',
    city: 'Екатеринбург',
    gender: 'male',
    images: [
      'https://images.unsplash.com/photo-1552728080-d64b0b5c8b5e?w=600&h=400&fit=crop'
    ],
    views: 98,
    createdAt: '2026-07-03T08:00:00.000Z',
    sellerId: 'user-demo-5',
    sellerName: 'Игорь',
    sellerPhone: '+7 (343) 111-22-33',
    status: 'active'
  },
  {
    id: 'lst-007',
    title: 'Сиамская кошка, 1.5 года',
    description: 'Сиамская кошка, девочка, стерилизована. Очень общительная, любит детей. Продаём в связи с рождением ребёнка с аллергией. Полный комплект: переноска, лоток, когтеточка, игрушки.',
    category: 'cats',
    price: 8000,
    age: '1.5 года',
    city: 'Краснодар',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1513360371669-4adf45fefa8f?w=600&h=400&fit=crop'
    ],
    views: 203,
    createdAt: '2026-07-02T13:10:00.000Z',
    sellerId: 'user-demo-6',
    sellerName: 'Мария',
    sellerPhone: '+7 (918) 333-44-55',
    status: 'active'
  },
  {
    id: 'lst-008',
    title: 'Хомяк джунгарский, 2 мес.',
    description: 'Милый джунгарский хомячок с большими щёчками. Ручной, не кусается. Клетка и колесо в комплекте. Отличный первый питомец для ребёнка. Корм и опилки в подарок.',
    category: 'rodents',
    price: 800,
    age: '2 месяца',
    city: 'Самара',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1425083661902-960443a6aeee?w=600&h=400&fit=crop'
    ],
    views: 87,
    createdAt: '2026-07-01T17:30:00.000Z',
    sellerId: 'user-demo-4',
    sellerName: 'Ольга',
    sellerPhone: '+7 (913) 456-78-90',
    status: 'active'
  },
  {
    id: 'lst-009',
    title: 'Щенок йоркширского терьера',
    description: 'Йоркширский терьер, мальчик, мини. Возраст 3 месяца, вес 900 г. Привит, есть документы. Не линяет, гипоаллергенная порода. Подойдёт для квартиры любого размера.',
    category: 'dogs',
    price: 35000,
    age: '3 месяца',
    city: 'Ростов-на-Дону',
    gender: 'male',
    images: [
      'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=400&fit=crop'
    ],
    views: 412,
    createdAt: '2026-06-30T10:45:00.000Z',
    sellerId: 'user-demo-2',
    sellerName: 'Дмитрий',
    sellerPhone: '+7 (921) 987-65-43',
    status: 'active'
  },
  {
    id: 'lst-010',
    title: 'Аквариум 100л с рыбками',
    description: 'Полный комплект: аквариум 100 литров, фильтр, обогреватель, грунт, растения. В комплекте 12 неонов, 5 гуппи, 2 анциструса. Всё работает, ухожено. Самовывоз.',
    category: 'fish',
    price: 12000,
    age: '—',
    city: 'Воронеж',
    gender: 'unknown',
    images: [
      'https://images.unsplash.com/photo-1522069169874-58d2b9695f63?w=600&h=400&fit=crop'
    ],
    views: 134,
    createdAt: '2026-06-29T15:00:00.000Z',
    sellerId: 'user-demo-7',
    sellerName: 'Сергей',
    sellerPhone: '+7 (473) 777-88-99',
    status: 'active'
  },
  {
    id: 'lst-011',
    title: 'Шпиц померанский, девочка',
    description: 'Померанский шпиц, девочка, миниатюрный тип. 4 месяца, окрас оранжевый сабль. Привита по возрасту, обработана. Очень пушистая и игривая. Родители — шоу-класс.',
    category: 'dogs',
    price: 40000,
    age: '4 месяца',
    city: 'Москва',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600&h=400&fit=crop'
    ],
    views: 567,
    createdAt: '2026-06-28T12:00:00.000Z',
    sellerId: 'user-demo-1',
    sellerName: 'Анна',
    sellerPhone: '+7 (916) 123-45-67',
    status: 'active'
  },
  {
    id: 'lst-012',
    title: 'Черепаха красноухая, 2 года',
    description: 'Красноухая черепаха, самка, 2 года. Аквариум 80л, островок, УФ-лампа — всё в комплекте. Спокойная, кушает из рук. Продаём — нет времени ухаживать.',
    category: 'reptiles',
    price: 5000,
    age: '2 года',
    city: 'Нижний Новгород',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1437622368342-7a3d73a736c7?w=600&h=400&fit=crop'
    ],
    views: 76,
    createdAt: '2026-06-27T09:30:00.000Z',
    sellerId: 'user-demo-8',
    sellerName: 'Алексей',
    sellerPhone: '+7 (831) 222-33-44',
    status: 'active'
  },
  {
    id: 'lst-013',
    title: 'Сфинкс, котёнок без шерсти',
    description: 'Канадский сфинкс, мальчик, 5 месяцев. Ласковый «тёплый котик». Приучен к лотку, купается спокойно. Нужен тёплый дом и заботливые хозяева. Привит, чипирован.',
    category: 'cats',
    price: 70000,
    age: '5 месяцев',
    city: 'Санкт-Петербург',
    gender: 'male',
    images: [
      'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600&h=400&fit=crop'
    ],
    views: 445,
    createdAt: '2026-06-26T14:20:00.000Z',
    sellerId: 'user-demo-3',
    sellerName: 'Елена',
    sellerPhone: '+7 (843) 555-12-34',
    status: 'active'
  },
  {
    id: 'lst-014',
    title: 'Морская свинка, пара',
    description: 'Две морские свинки — мальчик и девочка, 4 месяца. Очень дружелюбные, любят морковку и шуршать. Клетка, домик, поилка в подарок. Отдам в хорошие руки.',
    category: 'rodents',
    price: 2000,
    age: '4 месяца',
    city: 'Уфа',
    gender: 'unknown',
    images: [
      'https://images.unsplash.com/photo-1548767797-d8a23937d66f?w=600&h=400&fit=crop'
    ],
    views: 112,
    createdAt: '2026-06-25T11:00:00.000Z',
    sellerId: 'user-demo-4',
    sellerName: 'Ольга',
    sellerPhone: '+7 (913) 456-78-90',
    status: 'active'
  },
  {
    id: 'lst-015',
    title: 'Отдам в добрые руки — дворняжка',
    description: 'Метис лабрадора, девочка, 1 год. Стерилизована, привита. Очень преданная и умная. Ищем семью без маленьких детей — боится громких звуков. Бесплатно, только проверка условий.',
    category: 'dogs',
    price: 0,
    age: '1 год',
    city: 'Москва',
    gender: 'female',
    images: [
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=600&h=400&fit=crop'
    ],
    views: 892,
    createdAt: '2026-06-24T08:00:00.000Z',
    sellerId: 'user-demo-9',
    sellerName: 'Наталья',
    sellerPhone: '+7 (905) 666-77-88',
    status: 'active'
  }
];

const CATEGORIES = [
  { id: 'cats', name: 'Кошки', icon: '🐱', color: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'dogs', name: 'Собаки', icon: '🐶', color: 'bg-amber-100 dark:bg-amber-900/30' },
  { id: 'rodents', name: 'Грызуны', icon: '🐹', color: 'bg-green-100 dark:bg-green-900/30' },
  { id: 'birds', name: 'Птицы', icon: '🦜', color: 'bg-sky-100 dark:bg-sky-900/30' },
  { id: 'fish', name: 'Рыбки', icon: '🐠', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 'reptiles', name: 'Рептилии', icon: '🦎', color: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'other', name: 'Другое', icon: '🐾', color: 'bg-gray-100 dark:bg-gray-800' }
];

const CITIES = [
  'Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург',
  'Краснодар', 'Самара', 'Ростов-на-Дону', 'Воронеж', 'Нижний Новгород', 'Уфа'
];

const GENDER_LABELS = {
  male: 'Мальчик',
  female: 'Девочка',
  unknown: 'Не указан'
};