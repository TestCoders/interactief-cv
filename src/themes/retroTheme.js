import { pixelTexture } from '../graphics/pixelTexture.js';

// Thema "retro pixel-art". Een thema levert kleuren, font en textures;
// de set pieces (src/pieces) gebruiken alleen deze sleutels, zodat elke stijl dezelfde gameplay heeft.
export default {
  name: 'retro',
  font: '"Courier New", ui-monospace, monospace',
  colors: {
    board: 0x2b2147,
    boardEdge: 0xf4e4c1,
    boardShadow: 0x1a1430,
    post: 0x7a5230,
    text: '#f4e4c1',
    title: '#ffd23f',
    dim: '#8f86b3'
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
  }
};
