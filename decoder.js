function startDecoding(stream) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;

  src.connect(analyser);
  const buffer = new Float32Array(analyser.fftSize);

  const threshold = 0.01;

  function getDominantFreq() {
    analyser.getFloatTimeDomainData(buffer);
    let max = 0, index = -1;
    for (let i = 0; i < buffer.length; i++) {
      if (Math.abs(buffer[i]) > max) {
        max = Math.abs(buffer[i]);
        index = i;
      }
    }
    return max > threshold ? indexToFreq(index, ctx.sampleRate, buffer.length) : null;
  }

  function indexToFreq(i, sampleRate, fftSize) {
    return Math.round(sampleRate * i / fftSize);
  }

  let currentChar = '';
  function decodeLoop() {
    const freq = getDominantFreq();
    if (freq) {
      const rounded = Math.round(freq / step) * step;
      const char = FREQ_TO_CHAR[rounded];
      if (char && char !== currentChar) {
        currentChar = char;
        addMessage(`👂 ${char}`);
      }
    }
    requestAnimationFrame(decodeLoop);
  }

  decodeLoop();
}
