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

// ========= BADGES / STATS HELPERS =========
function getTotalMinutes() {
  return journalEntries.reduce((sum, e) => sum + e.duration, 0);
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
    } else if (diff > streak) break;
  }
  return streak;
}

const badges = [
  { id: 'first_entry', name: 'First Step', icon: '🎯', condition: () => journalEntries.length >= 1 },
  { id: 'five_entries', name: '5 Sessions', icon: '📚', condition: () => journalEntries.length >= 5 },
  { id: 'ten_entries', name: '10 Sessions', icon: '🔥', condition: () => journalEntries.length >= 10 },
  { id: 'first_quiz', name: 'Quiz Taker', icon: '❓', condition: () => quizHistory.length >= 1 },
  { id: 'five_quizzes', name: '5 Quizzes', icon: '🧠', condition: () => quizHistory.length >= 5 },
  { id: 'ten_quizzes', name: '10 Quizzes', icon: '🎓', condition: () => quizHistory.length >= 10 },
  { id: 'hundred_minutes', name: '100 Minutes', icon: '⏱️', condition: () => getTotalMinutes() >= 100 },
  { id: 'thousand_minutes', name: '1000 Minutes', icon: '⚡', condition: () => getTotalMinutes() >= 1000 },
  { id: 'perfect_score', name: 'Perfect Score', icon: '💯', condition: () => quizHistory.some(q => q.percentage === 100) },
  { id: 'streak_7', name: '7 Day Streak', icon: '🔥', condition: () => calculateStreak() >= 7 }
];

function displayBadges() {
  const grid = document.getElementById('badgeGrid');
  if (!grid) return;
  grid.innerHTML = badges
    .map(
      b => `
    <div class="badge ${b.condition() ? 'unlocked' : 'locked'}">
      <div class="icon">${b.icon}</div>
      <div class="name">${b.name}</div>
    </div>`
    )
    .join('');
}

// ========= JOURNAL =========
const journalForm = document.getElementById('journalForm');

journalForm?.addEventListener('submit', e => {
  e.preventDefault();
  const entry = {
    id: Date.now(),
    subject: document.getElementById('subject').value.trim(),
    duration: parseInt(document.getElementById('duration').value, 10),
    notes: document.getElementById('notes').value.trim(),
    date: new Date().toLocaleDateString(),
    timestamp: new Date().toISOString()
  };
  if (!entry.subject || !entry.notes || !entry.duration) {
    alert('Please fill in all fields.');
    return;
  }
  journalEntries.unshift(entry);
  saveData();
  displayJournalEntries();
  journalForm.reset();
  alert('Entry saved successfully! 🎉');
});

let currentEntry = null;

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

  if (list.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 40px; font-size: 16px;">No entries found.</p>';
    document.getElementById('noteView')?.classList.add('hidden');
    return;
  }

  container.innerHTML = list
    .map(
      e => `
      <div class="journal-entry" onclick="openEntry(${e.id})">
        <button class="delete-btn" onclick="deleteEntry(${e.id}); event.stopPropagation();">Delete</button>
        <h4>${e.subject}</h4>
        <div class="meta">📅 ${e.date} | ⏱️ ${e.duration} minutes</div>
        <p>${e.notes}</p>
      </div>`
    )
    .join('');
}

function searchEntries() {
  const term = document.getElementById('searchInput').value;
  displayJournalEntries(term);
}

function deleteEntry(id) {
  if (confirm('Delete this entry?')) {
    journalEntries = journalEntries.filter(e => e.id !== id);
    saveData();
    displayJournalEntries();
    if (currentEntry && currentEntry.id === id) {
      document.getElementById('noteView')?.classList.add('hidden');
      currentEntry = null;
    }
  }
}

