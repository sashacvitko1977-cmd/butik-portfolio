let state;

document.addEventListener('DOMContentLoaded', () => {
  syncActiveSubjectFromQuery();
  state = loadState();

  const subjectSelect = document.getElementById('s-subject');
  subjectSelect.innerHTML = Object.entries(SUBJECTS_META).map(([id,m]) =>
    `<option value="${id}" ${id===state.activeSubject?'selected':''}>${m.emoji} ${m.name}</option>`
  ).join('');

  document.getElementById('solve-form').addEventListener('submit', onSolve);

  document.querySelectorAll('.example-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('s-text').value = chip.getAttribute('data-text');
    });
  });
});

function onSolve(e){
  e.preventDefault();
  const subjectId = document.getElementById('s-subject').value;
  const text = document.getElementById('s-text').value.trim();
  if (!text) return;

  const output = document.getElementById('solve-output');
  output.innerHTML = `
    <div class="card solve-card">
      <div class="msg typing" style="align-self:flex-start;"><span></span><span></span><span></span></div>
    </div>
  `;

  setTimeout(() => {
    const steps = generateProblemSolution(subjectId, text);
    renderSolution(text, steps);
  }, 900);
}

function renderSolution(problemText, steps){
  const output = document.getElementById('solve-output');
  const stepsHtml = steps.map((s, i) => `
    <div class="solve-step">
      <span class="solve-step-num">${i+1}</span>
      <p>${escapeHtml(s)}</p>
    </div>
  `).join('');

  output.innerHTML = `
    <div class="card solve-card">
      <span class="eyebrow">Условие</span>
      <h4 style="margin-top:10px;">${escapeHtml(problemText)}</h4>
      <div class="solve-steps">${stepsHtml}</div>
      <div class="solve-answer">
        <span class="solve-answer-label">Итог</span>
        <p style="margin:0;">Если результат не совпал с ожидаемым — пришлите этот же вопрос в AI-чат, там можно уточнять детали и разбирать ошибки в диалоге.</p>
      </div>
      <a href="chat.html" class="btn btn-ghost btn-sm" style="margin-top:16px;">Обсудить в чате →</a>
    </div>
  `;
}
