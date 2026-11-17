# Modbus-uitzonderingscodes: wat het apparaat u vertelt

Wanneer een Modbus-apparaat een verzoek begrijpt maar niet kan uitvoeren, antwoordt het met een uitzondering: de functiecode met de bovenste bit gezet (`0x83` voor een mislukte lees van houdregisters) en een code van één byte.

| Code | Naam | Gebruikelijke oorzaak | Wat u kunt proberen |
|---|---|---|---|
| 01 | Illegal function | Het apparaat ondersteunt deze functiecode niet: ingangsregisters (04) lezen van een apparaat dat alleen houdregisters heeft, of met 16 schrijven naar een apparaat dat alleen 06 accepteert | Gebruik de functiecode die de handleiding voor die tabel vermeldt |
| 02 | Illegal data address | Het adres bestaat niet, of het gevraagde blok loopt in een gat | Controleer de [adresverschuiving](modbus-address-off-by-one); lees minder registers tegelijk |
| 03 | Illegal data value | Het aantal is te groot (meer dan 125 registers) of een geschreven waarde ligt buiten het bereik | Lees kleinere blokken; controleer het toegestane bereik vóór het schrijven |
| 04 | Server device failure | Het apparaat faalde ermee; sommige apparaten gebruiken het voor elk geweigerd schrijven of voor het lezen van een blok dat ze niet toestaan | Lees één register per keer; controleer de toestand van het apparaat |
| 05 | Acknowledge | Geaccepteerd, maar het duurt even (programmeren, opslaan) | Wacht en vraag dan op |
| 06 | Server device busy | Het apparaat is bezet | Probeer het later opnieuw |
| 0A | Gateway path unavailable | Een gateway kon het apparaat erachter niet bereiken | Controleer de seriële kant van de gateway en zijn routering |
| 0B | Gateway target failed to respond | De gateway stuurde het verzoek door, maar het apparaat antwoordde niet | Controleer het unit-ID, de baudrate en de bedrading achter de gateway |

<mb-exceptions></mb-exceptions>

## Helemaal geen antwoord is geen uitzondering

Een apparaat dat een frame ontvangt met een verkeerde CRC, een verkeerd unit-ID of een pariteitsfout, blijft stil: u krijgt een timeout, geen uitzondering. Zie [timeouts](modbus-timeout-no-response).

## Blokken die gaten overspannen

Veel apparaten weigeren een leesactie die een ongebruikt adres raakt, ook al bestaat elk register dat u nodig hebt. Als het lezen van 20 registers faalt met 02 maar ze één voor één lezen werkt, splits het verzoek dan bij de gaten. Kaarten kunnen aangeven hoeveel registers een apparaat per verzoek accepteert (`max_read_registers`).
