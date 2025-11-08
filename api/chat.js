// api/chat.js

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // This log is for Vercel function logs so we can SEE if env is loaded
  console.log('OPENAI_API_KEY present?', !!apiKey);

  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing OPENAI_API_KEY on server. Set it in your Vercel project settings.'
    });
  }

  try {
    const { model, messages, temperature } = req.body || {};

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: messages || [],
        temperature: typeof temperature === 'number' ? temperature : 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error('OpenAI error:', openaiRes.status, data);
      return res.status(openaiRes.status).json({
        error: 'OpenAI API error',
        status: openaiRes.status,
        details: data
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error talking to OpenAI',
      details: error.message
    });
  }
}
