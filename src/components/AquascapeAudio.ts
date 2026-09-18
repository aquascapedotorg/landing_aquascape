/**
 * Synthesizes organic, gentle aquarium water ripples, filter stream, and soft bubble sounds
 * using the Web Audio API without relying on external audio assets.
 */

class AquascapeAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private filterNoiseGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private bubbleTimer: number | null = null;

  private init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;

    // 1. Gentle continuous water filter flow (pink noise filtered)
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(420, this.ctx.currentTime);

      const highpass = this.ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.filterNoiseGain = this.ctx.createGain();
      this.filterNoiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.noiseSource.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(this.filterNoiseGain);
      this.filterNoiseGain.connect(this.masterGain);
      this.noiseSource.start();
    } catch {
      // Audio autoplay policy fallback
    }

    // 2. Periodic soft bubble & water droplet sounds
    this.scheduleBubbles();
  }

  public stop() {
    this.isPlaying = false;
    if (this.bubbleTimer) {
      window.clearTimeout(this.bubbleTimer);
      this.bubbleTimer = null;
    }
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      this.noiseSource = null;
    }
  }

  public playBubblePop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sine chirp with rapid frequency upward slide
      const startFreq = 300 + Math.random() * 500;
      const endFreq = startFreq + 400 + Math.random() * 300;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.06);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  private scheduleBubbles() {
    if (!this.isPlaying) return;
    const interval = 800 + Math.random() * 2200;
    this.bubbleTimer = window.setTimeout(() => {
      this.playBubblePop();
      this.scheduleBubbles();
    }, interval);
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const aquascapeAudio = new AquascapeAudioEngine();
