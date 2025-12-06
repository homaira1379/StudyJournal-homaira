import React, { useEffect, useState } from "react";

const STORAGE_KEY = "sj-journal-entries";

function JournalPage() {
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");

  // selected entry for AI tools (only visible when an entry is clicked)
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiQuiz, setAiQuiz] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  // load entries from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // save entries to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!subject.trim() || !duration.trim() || !notes.trim()) return;

    const newEntry = {
      id: Date.now(),
      subject: subject.trim(),
      duration: Number(duration),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setEntries([newEntry, ...entries]);
    setSubject("");
    setDuration("");
    setNotes("");
  };

  const handleDelete = (id) => {
    setEntries(entries.filter((entry) => entry.id !== id));
    if (selectedEntry && selectedEntry.id === id) {
      setSelectedEntry(null);
      setAiSummary("");
      setAiQuiz([]);
      setAiError("");
    }
  };

  const filteredEntries = entries.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.subject.toLowerCase().includes(q) ||
      e.notes.toLowerCase().includes(q)
    );
  });

  // ---- AI helpers (uses your existing /api/chat backend) ----
  const callOpenAI = async (prompt) => {
    setIsLoadingAI(true);
    setAiError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful study assistant for a student’s learning journal.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.choices?.[0]?.message?.content) {
        throw new Error("AI request failed");
      }

      // server already strips ``` from content
      return data.choices[0].message.content;
    } catch (err) {
      console.error(err);
      setAiError("Sorry, something went wrong with the AI request.");
      return "";
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedEntry) return;

    const text = await callOpenAI(
      `Summarize these study notes in 3–5 bullet points for a student:\n\n${selectedEntry.notes}`
    );

    if (!text) return;
    setAiError("");        // clear old error on success
    setAiSummary(text);    // show summary
  };

  const handleGenerateQuiz = async () => {
    if (!selectedEntry) return;

    const text = await callOpenAI(
      `Create 3 short quiz questions (with answers) from these study notes. 
Return as a simple numbered list with question and answer:\n\n${selectedEntry.notes}`
    );
    if (!text) return;

    const lines = text.split("\n").filter((l) => l.trim() !== "");
    const parsed = lines.map((line) => line.trim());

    setAiError("");       // clear old error on success
    setAiQuiz(parsed);    // show quiz
  };

  return (
    <div className="content">
      <h2 className="page-title">My Study Journal</h2>
      <p className="page-subtitle">
        React version of your journal page. Add entries and use AI to summarize
        or create quizzes.
      </p>

      {/* Add New Entry */}
      <section className="journal-form">
        <h3 className="section-title">Add New Entry</h3>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Subject/Topic</label>
            <input
              type="text"
              placeholder="e.g., Mathematics, History, Programming"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              min="0"
              placeholder="How long did you study?"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notes &amp; Reflections</label>
            <textarea
              placeholder="What did you learn? Any challenges? Key takeaways?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn">
            Save Entry
          </button>
        </form>
      </section>

      {/* Search box */}
      <section className="search-box">
        <input
          type="text"
          placeholder="🔍 Search journal entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      {/* Previous entries */}
      <section className="journal-entries-section">
        <h3 className="section-title">
          Previous Entries ({entries.length})
        </h3>

        {filteredEntries.length === 0 ? (
          <p className="empty-state">
            No entries yet. Start by adding your first study session!
          </p>
        ) : (
          <div className="journal-entries">
            {filteredEntries.map((entry) => (
              <article
                key={entry.id}
                className="journal-entry"
                onClick={() => {
                  setSelectedEntry(entry);
                  // clear previous AI outputs when switching entries
                  setAiSummary("");
                  setAiQuiz([]);
                  setAiError("");
                }}
              >
                <h4>{entry.subject}</h4>
                <div className="meta">
                  <span>
                    Date:{" "}
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {" • "}
                  <span>Duration: {entry.duration} min</span>
                </div>
                <p>
                  {entry.notes.length > 150
                    ? entry.notes.slice(0, 150) + "…"
                    : entry.notes}
                </p>
                <button
                  className="delete-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Note view + AI tools (only shown when an entry is selected) */}
      {selectedEntry && (
        <section className="note-view">
          <h3>Selected Entry: {selectedEntry.subject}</h3>
          <div className="note-meta">
            {new Date(selectedEntry.createdAt).toLocaleString()} •{" "}
            {selectedEntry.duration} minutes
          </div>
          <div id="viewContent">{selectedEntry.notes}</div>

          <div className="ai-actions">
            <button
              className="btn btn-small"
              type="button"
              onClick={handleGenerateSummary}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? "Asking AI…" : "Generate Summary"}
            </button>
            <button
              className="btn btn-small"
              type="button"
              onClick={handleGenerateQuiz}
              disabled={isLoadingAI}
            >
              {isLoadingAI ? "Asking AI…" : "Generate Quiz Questions"}
            </button>
          </div>

          {aiError && <p className="error-text">{aiError}</p>}

          <div className="ai-output">
            {aiSummary && (
              <>
                <h4>AI Summary</h4>
                <div className="ai-summary">{aiSummary}</div>
              </>
            )}

            {aiQuiz.length > 0 && (
              <>
                <h4>AI Quiz Questions</h4>
                <ul className="ai-quiz-list">
                  {aiQuiz.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                  {aiQuiz.length === 0 && (
                    <li className="muted">
                      No quiz questions yet. Click “Generate Quiz Questions”.
                    </li>
                  )}
                </ul>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default JournalPage;
