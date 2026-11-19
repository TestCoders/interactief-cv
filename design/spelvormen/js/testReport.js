import { TESTCODERS } from '../../../src/config/company.js';
import { BRAND } from '../../../src/config/brand.js';
import { esc } from '../../../src/ui/html.js';

// Spelvorm "Testrapport": het cv als testrun (in de stijl van een Playwright-rapport).
// Elke CV-regel is een test die live op groen gaat; aan het eind: "hire with confidence".
const LEVEL = (s) => (s.score >= 5 ? 'senior' : s.score >= 3 ? 'medior' : s.score > 0 ? 'junior' : '');

function buildSuites(cv) {
  const werk = [...(cv.werkervaring ?? [])].sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
  const perCat = new Map();
  for (const s of cv.skills ?? []) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
  const nu = new Date().getFullYear();
  return [
    { titel: 'Profiel', tests: [
      { naam: `is ${cv.rol}`, tijd: '1ms' },
      { naam: `zit sinds ${cv.sinds} in het testvak`, tijd: `${cv.jarenErvaring}y` },
      ...(cv.talen ?? []).map((t) => ({ naam: `spreekt ${t.taal} (${t.niveau.toLowerCase()})`, tijd: '2ms' }))
    ] },
    { titel: 'Expertise', tests: (cv.expertise ?? []).map((e) => ({ naam: e.naam, badge: (e.niveau ?? '').toLowerCase(), tijd: e.sinds ? `${nu - e.sinds}y` : '' })) },
    ...[...perCat].map(([cat, items]) => ({
      titel: `Vaardigheden › ${cat}`,
      tests: [...items].sort((a, b) => b.score - a.score).map((s) => ({ naam: s.naam, badge: LEVEL(s), tijd: s.sinds ? `${Math.max(0, nu - s.sinds)}y` : '' }))
    })),
    ...werk.map((w) => ({
      titel: `Ervaring › ${w.opdrachtgever}`, sub: `${w.rol} · ${w.periode}`,
      tests: (w.werkzaamheden?.length ? w.werkzaamheden : [w.rol]).map((x) => ({ naam: x, tijd: `${w.maanden ?? 1}mnd` }))
    })),
    { titel: 'Opleiding', tests: [
      ...(cv.opleiding ?? []).map((o) => ({ naam: `${o.titel} — ${o.instituut}`, tijd: o.periode })),
      ...(cv.certificeringen ?? []).map((c) => ({ naam: c, badge: 'cert' }))
    ] },
    { titel: 'Interesses', tests: (cv.interesses ?? []).map((i) => ({ naam: i })) },
    { titel: 'Werkplezier bij TestCoders', tests: [
      ...TESTCODERS.werkplezier.map((w) => ({ naam: w })),
      { naam: 'koffie staat klaar', flaky: true }
    ] }
  ].filter((s) => s.tests.length);
}

export function startTestReport(root, cv) {
  const suites = buildSuites(cv);
  const total = suites.reduce((n, s) => n + s.tests.length, 0);
  const subject = encodeURIComponent(`Interesse in ${cv.naam} (via interactief CV)`);
  root.innerHTML = `
    <div class="rapport">
      <header class="r-kop">
        <img src="${BRAND.logo}" alt="${BRAND.naam}">
        <div><h1>Testrapport · ${esc(cv.naam)}</h1><p>${esc(cv.rol)} · cv.spec.ts · Chromium</p></div>
      </header>
      <div class="r-stats">
        <div class="r-stat r-pass"><b data-n="pass">0</b><span>passed</span></div>
        <div class="r-stat"><b>0</b><span>failed</span></div>
        <div class="r-stat r-flaky"><b data-n="flaky">0</b><span>flaky</span></div>
        <div class="r-stat"><b>${cv.jarenErvaring}y</b><span>duur</span></div>
        <input class="r-filter" type="search" placeholder="Filter tests (bijv. playwright)" aria-label="Filter tests">
      </div>
      <div class="r-voortgang"><i></i></div>
      <div class="r-suites">${suites.map((s, si) => `
        <details class="r-suite" open>
          <summary><span class="r-status">●</span> ${esc(s.titel)}${s.sub ? ` <em>${esc(s.sub)}</em>` : ''} <small>${s.tests.length}</small></summary>
          <ul>${s.tests.map((t, ti) => `<li class="r-test" data-s="${si}" data-t="${ti}" data-naam="${esc(t.naam.toLowerCase())}">
            <span class="r-mark">○</span><span class="r-naam">${esc(t.naam)}</span>${t.badge ? `<span class="r-badge r-${esc(t.badge)}">${esc(t.badge)}</span>` : ''}<span class="r-tijd">${esc(t.tijd ?? '')}</span></li>`).join('')}</ul>
        </details>`).join('')}
      </div>
      <div class="r-eind" hidden>
        <p>✓ Alle ${total} tests geslaagd — <b>hire with confidence</b>.</p>
        <a class="r-cta" href="mailto:${TESTCODERS.email}?subject=${subject}">▶ Neem contact op met TestCoders</a>
      </div>
    </div>`;

  const items = [...root.querySelectorAll('.r-test')];
  const passEl = root.querySelector('[data-n="pass"]');
  const flakyEl = root.querySelector('[data-n="flaky"]');
  const bar = root.querySelector('.r-voortgang i');
  let pass = 0;
  let flaky = 0;
  let stopped = false;

  // Live testrun: elke test gaat op groen (de koffie is flaky en slaagt na een retry).
  (async () => {
    const step = Math.max(12, Math.min(45, 2600 / items.length));
    for (const li of items) {
      if (stopped) return;
      const t = suites[li.dataset.s].tests[li.dataset.t];
      li.classList.add('loopt');
      await sleep(step);
      if (t.flaky) {
        li.querySelector('.r-mark').textContent = '↻';
        await sleep(400);
        flaky++;
        flakyEl.textContent = flaky;
        li.querySelector('.r-tijd').textContent = 'retry #1';
      }
      li.classList.replace('loopt', 'ok');
      li.querySelector('.r-mark').textContent = '✓';
      pass++;
      passEl.textContent = pass;
      bar.style.width = `${(pass / items.length) * 100}%`;
      const suite = li.closest('.r-suite');
      if ([...suite.querySelectorAll('.r-test')].every((x) => x.classList.contains('ok'))) suite.classList.add('ok');
    }
    root.querySelector('.r-eind').hidden = false;
  })();

  root.querySelector('.r-filter').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    items.forEach((li) => (li.hidden = q && !li.dataset.naam.includes(q)));
    root.querySelectorAll('.r-suite').forEach((s) => (s.hidden = q && [...s.querySelectorAll('.r-test')].every((li) => li.hidden)));
  });

  return { stop() { stopped = true; root.innerHTML = ''; } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
