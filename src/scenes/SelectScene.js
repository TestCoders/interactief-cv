import Phaser from 'phaser';
import { heroKey } from '../heroes.js';
import { audio } from '../audio/index.js';

// Karakterselectie: één karakter per CV-bestand.
export default class SelectScene extends Phaser.Scene {
  constructor() {
    super('select');
  }

  create() {
    const { width, height } = this.scale;
    const cvs = this.registry.get('cvs');
    this.index = 0;

    this.add.tileSprite(0, height - 300, width, 300, 'hills').setOrigin(0, 0);
    this.add.text(width / 2, 70, 'Speel mijn CV', { fontFamily: 'system-ui', fontSize: '44px', fontStyle: 'bold', color: '#1d2433' }).setOrigin(0.5);
    this.add.text(width / 2, 118, 'Kies een TestCoder  ·  ← →  en  Enter', { fontFamily: 'system-ui', fontSize: '18px', color: '#1d2433' }).setOrigin(0.5);

    const gap = Math.min(180, (width - 120) / Math.max(cvs.length, 1));
    const startX = width / 2 - (gap * (cvs.length - 1)) / 2;

    this.cards = cvs.map((cv, i) => {
      const x = startX + i * gap;
      const sprite = this.add.sprite(x, 260, heroKey(cv), 'idle0').setScale(5).play(`${heroKey(cv)}-idle`);
      const name = this.add.text(x, 330, cv.naam, { fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold', color: '#1d2433', align: 'center', wordWrap: { width: gap - 10 } }).setOrigin(0.5, 0);
      const rol = this.add.text(x, 372, cv.rol, { fontFamily: 'system-ui', fontSize: '13px', color: '#1d2433', align: 'center', wordWrap: { width: gap - 10 } }).setOrigin(0.5, 0);
      sprite.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.choose(i));
      return { sprite, name, rol };
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
    audio.play('select');
  }

  highlight() {
    this.cards.forEach((c, i) => c.sprite.setAlpha(i === this.index ? 1 : 0.55));
    const s = this.cards[this.index].sprite;
    this.marker.setPosition(s.x, s.y - 80);
  }

  choose(i) {
    const cv = this.registry.get('cvs')[i];
    const url = new URL(location.href);
    url.searchParams.set('cv', cv.id);
    history.replaceState(null, '', url);
    audio.play('confirm');
    this.scene.start('level', { cv });
  }
}
