import { pixelBox, label, pop } from './draw.js';

// Spelerskaart (zoals de kop van het TC-cv): naam, rol, LVL = jaren in het testvak met XP-balk,
// talen en top-skills. Het profiel zelf staat in de tekstbox.
const W = 440;

export default class IntroPiece {
  static width() { return W; }

  constructor(scene, x, groundY, station, theme) {
    Object.assign(this, { scene, x, theme, done: false, usesPanel: false }); // profiel vertelt Martijn
    const cv = station.data;
    const { colors } = theme;
    const h = 250;
    const left = x - W / 2;
    const top = groundY - 60 - h;
    this.duration = 1700;
    this.stopX = x + 30; // kaart links van het midden; de tekstbox staat rechtsonder

    const g = scene.add.graphics();
    g.fillStyle(colors.post).fillRect(left + 40, top + h, 12, 60).fillRect(left + W - 52, top + h, 12, 60);
    pixelBox(g, left, top, W, h, colors);

    label(scene, left + 20, top + 16, 'SPELER 1', theme, { size: 12, color: colors.dim });
    label(scene, left + 20, top + 34, cv.naam.toUpperCase(), theme, { size: 22, color: colors.title });
    label(scene, left + 20, top + 64, cv.rol, theme, { size: 14 });

    // Level = jaren ervaring.
    label(scene, left + W - 120, top + 16, 'LVL', theme, { size: 14, color: colors.dim });
    this.lvl = label(scene, left + W - 76, top + 4, '0', theme, { size: 40, color: colors.title });
    label(scene, left + 20, top + 104, `In het testvak sinds ${cv.sinds}`, theme, { size: 12, color: colors.dim });
    this.xp = [];
    const blocks = 18;
    for (let i = 0; i < blocks; i++) {
      const bx = left + 20 + i * 20;
      g.fillStyle(colors.flat ? (colors.track ?? 0xece6dc) : colors.boardShadow).fillRect(bx, top + 124, 16, 12);
      this.xp.push(scene.add.rectangle(bx, top + 124, 16, 12, colors.accent ?? 0xffd23f).setOrigin(0).setAlpha(0));
    }
    this.xpFill = Math.min(blocks, Math.round((cv.jarenErvaring / 15) * blocks)); // 15 jaar = volle balk

    const CODES = { nederlands: 'NL', engels: 'EN', duits: 'DE', frans: 'FR', spaans: 'ES' };
    const talen = (cv.talen ?? []).map((t) => `${CODES[t.taal.toLowerCase()] ?? t.taal.slice(0, 2).toUpperCase()} ${t.niveau}`).join(' · ');
    if (talen) label(scene, left + 20, top + 148, `Talen: ${talen}`, theme, { size: 12 });

    // Top-skills als tags.
    this.tags = [];
    let tx = left + 20;
    const ty = top + 184;
    label(scene, left + 20, ty - 14, 'SPECIALITEITEN', theme, { size: 10, color: colors.dim });
    for (const s of cv.topSkills) {
      const t = label(scene, 0, 0, s.length > 14 ? s.slice(0, 13) + '…' : s, theme, { size: 12, color: colors.tagText ?? '#1a1430' });
      const tw = t.width + 14;
      if (tx + tw > left + W - 16) { t.destroy(); break; }
      const bg = scene.add.rectangle(0, 0, tw, 22, colors.tag ?? 0xffd23f).setOrigin(0.5);
      t.setOrigin(0.5);
      const c = scene.add.container(tx + tw / 2, ty + 14, [bg, t]);
      this.tags.push(c);
      tx += tw + 8;
    }
    this.tags.forEach((c) => c.setScale(0));
  }

  start() {
    if (this.done) return;
    this.done = true;
    const { scene } = this;
    const counter = { v: 0 };
    scene.tweens.add({
      targets: counter, v: scene.cv.jarenErvaring, duration: 1100, ease: 'Cubic.out',
      onUpdate: () => this.lvl.setText(String(Math.round(counter.v)))
    });
    this.xp.slice(0, this.xpFill).forEach((b, i) => scene.tweens.add({ targets: b, alpha: 1, duration: 60, delay: i * 50 }));
    this.tags.forEach((t, i) => pop(scene, t.setScale(1), 600 + i * 120));
  }

}
