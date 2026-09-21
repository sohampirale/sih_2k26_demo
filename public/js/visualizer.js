/**
 * Audio visualizer helper using Web Audio API (Minimal Light Mode styling)
 */
class AudioWaveVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
    this.stream = null;
  }

  start(stream) {
    this.stream = stream;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 64;

    const source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(this.dataArray);

      const width = this.canvas.width;
      const height = this.canvas.height;
      this.ctx.clearRect(0, 0, width, height);

      const barCount = 28;
      const barWidth = (width / barCount) - 3;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const index = Math.floor((i / barCount) * bufferLength);
        const barHeight = Math.max(3, (this.dataArray[index] / 255) * height * 0.85);

        // Minimalist charcoal/indigo styling
        this.ctx.fillStyle = '#2563eb';
        this.ctx.beginPath();
        this.ctx.roundRect(x, (height - barHeight) / 2, barWidth, barHeight, 3);
        this.ctx.fill();

        x += barWidth + 3;
      }
    };

    draw();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.AudioWaveVisualizer = AudioWaveVisualizer;
