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

// allow your frontend origins (during dev)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: false,
  })
);

app.use(express.json());

// ========= Serve React build from client/dist =========
const clientBuildPath = path.join(__dirname, "client", "dist");
app.use(express.static(clientBuildPath));

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

    // normalize content (remove ```json fences if present)
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

// ========= Catch-all route: send React index.html =========
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
