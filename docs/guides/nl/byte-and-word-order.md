# Byte- en woordvolgorde: wanneer 32-bitswaarden verkeerd uitkomen

Een spanning leest als 1,7 × 10³⁸, een energieteller springt met 65.536 tegelijk of een temperatuur is een klein negatief getal. De registers zijn goed; de volgorde waarin de twee registers van een 32-bitswaarde worden samengesteld is dat niet.

## Eén register is eenvoudig, twee niet

Een Modbus-register is 16 bits en wordt verzonden met de meest significante byte eerst. De standaard zegt niets over waarden die langer zijn dan één register, dus elke fabrikant kiest zelf hoe een 32-bits geheel getal of float over twee registers wordt verdeeld (en een 64-bitswaarde over vier).

De vier volgordes worden meestal genoemd naar de bytes van de waarde, waarbij `A` de meest significante is:

| Naam | Register 1 | Register 2 | Ook genoemd |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, hoog woord eerst |
| `CDAB` | C D | A B | woordwissel, laag woord eerst, LSW first |
| `BADC` | B A | D C | bytewissel |
| `DCBA` | D C | B A | little-endian, beide verwisseld |

`ABCD` en `CDAB` dekken vrijwel elk apparaat. `CDAB` is gebruikelijk bij Schneider, Carlo Gavazzi en veel Chinese meters; `ABCD` bij Siemens, Janitza en de meeste SunSpec-apparaten.

<mb-byte-order></mb-byte-order>

## Hoe u de juiste vindt

1. **Lees het hoofdstuk over het dataformaat in de handleiding.** Zoek naar “word order”, “LSW first”, “MSW first”, “high word first” of “big endian”.
2. **Lees een waarde die u kent.** Lees een spanning die rond 230 V hoort te liggen als float in elke volgorde. Slechts één geeft een zinnig getal.
3. **Let op een teller.** Als het lage register van een energieteller overloopt naar wat uw hulpmiddel als het hoge deel toont, wissel dan de woorden.
4. **Controleer 64-bitswaarden apart.** Sommige apparaten slaan 32-bitswaarden op met het hoge woord eerst en 64-bitswaarden in een andere volgorde.

## Strings

Tekst bestaat meestal uit twee tekens per register, met het eerste teken in de hoge byte. Enkele apparaten zetten het eerste teken in de lage byte, waardoor “EM24” als “ME42” wordt gelezen.

## Hoe MBMap-kaarten dit vastleggen

Een kaart stelt `byte_order` en `word_order` in voor het hele apparaat, en elk register kan ze overschrijven. De apparaatpagina's tonen de volgorde van elke waarde met meerdere registers in de bovenstaande notatie (bijvoorbeeld `float32 CDAB`), en de Home Assistant-export zet dat om in de juiste `swap:`-optie.
