// app.js - main application logic

import { sendMessage, myID } from './encoder.js';
import { startMic, stopMic, MESSAGE_START, MESSAGE_END } from './decoder.js';
import { addSentLog, addRecvLog, showMonitorIcon, hideMonitorIcon } from './visualizer.js';

// Get DOM elements
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const darkModeMsg = document.getElementById('darkModeMsg');
const stopListenBtn = document.getElementById('stopListenBtn');
const listenIcon = document.getElementById('listenIcon');
const listenText = document.getElementById('listenText');
const micError = document.getElementById('micError');
const volumeLevel = document.getElementById('volumeLevel');
const visualizerCanvas = document.getElementById('visualizer');

// Device ID handling
function generateDeviceId() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

let deviceId = localStorage.getItem('tempDeviceId');
if (!deviceId) {
  deviceId = generateDeviceId();
  localStorage.setItem('tempDeviceId', deviceId);
}

// Clear tempDeviceId on page unload
window.addEventListener('beforeunload', () => {
  // Don't remove this in production - we want to keep device ID
  // localStorage.removeItem('tempDeviceId');
});

// Display device ID
const deviceDisplay = document.getElementById('deviceIDDisplay');
if (deviceDisplay) {
  deviceDisplay.textContent = deviceId;
}

// App state
let isMicActive = false;
let isDark = localStorage.getItem('darkMode') === 'true';
let monitorMode = JSON.parse(localStorage.getItem('monitorMode')) || false;
const seenMessageIds = new Set();

// Set initial dark mode state
if (isDark) {
  document.body.classList.add('dark');
}

// Generate a unique message ID
function generateMessageID() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Send Message
sendBtn.addEventListener('click', () => {
  const msg = messageInput.value.trim();
  if (!msg) return;

  const receiver = prompt("Enter receiver ID (leave empty for broadcast):") || 'broadcast';
  const id = generateMessageID();
  const payload = `[${deviceId}->${receiver}#${id}|hop0] ${msg}`;

  addSentLog(`To ${receiver}: ${msg}`);
  sendMessage(payload, showSpeakerVolume);
  messageInput.value = '';
});

// Allow Enter key to send messages
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// Display speaker volume
function showSpeakerVolume(val) {
  volumeLevel.textContent = document.body.classList.contains('dark') ? '' : `🔊 Speaker: ${val}`;
}

// Dark mode toggle
darkModeBtn.addEventListener('click', () => {
  const wasDark = document.body.classList.contains('dark');
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('darkMode', isDark);

  if (!wasDark && isDark) {
    darkModeMsg.style.display = 'block';
    darkModeMsg.classList.add('fadeOut');
    setTimeout(() => {
      darkModeMsg.style.display = 'none';
      darkModeMsg.classList.remove('fadeOut');
    }, 2000);
  }
});

// Microphone toggle
stopListenBtn.addEventListener('click', () => {
  if (isMicActive) {
    stopMic();
    isMicActive = false;
    listenIcon.textContent = '🎤';
    listenText.style.textDecoration = 'none';
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => {
        micError.style.display = 'none';
        startMic(
          handleDecodedMessage,
          () => {
            micError.style.display = 'block';
            micError.style.cursor = 'pointer';
            micError.title = 'Click to grant mic access';
            micError.addEventListener('click', requestMicAccessOnce, { once: true });
          },
          () => { micError.style.display = 'none'; },
          visualizerCanvas
        );
        isMicActive = true;
        listenIcon.textContent = '🔇';
        listenText.style.textDecoration = 'line-through';
      })
      .catch((err) => {
        console.error("Mic access error:", err);
        micError.style.display = 'block';
        micError.style.cursor = 'pointer';
        micError.title = 'Click to grant mic access';
        addRecvLog("🚫 Microphone access denied. Please allow mic access and try again.");
        micError.addEventListener('click', requestMicAccessOnce, { once: true });
      });
  }
});

