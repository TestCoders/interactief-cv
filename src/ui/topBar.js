import { classicHtml } from './stationTemplates.js';

// Knoppen in de topbar (index.html): klassiek CV, AI / Markdown en ander CV kiezen.
export function initTopBar(game) {
  // "AI / Markdown"-knop wijst naar de Markdown van het CV dat nu gespeeld wordt (of naar llms.txt).
  const mdLink = document.getElementById('btn-md');
  const cv = game.registry.get('currentCv');
  mdLink.hidden = Boolean(cv.uploaded);
  if (!cv.uploaded) mdLink.href = `./cv/${cv.id}.md`;

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
    location.assign(location.pathname);
  });
}

/** Typen in het contactformulier: game-toetsen (spatie, WASD, pijltjes) even loslaten. */
export function releaseKeysWhileTyping(game) {
  const panel = document.getElementById('panel');
  // (Uitgeschakelde KeyboardManager doet ook geen preventDefault meer, dus de toetsen komen in het veld.)
  panel.addEventListener('focusin', () => (game.input.keyboard.enabled = false));
  panel.addEventListener('focusout', () => (game.input.keyboard.enabled = true));
}
