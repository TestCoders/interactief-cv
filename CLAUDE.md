# CLAUDE.md

Hackathonproject: het TestCoders-CV als side scroller (Phaser 3.90 + Vite, vanilla JS, geen TypeScript).

- UI-teksten en docs in het **Nederlands**; vakjargon mag Engels.
- Het level wordt volledig afgeleid uit `src/data/cv/*.json` (`buildStations` in `src/cv.js`). Nieuwe CV-velden: voeg ze toe aan de JSON, `scripts/validate-cv.mjs`, `stationHtml`/`classicHtml` in `src/ui.js` en de veldentabel in `README.md`.
- Tekst die gelezen moet worden staat in de DOM-overlay (`#panel`), niet in de canvas. Escape altijd met `esc()`.
- Textures worden gegenereerd in `BootScene`; echte sprites horen in `public/assets/` en worden geladen in een `preload()`.
- Gebruik alleen verzonnen data in voorbeelden (`@example.com`).
- Controleer na wijzigingen met `npm run build`.
