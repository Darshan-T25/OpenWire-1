// visualizer.js - handles UI interactions for logs and visualizations

const sentLog = document.getElementById('sentLog');
const recvLog = document.getElementById('recvLog');

// Add a message to the sent log
export function addSentLog(msg) {
  const li = document.createElement('li');
  li.textContent = msg;
  sentLog.appendChild(li);
  sentLog.scrollTop = sentLog.scrollHeight;
}

// Add a message to the received log
export function addRecvLog(msg) {
  const li = document.createElement('li');
  li.textContent = msg;
  recvLog.appendChild(li);
  recvLog.scrollTop = recvLog.scrollHeight;
}

// Show the monitor mode icon
export function showMonitorIcon() {
  const icon = document.createElement('div');
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

// Hide the monitor mode icon
export function hideMonitorIcon() {
  const icon = document.getElementById('monitorModeIcon');
  if (icon) icon.remove();
}
