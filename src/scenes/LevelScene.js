import Phaser from 'phaser';
import { buildStations } from '../cv.js';
import { showPanel, hidePanel, stationHtml } from '../ui.js';
import { createPiece, widthOf, bonusFor } from '../pieces/index.js';
import Bonus from '../pieces/Bonus.js';
import { THEMES } from '../themes/index.js';
import { heroKey } from '../heroes.js';

const BASE_H = 540; // wereldhoogte; de camera zoomt dit op naar de schermhoogte (scherp, geen opgerekt canvas)
const GROUND_H = 64;
const START_X = 360;
const PIECE_GAP = 200; // lucht tussen twee set pieces
const BONUS_GAP = 150; // extra ruimte vóór een set piece met een cadeautje
const HERO_SCALE = 3;

// --- Game feel: alle knoppen om aan te draaien op één plek ---
const MAX_SPEED = 300; // px/s
const ACCEL_GROUND = 2600; // px/s² optrekken op de grond
const DECEL_GROUND = 3400; // px/s² afremmen op de grond (iets sneller dan optrekken = strak)
const ACCEL_AIR = 1700; // minder controle in de lucht
const DECEL_AIR = 900;
const JUMP = 640; // afzetsnelheid; springhoogte ≈ JUMP² / (2 · 1400) ≈ 146 px
const FALL_GRAVITY = 900; // extra zwaartekracht bij het vallen: snel omhoog, sneller omlaag = niet zweverig
const JUMP_CUT = 0.45; // springknop vroeg loslaten = lagere sprong
const COYOTE_MS = 110; // nog springen vlak nadat je van een rand loopt
const BUFFER_MS = 130; // springen vlak vóór de landing wordt onthouden
const LOOKAHEAD = 140; // camera kijkt vooruit in looprichting

// --- Voortgang: scrollen, swipen en pijltjes zijn één en hetzelfde ("verder in het CV") ---
const SCROLL_FACTOR = 1.2; // px lopen per px scroll
const KEY_RATE = 420; // px "scroll" per seconde zolang je een pijltje vasthoudt
const INTENT_MAX = 240; // max opgespaarde loopafstand: stop je met scrollen, dan sta je binnen ~1 s stil
const STOP_SNAP = 260; // binnen deze afstand van een halteplaats glijdt de held er vanzelf naartoe
const IDLE_BEFORE_SNAP = 140; // ms zonder input voordat de held naar de halteplaats glijdt
const TRAVEL_MS = 750; // snelreis door de pipeline

// --- Scroll ↔ animatie: bij een onderdeel houdt de halteplaats je vast tot de animatie klaar is ---
const FAST_FORWARD = 3; // doorscrollen tijdens de animatie spoelt hem zoveel keer sneller af
const GATE_MAX_MS = 4000; // nooit langer vasthouden dan dit

const CHAPTERS = [
  { type: 'profiel', label: 'Profiel' },
  { type: 'expertise', label: 'Expertise' },
  { type: 'skills', label: 'Vaardigheden' },
  { type: 'opleiding', label: 'Opleiding' },
  { type: 'werk', label: 'Ervaring' },
  { type: 'finale', label: 'Na het werk' },
  { type: 'finish', label: 'Contact' }
];

