import Phaser from 'phaser';
import { UITERLIJKEN } from './uiterlijk.js';

// Eigen pixel-art helden (16×18 px per frame), getekend met code: geen externe assets nodig.
// Elke CV krijgt een held met kleding in de CV-kleur; het kapsel wisselt per CV (kort, lang, pet).
// Met "uiterlijk" in het CV kies je een vast personage (zie src/uiterlijk.js), bijvoorbeeld "martijn".
// Frames per held: idle0, idle1, run0–run3, jump. Animaties: <key>-idle, <key>-run, <key>-jump.

export const HERO_W = 16;
export const HERO_H = 18;

// Legenda: . leeg · K omlijning · H haar · C kleding · c kleding (schaduw)
//          S huid · s huid (schaduw) · L huid (glans) · g brilmontuur · P broek · B schoenen
//          T, G logo op de trui (T blauw, C grijs)
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

// Vaste personages (pixel-held): eigen hoofd, kleuren en eventueel een logo op de trui.
const PIXEL_LOOKS = {
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
      '.....TTT.GG.....',
      '......T.G.......',
      '......T..GG.....'
    ],
    colors: { C: '#1e3a6e', c: '#16305c', P: '#8fb3d9', B: '#6b3f22', L: '#fbe3cc', g: '#6a7fa8', T: '#4aa3ff', G: '#b8bec9' },
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

/** Het vaste uiterlijk van een CV ("uiterlijk" in de JSON), of null. */
export const lookOf = (cv) => (cv?.uiterlijk && UITERLIJKEN[cv.uiterlijk] ? cv.uiterlijk : null);

function addAnims(scene, key) {
  if (scene.anims.exists(`${key}-idle`)) return;
  const frames = (names) => names.map((frame) => ({ key, frame }));
  scene.anims.create({ key: `${key}-idle`, frames: frames(['idle0', 'idle1']), frameRate: 2, repeat: -1 });
  scene.anims.create({ key: `${key}-run`, frames: frames(['run0', 'run1', 'run2', 'run3']), frameRate: 10, repeat: -1 });
  scene.anims.create({ key: `${key}-jump`, frames: frames(['jump']), frameRate: 1 });
}

/** Genereert per CV een spritesheet-texture plus de animaties. Aanroepen vanuit BootScene. */
export function createHeroTextures(scene, cvs) {
  cvs.forEach((cv, i) => {
    const key = heroKey(cv);
    if (scene.textures.exists(key)) return;

    const look = PIXEL_LOOKS[lookOf(cv)];
    const variant = i % HEADS.length;
    const kleur = /^#[0-9a-f]{6}$/i.test(cv.kleur ?? '') ? cv.kleur : '#3c8772';
    const colors = look ? { ...BASE, ...look.colors } : { ...BASE, H: HAIR[variant], C: kleur, c: shade(kleur, 0.72) };
    const head = look?.head ?? HEADS[variant];

    const tex = scene.textures.createCanvas(key, HERO_W * FRAMES.length, HERO_H);
    const ctx = tex.getContext();
    FRAMES.forEach(([name, body, headY], f) => {
      const ox = f * HERO_W;
      // Ademen: bij een personage met `breathe` zakt het hele bovenlijf (hoofd, armen, trui) mee; de benen blijven staan.
      const torsoDy = look?.breathe && name === 'idle1' ? 1 : 0;
      paint(ctx, BODIES[body].slice(3), colors, ox, 13);
      paint(ctx, BODIES[body].slice(0, 3), colors, ox, 10 + torsoDy);
      if (look?.logo) paint(ctx, look.logo, colors, ox, 10 + torsoDy);
      paint(ctx, head, colors, ox, headY);
      tex.add(name, 0, ox, 0, HERO_W, HERO_H);
    });
    tex.refresh();
    addAnims(scene, key);
  });
}

