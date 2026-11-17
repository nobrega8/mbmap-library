# Schaling en eenheden: wanneer de waarde een factor tien of duizend afwijkt

Het register wordt in de juiste volgorde gelezen en toch is de spanning 2301 in plaats van 230,1 of de stroom 4560 in plaats van 4,56 A. De meeste meters sturen gehele getallen en verwachten dat u een vaste schaal toepast.

## Vaste schaal

Handleidingen schrijven de schaal op verschillende manieren die hetzelfde betekenen:

| Handleiding zegt | Betekenis | Gelezen waarde 2301 |
|---|---|---|
| “resolution 0.1 V”, “× 0.1”, “unit 0.1 V” | vermenigvuldig met 0,1 | 230,1 V |
| “Value weight: Volt × 10”, “÷ 10” | deel door 10 | 230,1 V |
| “1 decimal”, “format XXX.X” | deel door 10 | 230,1 V |
| “mA”, “mV”, “Wh” als eenheid | het gehele getal is al in die eenheid | 2301 mV |

Let naast de factor ook op de eenheid: een energieteller in Wh en een in kWh × 0,01 verschillen een factor tien.

## Schaal bepaald door de configuratie

Sommige apparaten wijzigen de schaal met een instelling: het aantal decimalen op het display, de stroomtransformatorverhouding of het spanningsbereik. De handleiding geeft dan een tabel (“als register 40018 gelijk is aan 2, deel dan door 100”). Lees die instelling eerst.

<mb-scaling></mb-scaling>

## Schaalfactorregisters (SunSpec en andere)

SunSpec-omvormers en -meters sturen elke waarde met een apart *schaalfactorregister*, een tienmacht met teken. De waarde is `register × 10^schaalfactor`: een vermogen van 4523 met schaalfactor −1 is 452,3 W. De schaalfactor kan veranderen terwijl het apparaat draait, dus lees hem samen met de waarde, in hetzelfde verzoek.

## Floats

Waarden die als 32-bits float (IEEE 754) worden verzonden hebben geen schaal nodig; ze zijn al in technische eenheden. Als een float absurd lijkt, controleer dan de [woordvolgorde](byte-and-word-order) vóór de schaal.

## Hoe MBMap-kaarten dit vastleggen

Een register heeft een `scale` (de vermenigvuldiger), een optionele `offset`, een `unit` of een `scale_factor` die het register met de tienmacht noemt. De apparaatpagina's en de exports passen ze toe, zodat het getal dat u instelt het getal uit de handleiding is.
