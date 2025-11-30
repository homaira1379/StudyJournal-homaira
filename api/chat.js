// api/chat.js
// Node / Vercel Serverless function (CommonJS)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not set on the server" });
    return;
  }

  try {
    const { mode, noteContent, topic, numQuestions } = req.body || {};

    let userPrompt;
    if (mode === "noteSummary") {
      userPrompt = `
You are a helpful study assistant. Read the student's note and produce a short,
clear summary with 3–5 bullet points.

NOTE:
${noteContent || ""}

Return ONLY the summary text, no extra explanation.
`;
    } else if (mode === "noteQuiz") {
      userPrompt = `
You are a quiz generator. Read the student's note and create 5 multiple-choice
questions that help them review the material.

Return JSON in this EXACT format (valid JSON, no comments):

{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
    }
  ]
}

NOTE:
${noteContent || ""}
`;
    } else if (mode === "topicQuiz") {
      const count = numQuestions || 5;
      userPrompt = `
Create ${count} multiple-choice questions to test a student's knowledge of:
"${topic || "general knowledge"}".

Return JSON in this EXACT format (valid JSON, no comments):

{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "answer": "A"
    }
  ]
}
`;
    } else {
      res.status(400).json({ error: "Invalid mode" });
      return;
    }

    // Call OpenAI Chat Completions API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful study assistant." },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", errorText);
      res.status(500).json({ error: "OpenAI API error" });
      return;
    }

    const data = await openaiResponse.json();
    const text = data.choices[0].message.content.trim();

    // Shape the response for the frontend
    if (mode === "noteSummary") {
      res.status(200).json({ summary: text });
    } else {
      // For quizzes we asked for JSON; try to parse it
      let quizJson;
      try {
        quizJson = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse quiz JSON from model:", text);
        res.status(500).json({ error: "Failed to parse quiz JSON from AI" });
        return;
      }
      res.status(200).json({ questions: quizJson.questions || [] });
    }
  } catch (err) {
    console.error("Server error in /api/chat:", err);
    res.status(500).json({ error: "Server error" });
  }
};
