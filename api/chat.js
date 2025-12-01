// api/chat.js
// Vercel serverless function for OpenAI calls

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  // This will show up in Vercel logs if the env var is missing
  console.error("❌ OPENAI_API_KEY is not set in environment variables");
}

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Vercel's Node runtime normally gives you parsed JSON in req.body
    // but we also handle the case where it's a string or empty.
    let body = req.body;

    if (!body) {
      // Fallback: manually read and parse
      const raw = await getRawBody(req);
      body = raw ? JSON.parse(raw) : {};
    } else if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { mode, text, topic, numQuestions } = body || {};

    if (!OPENAI_API_KEY) {
      res
        .status(500)
        .json({ error: "Server is missing OPENAI_API_KEY configuration." });
      return;
    }

    if (!mode) {
      res.status(400).json({ error: "Missing 'mode' in request body." });
      return;
    }

    // Build the prompt based on mode (must match what the React app sends)
    const { systemPrompt, userPrompt } = buildPrompts({
      mode,
      text,
      topic,
      numQuestions,
    });

    // Call OpenAI Chat Completions
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error("OpenAI API error:", openaiRes.status, errorText);
      res.status(500).json({
        error: "OpenAI API request failed",
        details: errorText,
      });
      return;
    }

    const data = await openaiRes.json();
    const message = data?.choices?.[0]?.message?.content?.trim() ?? "";

    res.status(200).json({ result: message });
  } catch (err) {
    console.error("Server error in /api/chat:", err);
    res
      .status(500)
      .json({ error: "Unexpected server error", details: err.message });
  }
}

/**
 * Helper: read raw body from the Node request stream
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", (err) => reject(err));
  });
}

/**
 * Build prompts for different modes used in the React app.
 * Modes are expected to be:
 * - "summary"          → summarize a note
 * - "note-quiz"        → quiz from a single journal entry
 * - "topic-quiz"       → quiz on a chosen topic
 */
function buildPrompts({ mode, text, topic, numQuestions }) {
  let systemPrompt = "";
  let userPrompt = "";

  switch (mode) {
    case "summary":
      systemPrompt =
        "You are a helpful study assistant. Summarize notes into clear, concise bullet points for revision.";
      userPrompt = `Summarize these study notes into 3–7 short bullet points:\n\n${text || ""}`;
      break;

    case "note-quiz":
      systemPrompt =
        "You are a tutor who creates quiz questions from a student's notes. Use simple, clear language.";
      userPrompt = `Create a short quiz based on these study notes. Include a mix of multiple-choice and short-answer questions.\n\nNotes:\n${text ||
        ""}\n\nReturn the quiz as numbered questions with answer keys at the end.`;
      break;

    case "topic-quiz":
      systemPrompt =
        "You are a tutor who creates beginner-friendly quiz questions for self-study.";
      userPrompt = `Create ${numQuestions || 5} multiple-choice questions about the topic: "${
        topic || "general knowledge"
      }". Provide 4 options per question (A–D) and clearly mark the correct answer for each.`;
      break;

    default:
      systemPrompt =
        "You are a helpful study assistant who explains concepts clearly.";
      userPrompt = `Help the student with this request:\n\n${text || topic || ""}`;
      break;
  }

  return { systemPrompt, userPrompt };
}
