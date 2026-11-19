import Phaser from 'phaser';
import { CHARACTER_SELECT, SCENES } from '../config/gameConfig.js';
import { heroAnim, heroKey } from '../graphics/heroSprites.js';
import { TEXTURES } from '../graphics/worldTextures.js';

// Karakterselectie: één karakter per CV-bestand.
export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.characterSelect);
  }

  create() {
    const { width, height } = this.scale;
    const cvs = this.registry.get('cvs');
    this.index = 0;

    this.add.tileSprite(0, height - 300, width, 300, TEXTURES.hills).setOrigin(0, 0);
    this.add.text(width / 2, 70, 'Speel mijn CV', { fontFamily: 'system-ui', fontSize: '44px', fontStyle: 'bold', color: CHARACTER_SELECT.textColor }).setOrigin(0.5);
    this.add.text(width / 2, 118, 'Kies een TestCoder  ·  ← →  en  Enter', { fontFamily: 'system-ui', fontSize: '18px', color: CHARACTER_SELECT.textColor }).setOrigin(0.5);

    const gap = Math.min(CHARACTER_SELECT.maxCardGap, (width - 120) / Math.max(cvs.length, 1));
    const startX = width / 2 - (gap * (cvs.length - 1)) / 2;

    this.cards = cvs.map((cv, i) => {
      const x = startX + i * gap;
      const key = heroKey(cv);
      const sprite = this.add.sprite(x, 260, key, 'idle0').setScale(CHARACTER_SELECT.heroScale).play(heroAnim(key, 'idle'));
      const name = this.add.text(x, 330, cv.naam, { fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold', color: CHARACTER_SELECT.textColor, align: 'center', wordWrap: { width: gap - 10 } }).setOrigin(0.5, 0);
      const role = this.add.text(x, 372, cv.rol, { fontFamily: 'system-ui', fontSize: '13px', color: CHARACTER_SELECT.textColor, align: 'center', wordWrap: { width: gap - 10 } }).setOrigin(0.5, 0);
      sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.choose(i));
      return { sprite, name, role };
    });

    this.marker = this.add.triangle(0, 0, 0, 0, 24, 0, 12, 16, 0x3c8772);
    this.highlight();

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-ENTER', () => this.choose(this.index));
    kb.on('keydown-SPACE', () => this.choose(this.index));
  }

  move(dir) {
    this.index = Phaser.Math.Wrap(this.index + dir, 0, this.cards.length);
    this.highlight();
  }

  highlight() {
    this.cards.forEach((c, i) => c.sprite.setAlpha(i === this.index ? 1 : CHARACTER_SELECT.dimmedAlpha));
    const s = this.cards[this.index].sprite;
    this.marker.setPosition(s.x, s.y - 80);
  }

  choose(i) {
    const cv = this.registry.get('cvs')[i];
    const url = new URL(location.href);
    url.searchParams.set('cv', cv.id);
    history.replaceState(null, '', url);
    this.scene.start(SCENES.level, { cv });
  }
}
