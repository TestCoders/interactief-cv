// Controleert alle CV-bestanden in src/data/cv op verplichte velden. Exit-code 1 bij fouten.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = new URL('../src/data/cv/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
const errors = [];

const isStr = (v) => typeof v === 'string' && v.trim() !== '';

for (const file of files) {
  const err = (msg) => errors.push(`${file}: ${msg}`);
  let cv;
  try {
    cv = JSON.parse(readFileSync(join(fileURLToPath(dir), file), 'utf8'));
  } catch (e) {
    err(`geen geldige JSON (${e.message})`);
    continue;
  }
  if (!/^[a-z0-9-]+$/.test(file.replace(/\.json$/, ''))) err('bestandsnaam alleen kleine letters, cijfers en streepjes (wordt de ?cv=-id)');
  for (const k of ['naam', 'rol', 'profiel']) if (!isStr(cv[k])) err(`"${k}" ontbreekt of is leeg`);
  if (cv.kleur && !/^#[0-9a-fA-F]{6}$/.test(cv.kleur)) err('"kleur" moet een hexkleur zijn, bijv. "#3c8772"');
  if (!Array.isArray(cv.werkervaring) || cv.werkervaring.length === 0) err('"werkervaring" moet minstens één item hebben');
  else cv.werkervaring.forEach((w, i) => ['periode', 'rol', 'opdrachtgever', 'omschrijving'].forEach((k) => isStr(w[k]) || err(`werkervaring[${i}].${k} ontbreekt`)));
  if (!Array.isArray(cv.skills) || cv.skills.length === 0) err('"skills" moet minstens één item hebben');
  else cv.skills.forEach((s, i) => {
    if (!isStr(s.naam)) err(`skills[${i}].naam ontbreekt`);
    if (s.niveau !== undefined && !(Number.isInteger(s.niveau) && s.niveau >= 1 && s.niveau <= 5) && !/^(beginner|junior|medior|gevorderd|senior|expert)$/i.test(s.niveau)) err(`skills[${i}].niveau moet 1 t/m 5 of Junior/Medior/Senior zijn`);
  });
  (cv.opleiding ?? []).forEach((o, i) => ['periode', 'titel', 'instituut'].forEach((k) => isStr(o[k]) || err(`opleiding[${i}].${k} ontbreekt`)));
  if (!cv.contact || !isStr(cv.contact.email)) err('"contact.email" ontbreekt');
}

if (files.length === 0) errors.push('geen CV-bestanden gevonden in src/data/cv/');
if (errors.length) {
  console.error(`✗ ${errors.length} fout(en):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`✓ ${files.length} CV('s) geldig: ${files.join(', ')}`);
