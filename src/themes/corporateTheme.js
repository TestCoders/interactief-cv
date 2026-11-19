import { canvasTexture } from '../graphics/pixelTexture.js';
import { createOfficeHeroTextures, OFFICE_SCALE, heroKey, HOST_CV } from '../graphics/heroSprites.js';

// Thema "Business isometric" (stijl 2, strak en zakelijk; design/strak-zakelijk): een isometrische zakenwijk
// met neonborden overdag, 's avonds een neonstad. Zelfde gameplay, andere skin.
const C = {
  bg: '#f6f7fb', ink: '#16202a', muted: '#55606b', groen: '#2f6f5d', groenDonker: '#1d4a3e',
  rand: '#c3cce0', navy: '#1b1f3b', navyDonker: '#0d1024', cyaan: '#22e5ff', roze: '#ff3ea5', geel: '#ffd23f',
  violet: '#a46bff', oranje: '#ff9f1c', vloer: '#cfd8e8', paal: '#3b4560'
};
const KOEL = { top: '#f4f6fb', left: '#dde3ef', right: '#c3cce0' };
const WARM = { top: '#f7f0e5', left: '#eadfcc', right: '#d8c8af' };

const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

// Gebouwen uit het ontwerp: [voorhoek x, diepte, breedte, hoogte, palet, verlichte ramen (rechtergevel), deur x, soort]
const GEBOUWEN = [
  [40, 40, 70, 120, KOEL, [[27, 74]], 28],
  [150, 40, 60, 180, WARM, [[15, 102]], 24],
  [250, 40, 100, 100, KOEL, [[63, 46]], 44],
  [400, 40, 90, 140, WARM, [[39, 88]], 38],
  [530, 40, 70, 90, KOEL, [], 46, 'cafe'],
  [640, 40, 70, 180, WARM, [[39, 130]], 28],
  [750, 40, 90, 130, KOEL, [[51, 60]], 40],
  [880, 40, 80, 160, WARM, [[27, 116]], 34]
];

/** Teken in een vlak met een eigen transformatie (SVG-matrix: a b c d e f). */
function vlak(ctx, m, draw) {
  ctx.save();
  ctx.transform(...m);
  draw();
  ctx.restore();
}

/** Isometrisch gebouw (2:1): linkergevel, rechtergevel en dak; ramen en deur lopen mee in het perspectief. */
function gebouw(ctx, [fx, a, b, h, pal, lit, deur, soort], base) {
  const y0 = soort === 'cafe' ? 60 : 18;
  vlak(ctx, [-1, -0.5, 0, -1, fx, base], () => {
    ctx.fillStyle = pal.left; ctx.fillRect(0, 0, a, h);
    ctx.fillStyle = '#b9c8e2';
    for (let x = 13; x + 5 <= a - 7; x += 10) for (let y = y0; y + 8 <= h - 12; y += 14) ctx.fillRect(x, y, 5, 8);
  });
  vlak(ctx, [1, -0.5, 0, -1, fx, base], () => {
    ctx.fillStyle = pal.right; ctx.fillRect(0, 0, b, h);
    ctx.fillStyle = '#9fb2d3';
    for (let x = 15; x + 6 <= b - 9; x += 12) for (let y = y0; y + 8 <= h - 12; y += 14) ctx.fillRect(x, y, 6, 8);
    ctx.fillStyle = '#ffe7a3';
    for (const [x, y] of lit) ctx.fillRect(x, y, 6, 8);
    if (soort === 'cafe') {
      ctx.fillStyle = '#b9c8e2'; ctx.fillRect(8, 2, 30, 16);
      ctx.fillStyle = C.groen; ctx.fillRect(4, 22, 62, 6);
    }
    ctx.fillStyle = '#5d6b85'; ctx.fillRect(deur, 0, 12, soort === 'cafe' ? 18 : 16);
  });
  vlak(ctx, [1, 0, 0, 1, fx, base - h], () => vlak(ctx, [1, -0.5, -1, -0.5, 0, 0], () => {
    ctx.fillStyle = pal.top; ctx.fillRect(0, 0, b, a);
  }));
}

