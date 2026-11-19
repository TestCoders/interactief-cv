# Interactief CV — Slidev

Een Nederlandstalige presentatie met zeven slides, een direct speelbare Phaser-demo en alle designs uit `design/retro-pixel-art` in een bladerbaar venster.

## Starten

Vanuit de repositoryroot:

```sh
cd .claude/presentatie
npm install
npm run dev
```

Open http://localhost:3030. Eén server levert de slides, game, gegenereerde Markdown en designs. De game en designs worden bij het starten opnieuw vanuit de repository klaargezet; er is geen aparte gameserver nodig. Installeer ook de dependencies in de repositoryroot als dat nog niet is gedaan.

- **Volledig scherm:** klik op het **groene bolletje** in de titelbalk van de game of designs om fullscreen te openen of te sluiten. De knop **⛶ Volledig scherm** werkt ook. De knop **✕ Terug naar slide** blijft bovenin zichtbaar. **Escape** sluit fullscreen ook; de demo en het gekozen design blijven behouden.
- **Slide 5:** klik op **Spelen** of in de game. Pijltjes/A/D lopen, spatie springen en scrollen om te lopen. **Esc** geeft de focus terug aan de presentatie. De knoppen **Terug** en **Verder** blijven buiten de game zichtbaar. **Opnieuw** herlaadt de demo.
- **Slide 6:** kies selectiescherm, level, stijlgids of volledig overzicht. Scroll in het venster voor meer inhoud.
- Pijltjestoetsen navigeren slides wanneer de game geen focus heeft. Gebruik de Slidev-toolbar voor fullscreen en presentatormodus.
- Demo-inhoud is fictief. Andere spelvormen worden alleen als vervolgstap voorgesteld.

## Controleren en productiebuild

```sh
npm run build
npm test
npm run preview
```

Met een draaiende server controleert `npm run test:live` ook de HTTP-routes van de game, assets en designs.

De ontwikkelserver gebruikt polling voor bestandswijzigingen om de lokale limiet op file watchers te vermijden.

De productiebuild staat in `dist/`, inclusief game en designs. Serveer deze map via HTTP; open de HTML niet als `file://`. De presentatie gebruikt paden vanaf de domeinroot. Voor hosting onder een subpad moeten die paden eerst worden aangepast.

De bestaande designs gebruiken Google Fonts. Zonder internet blijven ze bruikbaar met de ingestelde fallback-lettertypen. De presentatie en game gebruiken systeemlettertypen en draaien na installatie lokaal.

Stijlbronnen: https://testcoders.nl/ (terminalvensters, donkere tinten, monospace-accenten) en de retrodesigns uit deze repository (groen, geel, pixels en scènes).

De aanwezige agent-skill is `cv-docx-naar-md`. De presentatie onderscheidt deze van de gebruikte technieken en van nog niet gebouwde uitbreidingen.
