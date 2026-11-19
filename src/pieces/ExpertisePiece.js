import { EXPERTISE } from '../config/pieceConfig.js';
import Phaser from 'phaser';

// Expertise: een schatkist die schudt, openklapt en de expertises één voor één
// als zwevende badges naar buiten laat vliegen. Inhoud staat in de wereld zelf (geen tekstbox).
const stars = (score) => (score >= 5 ? ' ★★★' : score >= 3 ? ' ★★' : score > 0 ? ' ★' : '');

export default class ExpertisePiece {
  static width(station) { return station.data.length > EXPERTISE.perColumn ? 2 * EXPERTISE.columnDx + 380 : 420; }

  constructor(scene, x, groundY, station, theme) {
    this.scene = scene;
    this.x = x;
    this.range = 170;
    this.stopX = x - 140;
    this.done = false;
    const { colors, font } = theme;

    this.chest = scene.add.image(x, groundY, 'chest').setOrigin(0.5, 1);
    // Deksel scharniert aan de achterkant (links), zodat hij naar achteren openklapt.
    const lidLeft = x - this.chest.width / 2;
    this.lid = scene.add.image(lidLeft, groundY - this.chest.height + 4, 'chestLid').setOrigin(0, 1);
    this.mouth = { x, y: groundY - this.chest.height };

    this.title = scene.add.text(x, 0, '★ EXPERTISE ★', {
      fontFamily: font, fontSize: '18px', fontStyle: 'bold', color: colors.title, stroke: '#1a1430', strokeThickness: 6
    }).setOrigin(0.5).setScale(0);

    const items = station.data.slice(0, EXPERTISE.perColumn * 2);
    const cols = items.length > EXPERTISE.perColumn ? 2 : 1;
    const rows = Math.ceil(items.length / cols);
    const stackTop = groundY - this.chest.height - 70 - (rows - 1) * EXPERTISE.badgeGap;
    this.title.setY(stackTop - 44);

    this.badges = items.map((item, i) => {
      const naam = (item.naam ?? item).replace(/^Branchekennis: /, 'Branche: ');
      const label = (naam.length > 24 ? naam.slice(0, 23) + '…' : naam) + stars(item.score ?? 0);
      const text = scene.add.text(0, 0, label, { fontFamily: font, fontSize: '14px', fontStyle: 'bold', color: colors.text }).setOrigin(0.5);
      const w = text.width + 28;
      const h = text.height + 14;
      const g = scene.add.graphics();
      g.fillStyle(colors.boardShadow).fillRect(-w / 2 + 4, -h / 2 + 4, w, h);
      g.fillStyle(colors.boardEdge).fillRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6);
      g.fillStyle(colors.board).fillRect(-w / 2, -h / 2, w, h);
      const badge = scene.add.container(this.mouth.x, this.mouth.y, [g, text]).setScale(0).setDepth(3);
      // Licht zigzaggend gestapeld, zodat het een speels torentje wordt.
      const col = cols === 2 ? Math.floor(i / rows) : 0;
      const row = cols === 2 ? i % rows : i;
      const cx = cols === 2 ? x + (col === 0 ? -EXPERTISE.columnDx : EXPERTISE.columnDx) : x;
      badge.target = { x: cx + (row % 2 === 0 ? -10 : 10), y: stackTop + row * EXPERTISE.badgeGap };
      return badge;
    });

    this.sparks = scene.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 220 }, angle: { min: 200, max: 340 }, lifespan: 600, scale: { start: 1.4, end: 0 }, gravityY: 300, emitting: false
    });
  }

  enter() {
    if (this.done) return;
    this.done = true;
    const { scene, chest, lid, mouth } = this;

    // 1. Anticipatie: de kist schudt.
    scene.tweens.add({
      targets: [chest, lid], x: '+=3', duration: 50, yoyo: true, repeat: 5, ease: 'Stepped',
      onComplete: () => {
        // 2. Deksel klapt open + vonken.
        scene.tweens.add({ targets: lid, angle: -115, duration: 380, ease: 'Back.out' });
        this.sparks.explode(18, mouth.x, mouth.y);
        scene.tweens.add({ targets: chest, scaleY: 0.85, duration: 90, yoyo: true, ease: 'Quad.out' });

        // 3. Badges vliegen eruit, met een boogje omhoog en een veerkrachtige landing.
        this.badges.forEach((b, i) => {
          const delay = 250 + i * 160;
          scene.tweens.add({ targets: b, scale: 1, duration: 450, delay, ease: 'Back.out' });
          scene.tweens.add({ targets: b, x: b.target.x, duration: 520, delay, ease: 'Sine.out' });
          scene.tweens.add({
            targets: b, y: b.target.y, duration: 620, delay, ease: 'Back.out',
            onStart: () => this.sparks.explode(5, mouth.x, mouth.y),
            onComplete: () =>
              scene.tweens.add({ targets: b, y: b.target.y - 5, duration: 1100 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
          });
          scene.tweens.add({ targets: b, angle: { from: Phaser.Math.Between(-25, 25), to: 0 }, duration: 600, delay, ease: 'Back.out' });
        });

        // 4. Titel erboven als kroon.
        scene.tweens.add({ targets: this.title, scale: 1, duration: 400, delay: 250 + this.badges.length * 160, ease: 'Back.out' });
      }
    });
  }

  leave() {}
}
