const SUGGESTIONS = [
  'Объясни производные',
  'Реши задачу №345',
  'Составь план на месяц',
  'Как решать квадратные уравнения?',
  'Помоги со структурой сочинения',
  'Объясни Present Perfect',
];

let currentSubject = 'math';
let state;

document.addEventListener('DOMContentLoaded', () => {
  syncActiveSubjectFromQuery();
  state = loadState();
  currentSubject = state.activeSubject || 'math';

  initSubjectSelect();
  initSuggestions();
  renderSidebarProgress();
  renderChatLog();
  updateHeader();

  document.getElementById('subject-select').addEventListener('change', (e) => {
    currentSubject = e.target.value;
    state.activeSubject = currentSubject;
    saveState(state);
    renderSidebarProgress();
    renderChatLog();
    updateHeader();
  });

  document.getElementById('chat-form').addEventListener('submit', onSubmit);
  document.getElementById('chat-input').addEventListener('input', autoGrow);
  document.getElementById('clear-chat').addEventListener('click', () => {
    state.chats[currentSubject] = [];
    saveState(state);
    renderChatLog();
  });
});

function initSubjectSelect(){
  const sel = document.getElementById('subject-select');
  sel.innerHTML = Object.entries(SUBJECTS_META).map(([id, m]) =>
    `<option value="${id}" ${id===currentSubject?'selected':''}>${m.emoji} ${m.name}</option>`
  ).join('');
}

function initSuggestions(){
  const list = document.getElementById('suggestion-list');
  list.innerHTML = '';
  SUGGESTIONS.forEach(text => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'suggestion-chip';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      document.getElementById('chat-input').value = text;
      document.getElementById('chat-input').focus();
    });
    list.appendChild(btn);
  });
}

function renderSidebarProgress(){
  const data = state.subjects[currentSubject];
  const meta = SUBJECTS_META[currentSubject];
  const pct = Math.min(100, Math.round((data.current / data.target) * 100));
  document.getElementById('sidebar-progress').innerHTML = `
    <div class="mini-ring" style="--pct:${pct}; --c:${meta.color}"><span>${pct}%</span></div>
    <div class="sidebar-progress-text"><strong>${data.current} из ${data.target}</strong>прогноз балла по предмету</div>
  `;
}

function updateHeader(){
  const meta = SUBJECTS_META[currentSubject];
  document.getElementById('chat-subject-title').textContent = `AI-репетитор · ${meta.name}`;
}

function renderChatLog(){
  const log = document.getElementById('chat-log');
  log.innerHTML = '';
  const history = state.chats[currentSubject] || [];

  if (history.length === 0){
    appendMessage('ai', greetingFor(currentSubject), false);
  } else {
    history.forEach(m => appendMessage(m.role, m.html, false));
  }
  log.scrollTop = log.scrollHeight;
}

function greetingFor(subjectId){
  const meta = SUBJECTS_META[subjectId];
  return `<h4>Привет! 👋</h4><p>Я твой AI-репетитор по предмету «${meta.name}». Спроси про любую тему, пришли номер задачи или попроси «составь план на месяц» — разберём всё по шагам.</p>`;
}

function appendMessage(role, html, save=true){
  const log = document.getElementById('chat-log');
  const div = document.createElement('div');
  div.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  if (role === 'user'){
    const p = document.createElement('p');
    p.textContent = html;
    div.appendChild(p);
  } else {
    div.innerHTML = html;
  }
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;

  if (save){
    if (!state.chats[currentSubject]) state.chats[currentSubject] = [];
    state.chats[currentSubject].push({ role, html: role==='user' ? html : html, time: Date.now() });
    saveState(state);
  }
}

function showTyping(){
  const log = document.getElementById('chat-log');
  const div = document.createElement('div');
  div.className = 'msg typing';
  div.id = 'typing-indicator';
  div.innerHTML = '<span></span><span></span><span></span>';
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
function hideTyping(){
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}

function onSubmit(e){
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  appendMessage('user', text);
  input.value = '';
  autoGrow({target:input});

  showTyping();
  const delay = 700 + Math.random()*700;
  setTimeout(() => {
    hideTyping();
    const reply = generateChatReply(currentSubject, text);
    appendMessage('ai', reply.html);
  }, delay);
}

function autoGrow(e){
  const el = e.target;
  el.style.height = 'auto';
  el.style.height = Math.min(140, el.scrollHeight) + 'px';
}
