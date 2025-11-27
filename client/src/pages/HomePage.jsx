// src/pages/HomePage.jsx
import React from "react";

function HomePage({ onStartJournaling }) {
  return (
    <div className="page home active">
      {/* HERO SECTION */}
      <section className="hero">
        <h2>Welcome to Study Journal</h2>
        <p>
          Your personal learning companion for tracking progress and mastering
          knowledge.
        </p>
        <button className="btn" onClick={onStartJournaling}>
          Start Journaling
        </button>
      </section>

      {/* FEATURES GRID – 6 CARDS */}
      <section className="features">
        <div className="feature-card">
          <h3>📓 Track Learning</h3>
          <p>Record your daily study sessions and monitor your progress over time.</p>
        </div>

        <div className="feature-card">
          <h3>❓ Quiz Yourself</h3>
          <p>
            Generate quizzes to test your knowledge and reinforce concepts.
          </p>
        </div>

        <div className="feature-card">
          <h3>📊 View Progress</h3>
          <p>Visualize your learning journey with charts and insights.</p>
        </div>

        <div className="feature-card">
          <h3>💾 Auto-Save</h3>
          <p>Your notes, quizzes, and stats are stored locally in your browser.</p>
        </div>

        <div className="feature-card">
          <h3>🏆 Achievements</h3>
          <p>Unlock badges as you build consistent and effective study habits.</p>
        </div>

        <div className="feature-card">
          <h3>🎨 Themes</h3>
          <p>Switch between multiple colour themes to match your mood.</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
