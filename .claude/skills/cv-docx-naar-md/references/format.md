# Doelformaat cv-Markdown

Dit is het vaste formaat dat het interactieve cv als invoer leest. Houd de
kopjes, hun volgorde en de schrijfwijze exact aan: de demo zoekt op deze
kopjes. Laat een kopje staan, ook als er niets onder valt, en zet er dan
`_Geen informatie in het bron-cv._` onder. Zo blijft de structuur voor elk cv gelijk.

````markdown
---
naam: <volledige naam>
functie: <functie uit personalia>
bron: <bestandsnaam van de docx>
---

# <volledige naam>

## Profiel

<alle profielalinea's, letterlijk, elk als eigen alinea>

**Kernwoorden:** <kernwoorden, letterlijk>

## Expertise

- <specialisatie> — <niveau>, sinds <jaar>
- Branchekennis: <branche> — <niveau>, sinds <jaar>

## Vaardigheden

### <categorie uit vakkennis, bv. Methoden/Technieken>

| Competentie | Niveau | Sinds |
|---|---|---|
| <naam> | <niveau> | <jaar> |

### <volgende categorie: Testvormen, Programmeertalen & Frameworks, Databases, Besturingssystemen, Tools, ...>

| Competentie | Niveau | Sinds |
|---|---|---|

### Talen

| Taal | Spreken | Schrijven |
|---|---|---|
| <taal> | <niveau> | <niveau> |

## Interesses

- <onderwerp waar de persoon enthousiast van wordt>

### Bezochte conferenties

- <conferentie>, <plaats> (<jaar>)

## Opleidingen

### Diploma's

- <opleiding>, <instelling/plaats> (<jaar>)

### Cursussen en certificeringen

- <cursus/certificaat>, <aanbieder> (<jaar>)

## Ervaring

### <functie>, <bedrijf>

**Periode:** <periode, zoals in de bron>

<omschrijving en projectalinea's, letterlijk>

**Werkzaamheden:**

- <werkzaamheid>

**Proces:** <...>

**Programmeertalen:** <...>

**Testvormen:** <...>

**Tools:** <inhoud van "Pakketten / Tools / DB">

## Overig

<informatie uit het bron-cv die onder geen enkel kopje past>
````

## Wat vast is en wat mag afwijken

- **Vast**: de frontmatter-velden, de `##`-kopjes en hun volgorde, de vaste `###`-kopjes
  (`Talen`, `Bezochte conferenties`, `Diploma's`, `Cursussen en certificeringen`) en de
  labels in Ervaring (`**Periode:**`, `**Werkzaamheden:**`, `**Proces:**`,
  `**Programmeertalen:**`, `**Testvormen:**`, `**Tools:**`).
- **Mag per cv verschillen**: de categorienamen onder `## Vaardigheden` (bv.
  `Methoden/Technieken` of `Methodieken/Technieken`, `Tools` of `Tools & Frameworks`).
  Neem de naam uit de bron over en hernoem niet naar een standaardlijst. De demo loopt
  door alle `###`-blokken onder Vaardigheden heen en zoekt niet op een vaste naam.

## Details per kopje

- **Frontmatter**: alleen `naam`, `functie` en `bron`. Ontbreekt de functie in de
  bron, laat de waarde dan leeg (`functie:`) in plaats van te gokken. Geboortedatum,
  woonplaats en andere persoonsgegevens neem je **niet** op (zie "Persoonsgegevens"
  in `SKILL.md`).
- **Ervaring**: één `###`-blok per opdracht, in dezelfde volgorde als in de
  bron (meestal nieuwste eerst). Labels zonder inhoud in de bron laat je weg
  binnen het blok (bijvoorbeeld geen `**Testvormen:**` als die er niet is).
- **Labelregels** (`**Proces:**` enz.) staan elk in een eigen alinea, met een lege
  regel ertussen; anders plakt Markdown ze aan elkaar tot één regel.
- **Expertise**: naam, dan ` — `, dan niveau en jaar. Ontbreekt het jaar, schrijf
  dan alleen het niveau (`- Performancetesten — Expert`).
- **Kernwoorden**: staan die niet in de bron, laat de regel `**Kernwoorden:**`
  dan helemaal weg. Dat is een veld, geen kopje; een leeg veld geeft alleen ruis.
- **Ontbrekende tabelwaarden**: laat de cel leeg (geen `-` of `?`). Geeft de bron
  één niveau per taal, zet dat onder Spreken en laat Schrijven leeg.
- **Tabellen**: één rij per competentie. Staan er in de bron twee
  competenties op één regel (bv. `CodeceptJS | Senior | 2018 / Playwright | Medior | 2021`),
  splits ze dan in twee rijen.
