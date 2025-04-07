// Log management for OpenWave Chat

// References to DOM elements
const sentLog = document.getElementById('sentLog');
const recvLog = document.getElementById('recvLog');

// Add message to sent log with timestamp
export function addSentLog(message) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const li = document.createElement('li');
  li.textContent = `[${timestamp}] ${message}`;
  sentLog.appendChild(li);
  
  // Auto-scroll to bottom
  sentLog.scrollTop = sentLog.scrollHeight;
  
  // Limit log size
  pruneLogEntries(sentLog);
}

// Add message to received log with timestamp
export function addRecvLog(message) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const li = document.createElement('li');
  li.textContent = `[${timestamp}] ${message}`;
  recvLog.appendChild(li);
  
  // Auto-scroll to bottom
  recvLog.scrollTop = recvLog.scrollHeight;
  
  // Limit log size
  pruneLogEntries(recvLog);
}

// Keep logs at a reasonable size (max 100 entries)
function pruneLogEntries(logElement) {
  while (logElement.children.length > 100) {
    logElement.removeChild(logElement.firstChild);
  }
}

// Display monitor mode status
export function updateMonitorStatus(isActive) {
  let icon = document.getElementById('monitorModeIcon');
  
  // Create or remove monitoring icon
  if (isActive) {
    if (!icon) {
      icon = document.createElement('div');
      icon.id = 'monitorModeIcon';
      icon.textContent = '👁️ MONITOR MODE';
      icon.style.position = 'fixed';
      icon.style.bottom = '20px';
      icon.style.right = '20px';
      icon.style.background = 'black';
      icon.style.color = 'lime';
      icon.style.padding = '8px 12px';
      icon.style.borderRadius = '8px';
      icon.style.fontWeight = 'bold';
      icon.style.zIndex = '9999';
      icon.style.animation = 'pulse 1s infinite';
      document.body.appendChild(icon);
    }
  } else if (icon) {
    icon.remove();
  }
}

// Display volume level
export function updateVolumeDisplay(level) {
  const volumeElement = document.getElementById('volumeLevel');
  if (volumeElement) {
    const isDarkMode = document.body.classList.contains('dark');
    volumeElement.textContent = isDarkMode ? '' : `🔊 Speaker: ${level}`;
  }
}
