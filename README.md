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

## Versie voor AI

De game is om indruk te maken; voor AI-agents (en wie snel wil scannen) wordt uit dezelfde JSON automatisch Markdown gegenereerd:

| URL | Inhoud |
|-----|--------|
| `/llms.txt` | Index van alle CV's volgens [llmstxt.org](https://llmstxt.org) |
| `/llms-full.txt` | Alle CV's in één bestand |
| `/cv/<id>.md` | Eén CV als Markdown, met YAML-frontmatter (naam, rol, skills, certificeringen) |

Werkt in `npm run dev` én in de build. Knop **AI / Markdown** in de topbar opent de Markdown van het CV dat je speelt.

## Hoe het level werkt

- **Scrollen = lopen** (muiswiel, trackpad, ↓, swipe); ← → en spatie om zelf te spelen.
- Elk CV-onderdeel is een **set piece** met een eigen animatie (`src/pieces/`):
  - **Expertise** — schatkist die openklapt; expertises vliegen eruit als badges.
  - **Vaardigheden** — skillbord waarop per skill bloemetjes opgroeien tot het niveau (1–5 → 2–10 bloemen).
  - **Werkplezier** — collega's die gaan springen als je aankomt.
  - Overige onderdelen — bord + tekstbox (nog om te bouwen).
- Aan de finish: **contactformulier naar TestCoders** (opent een ingevulde mail aan info@testcoders.nl).
