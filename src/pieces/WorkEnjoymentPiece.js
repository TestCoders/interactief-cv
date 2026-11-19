import Phaser from 'phaser';
import { WORK_ENJOYMENT } from '../config/pieceConfig.js';
import SignPiece from './SignPiece.js';

// Werkplezier: collega's die rond het bord staan; ze gaan pas los als jij aankomt.
export default class WorkEnjoymentPiece extends SignPiece {
  constructor(scene, x, groundY, station) {
    super(scene, x, groundY, station);
    this.range = WORK_ENJOYMENT.range;
    const { colleagueColors, colleagueOffsetsX } = WORK_ENJOYMENT;
    this.colleagues = colleagueColors.map((color, i) => {
      const colleague = scene.physics.add.sprite(x + colleagueOffsetsX[i], groundY - 30, 'player').setTint(color).setFlipX(i >= colleagueColors.length / 2);
      scene.physics.add.collider(colleague, scene.ground);
      return colleague;
    });
    this.banner = scene.add.text(x, groundY - WORK_ENJOYMENT.bannerOffsetY, '🎉 Hackathon! 🎉', {
      fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#e4572e', padding: { x: 10, y: 4 }
    }).setOrigin(0.5).setScale(0);
    this.timers = [];
  }

  enter() {
    this.scene.tweens.add({ targets: this.banner, scale: 1, duration: 300, ease: 'Back.out' });
    this.timers = this.colleagues.map((colleague) =>
      this.scene.time.addEvent({
        delay: Phaser.Math.Between(500, 1000), loop: true, startAt: Phaser.Math.Between(0, 400),
        callback: () => colleague.body.blocked.down && colleague.setVelocityY(-Phaser.Math.Between(350, 520))
      })
    );
  }

  leave() {
    this.timers.forEach((t) => t.remove());
    this.timers = [];
  }
}
