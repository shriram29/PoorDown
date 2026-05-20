// Synthesized game sounds via the Web Audio API — no audio assets to host.
// All sounds are generated on the fly; a single shared AudioContext is created
// lazily on first playback (after a user gesture, per browser autoplay rules).

let ctx = null;
let master = null;
let muted = false;

if (typeof window !== 'undefined') {
  muted = localStorage.getItem('poordown_muted') === 'true';
}

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  if (typeof window !== 'undefined') localStorage.setItem('poordown_muted', String(value));
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

function tone(c, { freq, start = 0, dur, type = 'sine', gain = 0.2, slideTo }) {
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noiseBurst(c, { dur = 0.12, freq = 2200, q = 0.8, gain = 0.5 }) {
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(bp);
  bp.connect(g);
  g.connect(master);
  src.start();
}

// A card was drawn / placed — soft "fwip"
export function playDraw() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  noiseBurst(c, { dur: 0.11, freq: 2400, q: 0.7, gain: 0.45 });
}

// It's your turn — gentle rising two-note chime
export function playYourTurn() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  tone(c, { freq: 784, dur: 0.16, type: 'sine', gain: 0.22 });        // G5
  tone(c, { freq: 1175, start: 0.12, dur: 0.28, type: 'sine', gain: 0.22 }); // D6
}

// A player busted — descending buzz
export function playBust() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  tone(c, { freq: 320, dur: 0.38, type: 'sawtooth', gain: 0.18, slideTo: 90 });
  tone(c, { freq: 160, dur: 0.42, type: 'square', gain: 0.1, slideTo: 70 });
}

// Round start — bright rising arpeggio
export function playRoundStart() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  [523, 659, 784, 1047].forEach((f, i) => // C5 E5 G5 C6
    tone(c, { freq: f, start: i * 0.09, dur: 0.22, type: 'triangle', gain: 0.2 })
  );
}

// Round end — resolving little jingle
export function playRoundEnd() {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  tone(c, { freq: 784, dur: 0.18, type: 'triangle', gain: 0.2 });        // G5
  tone(c, { freq: 659, start: 0.14, dur: 0.18, type: 'triangle', gain: 0.2 }); // E5
  tone(c, { freq: 523, start: 0.28, dur: 0.4, type: 'triangle', gain: 0.22 }); // C5
}
