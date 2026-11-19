import Phaser from 'phaser';
import { buildStations } from '../cv/stations.js';
import { SCENES } from '../config/gameConfig.js';
import { MOVEMENT, CAMERA } from '../config/levelConfig.js';
import Player from '../level/Player.js';
import KeyboardControls from '../level/KeyboardControls.js';
import { esc } from '../ui/html.js';
import { showPanel, hidePanel } from '../ui/panel.js';
import { stationHtml } from '../ui/stationTemplates.js';
import { createPiece, widthOf, bonusFor } from '../pieces/pieceRegistry.js';
import Bonus from '../pieces/Bonus.js';
import retro from '../themes/retroTheme.js';
import { heroKey } from '../graphics/heroSprites.js';

import { BASE_H, GROUND_H, START_X, PIECE_GAP, BONUS_GAP, SCROLL_FACTOR, KEY_RATE, INTENT_MAX, STOP_SNAP, IDLE_BEFORE_SNAP, TRAVEL_MS, SKY, TINT, CHAPTERS } from '../config/traversalConfig.js';

// Het level wordt volledig uit het CV opgebouwd: elk CV-onderdeel is een set piece (src/pieces).
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super(SCENES.level);
  }

  init({ cv }) {
    this.cv = cv;
    this.theme = retro;
    this.registry.set('currentCv', cv);
    this.finished = false;
    this.intent = 0; // resterende afstand (px) die de held nog loopt; teken = richting
    this.lastInputAt = -1e9;
    this.lastDir = 1;
    this.glideTo = null;
    this.hasMoved = false;
    this.traveling = false;
    this.bonusesOpened = 0;
    this.currentChapter = null;
  }

  create() {
    const groundY = BASE_H - GROUND_H;
    this.groundY = groundY;
    const stations = buildStations(this.cv);

    // --- Layout: set pieces naast elkaar op basis van hun breedte ---
    const layout = [];
    let cursor = START_X;
    for (const st of stations) {
      const bonus = bonusFor(st, this.cv);
      if (bonus) cursor += BONUS_GAP;
      const w = widthOf(st);
      layout.push({ st, x: cursor + w / 2, bonus, bonusX: cursor - BONUS_GAP / 2 - 20 });
      cursor += w + PIECE_GAP;
    }
    const finishX = cursor + 40;
    const worldW = finishX + 600;
    this.worldW = worldW;

    this.physics.world.setBounds(0, 0, worldW, BASE_H + 200);

    // --- Lucht: sterren (alleen 's avonds zichtbaar) + parallax ---
    const W = this.scale.width;
    this.stars = this.add.graphics().setScrollFactor(0.02, 1).setAlpha(0);
    for (let i = 0; i < 160; i++) {
      this.stars.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.4, 1)).fillRect(Phaser.Math.Between(-W, 3 * W), Phaser.Math.Between(-600, groundY - 200), 2, 2);
    }
    this.clouds = this.add.tileSprite(0, 20, 10, 160, 'clouds').setOrigin(0, 0).setScrollFactor(0, 1);
    this.hills = this.add.tileSprite(0, groundY - 260, 10, 300, 'hills').setOrigin(0, 0).setScrollFactor(0, 1);

    // --- Grond ---
    this.ground = this.add.tileSprite(0, groundY, worldW, GROUND_H, 'ground').setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // --- Set pieces + bonussen ---
    this.theme.createTextures(this);
    this.pieces = layout.map(({ st, x }) => {
      const piece = createPiece(this, x, groundY, st, this.theme);
      piece.station = st;
      piece.active = false;
      return piece;
    });
    this.bonuses = layout.filter((l) => l.bonus).map((l) => new Bonus(this, l.bonusX, groundY, l.bonus, this.theme));

    // --- Finish ---
    this.finishX = finishX;
    this.add.image(finishX, groundY, 'flag').setOrigin(0, 1);
    // Halteplaatsen: bij elk set piece, onder elk cadeautje en bij de finish.
    this.stops = [...this.pieces.map((p) => p.stopX), ...this.bonuses.map((b) => b.x), finishX + 40].sort((a, b) => a - b);

    // Dag → avond: keerpunten in de wereld.
    const firstWerk = this.pieces.find((p) => p.station.type === 'work');
    const finale = this.pieces.find((p) => p.station.type === 'finale');
    this.skyKeys = [
      [0, SKY.dag, TINT.dag],
      [firstWerk?.x ?? finishX * 0.5, SKY.middag, TINT.dag],
      [(finale?.x ?? finishX) - 900, SKY.zonsondergang, TINT.zonsondergang],
      [(finale?.x ?? finishX) - 250, SKY.avond, TINT.avond]
    ];

    // --- Speler ---
    this.heroKey = heroKey(this.cv);
    this.hero = new Player(this, 120, groundY, this.heroKey);
    this.player = this.hero.sprite;
    this.vis = this.hero.visual;
    this.dust = this.hero.dust;
    this.physics.add.collider(this.player, this.ground);
    for (const b of this.bonuses) this.physics.add.overlap(this.player, b.gift, () => b.open());
    this.cameras.main.startFollow(this.player, true, CAMERA.followLerp, CAMERA.followLerp, -CAMERA.lookahead, 0);
    this.cameras.main.roundPixels = true;

    this.confetti = this.add.particles(0, 0, 'flower', {
      speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 }, gravityY: 700, rotate: { min: 0, max: 360 },
      lifespan: 1800, scale: { start: 1, end: 0.3 }, emitting: false
    });

    // --- DOM: titelkaart, HUD, hoofdstukken (altijd scherp) ---
    this.setupDom();

    this.layoutScreen();
    this.cameras.main.setZoom(this.zoom * 1.35); // begin ingezoomd; bij de eerste stap zoomt de camera uit
    this.scale.on('resize', this.layoutScreen, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutScreen, this);
      hidePanel();
      this.dom.titlecard.hidden = true;
      this.dom.hud.hidden = true;
      this.dom.chapters.hidden = true;
    });

    // --- Besturing ---
    this.controls = new KeyboardControls(this);
    this.setupInput();
  }

  // ---------- DOM-overlay ----------

  setupDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = { titlecard: $('titlecard'), hud: $('hud'), chapters: $('chapters') };
    this.dom.titlecard.innerHTML = `<h1>${esc(this.cv.naam.toUpperCase())}</h1><p>${esc(this.cv.rol)}</p><p class="start">▼ SCROLL OM TE BEGINNEN ▼</p>`;
    this.dom.titlecard.classList.remove('weg');
    this.dom.titlecard.hidden = false;
    this.dom.hud.hidden = true;
    this.updateHud();

    // Hoofdstukken: snel naar een onderdeel via de CI/CD-pipeline (klik of toets 1–7).
    this.chapters = CHAPTERS.map((c) => {
      const x = c.type === 'finish' ? this.finishX + 40 : this.pieces.find((p) => p.station.type === c.type)?.stopX;
      return x === undefined ? null : { ...c, x };
    }).filter(Boolean);
    this.dom.chapters.innerHTML = this.chapters.map((c, i) => `<button type="button" data-i="${i}"><b>${i + 1}</b>${c.label}</button>`).join('');
    this.dom.chapters.onclick = (e) => {
      const b = e.target.closest('button');
      if (b) this.travelTo(this.chapters[Number(b.dataset.i)].x);
    };
    this.dom.chapters.hidden = false;
    this.input.keyboard.on('keydown', (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= this.chapters.length) this.travelTo(this.chapters[n - 1].x);
    });
  }

  updateHud() {
    const extra = this.bonuses?.length ? `  🎁 ${this.bonusesOpened}/${this.bonuses.length}` : '';
    this.dom.hud.textContent = `${this.cv.naam} · ${this.cv.rol}${extra}`;
  }

  onBonusOpened() {
    this.bonusesOpened++;
    this.updateHud();
    this.sharpenText();
  }

  dismissTitle() {
    if (this.hasMoved) return;
    this.hasMoved = true;
    this.dom.titlecard.classList.add('weg');
    this.time.delayedCall(500, () => (this.dom.titlecard.hidden = true));
    this.dom.hud.hidden = false;
    this.cameras.main.zoomTo(this.zoom, 900, 'Sine.easeInOut');
  }

  /** Alles wat aan de schermgrootte hangt. De wereld (540 px hoog) wordt opgezoomd naar het scherm. */
  layoutScreen() {
    const { width, height } = this.scale;
    this.zoom = Math.max(0.6, Math.min(height / BASE_H, width / 640));
    const cam = this.cameras.main;
    if (this.hasMoved) cam.setZoom(this.zoom);
    const viewH = Math.max(BASE_H, height / this.zoom);
    cam.setBounds(0, BASE_H - viewH, this.worldW, viewH);
    // Parallax-lagen (scrollFactor 0) ruim breder dan het scherm, zodat ze bij elke zoom het beeld vullen.
    for (const layer of [this.clouds, this.hills]) layer.setPosition(-width, layer.y).setSize(width * 3, layer.height);
    this.sharpenText();
  }

  /** Tekst in de wereld renderen op de echte schermresolutie (anders is hij wazig bij opzoomen). */
  sharpenText() {
    const res = Math.min(4, Math.ceil(this.zoom * (window.devicePixelRatio || 1)));
    const walk = (list) => list.forEach((o) => {
      if (o.type === 'Text' && o.style?.resolution !== res) o.setResolution(res);
      if (o.list) walk(o.list);
    });
    walk(this.children.list);
  }

  // ---------- Besturing: één voortgangsmodel ----------

  setupInput() {
    // Muiswiel / trackpad: scroll omlaag (of naar rechts) = verder in het CV.
    this.input.on('wheel', (_pointer, _objects, dx, dy) => {
      const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      this.addIntent(delta * SCROLL_FACTOR);
    });
    // Touch: swipe van rechts naar links = verder.
    this.input.on('pointermove', (p) => {
      if (p.isDown && p.wasTouch) this.addIntent((p.prevPosition.x - p.x) * 2.5 / this.zoom);
    });
    // Voorkom dat de pagina zelf meescrollt terwijl je met de muis boven de game zit.
    if (!this.game.wheelGuard) {
      this.game.wheelGuard = true;
      this.game.canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      this.game.canvas.style.touchAction = 'none';
    }
  }

  addIntent(px) {
    if (this.traveling || Math.abs(px) < 0.01) return;
    this.intent = Phaser.Math.Clamp(this.intent + px, -INTENT_MAX, INTENT_MAX);
    this.lastInputAt = this.game.loop.time;
    this.glideTo = null;
  }

  /** Springen via tikken/klikken (bijv. op een cadeautje): altijd een volle sprong, er is geen knop om los te laten. */
  requestJump() {
    this.hero.bufferJump(this.game.loop.time, true);
  }

  /**
   * Snelreis via de CI/CD-pipeline: er komt een buis uit de grond, de held zakt erin,
   * de camera schiet naar het gekozen hoofdstuk en de held komt daar uit een buis omhoog.
   */
  travelTo(destX) {
    if (this.traveling || Math.abs(destX - this.player.x) < 20) return;
    this.dismissTitle();
    this.traveling = true;
    this.intent = 0;
    this.glideTo = null;
    const cam = this.cameras.main;
    const from = this.player.x;
    const pipeIn = this.add.image(from, this.groundY + 4, 'pipeline').setOrigin(0.5, 1).setDepth(6).setScale(1, 0);
    this.player.setVelocity(0);
    this.tweens.add({ targets: pipeIn, scaleY: 1, duration: 180, ease: 'Back.out' });
    this.tweens.add({ targets: this.vis, alpha: 0, duration: 200, delay: 220 });
    this.tweens.add({
      targets: this.hero, sink: 90, duration: 260, delay: 160, ease: 'Quad.in',
      onComplete: () => {
        this.tweens.add({ targets: pipeIn, scaleY: 0, duration: 180, onComplete: () => pipeIn.destroy() });
        cam.stopFollow();
        cam.pan(destX + CAMERA.lookahead, cam.midPoint.y, TRAVEL_MS, 'Cubic.easeInOut', true, (_c, progress) => {
          if (progress < 1) return;
          this.player.setPosition(destX, this.groundY - 30).setVelocity(0);
          this.lastDir = 1;
          cam.followOffset.x = -CAMERA.lookahead;
          const pipeOut = this.add.image(destX, this.groundY + 4, 'pipeline').setOrigin(0.5, 1).setDepth(6).setScale(1, 0);
          this.tweens.add({ targets: pipeOut, scaleY: 1, duration: 180, ease: 'Back.out' });
          this.tweens.add({ targets: this.vis, alpha: 1, duration: 150, delay: 160 });
          this.tweens.add({
            targets: this.hero, sink: 0, duration: 300, delay: 160, ease: 'Back.out',
            onComplete: () => {
              this.dust.explode(10, destX, this.groundY);
              this.tweens.add({ targets: pipeOut, scaleY: 0, duration: 200, delay: 150, onComplete: () => pipeOut.destroy() });
              cam.startFollow(this.player, true, 0.09, 0.09, -CAMERA.lookahead, 0);
              this.traveling = false;
            }
          });
        });
      }
    });
  }

  update(time, delta) {
    this.updateSky();
    if (this.traveling) {
      this.updateParallax();
      return;
    }
    const { player } = this;
    const dt = delta / 1000;
    const grounded = player.body.blocked.down;
    const direction = this.controls.direction();
    if (direction) this.addIntent(direction * KEY_RATE * dt * 2);
    if (this.controls.jumpJustPressed()) this.hero.bufferJump(time);

    // --- Halteplaats: geen input meer en weinig in de tank → glijd naar het dichtstbijzijnde onderdeel ---
    if (!this.glideTo && time - this.lastInputAt > IDLE_BEFORE_SNAP && Math.abs(this.intent) < 60 && this.hasMoved) {
      const ahead = this.stops.find((s) => (s - player.x) * this.lastDir > -40 && Math.abs(s - player.x) < STOP_SNAP);
      if (ahead !== undefined && Math.abs(ahead - player.x) > 4) this.glideTo = ahead;
      this.intent = 0;
    }

    // --- Gewenste snelheid ---
    let target = 0;
    if (this.glideTo !== null) {
      const d = this.glideTo - player.x;
      if (Math.abs(d) < 3) this.glideTo = null;
      else target = Math.sign(d) * Math.min(MOVEMENT.maxSpeed * 0.8, 40 + Math.abs(d) * 3);
    } else if (Math.abs(this.intent) > 0.5) {
      // Snelheid schaalt mee met wat er nog "in de tank" zit: vloeiend uitlopen i.p.v. abrupt stoppen.
      target = Math.sign(this.intent) * Math.min(MOVEMENT.maxSpeed, 80 + Math.abs(this.intent) * 2.2);
    }

    const newVx = this.hero.update(time, delta, target, this.controls.jumpHeld());
    this.lastDir = this.hero.facing;

    // Tank leegrijden met de werkelijk afgelegde afstand.
    if (Math.abs(this.intent) > 0.5 && Math.sign(newVx) === Math.sign(this.intent)) {
      const travelled = Math.min(Math.abs(newVx) * dt, Math.abs(this.intent));
      this.intent -= Math.sign(this.intent) * travelled;
    }

    if (Math.abs(newVx) > 5) this.dismissTitle();

    // --- Camera kijkt vooruit in looprichting ---
    const cam = this.cameras.main;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, -this.lastDir * CAMERA.lookahead, 0.03);

    this.updateParallax();

    // Spring-hint bij een cadeautje in de buurt.
    for (const b of this.bonuses) b.showHint(Math.abs(b.x - player.x) < 110 && grounded);

    this.updatePieces();
    this.updateChapters();
  }

  updateParallax() {
    const cam = this.cameras.main;
    this.clouds.tilePositionX = cam.scrollX * 0.1;
    this.hills.tilePositionX = cam.scrollX * 0.35;
  }

  /** Luchtkleur, tint van heuvels/wolken en sterren volgen de positie van de camera. */
  updateSky() {
    const x = this.cameras.main.midPoint.x;
    const keys = this.skyKeys;
    let i = 0;
    while (i < keys.length - 2 && x > keys[i + 1][0]) i++;
    const [x0, s0, t0] = keys[i];
    const [x1, s1, t1] = keys[i + 1];
    const f = Phaser.Math.Clamp((x - x0) / Math.max(1, x1 - x0), 0, 1);
    const mix = (a, b) => {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, f * 100);
      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    };
    this.cameras.main.setBackgroundColor(mix(s0, s1));
    const tint = mix(t0, t1);
    this.hills.setTint(tint);
    this.clouds.setTint(tint);
    this.ground.setTint(tint);
    const night = i === keys.length - 2 ? f : 0;
    this.stars.setAlpha(night);
  }

  /**
   * Set pieces starten hun animatie zodra je erbij bent (of over hun knop loopt).
   * De tekstbox hoort bij het dichtstbijzijnde onderdeel en blijft staan tot je bij het volgende bent.
   */
  updatePieces() {
    const px = this.player.x;
    const cam = this.cameras.main.worldView;
    for (const piece of this.pieces) {
      const visible = piece.x - piece.halfWidth < cam.right - 40 && piece.x + piece.halfWidth > cam.x;
      const near = piece.triggerAt !== undefined
        ? visible && px > piece.triggerAt && px < piece.x + piece.halfWidth + 200
        : visible && Math.abs(piece.stopX - px) < piece.halfWidth + 260;
      if (near && !piece.active) piece.enter();
      if (!near && piece.active) piece.leave();
      piece.active = near;
    }

    if (px >= this.finishX - 20) {
      if (!this.finished) {
        this.finished = true;
        this.confetti.explode(60, this.finishX + 30, BASE_H - 200);
      }
      showPanel('finish', stationHtml({ type: 'finish' }, this.cv));
      return;
    }
    // Dichtstbijzijnde onderdeel (gemeten vanaf de halteplaats); tekstbox alleen als dat onderdeel er een heeft.
    let nearest = null;
    for (const piece of this.pieces) {
      const d = Math.abs(piece.stopX - px);
      if (d < piece.halfWidth + 120 && (!nearest || d < Math.abs(nearest.stopX - px))) nearest = piece;
    }
    if (nearest?.usesPanel) showPanel(`station-${nearest.x}`, stationHtml(nearest.station, this.cv));
    else hidePanel();
  }

  updateChapters() {
    const px = this.player.x;
    let current = 0;
    this.chapters.forEach((c, i) => { if (px >= c.x - 80) current = i; });
    if (current === this.currentChapter) return;
    this.currentChapter = current;
    [...this.dom.chapters.children].forEach((b, i) => b.classList.toggle('nu', i === current));
  }
}