// Het level wordt volledig uit het CV opgebouwd: elk CV-onderdeel is een set piece (src/pieces).
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('level');
  }

  init({ cv, startX }) {
    this.cv = cv;
    this.theme = THEMES[this.registry.get('theme')] ?? THEMES.retro;
    this.startX = startX;
    this.gate = null;
    this.ff = 1;
    this.registry.set('currentCv', cv);
    this.finished = false;
    this.intent = 0; // resterende afstand (px) die de held nog loopt; teken = richting
    this.lastInputAt = -1e9;
    this.lastDir = 1;
    this.glideTo = null;
    this.hasMoved = false;
    this.traveling = false;
    this.sink = 0;
    this.lastGroundedAt = 0;
    this.jumpPressedAt = -1e9;
    this.wasGrounded = false;
    this.lastVy = 0;
    this.bonusesOpened = 0;
  }

  create() {
    this.theme.createTextures(this); // eerst: grond, lucht en set pieces gebruiken thema-textures
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
    this.clouds = this.add.tileSprite(0, 20, 10, 160, this.theme.tex('clouds')).setOrigin(0, 0).setScrollFactor(0, 1);
    this.hills = this.add.tileSprite(0, groundY - 260, 10, 300, this.theme.tex('hills')).setOrigin(0, 0).setScrollFactor(0, 1);

    // --- Grond ---
    this.ground = this.add.tileSprite(0, groundY, worldW, GROUND_H, this.theme.tex('ground')).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // --- Set pieces + bonussen ---
    this.pieces = layout.map(({ st, x }) => {
      const piece = createPiece(this, x, groundY, st, this.theme);
      piece.station = st;
      piece.active = false;
      return piece;
    });
    this.bonuses = layout.filter((l) => l.bonus).map((l) => new Bonus(this, l.bonusX, groundY, l.bonus, this.theme));

    // --- Finish ---
    this.finishX = finishX;
    this.add.image(finishX, groundY, this.theme.tex('flag')).setOrigin(0, 1);
    // Halteplaatsen: bij elk set piece, onder elk cadeautje en bij de finish.
    this.stops = [...this.pieces.map((p) => p.stopX), ...this.bonuses.map((b) => b.x), finishX + 40].sort((a, b) => a - b);

    // Dag → avond: keerpunten in de wereld.
    const firstWerk = this.pieces.find((p) => p.station.type === 'werk');
    const finale = this.pieces.find((p) => p.station.type === 'finale');
    const { sky, tint } = this.theme;
    this.skyKeys = [
      [0, sky.dag, tint.dag],
      [firstWerk?.x ?? finishX * 0.5, sky.middag, tint.dag],
      [(finale?.x ?? finishX) - 900, sky.zonsondergang, tint.zonsondergang],
      [(finale?.x ?? finishX) - 250, sky.avond, tint.avond]
    ];

    // --- Speler ---
    // Hitbox en uiterlijk zijn gescheiden: squash & wiebel mogen de physics niet beïnvloeden.
    this.heroKey = heroKey(this.cv);
    const startX = this.startX ?? 120;
    this.player = this.physics.add.sprite(startX, groundY - 60, this.heroKey, 'idle0')
      .setScale(HERO_SCALE).setCollideWorldBounds(true).setVisible(false);
    this.player.body.setSize(10, 16).setOffset(3, 2);
    this.vis = this.add.sprite(startX, groundY, this.heroKey, 'idle0')
      .setOrigin(0.5, 1).setScale(HERO_SCALE).setDepth(5).play(`${this.heroKey}-idle`);
    this.syncVis = () => this.vis.setPosition(this.player.x, this.player.y + 27 + this.sink);
    this.events.on('postupdate', this.syncVis);
    this.physics.add.collider(this.player, this.ground);
    for (const b of this.bonuses) this.physics.add.overlap(this.player, b.gift, () => b.open());
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -LOOKAHEAD, 0);
    this.cameras.main.roundPixels = true;

    // Stofwolkjes bij landen en afzetten.
    if (!this.textures.exists('dust')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffff).fillCircle(5, 5, 5).generateTexture('dust', 10, 10).destroy();
    }
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 30, max: 110 }, angle: { min: 200, max: 340 }, gravityY: 200,
      lifespan: 380, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: 0xe9e2d0, emitting: false
    }).setDepth(4);

    this.confetti = this.add.particles(0, 0, this.theme.tex('flower'), {
      speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 }, gravityY: 700, rotate: { min: 0, max: 360 },
      lifespan: 1800, scale: { start: 1, end: 0.3 }, emitting: false
    });

    // --- DOM: titelkaart, HUD, hoofdstukken (altijd scherp) ---
    this.setupDom();

    this.layoutScreen();
    if (this.startX !== undefined) {
      // Na een stijlwissel: geen intro, direct verder waar je was.
      this.hasMoved = true;
      this.dom.titlecard.hidden = true;
      this.dom.hud.hidden = false;
      this.cameras.main.setZoom(this.zoom);
      this.cameras.main.centerOn(startX + LOOKAHEAD, BASE_H / 2);
    } else {
      this.cameras.main.setZoom(this.zoom * 1.35); // begin ingezoomd; bij de eerste stap zoomt de camera uit
    }
    this.scale.on('resize', this.layoutScreen, this);
    this.events.once('shutdown', () => {
      this.events.off('postupdate', this.syncVis); // scene-events overleven een restart (stijlwissel)
      this.tweens.timeScale = 1;
      this.time.timeScale = 1;
      this.scale.off('resize', this.layoutScreen, this);
      hidePanel();
      this.dom.titlecard.hidden = true;
      this.dom.hud.hidden = true;
      this.dom.chapters.hidden = true;
    });

    // --- Besturing ---
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S');
    this.setupInput();
  }

  // ---------- DOM-overlay ----------

  setupDom() {
    const $ = (id) => document.getElementById(id);
    this.dom = { titlecard: $('titlecard'), hud: $('hud'), chapters: $('chapters') };
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
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
    setTimeout(() => (this.dom.titlecard.hidden = true), 500);
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
    this.jumpPressedAt = this.game.loop.time;
    this.jumpIsTap = true;
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
    const pipeIn = this.add.image(from, this.groundY + 4, this.theme.tex('pipeline')).setOrigin(0.5, 1).setDepth(6).setScale(1, 0);
    this.player.setVelocity(0);
    this.tweens.add({ targets: pipeIn, scaleY: 1, duration: 180, ease: 'Back.out' });
    this.tweens.add({ targets: this.vis, alpha: 0, duration: 200, delay: 220 });
    this.tweens.add({
      targets: this, sink: 90, duration: 260, delay: 160, ease: 'Quad.in',
      onComplete: () => {
        this.tweens.add({ targets: pipeIn, scaleY: 0, duration: 180, onComplete: () => pipeIn.destroy() });
        cam.stopFollow();
        cam.pan(destX + LOOKAHEAD, cam.midPoint.y, TRAVEL_MS, 'Cubic.easeInOut', true, (_c, progress) => {
          if (progress < 1) return;
          this.player.setPosition(destX, this.groundY - 30).setVelocity(0);
          this.lastDir = 1;
          cam.followOffset.x = -LOOKAHEAD;
          const pipeOut = this.add.image(destX, this.groundY + 4, this.theme.tex('pipeline')).setOrigin(0.5, 1).setDepth(6).setScale(1, 0);
          this.tweens.add({ targets: pipeOut, scaleY: 1, duration: 180, ease: 'Back.out' });
          this.tweens.add({ targets: this.vis, alpha: 1, duration: 150, delay: 160 });
          this.tweens.add({
            targets: this, sink: 0, duration: 300, delay: 160, ease: 'Back.out',
            onComplete: () => {
              this.dust.explode(10, destX, this.groundY);
              this.tweens.add({ targets: pipeOut, scaleY: 0, duration: 200, delay: 150, onComplete: () => pipeOut.destroy() });
              cam.startFollow(this.player, true, 0.09, 0.09, -LOOKAHEAD, 0);
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
    const { player, keys, vis } = this;
    const dt = delta / 1000;
    const body = player.body;
    const grounded = body.blocked.down;
    if (grounded) this.lastGroundedAt = time;

    // --- Input: pijltjes doen precies wat scrollen doet ---
    const fwd = keys.RIGHT.isDown || keys.D.isDown || keys.DOWN.isDown || keys.S.isDown;
    const back = keys.LEFT.isDown || keys.A.isDown;
    if (fwd !== back) this.addIntent((fwd ? 1 : -1) * KEY_RATE * dt * 2);
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(keys.UP) || JD(keys.SPACE) || JD(keys.W)) this.jumpPressedAt = time;
    const jumpHeld = keys.UP.isDown || keys.SPACE.isDown || keys.W.isDown;

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
      else target = Math.sign(d) * Math.min(MAX_SPEED * 0.8, 40 + Math.abs(d) * 3);
    } else if (Math.abs(this.intent) > 0.5) {
      // Snelheid schaalt mee met wat er nog "in de tank" zit: vloeiend uitlopen i.p.v. abrupt stoppen.
      target = Math.sign(this.intent) * Math.min(MAX_SPEED, 80 + Math.abs(this.intent) * 2.2);
    }

    // --- Optrekken / afremmen ---
    const vx = body.velocity.x;
    const speedingUp = target !== 0 && (Math.sign(target) === Math.sign(vx) || vx === 0) && Math.abs(target) > Math.abs(vx);
    const rate = grounded ? (speedingUp ? ACCEL_GROUND : DECEL_GROUND) : (speedingUp ? ACCEL_AIR : DECEL_AIR);
    const newVx = moveTowards(vx, target, rate * dt);
    player.setVelocityX(newVx);

    // Tank leegrijden met de werkelijk afgelegde afstand.
    if (Math.abs(this.intent) > 0.5 && Math.sign(newVx) === Math.sign(this.intent)) {
      const travelled = Math.min(Math.abs(newVx) * dt, Math.abs(this.intent));
      this.intent -= Math.sign(this.intent) * travelled;
    }

    this.updateGate(newVx, delta);

    if (newVx < -5) { vis.setFlipX(true); this.lastDir = -1; }
    if (newVx > 5) { vis.setFlipX(false); this.lastDir = 1; }

    // --- Springen (optioneel: voor de bonus-cadeautjes) ---
    const canJump = time - this.lastGroundedAt <= COYOTE_MS && body.velocity.y >= 0;
    const wantsJump = time - this.jumpPressedAt <= BUFFER_MS;
    if (wantsJump && canJump) this.jump();
    if (!jumpHeld && body.velocity.y < -150 && this.jumpedByKey && time - this.jumpStartedAt > 90) {
      player.setVelocityY(body.velocity.y * JUMP_CUT);
      this.jumpedByKey = false;
    }
    body.setGravityY(body.velocity.y > 0 ? FALL_GRAVITY : 0);

    // --- Landen: squash + stof ---
    if (grounded && !this.wasGrounded && this.lastVy > 250) {
      this.dust.explode(Math.min(14, Math.round(this.lastVy / 60)), player.x, player.y + 27);
      this.squash(1.25, 0.75);
    }
    this.wasGrounded = grounded;
    this.lastVy = body.velocity.y;

    // --- Lopen: wiebel + af en toe een stofje ---
    const speedRatio = Math.abs(newVx) / MAX_SPEED;
    if (!this.squashing) {
      if (grounded) {
        const bob = Math.sin(time / 55) * 0.06 * speedRatio;
        vis.setScale(HERO_SCALE * (1 + bob), HERO_SCALE * (1 - bob));
        vis.setAngle(Math.sin(time / 110) * 5 * speedRatio);
      } else {
        const stretch = Phaser.Math.Clamp(Math.abs(body.velocity.y) / 2000, 0, 0.15);
        vis.setScale(HERO_SCALE * (1 - stretch), HERO_SCALE * (1 + stretch));
        vis.setAngle(Phaser.Math.Clamp(newVx / 40, -8, 8));
      }
    }
    if (grounded && speedRatio > 0.8 && Math.random() < 0.08) this.dust.explode(1, player.x - Math.sign(newVx) * 10, player.y + 27);

    if (Math.abs(newVx) > 5) this.dismissTitle();

    // --- Camera kijkt vooruit in looprichting ---
    const cam = this.cameras.main;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, -this.lastDir * LOOKAHEAD, 0.03);

    const anim = !grounded ? 'jump' : Math.abs(newVx) > 5 ? 'run' : 'idle';
    vis.play(`${this.heroKey}-${anim}`, true);

    this.updateParallax();

    // Spring-hint bij een cadeautje in de buurt.
    for (const b of this.bonuses) b.showHint(Math.abs(b.x - player.x) < 110 && grounded);

    this.updatePieces();
    this.updateChapters();
  }

  /**
   * Scroll ↔ animatie. Loop je vooruit over de halteplaats van een onderdeel waarvan de animatie
   * nog loopt, dan blijf je daar staan tot hij klaar is. Blijf je scrollen, dan spoelt de animatie
   * sneller door (FAST_FORWARD) in plaats van dat je eraan voorbij loopt. Terug scrollen laat je meteen los.
   */
  updateGate(vx, delta) {
    const player = this.player;
    // Voortgang van alle lopende animaties bijhouden (in "animatietijd", dus incl. doorspoelen).
    for (const p of this.pieces) {
      if (p.done && !p.complete) {
        p.elapsed = (p.elapsed ?? 0) + delta * this.ff;
        if (p.elapsed >= (p.duration ?? 0)) p.complete = true;
      }
    }
    const prevX = this.prevX ?? player.x;
    this.prevX = player.x;
    // Een sprong van >100 px in één frame is snelreis (pipeline) of een reset, geen lopen: niet vasthouden.
    if (!this.gate && vx > 0 && player.x - prevX < 100) {
      this.gate = this.pieces.find((p) => !p.complete && (p.duration ?? 0) > 0 && prevX < p.stopX && player.x >= p.stopX - 2) ?? null;
      if (this.gate) {
        if (!this.gate.done) { this.gate.enter(); this.gate.active = true; }
        this.gateSince = 0;
      }
    }
    if (!this.gate) return this.setFastForward(1);

    this.gateSince += delta;
    const forward = this.intent > 0.5 || this.glideTo !== null && this.glideTo > player.x;
    const back = this.intent < -0.5;
    if (this.gate.complete || back || this.gateSince > GATE_MAX_MS) {
      this.gate = null;
      return this.setFastForward(1);
    }
    // Vasthouden op de halteplaats; vooruit-input = doorspoelen.
    player.setX(this.gate.stopX).setVelocityX(0);
    this.glideTo = null;
    this.setFastForward(forward || this.game.loop.time - this.lastInputAt < 200 ? FAST_FORWARD : 1);
    if (this.intent > 0) this.intent = 0;
  }

  setFastForward(f) {
    if (this.ff === f) return;
    this.ff = f;
    this.tweens.timeScale = f;
    this.time.timeScale = f;
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

  jump() {
    this.player.setVelocityY(-JUMP);
    this.jumpedByKey = !this.jumpIsTap && this.game.loop.time - this.jumpPressedAt <= BUFFER_MS;
    this.jumpIsTap = false;
    this.jumpStartedAt = this.game.loop.time;
    this.jumpPressedAt = -1e9;
    this.lastGroundedAt = -1e9; // geen dubbele coyote-sprong
    this.dust.explode(6, this.player.x, this.player.y + 27);
    this.squash(0.8, 1.2);
  }

  squash(sx, sy) {
    this.squashing = true;
    this.vis.setScale(HERO_SCALE * sx, HERO_SCALE * sy).setAngle(0);
    this.tweens.add({
      targets: this.vis, scaleX: HERO_SCALE, scaleY: HERO_SCALE, duration: 160, ease: 'Back.out',
      onComplete: () => (this.squashing = false)
    });
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

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}
