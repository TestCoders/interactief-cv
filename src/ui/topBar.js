import { SCENES } from '../config/gameConfig.js';
import { hidePanel } from './panel.js';
import { classicHtml } from './stationTemplates.js';

const DEFAULT_MD_LINK = './llms.txt';

// Knoppen in de topbar (index.html): klassiek CV, AI / Markdown en ander CV kiezen.
export function initTopBar(game) {
  // "AI / Markdown"-knop wijst naar de Markdown van het CV dat nu gespeeld wordt (of naar llms.txt).
  const mdLink = document.getElementById('btn-md');
  game.registry.events.on('changedata-currentCv', (_parent, cv) => {
    mdLink.href = cv ? `./cv/${cv.id}.md` : DEFAULT_MD_LINK;
  });

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
    game.scene.start(SCENES.characterSelect);
    mdLink.href = DEFAULT_MD_LINK;
  });
}

/** Typen in het contactformulier: game-toetsen (spatie, WASD, pijltjes) even loslaten. */
export function releaseKeysWhileTyping(game) {
  const panel = document.getElementById('panel');
  // (Uitgeschakelde KeyboardManager doet ook geen preventDefault meer, dus de toetsen komen in het veld.)
  panel.addEventListener('focusin', () => (game.input.keyboard.enabled = false));
  panel.addEventListener('focusout', () => (game.input.keyboard.enabled = true));
}
