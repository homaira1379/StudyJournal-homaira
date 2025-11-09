// ========= NAVIGATION =========
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

function navigateToPage(pageName) {
  navButtons.forEach(btn =>
    btn.classList.toggle('active', btn.dataset.page === pageName)
  );
  pages.forEach(page =>
    page.classList.toggle('active', page.id === pageName)
  );

  if (pageName === 'progress') {
    updateProgressStats();
    renderCharts();
  }
}

navButtons.forEach(btn =>
  btn.addEventListener('click', () => navigateToPage(btn.dataset.page))
);

// ========= THEME =========
function changeTheme(theme) {
  document.body.className = theme === 'default' ? '' : `${theme}-theme`;
  localStorage.setItem('theme', theme);
}
const savedTheme = localStorage.getItem('theme');
if (savedTheme && savedTheme !== 'default') {
  document.body.className = `${savedTheme}-theme`;
}

// ========= DATA STORAGE =========
let journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
let quizHistory = JSON.parse(localStorage.getItem('quizHistory') || '[]');

function saveData() {
  localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
  localStorage.setItem('quizHistory', JSON.stringify(quizHistory));
}

// ========= JOURNAL =========
const journalForm = document.getElementById('journalForm');
const journalContainer = document.getElementById('journalEntries');
const entryCount = document.getElementById('entryCount');
let selectedEntryIndex = null;

if (journalForm) {
  journalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const subject = document.getElementById('subject').value.trim();
    const duration = parseInt(document.getElementById('duration').value, 10) || 0;
    const notes = document.getElementById('notes').value.trim();

    const entry = {
      id: Date.now(),
      subject,
      duration,
      notes,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString()
    };

    journalEntries.unshift(entry);
    saveData();
    journalForm.reset();
    displayJournalEntries();
    alert('Entry saved successfully! 🎉');
  });
}

function displayJournalEntries(filter = '') {
  if (!journalContainer) return;

  let list = journalEntries;
  if (filter) {
    const f = filter.toLowerCase();
    list = journalEntries.filter(e =>
      e.subject.toLowerCase().includes(f) ||
      e.notes.toLowerCase().includes(f)
    );
  }

  entryCount.textContent = list.length;

  const noteView = document.getElementById('noteView');

  if (list.length === 0) {
    journalContainer.innerHTML = `
      <p style="color: var(--text-secondary); text-align: center; padding: 30px;">
        No entries found.
      </p>`;
    if (noteView) noteView.classList.add('hidden');
    return;
  }

  journalContainer.innerHTML = list.map(e => `
    <div class="journal-entry">
      <h4>${e.subject}</h4>
      <div class="meta">📅 ${e.date} • ⏱️ ${e.duration} min</div>
      <p>${e.notes.length > 140 ? e.notes.slice(0, 140) + '...' : e.notes}</p>
      <div class="entry-actions">
        <button class="btn btn-small" onclick="viewEntry(${e.id})">View & AI Tools</button>
        <button class="delete-btn" onclick="deleteEntry(${e.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function searchEntries() {
  const term = document.getElementById('searchInput').value;
  displayJournalEntries(term);
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  journalEntries = journalEntries.filter(e => e.id !== id);
  saveData();
  displayJournalEntries();
}

// ========= VIEW ENTRY =========
window.viewEntry = function (id) {
  const entry = journalEntries.find(e => e.id === id);
  if (!entry) return;

  selectedEntryIndex = journalEntries.indexOf(entry);

  const noteView = document.getElementById('noteView');
  document.getElementById('viewTitle').textContent = entry.subject;
  document.getElementById('viewSubject').textContent = entry.subject;
  document.getElementById('viewDate').textContent = entry.date;
  document.getElementById('viewDuration').textContent = entry.duration;
  document.getElementById('viewContent').textContent = entry.notes;

  document.getElementById('viewSummary').textContent =
    'Ready to summarize. Click "Summarize with AI".';
  document.getElementById('viewQuiz').innerHTML =
    '<li class="muted">Click "Generate AI Quiz from This Note" to create questions.</li>';

  if (noteView) noteView.classList.remove('hidden');
};

// ========= AI HELPERS (/api/chat) =========
async function callOpenAI(body) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error || `API error (${res.status})`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content from AI');
    return content.trim();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// ========= AI SUMMARY =========
const btnSummary = document.getElementById('btnSummary');
if (btnSummary) {
  btnSummary.addEventListener('click', async () => {
    const summaryBox = document.getElementById('viewSummary');

    if (selectedEntryIndex === null) {
      summaryBox.textContent = 'Please select an entry first.';
      return;
    }

    const entry = journalEntries[selectedEntryIndex];
    summaryBox.textContent = '✏️ Summarizing with AI...';

    try {
      const content = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Summarize this study note in 3 clear bullet points for a student:\n\n${entry.notes}`
        }],
        temperature: 0.4
      });
      summaryBox.textContent = content;
    } catch {
      summaryBox.innerHTML = `
        <div class="api-warning">
          Could not get AI summary. Check your API key / deployment.
        </div>`;
    }
  });
}

