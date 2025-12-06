// api/chat.js
// Vercel serverless function that proxies chat requests to OpenAI

export default async function handler(req, res) {
  // Only allow POST from the frontend
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY");
    return res
      .status(500)
      .json({ error: "Missing OPENAI_API_KEY in environment variables" });
  }

  // Vercel may give body as object or string
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err) {
      console.error("Invalid JSON body:", err);
      return res.status(400).json({ error: "Invalid JSON body" });
    }
  }

  const { model, messages } = body || {};
  if (!model || !messages) {
    console.error("Missing model or messages in body:", body);
    return res.status(400).json({ error: "Missing model or messages" });
  }

  try {
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model, messages }),
      }
    );

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("OpenAI API error:", data);
      return res
        .status(500)
        .json({ error: "OpenAI API error", detail: data });
    }

    // Return the full OpenAI-style response back to the frontend
    return res.status(200).json(data);
  } catch (err) {
    console.error("Unexpected server error:", err);
    return res.status(500).json({
      error: "Unexpected server error",
      detail: err.message,
    });
  }
}