// ========= NOTE VIEW + AI ACTIONS =========
window.openEntry = function (id) {
  const entry = journalEntries.find(e => e.id === id);
  if (!entry) return;
  currentEntry = entry;

  const noteView = document.getElementById('noteView');
  document.getElementById('viewTitle').textContent =
    entry.subject || 'Study Note';
  document.getElementById('viewSubject').textContent = entry.subject || '';
  document.getElementById('viewDate').textContent = entry.date || '';
  document.getElementById('viewContent').textContent = entry.notes || '';

  document.getElementById('viewSummary').textContent =
    'Click "Summarize with AI" to generate a short summary of this note.';
  const quizList = document.getElementById('viewQuiz');
  quizList.innerHTML =
    '<li class="muted">Click "Generate AI Quiz" to get practice questions from this note.</li>';

  noteView.classList.remove('hidden');
};

async function callChatApi(body) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Request failed');
  }

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content || '';

  content = content.trim();
  if (content.startsWith('```')) {
    content = content
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
  }

  return content;
}

async function handleNoteSummary() {
  const summaryBox = document.getElementById('viewSummary');
  if (!currentEntry) {
    summaryBox.textContent = 'Please select a journal entry first.';
    return;
  }
  summaryBox.textContent = '🔄 Summarizing your note...';

  try {
    const content = await callChatApi({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Summarize this study note into 3-5 concise bullet points for a student:\n\n${currentEntry.notes}`
        }
      ],
      temperature: 0.5
    });

    summaryBox.textContent = content;
  } catch (err) {
    console.error(err);
    summaryBox.textContent =
      '❌ Could not generate summary. Check your API key / server and try again.';
  }
}

async function handleNoteQuiz() {
  const quizList = document.getElementById('viewQuiz');
  if (!currentEntry) {
    quizList.innerHTML =
      '<li class="muted">Please select a journal entry first.</li>';
    return;
  }
  quizList.innerHTML = '<li class="muted">🔄 Generating questions...</li>';

  try {
    const content = await callChatApi({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content:
            `From this study note, create 3 short Q&A practice questions.\n` +
            `Return them as plain text bullets like "Q: ... A: ...".\n\n` +
            currentEntry.notes
        }
      ],
      temperature: 0.7
    });

    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l);

    if (!lines.length) {
      quizList.innerHTML =
        '<li class="muted">No questions returned. Try again.</li>';
      return;
    }

    quizList.innerHTML = lines
      .map(line => `<li>${line}</li>`)
      .join('');
  } catch (err) {
    console.error(err);
    quizList.innerHTML =
      '<li class="muted">❌ Could not generate quiz. Check your API key / server.</li>';
  }
}

document
  .getElementById('btnSummary')
  ?.addEventListener('click', handleNoteSummary);
document
  .getElementById('btnQuiz')
  ?.addEventListener('click', handleNoteQuiz);

// ========= TOPIC QUIZ (existing) =========
let currentQuiz = null;
let userAnswers = [];

async function generateQuiz() {
  const topic = document.getElementById('quizTopic').value || 'general';
  const numQuestions =
    document.getElementById('numQuestions').value || 5;
  const btn = document.getElementById('generateQuizBtn');
  const quizContent = document.getElementById('quizContent');

  btn.disabled = true;
  btn.textContent = 'Generating Quiz...';
  quizContent.innerHTML =
    '<div class="loading">🔄 Creating your quiz... Please wait.</div>';

  try {
    const content = await callChatApi({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Create ${numQuestions} multiple choice questions about ${topic}.
Return ONLY valid JSON array like:
[
  {
    "question": "Question text?",
    "options": ["A","B","C","D"],
    "correctAnswer": 0
  }
]`
        }
      ],
      temperature: 0.7
    });

    const quizData = JSON.parse(content);
    currentQuiz = {
      topic,
      questions: quizData,
      startTime: new Date()
    };
    userAnswers = new Array(quizData.length).fill(null);
    displayQuiz();
  } catch (err) {
    console.error(err);
    quizContent.innerHTML = `
      <div class="api-warning">
        <h4>❌ Error Generating Quiz</h4>
        <p>${err.message || 'Failed to generate quiz.'}</p>
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
      <h3 style="color: var(--primary); margin-bottom: 25px; font-size: 24px;">
        Answer the following questions:
      </h3>
      ${currentQuiz.questions
        .map(
          (q, qIndex) => `
        <div class="question">
          <h4>Question ${qIndex + 1}: ${q.question}</h4>
          <div class="options">
            ${q.options
              .map(
                (opt, oIndex) => `
              <div class="option"
                   onclick="selectOption(${qIndex}, ${oIndex})"
                   data-q="${qIndex}"
                   data-o="${oIndex}">
                ${String.fromCharCode(65 + oIndex)}. ${opt}
              </div>`
              )
              .join('')}
          </div>
        </div>`
        )
        .join('')}
      <button class="btn" onclick="submitQuiz()" style="margin-top: 20px;">Submit Quiz</button>
    </div>
  `;
}

