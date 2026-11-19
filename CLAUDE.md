# CLAUDE.md

Hackathonproject: het TestCoders-CV als side scroller (Phaser 3.90 + Vite, vanilla JS, geen TypeScript).

- UI-teksten en docs in het **Nederlands**; vakjargon mag Engels.
- Het level wordt volledig afgeleid uit `src/data/cv/*.json` (`buildStations` in `src/cv.js`). Nieuwe CV-velden: voeg ze toe aan de JSON, `scripts/validate-cv.mjs`, `stationHtml`/`classicHtml` in `src/ui.js`, `cvToMarkdown` in `scripts/cv-to-md.mjs` en de veldentabel in `README.md`.
- De AI-versie (`/llms.txt`, `/llms-full.txt`, `/cv/<id>.md`) wordt gegenereerd door de Vite-plugin in `vite.config.js` — nooit handmatig Markdown-CV's bijhouden.
- Tekst die gelezen moet worden staat in de DOM-overlay (`#panel`), niet in de canvas. Escape altijd met `esc()`.
- Elk CV-onderdeel is een **set piece** in `src/pieces/` (registratie in `pieces/index.js`): `constructor(scene, x, groundY, station, theme)`, `enter()` bij aankomst (animatie), `leave()`, `range`, en `usesPanel` als de inhoud in de tekstbox (`#panel`) moet. Onderdelen zonder eigen piece vallen terug op `SignPiece`.
- Set pieces gebruiken alleen kleuren/font/texture-sleutels uit het thema (`src/themes/retro.js`), zodat elke visuele stijl dezelfde gameplay heeft. Pixel art staat als tekstraster (`src/pixel.js`).
- Game-feel-instellingen (snelheid, sprong, coyote time, scroll) staan bovenaan `src/scenes/LevelScene.js`.
- Contact loopt altijd via TestCoders (`src/testcoders.js`), nooit rechtstreeks naar de consultant.
- Tekst in de DOM-overlay altijd escapen met `esc()`.
