import React from "react";

function AboutPage() {
  return (
    <div className="content">
      <h2 className="page-title">What is Study Journal?</h2>

      <section className="about-section">
        <p>
          Study Journal is your personal learning dashboard to capture notes,
          generate quizzes, and see your progress over time.
        </p>
      </section>

      <section className="about-section">
        <h3>Key Features</h3>
        <ul>
          <li>
            <strong>Study Log:</strong> Save detailed study notes.
          </li>
          <li>
            <strong>AI Summary &amp; Quiz:</strong> Turn long notes into key
            points and questions.
          </li>
          <li>
            <strong>Progress Tracking:</strong> Charts &amp; streaks to keep you
            motivated.
          </li>
          <li>
            <strong>Achievements:</strong> Unlock badges as you study.
          </li>
          <li>
            <strong>Local-First:</strong> Data stored in your browser via
            localStorage.
          </li>
        </ul>
      </section>
    </div>
  );
}

export default AboutPage;
