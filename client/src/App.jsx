import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "./App.css";

function getTotalMinutes(entries) {
  return entries.reduce((sum, e) => sum + (e.duration || 0), 0);
}

function calculateStreak(entries) {
  if (!entries.length) return 0;

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (const entry of sorted) {
    const d = new Date(entry.timestamp);
    d.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((cursor - d) / 86400000);

    if (diffDays === streak) {
      streak++;
      cursor = d;
    } else if (diffDays > streak) {
      break;
    }
  }

  return streak;
}

async function callChatApi(payload) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("OpenAI error:", data);
    throw new Error(
      data.error?.message || data.error || "API error from /api/chat"
    );
  }

  let content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Invalid AI response format");
  }
  content = content.trim();
  if (content.startsWith("```")) {
    content = content
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
  }
  return content;
}

function App() {
  // NAV + THEME
  const [activePage, setActivePage] = useState("home");
  const [theme, setTheme] = useState("default");

  // JOURNAL FORM
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  // JOURNAL DATA
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  // AI (journal page)
  const [aiSummary, setAiSummary] = useState("");
  const [aiNoteQuiz, setAiNoteQuiz] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingJournalQuiz, setLoadingJournalQuiz] = useState(false);
  const [apiError, setApiError] = useState("");

  // TOPIC QUIZ PAGE
  const [quizTopic, setQuizTopic] = useState("Mathematics");
  const [numQuestions, setNumQuestions] = useState("5");
  const [quizGenerating, setQuizGenerating] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [currentQuiz, setCurrentQuiz] = useState(null); // {topic, questions:[{question,options,correctAnswer}]}
  const [userAnswers, setUserAnswers] = useState([]); // [index]
  const [quizResult, setQuizResult] = useState("");

  // QUIZ HISTORY (for progress page)
  const [quizHistory, setQuizHistory] = useState([]);

  // CHART REFS
  const studyChartCanvasRef = useRef(null);
  const quizChartCanvasRef = useRef(null);
  const studyChartInstance = useRef(null);
  const quizChartInstance = useRef(null);

  // ========= THEME =========
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "default";
    setTheme(saved);
  }, []);

  useEffect(() => {
    document.body.className = theme === "default" ? "" : `${theme}-theme`;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const changeTheme = (name) => setTheme(name);

  // ========= LOAD/SAVE DATA =========
  useEffect(() => {
    try {
      const rawEntries = localStorage.getItem("journalEntries");
      const rawHistory = localStorage.getItem("quizHistory");

      if (rawEntries) {
        const parsed = JSON.parse(rawEntries);
        if (Array.isArray(parsed)) setEntries(parsed);
      }
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) setQuizHistory(parsed);
      }
    } catch {
      // ignore bad data
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("journalEntries", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("quizHistory", JSON.stringify(quizHistory));
  }, [quizHistory]);

  // ========= NAV BUTTON CLASS =========
  const navBtnClass = (page) =>
    `nav-btn${activePage === page ? " active" : ""}`;

  // ========= JOURNAL: ADD / FILTER / SELECT =========
  const handleJournalSubmit = (e) => {
    e.preventDefault();
    const s = subject.trim();
    const d = parseInt(duration, 10);
    const n = notes.trim();

    if (!s || !n || !d || d <= 0) {
      alert("Please fill in all fields with valid values.");
      return;
    }

    const entry = {
      id: Date.now(),
      subject: s,
      duration: d,
      notes: n,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
    };

    const nextEntries = [entry, ...entries];
    setEntries(nextEntries);
    setSubject("");
    setDuration("");
    setNotes("");
    setSelectedEntryId(entry.id);
    setAiSummary("");
    setAiNoteQuiz("");
    setApiError("");
  };

  const handleDeleteEntry = (id) => {
    if (!window.confirm("Delete this entry?")) return;
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
      setAiSummary("");
      setAiNoteQuiz("");
    }
  };

  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter(
      (e) =>
        e.subject.toLowerCase().includes(term) ||
        e.notes.toLowerCase().includes(term)
    );
  }, [entries, searchTerm]);

  const selectedEntry =
    entries.find((e) => e.id === selectedEntryId) || null;

  const entryCount = filteredEntries.length;

  // ========= JOURNAL AI ACTIONS =========
  async function generateNoteSummary() {
    if (!selectedEntry) {
      alert("Please select a journal entry first.");
      return;
    }
    setLoadingSummary(true);
    setAiSummary("Generating summary...");
    setApiError("");

    try {
      const content = await callChatApi({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Summarize the following study note into 3–5 short bullet points aimed at a student reviewing for an exam:\n\n${selectedEntry.notes}`,
          },
        ],
        temperature: 0.5,
      });

      const bullets = content
        .split(/\n+/)
        .map((line) => line.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);

      setAiSummary(
        bullets.length ? bullets.map((b) => "• " + b).join("\n") : content
      );
    } catch (err) {
      console.error(err);
      setApiError(err.message);
      setAiSummary("");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function generateNoteQuiz() {
    if (!selectedEntry) {
      alert("Please select a journal entry first.");
      return;
    }
    setLoadingJournalQuiz(true);
    setAiNoteQuiz("Generating quiz...");
    setApiError("");

    try {
      const content = await callChatApi({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content:
              `Create 5 short question-and-answer pairs based ONLY on this student's study notes.\n` +
              `Format as:\nQ: ...\nA: ...\n\nNotes:\n\n${selectedEntry.notes}`,
          },
        ],
        temperature: 0.7,
      });

      setAiNoteQuiz(content.trim());
    } catch (err) {
      console.error(err);
      setApiError(err.message);
      setAiNoteQuiz("");
    } finally {
      setLoadingJournalQuiz(false);
    }
  }

  // ========= TOPIC QUIZ (Take Quiz page) =========
  async function handleGenerateQuiz(e) {
    e.preventDefault();
    setQuizError("");
    setQuizResult("");
    setCurrentQuiz(null);
    setUserAnswers([]);

    setQuizGenerating(true);

    try {
      const content = await callChatApi({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Create ${numQuestions} multiple-choice questions about ${quizTopic}.
Return ONLY valid JSON in this exact structure:
[
  {
    "question": "Question text?",
    "options": ["A","B","C","D"],
    "correctAnswer": 0
  }
]`,
          },
        ],
        temperature: 0.7,
      });

      let quizData;
      try {
        quizData = JSON.parse(content);
      } catch (err) {
        console.warn("Failed to parse topic quiz JSON", content);
        throw new Error("AI response was not valid JSON. Try again.");
      }

      if (!Array.isArray(quizData) || quizData.length === 0) {
        throw new Error("No questions returned. Try again.");
      }

      const normalized = quizData.map((q) => ({
        question: q.question,
        options: q.options || [],
        correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      }));

      setCurrentQuiz({
        topic: quizTopic,
        questions: normalized,
      });
      setUserAnswers(new Array(normalized.length).fill(null));
    } catch (err) {
      console.error(err);
      setQuizError(err.message);
    } finally {
      setQuizGenerating(false);
    }
  }

  const handleSelectOption = (qIndex, oIndex) => {
    setUserAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = oIndex;
      return next;
    });
  };

  const handleSubmitQuiz = () => {
    if (!currentQuiz) return;

    if (userAnswers.some((a) => a === null)) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let correct = 0;
    currentQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) correct++;
    });

    const percentage = Math.round(
      (correct / currentQuiz.questions.length) * 100
    );

    setQuizResult(
      `You scored ${correct} / ${currentQuiz.questions.length} (${percentage}%)`
    );

    const historyItem = {
      id: Date.now(),
      topic: currentQuiz.topic,
      score: correct,
      total: currentQuiz.questions.length,
      percentage,
      date: new Date().toLocaleDateString(),
      timestamp: new Date().toISOString(),
    };

    setQuizHistory((prev) => [historyItem, ...prev]);
  };

  // ========= PROGRESS / STATS / BADGES =========
  const totalMinutes = useMemo(
    () => getTotalMinutes(entries),
    [entries]
  );
  const streakCount = useMemo(
    () => calculateStreak(entries),
    [entries]
  );
  const totalQuizzes = quizHistory.length;
  const avgScore = totalQuizzes
    ? Math.round(
        quizHistory.reduce((s, q) => s + (q.percentage || 0), 0) /
          totalQuizzes
      )
    : 0;

  const badges = useMemo(() => {
    return [
      {
        id: "first_entry",
        name: "First Step",
        icon: "🎯",
        unlocked: entries.length >= 1,
      },
      {
        id: "five_entries",
        name: "5 Sessions",
        icon: "📚",
        unlocked: entries.length >= 5,
      },
      {
        id: "ten_entries",
        name: "10 Sessions",
        icon: "🔥",
        unlocked: entries.length >= 10,
      },
      {
        id: "first_quiz",
        name: "Quiz Taker",
        icon: "❓",
        unlocked: quizHistory.length >= 1,
      },
      {
        id: "five_quizzes",
        name: "5 Quizzes",
        icon: "🧠",
        unlocked: quizHistory.length >= 5,
      },
      {
        id: "ten_quizzes",
        name: "10 Quizzes",
        icon: "🎓",
        unlocked: quizHistory.length >= 10,
      },
      {
        id: "hundred_minutes",
        name: "100 Minutes",
        icon: "⏱️",
        unlocked: totalMinutes >= 100,
      },
      {
        id: "thousand_minutes",
        name: "1000 Minutes",
        icon: "⚡",
        unlocked: totalMinutes >= 1000,
      },
      {
        id: "perfect_score",
        name: "Perfect Score",
        icon: "💯",
        unlocked: quizHistory.some((q) => q.percentage === 100),
      },
      {
        id: "streak_7",
        name: "7 Day Streak",
        icon: "🔥",
        unlocked: streakCount >= 7,
      },
    ];
  }, [entries, quizHistory, totalMinutes, streakCount]);

  // ========= CHARTS =========
  useEffect(() => {
    const canvas = studyChartCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const minutes = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);

      const label = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      labels.push(label);

      const total = entries.reduce((sum, e) => {
        const ed = new Date(e.timestamp);
        ed.setHours(0, 0, 0, 0);
        return ed.getTime() === d.getTime()
          ? sum + (e.duration || 0)
          : sum;
      }, 0);
      minutes.push(total);
    }

    if (studyChartInstance.current) {
      studyChartInstance.current.destroy();
    }

    studyChartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Study Minutes",
            data: minutes,
            backgroundColor: "rgba(102,126,234,0.6)",
            borderColor: "rgba(102,126,234,1)",
            borderWidth: 2,
          },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  }, [entries]);

  useEffect(() => {
    const canvas = quizChartCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!quizHistory.length) {
      if (quizChartInstance.current) {
        quizChartInstance.current.destroy();
        quizChartInstance.current = null;
      }
      return;
    }

    const last10 = quizHistory.slice(0, 10).reverse();
    const labels = last10.map((_, i) => `Quiz ${i + 1}`);
    const scores = last10.map((q) => q.percentage || 0);

    if (quizChartInstance.current) {
      quizChartInstance.current.destroy();
    }

    quizChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Score (%)",
            data: scores,
            backgroundColor: "rgba(72,187,120,0.2)",
            borderColor: "rgba(72,187,120,1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } },
    });
  }, [quizHistory]);

  // ========= CLEAR ALL DATA =========
  const clearAllData = () => {
    if (
      !window.confirm("Are you sure you want to clear all data?") ||
      !window.confirm("Are you REALLY sure?")
    ) {
      return;
    }
    setEntries([]);
    setQuizHistory([]);
    localStorage.clear();
    alert("All data has been cleared.");
  };

  // ========= RENDER =========
  return (
    <div className="container">
      <nav>
        <h1>📚 Study Journal</h1>
        <ul>
          <button
            className={navBtnClass("home")}
            onClick={() => setActivePage("home")}
          >
            Home
          </button>
          <button
            className={navBtnClass("journal")}
            onClick={() => setActivePage("journal")}
          >
            My Journal
          </button>
          <button
            className={navBtnClass("quiz")}
            onClick={() => setActivePage("quiz")}
          >
            Take Quiz
          </button>
          <button
            className={navBtnClass("progress")}
            onClick={() => setActivePage("progress")}
          >
            Progress
          </button>
          <button
            className={navBtnClass("about")}
            onClick={() => setActivePage("about")}
          >
            About
          </button>
          <button
            className={navBtnClass("contact")}
            onClick={() => setActivePage("contact")}
          >
            Contact
          </button>
        </ul>

        <div className="theme-selector">
          <div
            className="theme-btn default"
            title="Default"
            onClick={() => changeTheme("default")}
          ></div>
          <div
            className="theme-btn dark"
            title="Dark"
            onClick={() => changeTheme("dark")}
          ></div>
          <div
            className="theme-btn ocean"
            title="Ocean"
            onClick={() => changeTheme("ocean")}
          ></div>
          <div
            className="theme-btn sunset"
            title="Sunset"
            onClick={() => changeTheme("sunset")}
          ></div>
          <div
            className="theme-btn forest"
            title="Forest"
            onClick={() => changeTheme("forest")}
          ></div>
        </div>
      </nav>

      <div className="content">
        {/* HOME */}
        <div className={`page${activePage === "home" ? " active" : ""}`}>
          <div className="hero">
            <h2>Welcome to Study Journal</h2>
            <p>
              Your personal learning companion for tracking progress and
              mastering knowledge.
            </p>
            <button
              className="btn"
              onClick={() => setActivePage("journal")}
            >
              Start Journaling
            </button>
          </div>

          <div className="features">
            <div className="feature-card">
              <h3>📝 Track Learning</h3>
              <p>
                Record your daily study sessions and monitor your progress over
                time.
              </p>
            </div>
            <div className="feature-card">
              <h3>❓ Quiz Yourself</h3>
              <p>
                Generate quizzes to test your knowledge and reinforce concepts.
              </p>
            </div>
            <div className="feature-card">
              <h3>📊 View Progress</h3>
              <p>
                Visualize your learning journey with charts and insights.
              </p>
            </div>
            <div className="feature-card">
              <h3>💾 Auto-Save</h3>
              <p>Your notes, quizzes, and stats are stored locally.</p>
            </div>
            <div className="feature-card">
              <h3>🏆 Achievements</h3>
              <p>Unlock badges as you build consistent study habits.</p>
            </div>
            <div className="feature-card">
              <h3>🎨 Themes</h3>
              <p>Switch between multiple color themes to match your mood.</p>
            </div>
          </div>
        </div>

        {/* JOURNAL */}
        <div
          className={`page${activePage === "journal" ? " active" : ""}`}
          id="journal"
        >
          <h2 style={{ color: "var(--primary)", marginBottom: 30 }}>
            My Study Journal
          </h2>

          <div className="journal-layout">
            {/* LEFT */}
            <div className="journal-left">
              <div className="journal-form">
                <h3
                  style={{
                    color: "var(--primary)",
                    marginBottom: 20,
                    fontSize: 22,
                  }}
                >
                  Add New Entry
                </h3>

                <form id="journalForm" onSubmit={handleJournalSubmit}>
                  <div className="form-group">
                    <label>Subject/Topic</label>
                    <input
                      type="text"
                      id="subject"
                      placeholder="e.g., Mathematics, History, Programming"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      id="duration"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes &amp; Reflections</label>
                    <textarea
                      id="notes"
                      placeholder="What did you learn? Any challenges? Key takeaways?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn">
                    Save Entry
                  </button>
                </form>
              </div>

              <div className="search-box">
                <input
                  type="text"
                  id="searchInput"
                  placeholder="🔍 Search journal entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <h3
                style={{
                  color: "var(--primary)",
                  margin: "30px 0 20px",
                  fontSize: 22,
                }}
              >
                Previous Entries (<span id="entryCount">{entryCount}</span>)
              </h3>

              <div className="journal-entries" id="journalEntries">
                {filteredEntries.length === 0 ? (
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      textAlign: "center",
                      padding: 40,
                      fontSize: 16,
                    }}
                  >
                    No entries yet. Start by adding your first study session!
                  </p>
                ) : (
                  filteredEntries.map((e) => (
                    <div
                      key={e.id}
                      className={
                        "journal-entry" +
                        (e.id === selectedEntryId ? " selected" : "")
                      }
                      onClick={() => {
                        setSelectedEntryId(e.id);
                        setAiSummary("");
                        setAiNoteQuiz("");
                        setApiError("");
                      }}
                    >
                      <button
                        className="delete-btn"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          handleDeleteEntry(e.id);
                        }}
                      >
                        Delete
                      </button>
                      <h4>{e.subject}</h4>
                      <div className="meta">
                        📅 {e.date} &nbsp; | &nbsp; ⏱️ {e.duration} minutes
                      </div>
                      <p>{e.notes}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="journal-right">
              <div
                id="noteView"
                className={"note-view" + (selectedEntry ? "" : " hidden")}
              >
                <h3 id="viewTitle">Selected Entry</h3>
                <div className="note-meta">
                  <span id="viewSubject">
                    {selectedEntry?.subject || ""}
                  </span>{" "}
                  ·{" "}
                  <span id="viewDate">
                    {selectedEntry
                      ? new Date(selectedEntry.timestamp).toLocaleString()
                      : ""}
                  </span>{" "}
                  ·{" "}
                  <span id="viewDuration">
                    {selectedEntry
                      ? `${selectedEntry.duration} minutes`
                      : ""}
                  </span>
                </div>
                <div id="viewContent">
                  {selectedEntry?.notes
                    ?.split("\n")
                    .map((line, i) => <p key={i}>{line}</p>)}
                </div>

                <div className="ai-actions">
                  <button
                    className="btn btn-small"
                    id="btnSummary"
                    onClick={generateNoteSummary}
                    disabled={loadingSummary || !selectedEntry}
                  >
                    {loadingSummary
                      ? "Summarizing..."
                      : "🧠 Summarize with AI"}
                  </button>
                  <button
                    className="btn btn-small"
                    id="btnNoteQuiz"
                    onClick={generateNoteQuiz}
                    disabled={loadingJournalQuiz || !selectedEntry}
                  >
                    {loadingJournalQuiz
                      ? "Generating quiz..."
                      : "❓ Generate AI Quiz"}
                  </button>
                </div>

                {apiError && (
                  <div className="ai-output error-box">
                    <p>❌ {apiError}</p>
                  </div>
                )}

                <div className="ai-output">
                  <h4>AI Summary</h4>
                  <div id="viewSummary" className="ai-summary">
                    {aiSummary
                      ? aiSummary.split("\n").map((line, i) => (
                          <p key={i}>{line}</p>
                        ))
                      : "Select an entry above, then click “Summarize with AI”."}
                  </div>

                  <h4>AI Quiz (Short Q&A)</h4>
                  <ul id="viewQuiz" className="ai-quiz-list">
                    {aiNoteQuiz ? (
                      aiNoteQuiz.split(/\n+/).map((line, i) => (
                        <li key={i}>{line}</li>
                      ))
                    ) : (
                      <li className="muted">
                        After summarizing, click{" "}
                        <strong>“Generate AI Quiz”</strong> to get practice
                        questions.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAKE QUIZ (TOPIC-BASED) */}
        <div
          className={`page${activePage === "quiz" ? " active" : ""}`}
          id="quiz"
        >
          <h2 style={{ color: "var(--primary)", marginBottom: 30 }}>
            Knowledge Quiz
          </h2>

          <div className="quiz-section">
            <h3
              style={{
                color: "var(--primary)",
                marginBottom: 20,
                fontSize: 22,
              }}
            >
              Generate Quiz by Topic
            </h3>

            <form onSubmit={handleGenerateQuiz}>
              <div className="form-group">
                <label>Select Topic</label>
                <select
                  id="quizTopic"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                  <option value="Programming">Programming</option>
                  <option value="English Literature">
                    English Literature
                  </option>
                  <option value="Geography">Geography</option>
                </select>
              </div>

              <div className="form-group">
                <label>Number of Questions</label>
                <select
                  id="numQuestions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                >
                  <option value="3">3 Questions</option>
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                </select>
              </div>

              <button
                className="btn"
                id="generateQuizBtn"
                type="submit"
                disabled={quizGenerating}
              >
                {quizGenerating ? "Generating Quiz..." : "Generate Quiz"}
              </button>
            </form>
          </div>

          <div id="quizContent">
            {quizError && (
              <div className="ai-output error-box" style={{ marginTop: 20 }}>
                <h4>❌ Error Generating Quiz</h4>
                <p>{quizError}</p>
              </div>
            )}

            {quizGenerating && !currentQuiz && !quizError && (
              <div className="loading" style={{ marginTop: 20 }}>
                🔄 Creating your quiz... Please wait.
              </div>
            )}

            {currentQuiz && (
              <div className="quiz-container">
                <h3
                  style={{
                    color: "var(--primary)",
                    marginBottom: 25,
                    fontSize: 24,
                  }}
                >
                  Answer the following questions:
                </h3>

                {currentQuiz.questions.map((q, qIndex) => (
                  <div className="question" key={qIndex}>
                    <h4>
                      Question {qIndex + 1}: {q.question}
                    </h4>
                    <div className="options">
                      {q.options.map((opt, oIndex) => {
                        const selected = userAnswers[qIndex] === oIndex;
                        const letter = String.fromCharCode(65 + oIndex);
                        return (
                          <div
                            key={oIndex}
                            className={
                              "option" + (selected ? " selected" : "")
                            }
                            onClick={() =>
                              handleSelectOption(qIndex, oIndex)
                            }
                          >
                            {letter}. {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  className="btn"
                  style={{ marginTop: 20 }}
                  onClick={handleSubmitQuiz}
                >
                  Submit Quiz
                </button>

                {quizResult && (
                  <div className="quiz-result" style={{ marginTop: 20 }}>
                    <h3>Quiz Complete! 🎉</h3>
                    <p>{quizResult}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PROGRESS */}
        <div
          className={`page${activePage === "progress" ? " active" : ""}`}
          id="progress"
        >
          <h2 style={{ color: "var(--primary)", marginBottom: 30 }}>
            Your Progress
          </h2>

          <div className="streak-display">
            <h3 id="streakCount">{streakCount}</h3>
            <p>🔥 Day Study Streak</p>
          </div>

          <div className="stats-grid" id="statsGrid">
            <div className="stat-card">
              <h3 id="totalEntries">{entries.length}</h3>
              <p>Total Study Sessions</p>
            </div>
            <div className="stat-card">
              <h3 id="totalMinutes">{totalMinutes}</h3>
              <p>Minutes Studied</p>
            </div>
            <div className="stat-card">
              <h3 id="totalQuizzes">{totalQuizzes}</h3>
              <p>Quizzes Taken</p>
            </div>
            <div className="stat-card">
              <h3 id="avgScore">{avgScore}%</h3>
              <p>Average Quiz Score</p>
            </div>
          </div>

          <div className="achievements">
            <h3>🏆 Achievements</h3>
            <div className="badge-grid" id="badgeGrid">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={
                    "badge " + (b.unlocked ? "unlocked" : "locked")
                  }
                >
                  <div className="icon">{b.icon}</div>
                  <div className="name">{b.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h3>📊 Study Time Over Last 7 Days</h3>
            <canvas id="studyChart" ref={studyChartCanvasRef}></canvas>
          </div>

          <div className="chart-container">
            <h3>📈 Quiz Performance</h3>
            <canvas id="quizChart" ref={quizChartCanvasRef}></canvas>
          </div>

          <div className="quiz-history">
            <h3>Quiz History</h3>
            <div id="quizHistoryList">
              {quizHistory.length === 0 ? (
                <p
                  style={{
                    color: "var(--text-secondary)",
                    textAlign: "center",
                    padding: 20,
                    fontSize: 16,
                  }}
                >
                  No quizzes taken yet. Take your first quiz!
                </p>
              ) : (
                quizHistory.map((q) => (
                  <div
                    className="quiz-history-item"
                    key={q.id}
                  >
                    <span>
                      {q.topic} · {q.date}
                    </span>
                    <span className="quiz-score">
                      {q.score}/{q.total} ({q.percentage}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button
              className="btn btn-secondary"
              onClick={clearAllData}
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* ABOUT */}
        <div
          className={`page${activePage === "about" ? " active" : ""}`}
          id="about"
        >
          <div className="about-section">
            <h3>What is Study Journal?</h3>
            <p>
              Study Journal is your personal learning dashboard to capture
              notes, generate quizzes, and see your progress over time.
            </p>
          </div>

          <div className="about-section">
            <h3>Key Features</h3>
            <ul>
              <li>
                <strong>Study Log:</strong> Save detailed study notes.
              </li>
              <li>
                <strong>AI Summary &amp; Quiz:</strong> Turn long notes
                into key points and questions.
              </li>
              <li>
                <strong>Progress Tracking:</strong> Charts &amp;
                streaks to keep you motivated.
              </li>
              <li>
                <strong>Achievements:</strong> Unlock badges as you
                study.
              </li>
              <li>
                <strong>Local-First:</strong> Data stored in your browser
                via localStorage.
              </li>
            </ul>
          </div>
        </div>

        {/* CONTACT */}
        <div
          className={`page${activePage === "contact" ? " active" : ""}`}
          id="contact"
        >
          <h2 style={{ color: "var(--primary)", marginBottom: 30 }}>
            Get In Touch
          </h2>
          <div className="contact-info">
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: 15,
              }}
            >
              Feel free to reach out for collaboration, questions about this
              project, or opportunities.
            </p>

            <div className="contact-item">
              <strong>📧 Email:</strong>
              <a href="mailto:humaira.yosufi@gmail.com">
                humaira.yosufi@gmail.com
              </a>
            </div>

            <div className="contact-item">
              <strong>💼 LinkedIn:</strong>
              <a
                href="https://www.linkedin.com/in/homaira-yousufi"
                target="_blank"
                rel="noreferrer"
              >
                linkedin.com/in/homaira-yousufi
              </a>
            </div>

            <div className="contact-item">
              <strong>💻 GitHub:</strong>
              <a
                href="https://github.com/homaira1379"
                target="_blank"
                rel="noreferrer"
              >
                github.com/homaira1379
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
