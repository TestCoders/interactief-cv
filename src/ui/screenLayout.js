// Houdt de schermlagen (HUD, knoppen, tekstbox, coach, toast, hoofdstukbalk, logo) uit elkaars vaarwater.
// Meet wat boven- en onderin staat en zet dat als CSS-variabelen; style.css plaatst de rest daartussen:
//   --hud-right   rechterrand van de HUD (de knoppen beginnen daarna en lopen anders door naar een tweede regel)
//   --hud-bottom  onderrand van de HUD (op smalle schermen staan de knoppen daaronder)
//   --safe-top    onderrand van HUD en knoppen (daaronder staat de coach)
//   --safe-top-all onderrand inclusief de coach (daaronder toast en tekstbox)
//   --safe-bottom ruimte die de hoofdstukbalk onderin inneemt
const GAP = 12;

const isShown = (el) => el && !el.hidden && el.getClientRects().length > 0;

export function initScreenLayout() {
  const root = document.documentElement;
  const hud = document.getElementById('hud');
  const topbar = document.querySelector('.topbar');
  const chapters = document.getElementById('chapters');
  const coach = document.getElementById('coach');
  const brand = document.querySelector('.brand');

  const update = () => {
    const hudRect = isShown(hud) ? hud.getBoundingClientRect() : null;
    root.style.setProperty('--hud-right', `${Math.ceil(hudRect?.right ?? 0)}px`);
    root.style.setProperty('--hud-bottom', `${Math.ceil(hudRect?.bottom ?? 0)}px`);

    const bottomOf = (els) => els.filter(isShown).reduce((max, el) => Math.max(max, el.getBoundingClientRect().bottom), 0);
    root.style.setProperty('--safe-top', `${Math.ceil(bottomOf([hud, topbar]))}px`);
    // Inclusief de coach (mini-tutorial): daaronder komen toast en tekstbox.
    root.style.setProperty('--safe-top-all', `${Math.ceil(bottomOf([hud, topbar, coach]))}px`);

    const chaptersRect = isShown(chapters) ? chapters.getBoundingClientRect() : null;
    root.style.setProperty('--safe-bottom', `${Math.ceil(chaptersRect ? innerHeight - chaptersRect.top : 0)}px`);

    // Het logo linksonder staat ook in de HUD; laat het weg zodra de hoofdstukbalk er overheen zou vallen.
    if (brand?.naturalWidth) {
      const brandRight = 16 + (brand.naturalWidth * 26) / brand.naturalHeight + 16 + GAP; // logo + witte rand
      brand.classList.toggle('verborgen', !!chaptersRect && chaptersRect.left < brandRight);
    }
  };

  // Opnieuw meten als iets verschijnt, verdwijnt of van grootte verandert (bijv. een stijlwissel).
  const resize = new ResizeObserver(update);
  [hud, topbar, chapters, coach].filter(Boolean).forEach((el) => resize.observe(el));
  const attrs = new MutationObserver(update);
  [hud, chapters, coach].filter(Boolean).forEach((el) => attrs.observe(el, { attributes: true, attributeFilter: ['hidden', 'class'] }));
  addEventListener('resize', update);
  brand?.addEventListener('load', update);
  document.fonts?.ready.then(update);
  update();
}
