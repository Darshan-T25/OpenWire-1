function startVisualizer(stream) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  const src = ctx.createMediaStreamSource(stream);
  src.connect(analyser);

  const canvas = document.getElementById('visualizer');
  const ctx2d = canvas.getContext('2d');
  const data = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    analyser.getByteFrequencyData(data);
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    ctx2d.fillStyle = 'lime';
    data.slice(0, 100).forEach((v, i) => {
      ctx2d.fillRect(i * 3, canvas.height - v / 2, 2, v / 2);
    });
    requestAnimationFrame(draw);
  }
  draw();
}