/** Neonbuis: eerst een gloed in de kleur, dan een witte kern. */
function neonTekst(ctx, tekst, x, y, size, kleur, align = 'center') {
  ctx.font = `700 ${size}px "Space Grotesk", Inter, sans-serif`;
  ctx.textAlign = align;
  ctx.shadowColor = kleur;
  ctx.shadowBlur = 8;
  ctx.fillStyle = kleur;
  ctx.fillText(tekst, x, y);
  ctx.fillText(tekst, x, y);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tekst, x, y);
  ctx.globalAlpha = 1;
}
function neonRand(ctx, x, y, w, h, r, kleur, lw = 1.5) {
  ctx.save();
  ctx.shadowColor = kleur;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = kleur;
  ctx.lineWidth = lw;
  rr(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.stroke();
  ctx.restore();
}
function dakbord(ctx, fx, base, top, tekst, kleur, tekstKleur = kleur) {
  vlak(ctx, [1, -0.5, 0, 1, fx, base], () => {
    ctx.fillStyle = C.paal; ctx.fillRect(14, top + 26, 2, 12); ctx.fillRect(74, top + 26, 2, 12);
    ctx.fillStyle = C.navy; rr(ctx, 4, top, 82, 26, 3); ctx.fill();
    neonRand(ctx, 6.5, top + 2.5, 77, 21, 2, kleur);
    neonTekst(ctx, tekst, 45, top + 18, 12, tekstKleur);
  });
}

/** De skyline uit het ontwerp (960 breed, voet op `base`), met neonborden, bomen en plein. */
function skyline(ctx, base) {
  ctx.fillStyle = C.vloer; ctx.fillRect(0, base - 40, 960, 400);
  GEBOUWEN.forEach((g) => gebouw(ctx, g, base));

  // Uithangbord "QA" aan de toren.
  vlak(ctx, [1, -0.5, 0, 1, 150, base], () => {
    ctx.fillStyle = C.navy; rr(ctx, 42, -150, 16, 54, 3); ctx.fill();
    neonRand(ctx, 43.5, -148.5, 13, 51, 2, C.geel);
    neonTekst(ctx, 'Q', 50, -126, 15, C.geel);
    neonTekst(ctx, 'A', 50, -104, 15, C.geel);
  });
  dakbord(ctx, 400, base, -176, 'Werkplezier', C.roze);
  dakbord(ctx, 750, base, -166, 'Expertise', C.violet, '#c9a8ff');
  // Café: neon koffiekop.
  vlak(ctx, [1, -0.5, 0, 1, 530, base], () => {
    ctx.save();
    ctx.shadowColor = C.oranje; ctx.shadowBlur = 8; ctx.strokeStyle = C.oranje; ctx.lineWidth = 2; ctx.lineCap = 'round';
    rr(ctx, 14, -52, 12, 12, 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(26, -46, 3, -Math.PI / 2, Math.PI / 2); ctx.moveTo(17, -56); ctx.quadraticCurveTo(19, -59, 17, -62); ctx.moveTo(22, -56); ctx.quadraticCurveTo(24, -59, 22, -62); ctx.stroke();
    ctx.restore();
    neonTekst(ctx, 'Koffie', 33, -41, 11, C.cyaan, 'left');
  });

  // Groot billboard met lampjes.
  ctx.fillStyle = C.paal; ctx.fillRect(336, base - 106, 5, 106); ctx.fillRect(440, base - 106, 5, 106);
  ctx.fillStyle = C.navy; rr(ctx, 296, base - 176, 190, 74, 8); ctx.fill();
  neonRand(ctx, 303, base - 169, 176, 60, 5, C.cyaan, 2);
  neonTekst(ctx, 'Testautomatisering', 391, base - 135, 16, C.cyaan);
  ctx.save();
  ctx.shadowBlur = 6;
  for (let i = 0; i < 10; i++) {
    const kleur = [C.roze, C.geel, C.violet][i % 3];
    ctx.shadowColor = kleur; ctx.fillStyle = kleur;
    ctx.beginPath(); ctx.arc(319 + i * 16, base - 119, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // Bomen met slagschaduw.
  for (const x of [112, 604, 846]) {
    ctx.fillStyle = '#b7c3d8'; ctx.beginPath(); ctx.ellipse(x, base - 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8c7a66'; ctx.fillRect(x - 2, base - 26, 4, 24);
    ctx.fillStyle = '#7cc4a4'; ctx.beginPath(); ctx.arc(x, base - 34, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5fae8c'; ctx.beginPath(); ctx.arc(x + 6, base - 28, 8, 0, Math.PI * 2); ctx.fill();
  }
}

const WOLK = 'M16 38a12 12 0 0 1 2-23.8A18 18 0 0 1 52 8a14 14 0 0 1 24 10a10 10 0 0 1-2 20Z';
const VOGELS = 'M2 8Q5 3 8 8Q11 3 14 8M24 4Q26.5 0 29 4Q31.5 0 34 4M40 16Q43 11 46 16Q49 11 52 16';

/** Koffertje (skill-bonus): dicht of open met gouden gloed en sterretjes, isometrisch zoals in het ontwerp. */
function koffertje(ctx, open) {
  const p = (d, fill) => { ctx.fillStyle = fill; ctx.fill(new Path2D(d)); };
  ctx.translate(0, 8);
  if (!open) {
    p('M12 30L4 26V12L12 16Z', '#9a6534'); p('M12 30L32 20V6L12 16Z', '#7a4a22'); p('M12 16L4 12L24 2L32 6Z', '#b8834a');
    ctx.strokeStyle = '#5e3818'; ctx.lineWidth = 1; ctx.stroke(new Path2D('M4 15L12 19L32 9'));
    ctx.strokeStyle = C.groen; ctx.lineWidth = 2.4; ctx.stroke(new Path2D('M22 25V11'));
    ctx.fillStyle = C.geel; ctx.beginPath(); ctx.arc(17, 16.6, 1.3, 0, 7); ctx.arc(27, 11.6, 1.3, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5e3818'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke(new Path2D('M15 10.5V8Q15 6 17 5L19 4Q21 3 21 5V7.5'));
    return;
  }
  p('M4 17L24 7V-5L4 5Z', '#9a6534'); p('M6 15.2L22 7.2V-3.2L6 4.8Z', '#d9b382');
  p('M12 21L4 17L24 7L32 11Z', '#3a2414');
  ctx.save(); ctx.shadowColor = C.geel; ctx.shadowBlur = 6; ctx.globalAlpha = 0.9;
  ctx.fillStyle = C.geel; ctx.beginPath(); ctx.ellipse(18, 14, 7, 3.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  p('M12 30L4 26V17L12 21Z', '#9a6534'); p('M12 30L32 20V11L12 21Z', '#7a4a22');
  ctx.strokeStyle = C.groen; ctx.lineWidth = 2.4; ctx.stroke(new Path2D('M22 25V16'));
  ctx.fillStyle = C.geel; ctx.beginPath(); ctx.arc(17, 19.6, 1.3, 0, 7); ctx.arc(27, 14.6, 1.3, 0, 7); ctx.fill();
  ctx.save(); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 4;
  p('M14 -1L15 1L17 2L15 3L14 5L13 3L11 2L13 1ZM24 -6L24.8 -4.4L26.4 -3.6L24.8 -2.8L24 -1.2L23.2 -2.8L21.6 -3.6L23.2 -4.4ZM29 2L29.6 3.2L30.8 3.8L29.6 4.4L29 5.6L28.4 4.4L27.2 3.8L28.4 3.2Z', '#ffe27a');
  ctx.restore();
}

export default {
  name: 'zakelijk',
  label: 'Zakelijk',
  audio: 'zakelijk', // geluidspakket in src/audio/packs
  tex: (key) => `z-${key}`,
  hostKey: `z-${heroKey(HOST_CV)}`, // Martijn (Bjorns kantoortekening)
  font: '"Space Grotesk", Inter, system-ui, sans-serif',
  titleFont: '"Space Grotesk", Inter, system-ui, sans-serif',
  // Kaarten in het selectiescherm: wit, afgerond, met isometrische rand; gekozen kaart met groene rand.
  card: {
    fill: 0xffffff, edge: 0xd5dbe6, border: 1, radius: 14, shadow: 0xc3cce0, selectedShadow: 0x1d4a3e, shadowX: 10, shadowY: 5,
    selected: 0x2f6f5d, ring: 2, ringColor: 0x2f6f5d, text: '#16202a', dim: '#55606b'
  },
  // Kantoorheld: vectorfiguur, voeten op 95% van het frame.
  heroScale: OFFICE_SCALE,
  heroOriginY: 0.95,
  colors: {
    board: 0x1b1f3b,
    boardEdge: 0x22e5ff,
    boardShadow: 0x0d1024,
    post: 0x55606b,
    text: '#e6fdff',
    title: '#22e5ff',
    dim: '#8b95b5',
    floatTitle: '#22e5ff',
    floatStroke: '#0d1024',
    signText: '#e6fdff',
    selectTitle: '#16202a',
    selectText: '#3f4a55',
    marker: 0x2f6f5d,
    window: 0x0d1024,
    windowLit: 0x22e5ff
  },
  // Lavendelblauw overdag (zodat het neon opvalt), 's avonds een neonstad.
  sky: { dag: 0xe4e9f7, middag: 0xdfe6f5, zonsondergang: 0xf7c9b0, avond: 0x1b1f3b },
  tint: { dag: 0xffffff, zonsondergang: 0xffe0d0, avond: 0x5b6690 },
  // DOM-overlay: witte kaarten met isometrische rand, zie [data-stijl="zakelijk"] in style.css.
  css: {
    '--pixel-font': 'Inter, system-ui, sans-serif',
    '--title-font': '"Space Grotesk", Inter, system-ui, sans-serif',
    '--box': '#ffffff', '--box-hover': '#f6f7fb', '--box-text': '#16202a',
    '--box-title': '#2f6f5d', '--box-dim': '#55606b', '--box-shadow': '#c3cce0'
  },

  createTextures(scene) {
    const t = (k) => `z-${k}`;

    createOfficeHeroTextures(scene, [...(scene.registry.get('cvs') ?? []), HOST_CV], 'z-');

    // Wereld: isometrische zakenwijk (voet van de gebouwen op de grond), wolken met vogels, vloerplaat.
    canvasTexture(scene, t('hills'), 960, 300, (ctx) => skyline(ctx, 260));
    canvasTexture(scene, t('clouds'), 960, 160, (ctx) => {
      ctx.fillStyle = '#ffffff';
      for (const [x, y, s] of [[60, 30, 1.2], [520, 86, 0.8], [760, 20, 1]]) {
        ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fill(new Path2D(WOLK)); ctx.restore();
      }
      ctx.save(); ctx.translate(360, 56); ctx.strokeStyle = C.muted; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.stroke(new Path2D(VOGELS)); ctx.restore();
    });
    canvasTexture(scene, t('ground'), 64, 64, (ctx) => {
      ctx.fillStyle = '#eef2f8'; ctx.fillRect(0, 0, 64, 16);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 64, 2);
      ctx.fillStyle = '#9aa6bd'; ctx.fillRect(30, 6, 2, 4);
      ctx.fillStyle = C.vloer; ctx.fillRect(0, 16, 64, 48);
      ctx.fillStyle = '#bfc9dc'; ctx.fillRect(0, 16, 1, 48); ctx.fillRect(32, 16, 1, 48);
    });
    canvasTexture(scene, t('sign'), 96, 110, (ctx) => {
      ctx.fillStyle = C.paal; ctx.fillRect(45, 50, 6, 60);
      ctx.fillStyle = C.navy; rr(ctx, 2, 2, 92, 52, 8); ctx.fill();
      neonRand(ctx, 5, 5, 86, 46, 6, C.cyaan, 2);
    });
    // Finish: vlag met "Contact" (daarna contact via TestCoders).
    canvasTexture(scene, t('flag'), 96, 160, (ctx) => {
      ctx.fillStyle = '#b7c3d8'; ctx.beginPath(); ctx.ellipse(12, 156, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.paal; ctx.fillRect(10, 18, 3, 140);
      ctx.fillStyle = C.groen; rr(ctx, 13, 18, 80, 30, [0, 6, 6, 0]); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.stroke(new Path2D('M21 33l4 4 7-8'));
      ctx.fillStyle = '#ffffff'; ctx.font = '700 13px "Space Grotesk", Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Contact', 38, 38);
    });
    // Bonus: koffertje dat openklapt.
    canvasTexture(scene, t('gift'), 51, 60, (ctx) => { ctx.scale(1.5, 1.5); koffertje(ctx, false); });
    canvasTexture(scene, t('giftOpen'), 51, 60, (ctx) => { ctx.scale(1.5, 1.5); koffertje(ctx, true); });

    // Skills: koffertjes i.p.v. bloemetjes (Bjorns "skill-koffertje").
    canvasTexture(scene, t('flower'), 18, 22, (ctx) => {
      ctx.strokeStyle = C.groenDonker; ctx.lineWidth = 2; rr(ctx, 5, 3, 8, 6, 2); ctx.stroke();
      ctx.fillStyle = C.groen; rr(ctx, 1, 8, 16, 13, 3); ctx.fill();
      ctx.fillStyle = C.geel; ctx.fillRect(8, 12, 3, 3);
    });
    canvasTexture(scene, t('soil'), 20, 8, (ctx) => { ctx.fillStyle = '#2a3060'; rr(ctx, 1, 1, 18, 6, 3); ctx.fill(); });
    canvasTexture(scene, t('spark'), 8, 8, (ctx) => {
      ctx.fillStyle = C.cyaan; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(8, 4); ctx.lineTo(4, 8); ctx.lineTo(0, 4); ctx.fill();
    });

    // Expertise: aktetas die openklapt.
    canvasTexture(scene, t('chest'), 64, 28, (ctx) => {
      ctx.fillStyle = C.navy; rr(ctx, 0, 0, 64, 28, 4); ctx.fill();
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 2; rr(ctx, 2, 2, 60, 24, 3); ctx.stroke();
      ctx.fillStyle = C.geel; ctx.fillRect(28, 0, 8, 6);
    });
    canvasTexture(scene, t('chestLid'), 64, 20, (ctx) => {
      ctx.strokeStyle = C.navy; ctx.lineWidth = 4; rr(ctx, 22, 2, 20, 10, 4); ctx.stroke();
      ctx.fillStyle = C.navy; rr(ctx, 0, 8, 64, 12, 4); ctx.fill();
      ctx.fillStyle = C.cyaan; ctx.fillRect(4, 16, 56, 2);
    });

    // Opleiding: badge, hoed.
    canvasTexture(scene, t('medal'), 24, 28, (ctx) => {
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(10, 0); ctx.lineTo(14, 12); ctx.lineTo(8, 12); ctx.fill();
      ctx.fillStyle = C.cyaan; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, 0); ctx.lineTo(16, 12); ctx.lineTo(10, 12); ctx.fill();
      ctx.fillStyle = '#e0a800'; ctx.beginPath(); ctx.arc(12, 18, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.geel; ctx.beginPath(); ctx.arc(12, 18, 6, 0, Math.PI * 2); ctx.fill();
    });
    canvasTexture(scene, t('cap'), 42, 24, (ctx) => {
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.moveTo(21, 0); ctx.lineTo(42, 8); ctx.lineTo(21, 16); ctx.lineTo(0, 8); ctx.fill();
      ctx.fillRect(12, 10, 18, 10);
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(34, 10); ctx.lineTo(34, 22); ctx.stroke();
    });

    // Bonus, pipeline (glazen lift), wensballon (neonlampje), vuurschaal.
    canvasTexture(scene, t('pipeline'), 48, 72, (ctx) => {
      ctx.fillStyle = 'rgba(34,229,255,.28)'; rr(ctx, 4, 8, 40, 64, 6); ctx.fill();
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 3; rr(ctx, 4, 8, 40, 64, 6); ctx.stroke();
      ctx.fillStyle = C.navy; rr(ctx, 0, 0, 48, 12, 4); ctx.fill();
      ctx.fillStyle = '#7cff6b'; ctx.fillRect(8, 4, 6, 4);
    });
    canvasTexture(scene, t('lantern'), 26, 26, (ctx) => {
      ctx.fillStyle = 'rgba(255,62,165,.35)'; ctx.beginPath(); ctx.arc(13, 13, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.geel; ctx.beginPath(); ctx.arc(13, 13, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(11, 11, 3, 0, Math.PI * 2); ctx.fill();
    });
    const vuur = (flip) => (ctx) => {
      ctx.save(); if (flip) { ctx.translate(40, 0); ctx.scale(-1, 1); }
      ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(8, 30); ctx.quadraticCurveTo(6, 12, 18, 2); ctx.quadraticCurveTo(16, 14, 26, 10); ctx.quadraticCurveTo(36, 20, 32, 30); ctx.fill();
      ctx.fillStyle = C.geel; ctx.beginPath(); ctx.moveTo(14, 30); ctx.quadraticCurveTo(14, 18, 20, 12); ctx.quadraticCurveTo(22, 20, 27, 18); ctx.quadraticCurveTo(30, 26, 27, 30); ctx.fill();
      ctx.restore();
      ctx.fillStyle = C.muted; rr(ctx, 4, 30, 32, 8, 3); ctx.fill();
    };
    canvasTexture(scene, t('fire0'), 40, 40, vuur(false));
    canvasTexture(scene, t('fire1'), 40, 40, vuur(true));

    // Snelreis-bug: vriendelijke kever in navy met neon-cyaan glans (bek dicht / open).
    const bug = (open) => (ctx) => {
      ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const lx of [16, 26, 36]) { ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx - 4, 40); ctx.stroke(); }
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.ellipse(26, 22, 22, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = C.cyaan; ctx.shadowBlur = 6;
      ctx.strokeStyle = C.cyaan; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(25, 20, 17, 10, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(50, 22, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(53, 18, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(54, 18, 2, 0, Math.PI * 2); ctx.fill();
      if (open) { ctx.fillStyle = C.roze; ctx.beginPath(); ctx.moveTo(48, 26); ctx.lineTo(62, 22); ctx.lineTo(62, 34); ctx.fill(); }
      ctx.strokeStyle = C.navy; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(52, 13); ctx.quadraticCurveTo(56, 3, 62, 4); ctx.stroke();
    };
    canvasTexture(scene, t('bug0'), 64, 44, bug(false));
    canvasTexture(scene, t('bug1'), 64, 44, bug(true));
  }
};
