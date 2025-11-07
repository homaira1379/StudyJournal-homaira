# 📚 Smart Study Journal

Smart Study Journal is a personal learning companion that helps students write notes, track progress, and practice with AI-powered quizzes.

## 🚀 Live Demo

Live App: https://YOUR-VERCEL-URL-HERE  
GitHub Repo: https://github.com/homaira1379/StudyJournal-homaira

## ✨ Features

- 📝 **Study Journal**
  - Add, view, search, and delete study notes.
  - Each entry includes subject/topic, duration, and reflections.
  - Data is stored in `localStorage` so it persists in the browser.

- 🤖 **AI-Powered Tools**
  - Generate multiple-choice quizzes by topic using the `/api/chat` endpoint (OpenAI).
  - (Optional extension) Summarize notes and generate quick Q&A from your own content.

- 📊 **Progress Dashboard**
  - Total study sessions and total minutes studied.
  - Number of quizzes taken and average score.
  - 7-day study time chart.
  - Quiz performance chart.
  - Daily streak tracker.

- 🏆 **Achievements**
  - Unlock badges for milestones like:
    - First entry
    - Multiple sessions
    - Quiz attempts
    - Total minutes studied
    - Study streaks

- 🎨 **Themes**
  - Multiple color themes (Default, Dark, Ocean, Sunset, Forest).

## 🧱 Tech Stack

- HTML, CSS, JavaScript
- Chart.js for charts
- LocalStorage for persistence
- Vercel serverless function (`/api/chat`) as a proxy to the OpenAI API

## 📂 Project Structure

```bash
public/
  index.html       # Main UI
  styles.css       # Styling
  script.js        # Frontend logic
api/
  chat.js          # Vercel serverless function for OpenAI proxy
