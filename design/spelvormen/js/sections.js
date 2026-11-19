import { TESTCODERS } from '../../../src/config/company.js';
import { esc, chips, list, skillMeters } from '../../../src/ui/html.js';
import { stationHtml } from '../../../src/ui/stationTemplates.js';

// De CV-onderdelen als losse blokken HTML, gedeeld door de andere spelvormen (dungeon, 3D-wereld).
// Zelfde data en volgorde als het level; het TestCoders-contact is altijd het laatste onderdeel.
export function cvSections(cv) {
  const voornaam = cv.naam.split(' ')[0];
  const werk = [...(cv.werkervaring ?? [])].sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
  const perCat = new Map();
  for (const s of cv.skills ?? []) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
  const topCats = [...perCat].slice(0, 3);
  return [
    {
      id: 'profiel', titel: 'Profiel', icoon: '👋',
      html: `<h2>${esc(cv.naam)}</h2><p class="meta">${esc(cv.rol)} · in het testvak sinds ${esc(cv.sinds)}</p><p>${esc(cv.profiel)}</p>${chips(cv.topSkills ?? [])}`
    },
    {
      id: 'expertise', titel: 'Expertise', icoon: '🧠',
      html: `<h2>🧠 Expertise</h2>${list((cv.expertise ?? []).map((e) => (e.niveau ? `${e.naam} — ${e.niveau}` : e.naam)))}`
    },
    {
      id: 'vaardigheden', titel: 'Vaardigheden', icoon: '🛠️',
      html: `<h2>🛠️ Vaardigheden</h2>${topCats.map(([cat, items]) => `<h3>${esc(cat)}</h3>${skillMeters(items.slice(0, 6))}`).join('')}`
    },
    {
      id: 'ervaring', titel: 'Ervaring', icoon: '🚀',
      html: `<h2>🚀 Ervaring</h2><ul>${werk.map((w) => `<li><b>${esc(w.rol)}</b> · ${esc(w.opdrachtgever)}<br><span class="meta">${esc(w.periode)}</span></li>`).join('')}</ul>`
    },
    {
      id: 'opleiding', titel: 'Opleiding', icoon: '🎓',
      html: `<h2>🎓 Opleiding</h2>${list((cv.opleiding ?? []).map((o) => `${o.titel}, ${o.instituut} (${o.periode})`))}${cv.certificeringen?.length ? `<h3>Cursussen & certificaten</h3>${chips(cv.certificeringen)}` : ''}`
    },
    {
      id: 'mens', titel: 'Na het werk', icoon: '🔥',
      html: `<h2>🔥 Waar ${esc(voornaam)} warm voor loopt</h2>${chips(cv.interesses ?? [])}<h3>Werkplezier bij TestCoders</h3>${list(TESTCODERS.werkplezier)}`
    },
    { id: 'contact', titel: 'Contact', icoon: '✉️', html: stationHtml({ type: 'finish' }, cv) }
  ];
}
