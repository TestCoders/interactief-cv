// Kleine stap-sequencer voor de achtergrondmuziek. Noten worden een fractie van een seconde vooruit
// ingepland op de klok van de AudioContext, zodat de muziek strak blijft, ook als de game even hapert.

const LOOKAHEAD = 0.15; // s vooruit inplannen
const TICK_MS = 25;

/**
 * song: { bpm, length (aantal 16e-stappen), swing (0–0.5), voices: [{ steps: [...], play(ctx, out, t, event, stepDur) }] }
 * Een stap is null (rust) of een event dat de voice zelf begrijpt (bijv. een MIDI-noot).
 */
export function createLoop(ctx, out, song) {
  const stepDur = 60 / song.bpm / 4;
  let step = 0;
  let next = 0;
  let timer = null;

  const tick = () => {
    // Na een hapering (bijv. tab op de achtergrond) niet alle gemiste noten tegelijk afspelen.
    if (next < ctx.currentTime - 0.05) next = ctx.currentTime + 0.05;
    while (next < ctx.currentTime + LOOKAHEAD) {
      const swing = step % 4 === 2 ? (song.swing ?? 0) * stepDur : 0;
      for (const voice of song.voices) {
        const event = voice.steps[step % voice.steps.length];
        if (event !== null && event !== undefined) voice.play(ctx, out, next + swing, event, stepDur);
      }
      next += stepDur;
      step = (step + 1) % song.length;
    }
  };

  return {
    start() {
      if (timer) return;
      step = 0;
      next = ctx.currentTime + 0.1;
      tick();
      timer = setInterval(tick, TICK_MS);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    }
  };
}
