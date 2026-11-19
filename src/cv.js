// Laadt alle CV's uit src/data/cv/*.json. De bestandsnaam is de id (gebruikt in ?cv=<id>).
const modules = import.meta.glob('./data/cv/*.json', { eager: true, import: 'default' });

export function loadCvs() {
  return Object.entries(modules)
    .map(([path, data]) => ({ id: path.split('/').pop().replace(/\.json$/, ''), ...data }))
    .sort((a, b) => a.naam.localeCompare(b.naam));
}

/** Zet een CV om naar de volgorde van checkpoints in het level. */
export function buildStations(cv) {
  const stations = [
    { type: 'profiel', label: cv.naam, data: cv }
  ];
  for (const o of cv.opleiding ?? []) stations.push({ type: 'opleiding', label: o.titel, data: o });
  // In de JSON staat werkervaring zoals op een gewoon CV: nieuwste eerst.
  // In de game loop je door de tijd, dus oudste eerst.
  for (const w of [...(cv.werkervaring ?? [])].reverse()) {
    stations.push({ type: 'werk', label: `${w.periode}\n${w.opdrachtgever}`, data: w });
  }
  if (cv.certificeringen?.length) stations.push({ type: 'certificeringen', label: 'Certificeringen', data: cv.certificeringen });
  if (cv.hobbys?.length) stations.push({ type: 'hobbys', label: 'Naast het werk', data: cv.hobbys });
  return stations;
}
