// Een station is één checkpoint in het level: { type, label, data }.
// Het type bepaalt welk set piece (src/pieces/pieceRegistry.js) en welke paneltekst (src/ui/stationTemplates.js) erbij hoort.
export const STATION_TYPES = {
  profile: 'profile',
  expertise: 'expertise',
  skills: 'skills',
  education: 'education',
  work: 'work',
  certifications: 'certifications',
  interests: 'interests',
  workEnjoyment: 'workEnjoyment',
  finish: 'finish'
};

/** Interesses heetten eerder hobbys; oudere CV-bestanden werken zo nog. */
export const interestsOf = (cv) => cv.interesses ?? cv.hobbys;

/**
 * Zet een CV om naar de volgorde van checkpoints in het level.
 * Volgorde volgt de kopjes uit het MVP-template:
 * intro → expertise → vaardigheden → opleiding → ervaring → certificeringen → interesses → werkplezier → (finish: contact)
 */
export function buildStations(cv) {
  const T = STATION_TYPES;
  const stations = [{ type: T.profile, label: cv.naam, data: cv }];
  if (cv.expertise?.length) stations.push({ type: T.expertise, label: 'Expertise', data: cv.expertise });
  if (cv.skills?.length) stations.push({ type: T.skills, label: 'Vaardigheden', data: cv.skills });
  for (const education of cv.opleiding ?? []) stations.push({ type: T.education, label: education.titel, data: education });
  // In de data staat werkervaring zoals op een gewoon CV: nieuwste eerst.
  // In de game loop je door de tijd, dus oudste eerst.
  for (const job of [...(cv.werkervaring ?? [])].reverse()) {
    stations.push({ type: T.work, label: `${job.periode}\n${job.opdrachtgever}`, data: job });
  }
  if (cv.certificeringen?.length) stations.push({ type: T.certifications, label: 'Certificeringen', data: cv.certificeringen });
  const interests = interestsOf(cv);
  if (interests?.length) stations.push({ type: T.interests, label: 'Interesses', data: interests });
  if (cv.werkplezier?.length) stations.push({ type: T.workEnjoyment, label: 'Werkplezier', data: cv.werkplezier });
  return stations;
}
