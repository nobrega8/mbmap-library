# `.mbmap` — Modbus Map formátum, 2. verzió

Egy `.mbmap.json` fájl egy eszközmodell Modbus regisztertérképét írja le: ki gyártja, hogyan kell beszélni vele, és mit jelent az egyes regiszter. JSON-dokumentum, így bármely nyelv beolvashatja a szabványos JSON-értelmezőjével, a szerkezetét pedig egy [JSON Schema](schema/mbmap-2.schema.json) írja le.

A **MUST** (kell), **SHOULD** (érdemes) és **MAY** (szabad) kulcsszavakat az [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) szerint használjuk.

## 1. Példa

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

Egy teljes példa az [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json) fájlban található.

## 2. Fájl

- A térkép egyetlen JSON-objektum ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), UTF-8 kódolásban. Az olvasóknak el **MUST** fogadniuk és figyelmen kívül kell hagyniuk az elején lévő BOM-ot. Az íróknak nem **SHOULD NOT** BOM-ot írniuk.
- A fájlnév `.mbmap.json`-ra végződik.
- Egy objektum nem ismételhet meg kulcsot **(MUST NOT)**. A JSON-értelmezők eltérően kezelik az ismétlődő kulcsokat, ezért az ilyen fájl érvénytelen.
- A karakterláncokat úgy használjuk, ahogy írták: nincs levágás, és a felsorolt értékek kis- és nagybetűérzékenyek (`"holding"`, nem `"Holding"`).
- A JSON `null` egyik kulcsnál sem érvényes érték; hagyja el inkább a kulcsot.
- A JSON-ban nincsenek megjegyzések. Az egész fájlra vonatkozó jegyzetek a `notes`-ba, egy regiszterre vonatkozó jegyzet a `comment`-be kerül. Mindkettő szabad szöveg, amelyet az eszközök megjeleníthetnek **(MAY)**, és nem értelmezhetnek **(MUST NOT)**.
- Az íróknak az §1 elrendezését **SHOULD** követniük: kétszóközös behúzás, és egy sor regiszterenként, illetve `enums`/`sentinels` táblázatonként, hogy egy regiszter módosítása egysoros különbség legyen.
- A `$schema` választható, és a szerkesztőket a JSON Schemára irányítja. Az olvasóknak figyelmen kívül **MUST** hagyniuk.

### 2.1 Egész számok

Ahol egy érték **egész szám**, azt JSON-egészként (`1040`), vagy decimális egészet vagy `0x` hexet tartalmazó karakterláncként (`"0x0410"`) szabad **(MAY)** megadni. A karakterláncok megtartják a hex írásmódot, amelyet a kézikönyvek a címekhez és azonosítókhoz használnak, és hordozzák a 64 bites értékeket, amelyeket nem minden JSON-értelmező olvas pontosan számként (2^53 fölött). Az `enums` és `sentinels` táblázatok kulcsai mindig karakterláncok, ugyanebben a két formában.

### 2.2 Táblázatok

