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

// Vlakke (niet-pixel) texture tekenen met de canvas-API; voor strakke thema's.
export function canvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  draw(tex.getContext(), w, h);
  tex.refresh();
}
