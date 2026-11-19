import Phaser from 'phaser';
import { GAME } from './config/gameConfig.js';
import { loadCvs } from './cv/cvLoader.js';
import BootScene from './scenes/BootScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import LevelScene from './scenes/LevelScene.js';
import { initContactForm } from './ui/contactForm.js';
import { initTopBar, releaseKeysWhileTyping } from './ui/topBar.js';

const cvs = loadCvs();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME.width,
  height: GAME.height,
  backgroundColor: GAME.backgroundColor,
  pixelArt: true,
  physics: { default: 'arcade', arcade: { gravity: { y: GAME.gravityY }, debug: false } },
  // EXPAND: vult het hele venster; het basisvlak is altijd zichtbaar, bredere schermen zien meer wereld.
  scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, CharacterSelectScene, LevelScene]
});

game.registry.set('cvs', cvs);
game.registry.set('currentCv', cvs[0]);

// Alleen in dev: handvat voor tests en debuggen in de console.
if (import.meta.env.DEV) window.__game = game;

initTopBar(game);
releaseKeysWhileTyping(game);
initContactForm();
