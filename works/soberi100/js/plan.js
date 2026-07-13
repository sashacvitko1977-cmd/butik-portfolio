let state;

document.addEventListener('DOMContentLoaded', () => {
  syncActiveSubjectFromQuery();
  state = loadState();

  const subjectSelect = document.getElementById('f-subject');
  subjectSelect.innerHTML = Object.entries(SUBJECTS_META).map(([id,m]) =>
    `<option value="${id}" ${id===state.activeSubject?'selected':''}>${m.emoji} ${m.name}</option>`
  ).join('');

  const hoursInput = document.getElementById('f-hours');
  const hoursValue = document.getElementById('hours-value');
  hoursInput.addEventListener('input', () => hoursValue.textContent = hoursInput.value);

  document.getElementById('plan-form').addEventListener('submit', onGenerate);

  // если для предмета уже есть сохранённый план — показать его
  const existing = state.plans[state.activeSubject];
  if (existing){
    renderPlan(existing);
  } else {
    renderEmptyState();
  }
});

function renderEmptyState(){
  document.getElementById('plan-output').innerHTML = `
    <div class="plan-empty">
      <div class="score-ring" style="--size:88px;--thickness:8px;">
        <div class="score-ring-value"><span class="ring-num" data-target="0">0</span><small>баллов</small></div>
      </div>
      <p>Заполните форму слева — и здесь появится план по неделям с темами и нагрузкой.</p>
    </div>
  `;
}

function onGenerate(e){
  e.preventDefault();
  const subjectId = document.getElementById('f-subject').value;
  const grade = parseInt(document.getElementById('f-grade').value, 10);
  const targetScore = parseInt(document.getElementById('f-target').value, 10) || 80;
  const hoursWeek = parseInt(document.getElementById('f-hours').value, 10) || 4;

  const plan = generatePlan({ subjectId, grade, targetScore, hoursWeek });

  state.activeSubject = subjectId;
  state.plans[subjectId] = plan;
  state.subjects[subjectId].target = targetScore;
  state.subjects[subjectId].hoursWeek = hoursWeek;
  state.subjects[subjectId].grade = grade;
  saveState(state);

  renderPlan(plan);
}

function renderPlan(plan){
  const meta = SUBJECTS_META[plan.subjectId];
  const totalWeeks = plan.weeks.length;
  const totalHours = totalWeeks * plan.hoursWeek;

  let html = `
    <div class="card plan-summary reveal in">
      <div class="score-ring" style="--size:86px;--thickness:8px;">
        <div class="score-ring-value"><span class="ring-num" data-target="${plan.targetScore}"></span><small>цель, баллов</small></div>
      </div>
      <div>
        <h3>${meta.emoji} ${meta.name} · ${plan.grade} класс</h3>
        <p>${totalWeeks} недель · ${plan.hoursWeek} ч/нед · всего ≈ ${totalHours} часов подготовки</p>
      </div>
    </div>
    <div class="plan-weeks">
  `;

  plan.weeks.forEach((w, i) => {
    html += `
      <div class="card week-card reveal in" style="transition-delay:${i*0.04}s">
        <div class="week-card-head">
          <span class="week-num">Неделя ${w.number}</span>
          <span class="week-hours mono">${w.hours} ч</span>
        </div>
        <ul>${w.topics.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    `;
  });

  html += `</div>`;
  document.getElementById('plan-output').innerHTML = html;

  const ringNum = document.querySelector('.plan-summary .ring-num');
  if (ringNum) animateRingValue(ringNum, plan.targetScore);
}
