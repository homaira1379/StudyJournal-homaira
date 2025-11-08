// ========= NAVIGATION =========
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

function navigateToPage(pageName) {
  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
  pages.forEach(page => {
    page.classList.toggle('active', page.id === pageName);
  });

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

// ========= HELPERS =========
function getTotalMinutes() {
  return journalEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
}

function calculateStreak() {
  if (journalEntries.length === 0) return 0;
  const sorted = [...journalEntries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  let streak = 0;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);

  for (const entry of sorted) {
    const d = new Date(entry.timestamp);
    d.setHours(0, 0, 0, 0);
    const diff = Math.floor((cur - d) / 86400000);
    if (diff === streak) {
      streak++;
      cur = d;
    } else if (diff > streak) {
      break;
    }
  }
  return streak;
}

// ========= BADGES =========
const badges = [
  { id: 'first_entry',   name: 'First Step',        icon: '🎯', condition: () => journalEntries.length >= 1 },
  { id: 'five_entries',  name: '5 Sessions',        icon: '📚', condition: () => journalEntries.length >= 5 },
  { id: 'ten_entries',   name: '10 Sessions',       icon: '🔥', condition: () => journalEntries.length >= 10 },
  { id: 'first_quiz',    name: 'Quiz Taker',        icon: '❓', condition: () => quizHistory.length >= 1 },
  { id: 'five_quizzes',  name: '5 Quizzes',         icon: '🧠', condition: () => quizHistory.length >= 5 },
  { id: 'ten_quizzes',   name: '10 Quizzes',        icon: '🎓', condition: () => quizHistory.length >= 10 },
  { id: 'hundred_minutes',  name: '100 Minutes',    icon: '⏱️', condition: () => getTotalMinutes() >= 100 },
  { id: 'thousand_minutes', name: '1000 Minutes',   icon: '⚡', condition: () => getTotalMinutes() >= 1000 },
  { id: 'perfect_score',    name: 'Perfect Score',  icon: '💯', condition: () => quizHistory.some(q => q.percentage === 100) },
  { id: 'streak_7',         name: '7 Day Streak',   icon: '🔥', condition: () => calculateStreak() >= 7 }
];

function displayBadges() {
  const grid = document.getElementById('badgeGrid');
  if (!grid) return;
  grid.innerHTML = badges.map(b => `
    <div class="badge ${b.condition() ? 'unlocked':'locked'}">
      <div class="icon">${b.icon}</div>
      <div class="name">${b.name}</div>
    </div>
  `).join('');
}

// ========= JOURNAL =========
const journalForm = document.getElementById('journalForm');
const noteView = document.getElementById('noteView');
const viewTitle = document.getElementById('viewTitle');
const viewSubject = document.getElementById('viewSubject');
const viewDate = document.getElementById('viewDate');
const viewDuration = document.getElementById('viewDuration');
const viewContent = document.getElementById('viewContent');
const viewSummary = document.getElementById('viewSummary');
const viewQuiz = document.getElementById('viewQuiz');

let selectedEntryId = null;

journalForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const subject = document.getElementById('subject').value.trim();
  const duration = parseInt(document.getElementById('duration').value, 10);
  const notes = document.getElementById('notes').value.trim();

  if (!subject || !notes || !duration || duration <= 0) {
    alert('Please fill in all fields.');
    return;
  }

  const now = new Date();
  const entry = {
    id: Date.now(),
    subject,
    duration,
    notes,
    date: now.toLocaleDateString(),
    timestamp: now.toISOString()
  };

  journalEntries.unshift(entry);
  saveData();
  displayJournalEntries();
  journalForm.reset();
  alert('Entry saved successfully! 🎉');
});

