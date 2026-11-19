// Algemene game-instellingen: canvasformaat, zwaartekracht en scene-sleutels.

export const GAME = {
  // Basisvlak; met Scale.EXPAND zien bredere schermen meer wereld, maar de wereld schaalt niet mee.
  width: 960,
  height: 540,
  gravityY: 1400, // px/s²
  backgroundColor: '#9fd6ff'
};

/** Karakterselectie. */
export const CHARACTER_SELECT = {
  heroScale: 5,
  maxCardGap: 180, // px tussen de karakters; smaller als er veel CV's zijn
  textColor: '#1d2433',
  dimmedAlpha: 0.55 // niet-gekozen karakters
};

/** Scene-sleutels op één plek, zodat scene.start('...') nooit een typfout bevat. */
export const SCENES = {
  boot: 'boot',
  characterSelect: 'select',
  level: 'level'
};