// ---------- Kantoorheld (business isometric, design/strak-zakelijk) ----------
// Vectorfiguur op een raster van 24×56, getekend op OFFICE_RES× resolutie. Pak, overhemd en stropdas in de CV-kleur;
// kapsel per CV: kort, lang, of kuif met bril. Vaste personages (zoals Martijn) hebben hun eigen kleding.
export const OFFICE_W = 24;
export const OFFICE_H = 56;
const OFFICE_RES = 4;
const OFFICE_HAIR = ['#3a2a20', '#d9a441', '#2a2019'];
const SKIN = '#f1c8a0';
const SKIN_SHADE = '#e3b48e';

const PAK = {
  kleding: 'pak', body: '#1d3349', backArm: '#132536', frontArm: '#24405c',
  legBack: '#132536', legFront: '#1d3349', shoeBack: '#3a2418', shoeFront: '#5a3420', breath: 1
};
const OFFICE_LOOKS = {
  martijn: {
    kleding: 'trui', body: '#1e3a6e', backArm: '#16305c', frontArm: '#24467f', boord: '#16305c',
    legBack: '#7d9fc6', legFront: '#8fb3d9', shoeBack: '#5a3420', shoeFront: '#6b3f22',
    kaal: true, bril: true, logo: true, breath: 1.6
  }
};

// Houdingen: graden voor achterarm, voorarm, achterbeen, voorbeen; dy = op-en-neer van het bovenlijf.
const OFFICE_POSES = [
  ['idle0', 0, 0, 0, 0, 0],
  ['idle1', 0, 0, 0, 0, 0.4],
  ['run0', 30, -30, 28, -28, 0],
  ['run1', 0, 0, 0, 0, -0.6],
  ['run2', -30, 30, -28, 28, 0],
  ['run3', 0, 0, 0, 0, -0.6],
  ['jump', 40, -150, 40, -10, 0]
];

function drawOfficeWorker(ctx, look, [name, backArm, frontArm, backLeg, frontLeg, poseDy]) {
  // Ademen: bij idle telt de adem-factor van het personage mee.
  const dy = name.startsWith('idle') ? poseDy * look.breath : poseDy;
  const rot = (deg, cx, cy, draw) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    draw();
    ctx.restore();
  };
  const box = (x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
  const dot = (cx, cy, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); };
  const path = (d, fill) => { ctx.fillStyle = fill; ctx.fill(new Path2D(d)); };

  rot(backArm, 8, 20 + dy, () => { box(6, 19 + dy, 4, 15, 2, look.backArm); dot(8, 34.5 + dy, 1.9, SKIN_SHADE); });
  rot(backLeg, 10.8, 35, () => { box(8.6, 34, 4.4, 17, 2, look.legBack); box(7.8, 50, 6.4, 3.2, 1.6, look.shoeBack); });
  rot(frontLeg, 14.2, 35, () => { box(12, 34, 4.4, 17, 2, look.legFront); box(11.6, 50, 7.6, 3.2, 1.6, look.shoeFront); });

  ctx.save();
  ctx.translate(0, dy);
  box(11, 14, 3.6, 4.5, 0, SKIN_SHADE);
  path('M7 21Q7 17.5 10.5 17.5H15Q18 17.5 18 21V36H7Z', look.body);
  if (look.kleding === 'pak') {
    path('M12.2 17.5H16L14.1 26Z', '#dbe7f0');
    path('M13.4 18.2H14.8L15.3 25.5L14.1 27.5L12.9 25.5Z', look.tie);
  } else {
    // Trui: ronde hals en geribde boord onderaan.
    ctx.strokeStyle = look.boord; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(11, 17.8); ctx.quadraticCurveTo(12.9, 19.6, 14.8, 17.8); ctx.stroke();
    box(7, 34.4, 11, 1.6, 0.6, look.boord);
  }
  if (look.logo) {
    // TC-logo op de borst: T in het blauw, C in het grijs.
    ctx.font = '700 4.4px "Space Grotesk", Inter, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#4aa3ff'; ctx.fillText('T', 8.9, 26.2);
    ctx.fillStyle = '#b8bec9'; ctx.fillText('C', 11.3, 26.2);
  }
  ctx.restore();
  rot(frontArm, 16, 20 + dy, () => { box(14, 19 + dy, 4, 15, 2, look.frontArm); dot(16, 34.5 + dy, 1.9, SKIN); });

  ctx.save();
  ctx.translate(0, dy);
  box(8, 3, 10.5, 12.5, 4.5, SKIN);
  dot(18.4, 10, 1.1, SKIN);
  if (look.kaal) {
    // Kale kop: glans bovenop en een zachte schaduw aan de achterkant.
    ctx.fillStyle = '#fbe3cc'; ctx.beginPath(); ctx.ellipse(12.2, 5.2, 2.6, 1.3, -0.25, 0, Math.PI * 2); ctx.fill();
    path('M8 9Q8 5 10 3.6Q8.6 6 9.4 11.5L8 11.5Z', SKIN_SHADE);
    dot(10.8, 9.6, 1.3, SKIN_SHADE);
  } else if (look.variant === 1) {
    dot(10.8, 9.6, 1.3, SKIN_SHADE);
    path('M7.6 6.5Q7.2 2.4 13.2 2.4Q18.8 2.4 18.6 6.6L14.2 6.2Q11.6 6.6 11.4 10L11.4 19Q11.2 21.5 9 21.5Q7 21.5 6.8 19Z', look.hair);
  } else if (look.variant === 2) {
    path('M7.8 11Q6.8 4 10.6 2.2Q14.8 0.2 19.2 2.6Q19.8 4.6 17.8 5.4L13.8 5.8Q11.2 6.2 10.9 9.2L10.6 11.5L8.2 11.5Z', look.hair);
    dot(10.8, 9.6, 1.3, SKIN_SHADE);
  } else {
    path('M7.6 10.5Q7 2.5 13.2 2.4Q18.8 2.4 18.6 6.2L13.8 6.2Q11.2 6.4 10.9 9.2L10.6 11.5L8 11.5Z', look.hair);
    dot(10.8, 9.6, 1.3, SKIN_SHADE);
  }
  box(15.1, 8.2, 1.3, 1.7, 0.5, '#16202a');
  if (look.bril) {
    ctx.strokeStyle = '#16202a';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.roundRect(14.3, 7.6, 4, 2.9, 0.9); ctx.moveTo(14.3, 8.6); ctx.lineTo(11.6, 8.6); ctx.stroke();
  } else {
    box(14.4, 6.8, 2.8, 0.8, 0.4, look.variant === 1 ? '#a87a2a' : look.hair);
  }
  ctx.restore();
}

