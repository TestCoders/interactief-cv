---
name: cv-docx-naar-md
description: Zet een cv in Word-formaat (.docx) om naar een Markdown-bestand met het vaste formaat dat het Interactief CV als invoer gebruikt (Personalia, Expertise, Vaardigheden, Interesses, Opleidingen, Ervaring, Overig). Gebruik deze skill altijd wanneer iemand een cv, curriculum vitae, profiel of Word-bestand van een (TestCoders-)professional wil omzetten, inlezen, converteren of klaarmaken voor het interactieve cv, ook als het woord "Markdown" niet valt, bijvoorbeeld "maak hier een md van", "verwerk dit cv in input/cv" of "zet Robins cv om".
---

# CV (.docx) naar Markdown

Het interactieve cv leest een Markdown-bestand met vaste kopjes. De Word-cv's
van TestCoders hebben een redelijk vast formaat, maar de informatie staat
verspreid over tabellen, tab-uitgelijnde regels en losse alinea's. Het werk zit
in het **juist groeperen**: elk stukje informatie onder het goede kopje, zonder
iets te verliezen of te verzinnen.

## Werkwijze

1. **Extraheer de docx** met het meegeleverde script (alleen Python-standaardbibliotheek):

   ```bash
   python3 <skill-dir>/scripts/extract_docx.py <pad/naar/cv.docx> > <scratchpad>/extract.txt
   ```

   Elke regel is een alinea (`P <stijl> :: tekst`) of een tabelrij
   (`T1 R2: cel || cel`). Tabs in de bron worden ` | ` getoond: dat zijn
   kolomgrenzen (label | waarde, of naam | niveau | jaar). Lees de hele
   extractie voordat je gaat schrijven, zodat je de secties herkent.

2. **Lees het doelformaat** in `references/format.md` en houd het exact aan.

3. **Groepeer** de informatie volgens de indeling hieronder en schrijf het
   Markdown-bestand. Standaardlocatie: `out/cv/<docx-bestandsnaam>.md`
   (bijvoorbeeld `out/cv/CV_geanonimiseerd_fictief.md`), tenzij de gebruiker
   een andere plek noemt.

4. **Maak het pixel-art poppetje** (zie "Pixel-art poppetje" hieronder): zoek de
   foto op LinkedIn, zet `uiterlijk` in de frontmatter en genereer de PNG.

5. **Controleer de volledigheid**:

   ```bash
   python3 <skill-dir>/scripts/check_coverage.py <scratchpad>/extract.txt <output.md>
   ```

   Het script toont bronregels met woorden die niet in de Markdown staan. Het meldt
   ook als een persoonsgegeven uit de personalia (bijvoorbeeld de woonplaats) nog
   ergens in de Markdown staat, ook in lopende tekst; haal dat dan weg. Werk
   die bij of kijk bewust of ze weg mogen (zie "Wat je weglaat"). Draai het opnieuw
   tot alleen bewuste weglatingen overblijven. Zijn dat alleen kop- en veldnamen
   uit de bron (bv. "Opdrachtgever", "Over mij"), dan is dat ruis; noem ze in je
   rapport en voeg ze toe aan `LABELS` in het script als ze vaker voorkomen.

6. **Rapporteer** kort aan de gebruiker: waar het bestand staat, wat onder
   `## Overig` terechtkwam, wat je bewust hebt weggelaten, welk LinkedIn-profiel je
   voor het poppetje gebruikte (of waarom er geen foto was) en eventuele twijfelgevallen.

## Van bronsectie naar kopje

