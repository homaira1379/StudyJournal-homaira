 📚 Smart Study Journal

A personal study companion web app that helps you:

- Capture and organize your study notes  
- Generate AI-powered summaries and quizzes from your own notes  
- Search past entries instantly  
- Keep your journal data safely in the browser (localStorage)  

Deployed on Vercel with an AI backend powered by the OpenAI API.



🚀 Live Demo

- Live App: https://study-journal-homaira231.vercel.app  
- GitHub Repo: https://github.com/homaira1379/StudyJournal-homaira  



🧠 Core Features

✍️ Smart Journal (Notes & Reflections)

- Add structured entries with:
  - Subject / Topic  
  - Duration (minutes)  
  - Notes & reflections  
- Entries are saved with localStorage, so they persist after refresh  
- Search by subject or note content  
- Delete notes anytime  
- Click any entry to open the AI tools panel

---

🤖 AI Tools (Per Note)

All AI calls go through `/api/chat`, a Vercel serverless backend using your `OPENAI_API_KEY`.

🔹 1. AI Summary  
Generates a clear, bullet-point summary for any note you select.

🔹 2. AI Quiz  
Creates quiz questions with answers based on your note content — great for self-testing.

---

 🎨 UI & Experience

- Clean, simple layout  
- Mobile-friendly  
- Organized sections:
  - Add Entry  
  - Search Entries  
  - View Entry  
  - AI Tools  

---

🛠 Tech Stack

- Frontend: React + Vite  
- Styling: CSS  
- State Management: React Hooks  
- Storage: localStorage  
- Backend: Vercel Serverless Function  
- AI:OpenAI Chat Completions API  

---

📂 Project Structure

```bash
StudyJournal/
├─ client/                   # React frontend
│  ├─ src/
│  │  ├─ pages/
│  │  │  └─ JournalPage.jsx  # Main journal page with AI logic
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ index.html
│  └─ ...
│
├─ api/
│  └─ chat.js                # Backend OpenAI route
│
├─ vercel.json               # Vercel routing & build config
└─ README.md
📧 Contact

Email: humaira.yosufi@gmail.com

GitHub: https://github.com/homaira1379
