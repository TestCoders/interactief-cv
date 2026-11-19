import { SKILLS } from '../config/pieceConfig.js';
// Skillbord: per skill een "laadbalk" van plantvakjes die vollopen met bloemetjes
// zodra de speler aankomt. Aantal bloemen = niveau (1–5) uit het CV, omgerekend naar SKILLS.slots.

export default class SkillsPiece {
  static width() { return SKILLS.padding * 2 + SKILLS.nameWidth + SKILLS.slots * SKILLS.slotWidth; }

  constructor(scene, x, groundY, station, theme) {
    this.scene = scene;
    this.x = x;
    this.done = false;
    const { titel, skills, meer } = station.data;
    this.stopX = x - 140;
    const { colors, font } = theme;

    const w = SKILLS.padding * 2 + SKILLS.nameWidth + SKILLS.slots * SKILLS.slotWidth;
    const h = SKILLS.headerHeight + skills.length * SKILLS.rowHeight + (meer > 0 ? 34 : 14);
    const left = Math.round(x - w / 2);
    const top = Math.round(groundY - 56 - h);
    this.range = w / 2 + 60; // begint te groeien zodra je het bord binnenloopt

    // Bord met palen, pixel-stijl: harde randen, geen afgeronde hoeken.
    const g = scene.add.graphics();
    g.fillStyle(colors.post).fillRect(left + 28, top + h, 12, 56).fillRect(left + w - 40, top + h, 12, 56);
    g.fillStyle(colors.boardShadow).fillRect(left - 2, top + 4, w + 8, h + 4);
    g.fillStyle(colors.boardEdge).fillRect(left - 4, top - 4, w + 8, h + 8);
    g.fillStyle(colors.board).fillRect(left, top, w, h);

    scene.add.text(x, top + 14, titel.toUpperCase(), { fontFamily: font, fontSize: '16px', fontStyle: 'bold', color: colors.title }).setOrigin(0.5, 0);

    this.rows = skills.map((s, i) => {
      const cy = top + SKILLS.headerHeight + i * SKILLS.rowHeight + SKILLS.rowHeight / 2;
      scene.add.text(left + SKILLS.padding, cy, s.naam.length > 22 ? s.naam.slice(0, 21) + '…' : s.naam, { fontFamily: font, fontSize: '13px', fontStyle: 'bold', color: colors.text }).setOrigin(0, 0.5);
      const flowers = [];
      for (let j = 0; j < SKILLS.slots; j++) {
        const sx = left + SKILLS.padding + SKILLS.nameWidth + j * SKILLS.slotWidth + SKILLS.slotWidth / 2;
        scene.add.image(sx, cy + 9, 'soil');
        flowers.push(scene.add.image(sx, cy + 8, 'flower').setOrigin(0.5, 1).setScale(0));
      }
      const count = Math.round(((s.score ?? s.niveau ?? 0) / 5) * SKILLS.slots);
      return { flowers, count };
    });

    if (meer > 0) {
      scene.add.text(x, top + h - 22, `+ nog ${meer} — zie Klassiek CV`, { fontFamily: font, fontSize: '11px', color: colors.dim }).setOrigin(0.5, 0);
    }

    this.sparks = scene.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 120 }, lifespan: 450, scale: { start: 1, end: 0 }, gravityY: 150, emitting: false
    });
  }

  enter() {
    if (this.done) return;
    this.done = true;
    const { scene } = this;
    this.rows.forEach((row, i) => {
      row.flowers.slice(0, row.count).forEach((f, j) => {
        const delay = i * 140 + j * 70;
        scene.tweens.add({
          targets: f, scale: 1, duration: 280, delay, ease: 'Back.out',
          onStart: () => j === row.count - 1 && this.sparks.explode(8, f.x, f.y - 14)
        });
        // Daarna zachtjes wiegen in de wind, ieder in z'n eigen tempo.
        scene.tweens.add({
          targets: f, angle: { from: -5, to: 5 }, duration: 900 + ((i * 7 + j * 13) % 5) * 120,
          yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: delay + 280
        });
      });
    });
  }

  leave() {}
}
