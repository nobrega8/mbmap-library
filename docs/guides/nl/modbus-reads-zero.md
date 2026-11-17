# Een Modbus-register leest 0, 0xFFFF of 0x8000

Het verzoek slaagt, maar de waarde slaat nergens op. Kijk, voordat u het apparaat verdenkt, wat het u probeert te vertellen.

## Veelvoorkomende redenen

- **Verkeerd gebied.** Hetzelfde adres kan zowel als ingangs- als houdregister bestaan met verschillende inhoud. Het houdregister lezen terwijl de waarde in een ingangsregister staat, kan nullen opleveren. Zie [functiecodes](modbus-function-codes).
- **Eén ernaast.** De tweede helft van een 32-bitswaarde lezen in plaats van de eerste geeft bij kleine waarden vaak 0. Zie [adressen](modbus-address-off-by-one).
- **Niet geïmplementeerd.** Veel apparaten beantwoorden het lezen van ongebruikte registers met 0, 0xFFFF, 0x7FFF of 0x8000 in plaats van met een uitzondering. SunSpec-apparaten gebruiken 0x8000 (−32768) voor “niet geïmplementeerd” in velden met teken en 0xFFFF in velden zonder.
- **Niet gemeten.** Een nulstroom bij een driedraadsaansluiting, een niet aangesloten fase of een sensoringang waar niets op zit leest 0 of een vaste markering.
- **Nog niet klaar.** Sommige apparaten geven na het inschakelen enkele seconden nullen, of totdat hun eerste meetcyclus klaar is.
- **Modelverschillen.** Een register dat in een familiehandleiding staat, bestaat mogelijk alleen op sommige modellen: de andere geven 0.
- **Schaal te grof.** Een kleine stroom met schaal 1 A leest 0.

<mb-scaling></mb-scaling>

## Hoe MBMap-kaarten dit vastleggen

Een kaart kan `sentinels` opsommen, de waarden die per type “niet beschikbaar” betekenen, zodat een hulpmiddel ze als ontbrekend toont en niet als meting. Registerbeschrijvingen vermelden welke modellen of bedrading een waarde nodig heeft.
