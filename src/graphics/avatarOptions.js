// Vaste keuzes voor de picker, sprites en de avatar in een deelbare link.
const OPTIONS = {
  person: ['man', 'woman'],
  hair: ['short', 'long'],
  color: ['brown', 'blond', 'black', 'red'],
  face: ['none', 'glasses', 'freckles', 'beard']
};

export function avatarOptions(values) {
  return Object.fromEntries(Object.entries(OPTIONS).map(([key, options]) => {
    const value = values.get(key);
    return [key, options.includes(value) ? value : options[0]];
  }));
}
