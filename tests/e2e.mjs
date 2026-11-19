// End-to-end test van de speelbaarheid, met echte muiswiel-, toets- en tikevents via het Chrome DevTools Protocol.
// Geen extra dependencies: start zelf een Vite-devserver en een headless Chrome.
//   npm run test:e2e                 (CV: robin-sterrenstof)
//   CV=sam-voorbeeld npm run test:e2e
//   CHROME=/pad/naar/chrome npm run test:e2e
import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CV = process.env.CV ?? 'robin-sterrenstof';
const CHROME = process.env.CHROME ?? [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'
].find(existsSync);
const PORT = 5199;
const DEBUG_PORT = 9399;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '✓' : '✗'} ${msg}`); if (!ok) failures++; };

if (!CHROME) { console.error('Geen Chrome gevonden; zet CHROME=/pad/naar/chrome'); process.exit(2); }
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' });
await server.listen();
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cv-e2e-'))}`,
  '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

try {
  let targets;
  for (let i = 0; i < 50 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json(); } catch { await sleep(200); } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result); pending.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errors.push((d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text).split('\n')[0]);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result?.value;
  const L = `__game.scene.getScene('level')`;
  const wheel = () => send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 400, y: 300, deltaX: 0, deltaY: 100 });
  const key = async (type, k, code, vk) => send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk });
  const press = async (k, code, vk, ms = 120) => { await key('keyDown', k, code, vk); await sleep(ms); await key('keyUp', k, code, vk); };
  const panelTitle = () => ev(`document.getElementById('panel').classList.contains('in') ? document.querySelector('#panel h2')?.textContent : null`);
  const reset = (x) => ev(`(() => { const s = ${L}; s.player.setPosition(${x}, s.groundY - 30); s.player.setVelocity(0); s.intent = 0; s.glideTo = null; s.gate = null; s.prevX = ${x}; })()`);
  const load = async () => {
    await send('Page.navigate', { url: `http://localhost:${PORT}/?cv=${CV}&stijl=retro` });
    await sleep(3000);
  };
  const scrollUntil = async (cond, max = 400, pause = 120) => {
    for (let i = 0; i < max; i++) { await wheel(); await sleep(pause); if (await ev(cond)) return true; }
    return false;
  };

  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await load();
  console.log(`\nCV: ${CV} · ${await ev(`${L}.pieces.length`)} onderdelen, ${await ev(`${L}.bonuses.length`)} bonussen\n`);

  // 0. Branding en Martijn.
  console.log('— TestCoders en Martijn');
  check(await ev(`!!document.querySelector('#titlecard img.tc-merk')`), 'titelkaart toont het TestCoders-logo');
  await wheel(); await sleep(1500);
  check(await ev(`!!document.querySelector('#hud img.hud-merk') && document.getElementById('hud').textContent.includes('Stap')`), 'HUD toont beeldmerk en voortgang ("Stap x/y")');
  for (let i = 0; i < 30 && !(await ev(`${L}.gate?.dialogue`)); i++) { await wheel(); await sleep(150); }
  const host = `${L}.pieces.find((p) => p.station.type === 'host')`;
  check(await ev(`${L}.gate?.dialogue === true`), 'Martijn houdt je even vast om de collega voor te stellen');
  check((await ev(`${host}.text.text`)).includes('Martijn'), `Martijn begint: "${await ev(`${host}.text.text`)}"`);
  const zin1 = await ev(`${host}.index`);
  await press('ArrowRight', 'ArrowRight', 39, 80); await sleep(400);
  check((await ev(`${host}.index`)) === zin1 + 1, '→ = volgende zin');
  const nLines = await ev(`${host}.lines.length`);
  check(await ev(`${host}.lines.some((l) => ${L}.cv.profiel.startsWith(l.slice(0, 20)))`), `hij vertelt het profiel (${nLines} zinnen)`);
  await load();

  // 1. Alleen scrollen: hele CV, elk onderdeel speelt pas af bij aankomst en is klaar voordat je verder mag.
  console.log('— Alleen scrollen');
  const t0 = Date.now();
  const tooEarly = new Set();
  const leftUnfinished = new Set();
  let coachSpringen = false;
  for (let i = 0; i < 5000; i++) {
    await wheel();
    await sleep(120);
    const s = await ev(`(() => { const s = ${L}; const px = s.player.x; return { fin: s.finished,
      vroeg: s.pieces.flatMap((p, i) => p.stages.map((st, j) => st.ran && px < st.x - 40 ? i + '.' + j : null)).filter(Boolean),
      onaf: s.pieces.flatMap((p, i) => p.stages.map((st, j) => st.ran && !st.complete && px > st.x + 60 ? i + '.' + j : null)).filter(Boolean),
      coach: !document.getElementById('coach').hidden && document.getElementById('coach').textContent.includes('spatie') }; })()`);
    s.vroeg.forEach((x) => tooEarly.add(x));
    s.onaf.forEach((x) => leftUnfinished.add(x));
    coachSpringen ||= s.coach;
    if (s.fin) break;
  }
  const secs = (Date.now() - t0) / 1000;
  const total = await ev(`${L}.pieces.reduce((n, p) => n + p.stages.length, 0)`);
  const ran = await ev(`${L}.pieces.reduce((n, p) => n + p.stages.filter((s) => s.ran).length, 0)`);
  check(await ev(`${L}.finished`), 'finish gehaald met alleen scrollen');
  check(ran === total, `alle ${total} momenten afgespeeld (${ran}/${total})`);
  check(tooEarly.size === 0, `niets speelt af voordat je er bent${tooEarly.size ? ` (${[...tooEarly]})` : ''}`);
  check(leftUnfinished.size === 0, `geen onderdeel verlaten voordat de animatie klaar was${leftUnfinished.size ? ` (${[...leftUnfinished]})` : ''}`);
  check(secs <= 120, `doorlooptijd ${secs.toFixed(0)} s (doel ≤ 90 s, grens 120 s)`);
  if (await ev(`${L}.bonuses.length`)) check(coachSpringen, 'mini-tutorial bij het eerste cadeautje ("druk op spatie")');
  const flag = await ev(`(() => { const p = ${L}.pieces.find((p) => p.station.type === 'work'); return p ? Math.abs(p.flag.y - (p.poleTop + 16)) < 4 : true; })()`);
  check(flag, 'releasevlag hangt bovenaan de mast na het voorbijlopen');

  // 2. Lezer: scrollt tot een opdracht in de tekstbox staat en stopt.
  console.log('\n— Stoppen om te lezen');
  await load(); await ev(`${L}.dismissTitle()`);
  const werkX = await ev(`${L}.pieces.find((p) => p.station.type === 'work').stopX`);
  await reset(werkX - 700); await sleep(400);
  let title = null;
  for (let i = 0; i < 120 && !title?.match(/engineer|ontwikkelaar|tester|consultant/i); i++) { await wheel(); await sleep(120); title = await panelTitle(); }
  const xStop = await ev(`${L}.player.x`);
  await sleep(4500);
  const xRest = await ev(`${L}.player.x`);
  const nextStop = await ev(`${L}.stops.find((s) => s > ${xStop} - 40)`);
  check(Math.abs(xRest - nextStop) < 6, `stopt bij de eerstvolgende halteplaats, niet erlangs (${Math.round(xRest - xStop)} px na loslaten)`);
  check((await ev(`Math.abs(${L}.player.body.velocity.x)`)) < 1, 'staat daarna stil');
  check((await panelTitle()) === title, `tekstbox blijft staan: "${title}"`);

  // 3. Besturing: alleen scrollen, ← → en spatie/↑. Geen ↓, W, A, S, D meer.
  console.log('\n— Besturing');
  // Alle onderdelen als "gezien" markeren, zodat geen halteplaats de meting beïnvloedt.
  await ev(`${L}.pieces.forEach((p) => p.stages.forEach((s) => { s.ran = true; s.complete = true; }))`);
  await reset(await ev(`${L}.pieces.find((p) => p.station.type === 'skills').stopX + 260`)); await sleep(1500);
  const x300 = await ev(`${L}.player.x`);
  await press('ArrowDown', 'ArrowDown', 40, 600); await press('s', 'KeyS', 83, 600);
  await sleep(300);
  check(Math.abs((await ev(`${L}.player.x`)) - x300) < 6, '↓ en S doen niets (lopen = ← → / A D of muiswiel)');
  await press('d', 'KeyD', 68, 600); await sleep(400);
  check((await ev(`${L}.player.x`)) > x300 + 100, 'D loopt ook (WASD)');
  await reset(x300); await sleep(300);
  await key('keyDown', 'ArrowRight', 'ArrowRight', 39); await sleep(800);
  const xLos = await ev(`${L}.player.x`);
  await key('keyUp', 'ArrowRight', 'ArrowRight', 39); await sleep(600);
  const xStil = await ev(`${L}.player.x`);
  check(xLos > x300 + 150, 'pijltje rechts laat de held lopen');
  check(xStil - xLos < 40, `pijltje los = meteen stil (${Math.round(xStil - xLos)} px uitloop)`);

  // 4. Bonus: optioneel, via springen.
  console.log('\n— Bonus via springen');
  const nb = await ev(`${L}.bonuses.length`);
  if (nb) {
    await reset(await ev(`${L}.bonuses[0].x`)); await sleep(500);
    check(await ev(`${L}.bonuses[0].hint.visible`), 'spring-hint zichtbaar onder het cadeautje');
    await press(' ', 'Space', 32, 250); await sleep(900);
    check(await ev(`${L}.bonuses[0].opened`), `spatie opent het cadeautje ("${await ev(`${L}.bonuses[0].titel`)}")`);
    check((await ev(`document.getElementById('hud').textContent`)).includes(`1/${nb}`), 'HUD telt de gevonden bonus');
    if (nb > 1) {
      await reset(await ev(`${L}.bonuses[1].x`)); await sleep(500);
      await ev(`${L}.bonuses[1].gift.emit('pointerdown')`); await sleep(900);
      check(await ev(`${L}.bonuses[1].opened`), 'tikken op het cadeautje werkt ook (touch)');
    }
  } else console.log('  (dit CV heeft geen bonussen)');

  // 5. Shortcuts: de bug eet je op en spuugt je bij het hoofdstuk uit.
  console.log('\n— Snel naar een hoofdstuk (bug)');
  await load(); await ev(`${L}.dismissTitle()`); await sleep(1000);
  await ev(`[...document.querySelectorAll('#chapters button')].find((b) => b.textContent.includes('Ervaring')).click()`);
  await sleep(500);
  check(await ev(`${L}.traveling && ${L}.children.list.some((o) => o.texture?.key?.endsWith('bug0') || o.texture?.key?.endsWith('bug1'))`), 'er komt een bug aan');
  for (let i = 0; i < 40 && await ev(`${L}.traveling`); i++) await sleep(150);
  await sleep(1200);
  const stage0 = await ev(`${L}.pieces.find((p) => p.station.type === 'work').stages[0].x`);
  const at = await ev(`${L}.player.x`);
  check(Math.abs(at - stage0) < 8, `uitgespuugd bij de eerste opdracht (${Math.round(Math.abs(at - stage0))} px ernaast)`);
  check(await ev(`${L}.pieces.find((p) => p.station.type === 'work').stages[0].ran`), 'testrun start na aankomst');
  check(await ev(`document.querySelector('#chapters button.nu')?.textContent.includes('Ervaring')`), 'hoofdstukbalk markeert "Ervaring"');
  // Doorlopen langs de mast: held springt ertegen op, vlag gaat omhoog.
  await sleep(3500);
  const sawCutscene = await scrollUntil(`${L}.cutscene`, 60, 100);
  check(sawCutscene, 'bij het voorbijlopen springt de held tegen de vlaggenmast op');
  for (let i = 0; i < 40 && await ev(`${L}.cutscene`); i++) await sleep(100);
  await sleep(600);
  check(await ev(`(() => { const p = ${L}.pieces.find((p) => p.station.type === 'work'); return Math.abs(p.flag.y - (p.poleTop + 16)) < 4; })()`), 'vlag met opdrachtgever hangt in top');
  await press('1', 'Digit1', 49, 80);
  for (let i = 0; i < 40; i++) { await sleep(150); if (!(await ev(`${L}.traveling`))) break; }
  await sleep(800);
  check(Math.abs((await ev(`${L}.player.x`)) - (await ev(`${L}.pieces[0].stages[0].x`))) < 8, 'toets 1 → terug naar Profiel');

  // 6. Stijlwisselaar: zelfde plek, andere skin.
  console.log('\n— Stijlwisselaar');
  await reset(await ev(`${L}.pieces.find((p) => p.station.type === 'skills').stopX`)); await sleep(800);
  const xBefore = await ev(`${L}.player.x`);
  await ev(`document.getElementById('btn-style').click()`); await sleep(2000);
  check((await ev(`__game.registry.get('theme')`)) === 'zakelijk', 'knop wisselt naar "Zakelijk"');
  check(await ev(`(${L}.ground.displayTexture ?? ${L}.ground.texture).key === 'z-ground'`), 'wereld gebruikt de zakelijke textures (Bjorns ontwerp)');
  check(await ev(`${L}.vis.texture.key.startsWith('z-hero-')`), 'held wisselt mee (kantoorheld in pak)');
  check(Math.abs((await ev(`${L}.player.x`)) - xBefore) < 8, 'held blijft op dezelfde plek');
  check((await ev(`document.documentElement.dataset.stijl`)) === 'zakelijk', 'tekstbox en knoppen volgen de stijl');
  await ev(`document.getElementById('btn-style').click()`); await sleep(2000);
  check((await ev(`__game.registry.get('theme')`)) === 'retro', 'en weer terug naar "Retro"');

  // 7. Klassiek cv in TestCoders-huisstijl.
  console.log('\n— Klassiek cv');
  await ev(`document.getElementById('btn-classic').click()`); await sleep(400);
  check(await ev(`!!document.querySelector('#classic .tc-cv .tc-kop h1') && !!document.querySelector('#classic .tc-tabel')`), 'klassiek cv in huisstijl, met tabel "Recente opdrachten"');
  await ev(`document.getElementById('btn-close-classic').click()`); await sleep(300);

  // 8. Leesbaarheid: tekst in de wereld rendert op schermresolutie.
  console.log('\n— Scherpte');
  const res = await ev(`(() => { const s = ${L}; const t = []; const walk = (l) => l.forEach((o) => { if (o.type === 'Text') t.push(o.style.resolution); if (o.list) walk(o.list); }); walk(s.children.list); return { min: Math.min(...t), zoom: s.cameras.main.zoom, canvas: __game.canvas.width + 'x' + __game.canvas.height }; })()`);
  check(res.min >= Math.ceil(res.zoom), `tekstresolutie ${res.min}× bij zoom ${res.zoom.toFixed(2)} (canvas ${res.canvas} = schermgrootte)`);

  // 9. Finish: contact via TestCoders, typen zonder te lopen.
  console.log('\n— Contact');
  await reset(await ev(`${L}.finishX + 40`)); await sleep(1200);
  check(await ev(`!!document.querySelector('#panel #contact-form')`), 'contactformulier aan de finish');
  check(await ev(`!!document.querySelector('#panel img.panel-merk')`), 'finish onder TestCoders-vlag (logo in het paneel)');
  check(!(await ev(`document.getElementById('panel').textContent.includes('example.com')`)), 'geen persoonlijk e-mailadres zichtbaar');
  await ev(`document.querySelector('#contact-form [name=naam]').focus()`);
  const fx = await ev(`${L}.player.x`);
  for (const ch of 'wasd a') { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); }
  await sleep(500);
  check((await ev(`document.querySelector('#contact-form [name=naam]').value`)) === 'wasd a', 'typen in het formulier werkt');
  check(Math.abs((await ev(`${L}.player.x`)) - fx) < 2, 'held blijft staan tijdens typen');

  console.log('');
  check(errors.length === 0, `geen JS-fouten${errors.length ? ': ' + errors.join(' | ') : ''}`);
  ws.close();
} finally {
  chrome.kill();
  await server.close();
}
console.log(failures ? `\n${failures} check(s) gefaald` : '\nAlles groen ✓');
process.exit(failures ? 1 : 0);
