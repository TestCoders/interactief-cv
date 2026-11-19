import { SCENES } from '../config/gameConfig.js';
import { THEMES, THEME_IDS, applyThemeCss } from '../themes/index.js';
import { audio } from '../audio/index.js';
import { hidePanel } from './panel.js';

const STORE_KEY = 'cv-stijl';
const store = {
  get: () => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(STORE_KEY, v); } catch { /* geen opslag: geen probleem */ } }
};

// Wisselknop voor de gamestijl: zelfde cv, zelfde plek, andere skin (en ander geluid).
// ?stijl=zakelijk in de URL kiest direct een stijl; anders de laatst gekozen stijl.
export function initStyleSwitcher(game, initialStyle) {
  const btn = document.getElementById('btn-style');
  const set = (id) => {
    const theme = Object.hasOwn(THEMES, id) ? THEMES[id] : THEMES.retro;
    game.registry.set('theme', theme.name);
    applyThemeCss(theme);
    audio.setPack(theme.audio);
    btn.textContent = `Stijl: ${theme.label} ⇄`;
    store.set(theme.name);
  };
  set(initialStyle ?? new URLSearchParams(location.search).get('stijl') ?? store.get());

  btn.addEventListener('click', async () => {
    const next = THEME_IDS[(THEME_IDS.indexOf(game.registry.get('theme')) + 1) % THEME_IDS.length];
    // Webfonts eerst laden, anders rendert Phaser de tekst in het reservefont.
    try { await Promise.race([document.fonts.load('700 16px "Space Grotesk"'), new Promise((r) => setTimeout(r, 800))]); } catch { /* offline */ }
    set(next);
    const url = new URL(location.href);
    url.searchParams.set('stijl', next);
    history.replaceState(null, '', url);
    const level = game.scene.getScene(SCENES.level);
    if (level?.sys.isActive()) {
      hidePanel();
      level.scene.restart({ cv: level.cv, startX: level.player.x });
    }
    const select = game.scene.getScene(SCENES.characterSelect);
    if (select?.sys.isActive()) select.scene.restart();
    btn.blur(); // spatie/enter mogen daarna niet nog eens wisselen
  });
}

/** Geluidsknop + muziek starten bij de eerste klik of toets (eerder laat de browser het niet toe). */
export function initSound(game) {
  audio.music(true);
  for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, () => audio.unlock(), { capture: true });
  const btn = document.getElementById('btn-sound');
  const render = () => (btn.textContent = audio.isMuted() ? 'Geluid: uit' : 'Geluid: aan');
  btn.addEventListener('click', () => { audio.setMuted(!audio.isMuted()); render(); btn.blur(); });
  render();
  document.getElementById('btn-classic').addEventListener('click', () => audio.pause());
  document.getElementById('btn-close-classic').addEventListener('click', () => audio.resume());
}