window.selectOption = function (qIdx, oIdx) {
  const opts = document.querySelectorAll(`[data-q="${qIdx}"]`);
  opts.forEach(el => el.classList.remove('selected'));
  document
    .querySelector(`[data-q="${qIdx}"][data-o="${oIdx}"]`)
    .classList.add('selected');
  userAnswers[qIdx] = oIdx;
};

window.submitQuiz = function () {
  if (userAnswers.includes(null)) {
    alert('Please answer all questions before submitting!');
    return;
  }
  let correct = 0;

  currentQuiz.questions.forEach((q, idx) => {
    const opts = document.querySelectorAll(`[data-q="${idx}"]`);
    opts.forEach((el, oi) => {
      if (oi === q.correctAnswer) el.classList.add('correct');
      else if (
        oi === userAnswers[idx] &&
        userAnswers[idx] !== q.correctAnswer
      )
        el.classList.add('incorrect');
      el.style.pointerEvents = 'none';
    });
    if (userAnswers[idx] === q.correctAnswer) correct++;
  });

  const percentage = Math.round(
    (correct / currentQuiz.questions.length) * 100
  );
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

  const resultHTML = `
    <div class="quiz-result">
      <h3>Quiz Complete! 🎉</h3>
      <p>You scored ${correct} / ${
    currentQuiz.questions.length
  } (${percentage}%)</p>
      <button class="btn" onclick="generateQuiz()" style="margin-top: 20px;">
        Take Another Quiz
      </button>
    </div>
  `;
  document
    .getElementById('quizContent')
    .insertAdjacentHTML('beforeend', resultHTML);
  document.querySelector('.quiz-container button').remove();
};

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
        quizHistory.reduce((s, q) => s + q.percentage, 0) /
          quizHistory.length
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

  if (quizHistory.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 20px; font-size: 16px;">No quizzes taken yet. Take your first quiz!</p>';
    return;
  }
  container.innerHTML = quizHistory
    .slice(0, 10)
    .map(
      q => `
    <div class="quiz-history-item">
      <span>${q.topic} - ${q.date}</span>
      <span class="quiz-score">${q.score}/${q.total} (${q.percentage}%)</span>
    </div>`
    )
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
      .reduce((s, e) => s + e.duration, 0);
    minutes.push(m);
  }

  if (studyChart) studyChart.destroy();
  studyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: last7Days,
      datasets: [
        {
          label: 'Study Minutes',
          data: minutes,
          backgroundColor: 'rgba(102,126,234,.6)',
          borderColor: 'rgba(102,126,234,1)',
          borderWidth: 2
        }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
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

  const last10 = quizHistory.slice(0, 10).reverse();
  const labels = last10.map((_, i) => `Quiz ${i + 1}`);
  const scores = last10.map(q => q.percentage);

  if (quizChart) quizChart.destroy();
  quizChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Score (%)',
          data: scores,
          backgroundColor: 'rgba(72,187,120,.2)',
          borderColor: 'rgba(72,187,120,1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

// ========= CLEAR ALL =========
function clearAllData() {
  if (
    confirm('⚠️ This deletes ALL data. Continue?') &&
    confirm('Are you REALLY sure?')
  ) {
    journalEntries = [];
    quizHistory = [];
    localStorage.clear();
    displayJournalEntries();
    updateProgressStats();
    alert('All data has been cleared.');
  }
}

window.clearAllData = clearAllData;

// ========= INIT =========
window.addEventListener('load', () => {
  displayJournalEntries();
  updateProgressStats();
});
