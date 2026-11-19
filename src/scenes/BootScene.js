import Phaser from 'phaser';
import { createHeroTextures } from '../heroes.js';

// Genereert alle textures met code, zodat er geen assets nodig zijn om te starten.
// Vervang later gerust door echte sprites: this.load.image('player', 'assets/player.png') in preload().
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    const cvs = this.registry.get('cvs');

    // Spelers: één pixel-art held per CV, met animaties (zie src/heroes.js).
    createHeroTextures(this, cvs);

    const g = this.make.graphics({ add: false });

    // Grond-tegel: gras + aarde.
    g.fillStyle(0x7a5230).fillRect(0, 0, 64, 64);
    g.fillStyle(0x6a4628).fillRect(8, 30, 10, 6).fillRect(40, 46, 12, 6);
    g.fillStyle(0x4caf50).fillRect(0, 0, 64, 14);
    g.fillStyle(0x66c56a).fillRect(0, 0, 64, 5);
    g.generateTexture('ground', 64, 64).clear();

    // Zwevend platform.
    g.fillStyle(0x7a5230).fillRoundedRect(0, 4, 128, 18, 6);
    g.fillStyle(0x4caf50).fillRoundedRect(0, 0, 128, 10, 5);
    g.generateTexture('platform', 128, 22).clear();

    // Munt (= skill).
    g.fillStyle(0xe0a800).fillCircle(12, 12, 12);
    g.fillStyle(0xffd23f).fillCircle(12, 12, 9);
    g.fillStyle(0xfff3b0).fillRect(9, 6, 3, 12);
    g.generateTexture('coin', 24, 24).clear();

    // Bord (= CV-checkpoint).
    g.fillStyle(0x7a5230).fillRect(44, 50, 8, 60);
    g.fillStyle(0x3c8772).fillRoundedRect(0, 0, 96, 56, 8);
    g.fillStyle(0xffffff, 0.9).fillRoundedRect(6, 6, 84, 44, 6);
    g.generateTexture('sign', 96, 110).clear();

    // Finishvlag.
    g.fillStyle(0xdddddd).fillRect(0, 0, 6, 160);
    g.fillStyle(0x3c8772).fillTriangle(6, 4, 70, 26, 6, 48);
    g.generateTexture('flag', 72, 160).clear();

    // Achtergrond: heuvels en wolken (tileable).
    g.fillStyle(0x86c5a3);
    g.fillEllipse(120, 200, 360, 220).fillEllipse(450, 210, 300, 160).fillEllipse(760, 190, 420, 260);
    g.fillStyle(0x6fb391).fillRect(0, 200, 960, 100);
    g.generateTexture('hills', 960, 300).clear();

    g.fillStyle(0xffffff, 0.95);
    g.fillEllipse(120, 60, 120, 40).fillEllipse(160, 50, 90, 50);
    g.fillEllipse(560, 90, 140, 44).fillEllipse(600, 78, 90, 50);
    g.generateTexture('clouds', 960, 160).clear();

    g.destroy();

    // ?cv=<id> in de URL slaat het selectiescherm over (deelbare link per persoon).
    const wanted = new URLSearchParams(location.search).get('cv');
    const direct = cvs.find((c) => c.id === wanted) ?? (cvs.length === 1 ? cvs[0] : null);
    if (direct) this.scene.start('level', { cv: direct });
    else this.scene.start('select');
  }
}
