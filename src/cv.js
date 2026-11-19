// Laadt alle CV's uit src/data/cv/*.json. De bestandsnaam is de id (gebruikt in ?cv=<id>).
const modules = import.meta.glob('./data/cv/*.json', { eager: true, import: 'default' });

export function loadCvs() {
  return Object.entries(modules)
    .map(([path, data]) => ({ id: path.split('/').pop().replace(/\.json$/, ''), ...data }))
    .sort((a, b) => a.naam.localeCompare(b.naam));
}

/**
 * Zet een CV om naar de volgorde van checkpoints in het level.
 * Volgorde volgt de kopjes uit het MVP-template:
 * intro → expertise → vaardigheden → opleiding → ervaring → certificeringen → interesses → werkplezier → (finish: contact)
 */
export function buildStations(cv) {
  const stations = [{ type: 'profiel', label: cv.naam, data: cv }];
  if (cv.expertise?.length) stations.push({ type: 'expertise', label: 'Expertise', data: cv.expertise });
  if (cv.skills?.length) stations.push({ type: 'skills', label: 'Vaardigheden', data: cv.skills });
  for (const o of cv.opleiding ?? []) stations.push({ type: 'opleiding', label: o.titel, data: o });
  // In de data staat werkervaring zoals op een gewoon CV: nieuwste eerst.
  // In de game loop je door de tijd, dus oudste eerst.
  for (const w of [...(cv.werkervaring ?? [])].reverse()) {
    stations.push({ type: 'werk', label: `${w.periode}\n${w.opdrachtgever}`, data: w });
  }
  if (cv.certificeringen?.length) stations.push({ type: 'certificeringen', label: 'Certificeringen', data: cv.certificeringen });
  const interesses = cv.interesses ?? cv.hobbys;
  if (interesses?.length) stations.push({ type: 'interesses', label: 'Interesses', data: interesses });
  if (cv.werkplezier?.length) stations.push({ type: 'werkplezier', label: 'Werkplezier', data: cv.werkplezier });
  return stations;
}
