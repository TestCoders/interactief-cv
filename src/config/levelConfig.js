// Alle knoppen om aan het level te draaien: opbouw van de wereld, speler, game feel en camera.

/** Opbouw van het level. */
export const WORLD = {
  groundHeight: 64,
  firstStationX: 420, // x van het eerste set piece
  stationGap: 620, // afstand tussen set pieces
  finishMargin: 400, // wereld loopt nog zo ver door na de finishvlag
  finishTriggerDistance: 20, // finish telt vanaf zo ver vóór de vlag
  fallMargin: 200, // physics-wereld reikt zo ver onder het scherm
  playerStartX: 120
};

/** Achtergrondlagen; speed = hoe snel de laag meeschuift met de camera (0 = stil, 1 = mee met de wereld). */
export const PARALLAX = {
  clouds: { y: 20, height: 160, speed: 0.1 },
  hills: { height: 300, riseAboveGround: 260, speed: 0.35 }
};

/** Afmetingen van de held. Hitbox en uiterlijk zijn gescheiden: squash & wiebel mogen de physics niet beïnvloeden. */
export const PLAYER = {
  scale: 3,
  spawnHeight: 60, // start zo hoog boven de grond en valt erop
  body: { width: 10, height: 16, offsetX: 3, offsetY: 2 },
  footOffsetY: 27 // van het midden van de hitbox naar de voeten
};

/** Game feel. */
export const MOVEMENT = {
  maxSpeed: 300, // px/s
  accelGround: 2600, // px/s² optrekken op de grond
  decelGround: 3400, // px/s² afremmen op de grond (iets sneller dan optrekken = strak)
  accelAir: 1700, // minder controle in de lucht
  decelAir: 900,
  // Afzetsnelheid; springhoogte ≈ jumpVelocity² / (2 · gravityY).
  jumpVelocity: 640,
  fallGravity: 900, // extra zwaartekracht bij het vallen: snel omhoog, sneller omlaag = niet zweverig
  jumpCut: 0.45, // springknop vroeg loslaten = lagere sprong
  jumpCutMinUpSpeed: 150, // alleen afkappen als de held nog flink omhoog gaat
  coyoteMs: 110, // nog springen vlak nadat je van een rand loopt
  jumpBufferMs: 130, // springen vlak vóór de landing wordt onthouden
  movingThreshold: 5, // px/s; daaronder staat de held stil (animatie, kijkrichting)
  hardLandingSpeed: 250 // px/s; harder landen = squash + stofwolk
};

/** Lopen door te scrollen of te swipen, zoals op een gewone pagina. */
export const SCROLL_WALK = {
  wheelFactor: 1.2, // px lopen per px scroll
  touchFactor: 2.5, // px lopen per px swipe
  maxBudget: 200, // max opgespaarde loopafstand: stop je met scrollen, dan sta je binnen ~0,7 s stil
  minSpeed: 90, // px/s zodra er iets in de tank zit
  speedPerBudgetPx: 2.2 // sneller lopen naarmate er meer in de tank zit
};

/** Halteplaatsen: na scrollen glijdt de held naar het onderdeel als dat vlakbij is. Na ← → niet: loslaten = stoppen. */
export const STOPS = {
  snapDistance: 160,
  idleBeforeSnapMs: 160,
  gateMaxMs: 5000 // een animatie houdt je nooit langer vast dan dit
};

export const CAMERA = {
  followLerp: 0.09,
  lookahead: 140, // camera kijkt vooruit in looprichting
  lookaheadLerp: 0.03,
  introZoom: 1.35, // begint ingezoomd op de speler
  zoomOutMs: 900
};
