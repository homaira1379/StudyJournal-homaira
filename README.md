# 📚 Study Journal

A personal study companion app where you can write, organize, and review notes, then generate practice quizzes and track your progress.

## ✨ Features
- **Notes**: Create, edit, delete study entries (saved to LocalStorage)
- **Search**: Filter notes by keyword/subject
- **Quizzes**: Generate multiple-choice quizzes via server proxy to OpenAI
- **Progress**: Charts for study minutes & quiz scores (Chart.js)
- **Achievements**: Badges & day streaks
- **Themes**: Light/dark and color themes

## 🧱 Stack
- HTML/CSS/JS (vanilla) + Chart.js  
- Node/Express proxy for `/api/chat`  
- LocalStorage for persistence  
- Deployed on **Vercel**

## 🚀 Local Development
```bash
npm install
# Choose a free port (e.g., 4000)
$env:PORT=4000; npm start  # PowerShell
# open http://localhost:4000
