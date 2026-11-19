import retro from './retro.js';
import zakelijk from './zakelijk.js';

// Gamestijlen: zelfde gameplay, andere skin. Volgorde = volgorde van de wisselknop.
export const THEMES = { retro, zakelijk };
export const THEME_IDS = Object.keys(THEMES);

/** Kleuren/fonts van de DOM-overlay zetten, plus data-stijl voor de stijlregels per thema in style.css. */
export function applyThemeCss(theme) {
  for (const [k, v] of Object.entries(theme.css ?? {})) document.documentElement.style.setProperty(k, v);
  document.documentElement.dataset.stijl = theme.name;
}
