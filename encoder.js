// encoder.js - handles audio generation for sending messages

// Create audio context for the encoder
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Define audio protocol constants
const baseFreq = 400;
const step = 10;
const MESSAGE_START = '~';
const MESSAGE_END = '^';

// Define character set (must match decoder.js)
const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#|~^[](){}<>_-+=:;,.*@!? ';

// Build map from character to frequency
const charToFreqMap = {};
CHAR_SET.split('').forEach((char, i) => {
  charToFreqMap[char] = baseFreq + (i * step);
});

// Generate a unique device ID
export const myID = localStorage.getItem('deviceId') || (() => {
  const id = Math.random().toString(36).substring(2, 8);
  localStorage.setItem('deviceId', id);
  return id;
})();

// Special ID override
if (myID === 'iam') localStorage.setItem('deviceId', 'Iam');

// Send a message by converting text to audio frequencies
export function sendMessage(message, onVolume) {
  // Add message markers
  const fullMessage = MESSAGE_START + message + MESSAGE_END;
  
  console.log("📤 Sending message:", fullMessage);
  
  // Queue system for sequential tone playing
  const toneQueue = [];
  let isPlaying = false;
  
  // Add each character to the queue
  for (let i = 0; i < fullMessage.length; i++) {
    const char = fullMessage[i];
    const freq = charToFreqMap[char];
    
    if (freq) {
      toneQueue.push({ char, freq });
    } else {
      console.warn(`⚠️ Unsupported character: '${char}'`);
    }
  }
  
  // Process the queue one tone at a time
  function processQueue() {
    if (toneQueue.length === 0) {
      isPlaying = false;
      if (onVolume) onVolume('Done');
      return;
    }
    
    isPlaying = true;
    const { char, freq } = toneQueue.shift();
    
    console.log(`📡 Sending '${char}' at ${freq.toFixed(1)} Hz`);
    playTone(freq, 150, () => {
      // Add a gap between tones for better detection
      setTimeout(processQueue, 50);
      
      if (onVolume) {
        const progress = Math.round((1 - toneQueue.length / fullMessage.length) * 100);
        onVolume(`${progress}%`);
      }
    });
  }
  
  // Start processing the queue
  if (!isPlaying) {
    processQueue();
  }
}

// Play a single tone at the specified frequency
function playTone(freq, duration, onComplete) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  // Use sine wave for clear tones
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  // Add smooth attack
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.01);
  
  // Add smooth release
  gainNode.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + (duration - 20) / 1000);
  gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration / 1000);
  
  // Start and stop the oscillator
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration / 1000 + 0.01);
  
  oscillator.onended = () => {
    if (onComplete) onComplete();
  };
}
