// Kleine HTML-bouwstenen voor de DOM-overlay. Tekst uit een CV altijd via esc().

export const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const list = (items = []) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

export const chips = (items = []) => `<ul class="chips">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

// Niveau 1–5 uit het CV; de naam verschijnt als tooltip.
const SKILL_LEVEL_LABELS = ['Beginner', 'Basis', 'Gevorderd', 'Ervaren', 'Expert'];
const MAX_SKILL_LEVEL = SKILL_LEVEL_LABELS.length;

export const skillMeters = (skills = []) =>
  `<ul class="meters">${skills
    .map((skill) => {
      const level = skill.score ?? (typeof skill.niveau === 'number' ? skill.niveau : 0);
      const blocks = Array.from({ length: MAX_SKILL_LEVEL }, (_, i) => `<i class="${i < level ? 'on' : ''}"></i>`).join('');
      return `<li><span>${esc(skill.naam)}</span><b title="${esc(typeof skill.niveau === 'string' ? skill.niveau : SKILL_LEVEL_LABELS[level - 1] ?? '')}">${blocks}</b></li>`;
    })
    .join('')}</ul>`;
