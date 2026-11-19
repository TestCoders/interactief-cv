import { label, pop } from './draw.js';

// Bonus-inhoud: een zwevend cadeautje boven het pad. Niet nodig om het CV te begrijpen,
// wel een leuke extra voor wie springt (spatie / ↑, of tikken op het cadeautje).
export default class Bonus {
  constructor(scene, x, groundY, { titel, items }, theme) {
    Object.assign(this, { scene, x, theme, titel, items, opened: false });
    this.gift = scene.physics.add.staticImage(x, groundY - 178, theme.tex('gift')).setDepth(6);
    this.gift.refreshBody();
    scene.tweens.add({ targets: this.gift, y: this.gift.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.gift.setInteractive({ useHandCursor: true }).on('pointerdown', () => scene.requestJump());
    this.hint = label(scene, x, groundY - 225, '▲ SPRING', theme, { size: 12, color: '#ffffff' }).setOrigin(0.5).setStroke('#1a1430', 5).setAlpha(0).setDepth(6);
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
    scene.tweens.killTweensOf(this.gift);
    this.gift.disableBody(true, false);
    scene.tweens.add({ targets: this.gift, scale: 1.6, alpha: 0, duration: 260, ease: 'Quad.out' });

    // Kaartje met de extra inhoud, boven het cadeautje.
    const items = this.items.slice(0, 12);
    const cols = items.length > 6 ? 2 : 1;
    const colW = cols === 2 ? 200 : 240;
    const rows = Math.ceil(items.length / cols);
    const w = cols * colW + 28;
    const h = 44 + rows * 20 + 10;
    const g = scene.add.graphics();
    g.fillStyle(0x1a1430).fillRect(-w / 2 + 4, -h + 4, w, h);
    g.fillStyle(0xffd23f).fillRect(-w / 2 - 3, -h - 3, w + 6, h + 6);
    g.fillStyle(0x2b2147).fillRect(-w / 2, -h, w, h);
    const parts = [g, label(scene, 0, -h + 12, `🎁 ${this.titel}`, theme, { size: 14, color: '#ffd23f' }).setOrigin(0.5, 0)];
    items.forEach((it, i) => {
      const col = Math.floor(i / rows);
      const row = i % rows;
      const txt = it.length > 26 ? it.slice(0, 25) + '…' : it;
      parts.push(label(scene, -w / 2 + 14 + col * colW, -h + 40 + row * 20, `· ${txt}`, theme, { size: 12, bold: false }));
    });
    const card = scene.add.container(this.x, this.gift.y + 20, parts).setDepth(8);
    pop(scene, card, 80, 380);
    scene.tweens.add({ targets: card, y: card.y - 6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: 500 });
    scene.onBonusOpened?.();
  }
}
