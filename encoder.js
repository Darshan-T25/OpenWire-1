const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const CHAR_TO_FREQ = {};
const FREQ_TO_CHAR = {};
const baseFreq = 400, step = 20;

'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,?!@#[]{}()<>|~^$%&*+-=/\\'.split('').forEach((char, i) => {
  let freq = baseFreq + i * step;
  CHAR_TO_FREQ[char] = freq;
  FREQ_TO_CHAR[Math.round(freq)] = char;
});

function sendMessage(text) {
  let i = 0;
  function playNextChar() {
    if (i >= text.length) return;
    const char = text[i++];
    const freq = CHAR_TO_FREQ[char] || 400;
    const osc = audioCtx.createOscillator();
    osc.frequency.value = freq;
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
    setTimeout(playNextChar, 120); // slightly longer than tone
  }
  playNextChar();
}
