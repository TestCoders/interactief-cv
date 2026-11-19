import { TESTCODERS } from '../config/company.js';
import { chips, esc, skillMeters } from './html.js';
import { BRAND } from '../config/brand.js';

// HTML voor het tekstpaneel per station, en de klassieke (niet-game) weergave van een CV.

const firstName = (cv) => cv.naam.split(' ')[0];

// Contactformulier aan het eind: gaat naar TestCoders (zie ./contactForm.js).
function finishHtml(cv) {
  if (cv.uploaded) return `<h2>🏁 Gehaald!</h2><p>Je hebt het CV van ${esc(cv.naam)} doorlopen.</p>`;
  const name = esc(firstName(cv));
  return `<img class="panel-merk" src="${BRAND.logo}" alt="${BRAND.naam}"><h2>🏁 Gehaald!</h2>
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

const kort = (t = '', n = 280) => (t.length > n ? t.slice(0, t.lastIndexOf(' ', n)) + '…' : t);

// Alleen onderdelen met extra tekst gebruiken de tekstbox; de rest staat in de wereld zelf.
export function stationHtml(station, cv) {
  const d = station.data;
  switch (station.type) {
    case 'profile':
      return `<h2>${esc(cv.naam)}</h2><p class="meta">${esc(cv.rol)} · in het testvak sinds ${esc(cv.sinds)}</p><p>${esc(kort(cv.profiel, 360))}</p>`;
    case 'education':
      return `<h2>🎓 Opleidingen</h2>
        ${d.diplomas.length ? `<ul>${d.diplomas.map((o) => `<li>${[o.titel, o.instituut, o.periode].filter(Boolean).map(esc).join(' · ')}</li>`).join('')}</ul>` : ''}
        ${d.certificaten.length ? `<h3>🏅 Cursussen & certificaten</h3>${chips(d.certificaten)}` : ''}`;
    case 'work':
      return `<h2>${esc(d.rol)}</h2><p class="meta">${esc(d.opdrachtgever)} · ${esc(d.periode)}</p>
        <p>${esc(kort(d.omschrijving))}</p>
        ${d.werkzaamheden?.length ? `<ul>${d.werkzaamheden.slice(0, 4).map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
        ${chips((d.tools ?? []).slice(0, 8))}`;
    case 'finish':
      return finishHtml(cv);
    default:
      return '';
  }
}

const MAAND_KORT = { januari: 'jan', februari: 'feb', maart: 'mrt', april: 'apr', mei: 'mei', juni: 'jun', juli: 'jul', augustus: 'aug', september: 'sep', oktober: 'okt', november: 'nov', december: 'dec' };
const kortePeriode = (p = '') => p.replace(/[A-Za-z]+/g, (m) => MAAND_KORT[m.toLowerCase()] ?? m.toLowerCase());
const TAAL_KORT = { nederlands: 'NL', engels: 'EN', duits: 'DE', frans: 'FR', spaans: 'ES' };

