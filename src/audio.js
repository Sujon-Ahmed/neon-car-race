// Tiny Web Audio sound engine - every sound is synthesized, no asset files.
let ctx = null;
let masterGain = null;
let engine = null;
let lastPitch = -1;
let isMuted = false;

export function toggleMute() {
  if (!ctx || !masterGain) return isMuted;

  isMuted = !isMuted;
  masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.6, ctx.currentTime, 0.05);

  return isMuted;
}

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  ctx = new AudioCtx();

  masterGain = ctx.createGain();
  masterGain.gain.value = isMuted ? 0 : 0.6;
  masterGain.connect(ctx.destination);
}

// Continuous engine drone under the whole race.
export function startEngine() {
  if (!ctx || engine) return;

  const now = ctx.currentTime;

  const oscA = ctx.createOscillator();
  oscA.type = 'sawtooth';
  oscA.frequency.setValueAtTime(62, now);

  const oscB = ctx.createOscillator();
  oscB.type = 'square';
  oscB.frequency.setValueAtTime(31, now);
  oscB.detune.setValueAtTime(9, now);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(340, now);
  filter.Q.setValueAtTime(7, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.5);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  oscA.start(now);
  oscB.start(now);

  engine = { oscA, oscB, filter, gain };
  lastPitch = 0;
}

// ratio 0 = base speed, 1 = top speed.
export function setEnginePitch(ratio) {
  if (!ctx || !engine) return;

  const clamped = Math.min(1, Math.max(0, ratio));
  if (Math.abs(clamped - lastPitch) < 0.01) return;

  lastPitch = clamped;

  const now = ctx.currentTime;
  const frequency = 62 + clamped * 78;

  engine.oscA.frequency.setTargetAtTime(frequency, now, 0.12);
  engine.oscB.frequency.setTargetAtTime(frequency * 0.5, now, 0.12);
  engine.filter.frequency.setTargetAtTime(340 + clamped * 1100, now, 0.12);
}

export function stopEngine() {
  if (!ctx || !engine) return;

  const now = ctx.currentTime;
  const stopped = engine;

  stopped.gain.gain.cancelScheduledValues(now);
  stopped.gain.gain.setValueAtTime(Math.max(stopped.gain.gain.value, 0.0001), now);
  stopped.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  stopped.oscA.stop(now + 0.4);
  stopped.oscB.stop(now + 0.4);

  engine = null;
  lastPitch = -1;

  setTimeout(() => {
    stopped.oscA.disconnect();
    stopped.oscB.disconnect();
    stopped.filter.disconnect();
    stopped.gain.disconnect();
  }, 700);
}

// Short whoosh when changing lanes. direction: -1 left, 1 right.
export function playLaneChange(direction = 1) {
  if (!ctx) return;

  const now = ctx.currentTime;
  const base = direction < 0 ? 380 : 560;

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 1.55, now + 0.12);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.2);
}

function createNoiseBuffer(duration) {
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

export function playCrash() {
  if (!ctx) return;

  const now = ctx.currentTime;

  // Crunching noise
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.6);

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(2400, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(160, now + 0.5);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.5, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);

  noise.start(now);
  noise.stop(now + 0.6);

  // Low impact thump
  const thump = ctx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(120, now);
  thump.frequency.exponentialRampToValueAtTime(45, now + 0.35);

  const thumpGain = ctx.createGain();
  thumpGain.gain.setValueAtTime(0.45, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

  thump.connect(thumpGain);
  thumpGain.connect(masterGain);

  thump.start(now);
  thump.stop(now + 0.42);
}
