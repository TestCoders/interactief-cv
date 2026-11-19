import { TESTCODERS } from '../../../src/config/company.js';
import { BRAND } from '../../../src/config/brand.js';
import { esc } from '../../../src/ui/html.js';

// Spelvorm "Terminal": het cv als shell. Typen mag, klikken op de commando's ook (geen typvaardigheid nodig).
// Zelfde data als de game (genormaliseerd cv) en contact loopt via TestCoders.
const CHIPS = ['whoami', 'skills', 'git log', 'opleiding', 'interesses', 'team', 'npm test', 'sudo hire'];

export function startTerminal(root, cv, { onExit } = {}) {
  const user = cv.naam.split(' ')[0].toLowerCase();
  const prompt = `<span class="t-user">${esc(user)}@testcoders</span>:<span class="t-pad">~</span>$`;
  const werk = [...(cv.werkervaring ?? [])].sort((a, b) => (b.start ?? 0) - (a.start ?? 0));
  root.innerHTML = `
    <div class="term">
      <div class="term-bar"><img src="${BRAND.mark}" alt=""><span>TestCoders CV-shell — ${esc(cv.naam)}</span></div>
      <div class="term-out" role="log" aria-live="polite"></div>
      <form class="term-in"><label>${prompt}</label><input autocomplete="off" spellcheck="false" aria-label="Commando"></form>
      <div class="term-chips">${CHIPS.map((c) => `<button type="button" data-cmd="${c}">${c}</button>`).join('')}</div>
    </div>`;
  const out = root.querySelector('.term-out');
  const input = root.querySelector('input');
  const history = [];
  let hIndex = 0;

  const print = (html, cls = '') => { out.insertAdjacentHTML('beforeend', `<div class="t-line ${cls}">${html}</div>`); out.scrollTop = out.scrollHeight; };
  const bar = (score) => `[${'█'.repeat(score * 2)}${'·'.repeat(10 - score * 2)}]`;
  const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n));
  const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(16).slice(0, 7);

  const COMMANDS = {
    help: () => print(`Beschikbare commando's:
  <b>whoami</b>              wie is dit?
  <b>cat profiel.txt</b>     het profiel
  <b>expertise</b>           specialisaties
  <b>skills</b> [--alles]    vaardigheden met niveau
  <b>git log</b>             ervaring (nieuwste eerst) · <b>git show &lt;n&gt;</b> voor details
  <b>opleiding</b>           diploma's en certificaten
  <b>interesses</b>          waar ${esc(cv.naam.split(' ')[0])} warm voor loopt
  <b>team</b>                werkplezier bij TestCoders
  <b>npm test</b>            het cv als testrun
  <b>contact</b> · <b>sudo hire ${esc(user)}</b> · <b>ls</b> · <b>clear</b> · <b>exit</b>`),
    whoami: () => print(`<b>${esc(cv.naam)}</b> — ${esc(cv.rol)}
in het testvak sinds ${esc(cv.sinds)} (${cv.jarenErvaring} jaar) · top: ${esc((cv.topSkills ?? []).join(', '))}
talen: ${esc((cv.talen ?? []).map((t) => `${t.taal} (${t.niveau})`).join(', ') || '—')}`),
    ls: () => print('profiel.txt  expertise/  skills/  ervaring.git/  opleiding.txt  interesses.txt  team.txt  contact.txt  cv.md'),
    'cat profiel.txt': () => print(esc(cv.profiel)),
    profiel: () => COMMANDS['cat profiel.txt'](),
    'cat cv.md': () => print(`Het hele cv als Markdown (voor mens én AI): <a href="./cv/${esc(cv.id)}.md" target="_blank" rel="noopener">cv/${esc(cv.id)}.md</a>`),
    expertise: () => print((cv.expertise ?? []).map((e) => `★ ${pad(e.naam, 34)} ${esc(e.niveau ?? '')}${e.sinds ? ` · sinds ${e.sinds}` : ''}`).map(esc).join('\n') || 'geen expertise opgegeven'),
    skills: (args) => {
      const alles = args.includes('--alles');
      const perCat = new Map();
      for (const s of cv.skills ?? []) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
      const lines = [];
      for (const [cat, items] of perCat) {
        lines.push(`<b>${esc(cat)}</b>`);
        for (const s of [...items].sort((a, b) => b.score - a.score).slice(0, alles ? 99 : 5)) {
          lines.push(`  ${esc(pad(s.naam, 26))} <span class="t-bar">${bar(s.score)}</span> ${esc(typeof s.niveau === 'string' ? s.niveau : '')}`);
        }
      }
      if (!alles) lines.push(`<span class="t-dim">(top 5 per categorie — "skills --alles" voor alle ${cv.skills.length})</span>`);
      print(lines.join('\n'));
    },
    'git log': () => print(werk.map((w, i) => `<span class="t-hash">${hash(w.opdrachtgever + w.periode)}</span> <span class="t-dim">(${esc(w.periode)})</span> ${esc(w.rol)} @ <b>${esc(w.opdrachtgever)}</b>  <span class="t-dim">[${i + 1}]</span>`).join('\n')
      + `\n<span class="t-dim">tip: git show 1</span>`),
    ervaring: () => COMMANDS['git log'](),
    'git show': (args) => {
      const w = werk[Number(args[0]) - 1];
      if (!w) return print(`gebruik: git show &lt;1–${werk.length}&gt;`, 't-err');
      print(`<span class="t-hash">commit ${hash(w.opdrachtgever + w.periode)}</span>
Auteur: ${esc(cv.naam)} · ${esc(w.periode)}
<b>${esc(w.rol)} @ ${esc(w.opdrachtgever)}</b>

    ${esc(w.omschrijving)}

${(w.werkzaamheden ?? []).map((x) => `  <span class="t-ok">+</span> ${esc(x)}`).join('\n')}
  tools: ${esc((w.tools ?? []).join(', '))}`);
    },
    opleiding: () => print([...(cv.opleiding ?? []).map((o) => `🎓 ${esc(o.titel)}, ${esc(o.instituut)} (${esc(o.periode)})`),
      ...(cv.certificeringen ?? []).map((c) => `🏅 ${esc(c)}`)].join('\n') || 'geen opleiding opgegeven'),
    interesses: () => print([...(cv.interesses ?? []).map((i) => `♥ ${esc(i)}`), ...(cv.conferenties?.length ? ['', '<span class="t-dim">bezochte conferenties:</span>', ...cv.conferenties.map((c) => `  · ${esc(c)}`)] : [])].join('\n')),
    team: () => print(`<b>Werkplezier bij TestCoders</b>\n${TESTCODERS.werkplezier.map((w) => `  ✓ ${esc(w)}`).join('\n')}`),
    werkplezier: () => COMMANDS.team(),
    'npm test': async () => {
      print('<span class="t-dim">&gt; cv@1.0.0 test\n&gt; playwright test --reporter=line</span>');
      const tests = [
        ...(cv.expertise ?? []).map((e) => `expertise › ${e.naam}`),
        ...(cv.skills ?? []).slice(0, 12).map((s) => `skills › ${s.naam}`),
        ...werk.map((w) => `ervaring › ${w.opdrachtgever}`),
        'werkplezier › hechte club'
      ];
      for (const t of tests) { await sleep(35); print(`  <span class="t-ok">✓</span> ${esc(t)}`); }
      print(`\n  <span class="t-ok"><b>${tests.length} passed</b></span> <span class="t-dim">(${(cv.jarenErvaring ?? 1)} jaar)</span> — tip: kies vorm "Testrapport" voor het hele rapport`);
    },
    contact: () => print(`Contact loopt via <b>TestCoders</b>: <a href="mailto:${TESTCODERS.email}">${TESTCODERS.email}</a> · ${esc(TESTCODERS.telefoon)} · <a href="${TESTCODERS.website}" target="_blank" rel="noopener">testcoders.nl</a>`),
    sudo: (args) => {
      if (args[0] !== 'hire') return print('sudo: alleen "sudo hire" is toegestaan 😉', 't-err');
      const subject = encodeURIComponent(`Interesse in ${cv.naam} (via interactief CV)`);
      print(`[sudo] wachtwoord voor recruiter: ******** <span class="t-ok">✓</span>
🎉 Goede keuze! <a class="t-cta" href="mailto:${TESTCODERS.email}?subject=${subject}">▶ Mail TestCoders over ${esc(cv.naam.split(' ')[0])}</a>`);
    },
    'rm -rf /': () => print('Nice try. Dit is een tester — die heeft een backup. 🙂', 't-err'),
    clear: () => (out.innerHTML = ''),
    history: () => print(history.map((h, i) => `${String(i + 1).padStart(4)}  ${esc(h)}`).join('\n')),
    exit: () => onExit?.()
  };
  const NAMES = Object.keys(COMMANDS);

  async function run(raw) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    print(`${prompt} ${esc(line)}`, 't-cmd');
    const lower = line.toLowerCase();
    const name = NAMES.filter((n) => lower === n || lower.startsWith(n + ' ')).sort((a, b) => b.length - a.length)[0];
    if (!name) return print(`command not found: ${esc(line.split(' ')[0])} — typ <b>help</b>`, 't-err');
    await COMMANDS[name](line.slice(name.length).trim().split(' ').filter(Boolean));
  }

  root.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; run(v); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && history.length) { hIndex = Math.max(0, hIndex - 1); input.value = history[hIndex]; e.preventDefault(); }
    if (e.key === 'ArrowDown') { hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] ?? ''; e.preventDefault(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const match = NAMES.find((n) => n.startsWith(input.value.toLowerCase()));
      if (match) input.value = match + ' ';
    }
  });
  root.querySelector('.term-chips').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) run(b.dataset.cmd === 'sudo hire' ? `sudo hire ${user}` : b.dataset.cmd);
    input.focus();
  });
  root.querySelector('.term').addEventListener('click', (e) => { if (!e.target.closest('a,button')) input.focus(); });

  // Bootsequentie.
  (async () => {
    for (const [txt, cls] of [
      [`TestCoders BIOS v${new Date().getFullYear()} · geheugen: ${cv.jarenErvaring} jaar ervaring`, 't-dim'],
      ['Loading expertise… <span class="t-ok">ok</span>', 't-dim'],
      [`Loading ${cv.skills?.length ?? 0} skills… <span class="t-ok">ok</span>`, 't-dim'],
      [`Mounting ervaring.git (${werk.length} commits)… <span class="t-ok">ok</span>`, 't-dim'],
      ['', ''],
      [`Welkom bij het cv van <b>${esc(cv.naam)}</b>, ${esc(cv.rol)}.`, ''],
      ['Typ <b>help</b>, of klik hieronder een commando.', '']
    ]) { print(txt, cls); await sleep(160); }
    input.focus();
  })();

  return { stop() { root.innerHTML = ''; } };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
