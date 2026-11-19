export const MAX_MARKDOWN_BYTES = 64 * 1024;

const levels = { beginner: 1, junior: 2, medior: 3, gevorderd: 3, senior: 5, expert: 5 };
const bullets = (text = '') => [...text.matchAll(/^\s*[-*+] +(.+)$/gm)].map((match) => match[1].trim());

function sections(text, depth) {
  const headings = [...text.matchAll(new RegExp(`^#{${depth}}[ \t]+(.+)$`, 'gm'))];
  return headings.map((heading, i) => ({
    title: heading[1].trim(),
    body: text.slice(heading.index + heading[0].length, headings[i + 1]?.index).trim()
  }));
}

function skillLevel(value) {
  const key = value.trim().toLowerCase();
  if (!key || key === '–' || key === '-') return undefined;
  if (/^[1-5]$/.test(key)) return Number(key);
  if (Object.hasOwn(levels, key)) return levels[key];
  throw new Error('Gebruik voor vaardigheidsniveaus 1–5 of Junior, Medior of Senior.');
}

export function parseMarkdownCv(markdown) {
  if (typeof markdown !== 'string' || new TextEncoder().encode(markdown).length > MAX_MARKDOWN_BYTES) {
    throw new Error('Kies een Markdown-bestand van maximaal 64 KB.');
  }
  const text = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  const body = frontmatter ? text.slice(frontmatter[0].length) : text;
  const header = (key) => {
    const value = frontmatter?.[1].match(new RegExp(`^(?:${key}):[ \t]*(.+)$`, 'mi'))?.[1].trim();
    if (value?.startsWith('"')) {
      try {
        const decoded = JSON.parse(value);
        if (typeof decoded === 'string') return decoded.trim();
      } catch {
        throw new Error('Controleer de aanhalingstekens in de CV-kop.');
      }
    }
    return value?.replace(/^'(.*)'$/, '$1');
  };
  const groups = sections(body, 2);
  const group = (...titles) => groups.find(({ title }) => titles.includes(title.toLowerCase()))?.body ?? '';
  const naam = header('naam') || body.match(/^# +(.+)$/m)?.[1].trim();
  const rol = header('rol|functie') || body.match(/^>\s*(.+)$/m)?.[1].trim();
  const profiel = group('profiel');
  if (!naam || !rol || !profiel) throw new Error('Vul een naam, rol en de sectie ‘Profiel’ in.');
  if (naam.length > 100 || rol.length > 120) throw new Error('Gebruik maximaal 100 tekens voor naam en 120 voor rol.');

  const skillText = group('vaardigheden', 'skills').replace(/^### +Talen\b[^\n]*\n[\s\S]*?(?=^### |(?![\s\S]))/gmi, '');
  const skills = [...skillText.matchAll(/^\|(.+)\|\s*$/gm)].flatMap(([, row]) => {
    const [name, level = ''] = row.split('|').map((part) => part.trim());
    if (!name || /^(?:skill|vaardigheid|competentie|taal)$/i.test(name) || /^:?-+:?$/.test(name)) return [];
    return [{ naam: name, niveau: skillLevel(level) }];
  });
  skills.push(...bullets(skillText).map((name) => ({ naam: name })));

  const work = sections(group('werkervaring', 'ervaring'), 3).map(({ title, body: job }) => {
    const combined = title.match(/^(.+?)\s+[—–]\s+(.+?)(?:\s+\(([^()]*)\))?$/);
    const comma = title.lastIndexOf(',');
    const rol = combined?.[1] ?? (comma < 0 ? title : title.slice(0, comma).trim());
    const opdrachtgever = combined?.[2] ?? (comma < 0 ? '' : title.slice(comma + 1).trim());
    const periode = combined?.[3] ?? job.match(/^(?:\*\*Periode:\*\*|Periode:)\s*([^\n]+)/mi)?.[1].trim();
    const tools = job.match(/^(?:\*\*Tools:\*\*|Tools:)\s*([^\n]+)/mi)?.[1].split(',').map((tool) => tool.trim()).filter(Boolean) ?? [];
    const omschrijving = job.replace(/^(?:\*\*Periode:\*\*|Periode:|\*\*Tools:\*\*|Tools:)[^\S\n]*[^\n]*$/gmi, '').trim();
    if (!rol || !opdrachtgever || !periode || !omschrijving) {
      throw new Error(`Vul voor ‘${title}’ de rol, opdrachtgever, periode en omschrijving in.`);
    }
    return { rol, opdrachtgever, periode, omschrijving, tools };
  });
  if (!work.length || !skills.length) throw new Error('Voeg minstens één vaardigheid en één werkervaring toe. Gebruik het Markdown-voorbeeld.');

  const education = group('opleiding', 'opleidingen');
  const diplomas = sections(education, 3).find(({ title }) => /^diploma/i.test(title));
  const opleiding = bullets(diplomas?.body ?? education.split(/^### /m)[0]).map((line) => {
    const match = line.match(/^(.+),\s*(.+?)\s*\(([^()]+)\)$/);
    return match ? { titel: match[1], instituut: match[2], periode: match[3] } : { titel: line };
  });
  const certificates = sections(education, 3).find(({ title }) => /certificeringen/i.test(title));
  return {
    id: 'eigen-cv', uploaded: true, naam, rol, profiel, skills, werkervaring: work, opleiding,
    expertise: bullets(group('expertise')),
    interesses: bullets(group('interesses', 'naast het werk').split(/^### /m)[0]),
    certificeringen: [...bullets(group('certificeringen')), ...bullets(certificates?.body)]
  };
}
