// Helden als Phaser-textures: de pixel-held (retro, rasters uit pixelHero.js) en de kantoorheld (zakelijk).
// "uiterlijk" in het CV kiest een vast personage (string, zie src/config/uiterlijk.js) of geeft kenmerken
// uit een foto (object: kapsel, haarkleur, huid, bril, baard). Beide gamestijlen gebruiken dezelfde kenmerken.
// Frames per held: idle0, idle1, run0–run3, jump. Animaties: <key>-idle, <key>-run, <key>-jump.
import Phaser from 'phaser';
import { HERO_H, HERO_W, featuresOf, lookOf, mix, pixelHeroFrames, shade } from './pixelHero.js';

export { HERO_H, HERO_W, lookOf };

export const heroKey = (cv) => `hero-${cv.id}`;

/** Animatiesleutel voor een held, bv. heroAnim(key, 'run'). */
export const heroAnim = (key, name) => `${key}-${name}`;

/** Martijn van TestCoders als gastheer aan het begin: dezelfde tekening als het uiterlijk "martijn". */
export const HOST_CV = { id: 'martijn', naam: 'Martijn', uiterlijk: 'martijn' };

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

    const { frames, colors } = pixelHeroFrames(cv, i);
    const tex = scene.textures.createCanvas(key, HERO_W * frames.length, HERO_H);
    const ctx = tex.getContext();
    frames.forEach(({ name, rows }, f) => {
      const ox = f * HERO_W;
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (!colors[ch]) return;
        ctx.fillStyle = colors[ch];
        ctx.fillRect(ox + x, y, 1, 1);
      }));
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
const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');
// Kapsel uit het uiterlijk → kantoorvariant (0 kort, 1 lang, 2 kuif); "kaal" en "pet" tekenen als kort.
const OFFICE_VARIANT = { kort: 0, pet: 0, kaal: 0, lang: 1, staart: 1, opzij: 2, krullen: 2 };
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

/** Baard van de kantoorheld (kenmerk "baard" uit het uiterlijk); getekend over het gezicht. */
function drawOfficeBeard(ctx, look, path, box) {
  if (!look.beard || look.beard === 'geen') return;
  const color = look.beardColor ?? look.hair;
  if (look.beard === 'snor') return box(14.6, 11.7, 3.6, 0.9, 0.45, color);
  if (look.beard === 'sik') return box(14.2, 13.6, 2.4, 1.8, 0.9, color);
  const full = 'M9.6 10.2Q9.4 15.6 13.6 15.7Q18.2 15.8 18.4 11.6L18.4 12.6Q16.4 12.2 14.2 12.8Q12 12.4 11.2 10.2Z';
  ctx.save();
  if (look.beard === 'stoppels') ctx.globalAlpha = 0.35;
  path(full, color);
  ctx.restore();
}

function drawOfficeWorker(ctx, look, [name, backArm, frontArm, backLeg, frontLeg, poseDy]) {
  // Ademen: bij idle telt de adem-factor van het personage mee.
  const dy = name.startsWith('idle') ? poseDy * look.breath : poseDy;
  const skin = look.skin ?? SKIN;
  const skinShade = look.skinShade ?? SKIN_SHADE;
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

  rot(backArm, 8, 20 + dy, () => { box(6, 19 + dy, 4, 15, 2, look.backArm); dot(8, 34.5 + dy, 1.9, skinShade); });
  rot(backLeg, 10.8, 35, () => { box(8.6, 34, 4.4, 17, 2, look.legBack); box(7.8, 50, 6.4, 3.2, 1.6, look.shoeBack); });
  rot(frontLeg, 14.2, 35, () => { box(12, 34, 4.4, 17, 2, look.legFront); box(11.6, 50, 7.6, 3.2, 1.6, look.shoeFront); });

  ctx.save();
  ctx.translate(0, dy);
  box(11, 14, 3.6, 4.5, 0, skinShade);
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
  rot(frontArm, 16, 20 + dy, () => { box(14, 19 + dy, 4, 15, 2, look.frontArm); dot(16, 34.5 + dy, 1.9, skin); });

  ctx.save();
  ctx.translate(0, dy);
  box(8, 3, 10.5, 12.5, 4.5, skin);
  dot(18.4, 10, 1.1, skin);
  if (look.kaal) {
    // Kale kop: glans bovenop en een zachte schaduw aan de achterkant.
    ctx.fillStyle = look.skin ? mix(look.skin, '#ffffff', 0.55) : '#fbe3cc'; ctx.beginPath(); ctx.ellipse(12.2, 5.2, 2.6, 1.3, -0.25, 0, Math.PI * 2); ctx.fill();
    path('M8 9Q8 5 10 3.6Q8.6 6 9.4 11.5L8 11.5Z', skinShade);
    dot(10.8, 9.6, 1.3, skinShade);
  } else if (look.variant === 1) {
    dot(10.8, 9.6, 1.3, skinShade);
    path('M7.6 6.5Q7.2 2.4 13.2 2.4Q18.8 2.4 18.6 6.6L14.2 6.2Q11.6 6.6 11.4 10L11.4 19Q11.2 21.5 9 21.5Q7 21.5 6.8 19Z', look.hair);
  } else if (look.variant === 2) {
    path('M7.8 11Q6.8 4 10.6 2.2Q14.8 0.2 19.2 2.6Q19.8 4.6 17.8 5.4L13.8 5.8Q11.2 6.2 10.9 9.2L10.6 11.5L8.2 11.5Z', look.hair);
    dot(10.8, 9.6, 1.3, skinShade);
  } else {
    path('M7.6 10.5Q7 2.5 13.2 2.4Q18.8 2.4 18.6 6.2L13.8 6.2Q11.2 6.4 10.9 9.2L10.6 11.5L8 11.5Z', look.hair);
    dot(10.8, 9.6, 1.3, skinShade);
  }
  box(15.1, 8.2, 1.3, 1.7, 0.5, '#16202a');
  if (look.bril) {
    ctx.strokeStyle = '#16202a';
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.roundRect(14.3, 7.6, 4, 2.9, 0.9); ctx.moveTo(14.3, 8.6); ctx.lineTo(11.6, 8.6); ctx.stroke();
  } else {
    box(14.4, 6.8, 2.8, 0.8, 0.4, look.brow ?? (look.variant === 1 ? '#a87a2a' : look.hair));
  }
  drawOfficeBeard(ctx, look, path, box);
  ctx.restore();
}

/** Het uiterlijk van een kantoorheld: vast personage, of pak met stropdas in de CV-kleur en een kapsel op volgorde. */
function officeLook(cv, i) {
  const fixed = OFFICE_LOOKS[lookOf(cv)];
  if (fixed) return fixed;
  const tie = /^#[0-9a-f]{6}$/i.test(cv.kleur ?? '') ? cv.kleur : '#3c8772';
  const u = featuresOf(cv);
  if (u) {
    // Kenmerken uit een foto: kapsel naar de dichtstbijzijnde kantoorvariant (0 kort, 1 lang, 2 kuif).
    const variant = OFFICE_VARIANT[u.kapsel] ?? i % OFFICE_HAIR.length;
    const hair = isHex(u.haarkleur) ? u.haarkleur : OFFICE_HAIR[variant];
    const skin = isHex(u.huid) ? u.huid : undefined;
    return {
      ...PAK, tie, variant, hair, brow: shade(hair, 0.85), bril: u.bril === true, kaal: u.kapsel === 'kaal',
      beard: u.baard, skin, skinShade: skin && shade(skin, 0.9)
    };
  }
  const variant = i % OFFICE_HAIR.length;
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
