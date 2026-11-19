// Gedeelde textures die in elk thema hetzelfde zijn. De wereld zelf (grond, heuvels, wolken, bord, vlag)
// tekent elk thema in zijn eigen createTextures() — zie src/themes/.

/** Texture-sleutels, zodat scenes en pieces niet met losse strings werken. */
export const TEXTURES = {
  dust: 'dust'
};

export function createWorldTextures(scene) {
  if (scene.textures.exists(TEXTURES.dust)) return;
  const g = scene.make.graphics({ add: false });
  // Stofwolkje bij lopen, springen en landen (wordt getint).
  g.fillStyle(0xffffff).fillCircle(5, 5, 5);
  g.generateTexture(TEXTURES.dust, 10, 10);
  g.destroy();
}
