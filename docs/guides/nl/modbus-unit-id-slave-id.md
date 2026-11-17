# Modbus-unit-ID (slave-ID): welk apparaat antwoordt

Elk Modbus-verzoek draagt een unit-ID van één byte, ook slave-ID, slave-adres of apparaatadres genoemd.

## Op RS-485 (Modbus RTU)

- Elk apparaat op de bus heeft een eigen adres van 1 tot 247, ingesteld op het display, met DIP-schakelaars of in de configuratiesoftware.
- Adres 0 is broadcast: elk apparaat voert een schrijfactie uit en geen enkel antwoordt. Leesacties naar 0 krijgen geen antwoord.
- Een apparaat dat op een ander adres staat, negeert uw verzoek volledig, dus een verkeerd unit-ID ziet eruit als een dood apparaat: u krijgt een [timeout](modbus-timeout-no-response), geen fout.

## Op Modbus TCP

- Een apparaat dat rechtstreeks via IP wordt bereikt, negeert het unit-ID meestal of verwacht 1. Sommige verwachten 0 of 255 en enkele weigeren alles behalve hun ingestelde waarde.
- Achter een TCP-naar-RTU-gateway kiest het unit-ID het seriële apparaat: het moet overeenkomen met het RS-485-adres van dat apparaat. De gateway zelf antwoordt vaak op 0, 255 of een ingesteld ID.
- Sommige apparaten met meerdere interne delen (een omvormer met een meter en een accu) antwoorden op verschillende unit-ID's voor elk deel.

<mb-gateway></mb-gateway>

## Een onbekend adres vinden

- Lees het af van het display of label van het apparaat.
- Scan: stuur een leesactie van een gebruikelijk register naar elk adres van 1 tot 247 met de baudrate van het apparaat en noteer welke antwoordt. Doe dit met alleen dat apparaat aangesloten.
- Herstel de fabrieksinstellingen; de handleiding geeft de standaardwaarde (vaak 1).

## Hoe MBMap-kaarten dit vastleggen

Een kaart geeft het standaard `unit_id` van het apparaat (en de seriële instellingen en TCP-poort). De standaardwaarde is slechts een beginpunt: apparaten worden bij installatie meestal opnieuw geconfigureerd.
