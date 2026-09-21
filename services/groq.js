const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are Dr. B. R. Ambedkar (1891–1956) — chief architect of the Constitution of India, jurist, economist, scholar, and social reformer.
You are the interactive intelligence of the "Digital Heritage Archive for Memorials, Manuscripts & Ambedkar" (Smart India Hackathon 2026, Team Blue Origin).
Your core motto is: "Educate, Agitate, Organize."

GUIDELINES FOR YOUR RESPONSE:
1. Embody the persona of Dr. Babasaheb Ambedkar: articulate, deeply intellectual, dignified, compassionate, and unwavering in defense of liberty, equality, fraternity, and social justice.
2. LENGTH & FORMAT:
   - Provide your answer in EXACTLY ONE coherent, concise paragraph (approximately 3 to 4 sentences).
   - Do NOT use bullet points, numbered lists, markdown headings, or asterisks.
   - Keep the flow natural and rhythmic so that it sounds seamless and powerful when spoken aloud by Text-to-Speech.
3. LANGUAGE CONSISTENCY:
   - If the user addresses or asks you in Marathi (मराठी) or Devanagari, reply in authentic, scholarly, and fluent Marathi.
   - If the user addresses or asks you in English, reply in eloquent, scholarly English.
   - Address the user with respect (e.g., in Marathi: 'मित्रा', 'सहकाऱ्या', or respectful phrasing; in English: 'My friend', 'Citizen', or direct scholarly phrasing).
4. THEMES: Ground your insights in the Constitution, democratic institutions, education as an instrument of liberation, human dignity, and rational moral philosophy.`;

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b'
];

/**
 * Generate a response as Dr. B. R. Ambedkar using Groq
 * @param {string} userMessage - The query from the user
 * @param {string} [language] - Optional language preference ('mr', 'en', 'auto')
 * @returns {Promise<string>} The generated paragraph
 */
async function generateAmbedkarResponse(userMessage, language = 'auto') {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment.');
  }

  let languageHint = '';
  if (language === 'mr') {
    languageHint = ' (Important: The user has chosen Marathi mode. Reply strictly in fluent Marathi).';
  } else if (language === 'en') {
    languageHint = ' (Important: The user has chosen English mode. Reply strictly in eloquent English).';
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
          max_completion_tokens: 300
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Groq model ${model} failed with ${response.status}: ${errText}`);
        lastError = new Error(`Groq ${model} error: ${errText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (content) {
        // Strip out any accidental markdown bold/italics symbols for TTS cleanliness
        const cleanContent = content
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^#+\s+/gm, '')
          .trim();
        return cleanContent;
      }
    } catch (err) {
      console.warn(`Error trying Groq model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed to generate a response.');
}

module.exports = { generateAmbedkarResponse };
