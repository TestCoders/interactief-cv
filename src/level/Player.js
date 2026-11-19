import Phaser from 'phaser';
import { MOVEMENT, PLAYER } from '../config/levelConfig.js';
import { heroAnim } from '../graphics/heroSprites.js';
import { TEXTURES } from '../graphics/worldTextures.js';
import { audio } from '../audio/index.js';

const NEVER = -1e9;

// De held: physics-hitbox (onzichtbaar) plus een losse sprite voor het uiterlijk,
// zodat squash, wiebel en kantelen de physics niet beïnvloeden.
export default class Player {
  /**
   * De hitbox gebruikt altijd de pixel-held (zelfde gameplay in elk thema); wat je ziet is de held van het thema.
   * @param {{ visualKey?: string, scale?: number, originY?: number }} look  uiterlijk per thema
   */
  constructor(scene, x, groundY, textureKey, look = {}) {
    this.scene = scene;
    this.bodyKey = textureKey;
    this.textureKey = look.visualKey ?? textureKey;
    this.scale = look.scale ?? PLAYER.scale;
    this.lastGroundedAt = 0;
    this.jumpPressedAt = NEVER;
    this.jumpedByKey = false;
    this.wasGrounded = false;
    this.lastVy = 0;
    this.sink = 0;
    this.squashing = false;

    const { body } = PLAYER;
    this.sprite = scene.physics.add.sprite(x, groundY - PLAYER.spawnHeight, textureKey, 'idle0')
      .setScale(PLAYER.scale).setCollideWorldBounds(true).setVisible(false);
    this.sprite.body.setSize(body.width, body.height).setOffset(body.offsetX, body.offsetY);

    this.visual = scene.add.sprite(x, groundY, this.textureKey, 'idle0')
      .setOrigin(0.5, look.originY ?? 1).setScale(this.scale).setDepth(5).play(heroAnim(this.textureKey, 'idle'));
    scene.events.on('postupdate', this.syncVisual, this);
    scene.events.once('shutdown', () => scene.events.off('postupdate', this.syncVisual, this));

    this.dust = scene.add.particles(0, 0, TEXTURES.dust, {
      speed: { min: 30, max: 110 }, angle: { min: 200, max: 340 }, gravityY: 200,
      lifespan: 380, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: 0xe9e2d0, emitting: false
    }).setDepth(4);
  }

  get x() {
    return this.sprite.x;
  }

  get feetY() {
    return this.sprite.body.bottom;
  }

  /** -1 = kijkt naar links, 1 = naar rechts. */
  get facing() {
    return this.visual.flipX ? -1 : 1;
  }

  syncVisual() {
    this.visual.setPosition(this.sprite.x, this.feetY + (this.sink ?? 0));
  }

  /** Springknop ingedrukt: wordt even onthouden (jump buffer). */
  bufferJump(time, tap = false) {
    this.jumpIsTap = tap;
    this.jumpPressedAt = time;
  }

  /**
   * Eén frame: optrekken/afremmen naar targetSpeed, springen en de juice.
   * @returns {number} de nieuwe horizontale snelheid
   */
  update(time, delta, targetSpeed, jumpHeld) {
    const { sprite, visual } = this;
    const body = sprite.body;
    const dt = delta / 1000;
    const grounded = body.blocked.down;
    if (grounded) this.lastGroundedAt = time;

    // --- Optrekken / afremmen (in plaats van direct op topsnelheid) ---
    const vx = body.velocity.x;
    const speedingUp = targetSpeed !== 0 && (Math.sign(targetSpeed) === Math.sign(vx) || vx === 0) && Math.abs(targetSpeed) > Math.abs(vx);
    const rate = grounded
      ? (speedingUp ? MOVEMENT.accelGround : MOVEMENT.decelGround)
      : (speedingUp ? MOVEMENT.accelAir : MOVEMENT.decelAir);
    const newVx = moveTowards(vx, targetSpeed, rate * dt);
    sprite.setVelocityX(newVx);

    const moving = Math.abs(newVx) > MOVEMENT.movingThreshold;
    if (newVx < -MOVEMENT.movingThreshold) visual.setFlipX(true);
    if (newVx > MOVEMENT.movingThreshold) visual.setFlipX(false);

    // --- Springen: coyote time + jump buffer + variabele hoogte ---
    const canJump = time - this.lastGroundedAt <= MOVEMENT.coyoteMs && body.velocity.y >= 0;
    const wantsJump = time - this.jumpPressedAt <= MOVEMENT.jumpBufferMs;
    if (wantsJump && canJump) this.jump(time);
    if (!jumpHeld && body.velocity.y < -MOVEMENT.jumpCutMinUpSpeed && this.jumpedByKey && time - this.jumpStartedAt > 90) {
      sprite.setVelocityY(body.velocity.y * MOVEMENT.jumpCut);
      this.jumpedByKey = false;
    }
    body.setGravityY(body.velocity.y > 0 ? MOVEMENT.fallGravity : 0);

    // --- Landen: squash + stof ---
    if (grounded && !this.wasGrounded && this.lastVy > MOVEMENT.hardLandingSpeed) {
      this.dust.explode(Math.min(14, Math.round(this.lastVy / 60)), sprite.x, this.feetY + (this.sink ?? 0));
      this.squash(1.25, 0.75);
      audio.play('land');
    }
    this.wasGrounded = grounded;
    this.lastVy = body.velocity.y;

    // --- Lopen: wiebel + af en toe een stofje ---
    const speedRatio = Math.abs(newVx) / MOVEMENT.maxSpeed;
    if (!this.squashing) {
      if (grounded) {
        const bob = Math.sin(time / 55) * 0.06 * speedRatio;
        visual.setScale(this.scale * (1 + bob), this.scale * (1 - bob));
        visual.setAngle(Math.sin(time / 110) * 5 * speedRatio);
      } else {
        const stretch = Phaser.Math.Clamp(Math.abs(body.velocity.y) / 2000, 0, 0.15);
        visual.setScale(this.scale * (1 - stretch), this.scale * (1 + stretch));
        visual.setAngle(this.scene.cutscene ? 0 : Phaser.Math.Clamp(newVx / 40, -8, 8));
      }
    }
    if (grounded && speedRatio > 0.8 && Math.random() < 0.08) this.dust.explode(1, sprite.x - Math.sign(newVx) * 10, this.feetY + (this.sink ?? 0));

    const anim = !grounded ? 'jump' : moving ? 'run' : 'idle';
    visual.play(heroAnim(this.textureKey, anim), true);

    return newVx;
  }

  jump(time) {
    this.sprite.setVelocityY(-MOVEMENT.jumpVelocity);
    this.jumpedByKey = !this.jumpIsTap && time - this.jumpPressedAt <= MOVEMENT.jumpBufferMs;
    this.jumpIsTap = false;
    this.jumpStartedAt = time;
    this.jumpPressedAt = NEVER;
    this.lastGroundedAt = NEVER; // geen dubbele coyote-sprong
    this.dust.explode(6, this.sprite.x, this.feetY + (this.sink ?? 0));
    this.squash(0.8, 1.2);
    audio.play('jump');
  }

  squash(sx, sy) {
    this.squashing = true;
    this.visual.setScale(this.scale * sx, this.scale * sy).setAngle(0);
    this.scene.tweens.add({
      targets: this.visual, scaleX: this.scale, scaleY: this.scale, duration: 160, ease: 'Back.out',
      onComplete: () => (this.squashing = false)
    });
  }
}

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}
