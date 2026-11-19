import Phaser from 'phaser';
import { GAME } from './config/gameConfig.js';
import BootScene from './scenes/BootScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import LevelScene from './scenes/LevelScene.js';
import { initContactForm } from './ui/contactForm.js';
import { initTopBar, releaseKeysWhileTyping } from './ui/topBar.js';
import { initStyleSwitcher, initSound } from './ui/styleSwitcher.js';

export function startGame(cv, style) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME.width,
    height: GAME.height,
    backgroundColor: GAME.backgroundColor,
    pixelArt: true,
    roundPixels: true,
    physics: { default: 'arcade', arcade: { gravity: { y: GAME.gravityY }, debug: false } },
    audio: { noAudio: true }, // geluid loopt via src/audio (Web Audio-synthese), niet via Phaser
    // Render op venstergrootte; het level zoomt de wereld naar schermhoogte.
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    scene: [BootScene, CharacterSelectScene, LevelScene]
  });

  game.registry.set('cvs', [cv]);
  game.registry.set('currentCv', cv);

  // Alleen in dev: handvat voor tests en debuggen in de console.
  if (import.meta.env.DEV) window.__game = game;

  initStyleSwitcher(game, style);
  initSound(game);
  initTopBar(game);
  releaseKeysWhileTyping(game);
  initContactForm();
}
