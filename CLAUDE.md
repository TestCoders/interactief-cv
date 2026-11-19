# CLAUDE.md

Hackathonproject: het TestCoders-CV als side scroller (Phaser 3.90 + Vite, vanilla JS, geen TypeScript).

- UI-teksten en docs in het **Nederlands**; vakjargon mag Engels.
- Het level wordt volledig afgeleid uit `src/data/cv/*.json` (`buildStations` in `src/cv.js`). Nieuwe CV-velden: voeg ze toe aan de JSON, `scripts/validate-cv.mjs`, `stationHtml`/`classicHtml` in `src/ui.js`, `cvToMarkdown` in `scripts/cv-to-md.mjs` en de veldentabel in `README.md`.
- De AI-versie (`/llms.txt`, `/llms-full.txt`, `/cv/<id>.md`) wordt gegenereerd door de Vite-plugin in `vite.config.js` — nooit handmatig Markdown-CV's bijhouden.
- Elk CV-onderdeel is een **set piece** in `src/pieces/` (registratie in `pieces/index.js`): `constructor(scene, x, groundY, station, theme)`, `enter()` bij aankomst (animatie), `leave()`, `range`, en `usesPanel` als de inhoud in de tekstbox (`#panel`) moet. Onderdelen zonder eigen piece vallen terug op `SignPiece`.
- Set pieces gebruiken alleen kleuren/font/texture-sleutels uit het thema (`src/themes/retro.js`), zodat elke visuele stijl dezelfde gameplay heeft. Pixel art staat als tekstraster (`src/pixel.js`).
- Game-feel-instellingen (snelheid, sprong, coyote time, scroll, halteplaatsen) staan bovenaan `src/scenes/LevelScene.js`.
- Ontwerpregels: alleen scrollen moet genoeg zijn (scroll, swipe en pijltjes zijn één voortgangsmodel); springen is alleen voor optionele bonus-inhoud (`bonusFor` in `pieces/index.js`). Elke nieuwe mechanic heeft een reden die iets over de persoon vertelt.
- Data wordt genormaliseerd in `normalizeCv` (`src/cv.js`): niveau mag 1–5 of Junior/Medior/Senior zijn. Werkplezier komt uit `src/testcoders.js` (pijler van TestCoders, niet per persoon).
- Draai `npm run test:e2e` na gameplaywijzigingen.
- Contact loopt altijd via TestCoders (`src/testcoders.js`), nooit rechtstreeks naar de consultant.
- Tekst in de DOM-overlay altijd escapen met `esc()`.
- Geluid wordt live gesynthetiseerd (Web Audio, geen bestanden) in `src/audio/`: één pakket per game-stijl in `src/audio/packs/` (`sfx` + `music`, optioneel `ambience`), gekozen via `theme.audio`. Speel effecten af met `audio.play('<naam>')`; nieuwe effectnamen in álle pakketten toevoegen en in de tab "Geluid" van `design/<stijl>/index.html`.
- Textures worden gegenereerd in `BootScene`; echte sprites horen in `public/assets/` en worden geladen in een `preload()`.
- Gebruik alleen verzonnen data in voorbeelden (`@example.com`).
- Controleer na wijzigingen met `npm run build`.