// ========= AI QUIZ FROM NOTE =========
const btnNoteQuiz = document.getElementById('btnNoteQuiz');
if (btnNoteQuiz) {
  btnNoteQuiz.addEventListener('click', async () => {
    const quizList = document.getElementById('viewQuiz');

    if (selectedEntryIndex === null) {
      quizList.innerHTML = '<li class="muted">Please select an entry first.</li>';
      return;
    }

    const entry = journalEntries[selectedEntryIndex];
    quizList.innerHTML = '<li class="muted">Generating AI quiz questions...</li>';

    try {
      const content = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content:
`Create 3 multiple choice questions from this note. 
Return ONLY JSON array like:
[
  {"question":"...","options":["A","B","C","D"],"correctAnswer":0}
]
Note text:
${entry.notes}`
        }],
        temperature: 0.7
      });

      let quiz;
      try {
        quiz = JSON.parse(content);
      } catch {
        const cleaned = content.replace(/```json|```/gi, '').trim();
        quiz = JSON.parse(cleaned);
      }

      if (!Array.isArray(quiz)) throw new Error('Bad quiz format');

      quizList.innerHTML = quiz.map((q, i) => `
        <li>
          <strong>Q${i + 1}:</strong> ${q.question}<br/>
          ${q.options.map((opt, idx) =>
            `${String.fromCharCode(65 + idx)}. ${opt}`
          ).join('<br/>')}
          <br/><em>Answer: ${String.fromCharCode(65 + (q.correctAnswer || 0))}</em>
        </li>
      `).join('');
    } catch (err) {
      console.error(err);
      quizList.innerHTML = `
        <li class="muted">
          Could not generate AI quiz. Please confirm your backend / OpenAI key.
        </li>`;
    }
  });
}

// ========= EXPORT CURRENT NOTE + AI TO PDF =========
const exportPdfBtn = document.getElementById('btnExportPDF');
if (exportPdfBtn) {
  exportPdfBtn.addEventListener('click', exportCurrentNotePdf);
}

function exportCurrentNotePdf() {
  if (selectedEntryIndex === null) {
    alert('Please select an entry first.');
    return;
  }

  const entry = journalEntries[selectedEntryIndex];
  if (!entry) {
    alert('Could not find this entry.');
    return;
  }

  const summaryText =
    (document.getElementById('viewSummary')?.innerText || '').trim() ||
    'No AI summary generated yet.';

  const quizItems = document.querySelectorAll('#viewQuiz li');
  const quizLines = [];
  quizItems.forEach((li) => {
    const text = li.innerText.replace(/\s+\n/g, ' ').trim();
    if (
      text &&
      !/Generate quick revision/i.test(text) &&
      !/Could not generate AI quiz/i.test(text) &&
      !/Please select an entry first/i.test(text)
    ) {
      quizLines.push(text);
    }
  });

  const jspdf = window.jspdf;
  if (!jspdf || !jspdf.jsPDF) {
    alert('PDF library not loaded.');
    return;
  }

  const doc = new jspdf.jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const lineHeight = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  function addSection(title, text) {
    if (!text) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    lines.forEach((line) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    });

    y += lineHeight / 2;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Study Journal - Note Export', margin, y);
  y += lineHeight * 2;

  addSection('Subject', entry.subject || '');
  addSection('Date & Duration', `${entry.date || ''}  •  ${entry.duration || 0} min`);
  addSection('Notes', entry.notes || '');
  addSection('AI Summary', summaryText);

  if (quizLines.length) {
    addSection('AI Quiz (Based on This Note)', quizLines.join('\n\n'));
  }

  const safeSubject = (entry.subject || 'note').toLowerCase().replace(/[^a-z0-9]+/gi, '-');
  doc.save(`study-note-${safeSubject || 'export'}.pdf`);
}