// Request microphone access once
function requestMicAccessOnce() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(() => {
      micError.style.display = 'none';
      if (!isMicActive) stopListenBtn.click();
    })
    .catch(() => {
      alert("Microphone access is still blocked. Please enable it from your browser settings.");
    });
}

// Handle decoded messages
function handleDecodedMessage(fullMessage) {
  console.log("Raw decoded message:", fullMessage);
  
  // Expect format: "[sender->receiver#id|hop] message"
  if (!fullMessage.includes(']')) return;
  
  const headerEndIndex = fullMessage.indexOf(']');
  if (headerEndIndex === -1) return;
  
  const header = fullMessage.substring(0, headerEndIndex + 1);
  const match = header.match(/\[([^\-]+)->([^\#]+)#([^\|]+)\|hop(\d+)\]/);
  
  if (!match) {
    console.log("Invalid message format:", fullMessage);
    return;
  }
  
  const [_, from, to, msgID, hop] = match;
  
  // Get the message content (everything after the header + space)
  const message = fullMessage.substring(headerEndIndex + 1).trim();
  
  // Prevent duplicate messages
  if (seenMessageIds.has(msgID)) {
    console.log("Duplicate message detected, ignoring:", msgID);
    return;
  }
  
  seenMessageIds.add(msgID);
  
  // Handle messages for this device or broadcasts
  if (to === deviceId || to === 'broadcast') {
    console.log(`📬 Message for ${to === 'broadcast' ? 'everyone' : 'me'} from ${from}: ${message}`);
    addRecvLog(`From ${from}: ${message}`);
  }
  
  // Handle monitor mode for special device
  if (monitorMode && deviceId === 'Iam') {
    addRecvLog(`🔁 Relayed: From ${from} to ${to}: "${message}"`);
  }
  
  // Relay messages not intended for this device
  if (to !== deviceId) {
    const hopNum = parseInt(hop);
    const newHop = hopNum + 1;
    
    // Limit hop count to prevent infinite loops
    if (newHop <= 3) {
      const rebroadcast = `[${from}->${to}#${msgID}|hop${newHop}] ${message}`;
      console.log(`🔄 Rebroadcasting: ${rebroadcast}`);
      
      // Add delay to prevent interference
      setTimeout(() => {
        sendMessage(rebroadcast, showSpeakerVolume);
      }, 750);
    } else {
      console.log(`🛑 Not rebroadcasting - hop count (${newHop}) exceeds limit`);
    }
  }
}

// Monitor mode toggle (Shift + M)
document.addEventListener('keydown', (e) => {
  if (deviceId === 'Iam' && e.shiftKey && e.key.toLowerCase() === 'm') {
    monitorMode = !monitorMode;
    localStorage.setItem('monitorMode', JSON.stringify(monitorMode));
    updateMonitorIcon();
    addRecvLog(`🕹️ Monitor mode ${monitorMode ? 'enabled' : 'disabled'}`);
  }
});

// Update the monitor mode icon
function updateMonitorIcon() {
  let icon = document.getElementById('monitorIcon');
  if (!icon) {
    icon = document.createElement('span');
    icon.id = 'monitorIcon';
    icon.className = monitorMode ? 'monitor-icon' : '';
    icon.style.marginLeft = '0.5rem';
    icon.style.display = monitorMode ? 'inline' : 'none';
    stopListenBtn.parentNode.insertBefore(icon, stopListenBtn.nextSibling);
  }
  icon.textContent = monitorMode ? '🕹️' : '';
  icon.style.display = monitorMode ? 'inline' : 'none';
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  stopListenBtn.style.display = 'inline-flex';
  updateMonitorIcon();
  
  // Start listening automatically
  setTimeout(() => {
    if (!isMicActive) stopListenBtn.click();
  }, 500);
  
  const deviceInfoEl = document.getElementById('deviceIDDisplay');
  if (deviceInfoEl) {
    deviceInfoEl.textContent = deviceId;
  }
  
  // Clear old message IDs
  seenMessageIds.clear();
  
  // Add initialization message
  addRecvLog("💫 OpenWave Chat initialized. Ready to send/receive messages.");
});
