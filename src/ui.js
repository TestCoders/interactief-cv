import { TESTCODERS } from './testcoders.js';

// DOM-overlay voor tekst: leesbaarder (en beter selecteerbaar) dan tekst in de canvas.
const panel = document.getElementById('panel');
const toastEl = document.getElementById('toast');

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const chips = (items = []) => `<ul class="chips">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

const NIVEAUS = ['Beginner', 'Basis', 'Gevorderd', 'Ervaren', 'Expert'];
const meters = (skills = []) =>
  `<ul class="meters">${skills
    .map((s) => {
      const n = s.score ?? (typeof s.niveau === 'number' ? s.niveau : 0);
      const blocks = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('');
      const titel = typeof s.niveau === 'string' ? s.niveau : NIVEAUS[n - 1] ?? '';
      return `<li><span>${esc(s.naam)}</span><b title="${esc(titel)}">${blocks}</b></li>`;
    })
    .join('')}</ul>`;

// Contactformulier aan het eind: gaat naar TestCoders. Zonder backend: opent een ingevulde mail.
function finishHtml(cv) {
  const voornaam = esc(cv.naam.split(' ')[0]);
  return `<h2>🏁 Gehaald!</h2>
    <p>Je hebt het hele CV van ${voornaam} doorlopen. Interesse in ${voornaam} voor jouw team?</p>
    <form id="contact-form" class="contact-form" data-cv="${esc(cv.naam)}">
      <label>Naam <input name="naam" required autocomplete="name"></label>
      <label>Organisatie <input name="organisatie" autocomplete="organization"></label>
      <label>E-mail <input name="email" type="email" required autocomplete="email"></label>
      <label>Bericht <textarea name="bericht" rows="2" placeholder="Waar kunnen we ${voornaam} bij helpen?"></textarea></label>
      <button type="submit">▶ Neem contact op met TestCoders</button>
    </form>
    <p class="meta">Of bel ${esc(TESTCODERS.telefoon)} · <a href="${TESTCODERS.website}" target="_blank" rel="noopener">testcoders.nl</a></p>`;
}

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'contact-form') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const cvNaam = e.target.dataset.cv;
  const subject = `Interesse in ${cvNaam} (via interactief CV)`;
  const body = [
    `Naam: ${f.get('naam')}`,
    `Organisatie: ${f.get('organisatie') || '-'}`,
    `E-mail: ${f.get('email')}`,
    '',
    f.get('bericht') || `Ik wil graag meer weten over ${cvNaam}.`
  ].join('\n');
  location.href = `mailto:${TESTCODERS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

function contactHtml() {
  const t = TESTCODERS;
  return `<ul><li><a href="mailto:${t.email}">${t.email}</a></li><li>${esc(t.telefoon)}</li><li><a href="${t.website}" target="_blank" rel="noopener">testcoders.nl</a></li></ul>`;
}

const kort = (t = '', n = 280) => (t.length > n ? t.slice(0, t.lastIndexOf(' ', n)) + '…' : t);

// Alleen onderdelen met extra tekst gebruiken de tekstbox; de rest staat in de wereld zelf.
export function stationHtml(station, cv) {
  const d = station.data;
  switch (station.type) {
    case 'profiel':
      return `<h2>${esc(cv.naam)}</h2><p class="meta">${esc(cv.rol)} · in het testvak sinds ${esc(cv.sinds)}</p><p>${esc(kort(cv.profiel, 360))}</p>`;
    case 'opleiding':
      return `<h2>🎓 Opleidingen</h2>
        ${d.diplomas.length ? `<ul>${d.diplomas.map((o) => `<li>${esc(o.titel)}, ${esc(o.instituut)} (${esc(o.periode)})</li>`).join('')}</ul>` : ''}
        ${d.certificaten.length ? `<h3>🏅 Cursussen & certificaten</h3>${chips(d.certificaten)}` : ''}`;
    case 'werk':
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

// Panelen faden/schuiven in en uit i.p.v. aan/uit te knallen.
let shownKey = null;
let hideTimer;
export function showPanel(key, html) {
  if (shownKey === key) return;
  shownKey = key;
  clearTimeout(hideTimer);
  panel.innerHTML = html;
  panel.hidden = false;
  panel.classList.remove('in');
  requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('in')));
}
export function hidePanel() {
  if (shownKey === null) return;
  shownKey = null;
  panel.classList.remove('in');
  hideTimer = setTimeout(() => (panel.hidden = true), 180);
}

let toastTimer;
export function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), 1400);
}

export function classicHtml(cv) {
  const lijst = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
  const werk = (cv.werkervaring ?? [])
    .map((w) => `<h3>${esc(w.rol)} — ${esc(w.opdrachtgever)}</h3><p class="meta">${esc(w.periode)}</p>
      <p>${esc(w.omschrijving)}</p>${w.werkzaamheden?.length ? lijst(w.werkzaamheden) : ''}${chips(w.tools)}`)
    .join('');
  const perCat = new Map();
  for (const s of cv.skills ?? []) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
  const skills = [...perCat].map(([cat, items]) => `${perCat.size > 1 ? `<h3>${esc(cat)}</h3>` : ''}${meters(items)}`).join('');
  const opl = (cv.opleiding ?? []).map((o) => `${o.titel}, ${o.instituut} (${o.periode})`);
  const expertise = (cv.expertise ?? []).map((e) => (e.niveau ? `${e.naam} — ${e.niveau}${e.sinds ? `, sinds ${e.sinds}` : ''}` : e.naam));
  const talen = (cv.talen ?? []).map((t) => `${t.taal}: ${t.niveau}`);
  return `
    <h1>${esc(cv.naam)}</h1><p class="meta">${esc(cv.rol)} · in het testvak sinds ${esc(cv.sinds)}</p>
    <h2>Profiel</h2><p>${esc(cv.profiel)}</p>
    ${cv.kernwoorden?.length ? chips(cv.kernwoorden) : ''}
    ${expertise.length ? `<h2>Expertise</h2>${lijst(expertise)}` : ''}
    <h2>Vaardigheden</h2>${skills}
    ${talen.length ? `<h3>Talen</h3>${lijst(talen)}` : ''}
    <h2>Ervaring</h2>${werk}
    ${opl.length ? `<h2>Opleidingen</h2>${lijst(opl)}` : ''}
    ${cv.certificeringen?.length ? `<h3>Cursussen en certificeringen</h3>${lijst(cv.certificeringen)}` : ''}
    ${cv.interesses?.length ? `<h2>Interesses</h2>${chips(cv.interesses)}` : ''}
    ${cv.conferenties?.length ? `<h3>Bezochte conferenties</h3>${lijst(cv.conferenties)}` : ''}
    <h2>Werkplezier bij TestCoders</h2>${lijst(TESTCODERS.werkplezier)}
    <h2>Contact via TestCoders</h2>${contactHtml()}`;
}
