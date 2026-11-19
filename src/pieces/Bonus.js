import Phaser from 'phaser';
import { label, pop, pixelBox } from './draw.js';
import { audio } from '../audio/index.js';

const CARD_MARGIN = 12; // minimale ruimte tussen het kaartje en het bord ernaast
const CARD_NEAR = 170; // binnen deze afstand van het cadeautje is het kaartje zichtbaar

// Bonus-inhoud: een zwevend cadeautje boven het pad. Niet nodig om het CV te begrijpen,
// wel een leuke extra voor wie springt (spatie / ↑, of tikken op het cadeautje).
export default class Bonus {
  constructor(scene, x, groundY, { titel, items }, theme) {
    Object.assign(this, { scene, x, theme, titel, items, opened: false });
    this.gift = scene.physics.add.staticImage(x, groundY - 178, theme.tex('gift')).setDepth(6);
    this.gift.refreshBody();
    scene.tweens.add({ targets: this.gift, y: this.gift.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.gift.setInteractive({ useHandCursor: true }).on('pointerdown', () => scene.requestJump());
    this.hint = label(scene, x, groundY - 225, '▲ SPRING', theme, { size: 12, color: '#ffffff' }).setOrigin(0.5).setStroke(theme.colors.floatStroke ?? '#1a1430', 5).setAlpha(0).setDepth(6);
    scene.tweens.add({ targets: this.hint, alpha: { from: 0.3, to: 1 }, duration: 450, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    this.hint.setVisible(false);
    this.sparks = scene.add.particles(0, 0, theme.tex('spark'), { speed: { min: 80, max: 260 }, lifespan: 600, scale: { start: 1.6, end: 0 }, gravityY: 300, emitting: false }).setDepth(7);
  }

  showHint(on) { if (!this.opened) this.hint.setVisible(on); }

  open() {
    if (this.opened) return;
    this.opened = true;
    const { scene, theme } = this;
    this.hint.destroy();
    this.sparks.explode(26, this.gift.x, this.gift.y);
    audio.play('bonus');
    scene.tweens.killTweensOf(this.gift);
    this.gift.disableBody(true, false);
    const openKey = theme.tex('giftOpen');
    if (scene.textures.exists(openKey)) {
      // Koffertje klapt open en blijft staan (zakelijk thema).
      this.gift.setTexture(openKey);
      scene.tweens.add({ targets: this.gift, scale: 1.2, duration: 140, yoyo: true, ease: 'Back.out' });
    } else {
      scene.tweens.add({ targets: this.gift, scale: 1.6, alpha: 0, duration: 260, ease: 'Quad.out' });
    }

    // Kaartje met de extra inhoud, boven het cadeautje. Smal genoeg om tussen de buren te passen
    // (niet over het bord van een ander onderdeel) en laag genoeg om onder de HUD te blijven.
    const items = this.items.slice(0, 12);
    const cols = items.length > 6 ? 2 : 1;
    const colW = cols === 2 ? 148 : 240;
    const maxChars = cols === 2 ? 19 : 26;
    const rows = Math.ceil(items.length / cols);
    const rowH = Math.round(20 * Math.max(1, (theme.fontScale ?? 1) * 0.85));
    const w = cols * colW + 28;
    const h = 44 + rows * rowH + 10;
    const g = scene.add.graphics();
    const { colors } = theme;
    g.fillStyle(colors.boardShadow).fillRect(-w / 2 + 4, -h + 4, w, h);
    g.fillStyle(colors.boardEdge).fillRect(-w / 2 - 3, -h - 3, w + 6, h + 6);
    g.fillStyle(colors.board).fillRect(-w / 2, -h, w, h);
    const parts = [g, label(scene, 0, -h + 12, `🎁 ${this.titel}`, theme, { size: 14, color: colors.title }).setOrigin(0.5, 0)];
    items.forEach((it, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const txt = it.length > maxChars ? it.slice(0, maxChars - 1) + '…' : it;
      parts.push(label(scene, -w / 2 + 14 + col * colW, -h + 40 + row * rowH, `· ${txt}`, theme, { size: 12, bold: false }));
    });
    const card = scene.add.container(this.cardX(w), this.gift.y + 20, parts).setDepth(8);
    this.card = card;
    this.cardVisible = true;
    pop(scene, card, 80, 380);
    scene.tweens.add({ targets: card, y: card.y - 6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 500 });
    scene.onBonusOpened?.();
  }

  /** Midden van het kaartje: zo dicht mogelijk boven het cadeautje, maar binnen de ruimte tussen de buren. */
  cardX(w) {
    const pieces = this.scene.pieces ?? [];
    const prevRight = Math.max(-Infinity, ...pieces.filter((p) => p.x < this.x).map((p) => p.x + (p.halfWidth ?? 0)));
    const nextLeft = Math.min(Infinity, ...pieces.filter((p) => p.x > this.x).map((p) => p.x - (p.halfWidth ?? 0)));
    const lo = prevRight + w / 2 + CARD_MARGIN;
    const hi = nextLeft - w / 2 - CARD_MARGIN;
    if (lo <= hi) return Phaser.Math.Clamp(this.x, lo, hi);
    return Number.isFinite(prevRight + nextLeft) ? (prevRight + nextLeft) / 2 : this.x;
  }

  /** Het kaartje is er alleen als je bij het cadeautje staat; loop je door, dan vervaagt het (en het bord erachter is leesbaar). */
  follow(playerX) {
    if (!this.card) return;
    const near = Math.abs(playerX - this.x) < CARD_NEAR;
    if (near === this.cardVisible) return;
    this.cardVisible = near;
    this.scene.tweens.add({ targets: this.card, alpha: near ? 1 : 0, duration: 250, ease: 'Quad.out' });
  }
}
