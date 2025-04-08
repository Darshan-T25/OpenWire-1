const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatBox = document.getElementById('chatBox');
const darkToggle = document.getElementById('darkModeToggle');
const micStatus = document.getElementById('micStatus');
const volumeLevel = document.getElementById('volumeLevel');

sendBtn.onclick = () => {
  const msg = messageInput.value.trim();
  if (msg) {
    addMessage(`You: ${msg}`);
    sendMessage(msg);
    messageInput.value = '';
  }
};

function addMessage(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

darkToggle.onclick = () => {
  document.body.classList.toggle('dark');
  darkToggle.textContent = document.body.classList.contains('dark') ? '🌚' : '🌞';
};

// Display mic access error if denied
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    startDecoding(stream);
    startVisualizer(stream);
  })
  .catch(() => {
    micStatus.textContent = 'Mic access denied';
  });
