let ctx: AudioContext | null = null;
const noiseCache = new Map<number, AudioBuffer>();

function getCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function getNoiseBuffer(durationSeconds: number): AudioBuffer | null {
  const cached = noiseCache.get(durationSeconds);
  if (cached) return cached;

  const c = getCtx();
  if (!c) return null;
  const length = Math.max(1, Math.floor(c.sampleRate * durationSeconds));
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseCache.set(durationSeconds, buffer);
  return buffer;
}

function playNoiseBurst(
  duration: number,
  filterFreq: number,
  filterQ: number,
  gainPeak: number,
  filterType: BiquadFilterType = 'lowpass',
) {
  const c = getCtx();
  if (!c) return;
  const buffer = getNoiseBuffer(duration);
  if (!buffer) return;
  const source = c.createBufferSource();
  source.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  source.start(c.currentTime);
  source.stop(c.currentTime + duration);
}

function playTone(
  freq: number,
  duration: number,
  gainPeak: number,
  type: OscillatorType = 'sine',
  delay: number = 0,
) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime + delay);
  gain.gain.linearRampToValueAtTime(gainPeak, c.currentTime + delay + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime + delay);
  osc.stop(c.currentTime + delay + duration);
}

const GEAR_FREQS: Record<number, number> = {
  1: 140,
  2: 200,
  3: 280,
  4: 380,
  5: 520,
  6: 720,
};

function defer(fn: () => void) {
  setTimeout(fn, 0);
}

export function createAudio() {
  getCtx();
  getNoiseBuffer(0.12);
  getNoiseBuffer(0.06);
  getNoiseBuffer(0.05);

  return {
    playGateEngage(gear: number) {
      defer(() => {
        const freq = GEAR_FREQS[gear] ?? 280;
        playNoiseBurst(0.12, freq, 2.5, 0.35);
        playTone(freq * 0.7, 0.09, 0.15, 'triangle', 0.01);
      });
    },

    playNeutralClick() {
      defer(() => {
        playNoiseBurst(0.06, 3000, 1.2, 0.18, 'highpass');
        playTone(1600, 0.04, 0.08, 'sine', 0.005);
      });
    },

    playSessionStart() {
      defer(() => {
        playTone(330, 0.15, 0.22, 'triangle', 0);
        playTone(392, 0.18, 0.22, 'triangle', 0.1);
      });
    },

    playSessionEnd() {
      defer(() => {
        playTone(392, 0.15, 0.22, 'triangle', 0);
        playTone(330, 0.18, 0.22, 'triangle', 0.1);
      });
    },

    playRecommendation() {
      defer(() => {
        playTone(800, 0.35, 0.12, 'sine', 0);
        playTone(1000, 0.25, 0.08, 'sine', 0.06);
      });
    },

    playShiftClick() {
      defer(() => {
        playNoiseBurst(0.05, 220, 4, 0.25);
        playTone(180, 0.03, 0.12, 'triangle', 0.003);
      });
    },
  };
}
