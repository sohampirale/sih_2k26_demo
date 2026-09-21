// State management
let currentLanguage = 'auto'; // 'auto', 'mr', 'en'
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = null;
let recordingTimerInterval = null;
let visualizer = null;
let currentPlayingAudio = null;

// DOM Elements
const chatContainer = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const voiceRecordBtn = document.getElementById('voiceRecordBtn');
const recordingModal = document.getElementById('recordingModal');
const recordTimeDisplay = document.getElementById('recordTimeDisplay');
const cancelRecordBtn = document.getElementById('cancelRecordBtn');
const finishRecordBtn = document.getElementById('finishRecordBtn');
const recordingCanvas = document.getElementById('recordingCanvas');
const loadingIndicator = document.getElementById('loadingIndicator');
const loadingStatusText = document.getElementById('loadingStatusText');
const languageSelect = document.getElementById('languageSelect');
const posterModal = document.getElementById('posterModal');
const viewPosterBtn = document.getElementById('viewPosterBtn');
const closePosterBtn = document.getElementById('closePosterBtn');

// Initialize visualizer
if (recordingCanvas && window.AudioWaveVisualizer) {
  visualizer = new AudioWaveVisualizer(recordingCanvas);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      updateLanguageHints();
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', handleTextSend);
  }

  if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleTextSend();
      }
    });
  }

  if (voiceRecordBtn) {
    voiceRecordBtn.addEventListener('click', startAudioRecording);
  }

  if (finishRecordBtn) {
    finishRecordBtn.addEventListener('click', stopAndSubmitAudio);
  }

  if (cancelRecordBtn) {
    cancelRecordBtn.addEventListener('click', cancelAudioRecording);
  }

  if (viewPosterBtn) {
    viewPosterBtn.addEventListener('click', () => {
      posterModal.classList.remove('hidden');
    });
  }

  if (closePosterBtn) {
    closePosterBtn.addEventListener('click', () => {
      posterModal.classList.add('hidden');
    });
  }

  // Bind quick prompt chips
  document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const promptText = btn.getAttribute('data-prompt');
      const promptLang = btn.getAttribute('data-lang') || 'auto';
      if (promptText) {
        messageInput.value = promptText;
        if (promptLang && languageSelect) {
          languageSelect.value = promptLang;
          currentLanguage = promptLang;
        }
        handleTextSend();
      }
    });
  });
});

function updateLanguageHints() {
  if (!messageInput) return;
  if (currentLanguage === 'mr') {
    messageInput.placeholder = 'बाबासाहेबांना विचारा (उदा. शिक्षणाचे महत्त्व काय?)...';
  } else if (currentLanguage === 'en') {
    messageInput.placeholder = 'Ask Dr. Ambedkar (e.g., What is social democracy?)...';
  } else {
    messageInput.placeholder = 'Ask in Marathi or English / बाबासाहेबांना विचारा...';
  }
}

// Show/Hide Loading status
function setLoading(isLoading, text = 'Processing...') {
  if (!loadingIndicator) return;
  if (isLoading) {
    loadingStatusText.textContent = text;
    loadingIndicator.classList.remove('hidden');
    loadingIndicator.classList.add('flex');
  } else {
    loadingIndicator.classList.add('hidden');
    loadingIndicator.classList.remove('flex');
  }
}

// Scroll to bottom smoothly
function scrollToBottom() {
  if (!chatContainer) return;
  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: 'smooth'
  });
}

// Format time mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ========================
// Audio Recording Logic
// ========================
let mediaStream = null;

async function startAudioRecording() {
  try {
    audioChunks = [];
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Choose optimal mimeType
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg'
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    mediaRecorder = new MediaRecorder(mediaStream, selectedMime ? { mimeType: selectedMime } : {});

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.start(150);

    // Start timer & visualizer
    recordingStartTime = Date.now();
    recordTimeDisplay.textContent = '00:00';
    recordingTimerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      recordTimeDisplay.textContent = formatTime(elapsed);
    }, 500);

    if (visualizer) {
      visualizer.start(mediaStream);
    }

    recordingModal.classList.remove('hidden');
    recordingModal.classList.add('flex');
  } catch (err) {
    console.error('Error accessing microphone:', err);
    alert('Could not access your microphone. Please ensure microphone permissions are granted in your browser.');
  }
}

