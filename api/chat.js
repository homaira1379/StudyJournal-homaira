// api/chat.js
// Vercel serverless function for all AI features

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini"; // or "gpt-4o-mini" / "gpt-3.5-turbo" if you prefer

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable");
    return res
      .status(500)
      .json({ error: "Server misconfigured: missing OpenAI API key." });
  }

  // Body may arrive as string or already parsed – handle both safely
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
      if (!notes) {
        return res.status(400).json({ error: "Missing 'notes' for summary." });
      }

      systemPrompt =
        "You are a helpful study assistant. Summarize study notes for a student.";
      userPrompt = `
Here are the student's notes:

${notes}

Write a short, clear study summary in bullet points.
Focus on key ideas, definitions, and any formulas.
Use concise language appropriate for high-school or college level.
      `.trim();
    } else if (mode === "note-quiz") {
      if (!notes) {
        return res
          .status(400)
          .json({ error: "Missing 'notes' for note-based quiz." });
      }

      systemPrompt =
        "You are a quiz generator that creates multiple-choice questions from the student's notes.";
      userPrompt = `
Using ONLY the content in these notes, generate a small set of multiple-choice questions (3–6).

Notes:
${notes}

Return the result as pure JSON in this exact format:

{
  "questions": [
    {
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct option text",
      "explanation": "Short explanation of why this is correct."
    }
  ]
}
      `.trim();
    } else if (mode === "topic-quiz") {
      if (!topic) {
        return res
          .status(400)
          .json({ error: "Missing 'topic' for topic-based quiz." });
      }

      const count = Number(numQuestions) || 5;

      systemPrompt =
        "You are a quiz generator that creates multiple-choice questions for studying.";
      userPrompt = `
Generate ${count} multiple-choice questions for the topic: "${topic}".

Make them suitable for a diligent student.
Cover a variety of sub-concepts if possible.

Return ONLY pure JSON in this format:

{
  "questions": [
    {
      "question": "Question text...",
      "options": ["A", "B", "C", "D"],
      "answer": "Correct option text",
      "explanation": "Short explanation."
    }
  ]
}
      `.trim();
    } else {
      return res.status(400).json({ error: `Unknown mode: ${mode}` });
    }

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);
      return res.status(500).json({
        error: "OpenAI API request failed.",
        detail: errorText,
      });
    }

    const data = await openaiResponse.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("No content returned from OpenAI:", data);
      return res
        .status(500)
        .json({ error: "No content returned from OpenAI." });
    }

    // Shape the response for the frontend
    if (mode === "summary") {
      // Frontend expects { summary: string }
      return res.status(200).json({ summary: content });
    }

    // For quiz modes we asked for JSON. Try to parse.
    let questionsPayload;
    try {
      questionsPayload = JSON.parse(content);
    } catch (err) {
      console.warn(
        "Failed to parse quiz JSON, returning raw text instead.",
        err
      );
      // Frontend handles .questions; if parsing fails, send content as a single question
      return res.status(200).json({
        questions: [
          {
            question:
              "The AI failed to produce structured quiz JSON. Here is the raw output:",
            options: [content],
            answer: content,
            explanation:
              "Show this text to the user. (This is a fallback; ideally JSON should parse.)",
          },
        ],
      });
    }

    // Normalize to { questions: [...] }
    const questions = questionsPayload.questions || questionsPayload || [];
    return res.status(200).json({ questions });
  } catch (err) {
    console.error("Server error in /api/chat:", err);
    return res
      .status(500)
      .json({ error: "Unexpected server error.", detail: String(err) });
  }
};
