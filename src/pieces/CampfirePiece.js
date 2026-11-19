import Phaser from 'phaser';
import { label, shorten, pop } from './draw.js';
import { TESTCODERS } from '../testcoders.js';
import { heroKey } from '../heroes.js';

// Finale "Na het werk": het is avond, het team zit rond het kampvuur (werkplezier) en
// de interesses stijgen als wensballonnen van licht op naar de sterrenhemel.
// Eén collega praat tegelijk: rustig en leesbaar, geen gespring.
const SEATS = [-190, -110, 110, 190];

export default class CampfirePiece {
  static width() { return 980; }

  constructor(scene, x, groundY, station, theme) {
    Object.assign(this, { scene, x, theme, done: false, timers: [] });
    const { interesses } = station.data;
    const voornaam = scene.cv.naam.split(' ')[0];
    this.stopX = x - 140; // vuur en wensballonnen gecentreerd in beeld
    this.duration = 1400; // titel + eerste wensballonnen; het gesprek loopt daarna gewoon door
    this.groundY = groundY;

    // Gloed + vuur + houtblokken.
    this.glow = scene.add.circle(x, groundY - 20, 120, 0xff9f1c, 0.18).setBlendMode(Phaser.BlendModes.ADD);
    this.glow2 = scene.add.circle(x, groundY - 20, 60, 0xffd166, 0.25).setBlendMode(Phaser.BlendModes.ADD);
    const logs = scene.add.graphics();
    logs.fillStyle(0x5a3a22).fillRect(x - 30, groundY - 10, 60, 10);
    logs.fillStyle(0x7a5230).fillRect(x - 24, groundY - 16, 48, 8);
    this.fire = scene.add.image(x, groundY - 12, theme.tex('fire0')).setOrigin(0.5, 1);
    scene.time.addEvent({ delay: 160, loop: true, callback: () => this.fire.setTexture(this.fire.texture.key === theme.tex('fire0') ? theme.tex('fire1') : theme.tex('fire0')) });
    scene.tweens.add({ targets: [this.glow, this.glow2], scale: 1.12, alpha: '+=0.05', duration: 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Collega's op boomstammen, gezicht naar het vuur.
    const others = (scene.registry.get('cvs') ?? []).filter((c) => c.id !== scene.cv.id);
    const bench = scene.add.graphics();
    this.people = SEATS.map((dx, i) => {
      bench.fillStyle(0x5a3a22).fillRect(x + dx - 26, groundY - 12, 52, 12);
      const other = others[i % Math.max(1, others.length)];
      // Zelfde soort held als de speler in dit thema (pixel-held of kantoorheld).
      const key = theme.tex(heroKey(other ?? scene.cv));
      const s = scene.add.sprite(x + dx, groundY - 8, key, 'idle0').setOrigin(0.5, theme.heroOriginY ?? 1)
        .setScale(theme.heroScale ?? 3).play(`${key}-idle`).setFlipX(dx > 0);
      if (!other) s.setTint([0xe4572e, 0x6c5ce7, 0xffb400, 0x2e86de][i]);
      return s;
    });

    // Tekstballon (één tegelijk) met de pijlers van werkplezier.
    const t = label(scene, 0, 0, '', theme, { size: 13, color: '#1a1430', wrap: 170, align: 'center' }).setOrigin(0.5);
    const bg = scene.add.rectangle(0, 0, 190, 44, 0xffffff).setStrokeStyle(3, 0x1a1430);
    const tail = scene.add.triangle(0, 30, -8, 0, 8, 0, 0, 10, 0xffffff);
    this.bubble = scene.add.container(x, groundY - 120, [bg, tail, t]).setDepth(6).setScale(0);
    this.bubbleText = t;
    this.bubbleBg = bg;
    this.bubbleTail = tail;
    this.lines = TESTCODERS.werkplezier;

    this.title = label(scene, x, groundY - 420, 'NA HET WERK', theme, { size: 22, color: theme.colors.floatTitle ?? '#ffd23f' }).setOrigin(0.5).setStroke(theme.colors.floatStroke ?? '#1a1430', 6).setScale(0);
    this.subtitle = label(scene, x, groundY - 392, `Waar ${voornaam} warm voor loopt — en het team van TestCoders`, theme, { size: 13, color: '#f4e4c1' })
      .setOrigin(0.5).setStroke('#1a1430', 4).setAlpha(0);

    // Wensballonnen met de interesses (vooraf aangemaakt, onzichtbaar bij het vuur).
    const n = Math.min(8, interesses.length);
    this.lanterns = interesses.slice(0, n).map((txt, i) => {
      const glow = scene.add.circle(0, 0, 18, 0xffb347, 0.12).setBlendMode(Phaser.BlendModes.ADD);
      const img = scene.add.image(0, 0, theme.tex('lantern'));
      const tl = label(scene, 0, 22, shorten(txt, 34), theme, { size: 12, color: '#ffe8b0', wrap: 150, align: 'center' }).setOrigin(0.5, 0).setStroke('#1a1430', 4);
      const c = scene.add.container(x, groundY - 30, [glow, img, tl]).setAlpha(0).setScale(0.4);
      const spread = n > 1 ? (i / (n - 1)) * 2 - 1 : 0; // -1..1
      c.target = { x: x + spread * 380, y: groundY - 210 - (i % 2) * 80 - Math.abs(spread) * 20 };
      return c;
    });
  }

  say(i) {
    const p = this.people[i % this.people.length];
    this.bubbleText.setText(this.lines[i % this.lines.length]);
    const h = this.bubbleText.height + 18;
    this.bubbleBg.setSize(190, h);
    this.bubbleTail.setY(h / 2 + 4);
    this.bubble.setPosition(p.x, p.y - 70 - h / 2);
    this.scene.tweens.killTweensOf(this.bubble);
    this.bubble.setScale(0);
    this.scene.tweens.add({ targets: this.bubble, scale: 1, duration: 260, ease: 'Back.out' });
    this.scene.tweens.add({ targets: p, y: p.y - 6, duration: 120, yoyo: true, repeat: 1 }); // knikje terwijl hij praat
  }

  enter() {
    const { scene } = this;
    if (!this.done) {
      this.done = true;
      pop(scene, this.title.setScale(1), 0, 500);
      scene.tweens.add({ targets: this.subtitle, alpha: 1, duration: 600, delay: 400 });
      this.lanterns.forEach((c, i) => {
        scene.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 400, delay: 600 + i * 650 });
        scene.tweens.add({
          targets: c, x: c.target.x, y: c.target.y, duration: 2600, delay: 600 + i * 650, ease: 'Sine.out',
          onComplete: () => scene.tweens.add({ targets: c, y: c.target.y - 10, duration: 1800 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
        });
      });
    }
    // Gesprek: om de beurt één regel, zolang je bij het vuur bent.
    let i = 0;
    this.say(i++);
    this.timers.push(scene.time.addEvent({ delay: 2600, loop: true, callback: () => this.say(i++) }));
  }

  leave() {
    this.timers.forEach((t) => t.remove());
    this.timers = [];
    this.scene.tweens.add({ targets: this.bubble, scale: 0, duration: 200 });
  }
}