// ========= TOPIC QUIZ =========
let currentQuiz = null;
let userAnswers = [];

async function generateQuiz() {
  const topic = document.getElementById('quizTopic').value;
  const num = parseInt(document.getElementById('numQuestions').value, 10) || 5;
  const btn = document.getElementById('generateQuizBtn');
  const quizContent = document.getElementById('quizContent');

  btn.disabled = true;
  btn.textContent = 'Generating...';
  quizContent.innerHTML = '<div class="loading">Creating your quiz...</div>';

  try {
    const content = await callOpenAI({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content:
`Create ${num} multiple choice questions about ${topic}.
Return ONLY JSON:
[
  {"question":"...","options":["A","B","C","D"],"correctAnswer":0}
]`
      }],
      temperature: 0.7
    });

    let quiz;
    try {
      quiz = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json|```/gi, '').trim();
      quiz = JSON.parse(cleaned);
    }

    if (!Array.isArray(quiz)) throw new Error('Invalid quiz data');

    currentQuiz = quiz;
    userAnswers = new Array(quiz.length).fill(null);
    renderQuiz();
  } catch (err) {
    console.error(err);
    quizContent.innerHTML = `
      <div class="api-warning">
        Failed to generate quiz. Check your API key / /api/chat configuration.
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Quiz';
  }
}