/** Klassiek cv in de TestCoders-huisstijl (opbouw zoals het officiële TC-cv), printbaar. */
export function classicHtml(cv) {
  const [voor, ...rest] = cv.naam.split(' ');
  const lijst = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const tags = (items) => items.map((t) => `<span class="tc-tag">${esc(t)}</span>`).join('');
  const talen = (cv.talen ?? []).map((t) => `${TAAL_KORT[t.taal.toLowerCase()] ?? t.taal} ${t.niveau.toLowerCase()}`).join(', ');
  const werk = [...(cv.werkervaring ?? [])].sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
  const opdrachten = werk.map((w) => `<tr><td class="tc-periode">${esc(kortePeriode(w.periode))}</td><td>${esc(w.opdrachtgever)}</td><td>${esc(w.rol)}</td><td>${tags((w.tools ?? []).slice(0, 3))}</td></tr>`).join('');
  const perCat = new Map();
  for (const s of cv.skills ?? []) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
  const skills = [...perCat].map(([cat, items]) => `<div class="tc-skillgroep"><h4>${esc(cat)}</h4>${skillMeters(items)}</div>`).join('');
  const expertise = (cv.expertise ?? []).map((e) => `<li><span>${esc(e.naam)}</span><em>${esc([e.niveau, e.sinds && `sinds ${e.sinds}`].filter(Boolean).join(', '))}</em></li>`).join('');
  const details = werk.map((w) => `<div class="tc-opdracht"><h3>${esc(w.rol)} <span>· ${esc(w.opdrachtgever)}</span></h3><p class="tc-meta">${esc(w.periode)}</p>
      <p>${esc(w.omschrijving)}</p>${w.werkzaamheden?.length ? lijst(w.werkzaamheden) : ''}<p>${tags(w.tools ?? [])}</p></div>`).join('');
  return `
  <div class="tc-cv">
    <header class="tc-kop">
      <div class="tc-kop-links">
        <img class="tc-logo" src="${BRAND.logo}" alt="${BRAND.naam}">
        <p class="tc-rol">${esc(cv.rol)}</p>
        <h1>${esc(voor)} <span>${esc(rest.join(' '))}</span></h1>
        <p class="tc-top">${esc((cv.topSkills ?? []).join(' · '))}</p>
      </div>
      <div class="tc-kop-rechts">
        <p class="tc-label">Curriculum vitae<br>TestCoders</p>
        <dl>
          <div><dt>In het testvak sinds</dt><dd>${esc(cv.sinds)}</dd></div>
          ${talen ? `<div><dt>Talen</dt><dd>${esc(talen)}</dd></div>` : ''}
        </dl>
      </div>
    </header>

    <section class="tc-over">
      <div><h2>Over <span>${esc(voor)}</span></h2><p>${esc(cv.profiel)}</p></div>
      ${cv.kernwoorden?.length ? `<aside><p class="tc-label">Kernwoorden</p>${lijst(cv.kernwoorden)}</aside>` : ''}
    </section>

    ${opdrachten ? `<section><h2>Recente <span>opdrachten</span></h2>
      <table class="tc-tabel"><thead><tr><th>Periode</th><th>Opdrachtgever</th><th>Rol</th><th>Belangrijkste technieken</th></tr></thead><tbody>${opdrachten}</tbody></table></section>` : ''}

    ${expertise ? `<section><h2>Expertise</h2><ul class="tc-expertise">${expertise}</ul></section>` : ''}
    ${skills ? `<section><h2>Vaardig<span>heden</span></h2><div class="tc-skills">${skills}</div></section>` : ''}

    ${(cv.opleiding?.length || cv.certificeringen?.length) ? `<section class="tc-twee"><div><h2>Oplei<span>dingen</span></h2>${lijst((cv.opleiding ?? []).map((o) => [o.titel, o.instituut, o.periode].filter(Boolean).join(' · ')))}</div>
      ${cv.certificeringen?.length ? `<div><h2>Cursussen &amp; <span>certificaten</span></h2>${lijst(cv.certificeringen)}</div>` : ''}</section>` : ''}

    ${details ? `<section><h2>Ervaring <span>in detail</span></h2>${details}</section>` : ''}

    <section class="tc-twee">
      ${cv.interesses?.length ? `<div><h2>Interes<span>ses</span></h2>${lijst(cv.interesses)}${cv.conferenties?.length ? `<p class="tc-label">Bezochte conferenties</p>${lijst(cv.conferenties)}` : ''}</div>` : ''}
      ${cv.uploaded ? '' : `<div><h2>Werkplezier bij <span>TestCoders</span></h2>${lijst(TESTCODERS.werkplezier)}
        <h2>Contact</h2><p>Interesse in ${esc(voor)}? Neem contact op met TestCoders.</p>${contactHtml()}</div>`}
    </section>

    <footer class="tc-voet"><span>${esc(cv.naam.toUpperCase())} · CURRICULUM VITAE</span><span>TESTCODERS.NL</span></footer>
  </div>`;
}