/** Het uiterlijk van een kantoorheld: vast personage, of pak met stropdas in de CV-kleur en een kapsel op volgorde. */
function officeLook(cv, i) {
  const fixed = OFFICE_LOOKS[lookOf(cv)];
  if (fixed) return fixed;
  const variant = i % OFFICE_HAIR.length;
  const tie = /^#[0-9a-f]{6}$/i.test(cv.kleur ?? '') ? cv.kleur : '#3c8772';
  return { ...PAK, tie, variant, hair: OFFICE_HAIR[variant], bril: variant === 2 };
}

/**
 * Kantoorhelden voor het zakelijke thema: texture `${prefix}hero-<id>` met dezelfde frames en animaties
 * als de pixel-held, zodat LevelScene ze zonder verschil kan afspelen.
 */
export function createOfficeHeroTextures(scene, cvs, prefix) {
  const fw = OFFICE_W * OFFICE_RES;
  const fh = OFFICE_H * OFFICE_RES;
  cvs.forEach((cv, i) => {
    const key = prefix + heroKey(cv);
    if (scene.textures.exists(key)) return;
    const look = officeLook(cv, i);
    const tex = scene.textures.createCanvas(key, fw * OFFICE_POSES.length, fh);
    const ctx = tex.getContext();
    OFFICE_POSES.forEach((pose, f) => {
      ctx.save();
      ctx.translate(f * fw, 0);
      ctx.scale(OFFICE_RES, OFFICE_RES);
      drawOfficeWorker(ctx, look, pose);
      ctx.restore();
      tex.add(pose[0], 0, f * fw, 0, fw, fh);
    });
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    addAnims(scene, key);
  });
}

/** Schaal waarop een kantoorheld even hoog is als in het ontwerp (84 px in het level). */
export const OFFICE_SCALE = 84 / (OFFICE_H * OFFICE_RES);
