// Gedeelde tekenhulpjes voor set pieces in pixel-stijl (harde randen, schaduw rechtsonder).
export function pixelBox(g, left, top, w, h, colors) {
  if (colors.box === 'offset') {
    // Zakelijk (Bjorn): witte kaart, dunne rand, harde verschoven schaduw rechtsonder.
    g.fillStyle(colors.boardShadow).fillRoundedRect(left + 6, top + 3, w, h, 10);
    g.fillStyle(colors.boardEdge).fillRoundedRect(left - 1, top - 1, w + 2, h + 2, 10);
    g.fillStyle(colors.board).fillRoundedRect(left, top, w, h, 9);
    return;
  }
  if (colors.flat) {
    // Huisstijl-kaart: zachte schaduw, dunne rand, blauwe accentbalk bovenaan.
    g.fillStyle(0x000000, 0.06).fillRoundedRect(left - 2, top + 4, w + 4, h + 6, 10);
    g.fillStyle(0x000000, 0.05).fillRoundedRect(left, top + 2, w, h + 2, 9);
    g.fillStyle(colors.boardEdge).fillRoundedRect(left - 1, top - 1, w + 2, h + 2, 9);
    g.fillStyle(colors.board).fillRoundedRect(left, top, w, h, 8);
    g.fillStyle(colors.accent ?? colors.boardEdge).fillRoundedRect(left, top, w, 5, { tl: 8, tr: 8, bl: 0, br: 0 });
    return;
  }
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
