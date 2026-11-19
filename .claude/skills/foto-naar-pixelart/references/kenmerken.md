# Kenmerken voor `uiterlijk`

Alle velden zijn optioneel. Ontbreekt een veld, dan valt het spel terug op de
standaard: kapsel wisselt per CV, huid `#f2c79b`, geen bril, geen baard.

## `kapsel`

De held kijkt naar rechts; "achter" is links.

| Waarde | Kies dit bij |
|---|---|
| `kort` | Kort haar, recht naar achteren of netjes geknipt |
| `opzij` | Kort haar met een lok of kuif aan de voorkant |
| `lang` | Haar tot over de oren of schouders, los |
| `staart` | Lang haar in een paardenstaart of knot |
| `krullen` | Volume, krullen of afro |
| `kaal` | Kaal of millimeter |
| `pet` | Draagt (bijna) altijd een pet; de pet krijgt de CV-kleur |

## `haarkleur`

Kies de tint die het dichtst bij het haar in **normaal licht** ligt; negeer
glanslicht en schaduw op de foto. Een baard krijgt dezelfde kleur.

| Kleur | Hex |
|---|---|
| Zwart | `#2f2219` |
| Donkerbruin | `#4a2e1c` |
| Bruin | `#6b3e26` |
| Lichtbruin | `#8c5a36` |
| Rood/koper | `#b5562c` |
| Donkerblond | `#a8824e` |
| Blond | `#e8b84a` |
| Grijs | `#9a9a9a` |
| Wit/zilver | `#d9d9d9` |

## `huid`

Lees de tint af van wang of voorhoofd, niet van een belicht of beschaduwd deel.
De schaduwtint maakt het spel zelf (12% donkerder).

| Tint | Hex |
|---|---|
| Zeer licht | `#f7d7b5` |
| Licht | `#f2c79b` |
| Licht-getint | `#e8b48c` |
| Getint | `#d29a6c` |
| Midden | `#b97a4e` |
| Donker | `#8d5a3b` |
| Zeer donker | `#5e3a26` |

## `bril`

`true` als iemand op de foto een (gewone) bril draagt. Het montuur wordt grijs
getekend, zodat het zichtbaar blijft op elke huid- en haarkleur.

## `baard`

| Waarde | Kies dit bij |
|---|---|
| `geen` | Gladgeschoren (of veld weglaten) |
| `stoppels` | Stoppelbaard of heel korte baard |
| `snor` | Alleen een snor |
| `sik` | Alleen een sik of kinbaardje |
| `vol` | Volle baard, met bakkebaarden |
