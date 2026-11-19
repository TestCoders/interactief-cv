// Zet CV-JSON om naar Markdown voor AI-agents (en mensen die snel willen lezen).
// Gebruikt door de Vite-plugin in vite.config.js: dev-server én build.
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CV_DIR = fileURLToPath(new URL('../src/data/cv/', import.meta.url));

export function readCvs() {
  return readdirSync(CV_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: f.replace(/\.json$/, ''), ...JSON.parse(readFileSync(CV_DIR + f, 'utf8')) }))
    .sort((a, b) => a.naam.localeCompare(b.naam));
}

const yamlStr = (s) => JSON.stringify(String(s));
const list = (items) => items.map((i) => `- ${i}`).join('\n');

export function cvToMarkdown(cv, siteUrl = '') {
  const skills = cv.skills ?? [];
  const lines = [
    '---',
    `naam: ${yamlStr(cv.naam)}`,
    `rol: ${yamlStr(cv.rol)}`,
    `bedrijf: "TestCoders"`,
    `skills: [${skills.map((s) => yamlStr(s.naam)).join(', ')}]`,
    ...(cv.certificeringen?.length ? [`certificeringen: [${cv.certificeringen.map(yamlStr).join(', ')}]`] : []),
    ...(cv.contact?.email ? [`email: ${yamlStr(cv.contact.email)}`] : []),
    ...(siteUrl ? [`interactieve_versie: ${yamlStr(`${siteUrl}?cv=${cv.id}`)}`] : []),
    '---',
    '',
    `# ${cv.naam}`,
    '',
    `> ${cv.rol} bij TestCoders.`,
    '',
    '## Profiel',
    '',
    cv.profiel,
    '',
    '## Werkervaring',
    ''
  ];

  for (const w of cv.werkervaring ?? []) {
    lines.push(`### ${w.rol} — ${w.opdrachtgever} (${w.periode})`, '', w.omschrijving, '');
    if (w.tools?.length) lines.push(`Tools: ${w.tools.join(', ')}`, '');
  }

  lines.push('## Skills', '', '| Skill | Niveau (1–5) |', '|-------|--------------|');
  for (const s of skills) lines.push(`| ${s.naam} | ${s.niveau ?? '–'} |`);
  lines.push('');

  if (cv.certificeringen?.length) lines.push('## Certificeringen', '', list(cv.certificeringen), '');
  if (cv.opleiding?.length) {
    lines.push('## Opleiding', '', list(cv.opleiding.map((o) => `${o.titel}, ${o.instituut} (${o.periode})`)), '');
  }
  if (cv.hobbys?.length) lines.push('## Naast het werk', '', list(cv.hobbys), '');

  const c = cv.contact ?? {};
  const contact = [c.email && `E-mail: ${c.email}`, c.telefoon && `Telefoon: ${c.telefoon}`, c.linkedin && `LinkedIn: ${c.linkedin}`].filter(Boolean);
  if (contact.length) lines.push('## Contact', '', list(contact), '');

  return lines.join('\n');
}

/** Index volgens https://llmstxt.org: H1, samenvatting, en links naar de Markdown-CV's. */
export function llmsTxt(cvs) {
  return [
    '# TestCoders — CV\'s',
    '',
    '> CV\'s van TestCoders-consultants (testautomatisering, performance, security en testadvies). Elk CV is hieronder als Markdown beschikbaar; de interactieve game-versie staat op dezelfde site.',
    '',
    '## CV\'s',
    '',
    ...cvs.map((cv) => `- [${cv.naam}](cv/${cv.id}.md): ${cv.rol}. Skills: ${(cv.skills ?? []).map((s) => s.naam).join(', ')}`),
    '',
    '## Optioneel',
    '',
    '- [Alle CV\'s in één bestand](llms-full.txt)',
    ''
  ].join('\n');
}

export function llmsFullTxt(cvs, siteUrl = '') {
  return cvs.map((cv) => cvToMarkdown(cv, siteUrl)).join('\n\n---\n\n');
}
