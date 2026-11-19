# Speel mijn CV — TestCoders hackathon

Het TestCoders-CV als speelbare side scroller. Je loopt door iemands loopbaan: elk **bord** is een CV-sectie, elke **munt** een skill, en aan de **finish** staan de contactgegevens.

- 🎮 Live: <https://testcoders.github.io/interactief-cv/>
- 📖 MVP-beschrijving: <https://testcoders.github.io/hackathon/mvp/testcoders/interactief-cv>

## Snel starten

```bash
npm install
npm run dev        # http://localhost:5173
```

| Commando | Wat het doet |
|----------|--------------|
| `npm run dev` | Ontwikkelserver met hot reload |
| `npm run check` | Valideert alle CV-bestanden |
| `npm run build` | Check + productiebuild naar `dist/` |
| `npm run preview` | Productiebuild lokaal bekijken |

Besturing: ← → / A D lopen, spatie / ↑ / W springen. Knop **Klassiek CV** toont hetzelfde CV als gewone (printbare) pagina.

## Eigen Markdown-cv spelen en delen

Open de startpagina met `npm run dev`. Speel een voorbeeldpersoon of kies
**Create your own**. Kies een avatar en upload een UTF-8 Markdown-bestand van
maximaal 64 KB. De parser herkent een naam en rol in de kop, **Profiel**,
**Vaardigheden** of **Skills**, en **Ervaring** of **Werkervaring**. Gebruik
één kop per opdracht, met rol, opdrachtgever, periode en omschrijving.
**Expertise**, **Opleidingen** en **Interesses** zijn optioneel. Retro pixel-art
is speelbaar. De overige stijlrichtingen staan als toekomstig in de keuzelijst.

Bij **Start game** wordt je eigen cv naar de lokale Vite-server verstuurd en
komt de tijdelijke link beschikbaar onder **Deel je cv**. De avatar reist
mee in de link.
De server bewaart de ingelezen spelgegevens in het geheugen en verwijdert ze automatisch
na zeven dagen. Stoppen of herstarten van de server wist ook de links. De link
bevat een willekeurige code en werkt alleen als de ontvanger diezelfde draaiende
server kan bereiken. Op `localhost` werkt hij alleen op dezelfde computer.
De API werkt ook bij `npm run preview`. De statische GitHub Pages-site heeft
geen lokale opslagserver.

## Hoe het level werkt

- **Scrollen = lopen** (muiswiel, trackpad, ↓, swipe); ← → en spatie om zelf te spelen.
- Elk CV-onderdeel is een **set piece** met een eigen animatie (`src/pieces/`):
  - **Expertise** — schatkist die openklapt; expertises vliegen eruit als badges.
  - **Vaardigheden** — skillbord waarop per skill bloemetjes opgroeien tot het niveau (1–5 → 2–10 bloemen).
  - **Werkplezier** — collega's die gaan springen als je aankomt.
  - Overige onderdelen — bord + tekstbox (nog om te bouwen).
- Aan de finish: **contactformulier naar TestCoders** (opent een ingevulde mail aan info@testcoders.nl).

## Versie voor AI

De game is om indruk te maken; voor AI-agents (en wie snel wil scannen) wordt uit dezelfde JSON automatisch Markdown gegenereerd:

| URL | Inhoud |
|-----|--------|
| `/llms.txt` | Index van alle CV's volgens [llmstxt.org](https://llmstxt.org) |
| `/llms-full.txt` | Alle CV's in één bestand |
| `/cv/<id>.md` | Eén CV als Markdown, met YAML-frontmatter (naam, rol, skills, certificeringen) |

Werkt in `npm run dev` én in de build. Knop **AI / Markdown** in de topbar opent de Markdown van het CV dat je speelt.

## Je eigen CV toevoegen

1. Kopieer `src/data/cv/sam-voorbeeld.json` naar `src/data/cv/<voornaam-achternaam>.json`.
2. Vul je gegevens in (velden hieronder). `kleur` bepaalt de kleur van je poppetje.
3. `npm run check` — klaar. Je CV staat in het selectiescherm en is direct te delen via `?cv=<voornaam-achternaam>`.

