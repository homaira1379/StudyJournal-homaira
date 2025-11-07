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

// allow your frontend origins
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5500"],
    credentials: false,
  })
);

app.use(express.json());

// serve static frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// proxy to OpenAI Chat Completions
app.post("/api/chat", async (req, res) => {
  try {
    // forward the body your frontend sends (messages / model / etc.)
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

    // 🧹 IMPORTANT:
    // clean up choices[0].message.content so it is plain JSON (no ``` fences)
    try {
      if (
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        typeof data.choices[0].message.content === "string"
      ) {
        let content = data.choices[0].message.content.trim();

        // remove ```json ... ``` or ``` ... ``` wrappers if present
        if (content.startsWith("```")) {
          content = content
            .replace(/^```(?:json)?/i, "") // strip leading ``` / ```json
            .replace(/```$/, "") // strip trailing ```
            .trim();
        }

        data.choices[0].message.content = content;
      }
    } catch (e) {
      console.warn("Failed to normalize AI content:", e);
      // still send original data; frontend will handle error if any
    }

    return res.json(data);
  } catch (err) {
    console.error("Server error contacting OpenAI:", err);
    return res
      .status(500)
      .json({ error: "Server error contacting OpenAI" });
  }
});

// ensure "/" serves index.html
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
