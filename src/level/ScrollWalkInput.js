import Phaser from 'phaser';
import { MOVEMENT, SCROLL_WALK } from '../config/levelConfig.js';

// Lopen door te scrollen of te swipen, zoals op een gewone pagina.
// Scrollen vult een "tank" met loopafstand; de held loopt die leeg met de afstand die hij echt aflegt.
export default class ScrollWalkInput {
  constructor(scene) {
    this.budget = 0; // resterende afstand (px); teken = richting

    // Muiswiel / trackpad: scroll omlaag (of naar rechts) = vooruit lopen.
    scene.input.on('wheel', (_pointer, _objects, dx, dy) => {
      const delta = Math.abs(dy) >= Math.abs(dx) ? dy : dx;
      this.add(delta * SCROLL_WALK.wheelFactor);
    });
    // Touch: swipe van rechts naar links = vooruit.
    scene.input.on('pointermove', (p) => {
      if (p.isDown && p.wasTouch) this.add((p.prevPosition.x - p.x) * SCROLL_WALK.touchFactor);
    });
    // Voorkom dat de pagina zelf meescrollt terwijl je met de muis boven de game zit (eenmalig per game).
    const { game } = scene;
    if (!game.wheelGuard) {
      game.wheelGuard = true;
      game.canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      game.canvas.style.touchAction = 'none';
    }
  }

  add(px) {
    this.budget = Phaser.Math.Clamp(this.budget + px, -SCROLL_WALK.maxBudget, SCROLL_WALK.maxBudget);
  }

  reset() {
    this.budget = 0;
  }

  get active() {
    return Math.abs(this.budget) > 0.5;
  }

  /** Snelheid schaalt mee met wat er nog in de tank zit: vloeiend uitlopen i.p.v. abrupt stoppen. */
  targetSpeed() {
    if (!this.active) return 0;
    const speed = Math.min(MOVEMENT.maxSpeed, SCROLL_WALK.minSpeed + Math.abs(this.budget) * SCROLL_WALK.speedPerBudgetPx);
    return Math.sign(this.budget) * speed;
  }

  /** Tank leegrijden met de werkelijk afgelegde afstand. */
  consume(vx, dt) {
    if (!this.active || Math.sign(vx) !== Math.sign(this.budget)) return;
    const travelled = Math.min(Math.abs(vx) * dt, Math.abs(this.budget));
    this.budget -= Math.sign(this.budget) * travelled;
  }
}
