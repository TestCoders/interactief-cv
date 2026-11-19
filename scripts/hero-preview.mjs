// Rendert de pixel-art held van één of meer CV's als PNG, zodat je die naast de foto kunt leggen.
// Gebruik: node scripts/hero-preview.mjs [cv-id ...] [--out <map>]   (standaard: alle CV's, map out/heroes)
// Per CV: <id>.png (alle frames, 12× vergroot) en het idle-raster als tekst in de terminal.
//
//          node scripts/hero-preview.mjs --md <cv.md> [...]
// Leest `uiterlijk` uit de frontmatter van een cv-Markdown (skill cv-docx-naar-md) en schrijft
// het poppetje (idle-frame, 8× vergroot, transparante achtergrond) als <cv>.png naast de Markdown.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { HERO_H, HERO_W, pixelHeroFrames } from '../src/graphics/pixelHero.js';

const args = process.argv.slice(2);
const mdMode = args[0] === '--md' && args.shift();
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args.splice(outIdx, 2)[1] : 'out/heroes';
const SCALE = 12;
const BG = [232, 240, 236, 255];
const CLEAR = [0, 0, 0, 0];

const dir = fileURLToPath(new URL('../src/data/cv/', import.meta.url));
const ids = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
const wanted = args.length ? args : ids;

function toRgb(color) {
  const rgb = color.startsWith('#') ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)) : color.match(/\d+/g).map(Number);
  return [...rgb, 255];
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    for (let x = 0; x < width; x++) raw.set(pixel(x, y), row + 1 + x * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/** Leest het blok `uiterlijk:` uit YAML-frontmatter (alleen dit vaste, platte formaat). */
function uiterlijkUitMarkdown(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  const blok = fm.match(/^uiterlijk:\n((?:[ \t]+.*\n?)*)/m)?.[1] ?? '';
  const u = {};
  for (const [, k, v] of blok.matchAll(/^[ \t]+(\w+):[ \t]*(.*?)[ \t]*$/gm)) {
    const waarde = v.replace(/^["']|["']$/g, '');
    u[k] = waarde === 'true' ? true : waarde === 'false' ? false : waarde;
  }
  return { naam: fm.match(/^naam:[ \t]*(.*)$/m)?.[1] ?? '', uiterlijk: u };
}

if (mdMode) {
  if (!args.length) throw new Error('geef één of meer cv-Markdownbestanden op na --md');
  const S = 8;
  for (const md of args) {
    const { naam, uiterlijk } = uiterlijkUitMarkdown(readFileSync(md, 'utf8'));
    if (!Object.keys(uiterlijk).length) console.warn(`! ${md}: geen uiterlijk in de frontmatter, standaardheld gebruikt`);
    const { frames, colors } = pixelHeroFrames({ naam, uiterlijk }, 0);
    const rgb = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, toRgb(v)]));
    const rows = frames[0].rows;
    const file = join(dirname(md), basename(md, '.md') + '.png');
    writeFileSync(file, png(HERO_W * S, HERO_H * S, (x, y) => rgb[rows[Math.floor(y / S)][Math.floor(x / S)]] ?? CLEAR));
    console.log(`${naam || md} → ${file}\n  ${rows.join('\n  ')}\n`);
  }
  process.exit(process.exitCode ?? 0);
}

mkdirSync(outDir, { recursive: true });
for (const id of wanted) {
  const index = ids.indexOf(id);
  if (index < 0) {
    console.error(`✗ onbekend CV "${id}" (beschikbaar: ${ids.join(', ')})`);
    process.exitCode = 1;
    continue;
  }
  const cv = { id, ...JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8')) };
  const { frames, colors } = pixelHeroFrames(cv, index);
  const rgb = Object.fromEntries(Object.entries(colors).map(([k, v]) => [k, toRgb(v)]));
  const gap = 2;
  const cellW = HERO_W + gap;
  const width = (frames.length * cellW + gap) * SCALE;
  const height = (HERO_H + gap * 2) * SCALE;
  const file = join(outDir, `${id}.png`);
  writeFileSync(file, png(width, height, (x, y) => {
    const px = Math.floor(x / SCALE) - gap;
    const py = Math.floor(y / SCALE) - gap;
    const f = Math.floor(px / cellW);
    const fx = px - f * cellW;
    if (px < 0 || f >= frames.length || fx >= HERO_W || py < 0 || py >= HERO_H) return BG;
    return rgb[frames[f].rows[py][fx]] ?? BG;
  }));
  console.log(`${cv.naam} → ${file}\n  ${frames[0].rows.join('\n  ')}\n`);
}
