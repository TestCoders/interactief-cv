import Phaser from 'phaser';
import { GAME, SCENES } from '../config/gameConfig.js';
import { CAMERA, MOVEMENT, PARALLAX, WORLD } from '../config/levelConfig.js';
import { STATION_TYPES, buildStations } from '../cv/stations.js';
import { heroKey } from '../graphics/heroSprites.js';
import { TEXTURES } from '../graphics/worldTextures.js';
import KeyboardControls from '../level/KeyboardControls.js';
import Player from '../level/Player.js';
import ScrollWalkInput from '../level/ScrollWalkInput.js';
import TitleCard from '../level/TitleCard.js';
import { createPiece } from '../pieces/pieceRegistry.js';
import retroTheme from '../themes/retroTheme.js';
import { hidePanel, showPanel } from '../ui/panel.js';
import { stationHtml } from '../ui/stationTemplates.js';

// Het level wordt volledig uit het CV opgebouwd: elk CV-onderdeel is een set piece (src/pieces).
// Besturing: scrollen / ↓ / swipen = lopen (zoals een gewone pagina), of zelf spelen met ← → en springen.
// Alle afstelbare waarden staan in src/config/levelConfig.js.
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super(SCENES.level);
  }

  init({ cv }) {
    this.cv = cv;
    this.theme = retroTheme;
    this.registry.set('currentCv', cv);
    this.finished = false;
    this.hasMoved = false;
  }

  create() {
    // Wereldhoogte = basishoogte; het venster mag groter zijn (Scale.EXPAND), de wereld schaalt niet mee.
    const worldHeight = GAME.height;
    const groundY = worldHeight - WORLD.groundHeight;
    this.groundY = groundY;
    const stations = buildStations(this.cv);
    this.finishX = WORLD.firstStationX + stations.length * WORLD.stationGap;
    const worldWidth = this.finishX + WORLD.finishMargin;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight + WORLD.fallMargin);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBackgroundColor(GAME.backgroundColor);

    this.createBackground(groundY);

    this.ground = this.add.tileSprite(0, groundY, worldWidth, WORLD.groundHeight, TEXTURES.ground).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // --- Set pieces (één per CV-onderdeel) ---
    this.theme.createTextures(this);
    this.pieces = stations.map((station, i) => {
      const piece = createPiece(this, WORLD.firstStationX + i * WORLD.stationGap, groundY, station, this.theme);
      piece.station = station;
      piece.active = false;
      return piece;
    });

    this.add.image(this.finishX, groundY, TEXTURES.flag).setOrigin(0, 1);

    // --- Speler + camera ---
    this.player = new Player(this, WORLD.playerStartX, groundY, heroKey(this.cv));
    this.physics.add.collider(this.player.sprite, this.ground);
    this.cameras.main.startFollow(this.player.sprite, true, CAMERA.followLerp, CAMERA.followLerp, -CAMERA.lookahead, 0);

    // Begin ingezoomd op de titelkaart; bij de eerste stap zoomt de camera uit naar het speelveld.
    this.titleCard = new TitleCard(this, this.cv, this.theme);
    this.cameras.main.setZoom(CAMERA.introZoom);
    this.hud = this.createHud();

    this.layoutScreen();
    this.scale.on('resize', this.layoutScreen, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layoutScreen, this));

    this.controls = new KeyboardControls(this);
    this.scrollWalk = new ScrollWalkInput(this);

    this.confetti = this.add.particles(0, 0, 'flower', {
      speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 }, gravityY: 700, rotate: { min: 0, max: 360 },
      lifespan: 1800, scale: { start: 1, end: 0.3 }, emitting: false
    });

    this.events.once('shutdown', hidePanel);
  }

  createBackground(groundY) {
    const { clouds, hills } = PARALLAX;
    const width = this.scale.width;
    this.clouds = this.add.tileSprite(0, clouds.y, width, clouds.height, TEXTURES.clouds).setOrigin(0, 0).setScrollFactor(0, 1);
    this.hills = this.add.tileSprite(0, groundY - hills.riseAboveGround, width, hills.height, TEXTURES.hills).setOrigin(0, 0).setScrollFactor(0, 1);
  }

  /** Naam en rol linksboven; pas zichtbaar na de intro. */
  createHud() {
    return this.add.text(16, 14, `${this.cv.naam} · ${this.cv.rol}`, {
      fontFamily: this.theme.font, fontSize: '16px', fontStyle: 'bold', color: '#f4e4c1',
      backgroundColor: '#2b2147', padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(10).setAlpha(0);
  }

  /** Alles wat aan de schermgrootte hangt (venster kan elk formaat hebben). */
  layoutScreen() {
    const { width, height } = this.scale;
    this.clouds.setSize(width, PARALLAX.clouds.height);
    this.hills.setSize(width, PARALLAX.hills.height);
    // Wereld verticaal onderaan het scherm; extra hoogte wordt lucht.
    this.cameras.main.setBounds(0, Math.min(0, GAME.height - height), this.physics.world.bounds.width, Math.max(GAME.height, height));
    this.titleCard.layout(width, height);
  }

  update(time, delta) {
    // Gewenste snelheid: toetsenbord wint, anders de opgespaarde scroll-afstand.
    const direction = this.controls.direction();
    let targetSpeed;
    if (direction !== 0) {
      this.scrollWalk.reset();
      targetSpeed = direction * MOVEMENT.maxSpeed;
    } else {
      targetSpeed = this.scrollWalk.targetSpeed();
    }
    if (this.controls.jumpJustPressed()) this.player.bufferJump(time);

    const vx = this.player.update(time, delta, targetSpeed, this.controls.jumpHeld());
    if (direction === 0) this.scrollWalk.consume(vx, delta / 1000);

    if (!this.hasMoved && Math.abs(vx) > MOVEMENT.movingThreshold) this.startPlaying();

    // Camera kijkt vooruit in looprichting.
    const cam = this.cameras.main;
    const wantOffset = -Math.sign(vx || this.player.facing) * CAMERA.lookahead;
    cam.followOffset.x = Phaser.Math.Linear(cam.followOffset.x, wantOffset, CAMERA.lookaheadLerp);

    this.clouds.tilePositionX = cam.scrollX * PARALLAX.clouds.speed;
    this.hills.tilePositionX = cam.scrollX * PARALLAX.hills.speed;

    this.updatePieces();
  }

  /** Eerste stap: titelkaart weg, HUD erin, camera zoomt uit. */
  startPlaying() {
    this.hasMoved = true;
    this.titleCard.dismiss();
    this.tweens.add({ targets: this.hud, alpha: 1, duration: 450, delay: 300 });
    this.cameras.main.zoomTo(1, CAMERA.zoomOutMs, 'Sine.easeInOut');
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

    if (px >= this.finishX - WORLD.finishTriggerDistance) {
      if (!this.finished) {
        this.finished = true;
        this.confetti.explode(60, this.finishX + 30, this.scale.height - 200);
      }
      showPanel(STATION_TYPES.finish, stationHtml({ type: STATION_TYPES.finish }, this.cv));
    } else if (panelPiece) {
      showPanel(`station-${panelPiece.x}`, stationHtml(panelPiece.station, this.cv));
    } else {
      hidePanel();
    }
  }
}
