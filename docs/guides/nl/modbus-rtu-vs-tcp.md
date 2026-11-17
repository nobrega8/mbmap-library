# Modbus RTU, Modbus TCP en RS-485

Drie namen die vaak door elkaar worden gehaald.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Medium | seriële lijn, bijna altijd RS-485 (soms RS-232) | Ethernet of wifi |
| Adressering | unit-ID 1–247 op de bus | IP-adres en poort (502), plus een unit-ID |
| Foutcontrole | CRC-16 in elk frame | eigen controles van TCP; geen CRC |
| Framing | stilte van 3,5 tekens tussen frames | header van 7 bytes (MBAP) met een lengte |
| Apparaten per verbinding | tot 32 eenheidsbelastingen per segment (meer met transceivers met lage belasting), één master | veel clients per apparaat, beperkt door het apparaat |
| Typische snelheid | 9600–115200 baud | 10/100 Mbit/s, beperkt door het apparaat |

**RS-485** is alleen de elektrische laag: twee draden, een differentieel signaal, een bus. Modbus RTU draait erop, net als andere protocollen (BACnet MS/TP, DMX, M-Bus via RS-485-adapters).

**Modbus ASCII** verstuurt dezelfde verzoeken als leesbare hextekst; het is tegenwoordig zeldzaam.

<mb-adu></mb-adu>

## Dezelfde registers

De registerkaart is hetzelfde ongeacht het transport: een apparaat dat beide biedt, antwoordt met dezelfde adressen, typen en schalen. Wat verandert is hoe u het bereikt: seriële instellingen en unit-ID bij RTU, IP-adres en poort bij TCP.

## Gateways

Een Modbus TCP-naar-RTU-gateway laat Ethernet-hulpmiddelen seriële apparaten bereiken. Het unit-ID van het TCP-verzoek kiest het apparaat aan de seriële kant. Gateways voegen hun eigen timeouts toe; als een apparaat erachter niet antwoordt, controleer dan eerst de seriële instellingen op de gateway.

## Hoe MBMap-kaarten dit vastleggen

Een kaart geeft aan welke transporten het apparaat biedt (`protocol`: `rtu`, `tcp` of beide) en hun standaardwaarden (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
