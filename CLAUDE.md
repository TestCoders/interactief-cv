# CLAUDE.md

Hackathonproject: het TestCoders-CV als side scroller (Phaser 3.90 + Vite, vanilla JS, geen TypeScript).

- UI-teksten en docs in het **Nederlands**; vakjargon mag Engels.
- Het level wordt volledig afgeleid uit `src/data/cv/*.json` (`buildStations` in `src/cv.js`). Nieuwe CV-velden: voeg ze toe aan de JSON, `scripts/validate-cv.mjs`, `stationHtml`/`classicHtml` in `src/ui.js`, `cvToMarkdown` in `scripts/cv-to-md.mjs` en de veldentabel in `README.md`.
- De AI-versie (`/llms.txt`, `/llms-full.txt`, `/cv/<id>.md`) wordt gegenereerd door de Vite-plugin in `vite.config.js` — nooit handmatig Markdown-CV's bijhouden.
- Tekst die gelezen moet worden staat in de DOM-overlay (`#panel`), niet in de canvas. Escape altijd met `esc()`.
- Textures worden gegenereerd in `BootScene`; echte sprites horen in `public/assets/` en worden geladen in een `preload()`.
- Gebruik alleen verzonnen data in voorbeelden (`@example.com`).
- Controleer na wijzigingen met `npm run build`.
