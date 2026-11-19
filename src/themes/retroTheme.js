import { pixelTexture, pathTexture } from '../graphics/pixelTexture.js';
import { createHeroTextures, heroKey, HOST_CV } from '../graphics/heroSprites.js';

// Thema "retro pixel-art" (design/retro-pixel-art). Een thema levert kleuren, font en textures;
// de set pieces (src/pieces) gebruiken alleen deze sleutels, zodat elke stijl dezelfde gameplay heeft.

// Pixel art uit het ontwerp: [kleur, pad] op een raster van 1 eenheid per pixel.
const GROUND = [
  ['#7a4a2a', 'M0 0h16v16h-16z'],
  ['#4f2f1d', 'M3 8h2v1h-2zM10 11h3v1h-3zM6 13h1v1h-1zM13 7h1v1h-1zM1 14h2v1h-2z'],
  ['#4fa84a', 'M0 0h16v4h-16z'],
  ['#8fd45c', 'M0 0h16v1h-16zM2 1h1v1h-1zM7 1h2v1h-2zM12 1h1v1h-1z'],
  ['#2f7a3a', 'M0 4h1v1h-1zM2 4h2v1h-2zM6 4h1v2h-1zM9 4h3v1h-3zM14 4h1v1h-1z']
];
const CLOUD = [
  ['#f4f4ec', 'M8 0h6v2h-6zM15 1h4v1h-4zM4 2h16v2h-16zM1 4h22v2h-22zM0 6h24v1h-24z'],
  ['#c9dff0', 'M0 7h24v1h-24zM20 5h3v1h-3z']
];
const HILLS = [
  ['#8ccfa8', 'M0 60V34h8v-4h8v-4h12v-3h16v3h12v4h8v4h10v-3h8v-4h14v-3h18v3h10v4h8v5h14v-4h10v-5h16v-3h14v3h10v5h8v4h6H240V60z'],
  ['#6fb391', 'M0 60V48h20v-6h16v-4h24v4h14v6h20v-5h18v-6h26v6h16v5h22v-4h20v-5h22v5h12H240V60z']
];
const SIGN = [
  ['#7a4a2a', 'M7 10h2v9h-2z'],
  ['#1b1f2e', 'M6 10h1v9h-1zM9 10h1v9h-1z'],
  ['#3c8772', 'M1 1h14v8h-14z'],
  ['#7fd1b9', 'M1 1h14v1h-14z'],
  ['#f4f4ec', 'M2 2h12v6h-12z'],
  ['#c9ccd6', 'M13 3h1v5h-1z'],
  ['#1b1f2e', 'M1 0h14v1h-14zM0 1h1v8h-1zM15 1h1v8h-1zM1 9h14v1h-14z']
];
const FLAG = [
  ['#f2b22e', 'M0 0h3v2h-3z'],
  ['#d6d9e0', 'M1 2h1v20h-1z'],
  ['#8a90a2', 'M2 2h1v20h-1z'],
  ['#3c8772', 'M3 3h2v1h-2zM3 4h4v1h-4zM3 5h6v1h-6zM3 6h8v1h-8zM3 7h6v1h-6zM3 8h4v1h-4zM3 9h2v1h-2z'],
  ['#7fd1b9', 'M3 3h2v1h-2zM3 4h1v3h-1z'],
  ['#1b1f2e', 'M0 22h4v2h-4z']
];

