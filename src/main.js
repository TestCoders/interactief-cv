import Phaser from 'phaser';
import { loadCvs } from './cv.js';
import { classicHtml, hidePanel } from './ui.js';
import { THEMES, THEME_IDS, applyThemeCss } from './themes/index.js';
import BootScene from './scenes/BootScene.js';
import SelectScene from './scenes/SelectScene.js';
import LevelScene from './scenes/LevelScene.js';
import { audio } from './audio/index.js';

export const WIDTH = 960;
export const HEIGHT = 540;

const cvs = loadCvs();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#9fd6ff',
  pixelArt: true,
  roundPixels: true, // camera en sprites op hele pixels: geen trillende tekst tijdens het lopen
  physics: { default: 'arcade', arcade: { gravity: { y: 1400 }, debug: false } },
  audio: { noAudio: true }, // geluid loopt via src/audio (Web Audio-synthese), niet via Phaser
  // RESIZE: het canvas rendert op de echte venstergrootte (scherp); de LevelScene zoomt de wereld van 540 px hoog op naar schermhoogte.
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, SelectScene, LevelScene]
});

game.registry.set('cvs', cvs);

// --- Gamestijl: ?stijl=zakelijk in de URL, anders de laatst gekozen stijl ---
const store = {
  get: () => { try { return localStorage.getItem('cv-stijl'); } catch { return null; } },
  set: (v) => { try { localStorage.setItem('cv-stijl', v); } catch { /* geen opslag: geen probleem */ } }
};
const wantedStyle = new URLSearchParams(location.search).get('stijl') ?? store.get();
const styleBtn = document.getElementById('btn-style');
function setStyle(id) {
  const theme = THEMES[id] ?? THEMES.retro;
  game.registry.set('theme', theme.name);
  applyThemeCss(theme);
  audio.setPack(theme.audio); // muziek en effecten wisselen mee met de stijl
  styleBtn.textContent = `Stijl: ${theme.label} ⇄`;
  store.set(theme.name);
}
setStyle(wantedStyle);

// Wisselknop: zelfde CV, zelfde plek, andere stijl.
styleBtn.addEventListener('click', async () => {
  const next = THEME_IDS[(THEME_IDS.indexOf(game.registry.get('theme')) + 1) % THEME_IDS.length];
  // Webfonts eerst laden, anders rendert Phaser de tekst in het reservefont.
  try { await Promise.race([document.fonts.load('700 16px "Space Grotesk"'), new Promise((r) => setTimeout(r, 800))]); } catch { /* offline: reservefont */ }
  setStyle(next);
  const url = new URL(location.href);
  url.searchParams.set('stijl', next);
  history.replaceState(null, '', url);
  const level = game.scene.getScene('level');
  if (level?.sys.isActive()) {
    hidePanel();
    level.scene.restart({ cv: level.cv, startX: level.player.x });
  }
  const select = game.scene.getScene('select');
  if (select?.sys.isActive()) select.scene.restart();
  styleBtn.blur(); // spatie/enter mogen daarna niet nog eens wisselen
});

// Alleen in dev: handvat voor tests en debuggen in de console.
if (import.meta.env.DEV) window.__game = game;
game.registry.set('currentCv', cvs[0]);

// Typen in het contactformulier: game-toetsen (spatie, WASD, pijltjes) even loslaten.
const panelEl = document.getElementById('panel');
// (Uitgeschakelde KeyboardManager doet ook geen preventDefault meer, dus de toetsen komen in het veld.)
panelEl.addEventListener('focusin', () => (game.input.keyboard.enabled = false));
panelEl.addEventListener('focusout', () => (game.input.keyboard.enabled = true));

// "AI / Markdown"-knop wijst naar de Markdown van het CV dat nu gespeeld wordt (of naar llms.txt).
const mdLink = document.getElementById('btn-md');
game.registry.events.on('changedata-currentCv', (_parent, cv) => {
  mdLink.href = cv ? `./cv/${cv.id}.md` : './llms.txt';
});

// --- Geluid: muziek start bij de eerste klik of toets (eerder laat de browser het niet toe) ---
audio.music(true);
for (const type of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(type, () => audio.unlock(), { capture: true });
const soundBtn = document.getElementById('btn-sound');
const renderSound = () => (soundBtn.textContent = audio.isMuted() ? 'Geluid: uit' : 'Geluid: aan');
soundBtn.addEventListener('click', () => {
  audio.setMuted(!audio.isMuted());
  renderSound();
});
renderSound();

// --- Knoppen in de topbar ---
const classic = document.getElementById('classic');
document.getElementById('btn-classic').addEventListener('click', () => {
  const cv = game.registry.get('currentCv');
  if (!cv) return;
  document.getElementById('classic-content').innerHTML = classicHtml(cv);
  classic.hidden = false;
  game.loop.sleep();
  audio.pause();
});
document.getElementById('btn-close-classic').addEventListener('click', () => {
  classic.hidden = true;
  game.loop.wake();
  audio.resume();
});
document.getElementById('btn-switch').addEventListener('click', () => {
  hidePanel();
  const url = new URL(location.href);
  url.searchParams.delete('cv');
  history.replaceState(null, '', url);
  game.scene.getScenes(true).forEach((s) => s.scene.stop());
  game.scene.start('select');
  mdLink.href = './llms.txt';
});
