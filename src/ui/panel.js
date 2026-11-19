// Tekstpaneel (#panel) en toast in de DOM-overlay: leesbaarder (en selecteerbaar) dan tekst in de canvas.
const panel = document.getElementById('panel');
const toastEl = document.getElementById('toast');

const PANEL_FADE_MS = 180;
const TOAST_MS = 1400;

// Panelen faden/schuiven in en uit i.p.v. aan/uit te knallen.
// key voorkomt dat hetzelfde paneel elke frame opnieuw wordt opgebouwd.
let shownKey = null;
let hideTimer;

export function showPanel(key, html) {
  if (shownKey === key) return;
  shownKey = key;
  clearTimeout(hideTimer);
  panel.innerHTML = html;
  panel.hidden = false;
  panel.classList.remove('in');
  requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('in')));
}

export function hidePanel() {
  if (shownKey === null) return;
  shownKey = null;
  panel.classList.remove('in');
  hideTimer = setTimeout(() => (panel.hidden = true), PANEL_FADE_MS);
}

let toastTimer;
export function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.hidden = true), TOAST_MS);
}
