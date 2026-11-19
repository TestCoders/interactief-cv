import { TESTCODERS } from '../config/company.js';
import { STATION_TYPES, interestsOf } from '../cv/stations.js';
import { chips, esc, list, skillMeters } from './html.js';

// HTML voor het tekstpaneel per station, en de klassieke (niet-game) weergave van een CV.

const firstName = (cv) => cv.naam.split(' ')[0];

// Contactformulier aan het eind: gaat naar TestCoders (zie ./contactForm.js).
function finishHtml(cv) {
  const name = esc(firstName(cv));
  return `<h2>🏁 Gehaald!</h2>
    <p>Je hebt het hele CV van ${name} doorlopen. Interesse in ${name} voor jouw team?</p>
    <form id="contact-form" class="contact-form" data-cv="${esc(cv.naam)}">
      <label>Naam <input name="naam" required autocomplete="name"></label>
      <label>Organisatie <input name="organisatie" autocomplete="organization"></label>
      <label>E-mail <input name="email" type="email" required autocomplete="email"></label>
      <label>Bericht <textarea name="bericht" rows="2" placeholder="Waar kunnen we ${name} bij helpen?"></textarea></label>
      <button type="submit">▶ Neem contact op met TestCoders</button>
    </form>
    <p class="meta">Of bel ${esc(TESTCODERS.telefoon)} · <a href="${TESTCODERS.website}" target="_blank" rel="noopener">testcoders.nl</a></p>`;
}

function contactHtml() {
  const t = TESTCODERS;
  return `<ul><li><a href="mailto:${t.email}">${t.email}</a></li><li>${esc(t.telefoon)}</li><li><a href="${t.website}" target="_blank" rel="noopener">testcoders.nl</a></li></ul>`;
}

export function stationHtml(station, cv) {
  const d = station.data;
  const T = STATION_TYPES;
  switch (station.type) {
    case T.profile:
      return `<h2>${esc(cv.naam)}</h2><p class="meta">${esc(cv.rol)}</p><p>${esc(cv.profiel)}</p>`;
    case T.education:
      return `<h2>🎓 ${esc(d.titel)}</h2><p class="meta">${esc(d.instituut)} · ${esc(d.periode)}</p>`;
    case T.work:
      return `<h2>${esc(d.rol)}</h2><p class="meta">${esc(d.opdrachtgever)} · ${esc(d.periode)}</p>
        <p>${esc(d.omschrijving)}</p>${chips(d.tools)}`;
    case T.certifications:
      return `<h2>🏅 Certificeringen</h2>${list(d)}`;
    case T.expertise:
      return `<h2>🧠 Expertise</h2>${list(d)}`;
    case T.skills:
      return `<h2>🛠️ Vaardigheden</h2>${skillMeters(d)}`;
    case T.interests:
      return `<h2>🎈 Interesses</h2>${chips(d)}`;
    case T.workEnjoyment:
      return `<h2>🎉 Werkplezier bij TestCoders</h2>${list(d)}`;
    case T.finish:
      return finishHtml(cv);
    default:
      return '';
  }
}

export function classicHtml(cv) {
  const jobs = (cv.werkervaring ?? [])
    .map((job) => `<h3>${esc(job.rol)} — ${esc(job.opdrachtgever)}</h3><p class="meta">${esc(job.periode)}</p>
      <p>${esc(job.omschrijving)}</p>${chips(job.tools)}`)
    .join('');
  const education = (cv.opleiding ?? []).map((o) => `<li>${esc(o.titel)}, ${esc(o.instituut)} (${esc(o.periode)})</li>`).join('');
  const interests = interestsOf(cv);
  return `
    <h1>${esc(cv.naam)}</h1><p class="meta">${esc(cv.rol)}</p>
    <h2>Profiel</h2><p>${esc(cv.profiel)}</p>
    <h2>Werkervaring</h2>${jobs}
    <h2>Vaardigheden</h2>${skillMeters(cv.skills)}
    ${cv.certificeringen?.length ? `<h2>Certificeringen</h2>${list(cv.certificeringen)}` : ''}
    ${education ? `<h2>Opleiding</h2><ul>${education}</ul>` : ''}
    ${cv.expertise?.length ? `<h2>Expertise</h2>${list(cv.expertise)}` : ''}
    ${interests?.length ? `<h2>Interesses</h2>${chips(interests)}` : ''}
    ${cv.werkplezier?.length ? `<h2>Werkplezier</h2>${list(cv.werkplezier)}` : ''}
    <h2>Contact via TestCoders</h2>${contactHtml()}`;
}
