import Phaser from 'phaser';
import { loadCvs } from './cv.js';
import { classicHtml, hidePanel } from './ui.js';
import BootScene from './scenes/BootScene.js';
import SelectScene from './scenes/SelectScene.js';
import LevelScene from './scenes/LevelScene.js';

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
  // RESIZE: het canvas rendert op de echte venstergrootte (scherp); de LevelScene zoomt de wereld van 540 px hoog op naar schermhoogte.
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, SelectScene, LevelScene]
});

game.registry.set('cvs', cvs);

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

// --- Knoppen in de topbar ---
const classic = document.getElementById('classic');
document.getElementById('btn-classic').addEventListener('click', () => {
  const cv = game.registry.get('currentCv');
  if (!cv) return;
  document.getElementById('classic-content').innerHTML = classicHtml(cv);
  classic.hidden = false;
  game.loop.sleep();
});
document.getElementById('btn-close-classic').addEventListener('click', () => {
  classic.hidden = true;
  game.loop.wake();
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
