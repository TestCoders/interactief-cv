import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

test('de presentatie bevat de game en alle designpagina’s als lokale bestanden', async () => {
  const root = resolve(import.meta.dirname, '..', 'public');
  const html = await readFile(resolve(root, 'demo/index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)];
  assert.ok(assets.length >= 2, 'de gebouwde game moet JavaScript en CSS bevatten');
  for (const [, asset] of assets) await access(resolve(root, 'demo', asset));
  for (const page of ['index', 'selectiescherm', 'level', 'stijlgids']) {
    const design = await readFile(resolve(root, `design/retro-pixel-art/${page}.html`), 'utf8');
    assert.match(design, /<!doctype html>/i);
  }
  const markdown = await readFile(resolve(root, 'demo/cv/sam-voorbeeld.md'), 'utf8');
  assert.match(markdown, /# Sam Voorbeeld/);
  assert.match(markdown, /## Skills/);
  const cv = JSON.parse(await readFile(resolve(import.meta.dirname, '../../../src/data/cv/sam-voorbeeld.json'), 'utf8'));
  for (const field of ['expertise', 'skills', 'interesses', 'opleiding', 'werkervaring']) {
    assert.ok(cv[field]?.length, `Game mist ${field}`);
  }
});
