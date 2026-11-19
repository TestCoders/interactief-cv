# AGENTS.md

Deze instructies gelden voor de hele repository.

## Context inlezen

Lees vóór wijzigingen de relevante projectcontext:

- [interactief-cv-template.md](interactief-cv-template.md): de actuele doelen, doelgroepen, scope en succescriteria.
- [README.md](README.md): lokaal starten, cv-data, besturing en bestaande functionaliteit.
- [CLAUDE.md](CLAUDE.md): technische afspraken over de game, cv-velden, rendering en validatie.
- [Hackathon-samenvatting-en-agentcontext.md](docs/hackathon/Hackathon-samenvatting-en-agentcontext.md): achtergrond en oorspronkelijke afwegingen; dit is historische context, geen actuele takenlijst.
- De broncode, configuratie en controles die de taak raakt, inclusief aanroepende code en cv-data waar relevant.

Laat bij verschillen de huidige gebruikersopdracht en het actuele MVP-template leidend zijn boven de historische samenvatting. Behoud bestaande functionaliteit die al verder gaat dan de minimale demoscope.

## Doel

Bouw een werkende demo waarin een klant spelenderwijs één persoon leert kennen via een beknopt cv.

## Afgesproken scope

- Eén persoon en één cv.
- Vaste kopjes voor expertise en vaardigheden, interesses, opleidingen en beknopte ervaring.
- Vaste of hardcoded inhoud is toegestaan voor de eerste demo.
- Richt de bouw op het ingevulde template en rond eerst één complete demo af.
- Een lokaal werkende demo is voldoende; de architectuur moet latere integratie met de TestCoders-website ondersteunen.
- Een bestaand cv omzetten naar Markdown dat als invoer kan dienen is een succescriterium; automatisch inlezen is een uitbreiding voor later.

## Uitbreidingen voor later

- Verschillende gamestijlen.
- Meerdere personen en cv's met een keuzemogelijkheid.
- Markdown als invoer voor de inhoud van dezelfde game.
- Eventueel een uploadmogelijkheid voor Markdown.
- Dezelfde game hergebruiken voor verschillende cv’s.

Bouw deze uitbreidingen alleen na een expliciete uitbreiding van de scope.

## Werkwijze

- Lees het bestaande template en relevante projectbestanden voordat je wijzigingen maakt.
- Gebruik bestaande componenten en patronen en kies de kleinste complete oplossing.
- Houd vragen gericht op wat nodig is om het template en de demo af te maken.
- Verzin geen cv-feiten; markeer ontbrekende informatie en vraag gericht om aanvulling.
- Houd cv-informatie beknopt en maak de vaste onderdelen vindbaar in de spelervaring.
- Behoud toetsenbordbediening en leesbare tekst bij interactieve onderdelen.
- Controleer de volledige route door de demo en alle vier informatiecategorieën.
- Voer bij codewijzigingen `npm run build` uit en controleer de betrokken interacties waar mogelijk.
- Rapporteer wat werkt, wat is gecontroleerd en wat nog openstaat.

## Huidige technische basis

De bestaande game gebruikt Phaser en Vite met vanilla JavaScript. Cv-data staat in `src/data/cv/*.json`; de Markdown-export wordt daaruit gegenereerd. Bouw voort op deze implementatie en lees voor details de README en CLAUDE.md.
