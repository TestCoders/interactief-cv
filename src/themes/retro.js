import { pixelTexture } from '../pixel.js';

// Thema "retro pixel-art". Een thema levert kleuren, font en textures;
// de set pieces (src/pieces) gebruiken alleen deze sleutels, zodat elke stijl dezelfde gameplay heeft.
export default {
  name: 'retro',
  label: 'Retro',
  audio: 'retro', // geluidspakket in src/audio/packs
  tex: (key) => key, // retro-textures staan onder hun kale naam (deels gemaakt in BootScene)
  // Dag → avond (zie LevelScene.updateSky)
  sky: { dag: 0x9fd6ff, middag: 0xbfe0f0, zonsondergang: 0xff9e7a, avond: 0x2b2147 },
  tint: { dag: 0xffffff, zonsondergang: 0xffc6a8, avond: 0x5a4f8a },
  // DOM-overlay (tekstbox, knoppen, HUD)
  css: {
    '--pixel-font': '"Courier New", ui-monospace, monospace',
    '--box': '#2b2147', '--box-hover': '#3a2d5e', '--box-text': '#f4e4c1',
    '--box-title': '#ffd23f', '--box-dim': '#8f86b3', '--box-shadow': '#1a1430'
  },
  font: '"Courier New", ui-monospace, monospace',
  colors: {
    board: 0x2b2147,
    boardEdge: 0xf4e4c1,
    boardShadow: 0x1a1430,
    post: 0x7a5230,
    text: '#f4e4c1',
    title: '#ffd23f',
    dim: '#8f86b3',
    buildings: [0x5b6c8f, 0x8f5b5b, 0x5b8f74, 0x8f7a5b, 0x6c5b8f, 0x5b858f, 0x8f5b80],
    window: 0x1a1430,
    windowLit: 0xffd23f
  },
  createTextures(scene) {
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
  }
};
