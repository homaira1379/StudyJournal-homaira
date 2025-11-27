import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

const JOURNAL_KEY = "sj-journal-entries";
const QUIZ_HISTORY_KEY = "sj-quiz-history";

function ProgressPage() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // load data
  useEffect(() => {
    try {
      const j = localStorage.getItem(JOURNAL_KEY);
      if (j) setJournalEntries(JSON.parse(j));
    } catch {}

    try {
      const q = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (q) setQuizHistory(JSON.parse(q));
    } catch {}
  }, []);

  const totalSessions = journalEntries.length;
  const totalMinutes = journalEntries.reduce(
    (sum, e) => sum + (Number(e.duration) || 0),
    0
  );
  const totalQuizzes = quizHistory.length;
  const avgScore =
    quizHistory.length > 0
      ? Math.round(
          quizHistory.reduce(
            (sum, q) => sum + (q.score / q.total) * 100,
            0
          ) / quizHistory.length
        )
      : 0;

  // simple achievements
  const badges = [
    {
      id: "first",
      icon: "🚀",
      name: "First Step",
      unlocked: totalSessions >= 1,
    },
    {
      id: "fiveSessions",
      icon: "📚",
      name: "5 Sessions",
      unlocked: totalSessions >= 5,
    },
    {
      id: "tenSessions",
      icon: "📘",
      name: "10 Sessions",
      unlocked: totalSessions >= 10,
    },
    {
      id: "quizTaker",
      icon: "❓",
      name: "Quiz Taker",
      unlocked: totalQuizzes >= 1,
    },
    {
      id: "fiveQuizzes",
      icon: "🧠",
      name: "5 Quizzes",
      unlocked: totalQuizzes >= 5,
    },
    {
      id: "hundredMinutes",
      icon: "⏱️",
      name: "100 Minutes",
      unlocked: totalMinutes >= 100,
    },
  ];

  // prepare data for last 7 days
  useEffect(() => {
    const ctx = chartRef.current;
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const days = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      days.push(label);

      const totalForDay = journalEntries
        .filter((e) => {
          const d = new Date(e.createdAt);
          return (
            d.getFullYear() === date.getFullYear() &&
            d.getMonth() === date.getMonth() &&
            d.getDate() === date.getDate()
          );
        })
        .reduce((sum, e) => sum + (Number(e.duration) || 0), 0);

      data.push(totalForDay);
    }

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: days,
        datasets: [
          {
            label: "Study Minutes",
            data,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }, [journalEntries]);

  const clearAllData = () => {
    if (!window.confirm("Clear all study + quiz data?")) return;
    localStorage.removeItem(JOURNAL_KEY);
    localStorage.removeItem(QUIZ_HISTORY_KEY);
    setJournalEntries([]);
    setQuizHistory([]);
  };

  return (
    <div className="content">
      <h2 className="page-title">Your Progress</h2>

      {/* Big streak card (simple version: total sessions) */}
      <section className="streak-display">
        <h3>{totalSessions}</h3>
        <p>Study Sessions Logged</p>
      </section>

      {/* Stats cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <h3>{totalSessions}</h3>
          <p>Total Study Sessions</p>
        </div>
        <div className="stat-card">
          <h3>{totalMinutes}</h3>
          <p>Minutes Studied</p>
        </div>
        <div className="stat-card">
          <h3>{totalQuizzes}</h3>
          <p>Quizzes Taken</p>
        </div>
        <div className="stat-card">
          <h3>{avgScore}%</h3>
          <p>Average Quiz Score</p>
        </div>
      </section>

      {/* Achievements */}
      <section className="achievements">
        <h3>Achievements</h3>
        <div className="badge-grid">
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
      </section>

      {/* Study time chart */}
      <section className="chart-container">
        <h3>Study Time Over Last 7 Days</h3>
        <canvas ref={chartRef} height={120} />
      </section>

      {/* Quiz history */}
      <section className="quiz-history">
        <h3>Quiz History</h3>
        {quizHistory.length === 0 ? (
          <p className="empty-state">
            No quizzes taken yet. Take your first quiz!
          </p>
        ) : (
          quizHistory.map((q) => (
            <div key={q.id} className="quiz-history-item">
              <span>
                {new Date(q.date).toLocaleDateString()} • {q.topic}
              </span>
              <span className="quiz-score">
                {q.score}/{q.total}
              </span>
            </div>
          ))
        )}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={clearAllData}
        >
          Clear All Data
        </button>
      </section>
    </div>
  );
}

export default ProgressPage;
