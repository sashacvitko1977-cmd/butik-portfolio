/* ==========================================================================
   Собери100 — простое хранилище состояния на localStorage
   ========================================================================== */

const STORE_KEY = 'soberi100_state_v1';

const SUBJECTS_META = {
  math:      { name:'Математика ЕГЭ',  emoji:'📐', color:'#4c6fff' },
  rus:       { name:'Русский язык',    emoji:'✍️', color:'#8b5cf6' },
  eng:       { name:'Английский язык', emoji:'🇬🇧', color:'#34d399' },
  'oge-math':{ name:'Математика ОГЭ',  emoji:'🧮', color:'#f5b754' },
  phys:      { name:'Физика',          emoji:'⚛️', color:'#f3667f' },
  inf:       { name:'Информатика',     emoji:'💻', color:'#4c6fff' },
};

function defaultState(){
  return {
    activeSubject: 'math',
    subjects: {
      math:      { current: 58, target: 85, hoursWeek: 4, grade: 11, todayTask: 'Разобрать производные и их применение (задание №7)' },
      rus:       { current: 71, target: 90, hoursWeek: 3, grade: 11, todayTask: 'Повторить орфограммы №9–12 и написать мини-сочинение' },
      eng:       { current: 64, target: 80, hoursWeek: 3, grade: 11, todayTask: 'Грамматика: времена группы Perfect, 15 упражнений' },
      'oge-math':{ current: 60, target: 22, hoursWeek: 3, grade: 9,  todayTask: 'Разобрать модуль «Алгебра», задания 1–5' },
      phys:      { current: 45, target: 70, hoursWeek: 2, grade: 11, todayTask: 'Кинематика: решить 5 задач на равноускоренное движение' },
      inf:       { current: 50, target: 75, hoursWeek: 2, grade: 11, todayTask: 'Python: разбор задания №2 (таблицы истинности)' },
    },
    plans: {},       // subjectId -> generated plan object
    chats: {},        // subjectId -> [{role, text, time}]
  };
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) { const s = defaultState(); saveState(s); return s; }
    const parsed = JSON.parse(raw);
    // merge with defaults in case of new fields
    const def = defaultState();
    return {
      ...def, ...parsed,
      subjects: { ...def.subjects, ...(parsed.subjects||{}) },
      plans: parsed.plans || {},
      chats: parsed.chats || {},
    };
  }catch(e){
    console.warn('Не удалось прочитать состояние, сброс к дефолту', e);
    const s = defaultState();
    saveState(s);
    return s;
  }
}

function saveState(state){
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function getQueryParam(name){
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

/* Хелпер: выставить активный предмет (например, при переходе с лендинга) */
function syncActiveSubjectFromQuery(){
  const q = getQueryParam('subject');
  if (q && SUBJECTS_META[q]){
    const state = loadState();
    state.activeSubject = q;
    saveState(state);
  }
}
