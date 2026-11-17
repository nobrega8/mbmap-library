# `.mbmap` — Modbus Map-formaat, versie 2

Een `.mbmap.json`-bestand beschrijft de Modbus-registerkaart van één apparaatmodel: wie het maakt, hoe u ermee communiceert en wat elk register betekent. Het is een JSON-document, dus elke taal kan het lezen met zijn standaard JSON-parser, en een [JSON Schema](schema/mbmap-2.schema.json) beschrijft de structuur.

De sleutelwoorden **MUST** (moet), **SHOULD** (hoort) en **MAY** (mag) worden gebruikt zoals in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## 1. Voorbeeld

```json
{
  "$schema": "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json",
  "mbmap": 2,
  "vendor": "Example Corp",
  "model": "EM-100",
  "description": "Single-phase energy meter",
  "protocol": "rtu",
  "unit_id": 1,
  "baudrate": 9600,
  "parity": "E",
  "stopbits": 1,
  "byte_order": "big",
  "word_order": "big",
  "address_base": 0,
  "enums": {
    "relay": {"0": "Open", "1": "Closed"}
  },
  "registers": [
    {"name": "Voltage", "group": "Measurements", "area": "input", "address": 0, "type": "float32", "unit": "V", "description": "RMS voltage"},
    {"name": "Current", "group": "Measurements", "area": "input", "address": 6, "type": "float32", "unit": "A", "description": "RMS current"},
    {"name": "Active energy", "group": "Energy", "area": "holding", "address": 256, "type": "uint32", "scale": 0.01, "unit": "kWh", "word_order": "little"},
    {"name": "Relay state", "group": "Status", "area": "holding", "address": 512, "type": "bool", "bit": 3, "enum": "relay", "description": "Bit 3 of the status word"},
    {"name": "Reset energy", "group": "Commands", "area": "coil", "address": 0, "type": "bool", "access": "W", "description": "Write 1 to reset counters"},
    {"name": "Serial number", "group": "Info", "area": "holding", "address": 1024, "type": "string", "length": 8, "description": "16 ASCII characters"}
  ]
}
```

Een volledig voorbeeld staat in [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. Bestand

- Een kaart is één JSON-object ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), gecodeerd als UTF-8. Lezers **MUST** een BOM aan het begin accepteren en negeren. Schrijvers **SHOULD NOT** er een schrijven.
- De bestandsnaam eindigt op `.mbmap.json`.
- Een object **MUST NOT** een sleutel herhalen. JSON-parsers behandelen dubbele sleutels verschillend, dus een bestand met een dubbele sleutel is ongeldig.
- Strings worden gebruikt zoals ze geschreven zijn: er wordt niet getrimd, en opgesomde waarden zijn hoofdlettergevoelig (`"holding"`, niet `"Holding"`).
- JSON `null` is voor geen enkele sleutel een geldige waarde; laat de sleutel in plaats daarvan weg.
- JSON kent geen opmerkingen. Notities over het hele bestand gaan in `notes`, een notitie over één register in zijn `comment`. Beide zijn vrije tekst die hulpmiddelen mogen **(MAY)** tonen en niet mogen **(MUST NOT)** interpreteren.
- Schrijvers **SHOULD** de indeling van §1 gebruiken: inspringing van twee spaties en één regel per register en per `enums`-/`sentinels`-tabel, zodat een wijziging in één register een verschil van één regel is.
- `$schema` is optioneel en wijst editors naar het JSON Schema. Lezers **MUST** het negeren.

### 2.1 Gehele getallen

Waar een waarde een **geheel getal** is, mag **(MAY)** dit worden geschreven als JSON-geheel getal (`1040`) of als string met een decimaal geheel getal of `0x`-hex (`"0x0410"`). Strings behouden de hexschrijfwijze die handleidingen voor adressen en identificatoren gebruiken, en dragen 64-bitswaarden die niet elke JSON-parser exact als getallen leest (voorbij 2^53). Sleutels van `enums`- en `sentinels`-tabellen zijn altijd strings, in dezelfde twee vormen.

### 2.2 Tabellen

