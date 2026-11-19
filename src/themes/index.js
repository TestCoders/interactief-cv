import retro from './retroTheme.js';
import zakelijk from './corporateTheme.js';

// Gamestijlen: zelfde gameplay, andere skin. Volgorde = volgorde van de wisselknop.
export const THEMES = { retro, zakelijk };
export const THEME_IDS = Object.keys(THEMES);

/** DOM-overlay (tekstbox, knoppen, HUD) laten meekleuren met de stijl. */
export function applyThemeCss(theme) {
  document.documentElement.dataset.stijl = theme.name;
  for (const [k, v] of Object.entries(theme.css ?? {})) document.documentElement.style.setProperty(k, v);
}
