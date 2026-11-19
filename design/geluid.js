// Tab "Geluid" in de ontwerpoverzichten: speelt het geluidspakket van de stijl af met dezelfde code als de game
// (src/audio). Werkt via `npm run design`; los geopend vanaf schijf laden browsers deze module niet.
import { audio } from '../src/audio/index.js';

const root = document.querySelector('[data-geluid]');
if (root) {
  audio.setPack(root.dataset.geluid);
  // Een eerder "Geluid: uit" in de game geldt hier niet; zonder het op te slaan, zodat de game-keuze blijft staan.
  audio.setMuted(false, { save: false });

  const musicBtn = root.querySelector('[data-muziek]');
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    audio.unlock();
    if (btn.dataset.sfx) audio.play(btn.dataset.sfx);
    if (btn === musicBtn) {
      const on = musicBtn.getAttribute('aria-pressed') !== 'true';
      audio.music(on);
      musicBtn.setAttribute('aria-pressed', String(on));
      musicBtn.textContent = on ? 'Muziek stoppen' : 'Muziek afspelen';
    }
  });
}