Egy **táblázat** nyers értékekhez rendel címkéket: olyan objektum, amelynek kulcsai karakterláncként írt egészek (§2.1), értékei pedig nem üres címkék, pl. `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. A táblázatnak legalább egy bejegyzése van, és két kulcs nem jelölheti ugyanazt az értéket **(MUST NOT)** (`"1"` és `"0x1"`).

## 3. Legfelső szintű kulcsok

A `mbmap`, a `vendor`, a `model` és a `registers` kötelező. Minden más kulcs választható; ha hiányzik, az alapértelmezés érvényes.

| Key | JSON type | Default | Jelentés |
|---|---|---|---|
| `mbmap` | integer `2` | | A formátum verziója (§3.1, §8) |
| `vendor` | non-empty string | | Gyártó |
| `model` | non-empty string | | Modell vagy modellcsalád, ahogy az embereknek megjelenik |
| `models` | array of non-empty strings | `[model]` | Minden modellnév vagy kód, amelyre a térkép vonatkozik (§3.2) |
| `vendor_website` | string: a domain or an `http(s)://` URL | | A gyártó weboldala, pl. `se.com` vagy `https://www.se.com` |
| `description` | string | | Rövid leírás |
| `revision` | integer ≥ 1 | | A térkép tartalmának revíziója (§3.1) |
| `revised` | string `YYYY-MM-DD` | | Az adott revízió dátuma |
| `firmware` | string | | Szabad szöveg a firmware-ről, amelyre a térkép vonatkozik |
| `firmware_min` | version string (§3.2) | | A legrégebbi firmware, amelyre a térkép vonatkozik |
| `firmware_max` | version string (§3.2) | | A legújabb firmware, amelyre a térkép vonatkozik |
| `source` | string | | Szabad szöveges összefoglaló arról, honnan származik a térkép |
| `sources` | array of source objects | | A dokumentumok, amelyekből a térképet készítették vagy ellenőrizték (§3.3) |
| `notes` | array of strings | | Szabad jegyzetek a fájlról |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Az eszköz által támogatott szállítások |
| `unit_id` | integer `0`–`255` | `1` | Alapértelmezett unit / slave id |
| `port` | integer `1`–`65535` | `502` | Alapértelmezett TCP-port |
| `baudrate` | integer | `9600` | Alapértelmezett RTU-baudráta |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Alapértelmezett RTU-paritás |
| `databits` | `7`, `8` | `8` | Alapértelmezett RTU-adatbitek |
| `stopbits` | `1`, `2` | `1` | Alapértelmezett RTU-stopbitek |
| `byte_order` | `"big"`, `"little"` | `"big"` | Alapértelmezett bájtsorrend az egyes regiszterekben (§6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Egy többregiszteres érték regisztereinek alapértelmezett sorrendje (§6) |
| `address_base` | `0`, `1` | `0` | Az `address` 0-tól vagy 1-től számol-e (§5) |
| `max_read_registers` | integer `1`–`125` | `125` | A legnagyobb blokk, amelyet az eszköz olvasásonként elfogad (FC03/04) |
| `max_read_bits` | integer `1`–`2000` | `2000` | A legnagyobb blokk, amelyet az eszköz olvasásonként elfogad (FC01/02) |
| `enums` | object: name → table | | Elnevezett fordítótáblák (§4.1). A nevek `a`–`z`, `0`–`9` és `_` karaktereket használnak |
| `sentinels` | object: type → table | | Fenntartott nyers értékek egész típusonként (§4.2) |
| `identify` | object | | Hogyan olvasható az eszköz azonosítója a Report Slave ID (FC17) vagy a Read Device Identification (FC43) segítségével (§4.8) |
| `registers` | array of register objects | | A regiszterek (§4) |

A kapcsolati értékek **alapértelmezések**: a felhasználó csatlakozáskor továbbra is megváltoztathatja őket.

### 3.1 Formátumverzió és térképrevízió

Két szám ír le egy térképet, és különböző okokból változnak:

- A **`mbmap`, a formátumverzió** megmondja, hogy a fájl e specifikáció melyik verzióját követi, hogy az olvasó tudja, el tudja-e olvasni (§8). Minden e specifikáció szerint írt térképnél ugyanaz, és csak akkor változik, ha a formátum változik.
- A **`revision`, a térképrevízió** megmondja, hogy a fájl e térkép tartalmának melyik kiadása. `1`-ről indul, és minden közzétett módosításnál eggyel **SHOULD** nőnie, amely befolyásolja, hogyan olvasható vagy írható az eszköz: egy regiszter, egy kapcsolati alapértelmezés, egy táblázat, egy firmware-tartomány vagy egy modell. Változatlan **MAY** maradni csak a szabad szöveg (`description`, `notes`, `comment`, `source`) módosításakor. A `revised` az adott módosítás dátumát adja meg.

Az az eszköz, amely ugyanannak a térképnek két példányával rendelkezik (azonos `vendor` és `model`), a magasabb `revision`-t **SHOULD** újabbnak tekintenie, és az újabbat **MAY** felajánlania a felhasználónak. A `revision` nélküli térkép így nem hasonlítható össze. A revízió nem az eszköz firmware-verziója: a firmware a §3.2-höz tartozik.

### 3.2 Modellek és firmware

A térkép a `models` modelljeire vonatkozik, vagy csak a `model`-re, ha a `models` hiányzik. A `model` az embereknek megjelenő név: egy eszköz, vagy a család- vagy sorozatnév, ha a térkép többet fed le (`"PM5100 and PM5300 series"`), nem eszközök listája. A `models` felsorol minden nevet vagy kódot, amelyet egy eszköz jelenthet, hogy egy eszköz összevethesse a csatlakoztatott eszközzel (§9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

A `firmware_min` és a `firmware_max` megadja, mely firmware-verziókra vonatkozik a térkép. Mindkettő választható: nélkülük a térkép minden firmware-re vonatkozik, ami akkor is a helyes választás, ha a verzió ismeretlen. A `firmware` mező megmarad mindarra, amit egy tartomány nem tud kifejezni („2.x, kivéve a 2.3 beta”).

A **verziókarakterlánc** egy vagy több, ponttal elválasztott egész szám: `"2"`, `"2.1"`, `"1.02.7"`. Az összetevőket balról számként hasonlítják össze (az `"1.10"` újabb, mint az `"1.9"`, az `"1.02"` pedig ugyanaz, mint az `"1.2"`), ezért a verziókat úgy írja, ahogy az eszköz jelenti. A határ minden olyan verziót lefed, amely vele kezdődik:

- a `firmware_min` `"2.1"` magában foglalja a `2.1`, `2.1.4` és `3.0` verziókat, de a `2.0.9`-et nem;
- a `firmware_max` `"2"` magában foglal minden `2.x` és `2.x.y` verziót, de a `3.0`-t nem; a `firmware_max` `"2.3"` magában foglalja a `2.3.7`-et, de a `2.4`-et nem.

Így a `"firmware_min": "1", "firmware_max": "2"` azt jelenti: „1.x és 2.x firmware”. A `firmware_min` nem lehet a `firmware_max` után **(MUST NOT)**.

**A firmware-től függő regiszterek.** Egy regiszternek lehet saját `firmware_min` és `firmware_max` értéke ugyanezzel a jelentéssel, ha csak egyes firmware-verziókban létezik. Így egyetlen fájl marad olyan firmware-revíziókhoz, amelyek néhány regiszterben különböznek. A nélkülük álló regiszter mindenhol érvényes, ahol a térkép. Két regiszter osztozhat egy `name`-en (és címen) **(MAY)**, ha firmware-tartományaik nem fedik át egymást: az eszköz a hozzá illőt használja.

Példa: a 2.1-es firmware áthelyezte az energiaszámlálót, és hozzáadott egy teljesítménytényező-regisztert:

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

Ha a különbségek nagyok (a legtöbb cím vagy a kapcsolati beállítások változnak), külön fájlok az áttekinthetőbbek: firmware-tartományonként egy térkép, mindegyik saját `firmware_min` és `firmware_max` értékkel.

### 3.3 Források

A `sources` rögzíti azokat a dokumentumokat, amelyekből egy térképet készítettek, vagy amelyekkel összevetették, hogy az olvasó megtalálhassa őket, és megmondhassa, melyik kiadást használták. Minden elem egy objektum:

| Key | JSON type | Jelentés |
|---|---|---|
| `title` | non-empty string, required | A dokumentum címe, pl. `"EM530/EM540 Modbus communication protocol"` |
| `version` | string | A dokumentum kiadása vagy revíziója, ahogy rajta nyomtatva van |
| `date` | string `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | Az adott kiadás megjelenési dátuma |
| `url` | `http(s)://` URL | Hol található a dokumentum |
| `note` | string | Melyik részt használták, vagy hogyan ellenőrizték a térképet (pl. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | string `YYYY-MM-DD` | Mikor töltötték le vagy olvasták el a dokumentumot, mivel az ugyanazon az URL-en lévő dokumentum új verzió nélkül is változhat |
| `sha256` | string of 64 hex digits | A használt fájl SHA-256 értéke, hogy az olvasó megállapíthassa, a `url`-en lévő dokumentum még ugyanaz-e |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

A `sha256` fent rövidítve látható; egy fájlban mind a 64 hex számjegy szerepel. Egy eszköz összevetheti **(MAY)** a letöltött dokumentummal, és figyelmeztethet, ha eltérnek: a dokumentumot frissítették, és a térképet esetleg újra ellenőrizni kell.

A `source` egysoros, szabad szöveges összefoglaló marad az embereknek és azoknak a térképeknek, amelyek forrásai nem ismertek ilyen részletességgel. Egy térképnek lehet mindkettője **(MAY)**.

## 4. Regiszterek

A `registers` minden eleme egy objektum. A `name`, az `area`, az `address` és a `type` kötelező; minden más kulcs választható, és ha hiányzik, az alapértelmezés érvényes.

| Key | JSON type | Default | Jelentés |
|---|---|---|---|
| `name` | non-empty string | | A változó neve. A fájlban egyedinek **SHOULD** lennie |
| `group` | string | | Szabad csoportosítás megjelenítéshez (pl. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Modbus-adatterület (§5) |
| `address` | integer (§2.1) | | Az első regiszter / bit címe (§5) |
| `type` | see §6 | | Adattípus |
| `length` | integer ≥ 1 | | A regiszterek száma. `string`-hez kötelező, egyébként figyelmen kívül marad |
| `bit` | integer `0`–`15` | | `input`/`holding` területen lévő `bool`-hoz: a regiszter melyik bitje, 0 = legkevésbé jelentős. `uint16` bitmezőhöz: annak legalacsonyabb bitje |
| `bits` | integer `1`–`16` | | `input`/`holding` területen lévő `uint16`-hoz: a `bit`-nél kezdődő bitmező szélessége (§4.3) |
| `scale` | number | `1` | Szorzó |
| `scale_factor` | string: a register `name` | | A regiszter, amelynek egész értéke ennek a tízhatvány-kitevője (§4.4) |
| `offset` | number | `0` | A skálázás után hozzáadva |
| `unit` | string | | Mérnöki egység (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Megengedett műveletek |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | Felülírja a fájl alapértelmezését ennél a regiszternél (§6) |
| `word_order` | `"big"`, `"little"` | file `word_order` | Felülírja a fájl alapértelmezését ennél a regiszternél (§6) |
| `write_min` | number | | Íráskor elfogadott legkisebb érték, mérnöki egységben (§4.5) |
| `write_max` | number | | Íráskor elfogadott legnagyobb érték, mérnöki egységben (§4.5) |
| `enum` | string (a name in `enums`) or table | | Címkék egész vagy bool értékekhez (§4.1) |
| `reference` | see §4.6 | | A nyers érték, amelyet ennek a regiszternek egy egészséges eszközön tartalmaznia kell |
| `firmware_min` | version string (§3.2) | | A legrégebbi firmware, amely rendelkezik ezzel a regiszterrel |
| `firmware_max` | version string (§3.2) | | A legújabb firmware, amely rendelkezik ezzel a regiszterrel |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Ez a regiszter azonosítja az eszközt (§4.7) |
| `read_alone` | boolean | `false` | A regiszter saját kérésben olvasódik (§4.9) |
| `read_group` | non-empty string | | A regiszter csak az azonos csoport regisztereivel együtt olvasódik (§4.9) |
| `parts` | array of objects | | Elnevezi a blokkregiszteren belüli értékeket vagy egy szóregiszter bitmezőit, hogy az eszköz egyenként megjeleníthesse és szerkeszthesse őket (§4.10) |
| `description` | string | | Szabad szöveg |
| `comment` | string | | Szabad jegyzet a regiszterről a térképet szerkesztő embereknek |

Mérnöki érték = nyers × 10^`scale_factor` × `scale` + `offset` (`scale_factor` nélkül: nyers × `scale` + `offset`). Íráskor az eszköz az inverzet alkalmazza, és egész típusoknál a legközelebbi egészre kerekít.

### 4.1 Fordítótáblák

Sok regiszter egy állapotot jelentő számot tárol: a `0` leállítva, az `1` tétlen, a `2` indul, és így tovább. Az `enum` ezeket a számokat címkékké alakítja. Vagy:

- **a regiszterben írt táblázat**: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **egy táblázat neve** a legfelső szintű `enums`-ban, így ugyanazt a listát minden, azt használó regiszterhez csak egyszer kell megírni:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Az értékeket a `scale` és `offset` előtti **nyers** értékkel hasonlítják össze. A táblázatban nem szereplő érték egyszerű számként jelenik meg. Az eszközöknek íráskor fel **SHOULD** kínálniuk a címkéket.

### 4.2 Őrszemértékek

Egyes eszközök mérés helyett fenntartott nyers értékkel válaszolnak: az egyik érték azt jelenti, „nincs megvalósítva”, egy másik „tartományon felül”, egy másik „szenzorhiba”. A `sentinels` ezeket egy típus minden regiszterére deklarálja:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- A `sentinels` kulcsai: `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. A táblázat az adott típus minden regiszterére érvényes.
- Az értékeknek bele **MUST** férniük a típusba, és a `scale` és `offset` előtti **nyers** értékkel hasonlítják össze őket.
- Ha egy olvasat egyezik, az eszközöknek a számok helyett a címkét **SHOULD** megjeleníteniük, és nem **SHOULD NOT** mérésként kezelniük (diagramokban, határokban vagy átlagokban).
- Ugyanarra a nyers értékre egy `enum` címke elsőbbséget élvez az őrszemmel szemben.

### 4.3 Bitmezők

Egyes eszközök több kis értéket zsúfolnak egy regiszterbe, például négy 4 bites riasztási kódot. A `bit`-tel és `bits`-szel ellátott `uint16` regiszter egyet olvas közülük: nyers érték = (regiszter >> `bit`) & (2^`bits` − 1). A `bit` + `bits` nem haladhatja meg a 16-ot **(MUST NOT)**.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Az ugyanazon regiszter különböző mezőit olvasó regiszterek nem fedik át egymást. Egy mező írásakor érdemes **(SHOULD)** beolvasni a regisztert, csak a mező bitjeit módosítani, és visszaírni.

### 4.4 Skálázási tényezők

Egyes eszközök, különösen a SunSpec inverterek és mérők, rögzített skála helyett külön kitevőregisztert küldenek egy értékhez: az érték nyers × 10^kitevő, és a kitevő az eszköz tartományával változhat. A `scale_factor` ezt a kitevőregisztert nevezi meg:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- A megnevezett regiszternek ugyanazon fájl egy egész típusú (`int16` … `uint64`) és `bits` nélküli regiszterének **MUST** lennie, és magának nem lehet `scale_factor` értéke **(MUST NOT)**. Ha több regiszter osztozik a néven, az első számít.
- Csak a numerikus típusoknak lehet `scale_factor` értékük (a `bool`-nak és `string`-nek nem).
- Az eszköz az értékkel együtt olvassa a kitevőregisztert, akkor is, ha a felhasználó úgy döntött, nem jeleníti meg. Ha a kitevő nem olvasható, vagy őrszem (§4.2, pl. a SunSpec `-32768` = nincs megvalósítva), az érték nem érhető el.
- Íráskor az eszköz először beolvassa a kitevőt, és az inverzet alkalmazza.

### 4.5 Írási határok

A `write_min` és a `write_max` deklarálja, mely értékeket fogadja el egy regiszter íráskor, hogy egy eszköz elutasíthassa a hibás értéket, mielőtt az eléri az eszközt.

- Mindkettő szám **mérnöki egységekben**: az az érték, amelyet a felhasználó lát, a `scale_factor`, `scale` és `offset` alkalmazása után. A `0.5` határ egy `0.1` `scale`-ű regiszteren 5-ös nyers értéket jelent.
- Bármelyik elhagyható: a hiányzó határ nyitva hagyja az adott oldalt. Ha mindkettő hiányzik, a regiszternek nincs deklarált határa (az eszköz dönt).
- A `write_min` nem lehet nagyobb a `write_max`-nál **(MUST NOT)**. A határok zártak.
- Az eszköz nem küldhet olyan írást, amelynek mérnöki értéke a `write_min` alatt vagy a `write_max` fölött van **(MUST NOT)**, és meg **SHOULD** mondania a felhasználónak, melyik határt lépte túl.
- A felhasználó által kért értékre vonatkoznak, mielőtt nyers értékké alakítják és kerekítik. A határokon belüli, de a regiszter típusába mégsem illő értéket a szokásos típusellenőrzések utasítják el.
- A `bool` és `string` regisztereknél, illetve a nem írható regisztereknél (`access` `"R"`) nincs jelentésük, és figyelmen kívül maradnak.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Referenciaértékek

A `reference` olyan értéket ad meg, amelyről tudni, hogy egy egészséges eszköz tárolja ebben a regiszterben (egy modellszám, egy rögzített protokollazonosító, egy gyártói kód). Egy eszköz beolvashatja a regisztert, és összevetheti a referenciával, hogy felismerjen egy téves címet, alapot, bájtsorrendet vagy adattípust, mielőtt a felhasználó megbízna a többi értékben. Nem minden eszköznek van ilyen regisztere, ezért a legtöbb regiszternek nincs `reference` értéke.

- Ez a `scale_factor`, `scale` és `offset` előtti **nyers** érték, az érték JSON-típusában: egész szám (§2.1) az egész típusokhoz és bitmezőkhöz, szám a `float32`-höz és `float64`-hez, `true` / `false` a `bool`-hoz, karakterlánc a `string`-hez. Bele **MUST** férnie a típusba (és a bitmező szélességébe, illetve karakterláncnál `2 × length` karakterbe).
- Az ellenőrzés maga a regiszter: az eszköz beolvassa annak `area` és `address` értékét (az `address_base` szerint már korrigálva), és dekódolja a `type`-ját a bájt- és szósorrenddel.
- Egy térképnek tetszőleges számú `reference`-ű regisztere lehet.
- Az egyes ellenőrzések kimenete: **match** (a dekódolt nyers érték egyezik a referenciával), **mismatch** (eltér), **failed** (az olvasás hibát adott vagy időtúllépés történt, tehát semmi sem ismert), **not checked** (a regisztert nem olvasták). Az eszköznek külön **SHOULD** jelentenie őket: a mismatch téves térképre vagy beállításokra utal, a failed kapcsolati vagy címzési problémára.
- A floatokat a típus saját pontosságával hasonlítják össze (a `float32` referenciát 32 bites floatként). A karakterláncokat a záró NUL és szóköz karakterek levágása után hasonlítják össze.
- A referencia csak egy diagnózist támogat. Több bájt- vagy szósorrend is dekódolhatja ugyanazokat a bájtokat ugyanarra az értékre (egy kis szám vagy egy palindrom több sorrendben is ugyanúgy olvasódik), ezért az egyezés nem bizonyítja, hogy az egész térkép helyes. A térképeknek jellegzetes értéket **SHOULD** használniuk, és több értéket **SHOULD** megadniuk, ahol az eszköznek van.
- A nem olvasható regiszteren (`access` `"W"`) lévő `reference` hiba.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Azonosító regiszterek

A `role` megjelöli azokat a regisztereket, amelyek megmondják, melyik eszköz csatlakozik, hogy egy eszköz összevethesse velük a térképet (§9):

- **`"model"`**: az eszköz modellneve vagy kódja. Az értékét, vagy ha van, az `enum` címkéjét a `models`-szel hasonlítják össze. Egy numerikus modellkódnak érdemes címkét adni: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: a firmware-verzió. A karakterlánc-regiszter szövegként olvasódik, és az első benne lévő verziókarakterláncot használják (a `"V2.01b"` `2.01`-et ad). Egy szám a mérnöki értékét adja (a `102` `scale` `0.01`-gyel `1.02`-t ad). Ha több regiszternek van ez a szerepe, értékeiket pontokkal fűzik össze a fájl sorrendjében, ami olyan eszközökhöz illik, amelyek a fő- és alverziót külön tárolják, például egy regiszter két bitmezőjeként (`"bit": 8, "bits": 8` és `"bit": 0, "bits": 8`).
- **`"serial"`**: a sorozatszám. Az eszközök megjeleníthetik **(MAY)**; soha nem hasonlítják össze.

Legfeljebb egy regiszternek lehet **MAY** `"model"` és legfeljebb egynek `"serial"` szerepe. A szerepet viselő regiszternek olvashatónak **MUST** lennie. A szereppel rendelkező regiszterek egyébként szokásos regiszterek: a többiekhez hasonlóan olvassák és jelenítik meg őket, és `reference` értékük is lehet.

### 4.8 Azonosítás az eszközről (FC17, FC43)

Egyes eszközök saját függvénnyel jelentik, mik ők, és nincs azonosító regiszterük. Az `identify` megmondja, melyik függvényt kell küldeni, és hol van az azonosító a válaszban, hogy egy eszköz úgy ellenőrizhesse a térképet, mint a §4.7 regisztereivel (§9). Egy térképnek legfeljebb egy `identify` értéke van.

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

| Key | JSON type | Default | Jelentés |
|---|---|---|---|
| `function` | `17` or `43` | | `17`: Report Slave ID. `43`: Read Device Identification (encapsulated interface transport, `0x0E` MEI-típus) |
| `fields` | non-empty array of field objects | | A válaszból kinyerendő értékek |

Minden mező egy objektum. A `name` mindig kötelező. A `role` és az alábbi kulcsok a `function`-től függnek.

| Key | JSON type | Default | Jelentés |
|---|---|---|---|
| `name` | non-empty string | | Az embereknek megjelenő név |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Az érték jelentése, mint a regisztereknél (§4.7). Legfeljebb egy `"model"` és egy `"serial"` |
| `offset` | integer ≥ 0 | | **Csak FC17, kötelező.** A mező pozíciója bájtban a válasz adataiban. A `0` eltolás a bájtszám utáni első bájt, tehát az adatok azok a bájtok, amelyeket egy eszköz a kézikönyvében a „byte count” után felsorol |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Csak FC17, kötelező.** A `uint16` big-endian. A `string` ASCII, a záró NUL és szóköz karakterek levágva |
| `length` | integer ≥ 1 | | **Csak FC17.** Hossz bájtban. `string`-hez kötelező |
| `enum` | table name or inline table | | **Csak FC17.** Egy számot címkévé alakít (§4.1). Egy modellkódnak érdemes címkét adni, amelyet aztán a `models`-szel hasonlítanak össze |
| `object` | integer 0–255 | | **Csak FC43, kötelező.** Objektumazonosító: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` az eszköz által meghatározott |

- **FC43:** Egy objektum értéke ASCII karakterlánc, a záró NUL és szóköz karakterek levágva. Az eszköz azt a hozzáférési szintet (basic, regular vagy extended) kéri, amely a mezők által megnevezett minden objektumot magában foglalja, és követi a „more follows” jelzőt, amíg mindet meg nem kapja. A `"firmware"` esetén a szövegben lévő első verziókarakterláncot használják, mint egy karakterlánc-regiszternél (§4.7).
- **Mindkét függvény:** Egy eszköz unit id-ra válaszol, nem regiszterre, ezért az `address_base` nem érvényes.
- **Nincs érték:** A mezőnél rövidebb válasz, egy kivételválasz, egy hiányzó objektum vagy egy olyan eszköz, amely nem támogatja a függvényt, nem ad értéket. Az ellenőrzés **unknown** (§9), nem mismatch.
- **Több forrás:** Az `identify` és a `role`-lal rendelkező regiszterek együtt is jelen lehetnek. Ha mindkettő értéket ad ugyanarra a szerepre, az eszköznek a regisztereket **SHOULD** használnia, és az `identify`-t **MAY** használhatja azokra a szerepekre, amelyeket egyetlen regiszter sem ad.

### 4.9 Olvasás külön kérésekben

Az olvasó a szomszédos regisztereket általában egyetlen kérésbe vonja össze. Egyes eszközök elutasítják a két belső táblázat határát átlépő kérést, annak ellenére, hogy a benne lévő minden regiszter létezik. Két választható kulcs korlátozza a regiszterek összevonását:

- **`read_alone`**: a `true` azt jelenti, hogy a regiszter olyan kérésben olvasódik, amelyben nincs más regiszter. A bitmezők és a ugyanazokat a szavakat elfoglaló más regiszterek ugyanannak a regiszternek számítanak.
- **`read_group`**: egy név. Az azonos nevű regiszterek egy kérésben olvashatók **(MAY)**, és egy kérés nem tartalmazhat különböző csoportok regisztereit vagy csoport nélküli regisztert **(MUST NOT)**. A `read_group` nélküli regiszterek a korábbiak szerint vonódnak össze.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Ha mindkét kulcs jelen van, a `read_alone` győz. A kulcsok csak az összevonást korlátozzák: az olvasó szabadon tehet a szükségesnél több kérést, és a `max_read_registers` és a `max_read_bits` továbbra is érvényes. Csak azt befolyásolják, hogyan kérik a regisztereket, nem azt, mit jelentenek, ezért az olvasó, amelyik nem ismeri őket, ugyanazokat a regisztereket olvassa, a megszokott módon összevonva. Ezért nincs szükségük új `mbmap` verzióra (§8): az olyan eszközön, amely elutasítja az összevont kérést, egy régi olvasó pontosan úgy hibázik, mint a kulcsok nélkül.

### 4.10 Egy blokk részei

Egyes eszközök több értéket tartanak egy blokkban, és csak az egész blokkot fogadják el: a blokk közepén kezdődő vagy azt nem lefedő írást elutasítják (`0x02` vagy `0x03` kivétel). Tipikus eset egy SMS-átjáró, amelynek blokkja a címzett számát és az üzenet szövegét tartalmazza. A térkép ezt a blokkot a korábbiak szerint **egy** regiszterként írja le, és a `parts` megmondja, mi van benne:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Key | JSON type | Default | Jelentés |
|---|---|---|---|
| `name` | non-empty string | | Az embereknek megjelenő név |
| `offset` | integer ≥ 0 | | A rész pozíciója a blokkban, **regiszterekben** a regiszter első regiszterétől |
| `type` | `"string"` or a numeric type (§6) | `"string"` | Hogyan olvassák és írják a részt |
| `length` | integer ≥ 1 | | A regiszterek száma. `string`-hez kötelező, a többi típusnál figyelmen kívül marad |
| `description` | string | | Szabad szöveg |

- A `parts` csak `string` regiszterhez való. Nem lehet üres **(MUST NOT)**. Minden résznek a blokkon belül **MUST** lennie (az `offset` plusz a regiszterei legfeljebb a regiszter `length` értéke), és a részek nem fedhetik át egymást **(MUST NOT)**. Azok a regiszterek, amelyeket egyetlen rész sem fed le, megengedettek: ezek a kitöltés.
- Maga a regiszter megtartja a jelentését. A `parts`-ot nem ismerő olvasó a teljes blokkot a korábbiak szerint egyetlen karakterláncként, egy kérésben olvassa és írja, így az ilyen térkép minden eszközben tovább működik.
- A `parts`-ot ismerő eszköznek minden részt külön mezőként **SHOULD** megjelenítenie. Olvasáskor a regiszter `byte_order` és `word_order` értékével (§6) dekódolja az egyes részeket a blokkból. Íráskor a részekből az **egész** blokkot felépíti, és egy kérésben küldi el (FC16): a felhasználó által üresen hagyott rész nullabájtokként kerül elküldésre, így egy üres mező soha nem tart meg véletlenül régi értéket. Az eszköz nem küldhet olyan írást, amely csak egyes részeket fed le **(MUST NOT)**, mert az eszköz elutasítja.
- A `string` rész ASCII, NUL karakterekkel a `length` értékéig kitöltve. Az eszköznek el **MUST** utasítania a `2 × length` karakternél hosszabb szöveget. A numerikus részt a szokásos módon kódolják (§6).
- Az `access` a regiszteré: a részek nem lehetnek írhatóbbak a blokknál.
- A `parts` csak azt írja le, mi van egy regiszterben, ezért nincs szüksége új `mbmap` verzióra (§8). A figyelmen kívül hagyó olvasók a korábbiak szerint viselkednek.

#### Egy szó bitmezői

Egyes eszközök több beállítást tartanak egy szóban, amelyet csak **egészében** fogadnak el: az az írás, amely egy bitet állít be, a többit nullázza. Ugyanez a `parts` kulcs írja le ezt a szót `uint16`, `uint32` vagy `uint64` regiszteren. A regiszter továbbra is egyetlen szokásos szám, ezért a `parts`-ot nem ismerő olvasó pontosan úgy olvassa és írja, mint korábban.

```json
{
  "name": "Control word", "area": "holding", "address": 2001, "type": "uint32", "access": "RW",
  "parts": [
    {"name": "Command", "bit": 0, "bits": 4, "enum": "command", "description": "Play, ready or stop"},
    {"name": "Error acknowledge", "bit": 4},
    {"name": "Enable unit 1", "bit": 21}
  ]
}
```

| Key | JSON type | Default | Jelentés |
|---|---|---|---|
| `name` | non-empty string | | Az embereknek megjelenő név |
| `bit` | integer ≥ 0 | | A mező legalacsonyabb bitje; 0 = a regiszter `byte_order` és `word_order` szerint dekódolt értékének legkisebb helyiértékű bitje (§6) |
| `bits` | integer ≥ 1 | `1` | A mező szélessége |
| `enum` | sztring | | A mező értékéhez tartozó fordítási tábla neve (§4.1) |
| `description` | string | | Szabad szöveg |

- A `bit` + `bits` **MUST NOT** haladja meg a regiszter szélességét (16, 32 vagy 64). A mezők **MUST NOT** fedjék át egymást. Olyan bitek, amelyeket nem fed mező, megengedettek: használatlanok vagy fenntartottak.
- A bitmezőnek nincs `offset`, `length` vagy `type` kulcsa: ezek a `string` regiszter részeihez tartoznak, és a két fajta nem keveredik egy regiszterben.
- A `parts`-ot ismerő eszköz **SHOULD** minden mezőt külön mutasson. Olvasáskor kivonja a mezőt a dekódolt értékből. Íráskor a mezőkből az **egész** értéket építi fel (a nem megadott mező 0-ként megy), és a szó összes regiszterét egy kéréssel írja (FC16). **MUST NOT** olyan írást küldeni, amely csak néhány mezőt vagy regisztert fed le.
- Az `access` a regiszteré. Az olvasható regiszter csak olvasható bitmezői továbbra is a regiszter saját `bit` és `bits` kulcsát használják (§4.3); a `parts` azokra a szavakra való, amelyeket egészében kell írni.
- Az ilyen `parts`-ot használó regiszterek megbuknak egy régebbi validátoron (`bad-parts`: e kiegészítés előtt a `parts` csak sztringekre szólt), de a `parts`-ot figyelmen kívül hagyó olvasók a regisztert a régi módon olvassák. Ezért nem kell új `mbmap` verzió (§8).

## 5. Területek és címek

| `area` | Egység | Olvasás | Írás | Megengedett `access` |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | 16 bites regiszter | FC04 | — | `R` |
| `holding` | 16 bites regiszter | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Ha az `address_base` `0`, az `address` a vezetékre küldött cím (0–65535). Ha az `address_base` `1`, a vezetékcím `address − 1` (1–65536), ami megfelel az 1-től számozó kézikönyveknek.

Az 5 és 6 számjegyű „Modicon” jelölés (`40001`, `300010`) **nem** érvényes az `address` mezőben. Írja területként plusz számként: a `40001` `"area": "holding"`, `"address": 1` lesz, `"address_base": 1`-gyel.

## 6. Típusok, bájtsorrend és szósorrend

| `type` | Regiszterek | Megjegyzések |
|---|---|---|
| `bool` | — | `coil`/`discrete` területen: egy bit. `input`/`holding` területen: egy regiszter egy bitje, ezért a `bit` kötelező |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | A floatok IEEE 754 szerintiek |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | Regiszterenként 2 ASCII karakter. A záró NUL és szóköz karaktereket olvasáskor levágják |

Két független beállítás határozza meg, hogyan érkeznek egy érték bájtjai:

- **`byte_order`**, minden 16 bites regiszteren belül: a `"big"` a magasabb bájtot küldi előre (a Modbus szabvány), a `"little"` az alacsonyabbat.
- **`word_order`**, egy 32 bites vagy 64 bites érték regiszterei között: a `"big"` a legjelentősebb regisztert teszi előre (a legalacsonyabb címre), a `"little"` a legkevésbé jelentőset.

A legfelső szintű kulcsok a fájl alapértelmezését állítják be; egy regiszter `byte_order` és `word_order` értéke külön-külön felülírja azt (az a regiszter, amely csak `"word_order": "little"` értéket állít be, megtartja a fájl bájtsorrendjét).

| Típus | `byte_order` | `word_order` |
|---|---|---|
| `bool` | nem használt | nem használt |
| `int16`, `uint16` | felcseréli a regiszter két bájtját | nem használt (egy regiszter) |
| `int32`, `uint32`, `float32` | felcseréli az egyes regiszterek két bájtját | eldönti, melyik a 2 regiszter közül a magasabb szó |
| `int64`, `uint64`, `float64` | felcseréli az egyes regiszterek két bájtját | a `"little"` megfordítja a 4 regisztert egészében |
| `string` | `"big"`: az első kapott bájt az első karakter; `"little"`: a második kapott bájt az első karakter | nem használt (a regiszterek címsorrendben olvasódnak) |

A 64 bites értékeknél a little szósorrend a négy regiszter teljes sorozatát megfordítja; nem cseréli fel külön a két 32 bites felet.

A 32 bites `0x0A0B0C0D` érték sorrendje a vezetéken:

| `byte_order` | `word_order` | Bájtok a vezetéken | Általános név |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Modbus szabvány |
| `big` | `little` | `0C 0D 0A 0B` | „szócsere”, sok mérő és PLC használja |
| `little` | `big` | `0B 0A 0D 0C` | „bájtcsere” (ritka) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Érvényesítés

Az olvasóknak minden problémát az alábbi kódok egyikével és az értékre mutató [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901)rel (`/registers/3/address`, `/enums/relay`) **SHOULD** jelenteniük, hogy az eszközök egyetértsenek abban, mi a hiba. Az egész fájlt érintő problémáknak nincs pointerük. Egy **error** érvénytelenné teszi a fájlt. A **warning**t jelentik, de a fájl még használható.

| Code | Severity | Mikor |
|---|---|---|
| `not-utf8` | error | A fájl nem érvényes UTF-8 |
| `not-json` | error | A fájl nem egyetlen érvényes JSON-objektum, vagy egy objektumban megismétel egy kulcsot. Az egész fájlra jelentik: az értelmezők a szintaktikai hibákat különböző pozíciókra teszik, ezért a pozíció az üzenetben van |
| `bad-json-type` | error | Egy ismert kulcs rossz JSON-típusú értéket tartalmaz (karakterlánc ott, ahol számot várnak, `null`, …) |
| `missing-key` | error | Hiányzik a `mbmap`, `vendor`, `model` vagy `registers` (az egész fájlra), vagy egy regiszterből hiányzik a `name`, `area`, `address` vagy `type`, vagy üres (a regiszternél) |
| `bad-meta-value` | error | Egy legfelső szintű kulcs értéke kívül esik a megengedett halmazon vagy tartományon, beleértve a `2`-től eltérő `mbmap` értéket |
| `bad-area` | error | Ismeretlen `area`, vagy nem kisbetűvel írták |
| `bad-type` | error | Ismeretlen `type`, vagy nem kisbetűvel írták |
| `type-area` | error | A `bool`-tól eltérő típus `coil` vagy `discrete` területen |
| `bad-address` | error | Az `address` nem egész szám |
| `address-range` | error | A cím az `address_base` alatt van, vagy az érték túllépi a 65535-ös címet |
| `missing-bit` | error | `bool` `input`/`holding` területen `bit` nélkül |
| `bad-bit` | error | A `bit` a `0`–`15` tartományon kívül esik |
| `missing-length` | error | `string` `length` nélkül |
| `bad-length` | error | A `length` nem ≥ 1 egész szám |
| `bad-access` | error | Ismeretlen `access` (vagy nem nagybetűs), vagy nem megengedett az `area`-hoz |
| `bad-byte-order` | error | Egy regiszter `byte_order` vagy `word_order` értéke nem `"big"` vagy `"little"` |
| `bad-enum` | error | Egy enum táblázatnak (§2.2) nem egész szám kulcsa, üres címkéje, ismétlődő értéke van, vagy nincsenek bejegyzései, vagy egy `enums` név nem `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | A `sentinels` nem támogatott típust nevez meg, vagy egy táblázat érvénytelen (§2.2), vagy a típusba nem illő értéke van |
| `bad-bits` | error | A `bits` nem 1 és 16 közötti egész szám, a `uint16`-tól eltérő típuson vagy `input`/`holding` területen kívül használják, nincs `bit`, vagy a `bit` + `bits` meghaladja a 16-ot |
| `unknown-enum` | error | Az `enum` olyan táblázatot nevez meg, amelyet az `enums` nem definiál |
| `bad-write-limit` | error | A `write_min` nagyobb a `write_max`-nál |
| `bad-reference` | error | A `reference` nem érvényes nyers érték a regiszter `type` típusához (nem egész, kívül esik a típus tartományán, szélesebb a bitmezőnél, nem boolean `bool`-hoz, nem véges szám floatokhoz, hosszabb a karakterláncnál), vagy egy nem olvasható regiszteren van beállítva |
| `unknown-scale-factor` | error | A `scale_factor` nem nevezi meg a fájl egyetlen regiszterét sem (a hibás regiszterek nem számítanak) |
| `bad-scale-factor` | error | A `scale_factor` `bool`-on vagy `string`-en van beállítva, vagy olyan regisztert nevez meg, amely nem egész (float, `bool`, `string` vagy bitmező), vagy amelynek maga is van `scale_factor` értéke |
| `bad-version` | error | A `firmware_min` vagy `firmware_max` a fájlban vagy egy regiszterben nem verziókarakterlánc (§3.2) |
| `bad-firmware-range` | error | A `firmware_min` a `firmware_max` után van, a fájlban vagy egy regiszterben |
| `bad-source` | error | A `sources` egy eleme nem objektum nem üres `title`-lel, vagy a `version`, `date`, `url`, `note`, `accessed` vagy `sha256` rossz formájú |
| `bad-role` | error | A `role` nem `"model"`, `"firmware"` vagy `"serial"`, nem olvasható regiszteren van beállítva, vagy a `"model"` vagy `"serial"` egynél többször szerepel |
| `bad-identify` | error | Az `identify` érvénytelen (§4.8): a `function` nem `17` vagy `43`, a `fields` üres, vagy egy mezőnek nincs `name`, ismeretlen vagy a `"model"`/`"serial"` esetén ismétlődő `role`-ja van, vagy megszegi a függvénye szabályait (FC17: hiányzó vagy negatív `offset`, hiányzó vagy ismeretlen `type`, `length` nélküli `string`, olyan `enum`, amely nem nevez meg táblázatot vagy nem érvényes táblázat, egy `object`; FC43: hiányzó vagy a 0–255 tartományon kívüli `object`, egy `offset`, `type`, `length` vagy `enum`) |
| `bad-parts` | error | A `parts` üres, nem érvényes `length`-ű `string` regiszteren van beállítva, vagy egy résznek nincs `name` vagy `offset` értéke, negatív `offset`-je, ismeretlen vagy `bool` `type`-ja van, egy `string` résznek nincs `length`-je, egy rész túllóg a blokkon, vagy a részek átfedik egymást; `uint16`, `uint32` vagy `uint64` regiszteren az első feltétel nem érvényes, és a részek bitmezők: ott hiba a `bit` nélküli rész, a negatív `bit`, az 1 alatti `bits`, az `offset`, `length` vagy `type` megadása, a regiszter szélességén túlnyúló mező vagy az átfedő mezők; tábla nélküli `enum` esetén `unknown-enum` (§4.10) |
| `no-rows` | warning | A `registers` üres |
| `duplicate-name` | warning | Egy `name` többször szerepel olyan regisztereknél, amelyek firmware-tartományai átfedik egymást (§3.2) |
| `model-list` | warning | A `model` eszközöket sorol fel „ / ” jellel elválasztva; adja meg a családnevet, és az eszközöket a `models`-ben sorolja fel (§3.2) |
| `overlap` | warning | Egy érték egy másik érték regiszterein belül kezdődik ugyanazon a területen, ami általában téves címet vagy típust jelent. Az ugyanazon a címen kezdődő regiszterek ugyanazon adatok alternatív olvasatai (például egy kód számként és szövegként olvasva), és soha nem számítanak átfedésnek; ahogy egy regiszter bitjei és bitmezői sem (`bool` + `bit`, `uint16` + `bit` + `bits`), és azok a regiszterek sem, amelyek firmware-tartományai nem fedik át egymást |
| `firmware-outside-map` | warning | Egy regiszter firmware-tartományának nincs közös verziója a fájléval, ezért soha nem érvényes |
| `bad-read` | error | A `read_group` üres karakterlánc |
| `unknown-key` | warning | Egy regiszternek olyan kulcsa van, amely nem szerepel ebben a specifikációban, és nem `x_`-szel kezdődik |
| `unused-write-limit` | warning | A `write_min` vagy `write_max` olyan regiszteren van beállítva, ahol nincs hatása (`bool`, `string` vagy `access` `"R"`) |
| `unused-bit` | warning | A `bit` olyan regiszteren van beállítva, ahol nincs hatása (a `bool`-on kívül bármely típus, kivéve ha egy `uint16`-on a `bits` is be van állítva) |

A `name`, `area`, `address` vagy `type` mezőben hibás regisztert nem ellenőrzik tovább. A bármilyen hibás regiszter kimarad az `overlap` ellenőrzésből.

A [JSON Schema](schema/mbmap-2.schema.json) a szerkezetet, a JSON-típusokat és az értéktartományokat ellenőrzi; a több értéket összekapcsoló szabályokhoz (`unknown-enum`, skálázási tényezők, `overlap`, `address-range`, típus szerinti `bad-reference`, ismétlődő kulcsok) kód kell. A [`tests/`](tests/) mappa mintafájlokat tartalmaz azokkal a diagnosztikákkal, amelyeket mindegyiknek adnia kell, hogy bármely megvalósítás ellenőrizhesse magát velük.

## 8. Kompatibilitás és verziózás

- Az olvasóknak figyelmen kívül **MUST** hagyniuk azokat a kulcsokat, amelyeket nem ismernek, a legfelső szinten és a regiszterekben. Ez lehetővé teszi, hogy az újabb fájlok megnyíljanak a régebbi olvasókban.
- A gyártó- vagy eszközspecifikus kulcsoknak `x_`-szel **SHOULD** kezdődniük (`"x_modbench_icon"`, `"x_alarm_high"`), hogy soha ne ütközzenek e specifikáció jövőbeli verzióival. Értékük **MAY** bármilyen JSON-típusú lenni.
- A `mbmap` a **fő**verzió. Az olvasónak el **MUST** utasítania azt a fájlt, amelynek `mbmap` értékét nem támogatja, és meg **SHOULD** mondania, melyik verziót találta.
- Az új választható kulcsok, amelyeket a régebbi olvasók biztonságosan figyelmen kívül hagyhatnak, az `mbmap` megváltoztatása nélkül kerülnek hozzáadásra. Az a kulcs, amelynek jelentését egy régebbi olvasó félreértené, ha figyelmen kívül hagyná, új főverziót igényel.
- A sémafájl a főverzióról kapta a nevét (`mbmap-2.schema.json`), és azon belül csak választható kulcsokat kap.

## 9. Térkép ellenőrzése a csatlakoztatott eszközzel

Az az eszköz, amely beolvassa a csatlakoztatott eszköz azonosító regisztereit (§4.7) vagy az `identify` által leírt azonosító választ (§4.8), a térképpel **SHOULD** összevetnie azokat, hogy a felhasználó ne bízzon egy másik modellre vagy firmware-re írt térkép értékeiben. Azt is megengedheti a felhasználónak, hogy kézzel megadja a modellt vagy a firmware-t, ha az eszköz nem jelenti.

Minden ellenőrzésnek háromféle kimenete lehet:

| Kimenet | Modell | Firmware |
|---|---|---|
| **match** | Az eszköz modellje, kis- és nagybetűk és a környező szóközök figyelmen kívül hagyásával összehasonlítva, a `models` (vagy `model`) egyike | Az eszköz verziója a `firmware_min` … `firmware_max` tartományon belül van |
| **mismatch** | Nem az | A tartományon kívül van |
| **unknown** | A térképen nincs `"model"` regiszter, nem sikerült olvasni, vagy nem adott értéket | A térképen nincs `"firmware"` regiszter, nem sikerült olvasni, nem találtak benne verziókarakterláncot, vagy a térkép nem deklarál tartományt |

Mit tesz az eszköz az egyes kimenetekkel:

- **match**: nincs mit jelenteni; az eszköz megjelenítheti **(MAY)**, hogy az eszközt felismerték.
- **mismatch**: az eszköznek egyértelműen figyelmeztetnie **SHOULD**, megmondva, mit vár a térkép, és mit jelentett az eszköz, és az eszközre való első írás előtt megerősítést **SHOULD** kérnie. Emiatt nem szabad megszakítania az olvasást **(MUST NOT)**: az olvasás ártalmatlan, és a felhasználó jobban tudhatja (átcímkézett eszköz, ugyanazokat a regisztereket megtartó újabb firmware).
- **unknown**: nem probléma. A legtöbb eszköz nem jelent modellt vagy firmware-t, és a legtöbb térkép minden firmware-re érvényes. Az eszköz nem kezelheti mismatchként **(MUST NOT)**, és megemlítheti **(MAY)**, hogy a térkép olyan firmware-tartományt deklarál, amelyet nem lehetett ellenőrizni.

A saját firmware-tartományú regiszterek (§3.2):

- Ha a firmware **ismert**, az eszköznek csak azokat a regisztereket **SHOULD** használnia, amelyek tartománya magában foglalja: a többi nem létezik ezen az eszközön, és a több firmware-tartományon osztozó regisztername ilyenkor egy regisztert jelent.
- Ha a firmware **ismeretlen**, az eszköznek minden regisztert **SHOULD** olvasnia, és meg **SHOULD** mutatnia, melyek függenek a firmware-től (például „2.1-es és újabb firmware”), és a felhasználót a verzió kiválasztására **MAY** engednie.

A `models`, `firmware_min`, `firmware_max` és azonosító regiszterek nélküli térképet semmivel nem vetik össze, ami helyes olyan térképnél, amely a modell minden eszközére érvényes.

## 10. Régebbi fájlok

A formátum CSV-n alapuló 1. verziója elavult. Az új olvasóknak nem kell támogatniuk; az ilyen formátumú fájlok a [`tools/migrate/migrate.py`](tools/migrate/migrate.py) segítségével alakíthatók át (lásd a [legacy/v1](legacy/v1/) mappát).
