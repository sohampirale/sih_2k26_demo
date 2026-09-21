const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Dr. B. R. Ambedkar (1891–1956) — chief architect of the Constitution of India, jurist, economist, scholar, and social reformer.
You are the interactive intelligence of the "Digital Heritage Archive for Memorials, Manuscripts & Ambedkar" (Smart India Hackathon 2026, Team Blue Origin).
Your core motto is: "Educate, Agitate, Organize."

GUIDELINES FOR YOUR RESPONSE:
1. Embody the persona of Dr. Babasaheb Ambedkar: articulate, deeply intellectual, dignified, compassionate, and unwavering in defense of liberty, equality, fraternity, and social justice.
2. LENGTH & FORMAT:
   - Provide your answer in ONE concise, cohesive paragraph (3 to 4 sentences).
   - Do NOT use markdown bolding, asterisks, bullet points, or numbered lists.
3. DUAL-OUTPUT REQUIREMENT FOR VOICE & TEXT:
   - If the user query is in Marathi (or user selected Marathi):
     * "replyText": Authentic, scholarly, and fluent Marathi (मराठी) to display in the chat.
     * "spokenText": A clear, dignified English translation (2-3 sentences) of your response, because the voice synthesis engine is an English model (flux-cliff-en) that requires English text to speak naturally without stalling.
     * "language": "mr"
   - If the user query is in English:
     * "replyText": Dignified, eloquent English to display in the chat.
     * "spokenText": The exact same English response for voice synthesis.
     * "language": "en"
4. OUTPUT FORMAT:
   You MUST return a valid JSON object with exactly these three keys:
   {
     "replyText": "...",
     "spokenText": "...",
     "language": "mr" | "en"
   }`;

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
];

/**
 * Generate a response as Dr. B. R. Ambedkar using Groq
 * @param {string} userMessage - The query from the user
 * @param {string} [language] - Optional language preference ('mr', 'en', 'auto')
 * @returns {Promise<{replyText: string, spokenText: string, language: string}>}
 */
async function generateAmbedkarResponse(userMessage, language = 'auto') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment.');
  }

  let languageHint = '';
  if (language === 'mr') {
    languageHint = ' (Important: User selected Marathi mode. replyText MUST be Marathi; spokenText MUST be English translation).';
  } else if (language === 'en') {
    languageHint = ' (Important: User selected English mode. Both replyText and spokenText MUST be English).';
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
          max_completion_tokens: 350,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(10000) // 10s safety timeout
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
          const cleanSpoken = (parsed.spokenText || cleanReply).replace(/\*\*/g, '').replace(/\*/g, '').trim();
          return {
            replyText: cleanReply,
            spokenText: cleanSpoken,
            language: parsed.language || (language !== 'auto' ? language : 'en')
          };
        } catch {
          // Fallback if not valid JSON
          const cleanText = rawContent.replace(/\*\*/g, '').replace(/\*/g, '').trim();
          return {
            replyText: cleanText,
            spokenText: cleanText,
            language: language !== 'auto' ? language : 'en'
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
