# 🏛️ AI-Powered Digital Heritage Archive for Dr. B. R. Ambedkar
### Interactive Voice & Knowledge Platform | Smart India Hackathon 2026

![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)
![Problem Statement ID](https://img.shields.io/badge/PS%20ID-26096-orange.svg)
![Team ID](https://img.shields.io/badge/Team-ISIH26143-purple.svg)
![Team Name](https://img.shields.io/badge/Team%20Name-Blue%20Origin-blue.svg)
![Theme](https://img.shields.io/badge/Theme-Smart%20Education-emerald.svg)

> **"Educate, Agitate, Organize."**  
> *"शिकून ज्ञानी व्हा, अन्यायाविरुद्ध पेटून उठा, आणि संघटit व्हा!"*  
> — **Dr. Bhimrao Ramji Ambedkar**

---

## 📌 Project Overview

**Problem Statement ID:** 26096  
**Problem Statement Title:** Digital Heritage Archive for Memorials, Manuscripts & Ambedkar: AI-Powered Institutional Archive and Audio-Visual Knowledge Platform  
**Category:** Hardware / Smart Education  
**Team ID:** ISIH26143  
**Team Name:** Blue Origin  

This repository provides the working Minimum Viable Product (MVP) and interactive prototype for an **AI-powered voice and conversational agent** honoring the legacy, constitutional wisdom, and writings of **Dr. B. R. Ambedkar**.

Users can speak naturally in **Marathi (मराठी)** or **English** via a ChatGPT-style voice interface or chat via text. The agent transcribes the speech, reasons in character as Dr. Ambedkar with conciseness and moral clarity, and responds in voice and text.

---

## 🏛️ 6-Pillar Architecture (SIH Framework)

```
  [1. DIGITIZE]
  Manuscripts, Rare Books, Photographs, Historic Speeches, Constitutional Debates
       │
       ▼
  [2. UNDERSTAND]
  Indic OCR, Deepgram Nova-3 Multilingual ASR (Marathi & English), Provenance Tagging
       │
       ▼
  [3. ORGANIZE]
  Structured Institutional Archive, Metadata Schemas, Semantic Embeddings
       │
       ▼
  [4. SEARCH]
  Multilingual Hybrid Search across text, audio, images, and video transcripts
       │
       ▼
  [5. EXPLAIN]
  AI Reasoning Agent (Groq LPU) grounded in Dr. Ambedkar's philosophy & Constitution
       │
       ▼
  [6. INTERACT] (⚡ Active Demo)
  ChatGPT-style Voice Agent, Web Portal, Memorial Kiosks, Audio-Visual Player
```

---

## ✨ Key Features

1. **🎙️ ChatGPT-Style Voice Interaction ("Voice In ➔ Voice Out")**:
   - Tap the microphone button to start recording.
   - Real-time sound wave canvas visualizer via Web Audio API.
   - Click "OK / विचारा" to finish and transcribe, or "Cancel" to discard.
   - Automatically plays Dr. Ambedkar's spoken voice back in response.

2. **💬 Dual Interaction Paradigm ("Chat In ➔ Chat Out")**:
   - If you talk via voice, the agent responds via voice.
   - If you chat via text, the agent responds in text (with an optional on-demand "Listen Aloud" button).

3. **🇮🇳 Multilingual Indic Support (मराठी & English)**:
   - **Deepgram Nova-3** Speech-to-Text with automatic language detection and Marathi Devanagari script support.
   - **Groq LPU (GPT-OSS-120B / Qwen-27B)** prompt engineering for authentic, scholarly Marathi and dignified English.

4. **🔊 Expressive Text-to-Speech**:
   - Powered by **Sarvam AI Bulbul:v3 (speaker: sumit)** (`model=flux-cliff-en&speed=1&expressivity=0`).

5. **🏛️ Dignified Dr. Ambedkar Persona**:
   - Concise, single-paragraph responses (3-4 sentences) optimized for spoken audio listening.
   - Philosophically grounded in constitutional morality, liberty, equality, and social justice.

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express 5, Multer (in-memory audio processing)
- **Frontend**: HTML5, Tailwind CSS, Lucide Icons, Web Audio API Visualizer
- **Speech-to-Text (STT)**: Deepgram Nova-3 API (`model=nova-3&detect_language=true`)
- **Reasoning Engine (LLM)**: Groq LPU (`openai/gpt-oss-120b` / `qwen/qwen3.8-27b`)
- **Text-to-Speech (TTS)**: Sarvam AI Bulbul (`model=bulbul:v3`, speaker: `sumit`)

---

## 🛠️ Quickstart & Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended; tested on v24)
- npm

### 2. Installation
```bash
git clone https://github.com/sohampirale/sih_2k26_demo.git
cd sih_2k26_demo
npm install
```

### 3. Environment Configuration
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Configure your API keys in `.env`:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_TTS_MODEL=flux-cliff-en
```

### 4. Run the Server
```bash
npm start
```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 👥 Team Information

- **Team Name**: Blue Origin
- **Team ID**: ISIH26143
- **Problem Statement ID**: 26096
- **Hackathon**: Smart India Hackathon 2026
- **Theme**: Smart Education