Een **tabel** koppelt ruwe waarden aan labels: een object waarvan de sleutels als string geschreven gehele getallen (§2.1) zijn en de waarden niet-lege labels, bijv. `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Een tabel heeft ten minste één item, en twee sleutels mogen niet **(MUST NOT)** dezelfde waarde aanduiden (`"1"` en `"0x1"`).

## 3. Sleutels op het hoogste niveau

`mbmap`, `vendor`, `model` en `registers` zijn vereist. Elke andere sleutel is optioneel; ontbreekt hij, dan geldt de standaardwaarde.

| Key | JSON type | Default | Betekenis |
|---|---|---|---|
| `mbmap` | integer `2` | | Formaatversie (§3.1, §8) |
| `vendor` | non-empty string | | Fabrikant |
| `model` | non-empty string | | Model of modelfamilie, zoals aan mensen getoond |
| `models` | array of non-empty strings | `[model]` | Elke modelnaam of -code waarop de kaart van toepassing is (§3.2) |
| `vendor_website` | string: a domain or an `http(s)://` URL | | Website van de fabrikant, bijv. `se.com` of `https://www.se.com` |
| `description` | string | | Korte beschrijving |
| `revision` | integer ≥ 1 | | Revisie van de inhoud van deze kaart (§3.1) |
| `revised` | string `YYYY-MM-DD` | | Datum van die revisie |
| `firmware` | string | | Vrije tekst over de firmware waarop de kaart van toepassing is |
| `firmware_min` | version string (§3.2) | | Oudste firmware waarop de kaart van toepassing is |
| `firmware_max` | version string (§3.2) | | Nieuwste firmware waarop de kaart van toepassing is |
| `source` | string | | Samenvatting in vrije tekst van waar de kaart vandaan komt |
| `sources` | array of source objects | | Documenten waaruit de kaart is opgesteld of waartegen hij is gecontroleerd (§3.3) |
| `notes` | array of strings | | Vrije notities over het bestand |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transporten die het apparaat ondersteunt |
| `unit_id` | integer `0`–`255` | `1` | Standaard unit- / slave-id |
| `port` | integer `1`–`65535` | `502` | Standaard TCP-poort |
| `baudrate` | integer | `9600` | Standaard RTU-baudrate |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Standaard RTU-pariteit |
| `databits` | `7`, `8` | `8` | Standaard RTU-databits |
| `stopbits` | `1`, `2` | `1` | Standaard RTU-stopbits |
| `byte_order` | `"big"`, `"little"` | `"big"` | Standaard bytevolgorde binnen elk register (§6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Standaardvolgorde van de registers van een waarde met meerdere registers (§6) |
| `address_base` | `0`, `1` | `0` | Of `address` vanaf 0 of vanaf 1 telt (§5) |
| `max_read_registers` | integer `1`–`125` | `125` | Grootste blok dat het apparaat per leesactie accepteert (FC03/04) |
| `max_read_bits` | integer `1`–`2000` | `2000` | Grootste blok dat het apparaat per leesactie accepteert (FC01/02) |
| `enums` | object: name → table | | Benoemde vertaaltabellen (§4.1). Namen gebruiken `a`–`z`, `0`–`9` en `_` |
| `sentinels` | object: type → table | | Gereserveerde ruwe waarden per geheel type (§4.2) |
| `identify` | object | | Hoe de identiteit van het apparaat wordt gelezen met Report Slave ID (FC17) of Read Device Identification (FC43) (§4.8) |
| `registers` | array of register objects | | De registers (§4) |

Verbindingswaarden zijn **standaardwaarden**: de gebruiker kan ze bij het verbinden nog altijd wijzigen.

### 3.1 Formaatversie en kaartrevisie

Twee getallen beschrijven een kaart, en ze veranderen om verschillende redenen:

- **`mbmap`, de formaatversie**, zegt welke versie van deze specificatie het bestand volgt, zodat een lezer weet of hij het kan lezen (§8). Hij is gelijk voor elke kaart die volgens deze specificatie is geschreven en verandert alleen wanneer het formaat verandert.
- **`revision`, de kaartrevisie**, zegt welke uitgave van de inhoud van deze kaart het bestand is. Hij begint bij `1` en **SHOULD** met één toenemen bij elke gepubliceerde wijziging die beïnvloedt hoe een apparaat wordt gelezen of geschreven: een register, een verbindingsstandaard, een tabel, een firmwarebereik of een model. Hij mag **(MAY)** gelijk blijven bij wijzigingen aan alleen vrije tekst (`description`, `notes`, `comment`, `source`). `revised` geeft de datum van die wijziging.

Een hulpmiddel dat twee kopieën van dezelfde kaart heeft (dezelfde `vendor` en `model`) **SHOULD** de hogere `revision` als de nieuwere behandelen en mag **(MAY)** de nieuwere aan de gebruiker aanbieden. Een kaart zonder `revision` kan op deze manier niet worden vergeleken. De revisie is niet de firmwareversie van het apparaat: firmware hoort in §3.2.

### 3.2 Modellen en firmware

Een kaart geldt voor de modellen in `models`, of alleen voor `model` als `models` ontbreekt. `model` is de naam die aan mensen wordt getoond: één apparaat, of de familie- of serienaam wanneer de kaart er meerdere dekt (`"PM5100 and PM5300 series"`), geen lijst van apparaten. `models` somt elke naam of code op die een apparaat kan melden, zodat een hulpmiddel die met het aangesloten apparaat kan vergelijken (§9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` en `firmware_max` geven aan voor welke firmwareversies de kaart geldt. Beide zijn optioneel: zonder gelden ze voor elke firmware, wat ook de juiste keuze is als de versie onbekend is. `firmware` blijft beschikbaar voor alles wat een bereik niet kan zeggen (“2.x, behalve 2.3 beta”).

Een **versiestring** is een of meer gehele getallen gescheiden door punten: `"2"`, `"2.1"`, `"1.02.7"`. Componenten worden van links af als getallen vergeleken (`"1.10"` is nieuwer dan `"1.9"`, en `"1.02"` is gelijk aan `"1.2"`), dus schrijf versies zoals het apparaat ze meldt. Een grens omvat elke versie die ermee begint:

- `firmware_min` `"2.1"` omvat `2.1`, `2.1.4` en `3.0`, maar niet `2.0.9`;
- `firmware_max` `"2"` omvat elke `2.x` en `2.x.y`, maar niet `3.0`; `firmware_max` `"2.3"` omvat `2.3.7` maar niet `2.4`.

Dus `"firmware_min": "1", "firmware_max": "2"` leest als “firmware 1.x en 2.x”. `firmware_min` mag niet **(MUST NOT)** na `firmware_max` liggen.

**Registers die van de firmware afhangen.** Een register kan zijn eigen `firmware_min` en `firmware_max` dragen, met dezelfde betekenis, wanneer het alleen in sommige firmwareversies bestaat. Zo blijft er één bestand voor firmwarerevisies die in een paar registers verschillen. Een register zonder deze waarden geldt overal waar de kaart geldt. Twee registers mogen **(MAY)** een `name` (en een adres) delen als hun firmwarebereiken elkaar niet overlappen: het hulpmiddel gebruikt degene die bij het apparaat past.

Voorbeeld: firmware 2.1 verplaatste de energieteller en voegde een vermogensfactorregister toe:

```json
"firmware_min": "1",
"firmware_max": "2",
"registers": [
  {"name": "Firmware version", "area": "holding", "address": 0, "type": "string", "length": 4, "role": "firmware"},
  {"name": "Voltage", "area": "input", "address": 10, "type": "float32", "unit": "V"},
  {"name": "Active energy", "area": "input", "address": 20, "type": "uint32", "unit": "Wh", "firmware_max": "2.0"},
  {"name": "Active energy", "area": "input", "address": 40, "type": "uint64", "unit": "Wh", "firmware_min": "2.1"},
  {"name": "Power factor", "area": "input", "address": 30, "type": "int16", "scale": 0.001, "firmware_min": "2.1"}
]
```

Als de verschillen groot zijn (de meeste adressen of de verbindingsinstellingen veranderen), zijn aparte bestanden duidelijker: één kaart per firmwarebereik, elk met zijn eigen `firmware_min` en `firmware_max`.

### 3.3 Bronnen

`sources` legt de documenten vast waaruit een kaart is opgesteld of waartegen hij is gecontroleerd, zodat een lezer ze kan vinden en kan zien welke uitgave is gebruikt. Elk item is een object:

| Key | JSON type | Betekenis |
|---|---|---|
| `title` | non-empty string, required | Documenttitel, bijv. `"EM530/EM540 Modbus communication protocol"` |
| `version` | string | Uitgave of revisie van het document, zoals erop gedrukt |
| `date` | string `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | Publicatiedatum van die uitgave |
| `url` | `http(s)://` URL | Waar het document te vinden is |
| `note` | string | Welk deel is gebruikt, of hoe de kaart is gecontroleerd (bijv. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | string `YYYY-MM-DD` | Wanneer het document is gedownload of gelezen, omdat een document op dezelfde URL kan wijzigen zonder nieuwe versie |
| `sha256` | string of 64 hex digits | SHA-256 van het gebruikte bestand, zodat een lezer kan zien of het document op `url` nog hetzelfde is |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` is hierboven ingekort weergegeven; in een bestand zijn het alle 64 hexcijfers. Een hulpmiddel mag **(MAY)** het vergelijken met het document dat het downloadt en waarschuwen als ze verschillen: het document is bijgewerkt en de kaart moet mogelijk opnieuw worden gecontroleerd.

`source` blijft een samenvatting van één regel in vrije tekst voor mensen en voor kaarten waarvan de bronnen niet zo gedetailleerd bekend zijn. Een kaart mag **(MAY)** beide hebben.

## 4. Registers

Elk item van `registers` is een object. `name`, `area`, `address` en `type` zijn vereist; elke andere sleutel is optioneel en ontbreekt hij, dan geldt de standaardwaarde.

| Key | JSON type | Default | Betekenis |
|---|---|---|---|
| `name` | non-empty string | | Variabelenaam. **SHOULD** uniek zijn in het bestand |
| `group` | string | | Vrije groepering voor weergave (bijv. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Modbus-gegevensgebied (§5) |
| `address` | integer (§2.1) | | Adres van het eerste register / bit (§5) |
| `type` | see §6 | | Datatype |
| `length` | integer ≥ 1 | | Aantal registers. Vereist voor `string`, anders genegeerd |
| `bit` | integer `0`–`15` | | Voor `bool` in `input`/`holding`: welk bit van het register, 0 = minst significant. Voor een `uint16`-bitveld: het laagste bit |
| `bits` | integer `1`–`16` | | Voor `uint16` in `input`/`holding`: breedte van een bitveld dat bij `bit` begint (§4.3) |
| `scale` | number | `1` | Vermenigvuldiger |
| `scale_factor` | string: a register `name` | | Register waarvan de gehele waarde een tienmachtexponent voor dit register is (§4.4) |
| `offset` | number | `0` | Opgeteld na het schalen |
| `unit` | string | | Technische eenheid (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Toegestane bewerkingen |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | Overschrijft de standaard van het bestand voor dit register (§6) |
| `word_order` | `"big"`, `"little"` | file `word_order` | Overschrijft de standaard van het bestand voor dit register (§6) |
| `write_min` | number | | Kleinste waarde die bij het schrijven wordt geaccepteerd, in technische eenheden (§4.5) |
| `write_max` | number | | Grootste waarde die bij het schrijven wordt geaccepteerd, in technische eenheden (§4.5) |
| `enum` | string (a name in `enums`) or table | | Labels voor gehele of boolwaarden (§4.1) |
| `reference` | see §4.6 | | Ruwe waarde die dit register op een gezond apparaat hoort te bevatten |
| `firmware_min` | version string (§3.2) | | Oudste firmware die dit register heeft |
| `firmware_max` | version string (§3.2) | | Nieuwste firmware die dit register heeft |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Dit register identificeert het apparaat (§4.7) |
| `read_alone` | boolean | `false` | Het register wordt in een eigen verzoek gelezen (§4.9) |
| `read_group` | non-empty string | | Het register wordt alleen samen met registers van dezelfde groep gelezen (§4.9) |
| `parts` | array of objects | | Benoemt de waarden binnen een blokregister, zodat een hulpmiddel ze een voor een kan tonen en bewerken (§4.10) |
| `description` | string | | Vrije tekst |
| `comment` | string | | Vrije notitie over het register, voor mensen die de kaart bewerken |

Technische waarde = ruw × 10^`scale_factor` × `scale` + `offset` (zonder `scale_factor`: ruw × `scale` + `offset`). Bij het schrijven past een hulpmiddel het omgekeerde toe en rondt het voor gehele typen af op het dichtstbijzijnde gehele getal.

### 4.1 Vertaaltabellen

Veel registers bevatten een getal dat een toestand voorstelt: `0` is gestopt, `1` is inactief, `2` is bezig met starten, enzovoort. `enum` zet die getallen om in labels. Het is ofwel:

- **een tabel** die in het register is geschreven: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **de naam van een tabel** in de `enums` op het hoogste niveau, zodat dezelfde lijst eenmaal wordt geschreven voor elk register dat hem gebruikt:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Waarden worden vergeleken met de **ruwe** waarde, vóór `scale` en `offset`. Een waarde die niet in de tabel staat, wordt als gewoon getal getoond. Hulpmiddelen **SHOULD** de labels aanbieden bij het schrijven.

### 4.2 Sentinelwaarden

Sommige apparaten antwoorden met een gereserveerde ruwe waarde in plaats van een meting: één waarde betekent “niet geïmplementeerd”, een andere “boven bereik”, een andere “sensorstoring”. `sentinels` declareert ze voor elk register van één type:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- De sleutels van `sentinels` zijn `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Een tabel geldt voor elk register van dat type.
- Waarden **MUST** in het type passen en worden vergeleken met de **ruwe** waarde, vóór `scale` en `offset`.
- Wanneer een meting overeenkomt, **SHOULD** hulpmiddelen het label tonen in plaats van een getal en **SHOULD NOT** het als meting behandelen (in grafieken, grenzen of gemiddelden).
- Een `enum`-label voor dezelfde ruwe waarde heeft voorrang boven de sentinel.

### 4.3 Bitvelden

Sommige apparaten pakken meerdere kleine waarden in één register, bijvoorbeeld vier alarmcodes van 4 bits. Een `uint16`-register met `bit` en `bits` leest er één: ruwe waarde = (register >> `bit`) & (2^`bits` − 1). `bit` + `bits` mag niet **(MUST NOT)** groter zijn dan 16.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Registers die verschillende velden van hetzelfde register lezen, overlappen niet. Bij het schrijven van een veld **SHOULD** het register worden gelezen, alleen de bits van het veld worden gewijzigd en het register worden teruggeschreven.

### 4.4 Schaalfactoren

Sommige apparaten, met name SunSpec-omvormers en -meters, sturen voor een waarde een apart exponentregister in plaats van een vaste schaal: de waarde is ruw × 10^exponent, en de exponent kan met het bereik van het apparaat veranderen. `scale_factor` noemt dat exponentregister:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- Het genoemde register **MUST** een register van hetzelfde bestand zijn met een geheel type (`int16` … `uint64`) en zonder `bits`, en mag zelf geen `scale_factor` hebben **(MUST NOT)**. Als meerdere registers de naam delen, telt de eerste.
- Alleen numerieke typen kunnen een `scale_factor` hebben (niet `bool` of `string`).
- Een hulpmiddel leest het exponentregister samen met de waarde, ook als de gebruiker ervoor koos het niet te tonen. Als de exponent niet gelezen kan worden of een sentinel is (§4.2, bijv. `-32768` bij SunSpec = niet geïmplementeerd), is de waarde niet beschikbaar.
- Bij het schrijven leest een hulpmiddel eerst de exponent en past het omgekeerde toe.

### 4.5 Schrijfgrenzen

`write_min` en `write_max` geven aan welke waarden een register bij het schrijven accepteert, zodat een hulpmiddel een slechte waarde kan weigeren voordat die het apparaat bereikt.

- Beide zijn getallen in **technische eenheden**: de waarde die de gebruiker ziet, nadat `scale_factor`, `scale` en `offset` zijn toegepast. Een grens van `0.5` op een register met `scale` `0.1` betekent een ruwe waarde van 5.
- Elk van beide mag worden weggelaten: een ontbrekende grens laat die kant open. Ontbreken beide, dan heeft een register geen opgegeven grens (het apparaat beslist).
- `write_min` mag niet **(MUST NOT)** groter zijn dan `write_max`. De grenzen zijn inclusief.
- Een hulpmiddel mag geen schrijfactie verzenden **(MUST NOT)** waarvan de technische waarde onder `write_min` of boven `write_max` ligt, en **SHOULD** de gebruiker vertellen welke grens is overschreden.
- Ze gelden voor de waarde die de gebruiker vraagt, voordat die naar een ruwe waarde wordt omgezet en afgerond. Een waarde binnen de grenzen die toch niet in het type van het register past, wordt door de normale typecontroles geweigerd.
- Ze hebben geen betekenis voor `bool`- en `string`-registers of voor registers die niet beschreven kunnen worden (`access` `"R"`), en worden daar genegeerd.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Referentiewaarden

`reference` geeft een waarde waarvan bekend is dat een gezond apparaat die in dit register bewaart (een modelnummer, een vaste protocolidentificatie, een fabrikantcode). Een hulpmiddel kan het register lezen en met de referentie vergelijken om een verkeerd adres, een verkeerde basis, bytevolgorde of datatype te ontdekken voordat de gebruiker de andere waarden vertrouwt. Niet elk apparaat heeft zo'n register, dus de meeste registers hebben geen `reference`.

- Het is de **ruwe** waarde, vóór `scale_factor`, `scale` en `offset`, in het JSON-type van die waarde: een geheel getal (§2.1) voor de gehele typen en bitvelden, een getal voor `float32` en `float64`, `true` / `false` voor `bool`, een string voor `string`. Het **MUST** in het type passen (en in de breedte van een bitveld, of `2 × length` tekens voor een string).
- De controle is het register zelf: een hulpmiddel leest zijn `area` en `address` (al aangepast voor `address_base`) en decodeert zijn `type` met zijn byte- en woordvolgorde.
- Een kaart kan een willekeurig aantal registers met een `reference` hebben.
- Uitkomst van elke controle: **match** (de gedecodeerde ruwe waarde is gelijk aan de referentie), **mismatch** (ze verschilt), **failed** (de leesactie gaf een fout of een timeout, dus er is niets bekend), **not checked** (het register is niet gelezen). Een hulpmiddel **SHOULD** ze apart melden: een mismatch wijst op een verkeerde kaart of instellingen, een failed op een verbindings- of adresseringsprobleem.
- Floats worden vergeleken met de eigen precisie van het type (een `float32`-referentie wordt als 32-bits float vergeleken). Strings worden vergeleken nadat afsluitende NUL- en spatietekens zijn weggesneden.
- Een referentie ondersteunt slechts een diagnose. Meerdere byte- of woordvolgordes kunnen dezelfde bytes tot dezelfde waarde decoderen (een klein getal of een palindroom leest in meer dan één volgorde hetzelfde), dus een overeenkomst bewijst niet dat de hele kaart klopt. Kaarten **SHOULD** een onderscheidende waarde gebruiken en **SHOULD** er meer dan één geven als het apparaat die heeft.
- Een `reference` op een register dat niet gelezen kan worden (`access` `"W"`) is een fout.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Identiteitsregisters

`role` markeert de registers die vertellen welk apparaat is aangesloten, zodat een hulpmiddel de kaart ertegen kan controleren (§9):

- **`"model"`**: de modelnaam of -code van het apparaat. De waarde ervan, of het `enum`-label als het er een heeft, wordt vergeleken met `models`. Een numerieke modelcode krijgt het best een label: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: de firmwareversie. Een stringregister wordt als tekst gelezen en de eerste versiestring erin wordt gebruikt (`"V2.01b"` geeft `2.01`). Een getal geeft zijn technische waarde (`102` met `scale` `0.01` geeft `1.02`). Hebben meerdere registers deze rol, dan worden hun waarden in de volgorde van het bestand met punten samengevoegd, wat past bij apparaten die de hoofd- en de subversie apart houden, bijvoorbeeld als twee bitvelden van één register (`"bit": 8, "bits": 8` en `"bit": 0, "bits": 8`).
- **`"serial"`**: het serienummer. Hulpmiddelen mogen **(MAY)** het tonen; het wordt nooit vergeleken.

Hooguit één register mag **(MAY)** de rol `"model"` hebben en hooguit één de rol `"serial"`. Een register met een rol **MUST** leesbaar zijn. Registers met een rol zijn verder gewone registers: ze worden net als de andere gelezen en getoond, en kunnen ook een `reference` hebben.

### 4.8 Identiteit van het apparaat (FC17, FC43)

Sommige apparaten melden wat ze zijn met een eigen functie en hebben geen identiteitsregister. `identify` zegt welke functie moet worden verzonden en waar de identiteit in het antwoord staat, zodat een hulpmiddel de kaart kan controleren zoals met de registers van §4.7 (§9). Een kaart heeft hooguit één `identify`.

```json
"enums": {"type_codes": {"0x41": "DMG610", "0x57": "DMG620"}},
"identify": {
  "function": 17,
  "fields": [
    {"name": "Type", "offset": 0, "type": "uint8", "role": "model", "enum": "type_codes"},
    {"name": "Software revision", "offset": 1, "type": "uint8", "role": "firmware"},
    {"name": "Hardware revision", "offset": 2, "type": "uint8"}
  ]
}
```

```json
"identify": {
  "function": 43,
  "fields": [
    {"name": "Vendor name", "object": 0},
    {"name": "Product code", "object": 1, "role": "model"},
    {"name": "Revision", "object": 2, "role": "firmware"}
  ]
}
```

| Key | JSON type | Default | Betekenis |
|---|---|---|---|
| `function` | `17` or `43` | | `17`: Report Slave ID. `43`: Read Device Identification (encapsulated interface transport, MEI-type `0x0E`) |
| `fields` | non-empty array of field objects | | De waarden die uit het antwoord worden gehaald |

Elk veld is een object. `name` is altijd vereist. `role` en de onderstaande sleutels hangen van `function` af.

| Key | JSON type | Default | Betekenis |
|---|---|---|---|
| `name` | non-empty string | | Naam die aan mensen wordt getoond |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Betekenis van de waarde, zoals bij registers (§4.7). Hooguit één `"model"` en één `"serial"` |
| `offset` | integer ≥ 0 | | **Alleen FC17, vereist.** Positie van het veld, in bytes, in de data van het antwoord. Offset `0` is de eerste byte na het aantal bytes, dus de data zijn de bytes die een apparaat in zijn handleiding na “byte count” vermeldt |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Alleen FC17, vereist.** `uint16` is big-endian. `string` is ASCII, met afsluitende NUL- en spatietekens weggesneden |
| `length` | integer ≥ 1 | | **Alleen FC17.** Lengte in bytes. Vereist voor `string` |
| `enum` | table name or inline table | | **Alleen FC17.** Vertaalt een getal naar een label (§4.1). Een modelcode krijgt het best een label, dat dan met `models` wordt vergeleken |
| `object` | integer 0–255 | | **Alleen FC43, vereist.** Object-id: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` door het apparaat gedefinieerd |

- **FC43:** De waarde van een object is een ASCII-string, met afsluitende NUL- en spatietekens weggesneden. Een hulpmiddel vraagt het toegangsniveau (basic, regular of extended) dat elk door de velden genoemd object omvat, en volgt de vlag “more follows” totdat het ze allemaal heeft. Voor `"firmware"` wordt de eerste versiestring in de tekst gebruikt, zoals bij een stringregister (§4.7).
- **Beide functies:** Een apparaat antwoordt op een unit-id, niet op een registeradres, dus `address_base` is niet van toepassing.
- **Geen waarde:** Een antwoord dat korter is dan een veld nodig heeft, een uitzonderingsantwoord, een ontbrekend object of een apparaat dat de functie niet ondersteunt, geeft geen waarde. De controle is **unknown** (§9), geen mismatch.
- **Meerdere bronnen:** `identify` en registers met een `role` kunnen allebei aanwezig zijn. Geven beide een waarde voor dezelfde rol, dan **SHOULD** een hulpmiddel de registers gebruiken en mag **(MAY)** het `identify` gebruiken voor de rollen die geen register geeft.

### 4.9 Lezen in aparte verzoeken

Een lezer voegt aangrenzende registers normaal samen tot één verzoek. Sommige apparaten weigeren een verzoek dat de grens tussen twee interne tabellen overschrijdt, ook al bestaat elk register erin. Twee optionele sleutels beperken hoe registers worden samengevoegd:

- **`read_alone`**: `true` betekent dat het register wordt gelezen in een verzoek dat geen ander register bevat. Bitvelden en andere registers die dezelfde woorden bezetten, tellen als hetzelfde register.
- **`read_group`**: een naam. Registers met dezelfde naam mogen **(MAY)** in één verzoek worden gelezen, en een verzoek mag geen registers van verschillende groepen of een register zonder groep bevatten **(MUST NOT)**. Registers zonder `read_group` worden samengevoegd zoals voorheen.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Als beide sleutels aanwezig zijn, wint `read_alone`. De sleutels beperken alleen het samenvoegen: een lezer is vrij om meer verzoeken te doen dan nodig, en `max_read_registers` en `max_read_bits` blijven gelden. Ze beïnvloeden alleen hoe de registers worden opgevraagd, niet wat ze betekenen, dus een lezer die ze niet kent leest dezelfde registers, samengevoegd zoals altijd. Daarom hebben ze geen nieuwe `mbmap`-versie nodig (§8): op een apparaat dat het samengevoegde verzoek weigert, faalt een oudere lezer precies zoals hij zonder de sleutels zou doen.

### 4.10 Delen van een blok

Sommige apparaten bewaren meerdere waarden in één blok en accepteren alleen het blok als geheel: een schrijfactie die midden erin begint of het niet dekt, wordt geweigerd (uitzondering `0x02` of `0x03`). Een typisch geval is een sms-gateway waarvan het blok het nummer van de ontvanger gevolgd door de berichttekst bevat. De kaart beschrijft dat blok zoals altijd als **één** register, en `parts` zegt wat erin zit:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Key | JSON type | Default | Betekenis |
|---|---|---|---|
| `name` | non-empty string | | Naam die aan mensen wordt getoond |
| `offset` | integer ≥ 0 | | Positie van het deel in het blok, in **registers** vanaf het eerste register van het register |
| `type` | `"string"` or a numeric type (§6) | `"string"` | Hoe het deel wordt gelezen en geschreven |
| `length` | integer ≥ 1 | | Aantal registers. Vereist voor `string`, genegeerd voor de andere typen |
| `description` | string | | Vrije tekst |

- `parts` is alleen voor een `string`-register. Het mag niet **(MUST NOT)** leeg zijn. Elk deel **MUST** binnen het blok liggen (`offset` plus zijn registers is hooguit de `length` van het register), en delen mogen elkaar niet overlappen **(MUST NOT)**. Registers die geen enkel deel dekt, zijn toegestaan: ze zijn opvulling.
- Het register zelf behoudt zijn betekenis. Een lezer die `parts` niet kent, leest en schrijft het hele blok zoals voorheen als één string in één verzoek, dus zo'n kaart blijft in elk hulpmiddel werken.
- Een hulpmiddel dat `parts` kent, **SHOULD** elk deel als eigen veld tonen. Om te lezen decodeert het elk deel uit het blok, met de `byte_order` en `word_order` van het register (§6). Om te schrijven bouwt het het **hele** blok uit de delen en verstuurt het in één verzoek (FC16): een deel dat de gebruiker leeg liet, wordt als nulbytes verzonden, zodat een leeg veld nooit per ongeluk een oude waarde behoudt. Een hulpmiddel mag geen schrijfactie verzenden **(MUST NOT)** die slechts enkele delen dekt, omdat het apparaat die weigert.
- Een `string`-deel is ASCII, met NUL-tekens opgevuld tot zijn `length`. Het hulpmiddel **MUST** een tekst weigeren die langer is dan `2 × length` tekens. Een numeriek deel wordt gecodeerd zoals gebruikelijk (§6).
- `access` is dat van het register: delen kunnen niet beter beschrijfbaar zijn dan het blok.
- `parts` beschrijft alleen wat er in een register zit en heeft dus geen nieuwe `mbmap`-versie nodig (§8). Lezers die het negeren, gedragen zich zoals voorheen.

## 5. Gebieden en adressen

| `area` | Eenheid | Lezen | Schrijven | Toegestane `access` |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | 16-bits register | FC04 | — | `R` |
| `holding` | 16-bits register | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Bij `address_base` `0` is `address` het adres dat over de lijn wordt verzonden (0–65535). Bij `address_base` `1` is het lijnadres `address − 1` (1–65536), wat past bij handleidingen die registers vanaf 1 nummeren.

De 5- en 6-cijferige “Modicon”-notatie (`40001`, `300010`) is **niet** geldig in `address`. Schrijf het als een gebied plus een getal: `40001` wordt `"area": "holding"`, `"address": 1`, met `"address_base": 1`.

## 6. Typen, bytevolgorde en woordvolgorde

| `type` | Registers | Opmerkingen |
|---|---|---|
| `bool` | — | In `coil`/`discrete`: één bit. In `input`/`holding`: één bit van een register, dus `bit` is vereist |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Floats zijn IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 ASCII-tekens per register. Afsluitende NUL- en spatietekens worden bij het lezen weggesneden |

Twee onafhankelijke instellingen bepalen hoe de bytes van een waarde aankomen:

- **`byte_order`**, binnen elk register van 16 bits: `"big"` stuurt de hoge byte eerst (de Modbus-standaard), `"little"` de lage byte eerst.
- **`word_order`**, over de registers van een waarde van 32 of 64 bits: `"big"` zet het meest significante register eerst (op het laagste adres), `"little"` het minst significante register eerst.

De sleutels op het hoogste niveau stellen de standaard van het bestand in; `byte_order` en `word_order` van een register overschrijven die elk afzonderlijk (een register dat alleen `"word_order": "little"` instelt, behoudt de bytevolgorde van het bestand).

| Type | `byte_order` | `word_order` |
|---|---|---|
| `bool` | niet gebruikt | niet gebruikt |
| `int16`, `uint16` | verwisselt de twee bytes van het register | niet gebruikt (één register) |
| `int32`, `uint32`, `float32` | verwisselt de twee bytes van elk register | bepaalt welk van de 2 registers het hoge woord is |
| `int64`, `uint64`, `float64` | verwisselt de twee bytes van elk register | `"little"` keert de 4 registers als geheel om |
| `string` | `"big"`: de eerste ontvangen byte is het eerste teken; `"little"`: de tweede ontvangen byte is het eerste teken | niet gebruikt (registers worden in adresvolgorde gelezen) |

Bij 64-bitswaarden keert de little-woordvolgorde de hele reeks van vier registers om; ze verwisselt niet afzonderlijk twee helften van 32 bits.

Volgorde op de lijn van de 32-bitswaarde `0x0A0B0C0D`:

| `byte_order` | `word_order` | Bytes op de lijn | Gangbare naam |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Modbus-standaard |
| `big` | `little` | `0C 0D 0A 0B` | “woordwissel”, gebruikt door veel meters en PLC's |
| `little` | `big` | `0B 0A 0D 0C` | “bytewissel” (zeldzaam) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Validatie

Lezers **SHOULD** elk probleem melden met een van de onderstaande codes en een [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) naar de waarde (`/registers/3/address`, `/enums/relay`), zodat hulpmiddelen het eens zijn over wat er mis is. Problemen die het hele bestand betreffen, hebben geen pointer. Een **error** maakt het bestand ongeldig. Een **warning** wordt gemeld, maar het bestand is nog bruikbaar.

| Code | Severity | Wanneer |
|---|---|---|
| `not-utf8` | error | Het bestand is geen geldige UTF-8 |
| `not-json` | error | Het bestand is niet één geldig JSON-object, of herhaalt een sleutel in een object. Voor het hele bestand gemeld: parsers plaatsen syntaxfouten op verschillende posities, dus de positie staat in het bericht |
| `bad-json-type` | error | Een bekende sleutel bevat het verkeerde JSON-type (een string waar een getal wordt verwacht, `null`, …) |
| `missing-key` | error | `mbmap`, `vendor`, `model` of `registers` ontbreekt (voor het hele bestand), of een register mist `name`, `area`, `address` of `type`, of heeft het leeg (bij het register) |
| `bad-meta-value` | error | Een sleutel op het hoogste niveau heeft een waarde buiten zijn toegestane verzameling of bereik, inclusief een andere `mbmap` dan `2` |
| `bad-area` | error | Onbekende `area`, of niet in kleine letters geschreven |
| `bad-type` | error | Onbekend `type`, of niet in kleine letters geschreven |
| `type-area` | error | Een ander type dan `bool` in `coil` of `discrete` |
| `bad-address` | error | `address` is geen geheel getal |
| `address-range` | error | Het adres ligt onder `address_base`, of de waarde gaat voorbij adres 65535 |
| `missing-bit` | error | `bool` in `input`/`holding` zonder `bit` |
| `bad-bit` | error | `bit` buiten `0`–`15` |
| `missing-length` | error | `string` zonder `length` |
| `bad-length` | error | `length` is geen geheel getal ≥ 1 |
| `bad-access` | error | Onbekende `access` (of niet in hoofdletters), of niet toegestaan voor de `area` |
| `bad-byte-order` | error | `byte_order` of `word_order` van een register is niet `"big"` of `"little"` |
| `bad-enum` | error | Een enumtabel (§2.2) heeft een sleutel die geen geheel getal is, een leeg label, een herhaalde waarde of geen items, of een `enums`-naam bestaat niet uit `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` noemt een niet-ondersteund type, of een tabel is ongeldig (§2.2) of heeft een waarde die niet in het type past |
| `bad-bits` | error | `bits` is geen geheel getal van 1 tot 16, wordt gebruikt voor een ander type dan `uint16` of buiten `input`/`holding`, heeft geen `bit`, of `bit` + `bits` is groter dan 16 |
| `unknown-enum` | error | `enum` noemt een tabel die `enums` niet definieert |
| `bad-write-limit` | error | `write_min` is groter dan `write_max` |
| `bad-reference` | error | `reference` is geen geldige ruwe waarde voor het `type` van het register (geen geheel getal, buiten het bereik van het type, breder dan het bitveld, geen boolean voor `bool`, geen eindig getal voor floats, langer dan de string), of is ingesteld op een register dat niet gelezen kan worden |
| `unknown-scale-factor` | error | `scale_factor` noemt geen register van het bestand (registers met fouten tellen niet mee) |
| `bad-scale-factor` | error | `scale_factor` is ingesteld op een `bool` of `string`, of noemt een register dat geen geheel getal is (een float, `bool`, `string` of bitveld) of dat zelf een `scale_factor` heeft |
| `bad-version` | error | `firmware_min` of `firmware_max`, in het bestand of een register, is geen versiestring (§3.2) |
| `bad-firmware-range` | error | `firmware_min` ligt na `firmware_max`, in het bestand of een register |
| `bad-source` | error | Een item van `sources` is geen object met een niet-lege `title`, of heeft een `version`, `date`, `url`, `note`, `accessed` of `sha256` van de verkeerde vorm |
| `bad-role` | error | `role` is niet `"model"`, `"firmware"` of `"serial"`, is ingesteld op een register dat niet gelezen kan worden, of `"model"` of `"serial"` wordt meer dan eens gebruikt |
| `bad-identify` | error | `identify` is ongeldig (§4.8): `function` is niet `17` of `43`, `fields` is leeg, of een veld mist een `name`, heeft een onbekende of voor `"model"` of `"serial"` herhaalde `role`, of overtreedt de regels van zijn functie (FC17: `offset` ontbreekt of is negatief, `type` ontbreekt of is onbekend, `string` zonder `length`, een `enum` die geen tabel noemt of geen geldige tabel is, een `object`; FC43: `object` ontbreekt of ligt buiten 0–255, een `offset`, `type`, `length` of `enum`) |
| `bad-parts` | error | `parts` is leeg, is ingesteld op een register dat geen `string` met geldige `length` is, of een deel mist een `name` of `offset`, heeft een negatieve `offset`, een onbekend of `bool` `type`, een `string`-deel zonder `length`, een deel dat voorbij het blok gaat, of delen die elkaar overlappen (§4.10) |
| `no-rows` | warning | `registers` is leeg |
| `duplicate-name` | warning | Een `name` wordt meer dan eens gebruikt door registers waarvan de firmwarebereiken elkaar overlappen (§3.2) |
| `model-list` | warning | `model` somt apparaten op gescheiden door “ / ”; geef de familienaam en som de apparaten op in `models` (§3.2) |
| `overlap` | warning | Een waarde begint binnen de registers van een andere waarde in hetzelfde gebied, wat meestal op een verkeerd adres of type wijst. Registers die op hetzelfde adres beginnen, zijn alternatieve leesmanieren van dezelfde data (bijvoorbeeld een code die als getal en als tekst wordt gelezen) en tellen nooit als overlap; evenmin bits en bitvelden van één register (`bool` + `bit`, `uint16` + `bit` + `bits`), noch registers waarvan de firmwarebereiken elkaar niet overlappen |
| `firmware-outside-map` | warning | Het firmwarebereik van een register heeft geen versie gemeen met dat van het bestand, dus het geldt nooit |
| `bad-read` | error | `read_group` is een lege string |
| `unknown-key` | warning | Een register heeft een sleutel die niet in deze specificatie staat en niet met `x_` begint |
| `unused-write-limit` | warning | `write_min` of `write_max` is ingesteld op een register waar het geen effect heeft (`bool`, `string` of `access` `"R"`) |
| `unused-bit` | warning | `bit` is ingesteld op een register waar het geen effect heeft (elk type behalve `bool`, tenzij bij een `uint16` ook `bits` is ingesteld) |

Een register met een fout in `name`, `area`, `address` of `type` wordt niet verder gecontroleerd. Een register met een willekeurige fout blijft buiten de `overlap`-controle.

Het [JSON Schema](schema/mbmap-2.schema.json) controleert de structuur, de JSON-typen en de waardebereiken; de regels die meerdere waarden verbinden (`unknown-enum`, schaalfactoren, `overlap`, `address-range`, `bad-reference` per type, dubbele sleutels) vereisen code. De map [`tests/`](tests/) bevat voorbeeldbestanden met de diagnostiek die elk moet opleveren, zodat elke implementatie zichzelf daartegen kan toetsen.

## 8. Compatibiliteit en versiebeheer

- Lezers **MUST** sleutels negeren die ze niet kennen, op het hoogste niveau en in registers. Zo openen nieuwere bestanden in oudere lezers.
- Fabrikant- of hulpmiddelspecifieke sleutels **SHOULD** met `x_` beginnen (`"x_modbench_icon"`, `"x_alarm_high"`), zodat ze nooit botsen met toekomstige versies van deze specificatie. Hun waarden mogen **(MAY)** van elk JSON-type zijn.
- `mbmap` is de **hoofd**versie. Een lezer **MUST** een bestand weigeren waarvan hij de `mbmap` niet ondersteunt, en **SHOULD** zeggen welke versie hij vond.
- Nieuwe optionele sleutels die oudere lezers veilig kunnen negeren, worden toegevoegd zonder `mbmap` te wijzigen. Een sleutel waarvan een oudere lezer de betekenis verkeerd zou begrijpen als hij hem negeerde, vereist een nieuwe hoofdversie.
- Het schemabestand is naar de hoofdversie genoemd (`mbmap-2.schema.json`) en krijgt daarbinnen alleen optionele sleutels.

## 9. Een kaart controleren tegen het aangesloten apparaat

Een hulpmiddel dat de identiteitsregisters (§4.7) of het door `identify` (§4.8) beschreven identiteitsantwoord van het aangesloten apparaat leest, **SHOULD** die met de kaart vergelijken, zodat de gebruiker geen waarden vertrouwt uit een kaart die voor een ander model of een andere firmware is geschreven. Het kan de gebruiker ook toestaan het model of de firmware met de hand op te geven als het apparaat ze niet meldt.

Elke controle heeft een van drie uitkomsten:

| Uitkomst | Model | Firmware |
|---|---|---|
| **match** | Het model van het apparaat, zonder hoofdletters en omringende spaties vergeleken, is een van `models` (of `model`) | De versie van het apparaat ligt binnen `firmware_min` … `firmware_max` |
| **mismatch** | Dat is het niet | Ze ligt buiten het bereik |
| **unknown** | De kaart heeft geen `"model"`-register, het kon niet worden gelezen of gaf geen waarde | De kaart heeft geen `"firmware"`-register, het kon niet worden gelezen, er kon geen versiestring in worden gevonden, of de kaart geeft geen bereik op |

Wat een hulpmiddel met elke uitkomst doet:

- **match**: niets te melden; het hulpmiddel mag **(MAY)** tonen dat het apparaat is herkend.
- **mismatch**: het hulpmiddel **SHOULD** duidelijk waarschuwen, zeggen wat de kaart verwacht en wat het apparaat meldde, en **SHOULD** om bevestiging vragen vóór de eerste schrijfactie naar het apparaat. Het mag daarom het lezen niet stoppen **(MUST NOT)**: lezen is onschadelijk en de gebruiker weet het misschien beter (een rebadged apparaat, een nieuwere firmware die dezelfde registers behield).
- **unknown**: geen probleem. De meeste apparaten melden geen model of firmware, en de meeste kaarten gelden voor elke firmware. Het hulpmiddel mag het niet als mismatch behandelen **(MUST NOT)** en mag **(MAY)** vermelden dat de kaart een firmwarebereik opgeeft dat niet kon worden gecontroleerd.

Registers met een eigen firmwarebereik (§3.2):

- Als de firmware **bekend** is, **SHOULD** een hulpmiddel alleen de registers gebruiken waarvan het bereik haar omvat: de andere bestaan niet op dit apparaat, en een registernaam die door meerdere firmwarebereiken wordt gedeeld, betekent dan één register.
- Als de firmware **onbekend** is, **SHOULD** een hulpmiddel elk register lezen en **SHOULD** het tonen welke van de firmware afhangen (bijvoorbeeld “firmware 2.1 en later”), en mag **(MAY)** het de gebruiker de versie laten kiezen.

Een kaart zonder `models`, `firmware_min`, `firmware_max` en identiteitsregisters wordt tegen niets gecontroleerd, wat juist is voor een kaart die voor elk apparaat van zijn model geldt.

## 10. Oudere bestanden

Versie 1 van het formaat, gebaseerd op CSV, is verouderd. Nieuwe lezers hoeven het niet te ondersteunen; bestanden in dat formaat kunnen worden omgezet met [`tools/migrate/migrate.py`](tools/migrate/migrate.py) (zie [legacy/v1](legacy/v1/)).
