import { label } from './draw.js';
import { HOST } from '../config/brand.js';
import { audio } from '../audio/index.js';

const zinnen = (tekst = '') => tekst.split(/(?<=[.!?])\s+/).map((z) => z.trim()).filter(Boolean);

// Martijn van TestCoders staat aan het begin, stelt de collega voor en vertelt het profiel
// (dat al in de derde persoon is geschreven) in tekstballonnen. Het gesprek loopt vanzelf door;
// scrollen of → gaat sneller. Daarna loop je verder naar de spelerskaart.
export default class HostPiece {
  static width() { return 300; }

  constructor(scene, x, groundY, station, theme) {
    Object.assign(this, { scene, x, theme, done: false });
    const cv = station.data;
    const voornaam = cv.naam.split(' ')[0];
    const key = theme.hostKey;
    const scale = theme.heroScale ?? 3;
    this.host = scene.add.sprite(x + 50, groundY, key, 'idle0').setOrigin(0.5, theme.heroOriginY ?? 1).setScale(scale).setFlipX(true).play(`${key}-idle`).setDepth(4);
    this.hostKey = key;

    this.lines = [
      `Hoi! Ik ben ${HOST.naam} van TestCoders.`,
      `Mag ik je voorstellen aan ${voornaam}? ${cv.rol}, al sinds ${cv.sinds} in het testvak.`,
      ...zinnen(cv.profiel).slice(0, HOST.maxZinnen),
      `Loop maar mee, dan laat ik je zien wat ${voornaam} allemaal kan!`
    ];

    // Tekstballon boven Martijn.
    this.text = label(scene, 0, 0, '', theme, { size: 14, color: '#16202a', wrap: 300, bold: false });
    this.hint = label(scene, 0, 0, '▶ scroll of →', theme, { size: 10, color: '#8a8f99' }).setOrigin(1, 1);
    this.bg = scene.add.graphics();
    this.bubble = scene.add.container(x + 50, groundY - 90, [this.bg, this.text, this.hint]).setDepth(8).setScale(0);

    this.stopX = x - 40; // de held staat links van Martijn
    this.stages = [{
      x: this.stopX,
      dialogue: true,
      duration: 0,
      run: (instant) => (instant ? this.finish() : this.say(0)),
      advance: () => this.next()
    }];
  }

  say(i) {
    const { scene } = this;
    this.index = i;
    this.done = true;
    const line = this.lines[i];
    this.text.setText(line);
    const w = Math.max(160, this.text.width + 28);
    const h = this.text.height + 34;
    this.text.setPosition(-w / 2 + 14, -h - 8 + 12);
    this.hint.setPosition(w / 2 - 10, -14).setText(i === this.lines.length - 1 ? '▶ verder lopen' : '▶ scroll of →');
    this.bg.clear();
    this.bg.lineStyle(3, 0x16202a).fillStyle(0xffffff).fillRoundedRect(-w / 2, -h - 8, w, h, 12).strokeRoundedRect(-w / 2, -h - 8, w, h, 12);
    this.bg.fillStyle(0xffffff).fillTriangle(-6, -9, 10, -9, 14, 6).lineStyle(3, 0x16202a).lineBetween(-6, -8, 14, 6).lineBetween(14, 6, 10, -8);
    scene.tweens.killTweensOf(this.bubble);
    this.bubble.setScale(i === 0 ? 0 : 0.92);
    scene.tweens.add({ targets: this.bubble, scale: 1, duration: 220, ease: 'Back.out' });
    // Knikje terwijl hij praat.
    scene.tweens.add({ targets: this.host, scaleY: this.host.scaleY * 1.04, duration: 140, yoyo: true, repeat: 1 });
    audio.play('enter');
    scene.sharpenText?.();
    this.timer?.remove();
    this.timer = scene.time.delayedCall(HOST.autoNextMs + line.length * 25, () => this.next());
  }

  /** Volgende zin; na de laatste is het gesprek klaar en loop je verder. */
  next() {
    if (this.stages[0].complete) return;
    if (this.index < this.lines.length - 1) return this.say(this.index + 1);
    this.finish();
  }

  finish() {
    this.timer?.remove();
    this.stages[0].complete = true;
    this.done = true;
    this.scene.tweens.add({ targets: this.bubble, scale: 0, duration: 200, delay: 900 });
    this.host.play(`${this.hostKey}-idle`, true);
  }
}
