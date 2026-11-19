import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toggleFullscreen } from '../components/fullscreen.mjs';

test('opent het geselecteerde venster en sluit het bij nogmaals klikken', async () => {
  const doc = { fullscreenElement: null, async exitFullscreen() { this.fullscreenElement = null } };
  const window = { ownerDocument: doc, async requestFullscreen() { doc.fullscreenElement = this } };
  await toggleFullscreen(window);
  assert.equal(doc.fullscreenElement, window);
  await toggleFullscreen(window);
  assert.equal(doc.fullscreenElement, null);
});

test('kan een venster vergroten terwijl de presentatie al fullscreen is', async () => {
  const doc = { fullscreenElement: {} };
  const window = { ownerDocument: doc, async requestFullscreen() { doc.fullscreenElement = this } };
  await toggleFullscreen(window);
  assert.equal(doc.fullscreenElement, window);
});

test('geeft een geweigerd fullscreenverzoek door zodat de UI een melding kan tonen', async () => {
  const window = { ownerDocument: {}, async requestFullscreen() { throw new Error('Geweigerd') } };
  await assert.rejects(toggleFullscreen(window), /Geweigerd/);
});