function stopMicrophoneStreams() {
  if (recordingTimerInterval) {
    clearInterval(recordingTimerInterval);
    recordingTimerInterval = null;
  }
  if (visualizer) {
    visualizer.stop();
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  recordingModal.classList.add('hidden');
  recordingModal.classList.remove('flex');
}

function cancelAudioRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  audioChunks = [];
  stopMicrophoneStreams();
}

async function stopAndSubmitAudio() {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
    stopMicrophoneStreams();

    if (audioBlob.size < 1000) {
      alert('The recorded audio was too short. Please try again.');
      return;
    }

    await submitAudioToBackend(audioBlob);
  };

  mediaRecorder.stop();
}

async function submitAudioToBackend(audioBlob) {
  setLoading(true, 'Transcribing with Deepgram Nova-3 (मराठी / English)...');

  let thinkingTimer = null;
  let voiceTimer = null;

  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('language', currentLanguage);

    thinkingTimer = setTimeout(() => {
      setLoading(true, 'Formulating response via Groq LPU...');
    }, 1200);

    voiceTimer = setTimeout(() => {
      setLoading(true, 'Synthesizing voice with Sarvam AI (bulbul:v3)...');
    }, 2800);

    const res = await fetch('/api/voice', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to process voice request.');
    }

    // 1. Add user speech message
    appendMessage({
      sender: 'user',
      text: data.userText,
      mode: 'voice',
      language: data.detectedLanguage
    });

    // 2. Add Dr. Ambedkar response
    appendMessage({
      sender: 'ambedkar',
      text: data.replyText,
      mode: 'voice',
      language: data.detectedLanguage,
      audioUrl: data.audio
    });

    // 3. Auto-play voice response
    if (data.audio) {
      playAudio(data.audio);
    }

  } catch (err) {
    console.error('Voice submission error:', err);
    alert('Voice interaction error: ' + err.message);
  } finally {
    clearTimeout(thinkingTimer);
    clearTimeout(voiceTimer);
    setLoading(false);
  }
}

// ========================
// Text Chat Logic
// ========================
async function handleTextSend() {
  const text = messageInput.value.trim();
  if (!text) return;

  messageInput.value = '';

  appendMessage({
    sender: 'user',
    text: text,
    mode: 'text',
    language: currentLanguage
  });

  setLoading(true, 'Formulating response via Groq LPU...');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        language: currentLanguage
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to get answer.');
    }

    appendMessage({
      sender: 'ambedkar',
      text: data.replyText,
      mode: 'text',
      language: data.language
    });

  } catch (err) {
    console.error('Chat error:', err);
    alert('Chat error: ' + err.message);
  } finally {
    setLoading(false);
  }
}

// ========================
// Audio Playback
// ========================
function playAudio(audioDataUrl, playBtnElement = null, animElement = null) {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio.currentTime = 0;
    document.querySelectorAll('.is-speaking-anim').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.play-btn-icon').forEach(el => {
      el.setAttribute('data-lucide', 'volume-2');
    });
    if (window.lucide) lucide.createIcons();
  }

  const audio = new Audio(audioDataUrl);
  currentPlayingAudio = audio;

  if (animElement) animElement.classList.remove('hidden');
  if (playBtnElement) {
    const icon = playBtnElement.querySelector('.play-btn-icon');
    if (icon) {
      icon.setAttribute('data-lucide', 'pause');
      if (window.lucide) lucide.createIcons();
    }
  }

  audio.onended = () => {
    if (animElement) animElement.classList.add('hidden');
    if (playBtnElement) {
      const icon = playBtnElement.querySelector('.play-btn-icon');
      if (icon) {
        icon.setAttribute('data-lucide', 'volume-2');
        if (window.lucide) lucide.createIcons();
      }
    }
    currentPlayingAudio = null;
  };

  audio.play().catch(e => {
    console.warn('Audio autoplay blocked or failed:', e);
  });
}

