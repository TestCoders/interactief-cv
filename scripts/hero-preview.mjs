// Rendert de pixel-art held van één of meer CV's als PNG, zodat je die naast de foto kunt leggen.
// Gebruik: node scripts/hero-preview.mjs [cv-id ...] [--out <map>]   (standaard: alle CV's, map out/heroes)
// Per CV: <id>.png (alle frames, 12× vergroot) en het idle-raster als tekst in de terminal.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';
import { HERO_H, HERO_W, heroFrames } from '../src/heroes.js';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outDir = outIdx >= 0 ? args.splice(outIdx, 2)[1] : 'out/heroes';
const SCALE = 12;
const BG = [232, 240, 236];

const dir = fileURLToPath(new URL('../src/data/cv/', import.meta.url));
const ids = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
const wanted = args.length ? args : ids;

function toRgb(color) {
  if (color.startsWith('#')) return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  return color.match(/\d+/g).map(Number);
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
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x++) raw.set(pixel(x, y), row + 1 + x * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
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
  const { frames, colors } = heroFrames(cv, index);
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
