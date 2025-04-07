// Core audio configuration shared between encoder and decoder
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Constants for audio communication
export const AUDIO_CONFIG = {
  baseFrequency: 400,       // Starting frequency in Hz
  frequencyStep: 10,        // Hz between each character
  characterDuration: 120,   // Duration of each tone in ms
  gapDuration: 30,          // Silent gap between tones in ms
  startMarker: '~',         // Message start marker
  endMarker: '^',           // Message end signal
  noiseFloor: 120,          // Minimum volume to consider a signal (0-255)
  frequencyTolerance: 5,    // Hz tolerance for detecting frequencies
  maxHopCount: 5,           // Maximum number of hops for message rebroadcasting
  messageTTL: 15000,        // Time to keep message IDs in memory (ms)
};

// Character set for encoding and decoding
export const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#|~^[](){}<>_-+=:;,.*@!? ';

// Build frequency mapping based on character set
export const charToFrequency = {};
export const frequencyToChar = {};

// Generate frequency tables from character set
CHAR_SET.split('').forEach((char, index) => {
  const frequency = AUDIO_CONFIG.baseFrequency + (index * AUDIO_CONFIG.frequencyStep);
  charToFrequency[char] = frequency;
  frequencyToChar[Math.round(frequency)] = char;
});

// Device identification
export function generateDeviceId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// Message ID generation for deduplication
export function generateMessageId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Message format: [sender->receiver#messageId|hopCount] messageContent
export function formatMessage(sender, receiver, messageId, hopCount, content) {
  return `[${sender}->${receiver}#${messageId}|hop${hopCount}] ${content}`;
}

// Parse message header
export function parseMessageHeader(message) {
  if (!message.includes(']')) return null;
  
  const headerEndIndex = message.indexOf(']');
  const header = message.substring(0, headerEndIndex + 1);
  const match = header.match(/\[([^\-]+)->([^\#]+)#([^\|]+)\|hop(\d+)\]/);
  
  if (!match) return null;
  
  const [_, sender, receiver, messageId, hopCount] = match;
  const content = message.substring(headerEndIndex + 1).trim();
  
  return {
    sender,
    receiver,
    messageId,
    hopCount: parseInt(hopCount),
    content
  };
}
