import React, { useEffect, useState } from "react";

const QUIZ_HISTORY_KEY = "sj-quiz-history";

const QUESTION_BANK = {
  Mathematics: [
    {
      q: "What is the value of π (pi) to two decimal places?",
      options: ["3.14", "3.15", "3.16", "3.17"],
      answer: 0,
    },
    {
      q: "What is 7 × 6?",
      options: ["36", "40", "42", "48"],
      answer: 2,
    },
    {
      q: "What is the square root of 144?",
      options: ["10", "11", "12", "13"],
      answer: 2,
    },
    {
      q: "What is 2x + 3 = 11, solve for x.",
      options: ["3", "4", "5", "6"],
      answer: 1,
    },
    {
      q: "What is the perimeter of a rectangle with length 5 and width 3?",
      options: ["16", "15", "18", "20"],
      answer: 0,
    },
  ],
  Science: [
    {
      q: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
      answer: 1,
    },
    {
      q: "Water boils at what temperature (at sea level)?",
      options: ["50°C", "75°C", "100°C", "120°C"],
      answer: 2,
    },
    {
      q: "Which gas do plants absorb for photosynthesis?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      answer: 1,
    },
    {
      q: "What force keeps us on the ground?",
      options: ["Magnetism", "Gravity", "Friction", "Inertia"],
      answer: 1,
    },
    {
      q: "What is H₂O commonly known as?",
      options: ["Hydrogen", "Oxygen", "Water", "Helium"],
      answer: 2,
    },
  ],
};

function QuizPage() {
  const [topic, setTopic] = useState("Mathematics");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(QUIZ_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const handleGenerateQuiz = () => {
    const bank = QUESTION_BANK[topic] || [];
    const count = Math.min(numQuestions, bank.length);
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    setQuizQuestions(selected);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const handleSelect = (qIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!quizQuestions.length) return;
    let s = 0;
    quizQuestions.forEach((q, i) => {
      if (answers[i] === q.answer) s += 1;
    });
    setScore(s);
    setSubmitted(true);

    // save to history
    const attempt = {
      id: Date.now(),
      topic,
      total: quizQuestions.length,
      score: s,
      date: new Date().toISOString(),
    };
    setHistory([attempt, ...history]);
  };

  return (
    <div className="content">
      <h2 className="page-title">Knowledge Quiz</h2>

      {/* Generator section */}
      <section className="quiz-section">
        <h3 className="section-title">Generate Quiz by Topic</h3>

        <div className="form-group">
          <label>Select Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {Object.keys(QUESTION_BANK).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Number of Questions</label>
          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          >
            <option value={3}>3 Questions</option>
            <option value={4}>4 Questions</option>
            <option value={5}>5 Questions</option>
          </select>
        </div>

        <button className="btn" type="button" onClick={handleGenerateQuiz}>
          Generate Quiz
        </button>
      </section>

      {/* Quiz questions */}
      {quizQuestions.length > 0 && (
        <section className="quiz-container">
          <h3 className="section-title">Answer the following questions:</h3>

          {quizQuestions.map((q, i) => (
            <div key={i} className="question">
              <h4>
                Question {i + 1}: {q.q}
              </h4>
              <div className="options">
                {q.options.map((opt, idx) => {
                  const selected = answers[i] === idx;
                  const isCorrect = submitted && idx === q.answer;
                  const isIncorrect =
                    submitted && selected && idx !== q.answer;

                  let className = "option";
                  if (selected) className += " selected";
                  if (isCorrect) className += " correct";
                  if (isIncorrect) className += " incorrect";

                  return (
                    <button
                      key={idx}
                      type="button"
                      className={className}
                      onClick={() => handleSelect(i, idx)}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!submitted && (
            <button className="btn" type="button" onClick={handleSubmit}>
              Submit Quiz
            </button>
          )}

          {submitted && (
            <div className="quiz-result">
              <h3>Your Score</h3>
              <p>
                You scored {score} out of {quizQuestions.length}.
              </p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleGenerateQuiz}
              >
                Take Another Quiz
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default QuizPage;
