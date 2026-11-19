import { test } from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.PRESENTATION_URL ?? 'http://localhost:3030';
async function get(path) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
  return response.text();
}

test('slides, ingebedde game, game-assets en alle designs worden via dezelfde server geleverd', async () => {
  const slide = await get('/5');
  assert.match(slide, /Slidev/);
  const game = await get('/demo/index.html?cv=sam-voorbeeld');
  assert.match(game, /id="game"/);
  assert.doesNotMatch(game, /id="app"/);
  for (const [, asset] of game.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)) {
    const response = await fetch(new URL(asset, `${base}/demo/index.html`));
    assert.equal(response.status, 200, asset);
    assert.doesNotMatch(response.headers.get('content-type'), /text\/html/);
  }
  for (const page of ['index', 'selectiescherm', 'level', 'stijlgids']) {
    const design = await get(`/design/retro-pixel-art/${page}.html`);
    assert.match(design, /<!doctype html>/i);
    assert.doesNotMatch(design, /id="app"/);
  }
  assert.match(await get('/demo/cv/sam-voorbeeld.md'), /# Sam Voorbeeld/);
});
