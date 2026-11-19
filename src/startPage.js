import { avatarOptions } from './graphics/avatarOptions.js';
import { drawAvatarPreview } from './graphics/heroSprites.js?avatar-flow';
import { loadCvs } from './cv/cvLoader.js';
import { MAX_MARKDOWN_BYTES, parseMarkdownCv } from './cv/markdownCv.js';
import retroPreview from '../design/retro-pixel-art/level.html?raw';
import businessPreview from '../design/strak-zakelijk/level.html?raw';
import lightLogo from './assets/testcoders/logo-light.svg';
import darkLogo from './assets/testcoders/logo-dark.svg';

const exampleAvatars = {
  'kim-mockdata': { person: 'woman', hair: 'long', color: 'brown', face: 'glasses' },
  'robin-testdata': { person: 'man', hair: 'short', color: 'red', face: 'beard' },
  'sam-voorbeeld': { person: 'man', hair: 'short', color: 'blond', face: 'freckles' }
};
const cvs = loadCvs().map((cv) => ({ ...cv, avatar: exampleAvatars[cv.id] }));
const get = (id) => document.getElementById(id);
const landing = get('landing');
const source = get('cv-source');
const picker = get('style-picker');
const error = get('launch-error');
const status = get('launch-status');
const creator = get('own-cv');
const uploadForm = get('upload-form');
const dialog = get('share-dialog');
const api = new URL('./api/cv-shares/', document.baseURI);
const styles = [
  { id: 'retro', name: 'Retro pixel-art', description: 'Pixelkunst en een groene spelwereld.', playable: true, preview: retroPreview },
  { id: 'business', name: 'Business isometric', description: 'Een isometrische zakenwijk met neonborden.', preview: businessPreview },
  { id: 'colorful', name: 'Kleurrijk en speels', description: 'Ronde vormen en levendige kleuren.' },
  { id: 'futuristic', name: 'Donker en futuristisch', description: 'Een donkere wereld met neonaccenten.' }
];

let selection;
let markdown;

const themeButton = get('landing-theme');
themeButton.addEventListener('click', () => {
  const dark = landing.dataset.theme !== 'dark';
  landing.dataset.theme = dark ? 'dark' : 'light';
  get('landing-logo').src = dark ? darkLogo : lightLogo;
  themeButton.setAttribute('aria-pressed', String(dark));
  themeButton.querySelector('[aria-hidden]').textContent = dark ? '☀' : '☾';
  themeButton.querySelector('.theme-label').textContent = dark ? 'light' : 'dark';
});

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

async function play(cv, style, expiresAt) {
  if (!styles.some((entry) => entry.id === style && entry.playable)) return;
  const { startGame } = await import('./main.js?avatar-flow');
  if (expiresAt && Date.now() >= expiresAt) throw new Error('Deze CV-link is verlopen.');
  get('game-view').hidden = false;
  landing.hidden = true;
  get('btn-switch').focus();
  startGame(cv);
  if (expiresAt) setTimeout(() => location.reload(), expiresAt - Date.now());
}

function selectCv(cv, text) {
  selection = cv;
  markdown = text;
  source.hidden = true;
  picker.hidden = false;
  get('chosen-cv').textContent = `${cv.naam} · ${cv.rol}`;
  creator.hidden = true;
  get('share-notice').hidden = !text;
  showError('');
  status.textContent = '';
  get('style-heading').focus();
}

for (const cv of cvs) {
  const button = document.createElement('button');
  button.type = 'button';
  const name = document.createElement('strong');
  name.textContent = cv.naam;
  const role = document.createElement('span');
  role.textContent = cv.rol;
  if (cv.avatar) {
    const preview = document.createElement('canvas');
    preview.className = 'example-avatar';
    preview.width = 16;
    preview.height = 18;
    preview.setAttribute('aria-hidden', 'true');
    drawAvatarPreview(preview, cv);
    const label = document.createElement('div');
    label.append(name, role);
    button.classList.add('with-avatar');
    button.append(preview, label);
  } else {
    button.append(name, role);
  }
  button.addEventListener('click', () => selectCv(cv));
  get('examples').append(button);
}

