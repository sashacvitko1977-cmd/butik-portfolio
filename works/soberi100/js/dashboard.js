document.addEventListener('DOMContentLoaded', () => {
  syncActiveSubjectFromQuery();
  const state = loadState();
  renderSubjects(state);
  renderToday(state);
  renderAverage(state);
});

function renderAverage(state){
  const scores = Object.values(state.subjects).map(s => Math.round((s.current / s.target) * 100));
  const avg = Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) || 0;
  const el = document.getElementById('avg-score');
  el.setAttribute('data-target', Math.min(avg,100));
  animateRingValue(el, Math.min(avg,100));
}

function renderSubjects(state){
  const grid = document.getElementById('subjects-grid');
  grid.innerHTML = '';
  Object.entries(SUBJECTS_META).forEach(([id, meta], i) => {
    const data = state.subjects[id];
    const pct = Math.min(100, Math.round((data.current / data.target) * 100));
    const isActive = state.activeSubject === id;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'subject-tile card reveal' + (isActive ? ' is-active' : '');
    card.style.transitionDelay = (i * 0.05) + 's';
    card.innerHTML = `
      <div class="subject-tile-top">
        <span class="subject-tile-emoji">${meta.emoji}</span>
        <div class="mini-ring" style="--pct:${pct}; --c:${meta.color}">
          <span>${pct}%</span>
        </div>
      </div>
      <h3>${meta.name}</h3>
      <p class="subject-tile-meta mono">${data.current} → ${data.target} балл${data.target===1?'':'ов'} · ${data.hoursWeek} ч/нед</p>
      ${isActive ? '<span class="tag tile-tag">Активный предмет</span>' : ''}
    `;
    card.addEventListener('click', () => {
      state.activeSubject = id;
      saveState(state);
      renderSubjects(state);
      renderToday(state);
    });
    grid.appendChild(card);
    requestAnimationFrame(()=>card.classList.add('in'));
  });
}

function renderToday(state){
  const id = state.activeSubject;
  const meta = SUBJECTS_META[id];
  const data = state.subjects[id];
  document.getElementById('today-subject-name').textContent = meta.name;
  document.getElementById('today-task-text').textContent = data.todayTask;
  ['today-chat-link','today-plan-link','today-solve-link'].forEach(elId=>{
    const el = document.getElementById(elId);
    const base = el.getAttribute('href').split('?')[0];
    el.setAttribute('href', `${base}?subject=${id}`);
  });
}
