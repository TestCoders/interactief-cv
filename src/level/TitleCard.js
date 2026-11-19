// Titelkaart: de eerste indruk (naam, rol, uitleg besturing). Verdwijnt zodra je gaat lopen.
export default class TitleCard {
  constructor(scene, cv, theme) {
    this.scene = scene;
    const { font } = theme;
    const outline = '#1a1430';
    const { width, height } = scene.scale;

    const shade = scene.add.rectangle(0, 0, width * 3, height * 3, 0x1a1430, 0.35).setOrigin(0.5);
    const name = scene.add.text(0, -70, cv.naam.toUpperCase(), {
      fontFamily: font, fontSize: '54px', fontStyle: 'bold', color: '#ffd23f', stroke: outline, strokeThickness: 10
    }).setOrigin(0.5);
    const role = scene.add.text(0, -10, cv.rol, {
      fontFamily: font, fontSize: '22px', fontStyle: 'bold', color: '#f4e4c1', stroke: outline, strokeThickness: 6
    }).setOrigin(0.5);
    const start = scene.add.text(0, 70, '▼  SCROLL OM TE BEGINNEN  ▼', {
      fontFamily: font, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: outline, strokeThickness: 6
    }).setOrigin(0.5);
    const keysHint = scene.add.text(0, 104, 'of ← → lopen · spatie springen', {
      fontFamily: font, fontSize: '14px', color: '#f4e4c1', stroke: outline, strokeThickness: 4
    }).setOrigin(0.5);

    this.container = scene.add.container(0, 0, [shade, name, role, start, keysHint]).setScrollFactor(0).setDepth(20);

    scene.tweens.add({ targets: start, alpha: 0.2, duration: 500, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    scene.tweens.add({ targets: name, y: -76, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    name.setScale(0);
    scene.tweens.add({ targets: name, scale: 1, duration: 600, ease: 'Back.out', delay: 150 });
  }

  /** Midden in het scherm, iets boven het midden. */
  layout(width, height) {
    if (this.container.active) this.container.setPosition(width / 2, height / 2 - 30);
  }

  dismiss() {
    this.scene.tweens.add({ targets: this.container, alpha: 0, duration: 450, onComplete: () => this.container.destroy() });
  }
}
