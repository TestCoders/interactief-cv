---
name: cv-docx-naar-md
description: Zet een cv in Word-formaat (.docx) om naar een Markdown-bestand met het vaste formaat dat het Interactief CV als invoer gebruikt (Personalia, Profiel, Expertise, Vaardigheden, Interesses, Opleidingen, Ervaring, Overig). Gebruik deze skill altijd wanneer iemand een cv, curriculum vitae, profiel of Word-bestand van een (TestCoders-)professional wil omzetten, inlezen, converteren of klaarmaken voor het interactieve cv, ook als het woord "Markdown" niet valt, bijvoorbeeld "maak hier een md van", "verwerk dit cv in input/cv" of "zet Robins cv om".
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

4. **Controleer de volledigheid**:

   ```bash
   python3 <skill-dir>/scripts/check_coverage.py <scratchpad>/extract.txt <output.md>
   ```

   Het script toont bronregels met woorden die niet in de Markdown staan. Werk
   die bij of kijk bewust of ze weg mogen (zie "Wat je weglaat"). Draai het opnieuw
   tot alleen bewuste weglatingen overblijven. Zijn dat alleen kop- en veldnamen
   uit de bron (bv. "Opdrachtgever", "Over mij"), dan is dat ruis; noem ze in je
   rapport en voeg ze toe aan `LABELS` in het script als ze vaker voorkomen.

5. **Rapporteer** kort aan de gebruiker: waar het bestand staat, wat onder
   `## Overig` terechtkwam, wat je bewust hebt weggelaten en eventuele twijfelgevallen.

## Van bronsectie naar kopje

| In de docx | Kopje in de Markdown |
|---|---|
| Personalia: Naam, Functie | frontmatter |
| Overige personalia: geboortedatum, geboorteplaats, woonplaats, adres, telefoon, e-mail, nationaliteit, burgerlijke staat, rijbewijs | **weglaten** (zie "Persoonsgegevens") |
| Profiel (de lopende alinea's na de personalia) | `## Profiel` |
| Kernwoorden | `## Profiel`, als `**Kernwoorden:**` |
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
- **Interesses worden afgeleid, het Profiel blijft heel.** Neem de profielalinea's
  volledig over onder Profiel, ook een alinea die meer op een projectomschrijving
  lijkt: de schrijver heeft hem daar gezet. Haal daarnaast de onderwerpen waar de persoon
  enthousiast van wordt als korte opsommingspunten naar Interesses: een zelfstandig
  naamwoord of korte zinsnede met een hoofdletter, in de woorden van de bron
  ("Passie voor testautomatisering", "Meetups", "Klimmen op de klimmuur"). Dit is de
  enige plek waar je inkort; je verzint geen nieuwe interesses.
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
opschonen, gesplitste regels samenvoegen of samengevoegde regels splitsen en
HTML-entiteiten (`&amp;`) terugzetten naar tekens.

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

Staat zo'n gegeven in een lopende tekst, bijvoorbeeld in het profiel ("woont met
zijn vriendin en zoon in Harderwijk")? Neem de alinea dan letterlijk over en meld het
in je rapport. Of zo'n zin weg mag, beslist de gebruiker, niet de conversie.

## Wat je weglaat

- Persoonsgegevens (zie hierboven).
- Kop- en voettekst (onder `# HEADER/FOOTER` in de extractie): daarin staan
  de bedrijfsgegevens van TestCoders en paginanummers, niet die van de persoon.
- De titel "CURRICULUM VITAE", lege regels en losse `/`-regels (resten van
  regeleinden).
- Kolomkoppen zoals `Competentie | Kennisniveau | Ervaring sinds` en
  `Taalvaardigheid | Spreken | Schrijven`: die worden de tabelkoppen.
- Een samenvattingstabel "Recente werkervaring", **alleen als** alles erin (titels,
  technologieën, perioden) ook in de opdrachtblokken onder Werkervaring staat: dan is
  die dubbel. Bevat de tabel iets wat daar niet staat (een andere titel, een technologie
  zoals Python, afwijkende perioden), zet de hele tabel dan als
  `### Recente werkervaring (samenvattingstabel uit het bron-cv)` onder `## Overig`,
  met de kolommen Functie | Gebruikte methodieken/technologieën | Periode. Zet hem niet
  onder Ervaring: de opdrachtblokken blijven de bron voor de demo, en de tabel spreekt
  ze soms tegen. Meld de afwijkingen in je rapport.

Twijfel je of iets ergens past, zet het dan onder `## Overig`. Verloren
informatie is erger dan een rommelig kopje Overig.

## Andere cv-indelingen

Wijkt een cv af (andere kopnamen, alles in één grote tabel, Engelstalig), groepeer
dan op betekenis, niet op de letterlijke kopnaam: "Over mij" → Profiel,
"Persoonlijke gegevens" → naam en functie in de frontmatter (de rest weglaten), "Opdrachten" → Ervaring, "Kennis en kunde"
→ Vaardigheden, "Education" → Opleidingen, "Skills" → Vaardigheden,
"Projects"/"Employment" → Ervaring. Staat de functie niet bij de personalia,
gebruik dan de ondertitel onder de naam. Het doelformaat blijft
altijd hetzelfde Nederlandstalige formaat.
