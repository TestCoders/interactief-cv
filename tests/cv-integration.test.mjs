import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCvs, cvToMarkdown } from '../scripts/cv-to-md.mjs';
import { normalizeCv, niveauScore, parsePeriode } from '../src/cv/normalizeCv.js';
import { buildStations, STATION_TYPES } from '../src/cv/stations.js';
import { stationHtml, classicHtml } from '../src/ui/stationTemplates.js';

test('bestaande en uitgebreide cv-data bereiken alle vier categorieën', () => {
  for (const raw of readCvs()) {
    const cv = normalizeCv(raw);
    const stations = buildStations(cv);
    for (const station of stations) assert.ok(Object.values(STATION_TYPES).includes(station.type));
    assert.ok(stations.some((s) => s.type === 'profile'));
    assert.ok(stations.some((s) => s.type === 'skills'));
    assert.ok(stations.some((s) => s.type === 'work'));
    if (cv.opleiding?.length) assert.ok(stations.some((s) => s.type === 'education'));
    assert.deepEqual(stations.at(-1).data.interesses, cv.interesses);
    for (const station of stations.filter((s) => ['profile', 'education', 'work'].includes(s.type))) {
      assert.match(stationHtml(station, cv), /<h2>/);
    }
    assert.doesNotMatch(classicHtml(cv), /\[object Object\]|undefined|NaN/);
    const md = cvToMarkdown(raw);
    for (const e of raw.expertise ?? []) assert.ok(md.includes(typeof e === 'string' ? e : e.naam));
    for (const interest of raw.interesses ?? []) assert.ok(md.includes(interest));
  }
});

test('niveaus, periodes en HTML blijven correct na de integratie', () => {
  assert.equal(niveauScore('Senior'), 5);
  assert.equal(niveauScore(3), 3);
  assert.equal(parsePeriode('januari 2020 – januari 2021').maanden, 12);
  const cv = normalizeCv({ naam: '<script>', rol: '<img>', profiel: '<iframe>', skills: [{ naam: '<b>', niveau: 'Senior' }], werkervaring: [] });
  const html = classicHtml(cv);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.doesNotMatch(html, /<script>|<iframe>|<img>|<b>Senior/);
  assert.equal((html.match(/class="on"/g) ?? []).length, 5);
});
