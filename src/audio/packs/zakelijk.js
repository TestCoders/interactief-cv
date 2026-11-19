import { tone, noise, noiseBuffer, mtof, repeat } from '../synth.js';

// Geluidspakket "zakelijk" (business isometric): opgewekte city pop met gesyncopeerde akkoorden, een funky bas,
// een sprankelend arpeggio en een marimba-melodie; daarnaast klikjes, het "klik-klak" van een koffertje en liftbelletjes.

const BARS = 8;
const LEN = BARS * 16;

// Fmaj7 – G6 – Em7 – Am7, twee keer (de tweede keer met een andere melodie).
const CHORDS = [
  { notes: [53, 57, 60, 64], root: 41 }, // Fmaj7
  { notes: [55, 59, 62, 64], root: 43 }, // G6
  { notes: [52, 55, 59, 62], root: 40 }, // Em7
  { notes: [57, 60, 64, 67], root: 45 } //  Am7
];

const keys = Array(LEN).fill(null);
const bass = Array(LEN).fill(null);
const arp = Array(LEN).fill(null);
for (let bar = 0; bar < BARS; bar++) {
  const c = CHORDS[bar % CHORDS.length];
  const at = (s) => bar * 16 + s;
  // Gesyncopeerde akkoordstoten.
  [[0, 3], [3, 2], [6, 3], [10, 2], [12, 3]].forEach(([s, len]) => (keys[at(s)] = { notes: c.notes, len }));
  // Funky bas: grondtoon, octaaf en kwint, kort aangeslagen.
  [[0, 0], [3, 0], [6, 12], [8, 0], [11, 7], [14, 12]].forEach(([s, iv]) => (bass[at(s)] = c.root + iv));
  // Arpeggio een octaaf hoger, op elke achtste.
  const up = [0, 1, 2, 3, 2, 1, 2, 3];
  up.forEach((i, k) => (arp[at(k * 2)] = c.notes[i] + 12));
}

// Marimba-melodie: 8 maten, stap → MIDI-noot.
const melody = Array(LEN).fill(null);
[
  { 0: 76, 3: 79, 6: 81, 10: 79, 12: 76 }, //        Fmaj7
  { 0: 74, 3: 76, 6: 79, 10: 74, 14: 71 }, //        G6
  { 0: 71, 3: 74, 6: 76, 8: 79, 12: 76 }, //         Em7
  { 0: 72, 4: 76, 8: 69 }, //                        Am7
  { 0: 76, 3: 79, 6: 81, 10: 79, 12: 76 }, //        Fmaj7
  { 0: 74, 3: 76, 6: 79, 10: 81, 12: 83 }, //        G6
  { 0: 84, 3: 83, 6: 79, 10: 76 }, //                Em7
  { 0: 81, 6: 76, 10: 72 } //                        Am7
].forEach((bar, b) => Object.entries(bar).forEach(([s, n]) => (melody[b * 16 + Number(s)] = n)));

// k = kick, c = handclap, h = hi-hat, o = open hi-hat
const drums = repeat(['k', 'h', 'o', 'h', 'c', 'h', 'k', 'h', 'k', 'h', 'o', 'h', 'c', 'h', 'o', 'h'], LEN);

const warm = { type: 'lowpass', freq: 2600 };

