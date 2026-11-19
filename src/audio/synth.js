// Bouwstenen voor geluid met de Web Audio API. Alles wordt live gesynthetiseerd: geen geluidsbestanden, geen licenties.

export const mtof = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Eén toon met een eigen volume-envelop, optioneel met toonhoogte-glijder en filter. */
export function tone(ctx, out, { type = 'square', wave, freq, to, t = ctx.currentTime, dur = 0.1, vol = 0.2, attack = 0.005, release, filter, detune = 0 }) {
  const osc = ctx.createOscillator();
  if (wave) osc.setPeriodicWave(wave);
  else osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  osc.detune.value = detune;

  const rel = release ?? dur;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + rel);

  let node = osc;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = filter.type ?? 'lowpass';
    f.frequency.value = filter.freq;
    f.Q.value = filter.q ?? 0.7;
    osc.connect(f);
    node = f;
  }
  node.connect(gain).connect(out);
  osc.start(t);
  osc.stop(t + attack + rel + 0.05);
}

let noiseBuf = null;
/** Eén seconde witte ruis, gedeeld door alle ruisgeluiden. */
export function noiseBuffer(ctx) {
  if (noiseBuf?.sampleRate === ctx.sampleRate) return noiseBuf;
  const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
  return buf;
}

/** Gefilterde ruis: hi-hats, stof, klikjes en wind. */
export function noise(ctx, out, { t = ctx.currentTime, dur = 0.1, vol = 0.2, attack = 0.002, type = 'lowpass', freq = 2000, to, q = 0.7 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(gain).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const waves = new WeakMap();
/** Pulsgolf met instelbare pulsbreedte: het typische geluid van 8-bit spelcomputers. */
export function pulseWave(ctx, duty = 0.25) {
  let cache = waves.get(ctx);
  if (!cache) waves.set(ctx, (cache = {}));
  if (cache[duty]) return cache[duty];
  const n = 32;
  const real = new Float32Array(n);
  const imag = new Float32Array(n);
  for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
  cache[duty] = ctx.createPeriodicWave(real, imag);
  return cache[duty];
}

/** Zet een lijst achtste noten om naar 16e-stappen (noot op elke even stap). */
export const eighths = (notes) => notes.flatMap((n) => [n, null]);

/** Herhaal een patroon tot de gewenste lengte. */
export const repeat = (steps, length) => Array.from({ length }, (_, i) => steps[i % steps.length]);
