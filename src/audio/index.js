import retro from './packs/retro.js';
import zakelijk from './packs/zakelijk.js';
import { createLoop } from './sequencer.js';

// Geluid voor de game: één geluidspakket per game-stijl (het thema kiest het via `theme.audio`).
// Browsers spelen pas geluid af na een klik of toets; daarom wacht alles op unlock().

export const PACKS = { retro, zakelijk };
const STORE_KEY = 'tc-geluid';
const MASTER = 0.9;

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let loop = null;
let stopAmbience = null;
let pack = retro;
let unlocked = false;
let wantMusic = false;
let muted = readMuted();
const lastPlayed = {};

function readMuted() {
  try {
    return localStorage.getItem(STORE_KEY) === 'uit';
  } catch {
    return false;
  }
}

function saveMuted() {
  try {
    localStorage.setItem(STORE_KEY, muted ? 'uit' : 'aan');
  } catch {
    // Geen opslag beschikbaar (privévenster e.d.): de keuze geldt dan alleen voor deze sessie.
  }
}

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER;
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.55;
  sfxBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend();
    else if (!muted && unlocked) ctx.resume();
  });
  return ctx;
}

function startMusic() {
  if (!ctx || !unlocked || loop) return;
  loop = createLoop(ctx, musicBus, pack.music);
  loop.start();
  stopAmbience = pack.ambience?.(ctx, musicBus) ?? null;
}

function stopMusic() {
  loop?.stop();
  loop = null;
  stopAmbience?.();
  stopAmbience = null;
}

export const audio = {
  /** Aanroepen vanuit een klik of toets: pas dan mag de browser geluid afspelen. */
  unlock() {
    if (!ensureContext()) return;
    unlocked = true;
    if (!muted && ctx.state !== 'running') ctx.resume();
    if (wantMusic) startMusic();
  },

  /** Kies het geluidspakket van een game-stijl ('retro', 'zakelijk'). Lopende muziek wisselt mee. */
  setPack(name) {
    const next = PACKS[name] ?? retro;
    if (next === pack) return;
    pack = next;
    if (loop) {
      stopMusic();
      startMusic();
    }
  },

  /** Speel een geluidseffect af: jump, land, enter, bonus, travelIn, travelOut, finish, select, confirm. */
  play(name) {
    if (!ctx || !unlocked || muted) return;
    if (ctx.state === 'suspended') ctx.resume();
    // Hetzelfde geluid niet opstapelen als meerdere dingen tegelijk gebeuren.
    const now = ctx.currentTime;
    if (now - (lastPlayed[name] ?? -1) < 0.08) return;
    lastPlayed[name] = now;
    pack.sfx[name]?.(ctx, sfxBus, now);
  },

  /** Achtergrondmuziek aan of uit (start pas na unlock). */
  music(on) {
    wantMusic = on;
    if (on) startMusic();
    else stopMusic();
  },

  isMuted: () => muted,

  /** Geluid dempen of weer aanzetten; de keuze wordt onthouden tenzij save false is. */
  setMuted(value, { save = true } = {}) {
    muted = value;
    if (save) saveMuted();
    if (!ensureContext()) return;
    master.gain.setTargetAtTime(muted ? 0 : MASTER, ctx.currentTime, 0.05);
    if (!muted && unlocked) ctx.resume();
  },

  /** Tijdelijk stil (bijv. bij het klassieke cv) en weer verder. */
  pause() {
    ctx?.suspend();
  },
  resume() {
    if (ctx && unlocked && !muted) ctx.resume();
  }
};
