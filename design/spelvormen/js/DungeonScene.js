import Phaser from 'phaser';
import { BRAND } from '../../../src/config/brand.js';
import { heroKey } from '../../../src/graphics/heroSprites.js';
import { THEMES } from '../../../src/themes/index.js';
import { cvSections } from './sections.js';
import { esc } from '../../../src/ui/html.js';
import { showPanel, hidePanel } from '../../../src/ui/panel.js';
import { audio } from '../../../src/audio/index.js';

// Spelvorm "Dungeon": een top-down kerker (versimpeld, in het genre van actie-RPG's).
// Elke kamer is een CV-onderdeel met een gloeiend altaar; de held heeft een fakkel.
// Bugs kruipen rond: met spatie (of klikken) fix je ze — dat is tenslotte het vak. Uitgang = contact.
const T = 32; // tegelgrootte
const ROOMS = [
  // [sectie-id, x, y, breedte, hoogte] in tegels
  ['profiel', 2, 2, 11, 9],
  ['expertise', 16, 2, 9, 8],
  ['vaardigheden', 28, 2, 11, 9],
  ['ervaring', 28, 14, 11, 10],
  ['opleiding', 16, 15, 9, 8],
  ['mens', 2, 14, 11, 9],
  ['contact', 16, 27, 9, 6]
];
const GANGEN = [
  [13, 5, 3, 3], [25, 5, 3, 3], [32, 11, 3, 3], [25, 18, 3, 3], [13, 18, 3, 3], [19, 23, 3, 4]
];
const SPEED = 190;
const FIX_RANGE = 70;

export default class DungeonScene extends Phaser.Scene {
  constructor() {
    super('dungeon');
  }

  init({ cv }) {
    this.cv = cv;
    this.fixed = 0;
    this.currentRoom = null;
  }

