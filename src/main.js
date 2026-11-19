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
  physics: { default: 'arcade', arcade: { gravity: { y: 1400 }, debug: false } },
  // EXPAND: vult het hele venster; het basisvlak van 960×540 is altijd zichtbaar, bredere schermen zien meer wereld.
  scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH },
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
});
