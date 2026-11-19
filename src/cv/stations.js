// Een station is één checkpoint in het level: { type, label, data }.
// Het type bepaalt welk set piece (src/pieces/pieceRegistry.js) en welke paneltekst (src/ui/stationTemplates.js) erbij hoort.
export const STATION_TYPES = {
  host: 'host',
  profile: 'profile',
  expertise: 'expertise',
  skills: 'skills',
  education: 'education',
  work: 'work',
  certifications: 'certifications',
  interests: 'interests',
  workEnjoyment: 'workEnjoyment',
  finale: 'finale',
  finish: 'finish'
};

/** Interesses heetten eerder hobbys; oudere CV-bestanden werken zo nog. */
export const interestsOf = (cv) => cv.interesses ?? cv.hobbys;

// Welke vaardigheden-categorieën een eigen bord krijgen (de rest staat in de klassieke weergave).
const SKILL_CATEGORIEEN = ['Vaardigheden', 'Programmeertalen & Frameworks', 'Tools', 'Testvormen', 'Methoden/Technieken'];
const MAX_SKILL_BORDEN = 3;
const MAX_SKILLS_PER_BORD = 6;

/**
 * Zet een CV om naar de volgorde van set pieces in het level.
 * Kopjes uit het MVP-template: expertise/vaardigheden, opleidingen, ervaring, interesses (+ werkplezier).
 */
export function buildStations(cv) {
  // Martijn (TestCoders) stelt de collega voor en vertelt het profiel; daarna de spelerskaart.
  const stations = [{ type: 'host', data: cv }, { type: 'profile', data: cv }];
  if (cv.expertise.length) stations.push({ type: 'expertise', data: cv.expertise });

  const perCat = new Map();
  for (const s of cv.skills) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
  SKILL_CATEGORIEEN.filter((c) => perCat.has(c)).slice(0, MAX_SKILL_BORDEN).forEach((cat) => {
    const all = [...perCat.get(cat)].sort((a, b) => b.score - a.score || (a.sinds ?? 0) - (b.sinds ?? 0));
    stations.push({ type: 'skills', data: { titel: cat === 'Vaardigheden' ? 'Vaardigheden' : cat, skills: all.slice(0, MAX_SKILLS_PER_BORD), meer: all.length - MAX_SKILLS_PER_BORD } });
  });

  if (cv.opleiding?.length || cv.certificeringen?.length) {
    stations.push({ type: 'education', data: { diplomas: cv.opleiding ?? [], certificaten: cv.certificeringen ?? [] } });
  }
  // Ervaring: van oud naar nieuw, zodat je door de tijd loopt.
  for (const w of [...cv.werkervaring].sort((a, b) => a.start - b.start)) stations.push({ type: 'work', data: w });
  // Finale "na het werk": interesses + werkplezier rond het kampvuur.
  stations.push({ type: 'finale', data: { interesses: cv.interesses } });
  return stations;
}
