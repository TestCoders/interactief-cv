import Phaser from 'phaser';

// Toetsenbord: ← → / A D lopen (↓ / S ook vooruit, net als scrollen), ↑ / W / spatie springen.
export default class KeyboardControls {
  constructor(scene) {
    this.keys = scene.input.keyboard.addKeys('LEFT,RIGHT,UP,DOWN,SPACE,A,D,W,S');
  }

  /** -1 = links, 1 = rechts, 0 = geen looptoets. */
  direction() {
    const k = this.keys;
    if (k.LEFT.isDown || k.A.isDown) return -1;
    if (k.RIGHT.isDown || k.D.isDown || k.DOWN.isDown || k.S.isDown) return 1;
    return 0;
  }

  jumpJustPressed() {
    const k = this.keys;
    const justDown = Phaser.Input.Keyboard.JustDown;
    return justDown(k.UP) || justDown(k.SPACE) || justDown(k.W);
  }

  jumpHeld() {
    const k = this.keys;
    return k.UP.isDown || k.SPACE.isDown || k.W.isDown;
  }
}
