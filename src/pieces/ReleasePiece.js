import { label, shorten, pop } from './draw.js';

// Ervaring als release: je loopt over de ▶ RUN-knop, de werkzaamheden draaien als testcases op groen,
// "PASSED" — en de releasevlag met de opdrachtgever gaat de mast in. Mastlengte = duur van de opdracht.
const BOARD_W = 310;
const LINE_H = 20;
const MAX_LINES = 4;
const MAAND = { januari: 'jan', februari: 'feb', maart: 'mrt', april: 'apr', mei: 'mei', juni: 'jun', juli: 'jul', augustus: 'aug', september: 'sep', oktober: 'okt', november: 'nov', december: 'dec' };
// "December 2015 – Augustus 2019" → "dec 2015 – aug 2019" (zoals in het TC-cv)
const kortePeriode = (p = '') => p.replace(/[A-Za-z]+/g, (m) => MAAND[m.toLowerCase()] ?? m.toLowerCase());

export default class ReleasePiece {
  static width() { return BOARD_W + 200; }

  constructor(scene, x, groundY, station, theme) {
    Object.assign(this, { scene, x, theme, done: false, usesPanel: true });
    const w = station.data;
    const { colors } = theme;
    const tests = (w.werkzaamheden?.length ? w.werkzaamheden : [w.rol]).slice(0, MAX_LINES);

    // Knop op de grond = halteplaats; erover lopen start de testrun.
    this.plateX = x - 70;
    this.stopX = this.plateX;
    this.triggerAt = this.plateX - 10;
    const plate = scene.add.graphics().setDepth(6);
    plate.fillStyle(0x1a1430).fillRect(this.plateX - 34, groundY - 8, 68, 8);
    this.plateTop = scene.add.rectangle(this.plateX, groundY - 8, 56, 8, 0xe4572e).setOrigin(0.5, 1).setDepth(6);
    this.plateLabel = label(scene, this.plateX, groundY + 6, '▶ RUN', theme, { size: 11, color: '#ffd23f' }).setOrigin(0.5, 0).setDepth(6);

    // Testrunner-scherm op een standaard.
    const h = 58 + tests.length * LINE_H + 34;
    const left = x - 150 - BOARD_W / 2 + 80;
    const top = groundY - 64 - h;
    const g = scene.add.graphics();
    g.fillStyle(colors.post).fillRect(left + BOARD_W / 2 - 6, top + h, 12, 64);
    g.fillStyle(0x1a1430).fillRect(left - 4, top - 4, BOARD_W + 8, h + 8);
    g.fillStyle(0x0f1b14).fillRect(left, top, BOARD_W, h);
    label(scene, left + 12, top + 10, `▶ TESTRUN · ${shorten(w.opdrachtgever, 24)}`, theme, { size: 12, color: '#7cff6b' });
    label(scene, left + 12, top + 28, shorten(w.rol, 36), theme, { size: 11, color: '#9fd6b4', bold: false });
    this.lines = tests.map((t, i) => {
      const y = top + 52 + i * LINE_H;
      const mark = label(scene, left + 12, y, '○', theme, { size: 13, color: '#5f7a69' });
      const txt = label(scene, left + 32, y, shorten(t, 34), theme, { size: 12, color: '#9fd6b4', bold: false });
      return { mark, txt };
    });
    const barY = top + h - 24;
    g.fillStyle(0x1f3a2a).fillRect(left + 12, barY, BOARD_W - 24, 10);
    this.bar = scene.add.rectangle(left + 12, barY, 0, 10, 0x7cff6b).setOrigin(0);
    this.barW = BOARD_W - 24;
    this.stamp = label(scene, left + BOARD_W - 16, barY - 8, '✓ PASSED', theme, { size: 18, color: '#7cff6b' })
      .setOrigin(1, 1).setStroke('#0f1b14', 5).setAngle(-6).setAlpha(0).setDepth(2);

    // Releasemast: lengte = duur (± 2,2 px per maand).
    const poleX = left + BOARD_W + 70;
    const poleH = Math.max(150, Math.min(330, 110 + w.maanden * 2.2));
    this.poleTop = groundY - poleH;
    const pg = scene.add.graphics();
    pg.fillStyle(0x1a1430).fillRect(poleX - 4, this.poleTop - 4, 8, poleH + 4);
    pg.fillStyle(0xd9dde3).fillRect(poleX - 2, this.poleTop, 4, poleH);
    pg.fillStyle(0xffd23f).fillCircle(poleX, this.poleTop - 4, 6);
    pg.fillStyle(0x1a1430).fillRect(poleX - 16, groundY - 10, 32, 10);
    label(scene, poleX, groundY + 6, kortePeriode(w.periode), theme, { size: 11, color: '#f4e4c1' }).setOrigin(0.5, 0);
    // Vlag met de opdrachtgever, opgerold onderaan.
    const flagText = label(scene, 6, 0, shorten(w.opdrachtgever, 18), theme, { size: 12, color: '#1a1430' }).setOrigin(0, 0.5);
    const fw = flagText.width + 16;
    const cloth = scene.add.rectangle(0, 0, fw, 26, 0xffd23f).setOrigin(0, 0.5).setStrokeStyle(2, 0x1a1430);
    this.flag = scene.add.container(poleX + 2, groundY - 28, [cloth, flagText]).setScale(0.15, 1);
    // Drie belangrijkste technieken als stickers onder het scherm (zoals de tags in het TC-cv).
    this.tags = (w.tools ?? []).slice(0, 3).map((t, i) => {
      const tt = label(scene, 0, 0, shorten(t, 14), theme, { size: 11, color: '#1a1430' }).setOrigin(0.5);
      const bg = scene.add.rectangle(0, 0, tt.width + 12, 20, 0xf4e4c1).setStrokeStyle(2, 0x1a1430);
      return scene.add.container(left + 52 + i * 104, top - 22, [bg, tt]).setScale(0).setDepth(3);
    });
    this.sparks = scene.add.particles(0, 0, 'spark', { speed: { min: 60, max: 240 }, lifespan: 700, scale: { start: 1.6, end: 0 }, gravityY: 250, emitting: false }).setDepth(7);
  }

