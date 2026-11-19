import Phaser from 'phaser';
import { MOVEMENT, PLAYER } from '../config/levelConfig.js';
import { heroAnim } from '../graphics/heroSprites.js';
import { TEXTURES } from '../graphics/worldTextures.js';

const NEVER = -1e9;

// De held: physics-hitbox (onzichtbaar) plus een losse sprite voor het uiterlijk,
// zodat squash, wiebel en kantelen de physics niet beïnvloeden.
export default class Player {
  constructor(scene, x, groundY, textureKey) {
    this.scene = scene;
    this.textureKey = textureKey;
    this.lastGroundedAt = 0;
    this.jumpPressedAt = NEVER;
    this.jumpedByKey = false;
    this.wasGrounded = false;
    this.lastVy = 0;
    this.squashing = false;

    const { body } = PLAYER;
    this.sprite = scene.physics.add.sprite(x, groundY - PLAYER.spawnHeight, textureKey, 'idle0')
      .setScale(PLAYER.scale).setCollideWorldBounds(true).setVisible(false);
    this.sprite.body.setSize(body.width, body.height).setOffset(body.offsetX, body.offsetY);

    this.visual = scene.add.sprite(x, groundY, textureKey, 'idle0')
      .setOrigin(0.5, 1).setScale(PLAYER.scale).setDepth(5).play(heroAnim(textureKey, 'idle'));
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
    return this.sprite.y + PLAYER.footOffsetY;
  }

  /** -1 = kijkt naar links, 1 = naar rechts. */
  get facing() {
    return this.visual.flipX ? -1 : 1;
  }

  syncVisual() {
    this.visual.setPosition(this.sprite.x, this.feetY);
  }

  /** Springknop ingedrukt: wordt even onthouden (jump buffer). */
  bufferJump(time) {
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
    if (!jumpHeld && body.velocity.y < -MOVEMENT.jumpCutMinUpSpeed && this.jumpedByKey) {
      sprite.setVelocityY(body.velocity.y * MOVEMENT.jumpCut);
      this.jumpedByKey = false;
    }
    body.setGravityY(body.velocity.y > 0 ? MOVEMENT.fallGravity : 0);

    // --- Landen: squash + stof ---
    if (grounded && !this.wasGrounded && this.lastVy > MOVEMENT.hardLandingSpeed) {
      this.dust.explode(Math.min(14, Math.round(this.lastVy / 60)), sprite.x, this.feetY);
      this.squash(1.25, 0.75);
    }
    this.wasGrounded = grounded;
    this.lastVy = body.velocity.y;

    // --- Lopen: wiebel + af en toe een stofje ---
    const speedRatio = Math.abs(newVx) / MOVEMENT.maxSpeed;
    if (!this.squashing) {
      if (grounded) {
        const bob = Math.sin(time / 55) * 0.06 * speedRatio;
        visual.setScale(PLAYER.scale * (1 + bob), PLAYER.scale * (1 - bob));
        visual.setAngle(Math.sin(time / 110) * 5 * speedRatio);
      } else {
        const stretch = Phaser.Math.Clamp(Math.abs(body.velocity.y) / 2000, 0, 0.15);
        visual.setScale(PLAYER.scale * (1 - stretch), PLAYER.scale * (1 + stretch));
        visual.setAngle(Phaser.Math.Clamp(newVx / 40, -8, 8));
      }
    }
    if (grounded && speedRatio > 0.8 && Math.random() < 0.08) this.dust.explode(1, sprite.x - Math.sign(newVx) * 10, this.feetY);

    const anim = !grounded ? 'jump' : moving ? 'run' : 'idle';
    visual.play(heroAnim(this.textureKey, anim), true);

    return newVx;
  }

  jump(time) {
    this.sprite.setVelocityY(-MOVEMENT.jumpVelocity);
    this.jumpedByKey = time - this.jumpPressedAt <= MOVEMENT.jumpBufferMs;
    this.jumpPressedAt = NEVER;
    this.lastGroundedAt = NEVER; // geen dubbele coyote-sprong
    this.dust.explode(6, this.sprite.x, this.feetY);
    this.squash(0.8, 1.2);
  }

  squash(sx, sy) {
    this.squashing = true;
    this.visual.setScale(PLAYER.scale * sx, PLAYER.scale * sy).setAngle(0);
    this.scene.tweens.add({
      targets: this.visual, scaleX: PLAYER.scale, scaleY: PLAYER.scale, duration: 160, ease: 'Back.out',
      onComplete: () => (this.squashing = false)
    });
  }
}

function moveTowards(current, target, maxDelta) {
  if (Math.abs(target - current) <= maxDelta) return target;
  return current + Math.sign(target - current) * maxDelta;
}
