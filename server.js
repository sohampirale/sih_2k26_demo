require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { generateAmbedkarResponse } = require('./services/groq');
const { transcribeAudio } = require('./services/deepgram');
const { synthesizeSarvamSpeech } = require('./services/sarvam');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup Multer for in-memory audio buffer handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    project: 'Digital Heritage Archive for Memorials, Manuscripts & Ambedkar',
    problemStatementId: '26096',
    teamId: 'ISIH26143',
    teamName: 'Blue Origin',
    theme: 'Smart Education',
    stt: 'Deepgram Nova-3 (Multilingual / Marathi / English)',
    tts: 'Sarvam AI (bulbul:v3, speaker: sumit - Native Marathi & English)',
    llm: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'
  });
});

// Voice Interaction Endpoint (Voice In -> Voice Out)
app.post('/api/voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No audio file provided in request.' });
    }

    const languagePref = req.body.language || 'auto';
    const mimeType = req.file.mimetype || 'audio/webm';

    console.log(`[Voice] Received audio (${req.file.size} bytes, ${mimeType}), language preference: ${languagePref}`);

    // Step 1: Transcribe using Deepgram Nova-3
    const sttResult = await transcribeAudio(req.file.buffer, mimeType, languagePref);
    const userText = sttResult.transcript;
    const detectedLanguage = sttResult.detectedLanguage;

    console.log(`[Voice] Transcribed text: "${userText}" (Detected: ${detectedLanguage})`);

    if (!userText || userText.trim().length === 0) {
      return res.status(400).json({
        error: 'No discernible speech detected. Please speak closer to the microphone and try again.',
        userText: ''
      });
    }

    // Step 2: Generate response from Groq as Dr. Ambedkar
    const effectiveLang = (languagePref !== 'auto') ? languagePref : detectedLanguage;
    const ambedkarReply = await generateAmbedkarResponse(userText, effectiveLang);

    console.log(`[Voice] Ambedkar reply (${ambedkarReply.language}): "${ambedkarReply.replyText.substring(0, 70)}..."`);

    // Step 3: Convert reply to voice using Sarvam AI (native Marathi / English)
    let base64Audio = null;
    try {
      const ttsResult = await synthesizeSarvamSpeech(ambedkarReply.replyText, ambedkarReply.language);
      if (ttsResult) {
        base64Audio = ttsResult.base64Audio;
        console.log(`[Voice] Sarvam TTS generated successfully (${ttsResult.audioBuffer.length} bytes)`);
      }
    } catch (ttsErr) {
      console.warn('[Voice] Sarvam TTS generation warning:', ttsErr.message);
    }

    res.json({
      success: true,
      userText,
      detectedLanguage: ambedkarReply.language || detectedLanguage,
      replyText: ambedkarReply.replyText,
      audio: base64Audio
    });
  } catch (err) {
    console.error('[Voice] Processing error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error processing audio request.'
    });
  }
});

// Text Chat Endpoint (Chat In -> Chat Out)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const languagePref = language || 'auto';
    console.log(`[Chat] Received message: "${message.trim()}", language: ${languagePref}`);

    const ambedkarReply = await generateAmbedkarResponse(message.trim(), languagePref);

    res.json({
      success: true,
      userText: message.trim(),
      replyText: ambedkarReply.replyText,
      language: ambedkarReply.language || languagePref
    });
  } catch (err) {
    console.error('[Chat] Processing error:', err);
    res.status(500).json({
      error: err.message || 'Internal server error processing chat request.'
    });
  }
});

// On-demand Text-to-Speech Endpoint (Sarvam AI)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, language } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text cannot be empty.' });
    }

    const langCode = language || (/[\u0900-\u097F]/.test(text) ? 'mr' : 'en');
    const ttsResult = await synthesizeSarvamSpeech(text.trim(), langCode);

    if (!ttsResult || !ttsResult.base64Audio) {
      return res.status(502).json({ error: 'Speech synthesis temporarily unavailable.' });
    }

    res.json({
      success: true,
      audio: ttsResult.base64Audio
    });
  } catch (err) {
    console.error('[TTS] Error:', err);
    res.status(500).json({
      error: err.message || 'TTS generation failed.'
    });
  }
});

// Fallback to index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏛️  SIH 2026 - AI-Powered Digital Heritage Archive`);
  console.log(`👨‍⚖️  Dr. B. R. Ambedkar Knowledge Voice & Chat Agent`);
  console.log(`🚀  Team Blue Origin (ISIH26143) | PS ID: 26096`);
  console.log(`🗣️  TTS Engine: Sarvam AI (bulbul:v3, speaker: sumit)`);
  console.log(`🌐  Server running at: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