function displayJournalEntries(filter = '') {
  const container = document.getElementById('journalEntries');
  const count = document.getElementById('entryCount');
  if (!container) return;

  let list = journalEntries;
  if (filter) {
    const f = filter.toLowerCase();
    list = journalEntries.filter(
      e =>
        e.subject.toLowerCase().includes(f) ||
        e.notes.toLowerCase().includes(f)
    );
  }

  if (count) count.textContent = list.length;

  if (!list.length) {
    container.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 40px; font-size: 16px;">No entries found.</p>';
    noteView?.classList.add('hidden');
    return;
  }

  container.innerHTML = list
    .map(e => `
      <div class="journal-entry" onclick="openNote(${e.id})">
        <button class="delete-btn" onclick="deleteEntry(${e.id}); event.stopPropagation();">Delete</button>
        <h4>${e.subject}</h4>
        <div class="meta">
          📅 ${e.date} &nbsp; | &nbsp; ⏱️ ${e.duration} min
        </div>
        <p>${e.notes.length > 220 ? e.notes.slice(0, 220) + '…' : e.notes}</p>
      </div>
    `)
    .join('');
}

function searchEntries() {
  const term = document.getElementById('searchInput').value;
  displayJournalEntries(term);
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  journalEntries = journalEntries.filter(e => e.id !== id);
  if (selectedEntryId === id) {
    selectedEntryId = null;
    noteView?.classList.add('hidden');
  }
  saveData();
  displayJournalEntries();
  updateProgressStats();
}

window.openNote = function(id) {
  const entry = journalEntries.find(e => e.id === id);
  if (!entry || !noteView) return;
  selectedEntryId = id;

  viewTitle.textContent = entry.subject;
  viewSubject.textContent = entry.subject;
  viewDate.textContent = entry.date;
  viewDuration.textContent = `${entry.duration} min`;
  viewContent.textContent = entry.notes;

  viewSummary.textContent =
    'Click "Summarize with AI" to generate a short summary of this note.';
  viewQuiz.innerHTML =
    '<li class="muted">Click "Generate AI Quiz" to create quick practice questions from this note.</li>';

  noteView.classList.remove('hidden');
};

// ========= AI HELPERS =========
function extractJsonFromContent(content) {
  if (!content || typeof content !== 'string') return null;
  let trimmed = content.trim();
  if (trimmed.startsWith('```')) {
    trimmed = trimmed.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// ========= AI SUMMARY FOR NOTE =========
const btnSummary = document.getElementById('btnSummary');
btnSummary?.addEventListener('click', async () => {
  if (!selectedEntryId) {
    alert('Please select a note first.');
    return;
  }
  const entry = journalEntries.find(e => e.id === selectedEntryId);
  if (!entry) return;

  viewSummary.textContent = 'Generating summary...';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content:
            `Summarize this study note into 3-5 bullet points for a student:\n\n${entry.notes}`
        }],
        temperature: 0.4
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw data;
    }

    let content = data.choices?.[0]?.message?.content || '';
    if (content.startsWith('```')) {
      content = content.replace(/^```(?:markdown)?/i, '').replace(/```$/, '');
    }
    viewSummary.textContent = content.trim();
  } catch (err) {
    console.error(err);
    viewSummary.innerHTML =
      '❌ Could not generate summary. Please try again or check your API key / quota.';
  }
});

// ========= AI QUIZ FROM NOTE =========
const btnNoteQuiz = document.getElementById('btnNoteQuiz');
btnNoteQuiz?.addEventListener('click', async () => {
  if (!selectedEntryId) {
    alert('Please select a note first.');
    return;
  }
  const entry = journalEntries.find(e => e.id === selectedEntryId);
  if (!entry) return;

  viewQuiz.innerHTML = '<li class="muted">Generating quiz questions...</li>';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content:
`Create 3 short Q&A style quiz questions based on this note.
Return ONLY JSON in this format:
[
  {"question":"...","answer":"..."},
  {"question":"...","answer":"..."},
  {"question":"...","answer":"..."}
]
Note:
- Keep questions simple.
- Focus only on this note.

Note text:
${entry.notes}`
        }],
        temperature: 0.5
      })
    });

    const data = await res.json();
    if (!res.ok) throw data;

    const content = data.choices?.[0]?.message?.content || '';
    const quiz = extractJsonFromContent(content);

    if (!Array.isArray(quiz) || !quiz.length) {
      throw new Error('Invalid AI response format');
    }

    viewQuiz.innerHTML = quiz
      .map(q => `<li><strong>Q:</strong> ${q.question}<br/><strong>A:</strong> ${q.answer}</li>`)
      .join('');
  } catch (err) {
    console.error(err);
    viewQuiz.innerHTML =
      '<li class="muted">❌ Error generating quiz. This may be due to API quota or configuration.</li>';
  }
});