for (const style of styles) {
  const card = document.createElement('article');
  card.className = 'style-card';
  const preview = document.createElement('div');
  preview.className = `style-preview ${style.id}`;
  preview.setAttribute('aria-hidden', 'true');
  if (style.preview) {
    const frame = document.createElement('iframe');
    frame.title = `Ontwerp voor ${style.name}`;
    frame.tabIndex = -1;
    frame.loading = 'lazy';
    frame.setAttribute('sandbox', '');
    frame.srcdoc = style.preview.replace(/<link\b[^>]*>/gi, '');
    preview.append(frame);
  }
  const title = document.createElement('h3');
  title.textContent = style.name;
  const description = document.createElement('p');
  description.textContent = style.description;
  const action = document.createElement(style.playable ? 'button' : 'span');
  action.textContent = style.playable ? 'Start game' : 'Toekomstig';
  if (style.playable) {
    action.type = 'button';
    action.addEventListener('click', async () => {
      action.disabled = true;
      get('back-to-source').disabled = true;
      showError('');
      try {
        const cv = selection;
        const share = cv.uploaded ? await createShareLink(markdown, cv.avatar, style.id) : null;
        if (selection !== cv) return;
        await play(cv, style.id, share?.expiresAt);
        if (share) {
          get('share-url').value = share.url;
          get('share-expiry').textContent = `Geldig tot ${new Date(share.expiresAt).toLocaleString('nl-NL')} zolang de lokale server draait.`;
          get('btn-share').hidden = false;
        } else {
          const url = new URL(location.href);
          url.searchParams.set('cv', cv.id);
          url.searchParams.set('stijl', style.id);
          history.replaceState(null, '', url);
        }
      } catch (err) {
        showError(err.message || 'De game kon niet worden geladen. Probeer opnieuw.');
      } finally {
        action.disabled = false;
        get('back-to-source').disabled = false;
      }
    });
  }
  card.append(preview, title, description, action);
  get('game-styles').append(card);
}

function showSource() {
  selection = markdown = undefined;
  picker.hidden = true;
  creator.hidden = true;
  source.hidden = false;
  showError('');
  status.textContent = '';
  get('create-own').focus();
}

function showCreator() {
  selection = markdown = undefined;
  source.hidden = true;
  picker.hidden = true;
  creator.hidden = false;
  showError('');
  drawAvatarPreview(get('avatar-preview'), { avatar: avatarOptions(new FormData(uploadForm)) });
  get('avatar-heading').focus();
}

get('create-own').addEventListener('click', showCreator);
get('back-from-avatar').addEventListener('click', showSource);
uploadForm.addEventListener('change', () => {
  drawAvatarPreview(get('avatar-preview'), { avatar: avatarOptions(new FormData(uploadForm)) });
});

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showError('');
  const file = get('markdown-file').files[0];
  if (!file || !/\.m(?:d|arkdown)$/i.test(file.name) || file.size > MAX_MARKDOWN_BYTES) {
    return showError('Kies een .md- of .markdown-bestand van maximaal 64 KB.');
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    if (creator.hidden || get('markdown-file').files[0] !== file) return;
    const avatar = avatarOptions(new FormData(uploadForm));
    selectCv({ ...parseMarkdownCv(text), avatar }, text);
  } catch (err) {
    showError(err instanceof TypeError ? 'Gebruik een bestand met UTF-8-tekst.' : err.message);
  }
});

get('back-to-source').addEventListener('click', () => {
  if (selection?.uploaded) showCreator();
  else showSource();
});

async function createShareLink(text, avatar, style) {
  let response;
  let result;
  try {
    response = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: text });
    result = await response.json();
  } catch {
    throw new Error('De lokale server voor deelbare links is niet beschikbaar. Probeer opnieuw.');
  }
  if (!response.ok) throw new Error(result.error);
  const url = new URL(location.pathname, location.origin);
  url.hash = new URLSearchParams({ cv: result.id, stijl: style, ...avatar }).toString();
  return { url: url.href, expiresAt: result.expiresAt };
}

get('btn-share').addEventListener('click', () => {
  get('share-status').textContent = '';
  dialog.showModal();
  get('share-url').select();
});

get('copy-share').addEventListener('click', async () => {
  const link = get('share-url');
  try {
    await navigator.clipboard.writeText(link.value);
    get('share-status').textContent = 'Link gekopieerd.';
  } catch {
    link.focus();
    link.select();
    get('share-status').textContent = 'Kopieer de geselecteerde link.';
  }
});

async function openDirectLink() {
  const share = new URLSearchParams(location.hash.slice(1));
  const token = share.get('cv');
  const params = new URLSearchParams(location.search);
  try {
    if (token !== null) {
      if (!/^[a-f0-9]{32}$/.test(token)) throw new Error('Deze CV-link is ongeldig.');
      status.textContent = 'CV laden…';
      const response = await fetch(new URL(token, api), { cache: 'no-store' });
      if (!response.ok) throw new Error('Deze CV-link is verlopen of bestaat niet.');
      const { cv, expiresAt } = await response.json();
      if (share.has('person')) cv.avatar = avatarOptions(share);
      await play(cv, share.get('stijl') ?? 'retro', expiresAt);
    } else if (params.has('cv')) {
      const cv = cvs.find((entry) => entry.id === params.get('cv'));
      if (cv) await play(cv, params.get('stijl') ?? 'retro');
    }
  } catch (err) {
    showError(err.message);
  } finally {
    status.textContent = '';
  }
}

openDirectLink();
