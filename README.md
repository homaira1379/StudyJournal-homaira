# 📚 Smart Study Journal

A personal study companion web app that helps you:

- Capture and organize your study notes
- Generate AI-powered summaries and quizzes
- Track your learning progress with streaks, stats, charts, and achievements
- Stay focused with a built-in Focus Mode timer

Deployed on **Vercel** with an **AI backend using the OpenAI API**.

---

## 🚀 Live Demo

- **Live App:** (https://study-journal-homaira-ky33.vercel.app)
- **GitHub Repo:** https://github.com/homaira1379/StudyJournal-homaira

---

## 🧠 Core Features

### 1. ✍️ Smart Journal (Notes & Reflections)
- Add structured entries with:
  - Subject / Topic  
  - Study duration (minutes)  
  - Notes & reflections (what you learned, key ideas, challenges)
- Entries are saved to **localStorage**, so your data persists in the browser.
- Search entries by keyword (subject or note content).
- Delete individual notes.
- Click **“View & AI Tools”** on a note to:
  - Read the full note
  - Run **AI Summary** for that note
  - Generate a **note-based AI quiz**

### 2. 🤖 AI Tools

All AI calls go through `/api/chat` (Vercel serverless function) using your `OPENAI_API_KEY`.

**a) AI Summary (per note)**  
For any selected note:
- “Summarize with AI” → generates a short, bullet-style summary.

**b) AI Quiz from Note**
- “Generate AI Quiz” on a selected note → creates quiz questions based on *your own content*.
- Great for exam revision: questions are aligned with what **you** wrote.

**c) General Topic Quiz (Take Quiz page)**
- Choose a topic (Math, Programming, Science, etc.) and number of questions.
- AI generates **fresh multiple-choice questions each time** (no repetition stored).
- Auto-grading with:
  - Correct / incorrect highlighting
  - Score + percentage
  - Saved to **Quiz History** & used in your statistics.

### 3. 📈 Progress & Analytics

On the **Progress** page:

- 🔥 **Study Streak** – consecutive days with at least one entry
- 📊 **Stats Cards**:
  - Total study sessions  
  - Total minutes studied  
  - Quizzes taken  
  - Average quiz score
- 🏅 **Achievements / Badges**:
  - First entry, 5/10 sessions
  - First / 5 / 10 quizzes
  - 100+ / 1000+ minutes
  - Perfect score
  - 7-day streak
- 📊 **Charts** (via Chart.js):
  - Study minutes over last 7 days
  - Quiz performance over recent quizzes
- 📝 **Quiz History**: recent scores & topics

### 4. 🎯 Focus Mode (Optional Section on Home)
- Simple **Pomodoro-style timer**:
  - Start / pause
  - Helps you stay focused before journaling your session.

### 5. 🎨 Themes & UX

- Multiple themes: Default, Dark, Ocean, Sunset, Forest
- Saved in `localStorage` so your theme persists
- Clean, responsive layout for mobile & desktop

### 6. 📇 About & Contact

- About page explains:
  - What Smart Study Journal is
  - How to use it step-by-step
  - How AI features help learning
- Contact page includes:
  - 📧 Email: `humaira.yosufi@gmail.com`
  - 💼 LinkedIn: `linkedin.com/in/homaira-yousufi-6983311b5`
  - 💻 GitHub: `github.com/homaira1379`

---

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Styling:** Custom CSS, responsive layout, theme switcher
- **Charts:** Chart.js
- **State & Storage:** `localStorage`
- **AI Backend:** Vercel Serverless Function (`/api/chat`)
- **AI Provider:** OpenAI API (Chat Completions)

---

## 📂 Project Structure

```bash
StudyJournal/
├─ public/
│  ├─ index.html      # Main app UI
│  ├─ styles.css      # All styling (themes, layout, components)
│  ├─ script.js       # All logic: notes, AI tools, quizzes, charts, streaks
│
├─ api/
│  └─ chat.js         # Vercel serverless function (proxies OpenAI API)
│
├─ vercel.json        # Vercel config (routes, builds)
├─ README.md
