import Phaser from 'phaser';
import { buildStations } from '../cv.js';
import { showPanel, hidePanel, stationHtml } from '../ui.js';
import { createPiece } from '../pieces/index.js';
import retro from '../themes/retro.js';
import { heroKey } from '../heroes.js';

const BASE_H = 540; // wereldhoogte; het venster mag groter zijn (Scale.EXPAND), de wereld schaalt niet mee
const GROUND_H = 64;
const STATION_GAP = 620;
const START_X = 420;
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
const SCROLL_FACTOR = 1.4; // px lopen per px scroll
const SCROLL_MAX = 900; // max opgespaarde loopafstand, zodat hard scrollen niet eindeloos doorloopt

// Het level wordt volledig uit het CV opgebouwd: elk CV-onderdeel is een set piece (src/pieces).
// Besturing: scrollen / ↓ / swipen = lopen (zoals een gewone pagina), of zelf spelen met ← → en springen.
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('level');
  }

  init({ cv }) {
    this.cv = cv;
    this.theme = retro;
    this.registry.set('currentCv', cv);
    this.finished = false;
    this.scrollBudget = 0; // resterende afstand (px) die de speler nog "op scroll" loopt; teken = richting
    this.hasMoved = false;
    this.lastGroundedAt = 0;
    this.jumpPressedAt = -1e9;
    this.wasGrounded = false;
    this.lastVy = 0;
  }

  create() {
    const height = BASE_H;
    const groundY = height - GROUND_H;
    this.groundY = groundY;
    const stations = buildStations(this.cv);
    const finishX = START_X + stations.length * STATION_GAP;
    const worldW = finishX + 400;

    this.physics.world.setBounds(0, 0, worldW, height + 200);
    this.cameras.main.setBounds(0, 0, worldW, height);
    this.cameras.main.setBackgroundColor('#9fd6ff');

    // --- Achtergrond (parallax) ---
    this.clouds = this.add.tileSprite(0, 20, this.scale.width, 160, 'clouds').setOrigin(0, 0).setScrollFactor(0, 1);
    this.hills = this.add.tileSprite(0, groundY - 260, this.scale.width, 300, 'hills').setOrigin(0, 0).setScrollFactor(0, 1);

    // --- Grond ---
    this.ground = this.add.tileSprite(0, groundY, worldW, GROUND_H, 'ground').setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // --- Set pieces (één per CV-onderdeel) ---
    this.theme.createTextures(this);
    this.pieces = stations.map((st, i) => {
      const piece = createPiece(this, START_X + i * STATION_GAP, groundY, st, this.theme);
      piece.station = st;
      piece.active = false;
      return piece;
    });

    // --- Finish ---
    this.finishX = finishX;
    this.add.image(finishX, groundY, 'flag').setOrigin(0, 1);

    // --- Speler ---
    // Hitbox en uiterlijk zijn gescheiden: squash & wiebel mogen de physics niet beïnvloeden.
    this.heroKey = heroKey(this.cv);
    this.player = this.physics.add.sprite(120, groundY - 60, this.heroKey, 'idle0')
      .setScale(HERO_SCALE).setCollideWorldBounds(true).setVisible(false);
    this.player.body.setSize(10, 16).setOffset(3, 2);
    this.vis = this.add.sprite(120, groundY, this.heroKey, 'idle0')
      .setOrigin(0.5, 1).setScale(HERO_SCALE).setDepth(5).play(`${this.heroKey}-idle`);
    this.events.on('postupdate', () => this.vis.setPosition(this.player.x, this.player.y + 27));
    this.physics.add.collider(this.player, this.ground);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09, -LOOKAHEAD, 0);

    // Stofwolkjes bij landen en afzetten.
    if (!this.textures.exists('dust')) {
      const g = this.make.graphics({ add: false });
      g.fillStyle(0xffffff).fillCircle(5, 5, 5).generateTexture('dust', 10, 10).destroy();
    }
    this.dust = this.add.particles(0, 0, 'dust', {
      speed: { min: 30, max: 110 }, angle: { min: 200, max: 340 }, gravityY: 200,
      lifespan: 380, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: 0xe9e2d0, emitting: false
    }).setDepth(4);

    // --- Titelkaart: de eerste indruk. Verdwijnt zodra je gaat lopen; de camera zoomt dan uit. ---
    const { font } = this.theme;
    const W = this.scale.width;
    this.titleCard = this.add.container(0, 0).setScrollFactor(0).setDepth(20);
    const shade = this.add.rectangle(0, 0, W * 3, BASE_H * 3, 0x1a1430, 0.35).setOrigin(0.5);
    const name = this.add.text(0, -70, this.cv.naam.toUpperCase(), {
      fontFamily: font, fontSize: '54px', fontStyle: 'bold', color: '#ffd23f', stroke: '#1a1430', strokeThickness: 10
    }).setOrigin(0.5);
    const rol = this.add.text(0, -10, this.cv.rol, {
      fontFamily: font, fontSize: '22px', fontStyle: 'bold', color: '#f4e4c1', stroke: '#1a1430', strokeThickness: 6
    }).setOrigin(0.5);
    const start = this.add.text(0, 70, '▼  SCROLL OM TE BEGINNEN  ▼', {
      fontFamily: font, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#1a1430', strokeThickness: 6
    }).setOrigin(0.5);
    const keysHint = this.add.text(0, 104, 'of ← → lopen · spatie springen', {
      fontFamily: font, fontSize: '14px', color: '#f4e4c1', stroke: '#1a1430', strokeThickness: 4
    }).setOrigin(0.5);
    this.titleCard.add([shade, name, rol, start, keysHint]);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 500, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    this.tweens.add({ targets: name, y: -76, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    name.setScale(0);
    this.tweens.add({ targets: name, scale: 1, duration: 600, ease: 'Back.out', delay: 150 });

    // Begin ingezoomd op de speler; bij de eerste stap zoomt de camera uit naar het speelveld.
    this.cameras.main.setZoom(1.35);

    // HUD (pas zichtbaar na de intro).
    this.hud = this.add.text(16, 14, `${this.cv.naam} · ${this.cv.rol}`, {
      fontFamily: font, fontSize: '16px', fontStyle: 'bold', color: '#f4e4c1',
      backgroundColor: '#2b2147', padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(10).setAlpha(0);

    this.layoutScreen();
    this.scale.on('resize', this.layoutScreen, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layoutScreen, this));

    // --- Besturing ---
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S');
    this.setupScrollWalking();

    this.confetti = this.add.particles(0, 0, 'flower', {
      speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 }, gravityY: 700, rotate: { min: 0, max: 360 },
      lifespan: 1800, scale: { start: 1, end: 0.3 }, emitting: false
    });

    this.events.once('shutdown', hidePanel);
  }

  /** Alles wat aan de schermgrootte hangt (venster kan elk formaat hebben). */
  layoutScreen() {
    const { width, height } = this.scale;
    this.clouds.setSize(width, 160);
    this.hills.setSize(width, 300);
    // Wereld verticaal onderaan het scherm; extra hoogte wordt lucht.
    this.cameras.main.setBounds(0, Math.min(0, BASE_H - height), this.physics.world.bounds.width, Math.max(BASE_H, height));
    if (this.titleCard?.active) this.titleCard.setPosition(width / 2, height / 2 - 30);
  }

  // ---------- Besturing ----------

  setupScrollWalking() {
    // Muiswiel / trackpad: scroll omlaag (of naar rechts) = vooruit lopen.
    this.input.on('wheel', (_pointer, _objects, dx, dy) => {
      const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      this.addScroll(delta * SCROLL_FACTOR);
    });
    // Touch: swipe van rechts naar links = vooruit.
    this.input.on('pointermove', (p) => {
      if (p.isDown && p.wasTouch) this.addScroll((p.prevPosition.x - p.x) * 2.5);
    });
    // Voorkom dat de pagina zelf meescrollt terwijl je met de muis boven de game zit.
    if (!this.game.wheelGuard) {
      this.game.wheelGuard = true;
      this.game.canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      this.game.canvas.style.touchAction = 'none';
    }
  }

  addScroll(px) {
    this.scrollBudget = Phaser.Math.Clamp(this.scrollBudget + px, -SCROLL_MAX, SCROLL_MAX);
  }

  update(time, delta) {
    const { player, keys, vis } = this;
    const dt = delta / 1000;
    const body = player.body;
    const grounded = body.blocked.down;
    if (grounded) this.lastGroundedAt = time;

    // --- Input ---
    const kbLeft = keys.LEFT.isDown || keys.A.isDown;
    const kbRight = keys.RIGHT.isDown || keys.D.isDown || keys.DOWN.isDown || keys.S.isDown;
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(keys.UP) || JD(keys.SPACE) || JD(keys.W)) this.jumpPressedAt = time;
    const jumpHeld = keys.UP.isDown || keys.SPACE.isDown || keys.W.isDown;

    // --- Gewenste snelheid: toetsenbord wint, anders de opgespaarde scroll-afstand ---
    let target = 0;
    const kbDir = kbLeft ? -1 : kbRight ? 1 : 0;
    const scrolling = kbDir === 0 && Math.abs(this.scrollBudget) > 0.5;
    if (kbDir !== 0) {
      this.scrollBudget = 0;
      target = kbDir * MAX_SPEED;
    } else if (scrolling) {
      // Snelheid schaalt mee met wat er nog "in de tank" zit: vloeiend uitlopen i.p.v. abrupt stoppen.
      target = Math.sign(this.scrollBudget) * Math.min(MAX_SPEED, 90 + Math.abs(this.scrollBudget) * 2.2);
    }

    // --- Optrekken / afremmen (in plaats van direct op topsnelheid) ---
    const vx = body.velocity.x;
    const speedingUp = target !== 0 && (Math.sign(target) === Math.sign(vx) || vx === 0) && Math.abs(target) > Math.abs(vx);
    const rate = grounded ? (speedingUp ? ACCEL_GROUND : DECEL_GROUND) : (speedingUp ? ACCEL_AIR : DECEL_AIR);
    const newVx = moveTowards(vx, target, rate * dt);
    player.setVelocityX(newVx);

    // Scroll-tank leegrijden met de werkelijk afgelegde afstand.
    if (scrolling && Math.sign(newVx) === Math.sign(this.scrollBudget)) {
      const travelled = Math.min(Math.abs(newVx) * dt, Math.abs(this.scrollBudget));
      this.scrollBudget -= Math.sign(this.scrollBudget) * travelled;
    }

    if (newVx < -5) vis.setFlipX(true);
    if (newVx > 5) vis.setFlipX(false);

    // --- Springen: coyote time + jump buffer + variabele hoogte ---
    const canJump = time - this.lastGroundedAt <= COYOTE_MS && body.velocity.y >= 0;
    const wantsJump = time - this.jumpPressedAt <= BUFFER_MS;
    if (wantsJump && canJump) this.jump();
    if (!jumpHeld && body.velocity.y < -150 && this.jumpedByKey) {
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

    if (Math.abs(newVx) > 5 && !this.hasMoved) {
      this.hasMoved = true;
      this.tweens.add({ targets: this.titleCard, alpha: 0, duration: 450, onComplete: () => this.titleCard.destroy() });
      this.tweens.add({ targets: this.hud, alpha: 1, duration: 450, delay: 300 });
      this.cameras.main.zoomTo(1, 900, 'Sine.easeInOut');
    }

    // --- Camera kijkt vooruit in looprichting ---
    const cam = this.cameras.main;
    const wantOffset = -Math.sign(newVx || (vis.flipX ? -1 : 1)) * LOOKAHEAD;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, wantOffset, 0.03);

    const anim = !grounded ? 'jump' : Math.abs(newVx) > 5 ? 'run' : 'idle';
    vis.play(`${this.heroKey}-${anim}`, true);

    // Parallax.
    this.clouds.tilePositionX = cam.scrollX * 0.1;
    this.hills.tilePositionX = cam.scrollX * 0.35;

    this.updatePieces();
  }

  jump() {
    this.player.setVelocityY(-JUMP);
    this.jumpedByKey = this.time.now - this.jumpPressedAt <= BUFFER_MS;
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

  /** Set pieces activeren als je in de buurt komt (animatie) en het paneel tonen waar dat hoort. */
  updatePieces() {
    const px = this.player.x;
    let panelPiece = null;
    for (const piece of this.pieces) {
      const near = Math.abs(piece.x - px) < piece.range;
      if (near && !piece.active) piece.enter();
      if (!near && piece.active) piece.leave();
      piece.active = near;
      if (near && piece.usesPanel) panelPiece = piece;
    }

    if (px >= this.finishX - 20) {
      if (!this.finished) {
        this.finished = true;
        this.confetti.explode(60, this.finishX + 30, this.scale.height - 200);
      }
      showPanel('finish', stationHtml({ type: 'finish' }, this.cv));
    } else if (panelPiece) {
      showPanel(`station-${panelPiece.x}`, stationHtml(panelPiece.station, this.cv));
    } else {
      hidePanel();
    }
  }
}

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}
