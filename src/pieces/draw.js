// Gedeelde tekenhulpjes voor set pieces in pixel-stijl (harde randen, schaduw rechtsonder).
export function pixelBox(g, left, top, w, h, colors) {
  g.fillStyle(colors.boardShadow).fillRect(left + 2, top + 6, w + 6, h + 4);
  g.fillStyle(colors.boardEdge).fillRect(left - 4, top - 4, w + 8, h + 8);
  g.fillStyle(colors.board).fillRect(left, top, w, h);
}

export function label(scene, x, y, text, theme, { size = 13, color, bold = true, wrap, align = 'left' } = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: theme.font, fontSize: `${size}px`, fontStyle: bold ? 'bold' : 'normal',
    color: color ?? theme.colors.text, align, wordWrap: wrap ? { width: wrap } : undefined
  });
}

export const shorten = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

/** Laat een object "poppen": van 0 naar zijn schaal met overshoot. */
export function pop(scene, target, delay = 0, duration = 320) {
  const sx = target.scaleX || 1;
  const sy = target.scaleY || 1;
  target.setScale(0);
  return scene.tweens.add({ targets: target, scaleX: sx, scaleY: sy, duration, delay, ease: 'Back.out' });
}