function renderQuiz() {
  const quizContent = document.getElementById('quizContent');
  if (!currentQuiz || !currentQuiz.length) {
    quizContent.innerHTML = '';
    return;
  }

  quizContent.innerHTML = `
    <div class="quiz-container">
      ${currentQuiz.map((q, qi) => `
        <div class="question">
          <h4>Question ${qi + 1}: ${q.question}</h4>
          <div class="options">
            ${q.options.map((opt, oi) => `
              <div class="option"
                   data-q="${qi}" data-o="${oi}"
                   onclick="selectOption(${qi}, ${oi})">
                ${String.fromCharCode(65 + oi)}. ${opt}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <button class="btn" onclick="submitQuiz()">Submit Quiz</button>
    </div>
  `;
}

window.selectOption = function (qIdx, oIdx) {
  const opts = document.querySelectorAll(`.option[data-q="${qIdx}"]`);
  opts.forEach(o => o.classList.remove('selected'));
  const chosen = document.querySelector(`.option[data-q="${qIdx}"][data-o="${oIdx}"]`);
  if (chosen) chosen.classList.add('selected');
  userAnswers[qIdx] = oIdx;
};

window.submitQuiz = function () {
  if (!currentQuiz) return;
  if (userAnswers.includes(null)) {
    alert('Please answer all questions.');
    return;
  }

  let correct = 0;
  currentQuiz.forEach((q, qi) => {
    const opts = document.querySelectorAll(`.option[data-q="${qi}"]`);
    opts.forEach((el, oi) => {
      if (oi === q.correctAnswer) el.classList.add('correct');
      else if (oi === userAnswers[qi]) el.classList.add('incorrect');
      el.style.pointerEvents = 'none';
    });
    if (userAnswers[qi] === q.correctAnswer) correct++;
  });

  const percentage = Math.round((correct / currentQuiz.length) * 100);
  quizHistory.unshift({
    id: Date.now(),
    topic: document.getElementById('quizTopic').value,
    score: correct,
    total: currentQuiz.length,
    percentage,
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toISOString()
  });
  saveData();
  updateProgressStats();

  const quizContent = document.getElementById('quizContent');
  const result = document.createElement('div');
  result.className = 'quiz-result';
  result.innerHTML = `
    <h3>Quiz Complete 🎉</h3>
    <p>You scored ${correct} / ${currentQuiz.length} (${percentage}%).</p>
  `;
  quizContent.appendChild(result);
};

// ========= STATS / BADGES / CHARTS =========
function getTotalMinutes() {
  return journalEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
}

function calculateStreak() {
  if (journalEntries.length === 0) return 0;
  const dates = [...new Set(journalEntries.map(e => {
    const d = new Date(e.timestamp);
    d.setHours(0,0,0,0);
    return d.getTime();
  }))].sort((a, b) => b - a);

  let streak = 0;
  let current = new Date();
  current.setHours(0,0,0,0);

  for (const time of dates) {
    if (time === current.getTime()) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else if (time === current.getTime() - 86400000) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else break;
  }
  return streak;
}

const badges = [
  { id: 'first_entry',   name: 'First Step',      icon: '🎯', condition: () => journalEntries.length >= 1 },
  { id: 'five_entries',  name: '5 Sessions',      icon: '📚', condition: () => journalEntries.length >= 5 },
  { id: 'ten_entries',   name: '10 Sessions',     icon: '🔥', condition: () => journalEntries.length >= 10 },
  { id: 'first_quiz',    name: 'Quiz Starter',    icon: '❓', condition: () => quizHistory.length >= 1 },
  { id: 'five_quizzes',  name: '5 Quizzes',       icon: '🧠', condition: () => quizHistory.length >= 5 },
  { id: 'hundred_minutes', name: '100 Minutes',   icon: '⏱️', condition: () => getTotalMinutes() >= 100 },
  { id: 'streak_3',      name: '3 Day Streak',    icon: '📆', condition: () => calculateStreak() >= 3 },
  { id: 'streak_7',      name: '7 Day Streak',    icon: '⚡', condition: () => calculateStreak() >= 7 }
];

function displayBadges() {
  const grid = document.getElementById('badgeGrid');
  if (!grid) return;
  grid.innerHTML = badges.map(b => `
    <div class="badge ${b.condition() ? 'unlocked' : 'locked'}">
      <div class="icon">${b.icon}</div>
      <div class="name">${b.name}</div>
    </div>
  `).join('');
}

function displayQuizHistory() {
  const container = document.getElementById('quizHistoryList');
  if (!container) return;
  if (quizHistory.length === 0) {
    container.innerHTML = `
      <p style="color: var(--text-secondary); text-align: center; padding: 20px;">
        No quizzes taken yet.
      </p>`;
    return;
  }
  container.innerHTML = quizHistory.slice(0, 10).map(q => `
    <div class="quiz-history-item">
      <span>${q.topic} • ${q.date}</span>
      <span class="quiz-score">${q.score}/${q.total} (${q.percentage}%)</span>
    </div>
  `).join('');
}

function updateProgressStats() {
  const totalMinutes = getTotalMinutes();
  const streak = calculateStreak();
  const avg = quizHistory.length
    ? Math.round(quizHistory.reduce((s, q) => s + q.percentage, 0) / quizHistory.length)
    : 0;

  document.getElementById('totalEntries').textContent = journalEntries.length;
  document.getElementById('totalMinutes').textContent = totalMinutes;
  document.getElementById('totalQuizzes').textContent = quizHistory.length;
  document.getElementById('avgScore').textContent = `${avg}%`;
  document.getElementById('streakCount').textContent = streak;

  displayBadges();
  displayQuizHistory();
}

// ========= CHARTS =========
let studyChart = null;
let quizChart = null;

function renderCharts() {
  renderStudyChart();
  renderQuizChart();
}

function renderStudyChart() {
  const canvas = document.getElementById('studyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const labels = [];
  const data = [];
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString();
    labels.push(label);
    const mins = journalEntries
      .filter(e => {
        const ed = new Date(e.timestamp);
        ed.setHours(0,0,0,0);
        return ed.getTime() === d.getTime();
      })
      .reduce((s, e) => s + (e.duration || 0), 0);
    data.push(mins);
  }

  if (studyChart) studyChart.destroy();
  studyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Study Minutes',
        data,
        backgroundColor: 'rgba(102,126,234,0.7)',
        borderColor: 'rgba(102,126,234,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderQuizChart() {
  const canvas = document.getElementById('quizChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (quizHistory.length === 0) {
    if (quizChart) quizChart.destroy();
    return;
  }

  const last = quizHistory.slice(0, 10).reverse();
  const labels = last.map((_, i) => `Quiz ${i + 1}`);
  const scores = last.map(q => q.percentage);

  if (quizChart) quizChart.destroy();
  quizChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Score (%)',
        data: scores,
        borderColor: 'rgba(72,187,120,1)',
        backgroundColor: 'rgba(72,187,120,0.2)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

// ========= CLEAR ALL =========
window.clearAllData = function () {
  if (!confirm('⚠️ This deletes ALL notes & quiz history. Continue?')) return;
  journalEntries = [];
  quizHistory = [];
  localStorage.clear();
  displayJournalEntries();
  updateProgressStats();
  alert('All data cleared.');
};

// ========= INIT =========
window.addEventListener('load', () => {
  displayJournalEntries();
  updateProgressStats();
});
