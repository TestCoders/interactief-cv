import Phaser from 'phaser';

// Pixel art als tekst: elke letter is een kleur uit het palet, '.' is transparant.
// Makkelijk te tekenen en te reviewen, en Bjorn kan ze later vervangen door echte spritesheets.
export function pixelTexture(scene, key, rows, palette, scale = 2) {
  if (scene.textures.exists(key)) return;
  const w = rows[0].length;
  const h = rows.length;
  const tex = scene.textures.createCanvas(key, w * scale, h * scale);
  const ctx = tex.getContext();
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    })
  );
  tex.refresh();
}

/**
 * Pixel art uit de ontwerpen (design/retro-pixel-art): lagen als [kleur, SVG-pad] op een raster,
 * opgeschaald met `scale` en verschoven met `dx`/`dy` (in texture-pixels). Zo blijven game en ontwerp gelijk.
 */
export function pathTexture(scene, key, w, h, layers, { scale = 1, dx = 0, dy = 0 } = {}) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.translate(dx, dy);
  ctx.scale(scale, scale);
  for (const [color, d] of layers) {
    ctx.fillStyle = color;
    ctx.fill(new Path2D(d));
  }
  tex.refresh();
}

// Vlakke (niet-pixel) texture tekenen met de canvas-API; voor strakke thema's.
// Lineair gefilterd: de game staat op pixelArt, maar vectorwerk moet zacht schalen.
export function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  draw(tex.getContext(), w, h);
  tex.refresh();
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
}