  create() {
    THEMES.retro.createTextures(this); // pixel-bug en fonkeling
    const sections = Object.fromEntries(cvSections(this.cv).map((s) => [s.id, s]));
    const cols = 41;
    const rows = 35;
    const W = cols * T;
    const H = rows * T;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main.setBackgroundColor('#07050c').setBounds(0, 0, W, H);

    // --- Kaart: vloer = kamers + gangen; muren = rand eromheen ---
    const floor = Array.from({ length: rows }, () => new Array(cols).fill(false));
    for (const [, x, y, w, h] of ROOMS) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) floor[j][i] = true;
    for (const [x, y, w, h] of GANGEN) for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) floor[j][i] = true;
    const isFloor = (i, j) => floor[j]?.[i] === true;

    const g = this.add.graphics();
    this.walls = this.physics.add.staticGroup();
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (isFloor(i, j)) {
          const v = ((i * 7 + j * 13) % 5) * 4;
          g.fillStyle(Phaser.Display.Color.GetColor(52 + v, 47 + v, 72 + v)).fillRect(i * T, j * T, T, T);
          g.fillStyle(0x000000, 0.18).fillRect(i * T, j * T + T - 2, T, 2).fillRect(i * T + T - 2, j * T, 2, T);
        } else if ([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]].some(([di, dj]) => isFloor(i + di, j + dj))) {
          g.fillStyle(0x2b2740).fillRect(i * T, j * T, T, T);
          g.fillStyle(0x1b1828).fillRect(i * T, j * T + T - 8, T, 8);
          g.fillStyle(0x3a3552).fillRect(i * T + 2, j * T + 4, 12, 6).fillRect(i * T + 18, j * T + 14, 12, 6);
          const wall = this.add.rectangle(i * T + T / 2, j * T + T / 2, T, T).setVisible(false);
          this.walls.add(wall);
        }
      }
    }

    // --- Altaren: per kamer een gloeiend voetstuk met titel ---
    this.rooms = ROOMS.map(([id, x, y, w, h]) => {
      const cx = (x + w / 2) * T;
      const cy = (y + h / 2) * T;
      const s = sections[id];
      const kleur = id === 'contact' ? 0x7cff6b : 0xffd23f;
      const glow = this.add.circle(cx, cy, 34, kleur, 0.25).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: glow, scale: 1.25, alpha: 0.12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.add.rectangle(cx, cy + 6, 40, 22, 0x5a5470).setStrokeStyle(2, 0x1b1828);
      this.add.text(cx, cy - 6, s.icoon, { fontSize: '26px' }).setOrigin(0.5);
      this.add.text(cx, y * T + 18, s.titel.toUpperCase(), {
        fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: '#ffe27a', stroke: '#07050c', strokeThickness: 4
      }).setOrigin(0.5, 0);
      return { id, rect: new Phaser.Geom.Rectangle(x * T, y * T, w * T, h * T), cx, cy, section: s };
    });

    // --- Held (pixel-held van het cv), top-down bewegen ---
    const key = heroKey(this.cv);
    const start = this.rooms[0];
    this.hero = this.physics.add.sprite(start.cx - 90, start.cy + 40, key, 'idle0').setScale(2.5).setDepth(5).play(`${key}-idle`);
    this.hero.body.setSize(10, 6).setOffset(3, 12);
    this.heroKey = key;
    this.physics.add.collider(this.hero, this.walls);
    this.cameras.main.startFollow(this.hero, true, 0.12, 0.12);
    this.cameras.main.setZoom(Math.max(1, Math.min(2, this.scale.height / 420)));

    // --- Bugs: één per opdracht (minimaal 4), verspreid over de kamers ---
    const tools = [...new Set((this.cv.werkervaring ?? []).flatMap((w) => w.tools ?? []))];
    const n = Math.max(4, Math.min(8, this.cv.werkervaring?.length ?? 4));
    this.bugs = Array.from({ length: n }, (_, i) => {
      const room = this.rooms[1 + (i % (this.rooms.length - 2))];
      const b = this.physics.add.sprite(room.cx + Phaser.Math.Between(-80, 80), room.cy + Phaser.Math.Between(-50, 60), 'bug0')
        .setScale(0.6).setDepth(4).setInteractive({ useHandCursor: true });
      b.body.setSize(40, 24).setOffset(10, 14).setCollideWorldBounds(true).setBounce(1);
      b.tool = tools[i % Math.max(1, tools.length)] ?? 'testautomatisering';
      b.on('pointerdown', () => this.fixBug(b, true));
      this.physics.add.collider(b, this.walls);
      this.time.addEvent({ delay: Phaser.Math.Between(900, 1600), loop: true, callback: () => {
        if (!b.active) return;
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        b.setVelocity(Math.cos(a) * 45, Math.sin(a) * 45).setFlipX(Math.cos(a) < 0);
      } });
      this.time.addEvent({ delay: 160, loop: true, callback: () => b.active && b.setTexture(b.texture.key === 'bug0' ? 'bug1' : 'bug0') });
      return b;
    });

    // --- Fakkellicht: donkere laag over de hele kerker met gaten rond held en altaren ---
    if (!this.textures.exists('licht')) {
      const size = 420;
      const tex = this.textures.createCanvas('licht', size, size);
      const ctx = tex.getContext();
      const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(0.55, 'rgba(0,0,0,0.85)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
    this.dark = this.add.renderTexture(0, 0, W, H).setOrigin(0).setDepth(20);
    this.sparks = this.add.particles(0, 0, 'spark', { speed: { min: 60, max: 200 }, lifespan: 500, scale: { start: 1.4, end: 0 }, emitting: false }).setDepth(21);

    // --- Besturing: pijltjes of WASD; spatie = bug fixen ---
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE');

    // --- HUD + tip ---
    this.hud = document.getElementById('hud');
    this.hud.hidden = false;
    this.updateHud();
    const coach = document.getElementById('coach');
    coach.innerHTML = '🗝️ Pijltjes of <b>WASD</b> om te lopen · <b>spatie</b> (of klik) om een bug te fixen · elke kamer is een CV-onderdeel';
    coach.hidden = false;
    coach.classList.remove('weg');
    this.coachTimer = setTimeout(() => { coach.classList.add('weg'); setTimeout(() => (coach.hidden = true), 400); }, 5000);

    this.events.once('shutdown', () => {
      clearTimeout(this.coachTimer);
      coach.hidden = true;
      this.hud.hidden = true;
      hidePanel();
    });
  }

  updateHud() {
    const room = this.currentRoom ? ` · ${esc(this.currentRoom.section.titel)}` : '';
    this.hud.innerHTML = `<img class="hud-merk" src="${BRAND.mark}" alt="${BRAND.naam}">
      <div class="hud-tekst"><div class="hud-rij"><b>${esc(this.cv.naam)}</b><span>Dungeon${room}</span></div>
      <div class="hud-rij"><div class="hud-balk"><i style="width:${Math.round((this.fixed / this.bugs.length) * 100)}%"></i></div>
      <span class="hud-extra">🐛 ${this.fixed}/${this.bugs.length} gefixt</span></div></div>`;
  }

  fixBug(bug, byClick = false) {
    if (!bug.active) return;
    if (byClick && Phaser.Math.Distance.Between(bug.x, bug.y, this.hero.x, this.hero.y) > FIX_RANGE * 2.2) return;
    bug.disableBody(true, false);
    bug.active = false;
    this.sparks.explode(18, bug.x, bug.y);
    audio.play('bonus');
    this.tweens.add({ targets: bug, scaleY: 0.1, alpha: 0, duration: 260, ease: 'Quad.in', onComplete: () => bug.destroy() });
    const t = this.add.text(bug.x, bug.y - 20, `✓ gefixt met ${bug.tool}`, {
      fontFamily: '"Pixelify Sans", monospace', fontSize: '14px', color: '#7cff6b', stroke: '#07050c', strokeThickness: 4
    }).setOrigin(0.5).setDepth(22);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 1400, ease: 'Sine.out', onComplete: () => t.destroy() });
    this.fixed++;
    this.updateHud();
    if (this.fixed === this.bugs.length) {
      audio.play('finish');
      const done = this.add.text(this.hero.x, this.hero.y - 60, 'ALLE BUGS GEFIXT!', {
        fontFamily: '"Press Start 2P", monospace', fontSize: '14px', color: '#ffe27a', stroke: '#07050c', strokeThickness: 5
      }).setOrigin(0.5).setDepth(22);
      this.tweens.add({ targets: done, y: done.y - 30, alpha: 0, duration: 2600, delay: 600, onComplete: () => done.destroy() });
    }
  }

  update() {
    if (this.hud.hidden) this.hud.hidden = false; // het level kan hem bij afsluiten net verborgen hebben
    const k = this.keys;
    const dx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    const dy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);
    const len = Math.hypot(dx, dy) || 1;
    this.hero.setVelocity((dx / len) * SPEED, (dy / len) * SPEED);
    if (dx) this.hero.setFlipX(dx < 0);
    this.hero.play(`${this.heroKey}-${dx || dy ? 'run' : 'idle'}`, true);

    if (Phaser.Input.Keyboard.JustDown(k.SPACE)) {
      const near = this.bugs.filter((b) => b.active).sort((a, b) => Phaser.Math.Distance.Between(a.x, a.y, this.hero.x, this.hero.y) - Phaser.Math.Distance.Between(b.x, b.y, this.hero.x, this.hero.y))[0];
      if (near && Phaser.Math.Distance.Between(near.x, near.y, this.hero.x, this.hero.y) < FIX_RANGE) this.fixBug(near);
      else this.tweens.add({ targets: this.hero, angle: { from: -12, to: 12 }, duration: 80, yoyo: true, onComplete: () => this.hero.setAngle(0) });
    }

    // Kamer = CV-onderdeel in de tekstbox.
    const room = this.rooms.find((r) => r.rect.contains(this.hero.x, this.hero.y)) ?? null;
    if (room !== this.currentRoom) {
      this.currentRoom = room;
      if (room) { showPanel(`dungeon-${room.id}`, room.section.html); audio.play('enter'); } else hidePanel();
      this.updateHud();
    }

    // Duisternis met licht rond de held en de altaren.
    this.dark.clear().fill(0x07050c, 0.9);
    this.dark.erase('licht', this.hero.x - 210, this.hero.y - 210);
    for (const r of this.rooms) this.dark.erase('licht', r.cx - 210, r.cy - 210);
  }
}
