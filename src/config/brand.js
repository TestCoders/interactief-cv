// TestCoders-branding: het vaste frame rond elk cv. Inhoud komt uit de .md/JSON van de consultant,
// het merk (logo, naam, kleuren) altijd hiervandaan. Officieel logo: vervang de SVG's in public/brand/.
export const BRAND = {
  naam: 'TestCoders',
  website: 'testcoders.nl',
  logo: './brand/testcoders-logo.svg', // woordmerk (HUD, titelkaart, klassiek cv)
  mark: './brand/testcoders-mark.svg', // beeldmerk (favicon, in de game)
  blauw: '#1f5ea8',
  inkt: '#2a3a52'
};

/** Beeldmerk in de wereld tekenen (canvas): cirkel met TC. Gebruikt door de thema's. */
export function drawMark(ctx, cx, cy, r, { ring = BRAND.blauw, fill = '#ffffff', text = BRAND.inkt } = {}) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ring; ctx.lineWidth = Math.max(2, r * 0.22); ctx.beginPath(); ctx.arc(cx, cy, r - ctx.lineWidth / 2, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = text; ctx.font = `700 ${Math.round(r * 0.9)}px Poppins, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('TC', cx, cy + r * 0.05);
}

/** De gastheer aan het begin: stelt de collega voor en vertelt het profiel (staat al in de derde persoon). */
export const HOST = {
  naam: 'Martijn',
  rol: 'TestCoders',
  maxZinnen: 4, // zoveel zinnen uit het profiel vertelt hij; de rest staat in het klassieke cv
  autoNextMs: 3600 // daarna gaat hij vanzelf door (scroll of → = sneller)
};
