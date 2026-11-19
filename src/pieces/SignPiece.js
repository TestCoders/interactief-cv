// Standaard checkpoint: bord met label; de inhoud verschijnt in het paneel.
// Placeholder tot elk CV-onderdeel een eigen set piece heeft.
export default class SignPiece {
  constructor(scene, x, groundY, station, theme) {
    this.scene = scene;
    this.x = x;
    this.range = 90;
    this.usesPanel = true;
    const sign = scene.add.image(x, groundY, theme.tex('sign')).setOrigin(0.5, 1);
    // Label midden op het bordvlak (bovenste ~55% van de texture).
    scene.add.text(x, groundY - sign.height + 30, station.label, {
      fontFamily: theme.font, fontSize: '12px', fontStyle: 'bold', color: theme.colors.signText ?? theme.colors.text,
      align: 'center', wordWrap: { width: 76 }
    }).setOrigin(0.5);
  }
  start() {}
}
