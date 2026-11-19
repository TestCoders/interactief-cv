// Pixel-art held (16×18 px per frame) als tekstrasters, zonder Phaser: gebruikt door heroSprites.js (game)
// en scripts/hero-preview.mjs (PNG-preview). Elke held krijgt kleding in de CV-kleur.
// "uiterlijk" in de CV-JSON kan twee dingen zijn:
//   - een string: een vast personage uit src/config/uiterlijk.js, bijvoorbeeld "martijn";
//   - een object met kenmerken (kapsel, haarkleur, huid, bril, baard), zie de skill foto-naar-pixelart.
// Zonder "uiterlijk" wisselt het kapsel per CV (kort, lang, pet).

import { UITERLIJKEN } from '../config/uiterlijk.js';

export const HERO_W = 16;
export const HERO_H = 18;

// Legenda: . leeg · K omlijning · H haar · C kleding · c kleding (schaduw)
//          S huid · s huid (schaduw) · L huid (glans) · g/G brilmontuur · b stoppels · P broek · B schoenen
//          T logo op de trui (blauw) · O logo (grijs)
// De ogen staan in elk kapsel op kolom 8 en 10 van rij 5–6 (de held kijkt naar rechts),
// zodat bril en baard als overlay over elk kapsel passen.
export const HAIRSTYLES = {
  kort: [
    '....KKKKKK......',
    '...KHHHHHHKK....',
    '..KHHHHHHHHHK...',
    '..KHHHHHHHHHK...',
    '..KHHSSSSSSSK...',
    '..KHSSSSKSKSK...',
    '..KHSSSSKSKSK...',
    '..KHsSSSSSSSK...',
    '...KSSSSSSSK....',
    '....KKKKKKK.....'
  ],
  lang: [
    '....KKKKKK......',
    '...KHHHHHHK.....',
    '..KHHHHHHHHK....',
    '.KHHHHHHHHHHK...',
    '.KHHHHHSSSSSK...',
    '.KHHHSSSKSKSK...',
    '.KHHHSSSKSKSK...',
    '.KHHHsSSSSSSK...',
    '.KHHKSSSSSSK....',
    '..KK.KKKKKK.....'
  ],
  // Pet in de CV-kleur.
  pet: [
    '....KKKKKK......',
    '...KCCCCCCK.....',
    '..KCCCCCCCCKKKK.',
    '..KCCCCCCCCCCCK.',
    '..KHHKKKKKKKKK..',
    '..KHSSSSKSKSK...',
    '..KHSSSSKSKSK...',
    '..KHsSSSSSSSK...',
    '...KSSSSSSSK....',
    '....KKKKKKK.....'
  ],
  kaal: [
    '................',
    '....KKKKKK......',
    '...KSSSSSSKK....',
    '..KSSSSSSSSSK...',
    '..KsSSSSSSSSK...',
    '..KsSSSSKSKSK...',
    '..KsSSSSKSKSK...',
    '..KssSSSSSSSK...',
    '...KSSSSSSSK....',
    '....KKKKKKK.....'
  ],
  // Kort haar met een lok over het voorhoofd.
  opzij: [
    '....KKKKKKK.....',
    '...KHHHHHHHK....',
    '..KHHHHHHHHHK...',
    '..KHHHHHHHHHHK..',
    '..KHHSSSSHHHK...',
    '..KHSSSSKSKSK...',
    '..KHSSSSKSKSK...',
    '..KHsSSSSSSSK...',
    '...KSSSSSSSK....',
    '....KKKKKKK.....'
  ],
  krullen: [
    '...KKK.KKK......',
    '..KHHHKHHHKK....',
    '.KHHHHHHHHHHK...',
    '.KHHHHHHHHHHHK..',
    '.KHHHHSSSSSSK...',
    '.KHHSSSSKSKSK...',
    '.KHHSSSSKSKSK...',
    '.KHHsSSSSSSSK...',
    '..KKKSSSSSSK....',
    '....KKKKKKK.....'
  ],
  // Paardenstaart aan de achterkant (links).
  staart: [
    '....KKKKKK......',
    '...KHHHHHHK.....',
    '..KHHHHHHHHK....',
    '.KKHHHHHHHHHK...',
    'KHKHHSSSSSSSK...',
    'KHKHSSSSKSKSK...',
    '.KHKSSSSKSKSK...',
    '..KHsSSSSSSSK...',
    '...KSSSSSSSK....',
    '....KKKKKKK.....'
  ]
};

