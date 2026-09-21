const { SarvamAIClient } = require('sarvamai');

/**
 * Synthesize speech using Sarvam AI (bulbul:v3, speaker: sumit)
 * Supports native Marathi (mr-IN), Hindi (hi-IN), and Indian English (en-IN)
 * 
 * @param {string} text - Text to synthesize into speech
 * @param {string} [languageCode='auto'] - Language code ('mr', 'en', 'hi', or 'auto')
 * @returns {Promise<{audioBuffer: Buffer, base64Audio: string} | null>}
 */
async function synthesizeSarvamSpeech(text, languageCode = 'auto') {
  if (!text || !text.trim()) return null;

  // Clean text
  const cleanText = text.replace(/[\n\r]+/g, ' ').trim();

  // Determine target_language_code
  let targetLang = 'mr-IN';
  if (languageCode === 'en' || (!/[\u0900-\u097F]/.test(cleanText) && languageCode !== 'mr')) {
    targetLang = 'en-IN';
  } else if (languageCode === 'hi') {
    targetLang = 'hi-IN';
  } else {
    targetLang = 'mr-IN';
  }

  const keysToTry = [
    process.env.SARVAM_API_KEY,
    process.env.FALLBACK_SARVAM_API_KEY
  ].filter(Boolean);

  for (const apiKey of keysToTry) {
    try {
      const client = new SarvamAIClient({
        apiSubscriptionKey: apiKey,
      });

      const response = await client.textToSpeech.convertStream({
        text: cleanText,
        target_language_code: targetLang,
        speaker: 'sumit',
        model: 'bulbul:v3',
        pace: 1,
        speech_sample_rate: 22050,
      });

      let arrayBuffer;
      if (typeof response.arrayBuffer === 'function') {
        arrayBuffer = await response.arrayBuffer();
      } else if (typeof response.bytes === 'function') {
        const bytes = await response.bytes();
        arrayBuffer = bytes.buffer;
      }

      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        const audioBuffer = Buffer.from(arrayBuffer);
        return {
          audioBuffer,
          base64Audio: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`
        };
      }
    } catch (err) {
      console.warn(`[Sarvam TTS] Key attempt failed (${err.message}). Trying next key if configured...`);
    }
  }

  console.error('[Sarvam TTS] All Sarvam API keys failed.');
  return null;
}

module.exports = {
  synthesizeSarvamSpeech
};
