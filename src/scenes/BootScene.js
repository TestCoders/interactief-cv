import Phaser from 'phaser';
import { SCENES } from '../config/gameConfig.js';
import { createHeroTextures } from '../graphics/heroSprites.js?avatar-flow';
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

    this.scene.start(SCENES.level, { cv: this.registry.get('currentCv') });
  }
}
