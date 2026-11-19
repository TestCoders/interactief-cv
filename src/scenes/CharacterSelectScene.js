import Phaser from 'phaser';
import { SCENES } from '../config/gameConfig.js';
import { heroKey } from '../graphics/heroSprites.js';
import { audio } from '../audio/index.js';
import { THEMES } from '../themes/index.js';
import { textStyle } from '../pieces/draw.js';

const GROUND_H = 64;

// Karakterselectie: één karakter per CV-bestand, in de wereld en stijl van het gekozen thema
// (zie design/<stijl>/selectiescherm.html).
export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.characterSelect);
  }

  create() {
    const theme = THEMES[this.registry.get('theme')] ?? THEMES.retro;
    this.theme = theme;
    theme.createTextures(this);
    const { width, height } = this.scale;
    const cvs = this.registry.get('cvs');
    const { colors } = theme;
    const card = theme.card;
    this.index = 0;

    // Wereld: lucht, wolken, heuvels of skyline, grond.
    const groundTop = height - GROUND_H;
    this.cameras.main.setBackgroundColor(theme.sky.dag);
    this.add.tileSprite(0, 20, width, 160, theme.tex('clouds')).setOrigin(0, 0);
    this.add.tileSprite(0, groundTop - 260, width, 300, theme.tex('hills')).setOrigin(0, 0);
    this.add.tileSprite(0, groundTop, width, GROUND_H, theme.tex('ground')).setOrigin(0, 0);

    // Titel.
    const title = this.add.text(width / 2, 64, theme.titleUpper ? 'SPEEL MIJN CV' : 'Speel mijn cv', {
      fontFamily: theme.titleFont ?? theme.font, fontSize: theme.titleUpper ? '30px' : '40px', fontStyle: 'bold', color: colors.selectTitle
    }).setOrigin(0.5);
    if (theme.titleUpper) title.setShadow(4, 4, '#f4f4ec', 0, false, true);
    this.add.text(width / 2, 112, 'Kies een TestCoder · ← → en Enter', textStyle(theme, 16, {
      bold: false, color: colors.selectText, backgroundColor: 'rgba(255,255,255,0.85)', padding: { x: 10, y: 5 }
    })).setOrigin(0.5);

    // Kaarten met de helden.
    const gap = Math.min(240, (width - 80) / Math.max(cvs.length, 1));
    const cardW = Math.min(212, gap - 24);
    const cardH = 236;
    const top = Math.max(150, Math.min(groundTop - cardH - 50, 200));
    const startX = width / 2 - (gap * (cvs.length - 1)) / 2;
    const heroScale = (theme.heroScale ?? 3) * (theme.heroScale ? 1.25 : 5 / 3);

    this.cards = cvs.map((cv, i) => {
      const x = startX + i * gap;
      const bg = this.add.graphics();
      const key = theme.tex(heroKey(cv));
      const sprite = this.add.sprite(x, top + 140, key, 'idle0').setOrigin(0.5, theme.heroOriginY ?? 1).setScale(heroScale).play(`${key}-idle`);
      const name = this.add.text(x, top + 154, cv.naam, textStyle(theme, 18, {
        color: card.text, align: 'center', wordWrap: { width: cardW - 16 }
      })).setOrigin(0.5, 0);
      const rol = this.add.text(x, top + 186, cv.rol, textStyle(theme, 14, {
        bold: false, color: card.dim, align: 'center', wordWrap: { width: cardW - 16 }
      })).setOrigin(0.5, 0);
      const hit = this.add.zone(x, top + cardH / 2, cardW, cardH).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.choose(i));
      return { x, bg, sprite, name, rol, hit };
    });
    this.cardBox = { w: cardW, h: cardH, top };

    // Pijl boven de gekozen kaart.
    this.marker = this.add.triangle(0, 0, 0, 0, 24, 0, 12, 16, colors.marker ?? 0x3c8772).setStrokeStyle(theme.titleUpper ? 3 : 0, 0x1b1f2e);
    this.highlight();

    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-ENTER', () => this.choose(this.index));
    kb.on('keydown-SPACE', () => this.choose(this.index));
  }

  /** Kaart tekenen: pixelkader met inktrand (retro) of witte kaart met isometrische rand (zakelijk). */
  drawCard(c, selected) {
    const { card } = this.theme;
    const { w, h, top } = this.cardBox;
    const left = c.x - w / 2;
    const g = c.bg.clear();
    const edge = selected ? card.selected : card.edge;
    const r = card.radius;
    g.fillStyle(selected ? card.selectedShadow : card.shadow).fillRoundedRect(left + card.shadowX, top + card.shadowY, w, h, r);
    g.fillStyle(edge).fillRoundedRect(left - card.border, top - card.border, w + card.border * 2, h + card.border * 2, r + card.border);
    g.fillStyle(card.fill).fillRoundedRect(left, top, w, h, r);
    if (selected && card.ring) g.lineStyle(card.ring, card.ringColor).strokeRoundedRect(left + card.ring / 2, top + card.ring / 2, w - card.ring, h - card.ring, Math.max(0, r - 2));
  }

  move(dir) {
    this.index = Phaser.Math.Wrap(this.index + dir, 0, this.cards.length);
    this.highlight();
    audio.play('select');
  }

  highlight() {
    this.cards.forEach((c, i) => {
      const on = i === this.index;
      c.sprite.setAlpha(on ? 1 : 0.6);
      this.drawCard(c, on);
    });
    const c = this.cards[this.index];
    this.marker.setPosition(c.x, this.cardBox.top - 24);
  }

  choose(i) {
    const cv = this.registry.get('cvs')[i];
    const url = new URL(location.href);
    url.searchParams.set('cv', cv.id);
    history.replaceState(null, '', url);
    audio.play('confirm');
    this.scene.start(SCENES.level, { cv });
  }
}
