const DEEPGRAM_LISTEN_URL = 'https://api.deepgram.com/v1/listen';
const DEEPGRAM_SPEAK_URL = 'https://api.deepgram.com/v2/speak';

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

  // Build query params
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
    body: audioBuffer
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Deepgram STT failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const channel = data.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];
  const transcript = alternative?.transcript?.trim() || '';
  const detectedLanguage = channel?.detected_language || (language !== 'auto' ? language : 'unknown');
  const confidence = alternative?.confidence ?? 0;

  return {
    transcript,
    detectedLanguage,
    confidence
  };
}

/**
 * Synthesize text into speech using Deepgram TTS
 * User-specified model: flux-cliff-en&speed=1&expressivity=0
 * @param {string} text - Spoken text
 * @returns {Promise<{audioBuffer: Buffer, base64Audio: string}>}
 */
async function synthesizeSpeech(text) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set in environment.');
  }

  const model = process.env.DEEPGRAM_TTS_MODEL || 'flux-cliff-en';
  const url = `${DEEPGRAM_SPEAK_URL}?model=${encodeURIComponent(model)}&speed=1&expressivity=0`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Deepgram TTS failed (${response.status}): ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);
  const base64Audio = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;

  return {
    audioBuffer,
    base64Audio
  };
}

module.exports = {
  transcribeAudio,
  synthesizeSpeech
};
