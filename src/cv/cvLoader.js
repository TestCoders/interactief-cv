// Laadt alle CV's uit src/data/cv/*.json. De bestandsnaam is de id (gebruikt in ?cv=<id>).
const modules = import.meta.glob('../data/cv/*.json', { eager: true, import: 'default' });

export function loadCvs() {
  return Object.entries(modules)
    .map(([path, data]) => ({ id: path.split('/').pop().replace(/\.json$/, ''), ...data }))
    .sort((a, b) => a.naam.localeCompare(b.naam));
}
