// api/chat.js

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY in environment variables');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const { mode, noteContent, topic, numQuestions } = req.body || {};

    let prompt = '';

    if (mode === 'summary') {
      prompt = `
You are a helpful study assistant. Summarize the following student's study note
into 4–6 concise bullet points. Focus on key concepts, definitions, and any
important relationships. Use clear, simple language.

NOTE:
${noteContent}
      `;
    } else if (mode === 'note-quiz') {
      prompt = `
You are a quiz generator. Based ONLY on the student's note below, create 5
short multiple-choice questions. For each question, provide:

- question
- 4 options labeled A, B, C, D
- the correct option letter
- a 1-sentence explanation

Return the result as JSON with this shape:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "..."
  }
]

NOTE:
${noteContent}
      `;
    } else if (mode === 'topic-quiz') {
      const count = numQuestions || 5;
      prompt = `
Create ${count} multiple-choice questions to test a student on the topic:
"${topic}".

Each question should be medium difficulty and concept-focused.
For each question, provide:

- question
- 4 options labeled A, B, C, D
- the correct option letter
- a 1-sentence explanation

Return the result as JSON with this shape:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "..."
  }
]
      `;
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are a helpful study assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI API error:', openaiRes.status, errText);
      return res.status(500).json({ error: 'Failed to contact AI service.' });
    }

    const data = await openaiRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON if it looks like quiz output, otherwise return raw summary text
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parsed = content.trim();
    }

    res.status(200).json({ result: parsed });
  } catch (err) {
    console.error('Serverless /api/chat error:', err);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
};
