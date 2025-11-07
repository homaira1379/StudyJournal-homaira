// api/chat.js  (Vercel serverless function)

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).send("Method Not Allowed");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: "Missing OPENAI_API_KEY" });
    }

    // On Vercel (Node runtime), req.body is already parsed for JSON requests.
    // Fallback in case it's a string:
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : (req.body || {});

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("OpenAI error:", data);
      return res.status(r.status).json(data);
    }

    // 🧹 Normalize the model output so it's plain JSON (no ``` fences)
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
            .replace(/^```(?:json)?/i, "") // remove ``` or ```json
            .replace(/```$/, "")           // remove trailing ```
            .trim();
        }

        data.choices[0].message.content = content;
      }
    } catch (e) {
      console.warn("Failed to normalize AI content:", e);
      // continue; frontend will handle if needed
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Server error contacting OpenAI:", err);
    return res
      .status(500)
      .json({ error: "Server error contacting OpenAI" });
  }
}
