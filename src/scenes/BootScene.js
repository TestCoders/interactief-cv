import Phaser from 'phaser';
import { SCENES } from '../config/gameConfig.js';
import { createHeroTextures } from '../graphics/heroSprites.js';
import { createWorldTextures } from '../graphics/worldTextures.js';

// Fonts van de gamestijlen (geladen via index.html). Eerst laden, anders tekent Phaser de tekst in een reservefont.
const FONTS = ['16px "Jersey 10"', '16px "Press Start 2P"', '16px "Pixelify Sans"', '700 16px "Pixelify Sans"', '700 16px "Space Grotesk"', '16px Inter'];
const FONT_TIMEOUT_MS = 1500;

// Maakt de gedeelde textures; de wereld (grond, lucht, set pieces) tekent elk thema zelf in createTextures().
export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create() {
    const cvs = this.registry.get('cvs');

    // Spelers: één pixel-art held per CV, met animaties (zie src/graphics/heroSprites.js). De hitbox gebruikt altijd deze held.
    createHeroTextures(this, cvs);
    createWorldTextures(this);

    const fontsLoaded = document.fonts
      ? Promise.all(FONTS.map((f) => document.fonts.load(f))).catch(() => {})
      : Promise.resolve();
    Promise.race([fontsLoaded, new Promise((r) => setTimeout(r, FONT_TIMEOUT_MS))]).then(() => this.start(cvs));
  }

  start(cvs) {
    // ?cv=<id> in de URL slaat het selectiescherm over (deelbare link per persoon).
    const wanted = new URLSearchParams(location.search).get('cv');
    const direct = cvs.find((c) => c.id === wanted) ?? (cvs.length === 1 ? cvs[0] : null);
    if (direct) this.scene.start(SCENES.level, { cv: direct });
    else this.scene.start(SCENES.characterSelect);
  }
}
