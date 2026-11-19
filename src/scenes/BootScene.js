import Phaser from 'phaser';
import { SCENES } from '../config/gameConfig.js';
import { createHeroTextures } from '../graphics/heroSprites.js';
import { createWorldTextures } from '../graphics/worldTextures.js';

// Maakt alle textures aan en kiest daarna de eerste scene.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create() {
    const cvs = this.registry.get('cvs');

    // Spelers: één pixel-art held per CV, met animaties (zie src/graphics/heroSprites.js).
    createHeroTextures(this, cvs);
    createWorldTextures(this);

    // ?cv=<id> in de URL slaat het selectiescherm over (deelbare link per persoon).
    const wanted = new URLSearchParams(location.search).get('cv');
    const direct = cvs.find((c) => c.id === wanted) ?? (cvs.length === 1 ? cvs[0] : null);
    if (direct) this.scene.start(SCENES.level, { cv: direct });
    else this.scene.start(SCENES.characterSelect);
  }
}