  enter() {
    if (this.done) return;
    this.done = true;
    const { scene } = this;
    // 1. Knop gaat in.
    scene.tweens.add({ targets: this.plateTop, scaleY: 0.35, duration: 90, yoyo: true, hold: 300 });
    this.plateTop.setFillStyle(0x7cff6b);
    // 2. Testcases lopen op groen.
    const step = 230;
    this.lines.forEach(({ mark, txt }, i) => {
      scene.time.delayedCall(200 + i * step, () => {
        mark.setText('✓').setColor('#7cff6b');
        txt.setColor('#e6ffe9');
        pop(scene, mark.setScale(1), 0, 220);
      });
    });
    const runTime = 200 + this.lines.length * step;
    scene.tweens.add({ targets: this.bar, width: this.barW, duration: runTime, ease: 'Linear' });
    // 3. PASSED + vlag de mast in.
    scene.time.delayedCall(runTime + 80, () => {
      this.stamp.setAlpha(1);
      pop(scene, this.stamp.setScale(1), 0, 300);
      scene.cameras.main.shake(120, 0.002);
      scene.tweens.add({ targets: this.flag, y: this.poleTop + 16, duration: 900, ease: 'Cubic.out' });
      scene.tweens.add({ targets: this.flag, scaleX: 1, duration: 500, delay: 250, ease: 'Back.out' });
      scene.time.delayedCall(950, () => {
        this.sparks.explode(26, this.flag.x, this.poleTop);
        scene.tweens.add({ targets: this.flag, scaleY: 0.9, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      });
      this.tags.forEach((t, i) => { t.setScale(1); pop(scene, t, 300 + i * 120); });
    });
  }

  leave() {}
}