export default {
  name: 'zakelijk',
  label: 'Business isometric',

  music: {
    bpm: 104,
    length: LEN,
    swing: 0.08,
    voices: [
      {
        // Elektrische piano: driehoek + iets verstemde sinus.
        steps: keys,
        play: (ctx, out, t, { notes, len }, sd) => notes.forEach((n) => {
          tone(ctx, out, { type: 'triangle', freq: mtof(n), t, release: len * sd, vol: 0.03, attack: 0.008, filter: warm });
          tone(ctx, out, { type: 'sine', freq: mtof(n), t, release: len * sd, vol: 0.016, attack: 0.008, detune: 8 });
        })
      },
      {
        // Funky bas: kort en stevig.
        steps: bass,
        play: (ctx, out, t, n, sd) => {
          tone(ctx, out, { type: 'sine', freq: mtof(n), t, release: sd * 1.6, vol: 0.16, attack: 0.004 });
          tone(ctx, out, { type: 'triangle', freq: mtof(n), t, release: sd * 1.2, vol: 0.05, attack: 0.004, filter: { freq: 900 } });
        }
      },
      {
        // Sprankelend arpeggio op de achtergrond.
        steps: arp,
        play: (ctx, out, t, n) => tone(ctx, out, { type: 'sine', freq: mtof(n), t, release: 0.16, vol: 0.016, attack: 0.002 })
      },
      {
        // Marimba: grondtoon plus een korte, hoge tik.
        steps: melody,
        play: (ctx, out, t, n) => {
          tone(ctx, out, { type: 'sine', freq: mtof(n), t, release: 0.45, vol: 0.05, attack: 0.003 });
          tone(ctx, out, { type: 'sine', freq: mtof(n) * 4, t, release: 0.06, vol: 0.014, attack: 0.001 });
        }
      },
      {
        steps: drums,
        play: (ctx, out, t, d) => {
          if (d === 'k') tone(ctx, out, { type: 'sine', freq: 130, to: 45, t, dur: 0.16, vol: 0.28 });
          if (d === 'c') {
            noise(ctx, out, { t, dur: 0.05, vol: 0.05, type: 'bandpass', freq: 1400, q: 1.1 });
            noise(ctx, out, { t: t + 0.012, dur: 0.12, vol: 0.045, type: 'bandpass', freq: 1200, q: 0.9 });
          }
          if (d === 'h') noise(ctx, out, { t, dur: 0.025, vol: 0.014, type: 'highpass', freq: 8000 });
          if (d === 'o') noise(ctx, out, { t, dur: 0.11, vol: 0.02, type: 'highpass', freq: 7000 });
        }
      }
    ]
  },

  /** Zacht stadsgeroezemoes onder de muziek. Geeft een stopfunctie terug. */
  ambience(ctx, out) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 2);
    src.connect(filter).connect(gain).connect(out);
    src.start();
    return () => {
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2);
      src.stop(ctx.currentTime + 1);
    };
  },

  sfx: {
    // Springen: zachte "woep".
    jump: (ctx, out, t) => tone(ctx, out, { type: 'sine', freq: 300, to: 560, t, dur: 0.16, vol: 0.09, filter: { freq: 2000 } }),
    // Landen: gedempte plof.
    land: (ctx, out, t) => {
      tone(ctx, out, { type: 'sine', freq: 150, to: 70, t, dur: 0.12, vol: 0.13 });
      noise(ctx, out, { t, dur: 0.06, vol: 0.04, freq: 500 });
    },
    // Een cv-onderdeel komt tot leven: notificatie "ta-dum".
    enter: (ctx, out, t) => {
      tone(ctx, out, { type: 'sine', freq: mtof(79), t, release: 0.5, vol: 0.06 });
      tone(ctx, out, { type: 'sine', freq: mtof(86), t: t + 0.09, release: 0.6, vol: 0.05 });
    },
    // Koffertje open: klik-klak van de sloten, deksel open, gouden sterretjes.
    bonus: (ctx, out, t) => {
      noise(ctx, out, { t, dur: 0.015, vol: 0.18, type: 'highpass', freq: 3000 });
      noise(ctx, out, { t: t + 0.08, dur: 0.015, vol: 0.18, type: 'highpass', freq: 3000 });
      noise(ctx, out, { t: t + 0.12, dur: 0.35, vol: 0.03, type: 'bandpass', freq: 600, to: 1500 });
      [88, 91, 96].forEach((n, i) => tone(ctx, out, { type: 'sine', freq: mtof(n), t: t + 0.16 + i * 0.08, release: 0.5 + i * 0.1, vol: 0.045 }));
    },
    // Snelreis: de lift omlaag en weer omhoog, met belletje bij aankomst.
    travelIn: (ctx, out, t) => noise(ctx, out, { t, dur: 0.4, vol: 0.06, type: 'bandpass', freq: 1600, to: 300, q: 1.5 }),
    travelOut: (ctx, out, t) => {
      noise(ctx, out, { t, dur: 0.3, vol: 0.05, type: 'bandpass', freq: 300, to: 1600, q: 1.5 });
      tone(ctx, out, { type: 'sine', freq: mtof(88), t: t + 0.25, release: 1, vol: 0.06 });
      tone(ctx, out, { type: 'sine', freq: mtof(88) * 2.01, t: t + 0.25, release: 0.4, vol: 0.015 });
    },
    // Finish: warm akkoord met een belletje erbovenop.
    finish: (ctx, out, t) => {
      [60, 64, 67, 71, 74].forEach((n) => tone(ctx, out, { type: 'triangle', freq: mtof(n), t, attack: 0.25, release: 2, vol: 0.03, filter: warm }));
      tone(ctx, out, { type: 'sine', freq: mtof(84), t: t + 0.3, release: 1.2, vol: 0.05 });
    },
    // Selectiescherm.
    select: (ctx, out, t) => tone(ctx, out, { type: 'sine', freq: 1400, t, dur: 0.03, vol: 0.04 }),
    confirm: (ctx, out, t) => {
      tone(ctx, out, { type: 'sine', freq: 660, t, release: 0.12, vol: 0.06 });
      tone(ctx, out, { type: 'sine', freq: 990, t: t + 0.08, release: 0.3, vol: 0.06 });
    }
  }
};
