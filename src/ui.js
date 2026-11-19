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
      const n = s.niveau ?? 0;
      const blocks = [1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('');
      return `<li><span>${esc(s.naam)}</span><b title="${NIVEAUS[n - 1] ?? ''}">${blocks}</b></li>`;
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

export function stationHtml(station, cv) {
  const d = station.data;
  switch (station.type) {
    case 'profiel':
      return `<h2>${esc(cv.naam)}</h2><p class="meta">${esc(cv.rol)}</p><p>${esc(cv.profiel)}</p>`;
    case 'opleiding':
      return `<h2>🎓 ${esc(d.titel)}</h2><p class="meta">${esc(d.instituut)} · ${esc(d.periode)}</p>`;
    case 'werk':
      return `<h2>${esc(d.rol)}</h2><p class="meta">${esc(d.opdrachtgever)} · ${esc(d.periode)}</p>
        <p>${esc(d.omschrijving)}</p>${chips(d.tools)}`;
    case 'certificeringen':
      return `<h2>🏅 Certificeringen</h2><ul>${d.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`;
    case 'expertise':
      return `<h2>🧠 Expertise</h2><ul>${d.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`;
    case 'skills':
      return `<h2>🛠️ Vaardigheden</h2>${meters(d)}`;
    case 'interesses':
    case 'hobbys':
      return `<h2>🎈 Interesses</h2>${chips(d)}`;
    case 'werkplezier':
      return `<h2>🎉 Werkplezier bij TestCoders</h2><ul>${d.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>`;
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
  const werk = (cv.werkervaring ?? [])
    .map((w) => `<h3>${esc(w.rol)} — ${esc(w.opdrachtgever)}</h3><p class="meta">${esc(w.periode)}</p>
      <p>${esc(w.omschrijving)}</p>${chips(w.tools)}`)
    .join('');
  const opl = (cv.opleiding ?? []).map((o) => `<li>${esc(o.titel)}, ${esc(o.instituut)} (${esc(o.periode)})</li>`).join('');
  return `
    <h1>${esc(cv.naam)}</h1><p class="meta">${esc(cv.rol)}</p>
    <h2>Profiel</h2><p>${esc(cv.profiel)}</p>
    <h2>Werkervaring</h2>${werk}
    <h2>Vaardigheden</h2>${meters(cv.skills)}
    ${cv.certificeringen?.length ? `<h2>Certificeringen</h2><ul>${cv.certificeringen.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    ${opl ? `<h2>Opleiding</h2><ul>${opl}</ul>` : ''}
    ${cv.expertise?.length ? `<h2>Expertise</h2><ul>${cv.expertise.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    ${(cv.interesses ?? cv.hobbys)?.length ? `<h2>Interesses</h2>${chips(cv.interesses ?? cv.hobbys)}` : ''}
    ${cv.werkplezier?.length ? `<h2>Werkplezier</h2><ul>${cv.werkplezier.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
    <h2>Contact via TestCoders</h2>${contactHtml()}`;
}
