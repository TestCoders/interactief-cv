# CLAUDE.md

Hackathonproject: het TestCoders-CV als side scroller (Phaser 3.90 + Vite, vanilla JS, geen TypeScript).

- UI-teksten en docs in het **Nederlands**; vakjargon mag Engels.
- Het level wordt volledig afgeleid uit `src/data/cv/*.json` (`buildStations` in `src/cv/stations.js`). Niveaus en periodes worden genormaliseerd in `src/cv/normalizeCv.js`. Nieuwe CV-velden: voeg ze toe aan de JSON, `scripts/validate-cv.mjs`, `stationHtml`/`classicHtml` in `src/ui/stationTemplates.js`, `cvToMarkdown` in `scripts/cv-to-md.mjs` en de veldentabel in `README.md`.
- De AI-versie (`/llms.txt`, `/llms-full.txt`, `/cv/<id>.md`) wordt gegenereerd door de Vite-plugin in `vite.config.js` — nooit handmatig Markdown-CV's bijhouden.
- Elk CV-onderdeel is een **set piece** in `src/pieces/` (registratie in `pieces/pieceRegistry.js`, op stationtype uit `STATION_TYPES`): `constructor(scene, x, groundY, station, theme)`, `enter()` bij aankomst (animatie), `leave()`, `stopX`, optioneel `triggerAt`, en `usesPanel` als de inhoud in de tekstbox (`#panel`) moet. Onderdelen zonder eigen piece vallen terug op `SignPiece`.
- Set pieces gebruiken alleen kleuren/font/texture-sleutels uit het thema (`src/themes/retroTheme.js`), zodat elke visuele stijl dezelfde gameplay heeft. Pixel art staat als tekstraster (`src/graphics/pixelTexture.js`).
- Alle afstelbare waarden (canvas, game feel, camera, scroll, afmetingen van set pieces) staan in `src/config/`; zet geen losse constanten bovenin scenes of pieces.
- Code (klassen, functies, variabelen, bestandsnamen) is Engels; klassen en hun bestand heten hetzelfde (`Player.js` → `class Player`). De velden in de CV-JSON blijven Nederlands.
- Contact loopt altijd via TestCoders (`src/config/company.js`), nooit rechtstreeks naar de consultant.
- Tekst in de DOM-overlay altijd escapen met `esc()`.
- Textures worden gegenereerd in `src/graphics/` (aangeroepen vanuit `BootScene`), met sleutels uit `TEXTURES`; echte sprites horen in `public/assets/` en worden geladen in een `preload()`.
- Gebruik alleen verzonnen data in voorbeelden (`@example.com`).
- Controleer na wijzigingen met `npm run build`.
