// DOM-overlay voor tekst: leesbaarder (en beter selecteerbaar) dan tekst in de canvas.
const panel = document.getElementById('panel');
const toastEl = document.getElementById('toast');

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const chips = (items = []) => `<ul class="chips">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function contactHtml(c = {}) {
  const rows = [];
  if (c.email) rows.push(`<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>`);
  if (c.telefoon) rows.push(`<li>${esc(c.telefoon)}</li>`);
  if (c.linkedin) rows.push(`<li><a href="${esc(c.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></li>`);
  return `<ul>${rows.join('')}</ul>`;
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
    case 'hobbys':
      return `<h2>🎈 Naast het werk</h2>${chips(d)}`;
    case 'finish':
      return `<h2>🏁 Gehaald!</h2><p>Je hebt <b>${d.found}/${d.total}</b> skills verzameld.</p>
        <h3>Neem contact op met ${esc(cv.naam.split(' ')[0])}</h3>${contactHtml(cv.contact)}`;
    default:
      return '';
  }
}

let shownKey = null;
export function showPanel(key, html) {
  if (shownKey === key) return;
  shownKey = key;
  panel.innerHTML = html;
  panel.hidden = false;
}
export function hidePanel() {
  shownKey = null;
  panel.hidden = true;
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
  const skills = (cv.skills ?? []).map((s) => `${s.naam}${s.niveau ? ` (${s.niveau}/5)` : ''}`);
  return `
    <h1>${esc(cv.naam)}</h1><p class="meta">${esc(cv.rol)}</p>
    <h2>Profiel</h2><p>${esc(cv.profiel)}</p>
    <h2>Werkervaring</h2>${werk}
    <h2>Skills</h2>${chips(skills)}
    ${cv.certificeringen?.length ? `<h2>Certificeringen</h2><ul>${cv.certificeringen.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    ${opl ? `<h2>Opleiding</h2><ul>${opl}</ul>` : ''}
    ${cv.hobbys?.length ? `<h2>Naast het werk</h2>${chips(cv.hobbys)}` : ''}
    <h2>Contact</h2>${contactHtml(cv.contact)}`;
}