export default {
  name: 'retro',
  label: 'Retro',
  audio: 'retro', // geluidspakket in src/audio/packs
  hostKey: heroKey(HOST_CV), // Martijn (Bjorns tekening, uiterlijk "martijn")
  tex: (key) => key, // retro-textures staan onder hun kale naam (helden worden gemaakt in BootScene)
  // Dag → avond (zie LevelScene.updateSky); overdag de luchtband uit het ontwerp.
  sky: { dag: 0x5fb7f0, middag: 0x7cc6f3, zonsondergang: 0xff9e7a, avond: 0x2b2147 },
  tint: { dag: 0xffffff, zonsondergang: 0xffc6a8, avond: 0x5a4f8a },
  // DOM-overlay (tekstbox, knoppen, HUD): crème kaders met inktrand, zie [data-stijl="retro"] in style.css.
  css: {
    '--pixel-font': '"Jersey 10", "Pixelify Sans", "Courier New", monospace',
    '--title-font': '"Press Start 2P", "Courier New", monospace',
    '--box': '#f4f4ec', '--box-hover': '#ffffff', '--box-text': '#1b1f2e',
    '--box-title': '#2f6f5d', '--box-dim': '#3b4561', '--box-shadow': '#1b1f2e'
  },
  // Leesbaar pixelfont: Jersey 10 (duidelijke C/O en I/l, in tegenstelling tot Pixelify Sans). Eén gewicht, tekent kleiner per px.
  font: '"Jersey 10", "Pixelify Sans", "Courier New", monospace',
  minFontSize: 12, // nooit kleiner (vóór schaling)
  fontScale: 1.35, // Jersey 10 op 1,35× oogt even groot als een gewoon font op 1×
  boldText: false, // geen namaak-vet: Jersey 10 is al stevig
  titleFont: '"Press Start 2P", "Courier New", monospace',
  titleUpper: true, // Press Start 2P: korte titels in hoofdletters
  // Kaarten in het selectiescherm: crème pixelkader met inktrand, gekozen kaart met gele binnenrand.
  card: {
    fill: 0xf4f4ec, edge: 0x1b1f2e, border: 4, radius: 0, shadow: 0x3b4561, selectedShadow: 0x3b4561, shadowX: 6, shadowY: 6,
    selected: 0x1b1f2e, ring: 4, ringColor: 0xf2b22e, text: '#1b1f2e', dim: '#3b4561'
  },
  colors: {
    board: 0xf4f4ec,
    boardEdge: 0x1b1f2e,
    boardShadow: 0x3b4561,
    post: 0x7a4a2a,
    text: '#1b1f2e',
    title: '#2f6f5d',
    dim: '#3b4561',
    // Titels die los in de lucht staan (niet op een bord).
    floatTitle: '#ffe27a',
    floatStroke: '#1b1f2e',
    signText: '#1b1f2e',
    selectTitle: '#1b1f2e',
    selectText: '#1b1f2e',
    marker: 0xffe27a,
    buildings: [0x5b6c8f, 0x8f5b5b, 0x5b8f74, 0x8f7a5b, 0x6c5b8f, 0x5b858f, 0x8f5b80],
    window: 0x1a1430,
    windowLit: 0xffd23f
  },
  createTextures(scene) {
    // Wereld: grastegel, getrapte heuvels, wolken, bord en finishvlag uit het ontwerp.
    pathTexture(scene, 'ground', 64, 64, GROUND, { scale: 4 });
    pathTexture(scene, 'hills', 960, 300, HILLS, { scale: 4, dy: 60 });
    if (!scene.textures.exists('clouds')) {
      const tex = scene.textures.createCanvas('clouds', 960, 160);
      const ctx = tex.getContext();
      for (const [x, y, s] of [[40, 30, 5], [520, 74, 5], [800, 18, 4]]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        for (const [color, d] of CLOUD) { ctx.fillStyle = color; ctx.fill(new Path2D(d)); }
        ctx.restore();
      }
      tex.refresh();
    }
    pathTexture(scene, 'sign', 96, 114, SIGN, { scale: 6 });
    pathTexture(scene, 'flag', 72, 160, FLAG, { scale: 6, dy: 16 });

    pixelTexture(scene, 'flower', [
      '...ooo...',
      '..oPPPo..',
      '.ooPPPoo.',
      'oPPoyoPPo',
      'oPPyYyPPo',
      'oPPoyoPPo',
      '.ooPPPoo.',
      '..oPPPo..',
      '...ooo...',
      '....g....',
      '.gg.g.gg.',
      '..ggggg..'
    ], { o: '#b8336a', P: '#ff7eb6', y: '#ffb400', Y: '#fff3b0', g: '#3fa34d' });

    pixelTexture(scene, 'soil', [
      '.dddddddd.',
      'dDDDDDDDDd',
      'dDdDDDdDDd',
      '.dddddddd.'
    ], { d: '#3d2716', D: '#6b4426' });

    pixelTexture(scene, 'spark', ['.w.', 'wWw', '.w.'], { w: '#ffd23f', W: '#ffffff' });

    const chestPalette = { o: '#3d2716', B: '#a0522d', b: '#7a3d1f', L: '#c0703a', l: '#8a4a22', G: '#ffd23f' };
    pixelTexture(scene, 'chest', [
      'oooooooGGooooooo',
      'oBBBBBBGGBBBBBBo',
      'oBbBBBBBBBBBBbBo',
      'oBBBBBBBBBBBBBBo',
      'oBbBBBBBBBBBBbBo',
      'oBBBBBBBBBBBBBBo',
      'oooooooooooooooo'
    ], chestPalette, 4);
    pixelTexture(scene, 'chestLid', [
      '..oooooooooooo..',
      '.oLLLLLLLLLLLLo.',
      'oLLLLLLLLLLLLLLo',
      'oLlLLLLLLLLLLlLo',
      'oooooooGGooooooo'
    ], chestPalette, 4);

    // Medaille = behaald certificaat.
    pixelTexture(scene, 'medal', [
      'rr....rr',
      '.rr..rr.',
      '..rRRr..',
      '..oGGo..',
      '.oGYYGo.',
      'oGYGGYGo',
      'oGYGGYGo',
      '.oGYYGo.',
      '..oGGo..'
    ], { r: '#e4572e', R: '#b83a1c', o: '#8a5a00', G: '#ffb400', Y: '#fff3b0' }, 3);

    // Afstudeerhoed = diploma.
    pixelTexture(scene, 'cap', [
      '......KK......',
      '....KKBBKK....',
      '..KKBBBBBBKK..',
      'KKBBBBBBBBBBKK',
      '..KKBBBBBBKKy.',
      '....KBBBBK..y.',
      '....KBBBBK..y.',
      '.....KKKK...Y.'
    ], { K: '#1a1430', B: '#3a2d5e', y: '#ffb400', Y: '#ffd23f' }, 3);

    // Ballon (wit, wordt getint) = interesse.
    pixelTexture(scene, 'balloon', [
      '..WWWWW..',
      '.WwWWWWW.',
      'WwwWWWWWW',
      'WwWWWWWWW',
      'WWWWWWWWW',
      'WWWWWWWWW',
      '.WWWWWWW.',
      '..WWWWW..',
      '...WWW...',
      '....W....',
      '....s....',
      '...s.....',
      '....s....',
      '.....s...',
      '....s....'
    ], { W: '#d6d6d6', w: '#ffffff', s: '#5a5a5a' }, 3);

    // Cadeautje = optionele bonus-inhoud (alleen voor wie springt).
    pixelTexture(scene, 'gift', [
      '...kk..kk...',
      '....kkkk....',
      '.bbbbkkbbbb.',
      '.bBBBkkBBBb.',
      '.bbbbkkbbbb.',
      '..pppkkppp..',
      '..pPPkkPPp..',
      '..pPPkkPPp..',
      '..pPPkkPPp..',
      '..pPPkkPPp..',
      '..pppkkppp..'
    ], { k: '#ffd23f', b: '#b8336a', B: '#ff7eb6', p: '#4b3fb3', P: '#8f7cff' }, 3);

    // CI/CD-pipeline (snelreis tussen hoofdstukken): metalen buis met teal band en groene status-led.
    pixelTexture(scene, 'pipeline', [
      'KKKKKKKKKKKKKKKK',
      'KwMMMMMMMMMMMMmK',
      'KMtttttttttttMmK',
      'KMtgttttttttttmK',
      'KmmmmmmmmmmmmmmK',
      'KKKKKKKKKKKKKKKK',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KwMMMMMMMMMMmK.',
      '.KKKKKKKKKKKKKK.'
    ], { K: '#1a1430', w: '#e8eef2', M: '#9aa7b4', m: '#6b7785', t: '#2ec4b6', g: '#7cff6b' }, 3);

    // Wensballon van licht (interesse die opstijgt).
    pixelTexture(scene, 'lantern', [
      '..KKKK..',
      '.KyyyyK.',
      'KyYYYYyK',
      'KyYwwYyK',
      'KyYYYYyK',
      'KyYYYYyK',
      '.KyyyyK.',
      '..KooK..',
      '...oo...'
    ], { K: '#5a2a00', y: '#ff9f1c', Y: '#ffd166', w: '#fff3b0', o: '#ff5400' }, 3);

    // Kampvuur (2 frames voor flakkeren).
    const fire = [
      '....r.....',
      '...rr..r..',
      '...rOr.rr.',
      '..rOOrrOr.',
      '..rOYOrOr.',
      '.rOYYOOOr.',
      '.rOYwYYOr.',
      'rOYwwwYOOr',
      'rOYwwwYYOr',
      '.rOYYYYOr.'
    ];
    const firePal = { r: '#c1121f', O: '#ff6b1a', Y: '#ffd166', w: '#fff3b0' };
    pixelTexture(scene, 'fire0', fire, firePal, 4);
    pixelTexture(scene, 'fire1', fire.map((r) => [...r].reverse().join('')), firePal, 4);

    // Gastheer Martijn (zelfde tekening als het uiterlijk "martijn").
    createHeroTextures(scene, [HOST_CV]);

    // Snelreis-bug: groene kever die je opeet en verderop weer uitspuugt (bek dicht / open).
    const bugPal = { K: '#1b1f2e', G: '#7cc242', g: '#4f8a2a', H: '#5aa62f', w: '#ffffff', k: '#1b1f2e', m: '#2a5a1a', r: '#c1121f' };
    const bugTop = ['...KKKKK........', '..KGGgGGK.......', '.KGgGGGgGKKKK...', 'KGGGGgGGGKHHHK..', 'KGgGGGGGgKHwkHK.'];
    pixelTexture(scene, 'bug0', [...bugTop, 'KGGGgGGGGKHHHHK.', '.KGGGGgGGKHmmHK.', '..KKKKKKKKKKKK..', '..K.K.K..K.K....', '.K..K..K..K..K..'], bugPal, 4);
    pixelTexture(scene, 'bug1', [...bugTop, 'KGGGgGGGGKHHHKK.', '.KGGGGgGGKHrrrK.', '..KKKKKKKKKHHHK.', '...K.K.K..K.K...', '..K..K..K..K..K.'], bugPal, 4);
  }
};
