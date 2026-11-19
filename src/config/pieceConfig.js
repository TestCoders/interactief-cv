// Afmetingen en afstanden van de set pieces (src/pieces). Kleuren en fonts komen uit het thema.
// range = binnen deze afstand (px) van de speler wordt het piece actief.

export const SIGN = {
  range: 90,
  labelOffsetY: 83,
  labelWidth: 80
};

export const SKILLS = {
  slots: 10, // aantal plantvakjes per skill; niveau 1–5 wordt hierop omgerekend
  maxLevel: 5,
  rowHeight: 30,
  slotWidth: 22,
  nameWidth: 190,
  padding: 20,
  headerHeight: 46,
  postHeight: 56,
  rangeMargin: 60 // begint te groeien zodra je het bord binnenloopt
};

export const EXPERTISE = {
  range: 170,
  perColumn: 6,
  columnDx: 215,
  badgeGap: 44,
  badgeZigzag: 14,
  stackOffsetAboveChest: 70,
  badgeDelayMs: 260
};

export const WORK_ENJOYMENT = {
  range: 200,
  colleagueColors: [0xe4572e, 0x6c5ce7, 0xffb400, 0x2e86de],
  colleagueOffsetsX: [-150, -95, 95, 150],
  bannerOffsetY: 190
};

export const INTRO = { width: 440 };
export const EDUCATION = { diplomaWidth: 250 };
export const RELEASE = { boardWidth: 310, lineHeight: 20, maxLines: 4 };
export const CAMPFIRE = { seats: [-190, -110, 110, 190] };
