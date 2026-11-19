// End-to-end test van de speelbaarheid, met echte muiswiel- en toetsenbordevents via het Chrome DevTools Protocol.
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
  const panelTitle = () => ev(`document.getElementById('panel').classList.contains('in') ? document.querySelector('#panel h2')?.textContent : null`);
  const reset = (x) => ev(`(() => { const s = ${L}; s.player.setPosition(${x}, s.groundY - 30); s.player.setVelocity(0); s.intent = 0; s.glideTo = null; s.gate = null; s.prevX = ${x}; })()`);

  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:${PORT}/?cv=${CV}&stijl=retro` });
  await sleep(3000);
  console.log(`\nCV: ${CV} · ${await ev(`${L}.pieces.length`)} onderdelen, ${await ev(`${L}.bonuses.length`)} bonussen\n`);

  // 1. Alleen scrollen, rustig tempo: hele CV zien, alle animaties af terwijl ze in beeld zijn.
  console.log('— Alleen scrollen');
  const t0 = Date.now();
  const seenWhileVisible = new Set();
  const leftUnfinished = new Set();
  for (let i = 0; i < 4000; i++) {
    await wheel();
    await sleep(120);
    const s = await ev(`(() => { const s = ${L}; const v = s.cameras.main.worldView; return { fin: s.finished,
      done: s.pieces.map((p, i) => p.done !== false && p.x > v.x && p.x < v.right ? i : -1).filter((i) => i >= 0),
      onaf: s.pieces.map((p, i) => p.duration && s.player.x > p.stopX + 60 && !p.complete ? i : -1).filter((i) => i >= 0) }; })()`);
    s.done.forEach((i) => seenWhileVisible.add(i));
    s.onaf.forEach((i) => leftUnfinished.add(i));
    if (s.fin) break;
  }
  const secs = (Date.now() - t0) / 1000;
  const total = await ev(`${L}.pieces.length`);
  check(await ev(`${L}.finished`), 'finish gehaald met alleen scrollen');
  check(seenWhileVisible.size === total, `alle ${total} onderdelen geactiveerd terwijl ze in beeld waren (${seenWhileVisible.size}/${total})`);
  check(secs <= 120, `doorlooptijd ${secs.toFixed(0)} s (doel ≤ 90 s, grens 120 s)`);
  check(leftUnfinished.size === 0, `geen onderdeel verlaten voordat de animatie klaar was${leftUnfinished.size ? ` (${[...leftUnfinished].join(', ')})` : ''}`);

  // 2. Lezer: scrollt tot een opdracht in de tekstbox staat en stopt. Moet snel stilstaan en de tekst blijven zien.
  console.log('\n— Stoppen om te lezen');
  const werkX = await ev(`${L}.pieces.find((p) => p.station.type === 'werk').stopX`);
  await reset(werkX - 700); await sleep(400);
  let title = null;
  for (let i = 0; i < 100 && !title?.match(/engineer|ontwikkelaar/i); i++) { await wheel(); await sleep(120); title = await panelTitle(); }
  const xStop = await ev(`${L}.player.x`);
  await sleep(1800);
  const xRest = await ev(`${L}.player.x`);
  const vRest = await ev(`Math.abs(${L}.player.body.velocity.x)`);
  const nextStop = await ev(`${L}.stops.find((s) => s > ${xStop} - 40)`);
  check(Math.abs(xRest - nextStop) < 6, `stopt bij de eerstvolgende halteplaats, niet erlangs (${Math.round(xRest - xStop)} px na loslaten)`);
  check(vRest < 1, 'staat binnen 1,8 s stil');
  check((await panelTitle()) === title, `tekstbox blijft staan: "${title}"`);
  const nearestStop = await ev(`(() => { const s = ${L}; return Math.min(...s.stops.map((x) => Math.abs(x - s.player.x))); })()`);
  check(nearestStop < 6, `glijdt naar de halteplaats (${nearestStop.toFixed(1)} px ernaast)`);

  // 3. Pijltjes = scrollen: zelfde model, ook netjes stoppen.
  console.log('\n— Pijltjes werken precies als scrollen');
  await reset(werkX - 600); await sleep(400);
  await key('keyDown', 'ArrowRight', 'ArrowRight', 39); await sleep(1000); await key('keyUp', 'ArrowRight', 'ArrowRight', 39);
  const kx0 = await ev(`${L}.player.x`); await sleep(1800);
  const kx1 = await ev(`${L}.player.x`);
  check(kx0 > werkX - 600 + 150, 'pijltje rechts laat de held lopen');
  check(Math.abs(kx1 - kx0) < 320 && (await ev(`Math.abs(${L}.player.body.velocity.x)`)) < 1, `na loslaten stil binnen ${Math.round(Math.abs(kx1 - kx0))} px`);

  // 4. Bonus: optioneel, via springen.
  console.log('\n— Bonus via springen');
  const nb = await ev(`${L}.bonuses.length`);
  if (nb) {
    const bx = await ev(`${L}.bonuses[0].x`);
    await reset(bx); await sleep(500);
    check(await ev(`${L}.bonuses[0].hint.visible`), 'spring-hint zichtbaar onder het cadeautje');
    await key('keyDown', ' ', 'Space', 32); await sleep(250); await key('keyUp', ' ', 'Space', 32); await sleep(900);
    check(await ev(`${L}.bonuses[0].opened`), `spatie opent het cadeautje ("${await ev(`${L}.bonuses[0].titel`)}")`);
    check((await ev(`document.getElementById('hud').textContent`)).includes(`1/${nb}`), 'HUD telt de gevonden bonus');
    if (nb > 1) {
      // Touch: tikken op het cadeautje laat de held springen.
      await reset(await ev(`${L}.bonuses[1].x`)); await sleep(500);
      await ev(`${L}.bonuses[1].gift.emit('pointerdown')`); await sleep(900);
      check(await ev(`${L}.bonuses[1].opened`), 'tikken op het cadeautje werkt ook (touch)');
    }
  } else console.log('  (dit CV heeft geen bonussen)');

  // 5. Shortcuts: hoofdstukbalk (klik) en toets 1–7 → snelreis via de pipeline.
  console.log('\n— Snel naar een hoofdstuk');
  await reset(300); await sleep(400);
  await ev(`[...document.querySelectorAll('#chapters button')].find((b) => b.textContent.includes('Ervaring')).click()`);
  await sleep(2200);
  const ervX = await ev(`${L}.pieces.find((p) => p.station.type === 'werk').stopX`);
  const at = await ev(`${L}.player.x`);
  check(Math.abs(at - ervX) < 6 && !(await ev(`${L}.traveling`)), `klik op "Ervaring" → held staat bij de eerste opdracht (${Math.round(Math.abs(at - ervX))} px ernaast)`);
  await sleep(2600);
  check(await ev(`${L}.pieces.find((p) => p.station.type === 'werk').done`), 'release-testrun is gestart na aankomst');
  check(await ev(`document.querySelector('#chapters button.nu')?.textContent.includes('Ervaring')`), 'hoofdstukbalk markeert "Ervaring"');
  await key('keyDown', '1', 'Digit1', 49); await key('keyUp', '1', 'Digit1', 49); await sleep(2200);
  check(Math.abs((await ev(`${L}.player.x`)) - (await ev(`${L}.pieces[0].stopX`))) < 6, 'toets 1 → terug naar Profiel');

  // 6. Doorscrollen tijdens een animatie spoelt hem sneller af (in plaats van eraan voorbij te lopen).
  console.log('\n— Scroll ↔ animatie');
  await send('Page.navigate', { url: `http://localhost:${PORT}/?cv=${CV}&stijl=retro` }); await sleep(3000);
  await ev(`${L}.dismissTitle()`);
  const relIdx = await ev(`${L}.pieces.findIndex((p) => p.station.type === 'werk' && !p.done)`);
  if (relIdx >= 0) {
    const stop = await ev(`${L}.pieces[${relIdx}].stopX`);
    const dur = await ev(`${L}.pieces[${relIdx}].duration`);
    await reset(stop - 250); await sleep(300);
    const tStart = Date.now();
    let held = 0;
    for (let i = 0; i < 200; i++) {
      await wheel(); await sleep(60);
      if (await ev(`${L}.gate === ${L}.pieces[${relIdx}]`)) held++;
      if (await ev(`${L}.player.x > ${stop} + 20`)) break;
    }
    const ms = Date.now() - tStart;
    check(await ev(`${L}.pieces[${relIdx}].complete`), 'release-animatie helemaal afgespeeld voordat je verder mocht');
    check(held > 0 && ms < dur + 1500, `doorscrollen spoelt door: ${(ms / 1000).toFixed(1)} s voor een animatie van ${(dur / 1000).toFixed(1)} s`);
  }

  // 7. Stijlwisselaar: zelfde plek, andere skin.
  console.log('\n— Stijlwisselaar');
  await reset(await ev(`${L}.pieces.find((p) => p.station.type === 'skills').stopX`)); await sleep(800);
  const xBefore = await ev(`${L}.player.x`);
  await ev(`document.getElementById('btn-style').click()`); await sleep(1800);
  check((await ev(`__game.registry.get('theme')`)) === 'zakelijk', 'knop wisselt naar "Zakelijk"');
  check(await ev(`(${L}.ground.displayTexture ?? ${L}.ground.texture).key === 'z-ground'`), 'wereld gebruikt de zakelijke textures');
  check(Math.abs((await ev(`${L}.player.x`)) - xBefore) < 8, 'held blijft op dezelfde plek');
  check((await ev(`getComputedStyle(document.documentElement).getPropertyValue('--box').trim()`)) === '#1b1f3b', 'tekstbox en knoppen volgen de stijl');
  await ev(`document.getElementById('btn-style').click()`); await sleep(1800);
  check((await ev(`__game.registry.get('theme')`)) === 'retro', 'en weer terug naar "Retro"');

  // 8. Leesbaarheid: tekst in de wereld rendert op schermresolutie.
  console.log('\n— Scherpte');
  const res = await ev(`(() => { const s = ${L}; const t = []; const walk = (l) => l.forEach((o) => { if (o.type === 'Text') t.push(o.style.resolution); if (o.list) walk(o.list); }); walk(s.children.list); return { min: Math.min(...t), zoom: s.cameras.main.zoom, canvas: __game.canvas.width + 'x' + __game.canvas.height }; })()`);
  check(res.min >= Math.ceil(res.zoom), `tekstresolutie ${res.min}× bij zoom ${res.zoom.toFixed(2)} (canvas ${res.canvas} = schermgrootte)`);

  // 9. Finish: contact via TestCoders, typen zonder te lopen.
  console.log('\n— Contact');
  await reset(await ev(`${L}.finishX + 40`)); await sleep(1200);
  check(await ev(`!!document.querySelector('#panel #contact-form')`), 'contactformulier aan de finish');
  check(!(await ev(`document.getElementById('panel').textContent.includes('example.com')`)), 'geen persoonlijk e-mailadres zichtbaar');
  await ev(`document.querySelector('#contact-form [name=naam]').focus()`);
  const fx = await ev(`${L}.player.x`);
  for (const ch of 'wasd a') { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); }
  await sleep(500);
  check((await ev(`document.querySelector('#contact-form [name=naam]').value`)) === 'wasd a', 'typen in het formulier werkt (ook WASD en spatie)');
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
