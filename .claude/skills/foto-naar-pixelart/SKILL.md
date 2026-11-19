---
name: foto-naar-pixelart
description: Zet een foto van een (TestCoders-)professional om naar de pixel-art held waarmee die persoon door het Interactief CV loopt, door kapsel, haarkleur, huidskleur, bril en baard van de foto af te lezen en als `uiterlijk` in de CV-JSON te zetten. Gebruik deze skill altijd wanneer iemand een foto, profielfoto, pasfoto of portret wil gebruiken voor het spel, een poppetje/karakter/avatar/sprite/held wil laten lijken op een echt persoon, of vraagt om "pixel art van <naam>", ook als het woord "skill" of "uiterlijk" niet valt.
---

# Foto naar pixel-art held

Elke speler in het spel is een held van 16×18 pixels (`src/heroes.js`). Je maakt
**geen** verkleinde foto: op 16 pixels breed lijkt die nergens op en hij past niet
in de retrostijl. Je leest de **herkenbare kenmerken** van de foto af en zet ze om in
het veld `uiterlijk` in de CV-JSON. Het spel tekent de held daaruit, zodat hij dezelfde
animaties, omlijning en stijl houdt als de andere helden.

## Werkwijze

1. **Zoek de foto.** De standaardplek is `input/foto/<cv-id>.<jpg|png|webp>`. Die map
   staat in `.gitignore`, want foto's zijn persoonsgegevens en de repo is publiek. Zet
   een foto daarom nooit in `src/`, `public/` of een andere map die wordt gecommit.
   Zijn er geen foto's? Vraag de gebruiker ze in `input/foto/` te zetten. Download ze
   niet zelf van LinkedIn of andere sociale media: dat werkt niet zonder login en valt
   onder scraping van persoonsgegevens.

2. **Zoek het CV.** Het uiterlijk hoort in `src/data/cv/<cv-id>.json` (het `cv-id` is de
   bestandsnaam). Bestaat dat bestand nog niet, meld het dan en ga niet verder voor die
   persoon: een held zonder CV verschijnt niet in het spel. Maak niet zelf een CV aan
   met verzonnen gegevens.

3. **Bekijk de foto** met de Read-tool en bepaal per kenmerk de waarde uit
   `references/kenmerken.md`. Kies het kenmerk dat iemand **op een afstand**
   herkenbaar maakt. Twijfel je tussen twee kapsels, kies dan het kapsel met het
   meeste contrast met de andere helden in het spel. Kleuren kies je uit de paletten
   in de referentie; wijk daar alleen van af als niets past. Daardoor blijven de
   helden onderling in stijl.

4. **Schrijf het uiterlijk** in de CV-JSON, direct na `kleur`:

   ```json
   "uiterlijk": {
     "kapsel": "kort",
     "haarkleur": "#6b3e26",
     "huid": "#f2c79b",
     "bril": true,
     "baard": "stoppels"
   }
   ```

   Laat `kleur` (de kleding) staan. Die kies je niet uit de foto: dat is de CV-kleur.

5. **Controleer** met:

   ```bash
   npm run check
   npm run heroes -- <cv-id> [<cv-id> ...]
   ```

   `npm run heroes` schrijft per CV een PNG naar `out/heroes/<cv-id>.png` (alle frames,
   12× vergroot). Bekijk die met de Read-tool, naast de foto. Valt een kenmerk weg
   (een donkere bril op donker haar, een lichte baard op lichte huid), kies dan een
   kleur uit het palet met meer contrast. Herkenbaarheid gaat voor precisie.

6. **Sluit af** met `npm run build` en **rapporteer** per persoon: de gekozen waarden,
   het pad van de preview en eventuele twijfels (bijvoorbeeld "foto met zonnebril,
   bril weggelaten").

## Wat niet in het uiterlijk hoort

- Leeftijd, gewicht, geslacht of etniciteit. Je beschrijft alleen haar, huidtint, bril
  en baard, zoals ze in de pixel art te zien zijn. Schrijf geen beschrijvingen van de
  persoon in de JSON of in commits.
- Tijdelijke dingen op de foto: een zonnebril, een hoofddeksel bij een feest, een
  koptelefoon. Gebruik `pet` alleen als iemand op de foto echt een pet draagt en dat
  bij hem of haar hoort.

## Iets nieuws nodig?

Past geen enkel kapsel of baardtype, voeg dan een nieuw raster toe aan `KAPSELS` of
`BAARDEN` in `src/heroes.js` (10 rijen van 16 tekens; de ogen staan op kolom 8 en 10
van rij 5–6, zodat bril en baard blijven passen). De validatie leest de toegestane
waarden uit die objecten, dus `scripts/validate-cv.mjs` hoeft niet mee te veranderen.
Werk wel de tabel in `references/kenmerken.md` bij.