const DEFAULT_HAIRSTYLES = ['kort', 'lang', 'pet'];
const DEFAULT_HAIR = ['#6b3e26', '#e8b84a', '#2f2219'];

// Overlays: [rij, kolom, teken]. Ze vervangen alleen huidpixels (S/s), zodat ze op elk kapsel passen.
const GLASSES = [5, 6].flatMap((r) => [7, 9, 11].map((c) => [r, c, 'G']));
export const BEARDS = {
  geen: [],
  stoppels: [[7, 7, 'b'], [7, 9, 'b'], [7, 11, 'b'], [8, 5, 'b'], [8, 6, 'b'], [8, 7, 'b'], [8, 8, 'b'], [8, 9, 'b'], [8, 10, 'b']],
  snor: [[7, 8, 'H'], [7, 9, 'H'], [7, 10, 'H'], [7, 11, 'H']],
  sik: [[8, 8, 'H'], [8, 9, 'H'], [8, 10, 'H']],
  // Bakkebaarden op rij 6, de rest onder de ogen.
  vol: [[6, 4, 'H'], [6, 5, 'H'], ...[7, 8].flatMap((r) => [3, 4, 5, 6, 7, 8, 9, 10, 11].map((c) => [r, c, 'H']))]
};

// Vaste personages: eigen hoofd, kleuren en eventueel een logo op de trui.
const FIXED_LOOKS = {
  martijn: {
    head: [
      '....KKKKKK......',
      '...KSLLSSSKK....',
      '..KSLSSSSSSSK...',
      '..KsSSSSSSSSK...',
      '..KsSSSSSSSSK...',
      '..KsSgggSgggK...',
      '..KsggKgggKgK...',
      '..KsSgggSgggK...',
      '...KSSSSSSSK....',
      '....KKKKKKK.....'
    ],
    // TC-logo op de borst (3 rijen, vanaf rij 10): T in het blauw, C in het grijs.
    logo: [
      '.....TTT.OO.....',
      '......T.O.......',
      '......T..OO.....'
    ],
    colors: { C: '#1e3a6e', c: '#16305c', P: '#8fb3d9', B: '#6b3f22', L: '#fbe3cc', g: '#6a7fa8', T: '#4aa3ff', O: '#b8bec9' },
    breathe: true // ademen: het bovenlijf zakt een pixel en komt weer omhoog
  }
};

const ARMS_DOWN = ['....KCCCCCCK....', '...KcCCCCCCCK...', '...KSCCCCCCSK...'];
const ARMS_SWING = ['....KCCCCCCK....', '...KcCCCCCCCK...', '..KSKCCCCCCKSK..'];
const HIPS = '...KKPPPPPPKK...';

const BODIES = {
  idle: [...ARMS_DOWN, HIPS, '....KPPPPPPK....', '....KPPKKPPK....', '....KBBKKBBK....', '....KKKKKKKK....'],
  runWide: [...ARMS_SWING, HIPS, '...KPPPKKPPPK...', '..KPPK....KPPK..', '.KBBK......KBBK.', '.KKK........KKK.'],
  runMid: [...ARMS_DOWN, HIPS, '...KPPPKKPPPK...', '...KPPK..KPPK...', '..KBBK....KBBK..', '..KKK......KKK..'],
  runPass: [...ARMS_DOWN, HIPS, '....KPPPPPPK....', '.....KPPPPK.....', '.....KBBBBK.....', '.....KKKKKK.....'],
  runPassSwing: [...ARMS_SWING, HIPS, '....KPPPPPPK....', '.....KPPPPK.....', '.....KBBBBK.....', '.....KKKKKK.....'],
  jump: [
    '.KSKCCCCCCCKSK..',
    '..KKcCCCCCCKK...',
    '...KCCCCCCCCK...',
    HIPS,
    '...KPPPKKPPPK...',
    '...KBBK..KPPK...',
    '....KK...KBBK...',
    '.........KKK....'
  ]
};

// [framenaam, lichaam, verschuiving van het hoofd in px]
const FRAMES = [
  ['idle0', 'idle', 0],
  ['idle1', 'idle', 1],
  ['run0', 'runWide', 1],
  ['run1', 'runPass', 0],
  ['run2', 'runMid', 1],
  ['run3', 'runPassSwing', 0],
  ['jump', 'jump', 0]
];

const BASE = { K: '#1b1f2e', S: '#f2c79b', s: '#e0a77a', P: '#3b4561', B: '#4f2f1d', G: '#8a96ab' };
const DEFAULT_CLOTHES = '#3c8772';
const AVATAR_HAIR = { brown: '#6b3e26', blond: '#e8b84a', black: '#2f2219', red: '#a6492c' };
const FRECKLES = [[7, 6, 'F'], [7, 8, 'F'], [7, 10, 'F']];

