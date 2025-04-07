// decoder.js - handles microphone input and frequency decoding

// Create a new audio context for the decoder
// Using a shared context from encoder.js would be better but not required
let audioCtx;
// Initialize constants for audio protocol
const baseFreq = 400;
const step = 10;
export const MESSAGE_START = '~';
export const MESSAGE_END = '^';

// Character set must match encoder.js
const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#|~^[](){}<>_-+=:;,.*@!? ';

// Build map from frequency to character
const freqToCharMap = {};
CHAR_SET.split('').forEach((char, i) => {
  const freq = baseFreq + (i * step);
  freqToCharMap[Math.round(freq)] = char;
});

// Track incoming message state
let incomingBuffer = '';
let isReceiving = false;
let silenceTimeout = null;
let micStream = null;
let analyser = null;
let scriptNode = null;
let isMicOn = false;

// Get the closest character for a detected frequency
function getClosestChar(freq) {
  let minDiff = Infinity;
  let matchedChar = null;
  const tolerance = 5; // Hz tolerance 
  
  for (const [keyFreq, char] of Object.entries(freqToCharMap)) {
    const mappedFreq = parseInt(keyFreq);
    const diff = Math.abs(freq - mappedFreq);
    if (diff < minDiff && diff <= tolerance) {
      minDiff = diff;
      matchedChar = char;
    }
  }
  return matchedChar;
}

// Start the microphone
export async function startMic(onDecoded, onMicError, onMicStarted, visualizerCanvas) {
  if (isMicOn) return;
  
  // Create audio context on first use
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    isMicOn = true;
    if (onMicStarted) onMicStarted();

    const source = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 4096; // Higher FFT size for better frequency resolution
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    if (visualizerCanvas) {
      initVisualizer(analyser, visualizerCanvas);
    }

    scriptNode = audioCtx.createScriptProcessor(4096, 1, 1);
    scriptNode.onaudioprocess = (e) => decodeMic(e, analyser, onDecoded);
    analyser.connect(scriptNode);
    scriptNode.connect(audioCtx.destination);
  } catch (err) {
    console.error("Microphone error:", err);
    if (onMicError) onMicError();
    isMicOn = false;
  }
}

// Stop the microphone
export function stopMic() {
  if (!isMicOn) return;
  isMicOn = false;
  if (scriptNode) scriptNode.disconnect();
  if (analyser) analyser.disconnect();
  if (micStream) micStream.getTracks().forEach(t => t.stop());
}

// Process audio data to decode messages
function decodeMic(e, analyser, onDecoded) {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Find peak frequency
  const noiseFloor = 120;
  let maxVal = 0, maxIndex = 0;
  
  for (let i = 0; i < dataArray.length; i++) {
    if (dataArray[i] > maxVal) {
      maxVal = dataArray[i];
      maxIndex = i;
    }
  }

  // Only process if signal is strong enough
  if (maxVal > noiseFloor) {
    const detectedFreq = (maxIndex * audioCtx.sampleRate) / analyser.fftSize;
    const roundedFreq = Math.round(detectedFreq);
    const decodedChar = getClosestChar(roundedFreq);
    
    if (decodedChar) {
      console.log(`🎵 Detected Freq: ${roundedFreq} Hz → '${decodedChar}' (volume: ${maxVal})`);
      
      // Handle message start marker
      if (decodedChar === MESSAGE_START) {
        isReceiving = true;
        incomingBuffer = '';
        return;
      }
      
      // Handle message end marker
      if (decodedChar === MESSAGE_END && isReceiving) {
        isReceiving = false;
        console.log("📥 Complete Message Decoded:", incomingBuffer);
        if (incomingBuffer.length > 0) {
          onDecoded(incomingBuffer);
        }
        incomingBuffer = '';
        if (silenceTimeout) clearTimeout(silenceTimeout);
        return;
      }
      
      // Handle normal character
      if (isReceiving) {
        incomingBuffer += decodedChar;
        
        // Reset timeout for incomplete messages
        if (silenceTimeout) clearTimeout(silenceTimeout);
        silenceTimeout = setTimeout(() => {
          if (incomingBuffer.length > 0 && isReceiving) {
            console.log("⌛ Timeout - Partial Message:", incomingBuffer);
            onDecoded(incomingBuffer);
            incomingBuffer = '';
            isReceiving = false;
          }
        }, 2000);
      }
    }
  }
}

// Initialize the audio visualizer
function initVisualizer(analyser, canvas) {
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  
  function draw() {
    requestAnimationFrame(draw);
    
    // Use frequency domain for visualization
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.fillStyle = document.body.classList.contains('dark') ? '#000' : '#222';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    const barWidth = (WIDTH / bufferLength) * 2.5;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] * 1.5;
      
      // Color gradient based on frequency
      const h = i / bufferLength * 360;
      ctx.fillStyle = document.body.classList.contains('dark') ? 
        `hsl(${h}, 100%, 50%)` : `hsl(${h}, 80%, 50%)`;
      
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  
  draw();
}