// Synthesize on-demand for text messages
async function synthesizeAndPlay(text, language, playBtnElement, animElement) {
  try {
    const originalText = playBtnElement.innerHTML;
    playBtnElement.disabled = true;
    playBtnElement.innerHTML = `<span class="animate-spin text-xs">⏳</span> Generating...`;

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language })
    });

    playBtnElement.innerHTML = originalText;
    playBtnElement.disabled = false;
    if (window.lucide) lucide.createIcons();

    const data = await res.json();
    if (data.success && data.audio) {
      playAudio(data.audio, playBtnElement, animElement);
    } else {
      alert('Could not generate speech: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('TTS error:', err);
    alert('TTS error: ' + err.message);
  }
}

// ========================
// Append Message to UI
// ========================
function appendMessage({ sender, text, mode = 'text', language = 'auto', audioUrl = null }) {
  const isUser = sender === 'user';
  const msgDiv = document.createElement('div');
  msgDiv.className = `flex w-full ${isUser ? 'justify-end' : 'justify-start'} fade-in-up mb-4`;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const langLabel = language === 'mr' ? 'मराठी' : (language === 'en' ? 'English' : '');

  if (isUser) {
    msgDiv.innerHTML = `
      <div class="max-w-xl flex flex-col items-end">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[11px] text-stone-400">${timeStr}</span>
          <span class="text-xs font-medium text-stone-600">You (${mode === 'voice' ? '🎙️ Voice' : '💬 Chat'})</span>
        </div>
        <div class="bg-stone-900 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm text-sm leading-relaxed">
          ${escapeHtml(text)}
        </div>
      </div>
    `;
  } else {
    const msgId = 'msg_' + Math.random().toString(36).substring(2, 9);
    
    msgDiv.innerHTML = `
      <div class="max-w-2xl flex items-start gap-3.5">
        <img src="/assets/ambedkar_avatar.png" alt="Dr. B. R. Ambedkar" class="w-9 h-9 rounded-full border border-stone-200 shadow-sm object-cover flex-shrink-0 mt-0.5" />
        <div class="flex flex-col flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-semibold text-stone-900 font-serif-title">Dr. B. R. Ambedkar</span>
            <span class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
              ${langLabel || 'Knowledge Platform'}
            </span>
            <span class="text-[11px] text-stone-400">${timeStr}</span>
          </div>
          <div class="bg-stone-50/90 text-stone-800 rounded-2xl rounded-tl-sm p-4 border border-stone-200/70 text-sm leading-relaxed relative group shadow-sm font-devanagari">
            <p class="text-stone-800">${escapeHtml(text)}</p>
            
            <!-- Audio playback controls bar -->
            <div class="flex items-center justify-between pt-2.5 mt-2.5 border-t border-stone-200/60">
              <div class="flex items-center gap-2">
                <button id="btn_listen_${msgId}" class="flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 font-medium transition px-2.5 py-1 rounded-md bg-white hover:bg-stone-100 border border-stone-200 shadow-xs">
                  <i data-lucide="volume-2" class="w-3.5 h-3.5 text-stone-500 play-btn-icon"></i>
                  <span>${audioUrl ? 'Replay Voice (Sarvam)' : 'Listen Aloud (Sarvam)'}</span>
                </button>
                <div id="anim_${msgId}" class="is-speaking-anim hidden items-center gap-1 text-blue-600 ml-2">
                  <span class="w-1 h-3 bg-blue-600 sound-bar inline-block rounded-full"></span>
                  <span class="w-1 h-4 bg-blue-600 sound-bar inline-block rounded-full"></span>
                  <span class="w-1 h-2 bg-blue-600 sound-bar inline-block rounded-full"></span>
                  <span class="text-[11px] text-blue-600 font-medium ml-1">Speaking...</span>
                </div>
              </div>
              <span class="text-[11px] text-stone-400 italic">"Educate, Agitate, Organize"</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach speech handler
    setTimeout(() => {
      const listenBtn = document.getElementById(`btn_listen_${msgId}`);
      const animSpan = document.getElementById(`anim_${msgId}`);
      if (listenBtn) {
        listenBtn.addEventListener('click', () => {
          if (audioUrl) {
            playAudio(audioUrl, listenBtn, animSpan);
          } else {
            synthesizeAndPlay(text, language, listenBtn, animSpan);
          }
        });
      }
      if (window.lucide) lucide.createIcons();
    }, 50);
  }

  chatContainer.appendChild(msgDiv);
  scrollToBottom();
  if (window.lucide) lucide.createIcons();
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
