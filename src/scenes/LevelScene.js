import Phaser from 'phaser';
import { buildStations } from '../cv.js';
import { showPanel, hidePanel, stationHtml, toast } from '../ui.js';

const GROUND_H = 64;
const STATION_GAP = 560;
const START_X = 360;
const SPEED = 280;
const JUMP = 620;

// Het level wordt volledig uit het CV opgebouwd: elk bord is een CV-sectie, elke munt een skill.
export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('level');
  }

  init({ cv }) {
    this.cv = cv;
    this.registry.set('currentCv', cv);
    this.found = 0;
    this.finished = false;
  }

  create() {
    const { height } = this.scale;
    const groundY = height - GROUND_H;
    const stations = buildStations(this.cv);
    const skills = this.cv.skills ?? [];
    const finishX = START_X + stations.length * STATION_GAP + 200;
    const worldW = finishX + 400;

    this.physics.world.setBounds(0, 0, worldW, height + 200);
    this.cameras.main.setBounds(0, 0, worldW, height);

    // --- Achtergrond (parallax) ---
    this.clouds = this.add.tileSprite(0, 20, this.scale.width, 160, 'clouds').setOrigin(0, 0).setScrollFactor(0);
    this.hills = this.add.tileSprite(0, groundY - 260, this.scale.width, 300, 'hills').setOrigin(0, 0).setScrollFactor(0);

    // --- Grond ---
    const ground = this.add.tileSprite(0, groundY, worldW, GROUND_H, 'ground').setOrigin(0, 0);
    this.physics.add.existing(ground, true);

    // --- Borden (CV-secties) ---
    this.stations = stations.map((st, i) => {
      const x = START_X + i * STATION_GAP;
      this.add.image(x, groundY, 'sign').setOrigin(0.5, 1);
      this.add.text(x, groundY - 83, st.label, {
        fontFamily: 'system-ui', fontSize: '11px', fontStyle: 'bold', color: '#1d2433', align: 'center',
        wordWrap: { width: 80 }
      }).setOrigin(0.5);
      return { ...st, x };
    });

    // --- Platforms + munten (skills), verdeeld tussen de borden ---
    const platforms = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    const span = finishX - START_X - 200;
    skills.forEach((skill, i) => {
      const x = START_X + 200 + (span * (i + 0.5)) / Math.max(skills.length, 1);
      const high = i % 2 === 1;
      if (high) platforms.create(x, groundY - 130, 'platform');
      const coin = this.coins.create(x, high ? groundY - 175 : groundY - 70, 'coin');
      coin.skill = skill.naam;
    });
    this.coins.children.iterate((c) =>
      this.tweens.add({ targets: c, scaleX: 0.3, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: Phaser.Math.Between(0, 400) })
    );

    // --- Finish ---
    this.finishX = finishX;
    this.add.image(finishX, groundY, 'flag').setOrigin(0, 1);

    // --- Speler ---
    const tint = Phaser.Display.Color.HexStringToColor(this.cv.kleur ?? '#3c8772').color;
    this.player = this.physics.add.sprite(120, groundY - 60, 'player').setTint(tint).setCollideWorldBounds(true);
    this.player.body.setSize(26, 42).setOffset(3, 2);
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, platforms);
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => this.collect(coin));
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, -120, 0);

    // --- HUD ---
    this.hud = this.add.text(16, 14, '', {
      fontFamily: 'system-ui', fontSize: '18px', fontStyle: 'bold', color: '#1d2433',
      backgroundColor: '#ffffffcc', padding: { x: 10, y: 6 }
    }).setScrollFactor(0).setDepth(10);
    this.updateHud();

    // --- Besturing ---
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,SPACE,A,D,W');

    this.confetti = this.add.particles(0, 0, 'coin', {
      speed: { min: 200, max: 500 }, angle: { min: 220, max: 320 }, gravityY: 700,
      lifespan: 1800, scale: { start: 0.7, end: 0 }, emitting: false
    });

    this.events.once('shutdown', hidePanel);
  }

  collect(coin) {
    coin.disableBody(true, true);
    this.found++;
    this.updateHud();
    toast(`+ ${coin.skill}`);
  }

  updateHud() {
    this.hud.setText(`${this.cv.naam}   ⭐ ${this.found}/${this.coins.getLength()} skills`);
  }

  update() {
    const { player, keys } = this;
    const left = keys.LEFT.isDown || keys.A.isDown;
    const right = keys.RIGHT.isDown || keys.D.isDown;
    const jump = Phaser.Input.Keyboard.JustDown(keys.UP) || Phaser.Input.Keyboard.JustDown(keys.SPACE) || Phaser.Input.Keyboard.JustDown(keys.W);

    player.setVelocityX(left ? -SPEED : right ? SPEED : 0);
    if (left) player.setFlipX(true);
    if (right) player.setFlipX(false);
    if (jump && player.body.blocked.down) player.setVelocityY(-JUMP);

    // Een beetje squash & stretch, zodat het blokje leeft.
    const airborne = !player.body.blocked.down;
    player.setScale(airborne ? 0.92 : 1, airborne ? 1.08 : 1);

    // Parallax.
    const sx = this.cameras.main.scrollX;
    this.clouds.tilePositionX = sx * 0.1;
    this.hills.tilePositionX = sx * 0.35;

    this.updatePanel();
  }

  updatePanel() {
    const px = this.player.x;
    if (px >= this.finishX - 20) {
      if (!this.finished) {
        this.finished = true;
        this.confetti.explode(80, this.finishX + 30, this.scale.height - 200);
      }
      const data = { found: this.found, total: this.coins.getLength() };
      showPanel(`finish-${data.found}`, stationHtml({ type: 'finish', data }, this.cv));
      return;
    }
    const near = this.stations.find((s) => Math.abs(s.x - px) < 90);
    if (near) showPanel(`station-${near.x}`, stationHtml(near, this.cv));
    else hidePanel();
  }
}
