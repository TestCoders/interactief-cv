// Eigen pixel-art helden (16×18 px per frame), getekend met code: geen externe assets nodig.
// Elke CV krijgt een held met kleding in de CV-kleur; het kapsel wisselt per CV (kort, lang, pet).
// Frames per held: idle0, idle1, run0–run3, jump. Animaties: <key>-idle, <key>-run, <key>-jump.

export const HERO_W = 16;
export const HERO_H = 18;

// Legenda: . leeg · K omlijning · H haar · C kleding · c kleding (schaduw)
//          S huid · s huid (schaduw) · P broek · B schoenen
const HEADS = [
  // 0: kort haar
  [
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
  // 1: lang haar
  [
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
  // 2: pet in de CV-kleur
  [
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
  ]
];

const HAIR = ['#6b3e26', '#e8b84a', '#2f2219'];

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

const BASE = { K: '#1b1f2e', S: '#f2c79b', s: '#e0a77a', P: '#3b4561', B: '#4f2f1d' };

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift) => Math.round(((n >> shift) & 255) * factor);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function paint(ctx, rows, colors, ox, oy) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = colors[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x, oy + y, 1, 1);
    });
  });
}

export const heroKey = (cv) => `hero-${cv.id}`;

/** Genereert per CV een spritesheet-texture plus de animaties. Aanroepen vanuit BootScene. */
export function createHeroTextures(scene, cvs) {
  cvs.forEach((cv, i) => {
    const key = heroKey(cv);
    if (scene.textures.exists(key)) return;

    const variant = i % HEADS.length;
    const kleur = /^#[0-9a-f]{6}$/i.test(cv.kleur ?? '') ? cv.kleur : '#3c8772';
    const colors = { ...BASE, H: HAIR[variant], C: kleur, c: shade(kleur, 0.72) };

    const tex = scene.textures.createCanvas(key, HERO_W * FRAMES.length, HERO_H);
    const ctx = tex.getContext();
    FRAMES.forEach(([name, body, headY], f) => {
      const ox = f * HERO_W;
      paint(ctx, BODIES[body], colors, ox, 10);
      paint(ctx, HEADS[variant], colors, ox, headY);
      tex.add(name, 0, ox, 0, HERO_W, HERO_H);
    });
    tex.refresh();

    const frames = (names) => names.map((frame) => ({ key, frame }));
    scene.anims.create({ key: `${key}-idle`, frames: frames(['idle0', 'idle1']), frameRate: 2, repeat: -1 });
    scene.anims.create({ key: `${key}-run`, frames: frames(['run0', 'run1', 'run2', 'run3']), frameRate: 10, repeat: -1 });
    scene.anims.create({ key: `${key}-jump`, frames: frames(['jump']), frameRate: 1 });
  });
}
