import Phaser from 'phaser';
import { loadCvs } from '../../../src/cv/cvLoader.js';
import { THEMES, applyThemeCss } from '../../../src/themes/index.js';
import { initContactForm } from '../../../src/ui/contactForm.js';
import { createHeroTextures } from '../../../src/graphics/heroSprites.js';
import { createWorldTextures } from '../../../src/graphics/worldTextures.js';
import { audio } from '../../../src/audio/index.js';
import { BRAND } from '../../../src/config/brand.js';
import { startTerminal } from './terminal.js';
import { startTestReport } from './testReport.js';
import { startWorld3d } from './world3d.js';
import DungeonScene from './DungeonScene.js';

// Gedeelde opstart van de proefpagina's: zelfde cv-data en TestCoders-UI als de game.
// ?cv=<id> kiest het cv (standaard Robin Sterrenstof), ?stijl=retro|zakelijk de kleuren van tekstbox en knoppen.
export function boot(mode) {
  // De logo-paden in BRAND zijn relatief aan de game (/); de proefpagina's staan dieper in /design/.
  BRAND.logo = '/brand/testcoders-logo.svg';
  BRAND.mark = '/brand/testcoders-mark.svg';
  const params = new URLSearchParams(location.search);
  const cvs = loadCvs();
  const cv = cvs.find((c) => c.id === params.get('cv')) ?? cvs.find((c) => c.id === 'robin-sterrenstof') ?? cvs[0];
  const theme = THEMES[params.get('stijl')] ?? THEMES.zakelijk;
  applyThemeCss(theme);
  initContactForm();
  audio.setPack(theme.audio);
  for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, () => audio.unlock(), { capture: true, once: true });

  // Navigatie: terug naar het overzicht en een ander cv kiezen.
  const select = document.getElementById('sv-cv');
  select.innerHTML = cvs.map((c) => `<option value="${c.id}" ${c.id === cv.id ? 'selected' : ''}>${c.naam}</option>`).join('');
  select.addEventListener('change', () => { params.set('cv', select.value); location.search = params.toString(); });

  const mount = document.getElementById('mode');
  if (mode === 'terminal') startTerminal(mount, cv, { onExit: () => (location.href = './') });
  if (mode === 'testrapport') startTestReport(mount, cv);
  if (mode === 'wereld') startWorld3d(mount, cv);
  if (mode === 'dungeon') {
    // Kleine Phaser-game met alleen de dungeon (helden-textures eerst aanmaken).
    class Opstart extends Phaser.Scene {
      constructor() { super('opstart'); }
      create() {
        createHeroTextures(this, cvs);
        createWorldTextures(this);
        this.scene.start('dungeon', { cv });
      }
    }
    new Phaser.Game({
      type: Phaser.AUTO, parent: 'mode', pixelArt: true, roundPixels: true, backgroundColor: '#07050c',
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } }, audio: { noAudio: true },
      scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
      scene: [Opstart, DungeonScene]
    });
  }
}