export function avatarClothes(cv) {
  return isHex(cv?.kleur) ? cv.kleur : cv?.avatar?.person === 'woman' ? '#80519b' : DEFAULT_CLOTHES;
}
const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');

export function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => Math.min(255, Math.round(((n >> shift) & 255) * factor));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/** Het vaste personage van een CV ("uiterlijk": "martijn"), of null. */
export const lookOf = (cv) => (typeof cv?.uiterlijk === 'string' && Object.hasOwn(UITERLIJKEN, cv.uiterlijk) ? cv.uiterlijk : null);

/** De kenmerken uit een foto ("uiterlijk": { kapsel, haarkleur, ... }), of null. */
export const featuresOf = (cv) => {
  if (cv?.avatar) {
    const { hair, color, face } = cv.avatar;
    return {
      kapsel: hair === 'long' ? 'lang' : 'kort',
      haarkleur: AVATAR_HAIR[color],
      bril: face === 'glasses',
      baard: face === 'beard' ? 'vol' : 'geen',
      freckles: face === 'freckles'
    };
  }
  const u = cv?.uiterlijk;
  return u && typeof u === 'object' && !Array.isArray(u) ? u : null;
};

/** Hoofd, kleuren en eventueel logo voor één held; `index` is de positie van het CV (voor de standaardvariant). */
function pixelLook(cv, index) {
  const fixed = FIXED_LOOKS[lookOf(cv)];
  if (fixed) return { head: fixed.head, colors: { ...BASE, ...fixed.colors }, logo: fixed.logo, breathe: fixed.breathe };

  const u = featuresOf(cv) ?? {};
  const clothes = avatarClothes(cv);
  const style = HAIRSTYLES[u.kapsel] ? u.kapsel : DEFAULT_HAIRSTYLES[index % DEFAULT_HAIRSTYLES.length];
  const hair = isHex(u.haarkleur) ? u.haarkleur : DEFAULT_HAIR[DEFAULT_HAIRSTYLES.indexOf(style)] ?? DEFAULT_HAIR[0];
  const skin = isHex(u.huid) ? u.huid : null;

  const head = HAIRSTYLES[style].map((row) => [...row]);
  for (const [r, c, ch] of [...(u.bril ? GLASSES : []), ...(BEARDS[u.baard] ?? []), ...(u.freckles ? FRECKLES : [])]) if ('Ss'.includes(head[r][c])) head[r][c] = ch;

  const colors = { ...BASE, H: hair, F: '#ac6746', C: clothes, c: shade(clothes, 0.72), b: mix(skin ?? BASE.S, hair, 0.55) };
  if (skin) Object.assign(colors, { S: skin, s: shade(skin, 0.88) });
  return { head: head.map((row) => row.join('')), colors };
}

/** Alle frames als rasters van 16×18 tekens, plus de kleurtabel. */
export function pixelHeroFrames(cv, index = 0) {
  const { head, colors, logo, breathe } = pixelLook(cv, index);
  const frames = FRAMES.map(([name, body, headY]) => {
    const grid = Array.from({ length: HERO_H }, () => Array(HERO_W).fill('.'));
    const stamp = (rows, oy) => rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && (grid[oy + y][x] = ch)));
    // Ademen: bij een personage met `breathe` zakt het bovenlijf (armen, trui, logo) mee; de benen blijven staan.
    const torsoDy = breathe && name === 'idle1' ? 1 : 0;
    stamp(BODIES[body].slice(3), 13);
    stamp(BODIES[body].slice(0, 3), 10 + torsoDy);
    if (logo) stamp(logo, 10 + torsoDy);
    stamp(head, headY);
    return { name, rows: grid.map((row) => row.join('')) };
  });
  return { frames, colors };
}

export function paintPixelFrame(ctx, rows, colors, offsetX = 0) {
  rows.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (!colors[pixel]) return;
    ctx.fillStyle = colors[pixel];
    ctx.fillRect(offsetX + x, y, 1, 1);
  }));
}

export function drawAvatarPreview(canvas, cv) {
  const ctx = canvas.getContext('2d');
  const { frames, colors } = pixelHeroFrames(cv);
  ctx.clearRect(0, 0, HERO_W, HERO_H);
  paintPixelFrame(ctx, frames[0].rows, colors);
}
