import React, { useState, useEffect } from "react";
import "./App.css";

import HomePage from "./pages/HomePage";
import JournalPage from "./pages/JournalPage";
import QuizPage from "./pages/QuizPage";
import ProgressPage from "./pages/ProgressPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

function App() {
  const [activePage, setActivePage] = useState("home");
  const [theme, setTheme] = useState("default");

  // apply theme class to <body> so your CSS works
  useEffect(() => {
    const body = document.body;
    body.classList.remove(
      "dark-theme",
      "ocean-theme",
      "sunset-theme",
      "forest-theme"
    );

    if (theme === "dark") body.classList.add("dark-theme");
    if (theme === "ocean") body.classList.add("ocean-theme");
    if (theme === "sunset") body.classList.add("sunset-theme");
    if (theme === "forest") body.classList.add("forest-theme");
  }, [theme]);

  return (
    <div className="container">
      {/* TOP BAR (exactly like screenshot) */}
      <nav>
        <h1>📚 Study Journal</h1>

        <ul>
          <li>
            <button
              className={activePage === "home" ? "active" : ""}
              onClick={() => setActivePage("home")}
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={activePage === "journal" ? "active" : ""}
              onClick={() => setActivePage("journal")}
            >
              My Journal
            </button>
          </li>
          <li>
            <button
              className={activePage === "quiz" ? "active" : ""}
              onClick={() => setActivePage("quiz")}
            >
              Take Quiz
            </button>
          </li>
          <li>
            <button
              className={activePage === "progress" ? "active" : ""}
              onClick={() => setActivePage("progress")}
            >
              Progress
            </button>
          </li>
          <li>
            <button
              className={activePage === "about" ? "active" : ""}
              onClick={() => setActivePage("about")}
            >
              About
            </button>
          </li>
          <li>
            <button
              className={activePage === "contact" ? "active" : ""}
              onClick={() => setActivePage("contact")}
            >
              Contact
            </button>
          </li>
        </ul>

        {/* coloured theme circles on the right */}
        <div className="theme-selector">
          <button
            className="theme-btn default"
            onClick={() => setTheme("default")}
            aria-label="Default theme"
          />
          <button
            className="theme-btn dark"
            onClick={() => setTheme("dark")}
            aria-label="Dark theme"
          />
          <button
            className="theme-btn ocean"
            onClick={() => setTheme("ocean")}
            aria-label="Ocean theme"
          />
          <button
            className="theme-btn sunset"
            onClick={() => setTheme("sunset")}
            aria-label="Sunset theme"
          />
          <button
            className="theme-btn forest"
            onClick={() => setTheme("forest")}
            aria-label="Forest theme"
          />
        </div>
      </nav>

      {/* WHITE “WINDOW” CONTENT */}
      <div className="content">
        {activePage === "home" && (
          <HomePage onStartJournaling={() => setActivePage("journal")} />
        )}
        {activePage === "journal" && <JournalPage />}
        {activePage === "quiz" && <QuizPage />}
        {activePage === "progress" && <ProgressPage />}
        {activePage === "about" && <AboutPage />}
        {activePage === "contact" && <ContactPage />}
      </div>
    </div>
  );
}

export default App;