| In de docx | Kopje in de Markdown |
|---|---|
| Personalia: Naam, Functie | frontmatter |
| Overige personalia: geboortedatum, geboorteplaats, woonplaats, adres, telefoon, e-mail, nationaliteit, burgerlijke staat, rijbewijs | **weglaten** (zie "Persoonsgegevens") |
| Profiel of introductie (de lopende alinea's na de personalia, ook onder de kop "Beknopte samenvatting") | **weglaten**; alleen interesses eruit halen (zie hieronder) |
| Samenvattingstabel "Recente werkervaring" | **weglaten** (zie "Wat je weglaat") |
| Kernwoorden | **weglaten** |
| Vakkennis-items op het **hoogste niveau** (Senior, of Expert in een schaal als Basis/Gevorderd/Expert) die een methode, techniek of testvorm zijn | `## Expertise` |
| Vakkennis > Branchekennis (alle niveaus) | `## Expertise`, als `Branchekennis: ...` |
| Vakkennis-categorieën (Methoden/Technieken, Testvormen, Branchekennis, Programmeertalen & Frameworks, Databases, Besturingssystemen, Tools, ...) | `## Vaardigheden`, één `###` per categorie, in de bronvolgorde en met de categorienaam uit de bron (die mag per cv verschillen; zie `references/format.md`) |
| Eigen presentaties, talks, blogs, publicaties | `## Overig` > `### Publicaties en presentaties` |
| Taalvaardigheid | `## Vaardigheden` > `### Talen` |
| Passies, hobby's en vrije-tijdsbesteding uit het profiel | `## Interesses` (als korte opsomming) |
| Bezochte conferenties | `## Interesses` > `### Bezochte conferenties` |
| Behaalde diploma's | `## Opleidingen` > `### Diploma's` |
| Vakopleidingen en certificering | `## Opleidingen` > `### Cursussen en certificeringen` |
| Werkervaring (blokken met Periode/Bedrijf/Functie/...) | `## Ervaring`, één `###` per opdracht |
| Alles wat nergens anders past | `## Overig` |

Waarom deze keuzes:

- **Expertise en Vaardigheden overlappen bewust.** Expertise laat zien waar
  iemand in uitblinkt (de kaart die een klant als eerste ziet); Vaardigheden is
  het volledige overzicht. Een Senior-item mag dus op beide plekken staan.
  Branchekennis hoort bij Expertise, omdat klanten juist daarop selecteren.
- **Het profiel gaat er niet in, de interesses wel.** Het profiel (introductieverhaal)
  en de kernwoorden komen niet in de Markdown: het is een verhaal over de persoon, vaak
  met privéleven erin, en het interactieve cv vertelt dat verhaal zelf. Haal wel de
  onderwerpen waar de persoon enthousiast van wordt als korte opsommingspunten naar
  Interesses: een zelfstandig
  naamwoord of korte zinsnede met een hoofdletter, in de woorden van de bron
  ("Passie voor testautomatisering", "Meetups", "Klimmen op de klimmuur"). Dit is de
  enige plek waar je inkort; je verzint geen nieuwe interesses en neemt geen
  privézaken over (gezin, woning).
- **Expertise is een selectie, geen herindeling.** Neem het hoogste niveau van de
  schaal die het cv gebruikt. Heeft het cv geen categorieën (één platte tabel),
  kies dan de items die een methode, techniek, testvorm of branche zijn en laat
  losse tools en programmeertalen weg: die staan al onder Vaardigheden.
- **Geen categorieën in de bron?** Maak dan één `###` met de kopnaam uit de bron
  (bv. `### Kennis en kunde`) in plaats van zelf categorieën te verzinnen.
- **Conferenties zijn interesse, geen opleiding.** Voor het interactieve cv
  laten ze werkplezier en enthousiasme zien, een van de pijlers van het project.

## Opdrachtblokken in Werkervaring herkennen

Een nieuwe opdracht begint bij een regel `Periode | ...`. Alles tot de volgende
`Periode`-regel hoort bij die opdracht:

- `Bedrijf | X` en `Functie | Y` vormen de kop: `### Y, X`.
- `Omschrijving | ...` en de losse alinea's zonder label daarna zijn de omschrijving.
- `Werkzaamheden | ...` en de regels die met `-` beginnen zijn de werkzaamheden.
  De bron is hier rommelig: één regel kan meerdere punten bevatten
  (`- | Teststrategie bepalen / | - | Overleggen met de stakeholders`) en sommige
  punten staan zonder streepje als losse alinea (stijl `Standaard1`) direct
  eronder. Maak er één schone opsomming van met één punt per werkzaamheid.
- `Proces`, `Programmeertalen`, `Testvormen` (ook geschreven als `Testsoorten`) en
  `Pakketten / Tools / DB` (ook `Pakketten/Tools/DB`) worden de vetgedrukte labelregels.
  Gebruik altijd de labelnamen uit het formaat (`**Testvormen:**`, `**Tools:**`), ook als
  de bron een variant gebruikt: de demo zoekt op deze labels.
- In andere indelingen heten de velden anders: `Opdrachtgever`/`Klant` → bedrijf,
  `Rol` → functie, `Beschrijving` → omschrijving, `Taken` → werkzaamheden. Een
  gemengd veld als `Technieken` neem je letterlijk over als `**Tools:**`, zonder het
  zelf in programmeertalen en tools te splitsen.

## Letterlijk overnemen

Neem tekst **letterlijk** over: niet herschrijven, niet samenvatten, geen typfouten
verbeteren (`Cucumberr`, `Reids` blijven staan) en geen dubbele items
weghalen binnen een opsomming. De Markdown is een bron die later automatisch wordt
ingelezen; als de conversie inhoud verandert, weet niemand meer wat er in het
oorspronkelijke cv stond. Toegestaan zijn alleen: witruimte en opsommingstekens
opschonen, gesplitste regels samenvoegen of samengevoegde regels splitsen,
HTML-entiteiten (`&amp;`) terugzetten naar tekens en persoonsgegevens uit lopende tekst
halen (zie "Persoonsgegevens").

Zie je iets dat waarschijnlijk een fout is (een tikfout, een periode die niet klopt,
een opdracht die "heden" loopt naast een andere "heden"), meld het dan in je rapport
aan de gebruiker in plaats van het stilletjes aan te passen.

## Persoonsgegevens

De Markdown wordt gecommit in een publieke repo en gepubliceerd als AI-versie van
het cv. Neem daarom **geen persoonsgegevens** over die niets zeggen over iemands
vakmanschap: geboortedatum, leeftijd, geboorteplaats, woonplaats, adres, postcode,
telefoonnummer, privé-e-mailadres, nationaliteit, burgerlijke staat en rijbewijs.
Dat geldt ook als ze onder een andere kop staan ("Persoonlijke gegevens", "Over mij")
of in een tabel. Ze komen ook niet onder `## Overig`: dit is de enige uitzondering op
"verloren informatie is erger dan een rommelig Overig". Contact loopt altijd via
TestCoders.

Staat een **woon- of geboorteplaats** in een lopende tekst die wel in de Markdown komt,
zoals een opdrachtomschrijving? Haal dan de plaatsnaam uit de zin en verander verder zo weinig mogelijk.
Dit is een uitzondering op "letterlijk overnemen":

- Vervang de plaatsnaam door een neutrale omschrijving die in de zin past, of laat het
  voorzetsel met de plaatsnaam weg als de zin dan nog klopt.
  "woont samen met zijn vriendin en zoon in Harderwijk waar hij veel heeft geklust"
  → "woont samen met zijn vriendin en zoon in hun huis waar hij veel heeft geklust".
  "Geboren en getogen in Zwolle, ..." → "Geboren en getogen in Overijssel, ..." is
  **niet** goed (de provincie verraadt nog steeds waar iemand woont); gebruik
  "Geboren en getogen in Nederland" of laat de bijzin weg.
- Laat de rest van de zin en de alinea staan, ook gezinsleden en hobby's; die zeggen
  iets over de persoon en het werkplezier.
- Plaatsen die **niet** zeggen waar iemand woont of geboren is, blijven staan: de
  vestiging van een opdrachtgever, een opleidingsinstituut, een conferentie.
- Meld elke aangepaste zin in je rapport, met de oorspronkelijke en de nieuwe versie.

Andere persoonsgegevens in lopende tekst (een leeftijd, een geboortejaar) behandel je
op dezelfde manier: haal het gegeven eruit, laat de zin verder heel en meld het.

## Wat je weglaat

- Persoonsgegevens (zie hierboven).
- Kop- en voettekst (onder `# HEADER/FOOTER` in de extractie): daarin staan
  de bedrijfsgegevens van TestCoders en paginanummers, niet die van de persoon.
- De titel "CURRICULUM VITAE", lege regels en losse `/`-regels (resten van
  regeleinden).
- Kolomkoppen zoals `Competentie | Kennisniveau | Ervaring sinds` en
  `Taalvaardigheid | Spreken | Schrijven`: die worden de tabelkoppen.
- De samenvattingstabel "Recente werkervaring" (Functie | Gebruikte
  methodieken/technologieën | Periode). Die vat de opdrachtblokken samen en hoort
  **nooit** in de Markdown, ook niet onder `## Overig`: de opdrachtblokken onder
  Ervaring zijn de bron. Bevat de tabel iets wat niet in de opdrachtblokken staat (een
  andere titel, een technologie zoals Python, afwijkende perioden), meld dat dan in je
  rapport, zodat de gebruiker kan beslissen of het docx-cv moet worden aangepast.
  `check_coverage.py` slaat deze tabel over.
- Het profiel: de kop "Profiel" of "Beknopte samenvatting", de alinea's eronder en
  de kernwoorden. Alleen de interesses haal je eruit (zie "Van bronsectie naar kopje").
  `check_coverage.py` slaat het profiel over.

Twijfel je of iets ergens past, zet het dan onder `## Overig`. Verloren
informatie is erger dan een rommelig kopje Overig.

## Pixel-art poppetje

Elk cv krijgt een pixel-art poppetje: dezelfde held als in het spel (`src/graphics/pixelHero.js`),
met het uiterlijk van de persoon. Je maakt geen verkleinde foto, maar leest kenmerken af.

1. **Zoek de foto op LinkedIn** met de naam uit het cv. Gebruik de browser (Claude in
   Chrome of de ingebouwde browser; lees eerst de bijbehorende skill), want LinkedIn
   werkt alleen met de login van de gebruiker. Zoek op `<naam> TestCoders`.
   - Gebruik een profiel alleen als het **zeker** dezelfde persoon is: de naam klopt
     en TestCoders staat als werkgever, of de functie en opdrachtgevers komen overeen
     met het cv. Twijfel je (meerdere kandidaten, geen TestCoders), vraag het dan aan
     de gebruiker en gok niet.
   - Bekijk alleen de profielfoto (screenshot of de foto openen). Sla de foto niet op in
     de repo en neem verder niets van het profiel over in de Markdown.
   - Geen profiel of geen foto? Vraag de gebruiker een foto in `input/foto/` te zetten,
     of laat `uiterlijk` weg: dan krijgt het poppetje het standaarduiterlijk.
2. **Lees de kenmerken af** met de tabellen in
   `.claude/skills/foto-naar-pixelart/references/kenmerken.md` (kapsel, haarkleur, huid,
   bril, baard) en zet ze als `uiterlijk` in de frontmatter (zie `references/format.md`).
   Beschrijf alleen wat de pixel art toont, geen leeftijd, geslacht of etniciteit.
3. **Genereer de PNG** naast de Markdown:

   ```bash
   node scripts/hero-preview.mjs --md <output.md>
   ```

   Dat schrijft `<output>.png` (het poppetje, 8× vergroot, transparante achtergrond).
   Bekijk de PNG met de Read-tool naast de foto; valt een kenmerk weg, kies dan een kleur
   met meer contrast uit het palet.
4. **Zet de afbeelding** direct onder de `# <naam>`-kop (zie `references/format.md`).

## Andere cv-indelingen

Wijkt een cv af (andere kopnamen, alles in één grote tabel, Engelstalig), groepeer
dan op betekenis, niet op de letterlijke kopnaam: "Over mij" → weglaten (alleen interesses eruit halen),
"Persoonlijke gegevens" → naam en functie in de frontmatter (de rest weglaten), "Opdrachten" → Ervaring, "Kennis en kunde"
→ Vaardigheden, "Education" → Opleidingen, "Skills" → Vaardigheden,
"Projects"/"Employment" → Ervaring. Staat de functie niet bij de personalia,
gebruik dan de ondertitel onder de naam. Het doelformaat blijft
altijd hetzelfde Nederlandstalige formaat.
