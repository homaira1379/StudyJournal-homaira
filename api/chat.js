// api/chat.js
// Vercel serverless function for all AI features

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable");
    return res.status(500).json({
      error: "Server misconfigured: missing OpenAI API key."
    });
  }

  let body = {};
  try {
    if (typeof req.body === "string") {
      body = JSON.parse(req.body || "{}");
    } else {
      body = req.body || {};
    }
  } catch (err) {
    console.error("Failed to parse request body:", err);
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }

  const { mode, notes, topic, numQuestions } = body;
  if (!mode) {
    return res.status(400).json({ error: "Missing 'mode' field in request." });
  }

  try {
    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "summary") {
      if (!notes) return res.status(400).json({ error: "Missing 'notes'." });

      systemPrompt = "You are a helpful study assistant.";
      userPrompt = `Summarize these notes:\n\n${notes}`;
    }

    else if (mode === "note-quiz") {
      if (!notes) return res.status(400).json({ error: "Missing 'notes'." });

      systemPrompt = "You are a quiz generator.";
      userPrompt = `Generate multiple-choice questions based ONLY on these notes:\n\n${notes}`;
    }

    else if (mode === "topic-quiz") {
      if (!topic) return res.status(400).json({ error: "Missing 'topic'." });

      const count = Number(numQuestions) || 5;

      systemPrompt = "You are a quiz generator.";
      userPrompt = `Generate ${count} MCQs about: ${topic}`;
    }

    const openaiResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      console.error("OpenAI error:", errText);
      return res.status(500).json({
        error: "OpenAI API request failed.",
        detail: errText
      });
    }

    const data = await openaiResponse.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(500).json({ error: "Empty AI response." });
    }

    return res.status(200).json({ result: content });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Unexpected server error.",
      detail: String(err)
    });
  }
};
