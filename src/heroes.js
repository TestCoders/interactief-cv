// Eigen pixel-art helden (16×18 px per frame), getekend met code: geen externe assets nodig.
// Elke CV krijgt een held met kleding in de CV-kleur. Het optionele veld `uiterlijk` in de CV-JSON
// bepaalt kapsel, haarkleur, huidskleur, bril en baard (zie .claude/skills/foto-naar-pixelart).
// Zonder `uiterlijk` wisselt het kapsel per CV (kort, lang, pet).
// Frames per held: idle0, idle1, run0–run3, jump. Animaties: <key>-idle, <key>-run, <key>-jump.
// Dit bestand importeert geen Phaser, zodat scripts/hero-preview.mjs het ook kan gebruiken.

export const HERO_W = 16;
export const HERO_H = 18;

// Legenda: . leeg · K omlijning · H haar · C kleding · c kleding (schaduw)
//          S huid · s huid (schaduw) · P broek · B schoenen · G brilmontuur · b stoppels
// De ogen staan in elk hoofd op kolom 8 en 10 van rij 5–6 (de held kijkt naar rechts),
// zodat bril en baard als overlay over elk kapsel passen.
export const KAPSELS = {
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
  // Kort opzij: kort haar met een lok over het voorhoofd.
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

const STANDAARD_KAPSELS = ['kort', 'lang', 'pet'];
const STANDAARD_HAAR = ['#6b3e26', '#e8b84a', '#2f2219'];

// Overlays: [rij, kolom, teken]. Ze vervangen alleen huidpixels (S/s), zodat ze op elk kapsel passen.
const BRIL = [5, 6].flatMap((r) => [7, 9, 11].map((c) => [r, c, 'G']));
export const BAARDEN = {
  geen: [],
  stoppels: [[7, 7, 'b'], [7, 9, 'b'], [7, 11, 'b'], [8, 5, 'b'], [8, 6, 'b'], [8, 7, 'b'], [8, 8, 'b'], [8, 9, 'b'], [8, 10, 'b']],
  snor: [[7, 8, 'H'], [7, 9, 'H'], [7, 10, 'H'], [7, 11, 'H']],
  sik: [[8, 8, 'H'], [8, 9, 'H'], [8, 10, 'H']],
  // Bakkebaarden op rij 6, de rest onder de ogen.
  vol: [[6, 4, 'H'], [6, 5, 'H'], ...[7, 8].flatMap((r) => [3, 4, 5, 6, 7, 8, 9, 10, 11].map((c) => [r, c, 'H']))]
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

const BASE = { K: '#1b1f2e', S: '#f2c79b', P: '#3b4561', B: '#4f2f1d', G: '#8a96ab' };
const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => Math.min(255, Math.round(((n >> shift) & 255) * factor));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/** Kapsel-raster plus kleuren voor één held; `index` is de positie van het CV (voor de standaardvariant). */
export function heroLook(cv, index = 0) {
  const u = cv.uiterlijk ?? {};
  const kapsel = KAPSELS[u.kapsel] ? u.kapsel : STANDAARD_KAPSELS[index % STANDAARD_KAPSELS.length];
  const haar = isHex(u.haarkleur) ? u.haarkleur : STANDAARD_HAAR[STANDAARD_KAPSELS.indexOf(kapsel)] ?? STANDAARD_HAAR[0];
  const huid = isHex(u.huid) ? u.huid : BASE.S;
  const kleur = isHex(cv.kleur) ? cv.kleur : '#3c8772';

  const head = KAPSELS[kapsel].map((row) => [...row]);
  const overlays = [...(u.bril ? BRIL : []), ...(BAARDEN[u.baard] ?? [])];
  for (const [r, c, ch] of overlays) if ('Ss'.includes(head[r][c])) head[r][c] = ch;

  const colors = { ...BASE, H: haar, S: huid, s: shade(huid, 0.88), b: mix(huid, haar, 0.55), C: kleur, c: shade(kleur, 0.72) };
  return { head: head.map((row) => row.join('')), colors };
}

/** Alle frames als rasters van 16×18 tekens, plus de kleurtabel. */
export function heroFrames(cv, index = 0) {
  const { head, colors } = heroLook(cv, index);
  const frames = FRAMES.map(([name, body, headY]) => {
    const grid = Array.from({ length: HERO_H }, () => Array(HERO_W).fill('.'));
    const stamp = (rows, oy) => rows.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && (grid[oy + y][x] = ch)));
    stamp(BODIES[body], 10);
    stamp(head, headY);
    return { name, rows: grid.map((row) => row.join('')) };
  });
  return { frames, colors };
}

export const heroKey = (cv) => `hero-${cv.id}`;

/** Genereert per CV een spritesheet-texture plus de animaties. Aanroepen vanuit BootScene. */
export function createHeroTextures(scene, cvs) {
  cvs.forEach((cv, i) => {
    const key = heroKey(cv);
    if (scene.textures.exists(key)) return;

    const { frames: heroFramesList, colors } = heroFrames(cv, i);
    const tex = scene.textures.createCanvas(key, HERO_W * heroFramesList.length, HERO_H);
    const ctx = tex.getContext();
    heroFramesList.forEach(({ name, rows }, f) => {
      const ox = f * HERO_W;
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (!colors[ch]) return;
        ctx.fillStyle = colors[ch];
        ctx.fillRect(ox + x, y, 1, 1);
      }));
      tex.add(name, 0, ox, 0, HERO_W, HERO_H);
    });
    tex.refresh();

    const frames = (names) => names.map((frame) => ({ key, frame }));
    scene.anims.create({ key: `${key}-idle`, frames: frames(['idle0', 'idle1']), frameRate: 2, repeat: -1 });
    scene.anims.create({ key: `${key}-run`, frames: frames(['run0', 'run1', 'run2', 'run3']), frameRate: 10, repeat: -1 });
    scene.anims.create({ key: `${key}-jump`, frames: frames(['jump']), frameRate: 1 });
  });
}
