import retro from './retro.js';
import zakelijk from './zakelijk.js';

// Gamestijlen: zelfde gameplay, andere skin. Volgorde = volgorde van de wisselknop.
export const THEMES = { retro, zakelijk };
export const THEME_IDS = Object.keys(THEMES);

export function applyThemeCss(theme) {
  for (const [k, v] of Object.entries(theme.css ?? {})) document.documentElement.style.setProperty(k, v);
}
