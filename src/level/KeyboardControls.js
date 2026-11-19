import Phaser from 'phaser';

// Toetsenbord: ← → of A D lopen (direct: loslaten = stoppen), spatie / ↑ / W springen.
export default class KeyboardControls {
  constructor(scene) {
    this.keys = scene.input.keyboard.addKeys('LEFT,RIGHT,UP,SPACE,A,D,W');
  }

  /** -1 = links, 1 = rechts, 0 = geen looptoets. */
  direction() {
    const k = this.keys;
    const left = k.LEFT.isDown || k.A.isDown;
    const right = k.RIGHT.isDown || k.D.isDown;
    return left === right ? 0 : left ? -1 : 1;
  }

  /** → of D net ingedrukt (o.a. om Martijn verder te laten praten). */
  forwardJustPressed() {
    const justDown = Phaser.Input.Keyboard.JustDown;
    return justDown(this.keys.RIGHT) || justDown(this.keys.D);
  }

  jumpJustPressed() {
    const justDown = Phaser.Input.Keyboard.JustDown;
    return justDown(this.keys.UP) || justDown(this.keys.SPACE) || justDown(this.keys.W);
  }

  jumpHeld() {
    return this.keys.UP.isDown || this.keys.SPACE.isDown || this.keys.W.isDown;
  }
}
