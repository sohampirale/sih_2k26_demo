const DEEPGRAM_LISTEN_URL = 'https://api.deepgram.com/v1/listen';
const DEEPGRAM_SPEAK_V2_URL = 'https://api.deepgram.com/v2/speak';
const DEEPGRAM_SPEAK_V1_URL = 'https://api.deepgram.com/v1/speak';

/**
 * Transcribe an audio buffer using Deepgram Nova-3
 * @param {Buffer} audioBuffer - Binary audio buffer
 * @param {string} mimeType - e.g. 'audio/webm', 'audio/mp3', 'audio/wav'
 * @param {string} [language='auto'] - 'auto', 'mr', or 'en'
 * @returns {Promise<{transcript: string, detectedLanguage: string, confidence: number}>}
 */
async function transcribeAudio(audioBuffer, mimeType = 'audio/webm', language = 'auto') {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set in environment.');
  }

  const params = new URLSearchParams({
    model: 'nova-3',
    smart_format: 'true',
    punctuate: 'true'
  });

  if (language === 'mr') {
    params.append('language', 'mr');
  } else if (language === 'en') {
    params.append('language', 'en');
  } else {
    params.append('detect_language', 'true');
  }

  const url = `${DEEPGRAM_LISTEN_URL}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': mimeType || 'audio/webm'
    },
    body: audioBuffer,
    signal: AbortSignal.timeout(15000) // 15s timeout
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Deepgram STT failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const channel = data.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const transcript = alternative?.transcript?.trim() || '';
  const detectedLanguage = channel?.detected_language || (language !== 'auto' ? language : 'mr');
  const confidence = alternative?.confidence ?? 0;

  return {
    transcript,
    detectedLanguage,
    confidence
  };
}

/**
 * Synthesize text into speech using Deepgram TTS
 * Primary: User-requested flux-cliff-en model
 * Fallback: Fast aura-orion-en model (if flux-cliff-en times out or is busy)
 * @param {string} text - Spoken text (English)
 * @returns {Promise<{audioBuffer: Buffer, base64Audio: string} | null>}
 */
async function synthesizeSpeech(text) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set in environment.');
  }

  // Ensure clean text without special characters
  const cleanText = text.replace(/[\n\r]+/g, ' ').trim();

  // Attempt 1: User requested flux-cliff-en model
  const primaryModel = process.env.DEEPGRAM_TTS_MODEL || 'flux-cliff-en';
  const primaryUrl = `${DEEPGRAM_SPEAK_V2_URL}?model=${encodeURIComponent(primaryModel)}&speed=1&expressivity=0`;

  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: cleanText }),
      signal: AbortSignal.timeout(12000) // 12s timeout
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      return {
        audioBuffer,
        base64Audio: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`
      };
    }
    console.warn(`Primary TTS (${primaryModel}) returned ${response.status}, attempting fallback...`);
  } catch (err) {
    console.warn(`Primary TTS (${primaryModel}) failed/timed out (${err.message}), falling back to aura-orion-en...`);
  }

  // Attempt 2: Ultra-fast fallback aura-orion-en (finishes in ~1.5s)
  try {
    const fallbackUrl = `${DEEPGRAM_SPEAK_V1_URL}?model=aura-orion-en`;
    const fbResponse = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: cleanText }),
      signal: AbortSignal.timeout(8000)
    });

    if (fbResponse.ok) {
      const arrayBuffer = await fbResponse.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);
      return {
        audioBuffer,
        base64Audio: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`
      };
    }
  } catch (fbErr) {
    console.error('Fallback TTS error:', fbErr.message);
  }

  return null;
}

module.exports = {
  transcribeAudio,
  synthesizeSpeech
};