// ========= TOPIC QUIZ PAGE (MCQ) =========
let currentQuiz = null;
let userAnswers = [];

async function generateQuiz() {
  const topic = document.getElementById('quizTopic').value || 'general knowledge';
  const numQuestions = parseInt(document.getElementById('numQuestions').value || '5', 10);
  const btn = document.getElementById('generateQuizBtn');
  const quizContent = document.getElementById('quizContent');

  btn.disabled = true;
  btn.textContent = 'Generating Quiz...';
  quizContent.innerHTML = '<div class="loading">🔄 Creating your quiz... Please wait.</div>';

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content:
`Create ${numQuestions} multiple choice questions about ${topic}.
Return ONLY a JSON array like:
[
  {
    "question": "Question text",
    "options": ["A","B","C","D"],
    "correctAnswer": 0
  }
]`
        }],
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (!res.ok) throw data;

    const content = data.choices?.[0]?.message?.content || '';
    const quizData = extractJsonFromContent(content);

    if (!Array.isArray(quizData) || !quizData.length) {
      throw new Error('Invalid quiz format from AI.');
    }

    currentQuiz = { topic, questions: quizData, startTime: new Date() };
    userAnswers = new Array(quizData.length).fill(null);
    displayQuiz();
  } catch (err) {
    console.error(err);
    quizContent.innerHTML = `
      <div class="api-warning">
        <strong>❌ Error Generating Quiz</strong><br/>
        You may have an API configuration or quota issue.
      </div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Quiz';
  }
}

function displayQuiz() {
  const quizContent = document.getElementById('quizContent');
  quizContent.innerHTML = `
    <div class="quiz-container">
      <h3 style="color: var(--primary); margin-bottom: 25px; font-size: 22px;">Answer the questions:</h3>
      ${currentQuiz.questions.map((q, qIndex) => `
        <div class="question">
          <h4>Question ${qIndex + 1}: ${q.question}</h4>
          <div class="options">
            ${q.options.map((opt, oIndex) => `
              <div class="option"
                   data-q="${qIndex}"
                   data-o="${oIndex}"
                   onclick="selectOption(${qIndex}, ${oIndex})">
                ${String.fromCharCode(65 + oIndex)}. ${opt}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      <button class="btn" id="submitQuizBtn" style="margin-top: 10px;">Submit Quiz</button>
    </div>
  `;

  document
    .getElementById('submitQuizBtn')
    .addEventListener('click', submitQuiz);
}

window.selectOption = function(qIdx, oIdx) {
  const opts = document.querySelectorAll(`.option[data-q="${qIdx}"]`);
  opts.forEach(el => el.classList.remove('selected'));
  const chosen = document.querySelector(`.option[data-q="${qIdx}"][data-o="${oIdx}"]`);
  if (chosen) chosen.classList.add('selected');
  userAnswers[qIdx] = oIdx;
};

function submitQuiz() {
  if (!currentQuiz) return;
  if (userAnswers.includes(null)) {
    alert('Please answer all questions before submitting.');
    return;
  }

  let correct = 0;

  currentQuiz.questions.forEach((q, idx) => {
    const opts = document.querySelectorAll(`.option[data-q="${idx}"]`);
    opts.forEach((el, oi) => {
      if (oi === q.correctAnswer) el.classList.add('correct');
      else if (oi === userAnswers[idx] && userAnswers[idx] !== q.correctAnswer) {
        el.classList.add('incorrect');
      }
      el.style.pointerEvents = 'none';
    });
    if (userAnswers[idx] === q.correctAnswer) correct++;
  });

  const percentage = Math.round((correct / currentQuiz.questions.length) * 100);
  const item = {
    id: Date.now(),
    topic: currentQuiz.topic,
    score: correct,
    total: currentQuiz.questions.length,
    percentage,
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toISOString()
  };
  quizHistory.unshift(item);
  saveData();

  const quizContent = document.getElementById('quizContent');
  const resultHTML = `
    <div class="quiz-result">
      <h3>Quiz Complete! 🎉</h3>
      <p>You scored ${correct} / ${currentQuiz.questions.length} (${percentage}%)</p>
    </div>
  `;
  quizContent.insertAdjacentHTML('beforeend', resultHTML);

  const submitBtn = document.getElementById('submitQuizBtn');
  if (submitBtn) submitBtn.remove();

  updateProgressStats();
}

// ========= STATS & CHARTS =========
function updateProgressStats() {
  const totalEntriesEl = document.getElementById('totalEntries');
  const totalMinutesEl = document.getElementById('totalMinutes');
  const totalQuizzesEl = document.getElementById('totalQuizzes');
  const avgScoreEl = document.getElementById('avgScore');
  const streakCountEl = document.getElementById('streakCount');

  if (!totalEntriesEl) return;

  totalEntriesEl.textContent = journalEntries.length;
  totalMinutesEl.textContent = getTotalMinutes();
  totalQuizzesEl.textContent = quizHistory.length;

  const avg = quizHistory.length
    ? Math.round(
        quizHistory.reduce((s, q) => s + (q.percentage || 0), 0) / quizHistory.length
      )
    : 0;
  avgScoreEl.textContent = `${avg}%`;
  streakCountEl.textContent = calculateStreak();

  displayQuizHistory();
  displayBadges();
}

function displayQuizHistory() {
  const container = document.getElementById('quizHistoryList');
  if (!container) return;

  if (!quizHistory.length) {
    container.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 20px; font-size: 16px;">No quizzes taken yet. Take your first quiz!</p>';
    return;
  }

  container.innerHTML = quizHistory
    .slice(0, 10)
    .map(q => `
      <div class="quiz-history-item">
        <span>${q.topic} - ${q.date}</span>
        <span class="quiz-score">${q.score}/${q.total} (${q.percentage}%)</span>
      </div>
    `)
    .join('');
}

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
  const last7Days = [];
  const minutes = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push(d.toLocaleDateString());

    const m = journalEntries
      .filter(e => {
        const ed = new Date(e.timestamp);
        ed.setHours(0, 0, 0, 0);
        return ed.getTime() === d.getTime();
      })
      .reduce((s, e) => s + (e.duration || 0), 0);

    minutes.push(m);
  }

  if (studyChart) studyChart.destroy();
  studyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last7Days,
      datasets: [{
        label: 'Study Minutes',
        data: minutes
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

  if (!quizHistory.length) {
    if (quizChart) quizChart.destroy();
    return;
  }

  const last10 = quizHistory.slice(0, 10).reverse();
  const labels = last10.map((_, i) => `Quiz ${i + 1}`);
  const scores = last10.map(q => q.percentage || 0);

  if (quizChart) quizChart.destroy();
  quizChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Score (%)',
        data: scores,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

// ========= CLEAR ALL =========
function clearAllData() {
  if (!confirm('⚠️ This deletes ALL data. Continue?')) return;
  if (!confirm('Are you REALLY sure?')) return;

  journalEntries = [];
  quizHistory = [];
  localStorage.removeItem('journalEntries');
  localStorage.removeItem('quizHistory');

  displayJournalEntries();
  updateProgressStats();
  if (studyChart) studyChart.destroy();
  if (quizChart) quizChart.destroy();
  alert('All data has been cleared.');
}

window.clearAllData = clearAllData;

// ========= INIT =========
window.addEventListener('load', () => {
  displayJournalEntries();
  updateProgressStats();
});
