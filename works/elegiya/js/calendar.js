/**
 * Интерактивный календарь выбора даты
 */
const Calendar = (() => {
  let viewYear;
  let viewMonth; // 0–11
  let selectedDate = null;
  let container = null;
  let onSelect = null;
  let isDateDisabled = null;

  const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const MONTHS = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  function init(el, options = {}) {
    container = typeof el === 'string' ? document.querySelector(el) : el;
    onSelect = options.onSelect || (() => {});
    isDateDisabled = options.isDateDisabled || defaultDisabled;
    selectedDate = options.selected || null;

    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    if (selectedDate) {
      const [y, m] = selectedDate.split('-').map(Number);
      viewYear = y;
      viewMonth = m - 1;
    }
    render();
  }

  function defaultDisabled(iso) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    // Нельзя в прошлом; макс. 60 дней вперёд
    const max = new Date(today);
    max.setDate(max.getDate() + 60);
    return date < today || date > max;
  }

  function prevMonth() {
    viewMonth -= 1;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    render();
  }

  function nextMonth() {
    viewMonth += 1;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    render();
  }

  function selectDay(iso) {
    if (isDateDisabled(iso)) return;
    selectedDate = iso;
    render();
    onSelect(iso);
  }

  function getSelected() {
    return selectedDate;
  }

  function setSelected(iso) {
    selectedDate = iso;
    if (iso) {
      const [y, m] = iso.split('-').map(Number);
      viewYear = y;
      viewMonth = m - 1;
    }
    render();
  }

  function clear() {
    selectedDate = null;
    render();
  }

  function render() {
    if (!container) return;

    const first = new Date(viewYear, viewMonth, 1);
    // Понедельник = 0
    let startDow = first.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayIso = formatDateISO(new Date());

    let daysHtml = '';
    for (let i = 0; i < startDow; i++) {
      daysHtml += `<div class="cal-day cal-day--empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const disabled = isDateDisabled(iso);
      const selected = selectedDate === iso;
      const isToday = todayIso === iso;
      const classes = [
        'cal-day',
        disabled ? 'cal-day--disabled' : '',
        selected ? 'cal-day--selected' : '',
        isToday ? 'cal-day--today' : '',
      ]
        .filter(Boolean)
        .join(' ');

      daysHtml += `<button type="button" class="${classes}" data-date="${iso}" ${disabled ? 'disabled' : ''} aria-label="${iso}">${day}</button>`;
    }

    container.innerHTML = `
      <div class="cal-header">
        <button type="button" class="cal-nav" data-cal-prev aria-label="Предыдущий месяц">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="cal-title">${MONTHS[viewMonth]} ${viewYear}</div>
        <button type="button" class="cal-nav" data-cal-next aria-label="Следующий месяц">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div class="cal-weekdays">
        ${WEEKDAYS.map((w) => `<div class="cal-weekday">${w}</div>`).join('')}
      </div>
      <div class="cal-grid">
        ${daysHtml}
      </div>
    `;

    container.querySelector('[data-cal-prev]')?.addEventListener('click', prevMonth);
    container.querySelector('[data-cal-next]')?.addEventListener('click', nextMonth);
    container.querySelectorAll('.cal-day:not(.cal-day--empty):not(.cal-day--disabled)').forEach((btn) => {
      btn.addEventListener('click', () => selectDay(btn.dataset.date));
    });
  }

  return { init, getSelected, setSelected, clear, render };
})();
