import { GAME } from './gameConfig.js';

export const BASE_H = GAME.height; // wereldhoogte; de camera zoomt dit op naar de schermhoogte (scherp, geen opgerekt canvas)
export const GROUND_H = 64;
export const START_X = 360;
export const PIECE_GAP = 200; // lucht tussen twee set pieces
export const BONUS_GAP = 150; // extra ruimte vóór een set piece met een cadeautje

// --- Voortgang: scrollen, swipen en pijltjes zijn één en hetzelfde ("verder in het CV") ---
export const SCROLL_FACTOR = 1.2; // px lopen per px scroll
export const KEY_RATE = 420; // px "scroll" per seconde zolang je een pijltje vasthoudt
export const INTENT_MAX = 240; // max opgespaarde loopafstand: stop je met scrollen, dan sta je binnen ~1 s stil
export const STOP_SNAP = 260; // binnen deze afstand van een halteplaats glijdt de held er vanzelf naartoe
export const IDLE_BEFORE_SNAP = 140; // ms zonder input voordat de held naar de halteplaats glijdt
export const TRAVEL_MS = 750; // snelreis door de pipeline

// --- Dag → avond: de dag verloopt met de loopbaan mee ---
export const SKY = { dag: 0x9fd6ff, middag: 0xbfe0f0, zonsondergang: 0xff9e7a, avond: 0x2b2147 };
export const TINT = { dag: 0xffffff, zonsondergang: 0xffc6a8, avond: 0x5a4f8a };

export const CHAPTERS = [
  { type: 'profile', label: 'Profiel' },
  { type: 'expertise', label: 'Expertise' },
  { type: 'skills', label: 'Vaardigheden' },
  { type: 'education', label: 'Opleiding' },
  { type: 'work', label: 'Ervaring' },
  { type: 'finale', label: 'Na het werk' },
  { type: 'finish', label: 'Contact' }
];
