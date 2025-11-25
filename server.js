// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// lazy import node-fetch for ESM compatibility
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// --- basic checks ---
if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "⚠️  OPENAI_API_KEY is not set in .env. Requests to /api/chat will fail."
  );
}

// --- CORS (includes React dev + built app) ---
app.use(
  cors({
    origin: [
      "http://localhost:3000",       // production (Express serving React)
      "http://127.0.0.1:5500",       // old live server if you still use it
      "http://localhost:5173",       // Vite dev server
    ],
    credentials: false,
  })
);

app.use(express.json());

// ──────────────────────────────────────────────
// API ROUTES
// ──────────────────────────────────────────────

// health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// proxy to OpenAI Chat Completions
app.post("/api/chat", async (req, res) => {
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("OpenAI error:", data);
      return res.status(r.status).json(data);
    }

    // clean up choices[0].message.content so it is plain text (no ``` fences)
    try {
      if (
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        typeof data.choices[0].message.content === "string"
      ) {
        let content = data.choices[0].message.content.trim();

        if (content.startsWith("```")) {
          content = content
            .replace(/^```(?:json)?/i, "")
            .replace(/```$/, "")
            .trim();
        }

        data.choices[0].message.content = content;
      }
    } catch (e) {
      console.warn("Failed to normalize AI content:", e);
    }

    return res.json(data);
  } catch (err) {
    console.error("Server error contacting OpenAI:", err);
    return res
      .status(500)
      .json({ error: "Server error contacting OpenAI" });
  }
});

// ──────────────────────────────────────────────
// SERVE REACT BUILD (instead of /public)
// ──────────────────────────────────────────────

const clientDistPath = path.join(__dirname, "client", "dist");

// serve static files from React build
app.use(express.static(clientDistPath));

// for any non-API route, send React index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
