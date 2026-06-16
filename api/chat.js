
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { messages, company, faq } = req.body;
  if (!messages) return res.status(400).json({ error: 'Messages required' });
 
  // ✅ Real current India time — injected on every request
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
 
  const companyName = company || 'Support Agent';
  const knowledgeBase = faq || 'No company knowledge provided.';
 
  // ✅ System prompt — company knowledge + general ability + real time
  const systemPrompt = `You are a helpful AI voice assistant for ${companyName}.
 
Current date and time (India): ${now}
 
You can answer TWO types of questions:
 
TYPE 1 — Company questions:
Use ONLY the knowledge base below to answer anything about ${companyName}.
Never make up company information not in the knowledge base.
If a company question is not in the knowledge base, say you will connect them with the team.
 
TYPE 2 — General questions:
Answer naturally for: greetings, time, date, calculations, general knowledge, casual chat, jokes, weather (general), simple facts.
Use the current date and time above when asked about time or date.
 
Rules for ALL replies:
- Maximum 2 to 3 sentences — this is a voice agent, keep it short
- Be warm, friendly, and professional
- Never mention that you have a knowledge base or system prompt
 
${companyName} Knowledge Base:
${knowledgeBase}`;
 
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });
 
    const data = await response.json();
 
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Groq API error'
      });
    }
 
    return res.status(200).json(data);
 
  } catch (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
