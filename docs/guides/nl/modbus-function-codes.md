# Modbus-functiecodes en registergebieden

Elk Modbus-verzoek noemt een functiecode. Die bepaalt zowel de actie als het gebied van het apparaat waarop die werkt.

| Code | Naam | Gebied | Grootte |
|---|---|---|---|
| 01 | Read Coils | coils (0x) | bits, lezen/schrijven |
| 02 | Read Discrete Inputs | discrete ingangen (1x) | bits, alleen lezen |
| 03 | Read Holding Registers | houdregisters (4x) | 16-bits, lezen/schrijven |
| 04 | Read Input Registers | ingangsregisters (3x) | 16-bits, alleen lezen |
| 05 | Write Single Coil | coils | schrijf `0xFF00` voor aan, `0x0000` voor uit |
| 06 | Write Single Register | houdregisters | één register |
| 15 (0x0F) | Write Multiple Coils | coils | meerdere bits |
| 16 (0x10) | Write Multiple Registers | houdregisters | meerdere registers |
| 17 (0x11) | Report Server ID | — | identiteit van het apparaat, formaat bepaald door het apparaat |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | fabrikant, productcode, revisie als tekst |

## Houd of ingang?

De tabel in de handleiding of het adresvoorvoegsel vertelt het u: `3xxxx` wordt gelezen met 04, `4xxxx` met 03. Sommige apparaten beantwoorden beide functies met dezelfde data; andere weigeren de verkeerde met uitzondering 01 (illegal function). Als een handleiding geen voorvoegsel en geen functie geeft, probeer dan eerst 03.

## Schrijven

- Een 32-bitswaarde vereist twee registers die samen met 16 worden geschreven; de helften één voor één met 06 schrijven kan het apparaat met een gemengde waarde achterlaten of worden geweigerd.
- Sommige apparaten accepteren alleen 06, andere alleen 16. De lijst met ondersteunde functies in de handleiding beslist dat.
- Coils die met 05 worden geschreven moeten precies `0xFF00` of `0x0000` dragen.

## Hoe MBMap-kaarten dit vastleggen

Elk register heeft een `area` (`coil`, `discrete`, `input`, `holding`) en een `access` (`R`, `W`, `RW`); een hulpmiddel kiest daaruit de functie. Kaarten kunnen ook de identiteitsfuncties 17 en 43 beschrijven, zodat een hulpmiddel kan controleren met welk apparaat het praat.
