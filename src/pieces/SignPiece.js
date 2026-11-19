// Standaard checkpoint: bord met label; de inhoud verschijnt in het paneel.
// Placeholder tot elk CV-onderdeel een eigen set piece heeft.
export default class SignPiece {
  constructor(scene, x, groundY, station) {
    this.scene = scene;
    this.x = x;
    this.range = 90;
    this.usesPanel = true;
    scene.add.image(x, groundY, 'sign').setOrigin(0.5, 1);
    scene.add.text(x, groundY - 83, station.label, {
      fontFamily: 'system-ui', fontSize: '11px', fontStyle: 'bold', color: '#1d2433', align: 'center', wordWrap: { width: 80 }
    }).setOrigin(0.5);
  }
  enter() {}
  leave() {}
}
