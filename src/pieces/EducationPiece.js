import { pixelBox, label, shorten, pop } from './draw.js';

// Opleidingen: diploma's als oorkondes waar een afstudeerhoed op landt,
// certificaten als medailles die één voor één aan een lijn komen te hangen.
const DIPLOMA_W = 250;

export default class EducationPiece {
  static width(station) {
    return DIPLOMA_W + 60 + Math.min(10, station.data.certificaten.length) * 34 + 80;
  }

  constructor(scene, x, groundY, station, theme) {
    Object.assign(this, { scene, x, theme, done: false, usesPanel: true });
    const { diplomas, certificaten } = station.data;
    const { colors } = theme;
    const totalW = EducationPiece.width(station) - 40;
    const left = x - totalW / 2;
    this.stopX = x - 60; // oorkondes én medailles in beeld, links van de tekstbox
    this.duration = Math.max(Math.min(2, diplomas.length) * 250 + 1500, 300 + Math.min(10, certificaten.length) * 130 + 500);

    // Diploma's (max 2), gestapeld.
    this.diplomas = diplomas.slice(0, 2).map((d, i) => {
      const top = groundY - 110 - (i + 1) * 92;
      const g = scene.add.graphics();
      pixelBox(g, 0, 0, DIPLOMA_W, 76, { ...colors, board: 0xf4e4c1, boardEdge: 0x8a5a00 });
      const t1 = label(scene, 14, 10, shorten(d.titel, 28), theme, { size: 13, color: '#1a1430' });
      const t2 = label(scene, 14, 32, shorten(d.instituut, 30), theme, { size: 12, color: '#5a4a2a', bold: false });
      const t3 = label(scene, 14, 50, d.periode, theme, { size: 12, color: '#8a5a00' });
      const c = scene.add.container(left, top, [g, t1, t2, t3]);
      c.setScale(0, 1);
      return c;
    });
    this.cap = scene.add.image(left + DIPLOMA_W - 20, groundY, theme.tex('cap')).setAlpha(0).setDepth(4);
    this.capTarget = { x: left + DIPLOMA_W - 16, y: groundY - 110 - Math.min(2, diplomas.length) * 92 - 4 };

    // Medaillelijn.
    const rackLeft = left + DIPLOMA_W + 60;
    const n = Math.min(10, certificaten.length);
    const rackW = n * 34 + 20;
    const rackY = groundY - 230;
    const g = scene.add.graphics();
    g.fillStyle(colors.post).fillRect(rackLeft - 6, rackY, 8, 230).fillRect(rackLeft + rackW - 2, rackY, 8, 230);
    g.lineStyle(3, 0xf4e4c1).lineBetween(rackLeft, rackY + 6, rackLeft + rackW, rackY + 6);
    this.medals = certificaten.slice(0, n).map((_, i) =>
      scene.add.image(rackLeft + 20 + i * 34, rackY + 6, theme.tex('medal')).setOrigin(0.5, 0).setAlpha(0)
    );
    this.rackCaption = label(scene, rackLeft + rackW / 2, rackY + 100, `${certificaten.length} cursussen &\ncertificaten`, theme, {
      size: 13, color: colors.floatTitle ?? colors.title, align: 'center'
    }).setOrigin(0.5, 0).setStroke(colors.floatStroke ?? '#1a1430', 4).setAlpha(0);
    this.sparks = scene.add.particles(0, 0, theme.tex('spark'), { speed: { min: 40, max: 140 }, lifespan: 450, scale: { start: 1.2, end: 0 }, emitting: false });
  }

  start() {
    if (this.done) return;
    this.done = true;
    const { scene } = this;
    // Oorkondes rollen open.
    this.diplomas.forEach((d, i) => scene.tweens.add({ targets: d, scaleX: 1, duration: 380, delay: i * 250, ease: 'Back.out' }));
    // Hoed wordt opgegooid, tolt en landt op de bovenste oorkonde.
    const delay = this.diplomas.length * 250 + 150;
    this.cap.setAlpha(1);
    scene.tweens.add({ targets: this.cap, x: this.capTarget.x, duration: 900, delay, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: this.cap, y: this.capTarget.y - 140, duration: 450, delay, ease: 'Quad.out', yoyo: false,
      onComplete: () => scene.tweens.add({ targets: this.cap, y: this.capTarget.y, duration: 450, ease: 'Bounce.out',
        onComplete: () => this.sparks.explode(10, this.cap.x, this.cap.y) }) });
    scene.tweens.add({ targets: this.cap, angle: 720, duration: 900, delay, ease: 'Quad.out' });
    // Medailles vallen één voor één aan de lijn en slingeren na.
    this.medals.forEach((m, i) => {
      const y = m.y;
      m.setY(y - 160);
      scene.tweens.add({ targets: m, alpha: 1, duration: 100, delay: 300 + i * 130 });
      scene.tweens.add({ targets: m, y, duration: 500, delay: 300 + i * 130, ease: 'Bounce.out',
        onComplete: () => scene.tweens.add({ targets: m, angle: { from: -12, to: 12 }, duration: 700 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.inOut' }) });
    });
    scene.tweens.add({ targets: this.rackCaption, alpha: 1, duration: 300, delay: 300 + this.medals.length * 130 });
  }

}
