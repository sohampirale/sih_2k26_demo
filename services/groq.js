const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Dr. B. R. Ambedkar (1891–1956) — chief architect of the Constitution of India, jurist, economist, scholar, and social reformer.
You are the interactive intelligence of the "Digital Heritage Archive for Memorials, Manuscripts & Ambedkar" (Smart India Hackathon 2026, Team Blue Origin).
Your core motto is: "Educate, Agitate, Organize."

GUIDELINES FOR YOUR RESPONSE:
1. Embody the persona of Dr. Babasaheb Ambedkar: articulate, deeply intellectual, dignified, compassionate, and unwavering in defense of liberty, equality, fraternity, and social justice.
2. Provide your answer in ONE concise, cohesive paragraph of approximately 3 to 4 sentences (optimized for spoken voice synthesis).
3. Do NOT use markdown asterisks, bolding, bullet points, or numbered lists.
4. LANGUAGE MATCHING:
   - If the user asks in Marathi (मराठी) or selects Marathi, reply in authentic, dignified, and fluent Marathi (मराठी).
   - If the user asks in English or selects English, reply in eloquent, scholarly English.
5. OUTPUT FORMAT:
   Return a valid JSON object with keys:
   {
     "replyText": "<Dr. Ambedkar response in user language - Marathi or English>",
     "language": "mr" | "en"
   }`;

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b'
];

/**
 * Generate a response as Dr. B. R. Ambedkar using Groq
 * @param {string} userMessage - The query from the user
 * @param {string} [language] - Optional language preference ('mr', 'en', 'auto')
 * @returns {Promise<{replyText: string, language: string}>}
 */
async function generateAmbedkarResponse(userMessage, language = 'auto') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment.');
  }

  let languageHint = '';
  if (language === 'mr') {
    languageHint = ' (Important: The user has selected Marathi. Reply strictly in fluent, authentic Marathi).';
  } else if (language === 'en') {
    languageHint = ' (Important: The user has selected English. Reply strictly in eloquent English).';
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT + languageHint },
    { role: 'user', content: userMessage }
  ];

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.6,
          max_completion_tokens: 300,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Groq model ${model} failed with ${response.status}: ${errText}`);
        lastError = new Error(`Groq ${model} error: ${errText}`);
        continue;
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content?.trim();

      if (rawContent) {
        try {
          const parsed = JSON.parse(rawContent);
          const cleanReply = (parsed.replyText || rawContent).replace(/\*\*/g, '').replace(/\*/g, '').trim();
          return {
            replyText: cleanReply,
            language: parsed.language || (language !== 'auto' ? language : 'mr')
          };
        } catch {
          const cleanText = rawContent.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          return {
            replyText: cleanText,
            language: language !== 'auto' ? language : 'mr'
          };
        }
      }
    } catch (err) {
      console.warn(`Error trying Groq model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed to generate a response.');
}

module.exports = { generateAmbedkarResponse };
