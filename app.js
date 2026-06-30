// ============================================
// JARVIS Voice Assistant - Main Application
// ============================================

// Globals
let isListening = false;
let isSpeaking = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// DOM Elements
const micButton = document.getElementById('micButton');
const textInput = document.getElementById('textInput');
const sendButton = document.getElementById('sendButton');
const messagesContainer = document.getElementById('messagesContainer');
const transcriptText = document.getElementById('transcriptText');
const listeningIndicator = document.getElementById('listeningIndicator');
const listeningText = document.getElementById('listeningText');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// Speech Recognition Setup
let recognition = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.language = 'en-US';
}

// ============================================
// Message Display Functions
// ============================================

function addMessage(text, type = 'system-message') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = text;

  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  messageDiv.appendChild(contentDiv);
  messageDiv.appendChild(timeDiv);
  messagesContainer.appendChild(messageDiv);

  // Auto-scroll to bottom
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 0);
}

// ============================================
// Basic Reply Logic
// ============================================

function getJarvisReply(userInput) {
  const input = userInput.toLowerCase().trim();

  // Greeting
  if (input.match(/^hello|^hi|^hey/i)) {
    return 'Hello Benny. Jarvis online.';
  }

  // Time
  if (input.match(/what.*time|tell.*time|current time/i)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `The current time is ${timeStr}.`;
  }

  // Stop
  if (input.match(/^stop|^quit|^exit/i)) {
    return 'Stopping. Ready for next command.';
  }

  // Default
  return 'I heard you. AI connection will be added next.';
}

// ============================================
// Text-to-Speech Function
// ============================================

function speak(text) {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to use a male voice if available
  const voices = window.speechSynthesis.getVoices();
  const maleVoice = voices.find(
    (voice) =>
      voice.name.includes('Male') ||
      voice.name.includes('Google UK English Male')
  );
  if (maleVoice) {
    utterance.voice = maleVoice;
  }

  isSpeaking = true;
  micButton.disabled = true;
  textInput.disabled = true;
  sendButton.disabled = true;

  utterance.onend = () => {
    isSpeaking = false;
    micButton.disabled = false;
    textInput.disabled = false;
    sendButton.disabled = false;
    updateStatus('Ready');
  };

  utterance.onerror = () => {
    isSpeaking = false;
    micButton.disabled = false;
    textInput.disabled = false;
    sendButton.disabled = false;
    updateStatus('Ready');
  };

  window.speechSynthesis.speak(utterance);
  updateStatus('Speaking');
}

// ============================================
// Process User Input
// ============================================

function processUserInput(userText) {
  if (!userText.trim()) return;

  // Add user message to display
  addMessage(userText, 'user-message');

  // Get Jarvis response
  const reply = getJarvisReply(userText);

  // Add system message
  addMessage(reply, 'system-message');

  // Speak the response
  speak(reply);

  // Clear inputs
  textInput.value = '';
  transcriptText.textContent = '';
}

// ============================================
// Speech Recognition Handlers
// ============================================

if (recognition) {
  recognition.onstart = () => {
    isListening = true;
    micButton.classList.add('active');
    listeningIndicator.classList.add('active');
    transcriptText.textContent = '';
    updateStatus('Listening');
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Display interim or final transcript
    transcriptText.textContent = finalTranscript || interimTranscript;

    // If final result, process it
    if (finalTranscript) {
      // Check for "stop" command
      if (finalTranscript.toLowerCase().match(/^stop|^quit/i)) {
        recognition.stop();
        return;
      }
    }
  };

  recognition.onend = () => {
    isListening = false;
    micButton.classList.remove('active');
    listeningIndicator.classList.remove('active');

    // Get final transcript
    const finalText = transcriptText.textContent.trim();

    if (finalText) {
      processUserInput(finalText);
    }

    updateStatus('Ready');
  };

  recognition.onerror = (event) => {
    isListening = false;
    micButton.classList.remove('active');
    listeningIndicator.classList.remove('active');

    const errorMessage =
      event.error === 'network'
        ? 'Network error. Check your connection.'
        : 'Could not understand. Please try again.';

    addMessage(errorMessage, 'error-message');
    updateStatus('Ready');
  };
}

// ============================================
// UI Event Listeners
// ============================================

// Microphone Button
micButton.addEventListener('click', () => {
  if (!recognition) {
    addMessage(
      'Speech recognition not supported on this device.',
      'error-message'
    );
    return;
  }

  if (isListening) {
    recognition.stop();
  } else if (!isSpeaking) {
    recognition.start();
  }
});

// Send Button
sendButton.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (text) {
    processUserInput(text);
  }
});

// Text Input - Send on Enter
textInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const text = textInput.value.trim();
    if (text) {
      processUserInput(text);
    }
  }
});

// ============================================
// Status Helper
// ============================================

function updateStatus(status) {
  statusText.textContent = status;
  if (status === 'Listening') {
    statusDot.style.boxShadow = '0 0 15px var(--accent-blue)';
  } else if (status === 'Speaking') {
    statusDot.style.boxShadow = '0 0 15px var(--accent-green)';
  } else {
    statusDot.style.boxShadow = '0 0 10px var(--accent-green)';
  }
}

// ============================================
// Service Worker Registration
// ============================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

// ============================================
// Load voices on page ready
// ============================================

if ('onvoiceschanged' in window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices are now loaded
  };
}

// Get voices immediately if available
window.speechSynthesis.getVoices();
