import { tone, noise, pulseWave, mtof, eighths, repeat } from '../synth.js';

// Geluidspakket "retro": 8-bit chiptune met pulsgolven, een driehoeksgolf als bas en ruis als drums.

const lead = eighths([
  76, 79, 84, 79, 76, null, 74, 76, //   C
  72, 76, 81, 76, 72, null, 71, 72, //   Am
  69, 72, 77, 72, 81, 79, 77, 76, //     F
  74, null, 79, null, 71, 74, 67, null // G
]);
const bass = eighths([
  ...repeat([36, 48], 8),
  ...repeat([33, 45], 8),
  ...repeat([29, 41], 8),
  ...repeat([31, 43], 8)
]);
const drums = repeat(['k', null, 'h', null, 's', null, 'h', null, 'k', null, 'h', 'k', 's', null, 'h', null], 64);

export default {
  name: 'retro',
  label: 'Retro pixel-art',

  music: {
    bpm: 132,
    length: 64,
    voices: [
      { steps: lead, play: (ctx, out, t, n, sd) => tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(n), t, dur: sd * 1.8, vol: 0.05 }) },
      { steps: bass, play: (ctx, out, t, n, sd) => tone(ctx, out, { type: 'triangle', freq: mtof(n), t, dur: sd * 1.8, vol: 0.12 }) },
      {
        steps: drums,
        play: (ctx, out, t, d) => {
          if (d === 'k') tone(ctx, out, { type: 'triangle', freq: 150, to: 45, t, dur: 0.12, vol: 0.22 });
          if (d === 's') noise(ctx, out, { t, dur: 0.08, vol: 0.06, type: 'highpass', freq: 1500 });
          if (d === 'h') noise(ctx, out, { t, dur: 0.03, vol: 0.03, type: 'highpass', freq: 7000 });
        }
      }
    ]
  },

  sfx: {
    // Springen: snel stijgende piep.
    jump: (ctx, out, t) => tone(ctx, out, { wave: pulseWave(ctx, 0.5), freq: 280, to: 640, t, dur: 0.14, vol: 0.08 }),
    // Landen: korte plof.
    land: (ctx, out, t) => {
      noise(ctx, out, { t, dur: 0.07, vol: 0.1, freq: 900 });
      tone(ctx, out, { type: 'triangle', freq: 140, to: 60, t, dur: 0.08, vol: 0.14 });
    },
    // Een cv-onderdeel komt tot leven: tweetonig "pling".
    enter: (ctx, out, t) => {
      tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(76), t, dur: 0.06, vol: 0.06 });
      tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(83), t: t + 0.07, dur: 0.14, vol: 0.06 });
    },
    // Cadeautje open: ritselend inpakpapier, een vrolijk arpeggio omhoog (G-B-D-G) en een zachte echo.
    bonus: (ctx, out, t) => {
      noise(ctx, out, { t, dur: 0.12, vol: 0.05, type: 'bandpass', freq: 1800, to: 6000, q: 1.2 });
      const notes = [79, 83, 86, 91];
      notes.forEach((n, i) => tone(ctx, out, { wave: pulseWave(ctx, 0.125), freq: mtof(n), t: t + 0.06 + i * 0.055, dur: 0.09, vol: 0.05 }));
      notes.forEach((n, i) => tone(ctx, out, { type: 'triangle', freq: mtof(n + 12), t: t + 0.32 + i * 0.055, dur: 0.08, vol: 0.025 }));
      tone(ctx, out, { type: 'triangle', freq: mtof(91), t: t + 0.32, release: 0.5, vol: 0.03 });
    },
    // De pipeline in en uit.
    travelIn: (ctx, out, t) => tone(ctx, out, { wave: pulseWave(ctx, 0.5), freq: 620, to: 140, t, dur: 0.35, vol: 0.06 }),
    travelOut: (ctx, out, t) => tone(ctx, out, { wave: pulseWave(ctx, 0.5), freq: 140, to: 620, t, dur: 0.25, vol: 0.06 }),
    // Finish: fanfare.
    finish: (ctx, out, t) => {
      [72, 76, 79, 84].forEach((n, i) => tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(n), t: t + i * 0.1, dur: 0.1, vol: 0.06 }));
      [76, 79, 84].forEach((n) => tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(n), t: t + 0.42, dur: 0.7, vol: 0.04 }));
      tone(ctx, out, { type: 'triangle', freq: mtof(48), t: t + 0.42, dur: 0.7, vol: 0.12 });
    },
    // Selectiescherm.
    select: (ctx, out, t) => tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: 880, t, dur: 0.04, vol: 0.05 }),
    confirm: (ctx, out, t) => {
      tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(72), t, dur: 0.06, vol: 0.06 });
      tone(ctx, out, { wave: pulseWave(ctx, 0.25), freq: mtof(84), t: t + 0.07, dur: 0.16, vol: 0.06 });
    }
  }
};
