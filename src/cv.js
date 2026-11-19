// Laadt alle CV's uit src/data/cv/*.json. De bestandsnaam is de id (gebruikt in ?cv=<id>).
const modules = import.meta.glob('./data/cv/*.json', { eager: true, import: 'default' });

export function loadCvs() {
  return Object.entries(modules)
    .map(([path, data]) => normalizeCv({ id: path.split('/').pop().replace(/\.json$/, ''), ...data }))
    .sort((a, b) => a.naam.localeCompare(b.naam));
}

// ---------- Normaliseren: oude (niveau 1–5) én nieuwe data (Junior/Medior/Senior, categorieën) ----------

const NIVEAU_WOORDEN = { beginner: 1, junior: 2, medior: 3, gevorderd: 3, senior: 5, expert: 5 };

/** Niveau als getal 1–5, ongeacht of het CV "Senior" of 4 zegt. */
export function niveauScore(niveau) {
  if (typeof niveau === 'number') return Math.max(0, Math.min(5, niveau));
  return NIVEAU_WOORDEN[String(niveau ?? '').toLowerCase()] ?? 0;
}

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const NU = new Date();

/** "Augustus 2024 – heden" / "2019 – 2021" → { start, eind } als decimale jaren, plus duur in maanden. */
export function parsePeriode(periode = '') {
  const parts = String(periode).toLowerCase().split(/[–-]/).map((p) => p.trim());
  const toYear = (p, isEnd) => {
    if (!p || /heden|nu/.test(p)) return NU.getFullYear() + NU.getMonth() / 12;
    const jaar = Number((p.match(/\d{4}/) || [])[0]);
    const maand = MAANDEN.findIndex((m) => p.startsWith(m.slice(0, 3)) || p.includes(` ${m.slice(0, 3)}`));
    return jaar + (maand >= 0 ? maand / 12 : isEnd ? 11 / 12 : 0);
  };
  const start = toYear(parts[0], false);
  const eind = parts.length > 1 ? toYear(parts[1], true) : start + 1 / 12;
  return { start, eind, maanden: Math.max(1, Math.round((eind - start) * 12)), startJaar: Math.floor(start) };
}

export function normalizeCv(cv) {
  const skills = (cv.skills ?? []).map((s) => ({ ...s, score: niveauScore(s.niveau), categorie: s.categorie ?? 'Vaardigheden' }));
  const expertise = (cv.expertise ?? []).map((e) => (typeof e === 'string' ? { naam: e } : e)).map((e) => ({ ...e, score: niveauScore(e.niveau) }));
  const werk = (cv.werkervaring ?? []).map((w) => ({ ...w, ...parsePeriode(w.periode) }));
  // "In het testvak sinds": expliciet, anders vroegste opdracht.
  const sinds = cv.sinds ?? (werk.length ? Math.min(...werk.map((w) => w.startJaar)) : NU.getFullYear());
  // Top-skills zoals in de kop van het TC-cv: hoogste niveau, programmeertalen en tools eerst.
  const beste = (re, n) => skills.filter((s) => re.test(s.categorie)).sort((a, b) => b.score - a.score || (a.sinds ?? 0) - (b.sinds ?? 0)).slice(0, n);
  const top = [...beste(/programmeer/i, 3), ...beste(/tools/i, 2)];
  const topSkills = cv.topSkills ?? (top.length ? top : [...skills].sort((a, b) => b.score - a.score).slice(0, 5)).map((s) => s.naam);
  return {
    ...cv,
    skills, expertise, werkervaring: werk, sinds, topSkills,
    interesses: cv.interesses ?? cv.hobbys ?? [],
    jarenErvaring: Math.max(1, NU.getFullYear() - sinds)
  };
}

// ---------- Level-opbouw ----------

// Welke vaardigheden-categorieën een eigen bord krijgen (de rest staat in de klassieke weergave).
const SKILL_CATEGORIEEN = ['Vaardigheden', 'Programmeertalen & Frameworks', 'Tools', 'Testvormen', 'Methoden/Technieken'];
const MAX_SKILL_BORDEN = 3;
const MAX_SKILLS_PER_BORD = 6;

/**
 * Zet een CV om naar de volgorde van set pieces in het level.
 * Kopjes uit het MVP-template: expertise/vaardigheden, opleidingen, ervaring, interesses (+ werkplezier).
 */
export function buildStations(cv) {
  const stations = [{ type: 'profiel', data: cv }];
  if (cv.expertise.length) stations.push({ type: 'expertise', data: cv.expertise });

  const perCat = new Map();
  for (const s of cv.skills) perCat.set(s.categorie, [...(perCat.get(s.categorie) ?? []), s]);
  SKILL_CATEGORIEEN.filter((c) => perCat.has(c)).slice(0, MAX_SKILL_BORDEN).forEach((cat) => {
    const all = [...perCat.get(cat)].sort((a, b) => b.score - a.score || (a.sinds ?? 0) - (b.sinds ?? 0));
    stations.push({ type: 'skills', data: { titel: cat === 'Vaardigheden' ? 'Vaardigheden' : cat, skills: all.slice(0, MAX_SKILLS_PER_BORD), meer: all.length - MAX_SKILLS_PER_BORD } });
  });

  if (cv.opleiding?.length || cv.certificeringen?.length) {
    stations.push({ type: 'opleiding', data: { diplomas: cv.opleiding ?? [], certificaten: cv.certificeringen ?? [] } });
  }
  // Ervaring: van oud naar nieuw, zodat je door de tijd loopt.
  for (const w of [...cv.werkervaring].sort((a, b) => a.start - b.start)) stations.push({ type: 'werk', data: w });
  // Finale "na het werk": interesses + werkplezier rond het kampvuur.
  stations.push({ type: 'finale', data: { interesses: cv.interesses } });
  return stations;
}