| Veld | Verplicht | In de game |
|------|-----------|------------|
| `naam`, `rol`, `profiel` | ja | Eerste bord |
| `kleur` | nee | Kleur van je karakter (`"#rrggbb"`) |
| `opleiding[]` (`periode`, `titel`, `instituut`) | nee | Eén bord per opleiding |
| `werkervaring[]` (`periode`, `rol`, `opdrachtgever`, `omschrijving`, `tools[]`) | ja | Eén bord per opdracht — **nieuwste eerst** in de JSON, de game loopt van oud naar nieuw |
| `expertise[]` | nee | Badges uit de schatkist |
| `skills[]` (`naam`, `niveau` 1–5) | ja | Bloemetjes op het skillbord |
| `interesses[]` | nee | Bord "Interesses" |
| `werkplezier[]` | nee | Werkplezier-scène |
| `certificeringen[]` | nee | Bord |
| `contact` (`email`, …) | `email` ja | Alleen intern; in de game loopt contact via TestCoders |

> Tip: laat een AI-agent je bestaande TC-CV (Word/PDF) omzetten naar dit JSON-formaat — geef `sam-voorbeeld.json` mee als voorbeeld.
> Let op: de repo en GitHub Pages-site zijn publiek. Zet er geen telefoonnummers of andere gegevens in die je niet openbaar wilt hebben.

## Projectstructuur

```
index.html                     pagina + DOM-overlays (paneel, toast, klassieke weergave)
src/main.js                    start de game en koppelt de DOM-overlay
src/config/                    alle afstelbare waarden op één plek
  gameConfig.js                canvasformaat, zwaartekracht, scene-sleutels
  levelConfig.js               wereld, speler, game feel, scroll-lopen, camera
  pieceConfig.js               afmetingen van de set pieces
  company.js                   contactgegevens TestCoders
src/cv/
  cvLoader.js                  CV's laden uit src/data/cv
  stations.js                  CV → lijst checkpoints (stations) + stationtypes
src/scenes/
  BootScene.js                 maakt de textures en kiest de eerste scene
  CharacterSelectScene.js      karakterselectie
  LevelScene.js                het level: wereld, set pieces, finish
src/level/                     onderdelen van het level
  Player.js                    held: beweging, springen, squash & stof
  KeyboardControls.js          toetsenbord
  ScrollWalkInput.js           lopen door te scrollen/swipen
  TitleCard.js                 titelkaart bij de start
src/pieces/                    set pieces per CV-onderdeel (+ pieceRegistry.js)
src/graphics/                  textures met code: helden, wereld, pixel art
src/themes/retroTheme.js       kleuren, font en textures van de retrostijl
src/ui/                        DOM-overlay: paneel, templates, topbar, contactformulier
src/data/cv/*.json             één CV per persoon
scripts/validate-cv.mjs        validatie van de CV-bestanden
```

## Voorstel taakverdeling (3 personen)

| Wie | Sprint 1 (10.00–11.45) | Sprint 2 (13.30–15.45) |
|-----|------------------------|------------------------|
| **Persoon 1 — gameplay** | Level-design: variatie in platforms, hoogteverschillen, gaten | "Bugs" als vijanden, touch-besturing voor mobiel |
| **Persoon 2 — look & feel** | Sprites/pixel-art + TestCoders-huisstijl in `style.css` | Per werkervaring een eigen achtergrond, geluid met mute-knop |
| **Persoon 3 — content & deploy** | Alle drie de CV's omzetten naar JSON, GitHub-repo + Pages live | Klassieke weergave/PDF, Playwright-smoketest, demo voorbereiden |

## Publiceren

Push naar `main` → GitHub Actions bouwt en publiceert naar GitHub Pages (`.github/workflows/deploy.yml`).
Eenmalig: **Settings → Pages → Source: GitHub Actions**.
