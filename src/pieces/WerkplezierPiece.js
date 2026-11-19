import Phaser from 'phaser';
import SignPiece from './SignPiece.js';

const COLLEAGUE_COLORS = [0xe4572e, 0x6c5ce7, 0xffb400, 0x2e86de];

// Collega's die rond het werkplezier-bord staan; ze gaan pas los als jij aankomt.
export default class WerkplezierPiece extends SignPiece {
  constructor(scene, x, groundY, station) {
    super(scene, x, groundY, station);
    this.range = 200;
    this.colleagues = COLLEAGUE_COLORS.map((color, i) => {
      const c = scene.physics.add.sprite(x + [-150, -95, 95, 150][i], groundY - 30, 'player').setTint(color).setFlipX(i >= 2);
      scene.physics.add.collider(c, scene.ground);
      return c;
    });
    this.banner = scene.add.text(x, groundY - 190, '🎉 Hackathon! 🎉', {
      fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#e4572e', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setScale(0);
    this.timers = [];
  }

  enter() {
    this.scene.tweens.add({ targets: this.banner, scale: 1, duration: 300, ease: 'Back.out' });
    this.timers = this.colleagues.map((c) =>
      this.scene.time.addEvent({
        delay: Phaser.Math.Between(500, 1000), loop: true, startAt: Phaser.Math.Between(0, 400),
        callback: () => c.body.blocked.down && c.setVelocityY(-Phaser.Math.Between(350, 520))
      })
    );
  }

  leave() {
    this.timers.forEach((t) => t.remove());
    this.timers = [];
  }
}
