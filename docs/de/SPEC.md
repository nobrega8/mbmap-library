# `.mbmap` — Modbus-Map-Format, Version 2

Eine `.mbmap.json`-Datei beschreibt die Modbus-Registermap eines Gerätemodells: wer es herstellt, wie man mit ihm spricht und was jedes Register bedeutet. Sie ist ein JSON-Dokument, daher kann jede Sprache sie mit ihrem Standard-JSON-Parser lesen, und ein [JSON Schema](schema/mbmap-2.schema.json) beschreibt ihre Struktur.

Die Schlüsselwörter **MUST** (muss), **SHOULD** (sollte) und **MAY** (darf) werden wie in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) verwendet.

## 1. Beispiel

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

Ein vollständiges Beispiel steht in [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. Datei

- Eine Map ist ein JSON-Objekt ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), kodiert als UTF-8. Leser **MUST** ein führendes BOM akzeptieren und ignorieren. Schreiber **SHOULD NOT** eines schreiben.
- Der Dateiname endet auf `.mbmap.json`.
- Ein Objekt **MUST NOT** einen Schlüssel wiederholen. JSON-Parser behandeln doppelte Schlüssel unterschiedlich, daher ist eine Datei mit einem solchen ungültig.
- Zeichenketten werden so verwendet, wie sie geschrieben sind: Es gibt kein Trimmen, und aufgezählte Werte unterscheiden Groß- und Kleinschreibung (`"holding"`, nicht `"Holding"`).
- JSON `null` ist für keinen Schlüssel ein gültiger Wert; lassen Sie den Schlüssel stattdessen weg.
- JSON kennt keine Kommentare. Hinweise zur ganzen Datei gehören in `notes`, ein Hinweis zu einem Register in dessen `comment`. Beides ist freier Text, den Werkzeuge anzeigen **MAY** und nicht interpretieren **MUST NOT**.
- Schreiber **SHOULD** das Layout aus §1 verwenden: Einrückung mit zwei Leerzeichen und eine Zeile pro Register und pro `enums`-/`sentinels`-Tabelle, sodass die Änderung eines Registers ein Unterschied von einer Zeile ist.
- `$schema` ist optional und verweist Editoren auf das JSON Schema. Leser **MUST** es ignorieren.

### 2.1 Ganzzahlen

Wo ein Wert eine **Ganzzahl** ist, **MAY** sie als JSON-Ganzzahl (`1040`) oder als Zeichenkette mit einer dezimalen Ganzzahl oder `0x`-Hex (`"0x0410"`) geschrieben werden. Zeichenketten behalten die Hex-Schreibweise, die Handbücher für Adressen und Bezeichner verwenden, und transportieren 64-Bit-Werte, die nicht jeder JSON-Parser exakt als Zahlen liest (jenseits von 2^53). Schlüssel von `enums`- und `sentinels`-Tabellen sind immer Zeichenketten, in denselben beiden Formen.

### 2.2 Tabellen

Eine **Tabelle** ordnet Rohwerten Beschriftungen zu: ein Objekt, dessen Schlüssel als Zeichenketten geschriebene Ganzzahlen (§2.1) und dessen Werte nicht leere Beschriftungen sind, z. B. `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Eine Tabelle hat mindestens einen Eintrag, und zwei Schlüssel **MUST NOT** denselben Wert bezeichnen (`"1"` und `"0x1"`).

## 3. Schlüssel der obersten Ebene

`mbmap`, `vendor`, `model` und `registers` sind erforderlich. Jeder andere Schlüssel ist optional; fehlt er, gilt der Standardwert.

| Key | JSON type | Default | Bedeutung |
|---|---|---|---|
| `mbmap` | integer `2` | | Formatversion (§3.1, §8) |
| `vendor` | non-empty string | | Hersteller |
| `model` | non-empty string | | Modell oder Modellfamilie, wie es Menschen angezeigt wird |
| `models` | array of non-empty strings | `[model]` | Jeder Modellname oder -code, für den die Map gilt (§3.2) |
| `vendor_website` | string: a domain or an `http(s)://` URL | | Website des Herstellers, z. B. `se.com` oder `https://www.se.com` |
| `description` | string | | Kurzbeschreibung |
| `revision` | integer ≥ 1 | | Revision des Inhalts dieser Map (§3.1) |
| `revised` | string `YYYY-MM-DD` | | Datum dieser Revision |
| `firmware` | string | | Freitext zur Firmware, für die die Map gilt |
| `firmware_min` | version string (§3.2) | | Älteste Firmware, für die die Map gilt |
| `firmware_max` | version string (§3.2) | | Neueste Firmware, für die die Map gilt |
| `source` | string | | Freitext-Zusammenfassung, woher die Map stammt |
| `sources` | array of source objects | | Dokumente, aus denen die Map erstellt oder gegen die sie geprüft wurde (§3.3) |
| `notes` | array of strings | | Freie Hinweise zur Datei |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transporte, die das Gerät unterstützt |
| `unit_id` | integer `0`–`255` | `1` | Standard-Unit- / Slave-ID |
| `port` | integer `1`–`65535` | `502` | Standard-TCP-Port |
| `baudrate` | integer | `9600` | Standard-RTU-Baudrate |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Standard-RTU-Parität |
| `databits` | `7`, `8` | `8` | Standard-RTU-Datenbits |
| `stopbits` | `1`, `2` | `1` | Standard-RTU-Stoppbits |
| `byte_order` | `"big"`, `"little"` | `"big"` | Standard-Bytereihenfolge innerhalb jedes Registers (§6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Standardreihenfolge der Register eines Mehrregisterwertes (§6) |
| `address_base` | `0`, `1` | `0` | Ob `address` bei 0 oder bei 1 beginnt (§5) |
| `max_read_registers` | integer `1`–`125` | `125` | Größter Block, den das Gerät pro Lesevorgang akzeptiert (FC03/04) |
| `max_read_bits` | integer `1`–`2000` | `2000` | Größter Block, den das Gerät pro Lesevorgang akzeptiert (FC01/02) |
| `enums` | object: name → table | | Benannte Übersetzungstabellen (§4.1). Namen verwenden `a`–`z`, `0`–`9` und `_` |
| `sentinels` | object: type → table | | Reservierte Rohwerte pro Ganzzahltyp (§4.2) |
| `identify` | object | | Wie die Geräteidentität mit Report Slave ID (FC17) oder Read Device Identification (FC43) gelesen wird (§4.8) |
| `registers` | array of register objects | | Die Register (§4) |

Verbindungswerte sind **Standardwerte**: Der Anwender kann sie beim Verbinden weiterhin ändern.

### 3.1 Formatversion und Map-Revision

Zwei Zahlen beschreiben eine Map, und sie ändern sich aus unterschiedlichen Gründen:

- **`mbmap`, die Formatversion**, gibt an, welcher Version dieser Spezifikation die Datei folgt, damit ein Leser weiß, ob er sie lesen kann (§8). Sie ist für jede nach dieser Spezifikation geschriebene Map gleich und ändert sich nur, wenn sich das Format ändert.
- **`revision`, die Map-Revision**, gibt an, welche Ausgabe des Inhalts dieser Map die Datei ist. Sie beginnt bei `1` und **SHOULD** mit jeder veröffentlichten Änderung um eins steigen, die beeinflusst, wie ein Gerät gelesen oder geschrieben wird: ein Register, ein Verbindungsstandard, eine Tabelle, ein Firmware-Bereich oder ein Modell. Sie **MAY** bei Änderungen nur an Freitext (`description`, `notes`, `comment`, `source`) gleich bleiben. `revised` gibt das Datum dieser Änderung an.

Ein Werkzeug, das zwei Kopien derselben Map hat (gleiches `vendor` und `model`), **SHOULD** die höhere `revision` als die neuere behandeln und **MAY** dem Anwender die neuere anbieten. Eine Map ohne `revision` lässt sich so nicht vergleichen. Die Revision ist nicht die Firmware-Version des Geräts: Firmware gehört in §3.2.

### 3.2 Modelle und Firmware

Eine Map gilt für die Modelle in `models` oder, wenn `models` fehlt, nur für `model`. `model` ist der Name, der Menschen angezeigt wird: ein Gerät oder der Familien- oder Serienname, wenn die Map mehrere abdeckt (`"PM5100 and PM5300 series"`), keine Geräteliste. `models` listet jeden Namen oder Code auf, den ein Gerät melden kann, damit ein Werkzeug ihn mit dem angeschlossenen Gerät vergleichen kann (§9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` und `firmware_max` geben an, für welche Firmware-Versionen die Map gilt. Beide sind optional: Ohne sie gilt die Map für jede Firmware, was auch die richtige Wahl ist, wenn die Version unbekannt ist. `firmware` bleibt für alles verfügbar, was ein Bereich nicht ausdrücken kann („2.x, außer 2.3 beta“).

Eine **Versionszeichenkette** besteht aus einer oder mehreren ganzen Zahlen, durch Punkte getrennt: `"2"`, `"2.1"`, `"1.02.7"`. Die Komponenten werden von links als Zahlen verglichen (`"1.10"` ist neuer als `"1.9"`, und `"1.02"` ist dasselbe wie `"1.2"`), schreiben Sie Versionen also so, wie das Gerät sie meldet. Eine Grenze umfasst jede Version, die mit ihr beginnt:

- `firmware_min` `"2.1"` schließt `2.1`, `2.1.4` und `3.0` ein, aber nicht `2.0.9`;
- `firmware_max` `"2"` schließt jede `2.x` und `2.x.y` ein, aber nicht `3.0`; `firmware_max` `"2.3"` schließt `2.3.7` ein, aber nicht `2.4`.

`"firmware_min": "1", "firmware_max": "2"` liest sich also „Firmware 1.x und 2.x“. `firmware_min` **MUST NOT** nach `firmware_max` liegen.

**Register, die von der Firmware abhängen.** Ein Register kann eigene `firmware_min` und `firmware_max` mit derselben Bedeutung tragen, wenn es nur in einigen Firmware-Versionen existiert. So bleibt es bei einer Datei für Firmware-Revisionen, die sich in wenigen Registern unterscheiden. Ein Register ohne sie gilt überall, wo die Map gilt. Zwei Register **MAY** einen `name` (und eine Adresse) teilen, wenn sich ihre Firmware-Bereiche nicht überschneiden: Das Werkzeug verwendet das zum Gerät passende.

Beispiel: Firmware 2.1 hat den Energiezähler verschoben und ein Leistungsfaktor-Register hinzugefügt:

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

Sind die Unterschiede groß (die meisten Adressen oder die Verbindungseinstellungen ändern sich), sind getrennte Dateien klarer: eine Map pro Firmware-Bereich, jede mit eigenen `firmware_min` und `firmware_max`.

### 3.3 Quellen

`sources` hält die Dokumente fest, aus denen eine Map erstellt oder gegen die sie geprüft wurde, damit ein Leser sie finden und erkennen kann, welche Ausgabe verwendet wurde. Jedes Element ist ein Objekt:

| Key | JSON type | Bedeutung |
|---|---|---|
| `title` | non-empty string, required | Dokumenttitel, z. B. `"EM530/EM540 Modbus communication protocol"` |
| `version` | string | Ausgabe oder Revision des Dokuments, wie darauf gedruckt |
| `date` | string `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | Veröffentlichungsdatum dieser Ausgabe |
| `url` | `http(s)://` URL | Wo das Dokument zu finden ist |
| `note` | string | Welcher Teil verwendet wurde oder wie die Map geprüft wurde (z. B. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | string `YYYY-MM-DD` | Wann das Dokument heruntergeladen oder gelesen wurde, da sich ein Dokument unter derselben URL ohne neue Version ändern kann |
| `sha256` | string of 64 hex digits | SHA-256 der verwendeten Datei, damit ein Leser erkennen kann, ob das Dokument unter `url` noch dasselbe ist |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` ist oben gekürzt dargestellt; in einer Datei sind es alle 64 Hex-Ziffern. Ein Werkzeug **MAY** es mit dem Dokument vergleichen, das es herunterlädt, und bei Abweichung warnen: Das Dokument wurde aktualisiert, und die Map muss möglicherweise erneut geprüft werden.

`source` bleibt eine einzeilige Freitext-Zusammenfassung für Menschen und für Maps, deren Quellen nicht in dieser Genauigkeit bekannt sind. Eine Map **MAY** beides haben.

## 4. Register

Jedes Element von `registers` ist ein Objekt. `name`, `area`, `address` und `type` sind erforderlich; jeder andere Schlüssel ist optional, und fehlt er, gilt der Standardwert.

| Key | JSON type | Default | Bedeutung |
|---|---|---|---|
| `name` | non-empty string | | Variablenname. **SHOULD** in der Datei eindeutig sein |
| `group` | string | | Freie Gruppierung zur Anzeige (z. B. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Modbus-Datenbereich (§5) |
| `address` | integer (§2.1) | | Adresse des ersten Registers / Bits (§5) |
| `type` | see §6 | | Datentyp |
| `length` | integer ≥ 1 | | Anzahl der Register. Für `string` erforderlich, sonst ignoriert |
| `bit` | integer `0`–`15` | | Für `bool` in `input`/`holding`: welches Bit des Registers, 0 = niedrigstwertig. Für ein `uint16`-Bitfeld: sein niedrigstes Bit |
| `bits` | integer `1`–`16` | | Für `uint16` in `input`/`holding`: Breite eines bei `bit` beginnenden Bitfelds (§4.3) |
| `scale` | number | `1` | Multiplikator |
| `scale_factor` | string: a register `name` | | Register, dessen Ganzzahlwert der Zehnerpotenz-Exponent für dieses ist (§4.4) |
| `offset` | number | `0` | Wird nach der Skalierung addiert |
| `unit` | string | | Technische Einheit (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Erlaubte Operationen |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | Überschreibt den Dateistandard für dieses Register (§6) |
| `word_order` | `"big"`, `"little"` | file `word_order` | Überschreibt den Dateistandard für dieses Register (§6) |
| `write_min` | number | | Kleinster beim Schreiben akzeptierter Wert, in technischen Einheiten (§4.5) |
| `write_max` | number | | Größter beim Schreiben akzeptierter Wert, in technischen Einheiten (§4.5) |
| `enum` | string (a name in `enums`) or table | | Beschriftungen für Ganzzahl- oder Bool-Werte (§4.1) |
| `reference` | see §4.6 | | Rohwert, den dieses Register bei einem gesunden Gerät enthalten soll |
| `firmware_min` | version string (§3.2) | | Älteste Firmware, die dieses Register hat |
| `firmware_max` | version string (§3.2) | | Neueste Firmware, die dieses Register hat |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Dieses Register identifiziert das Gerät (§4.7) |
| `read_alone` | boolean | `false` | Das Register wird in einer eigenen Anfrage gelesen (§4.9) |
| `read_group` | non-empty string | | Das Register wird nur zusammen mit Registern derselben Gruppe gelesen (§4.9) |
| `parts` | array of objects | | Benennt die Werte innerhalb eines Blockregisters, damit ein Werkzeug sie einzeln anzeigen und bearbeiten kann (§4.10) |
| `description` | string | | Freitext |
| `comment` | string | | Freier Hinweis zum Register für Menschen, die die Map bearbeiten |

Technischer Wert = roh × 10^`scale_factor` × `scale` + `offset` (ohne `scale_factor`: roh × `scale` + `offset`). Beim Schreiben wendet ein Werkzeug die Umkehrung an und rundet bei Ganzzahltypen auf die nächste Ganzzahl.

### 4.1 Übersetzungstabellen

Viele Register enthalten eine Zahl, die für einen Zustand steht: `0` ist gestoppt, `1` ist Leerlauf, `2` ist Start und so weiter. `enum` verwandelt diese Zahlen in Beschriftungen. Es ist entweder:

- **eine im Register geschriebene Tabelle**: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **der Name einer Tabelle** im obersten `enums`, sodass dieselbe Liste für jedes Register, das sie verwendet, nur einmal geschrieben wird:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Werte werden mit dem **Rohwert** vor `scale` und `offset` verglichen. Ein Wert, der nicht in der Tabelle steht, wird als einfache Zahl angezeigt. Werkzeuge **SHOULD** beim Schreiben die Beschriftungen anbieten.

### 4.2 Sentinel-Werte

Manche Geräte antworten statt mit einem Messwert mit einem reservierten Rohwert: Ein Wert bedeutet „nicht implementiert“, ein anderer „außerhalb des Bereichs“, ein weiterer „Sensorfehler“. `sentinels` deklariert sie für jedes Register eines Typs:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- Die Schlüssel von `sentinels` sind `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Eine Tabelle gilt für jedes Register dieses Typs.
- Werte **MUST** in den Typ passen und werden mit dem **Rohwert** vor `scale` und `offset` verglichen.
- Stimmt ein Messwert überein, **SHOULD** Werkzeuge die Beschriftung statt einer Zahl anzeigen und ihn **SHOULD NOT** als Messung behandeln (in Diagrammen, Grenzwerten oder Mittelwerten).
- Eine `enum`-Beschriftung für denselben Rohwert hat Vorrang vor dem Sentinel.

### 4.3 Bitfelder

Manche Geräte packen mehrere kleine Werte in ein Register, zum Beispiel vier 4-Bit-Alarmcodes. Ein `uint16`-Register mit `bit` und `bits` liest einen davon: Rohwert = (Register >> `bit`) & (2^`bits` − 1). `bit` + `bits` **MUST NOT** 16 überschreiten.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Register, die verschiedene Felder desselben Registers lesen, überschneiden sich nicht. Beim Schreiben eines Feldes **SHOULD** das Register gelesen, nur die Bits des Feldes geändert und das Register zurückgeschrieben werden.

### 4.4 Skalierungsfaktoren

Manche Geräte, insbesondere SunSpec-Wechselrichter und -Zähler, senden für einen Wert statt einer festen Skalierung ein eigenes Exponentenregister: Der Wert ist roh × 10^Exponent, und der Exponent kann sich mit dem Bereich des Geräts ändern. `scale_factor` benennt dieses Exponentenregister:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- Das benannte Register **MUST** ein Register derselben Datei mit einem Ganzzahltyp (`int16` … `uint64`) und ohne `bits` sein und **MUST NOT** selbst einen `scale_factor` haben. Teilen mehrere Register den Namen, zählt das erste.
- Nur numerische Typen können einen `scale_factor` haben (nicht `bool` oder `string`).
- Ein Werkzeug liest das Exponentenregister zusammen mit dem Wert, auch wenn der Anwender es nicht anzeigen wollte. Kann der Exponent nicht gelesen werden oder ist er ein Sentinel (§4.2, z. B. `-32768` bei SunSpec = nicht implementiert), ist der Wert nicht verfügbar.
- Beim Schreiben liest ein Werkzeug zuerst den Exponenten und wendet die Umkehrung an.

### 4.5 Schreibgrenzen

`write_min` und `write_max` deklarieren, welche Werte ein Register beim Schreiben akzeptiert, damit ein Werkzeug einen ungültigen Wert abweisen kann, bevor er das Gerät erreicht.

- Beide sind Zahlen in **technischen Einheiten**: der Wert, den der Anwender sieht, nachdem `scale_factor`, `scale` und `offset` angewendet wurden. Eine Grenze von `0.5` bei einem Register mit `scale` `0.1` bedeutet einen Rohwert von 5.
- Jede kann weggelassen werden: Eine fehlende Grenze lässt diese Seite offen. Fehlen beide, hat ein Register keine deklarierte Grenze (das Gerät entscheidet).
- `write_min` **MUST NOT** größer als `write_max` sein. Die Grenzen sind inklusiv.
- Ein Werkzeug **MUST NOT** einen Schreibvorgang senden, dessen technischer Wert unter `write_min` oder über `write_max` liegt, und **SHOULD** dem Anwender sagen, welche Grenze überschritten wurde.
- Sie gelten für den vom Anwender gewünschten Wert, bevor er in einen Rohwert umgewandelt und gerundet wird. Ein Wert innerhalb der Grenzen, der trotzdem nicht in den Typ des Registers passt, wird von den normalen Typprüfungen abgelehnt.
- Für `bool`- und `string`-Register oder Register, die nicht geschrieben werden können (`access` `"R"`), haben sie keine Bedeutung und werden dort ignoriert.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Referenzwerte

`reference` gibt einen Wert an, den ein gesundes Gerät bekanntermaßen in diesem Register hält (eine Modellnummer, eine feste Protokollkennung, einen Herstellercode). Ein Werkzeug kann das Register lesen und mit der Referenz vergleichen, um eine falsche Adresse, Basis, Bytereihenfolge oder einen falschen Datentyp zu erkennen, bevor der Anwender den übrigen Werten vertraut. Nicht jedes Gerät hat ein solches Register, daher haben die meisten Register keine `reference`.

- Es ist der **Rohwert** vor `scale_factor`, `scale` und `offset`, im JSON-Typ dieses Wertes: eine Ganzzahl (§2.1) für die Ganzzahltypen und Bitfelder, eine Zahl für `float32` und `float64`, `true` / `false` für `bool`, eine Zeichenkette für `string`. Er **MUST** in den Typ passen (und in die Breite eines Bitfelds oder `2 × length` Zeichen für eine Zeichenkette).
- Die Prüfung ist das Register selbst: Ein Werkzeug liest dessen `area` und `address` (bereits um `address_base` angepasst) und dekodiert dessen `type` mit Byte- und Wortreihenfolge.
- Eine Map kann beliebig viele Register mit einer `reference` haben.
- Ergebnis jeder Prüfung: **match** (der dekodierte Rohwert entspricht der Referenz), **mismatch** (er weicht ab), **failed** (das Lesen lieferte einen Fehler oder lief in einen Timeout, also ist nichts bekannt), **not checked** (das Register wurde nicht gelesen). Ein Werkzeug **SHOULD** sie getrennt melden: Ein mismatch weist auf eine falsche Map oder falsche Einstellungen hin, ein failed auf ein Verbindungs- oder Adressierungsproblem.
- Floats werden mit der eigenen Genauigkeit des Typs verglichen (eine `float32`-Referenz wird als 32-Bit-Float verglichen). Zeichenketten werden nach dem Abschneiden von NUL- und Leerzeichen am Ende verglichen.
- Eine Referenz stützt nur eine Diagnose. Mehrere Byte- oder Wortreihenfolgen können dieselben Bytes zum selben Wert dekodieren (eine kleine Zahl oder ein Palindrom liest sich in mehr als einer Reihenfolge gleich), daher beweist eine Übereinstimmung nicht, dass die ganze Map stimmt. Maps **SHOULD** einen unterscheidbaren Wert verwenden und **SHOULD** mehr als einen angeben, wo das Gerät mehrere hat.
- Eine `reference` bei einem Register, das nicht gelesen werden kann (`access` `"W"`), ist ein Fehler.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Identitätsregister

`role` kennzeichnet die Register, die verraten, welches Gerät angeschlossen ist, damit ein Werkzeug die Map dagegen prüfen kann (§9):

- **`"model"`**: Modellname oder -code des Geräts. Sein Wert oder, wenn es eine hat, seine `enum`-Beschriftung wird mit `models` verglichen. Ein numerischer Modellcode erhält am besten eine Beschriftung: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: die Firmware-Version. Ein String-Register wird als Text gelesen, und die erste darin enthaltene Versionszeichenkette wird verwendet (`"V2.01b"` ergibt `2.01`). Eine Zahl ergibt ihren technischen Wert (`102` mit `scale` `0.01` ergibt `1.02`). Haben mehrere Register diese Rolle, werden ihre Werte in der Reihenfolge der Datei mit Punkten verbunden, was zu Geräten passt, die Haupt- und Nebenversion getrennt halten, zum Beispiel als zwei Bitfelder eines Registers (`"bit": 8, "bits": 8` und `"bit": 0, "bits": 8`).
- **`"serial"`**: die Seriennummer. Werkzeuge **MAY** sie anzeigen; sie wird nie verglichen.

Höchstens ein Register **MAY** die Rolle `"model"` und höchstens eines `"serial"` haben. Ein Register mit einer Rolle **MUST** lesbar sein. Register mit Rolle sind sonst gewöhnliche Register: Sie werden wie die anderen gelesen und angezeigt und können auch eine `reference` haben.

### 4.8 Identität vom Gerät (FC17, FC43)

Manche Geräte melden mit einer eigenen Funktion, was sie sind, und haben kein Identitätsregister. `identify` gibt an, welche Funktion zu senden ist und wo in der Antwort die Identität steht, damit ein Werkzeug die Map wie bei den Registern aus §4.7 prüfen kann (§9). Eine Map hat höchstens ein `identify`.

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

| Key | JSON type | Default | Bedeutung |
|---|---|---|---|
| `function` | `17` or `43` | | `17`: Report Slave ID. `43`: Read Device Identification (Encapsulated Interface Transport, MEI-Typ `0x0E`) |
| `fields` | non-empty array of field objects | | Die Werte, die der Antwort zu entnehmen sind |

Jedes Feld ist ein Objekt. `name` ist immer erforderlich. `role` und die folgenden Schlüssel hängen von `function` ab.

| Key | JSON type | Default | Bedeutung |
|---|---|---|---|
| `name` | non-empty string | | Name, der Menschen angezeigt wird |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Bedeutung des Wertes, wie bei Registern (§4.7). Höchstens ein `"model"` und ein `"serial"` |
| `offset` | integer ≥ 0 | | **Nur FC17, erforderlich.** Position des Feldes in Bytes in den Daten der Antwort. Offset `0` ist das erste Byte nach der Byteanzahl, die Daten sind also die Bytes, die ein Gerät in seinem Handbuch nach „byte count“ aufführt |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Nur FC17, erforderlich.** `uint16` ist Big-Endian. `string` ist ASCII, mit abgeschnittenen NUL- und Leerzeichen am Ende |
| `length` | integer ≥ 1 | | **Nur FC17.** Länge in Bytes. Für `string` erforderlich |
| `enum` | table name or inline table | | **Nur FC17.** Übersetzt eine Zahl in eine Beschriftung (§4.1). Ein Modellcode erhält am besten eine Beschriftung, die dann mit `models` verglichen wird |
| `object` | integer 0–255 | | **Nur FC43, erforderlich.** Objekt-ID: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` vom Gerät definiert |

- **FC43:** Der Wert eines Objekts ist eine ASCII-Zeichenkette, mit abgeschnittenen NUL- und Leerzeichen am Ende. Ein Werkzeug fordert die Zugriffsstufe (basic, regular oder extended) an, die jedes von den Feldern benannte Objekt einschließt, und folgt dem „more follows“-Flag, bis es sie alle hat. Für `"firmware"` wird die erste Versionszeichenkette im Text verwendet, wie bei einem String-Register (§4.7).
- **Beide Funktionen:** Ein Gerät antwortet auf einer Unit-ID, nicht auf einer Registeradresse, daher gilt `address_base` nicht.
- **Kein Wert:** Eine Antwort, die kürzer ist, als ein Feld braucht, eine Exception-Antwort, ein fehlendes Objekt oder ein Gerät, das die Funktion nicht unterstützt, liefern keinen Wert. Die Prüfung ist **unknown** (§9), kein mismatch.
- **Mehrere Quellen:** `identify` und Register mit `role` können beide vorhanden sein. Liefern beide einen Wert für dieselbe Rolle, **SHOULD** ein Werkzeug die Register verwenden und **MAY** `identify` für die Rollen verwenden, die kein Register liefert.

### 4.9 Lesen in getrennten Anfragen

Ein Leser verbindet benachbarte Register normalerweise zu einer Anfrage. Manche Geräte lehnen eine Anfrage ab, die die Grenze zwischen zwei internen Tabellen überschreitet, obwohl jedes darin enthaltene Register existiert. Zwei optionale Schlüssel begrenzen, wie Register verbunden werden:

- **`read_alone`**: `true` bedeutet, das Register wird in einer Anfrage gelesen, die kein anderes Register enthält. Bitfelder und andere Register, die dieselben Wörter belegen, zählen als dasselbe Register.
- **`read_group`**: ein Name. Register mit demselben Namen **MAY** in einer Anfrage gelesen werden, und eine Anfrage **MUST NOT** Register verschiedener Gruppen oder ein Register ohne Gruppe enthalten. Register ohne `read_group` werden wie bisher verbunden.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Sind beide Schlüssel vorhanden, gewinnt `read_alone`. Die Schlüssel begrenzen nur das Verbinden: Ein Leser darf mehr Anfragen als nötig stellen, und `max_read_registers` und `max_read_bits` gelten weiterhin. Sie betreffen nur, wie die Register angefordert werden, nicht was sie bedeuten, daher liest ein Leser, der sie nicht kennt, dieselben Register, verbunden wie immer. Deshalb brauchen sie keine neue `mbmap`-Version (§8): Auf einem Gerät, das die verbundene Anfrage ablehnt, scheitert ein älterer Leser genau wie ohne die Schlüssel.

### 4.10 Teile eines Blocks

Manche Geräte halten mehrere Werte in einem Block und akzeptieren nur den Block als Ganzes: Ein Schreibvorgang, der mitten darin beginnt oder ihn nicht abdeckt, wird abgelehnt (Exception `0x02` oder `0x03`). Ein typischer Fall ist ein SMS-Gateway, dessen Block die Nummer des Empfängers gefolgt vom Nachrichtentext enthält. Die Map beschreibt diesen Block wie bisher als **ein** Register, und `parts` sagt, was darin steckt:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Key | JSON type | Default | Bedeutung |
|---|---|---|---|
| `name` | non-empty string | | Name, der Menschen angezeigt wird |
| `offset` | integer ≥ 0 | | Position des Teils im Block, in **Registern** ab dem ersten Register des Registers |
| `type` | `"string"` or a numeric type (§6) | `"string"` | Wie der Teil gelesen und geschrieben wird |
| `length` | integer ≥ 1 | | Anzahl der Register. Für `string` erforderlich, bei den anderen Typen ignoriert |
| `description` | string | | Freitext |

- `parts` gibt es nur für ein `string`-Register. Es **MUST NOT** leer sein. Jeder Teil **MUST** im Block liegen (`offset` plus seine Register höchstens die `length` des Registers), und Teile **MUST NOT** sich überschneiden. Register, die kein Teil abdeckt, sind erlaubt: Sie sind Füllung.
- Das Register selbst behält seine Bedeutung. Ein Leser, der `parts` nicht kennt, liest und schreibt den ganzen Block wie bisher als eine Zeichenkette in einer Anfrage, sodass eine solche Map in jedem Werkzeug weiter funktioniert.
- Ein Werkzeug, das `parts` kennt, **SHOULD** jeden Teil als eigenes Feld anzeigen. Zum Lesen dekodiert es jeden Teil aus dem Block, mit `byte_order` und `word_order` des Registers (§6). Zum Schreiben baut es den **ganzen** Block aus den Teilen und sendet ihn in einer Anfrage (FC16): Ein vom Anwender leer gelassener Teil wird als Nullbytes gesendet, sodass ein leeres Feld nie versehentlich einen alten Wert behält. Ein Werkzeug **MUST NOT** einen Schreibvorgang senden, der nur einige Teile abdeckt, da das Gerät ihn ablehnt.
- Ein `string`-Teil ist ASCII, mit NUL-Zeichen bis zu seiner `length` aufgefüllt. Das Werkzeug **MUST** einen Text ablehnen, der länger als `2 × length` Zeichen ist. Ein numerischer Teil wird wie üblich kodiert (§6).
- `access` ist das des Registers: Teile können nicht stärker beschreibbar sein als der Block.
- `parts` beschreibt nur, was in einem Register steckt, und braucht daher keine neue `mbmap`-Version (§8). Leser, die es ignorieren, verhalten sich wie bisher.

## 5. Bereiche und Adressen

| `area` | Einheit | Lesen | Schreiben | Erlaubter `access` |
|---|---|---|---|---|
| `coil` | Bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | Bit | FC02 | — | `R` |
| `input` | 16-Bit-Register | FC04 | — | `R` |
| `holding` | 16-Bit-Register | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Bei `address_base` `0` ist `address` die auf die Leitung gesendete Adresse (0–65535). Bei `address_base` `1` ist die Adresse auf der Leitung `address − 1` (1–65536), was zu Handbüchern passt, die Register ab 1 nummerieren.

Die 5- und 6-stellige „Modicon“-Schreibweise (`40001`, `300010`) ist in `address` **nicht** gültig. Schreiben Sie sie als Bereich plus Nummer: `40001` wird zu `"area": "holding"`, `"address": 1` mit `"address_base": 1`.

## 6. Typen, Bytereihenfolge und Wortreihenfolge

| `type` | Register | Hinweise |
|---|---|---|
| `bool` | — | In `coil`/`discrete`: ein Bit. In `input`/`holding`: ein Bit eines Registers, daher ist `bit` erforderlich |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Floats sind IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 ASCII-Zeichen pro Register. NUL- und Leerzeichen am Ende werden beim Lesen abgeschnitten |

Zwei unabhängige Einstellungen bestimmen, wie die Bytes eines Wertes ankommen:

- **`byte_order`**, innerhalb jedes 16-Bit-Registers: `"big"` sendet das höhere Byte zuerst (der Modbus-Standard), `"little"` das niedrigere zuerst.
- **`word_order`**, über die Register eines 32-Bit- oder 64-Bit-Wertes: `"big"` stellt das höchstwertige Register zuerst (an die niedrigste Adresse), `"little"` das niedrigstwertige Register zuerst.

Die Schlüssel der obersten Ebene legen den Standard der Datei fest; `byte_order` und `word_order` eines Registers überschreiben ihn jeweils für sich (ein Register, das nur `"word_order": "little"` setzt, behält die Bytereihenfolge der Datei).

| Typ | `byte_order` | `word_order` |
|---|---|---|
| `bool` | nicht verwendet | nicht verwendet |
| `int16`, `uint16` | vertauscht die beiden Bytes des Registers | nicht verwendet (ein Register) |
| `int32`, `uint32`, `float32` | vertauscht die beiden Bytes jedes Registers | entscheidet, welches der 2 Register das höhere Wort ist |
| `int64`, `uint64`, `float64` | vertauscht die beiden Bytes jedes Registers | `"little"` kehrt die 4 Register als Ganzes um |
| `string` | `"big"`: das erste empfangene Byte ist das erste Zeichen; `"little"`: das zweite empfangene Byte ist das erste Zeichen | nicht verwendet (Register werden in Adressreihenfolge gelesen) |

Bei 64-Bit-Werten kehrt die Little-Wortreihenfolge die ganze Folge der vier Register um; sie vertauscht nicht zwei 32-Bit-Hälften getrennt.

Reihenfolge des 32-Bit-Wertes `0x0A0B0C0D` auf der Leitung:

| `byte_order` | `word_order` | Bytes auf der Leitung | Gängiger Name |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Modbus-Standard |
| `big` | `little` | `0C 0D 0A 0B` | „Wortvertauschung“, von vielen Zählern und SPSen verwendet |
| `little` | `big` | `0B 0A 0D 0C` | „Bytevertauschung“ (selten) |
| `little` | `little` | `0D 0C 0B 0A` | Little-Endian |

## 7. Validierung

Leser **SHOULD** jedes Problem mit einem der folgenden Codes und einem [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) auf den Wert melden (`/registers/3/address`, `/enums/relay`), damit sich Werkzeuge einig sind, was falsch ist. Probleme, die die ganze Datei betreffen, haben keinen Pointer. Ein **error** macht die Datei ungültig. Eine **warning** wird gemeldet, aber die Datei bleibt nutzbar.

| Code | Severity | Wann |
|---|---|---|
| `not-utf8` | error | Die Datei ist kein gültiges UTF-8 |
| `not-json` | error | Die Datei ist nicht ein gültiges JSON-Objekt oder wiederholt einen Schlüssel in einem Objekt. Für die ganze Datei gemeldet: Parser setzen Syntaxfehler an unterschiedliche Positionen, daher steht die Position in der Meldung |
| `bad-json-type` | error | Ein bekannter Schlüssel hat den falschen JSON-Typ (eine Zeichenkette, wo eine Zahl erwartet wird, `null`, …) |
| `missing-key` | error | `mbmap`, `vendor`, `model` oder `registers` fehlt (für die ganze Datei), oder einem Register fehlt `name`, `area`, `address` oder `type` oder es ist leer (beim Register) |
| `bad-meta-value` | error | Ein Schlüssel der obersten Ebene hat einen Wert außerhalb seiner erlaubten Menge oder seines Bereichs, einschließlich eines anderen `mbmap` als `2` |
| `bad-area` | error | Unbekannter `area` oder nicht kleingeschrieben |
| `bad-type` | error | Unbekannter `type` oder nicht kleingeschrieben |
| `type-area` | error | Ein anderer Typ als `bool` in `coil` oder `discrete` |
| `bad-address` | error | `address` ist keine Ganzzahl |
| `address-range` | error | Die Adresse liegt unter `address_base`, oder der Wert geht über Adresse 65535 hinaus |
| `missing-bit` | error | `bool` in `input`/`holding` ohne `bit` |
| `bad-bit` | error | `bit` außerhalb von `0`–`15` |
| `missing-length` | error | `string` ohne `length` |
| `bad-length` | error | `length` ist keine Ganzzahl ≥ 1 |
| `bad-access` | error | Unbekannter `access` (oder nicht großgeschrieben) oder für den `area` nicht erlaubt |
| `bad-byte-order` | error | `byte_order` oder `word_order` eines Registers ist nicht `"big"` oder `"little"` |
| `bad-enum` | error | Eine Enum-Tabelle (§2.2) hat einen Schlüssel, der keine Ganzzahl ist, eine leere Beschriftung, einen wiederholten Wert oder keine Einträge, oder ein `enums`-Name besteht nicht aus `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` nennt einen nicht unterstützten Typ, oder eine Tabelle ist ungültig (§2.2) oder hat einen Wert, der nicht in den Typ passt |
| `bad-bits` | error | `bits` ist keine Ganzzahl von 1 bis 16, wird bei einem anderen Typ als `uint16` oder außerhalb von `input`/`holding` verwendet, hat kein `bit`, oder `bit` + `bits` übersteigt 16 |
| `unknown-enum` | error | `enum` nennt eine Tabelle, die `enums` nicht definiert |
| `bad-write-limit` | error | `write_min` ist größer als `write_max` |
| `bad-reference` | error | `reference` ist kein gültiger Rohwert für den `type` des Registers (keine Ganzzahl, außerhalb des Typbereichs, breiter als das Bitfeld, kein Boolean bei `bool`, keine endliche Zahl bei Floats, länger als die Zeichenkette), oder bei einem Register gesetzt, das nicht gelesen werden kann |
| `unknown-scale-factor` | error | `scale_factor` nennt kein Register der Datei (Register mit Fehlern zählen nicht) |
| `bad-scale-factor` | error | `scale_factor` ist bei `bool` oder `string` gesetzt oder nennt ein Register, das keine ganze Zahl ist (ein Float, `bool`, `string` oder Bitfeld) oder selbst einen `scale_factor` hat |
| `bad-version` | error | `firmware_min` oder `firmware_max`, in der Datei oder einem Register, ist keine Versionszeichenkette (§3.2) |
| `bad-firmware-range` | error | `firmware_min` liegt nach `firmware_max`, in der Datei oder einem Register |
| `bad-source` | error | Ein Element von `sources` ist kein Objekt mit nicht leerem `title` oder hat `version`, `date`, `url`, `note`, `accessed` oder `sha256` in falscher Form |
| `bad-role` | error | `role` ist nicht `"model"`, `"firmware"` oder `"serial"`, ist bei einem nicht lesbaren Register gesetzt, oder `"model"` oder `"serial"` wird mehr als einmal verwendet |
| `bad-identify` | error | `identify` ist ungültig (§4.8): `function` ist nicht `17` oder `43`, `fields` ist leer, oder einem Feld fehlt `name`, es hat eine unbekannte oder für `"model"` oder `"serial"` wiederholte `role` oder verletzt die Regeln seiner Funktion (FC17: `offset` fehlt oder ist negativ, `type` fehlt oder ist unbekannt, `string` ohne `length`, ein `enum`, das keine Tabelle nennt oder keine gültige Tabelle ist, ein `object`; FC43: `object` fehlt oder liegt außerhalb von 0–255, ein `offset`, `type`, `length` oder `enum`) |
| `bad-parts` | error | `parts` ist leer, ist bei einem Register gesetzt, das kein `string` mit gültiger `length` ist, oder ein Teil hat kein `name` oder `offset`, einen negativen `offset`, einen unbekannten oder `bool`-`type`, ein `string`-Teil hat keine `length`, ein Teil geht über den Block hinaus oder Teile überschneiden sich (§4.10) |
| `no-rows` | warning | `registers` ist leer |
| `duplicate-name` | warning | Ein `name` wird mehrfach von Registern verwendet, deren Firmware-Bereiche sich überschneiden (§3.2) |
| `model-list` | warning | `model` listet Geräte durch „ / “ getrennt auf; geben Sie den Familiennamen an und listen Sie die Geräte in `models` (§3.2) |
| `overlap` | warning | Ein Wert beginnt innerhalb der Register eines anderen Wertes im selben Bereich, was meist eine falsche Adresse oder einen falschen Typ bedeutet. Register, die an derselben Adresse beginnen, sind alternative Lesarten derselben Daten (zum Beispiel ein Code, der als Zahl und als Text gelesen wird) und zählen nie als Überschneidung; ebenso wenig Bits und Bitfelder eines Registers (`bool` + `bit`, `uint16` + `bit` + `bits`) oder Register, deren Firmware-Bereiche sich nicht überschneiden |
| `firmware-outside-map` | warning | Der Firmware-Bereich eines Registers hat keine Version mit dem der Datei gemeinsam, daher gilt er nie |
| `bad-read` | error | `read_group` ist eine leere Zeichenkette |
| `unknown-key` | warning | Ein Register hat einen Schlüssel, der nicht in dieser Spezifikation steht und nicht mit `x_` beginnt |
| `unused-write-limit` | warning | `write_min` oder `write_max` ist bei einem Register gesetzt, wo es keine Wirkung hat (`bool`, `string` oder `access` `"R"`) |
| `unused-bit` | warning | `bit` ist bei einem Register gesetzt, wo es keine Wirkung hat (jeder Typ außer `bool`, es sei denn, bei einem `uint16` ist auch `bits` gesetzt) |

Ein Register mit einem Fehler in `name`, `area`, `address` oder `type` wird nicht weiter geprüft. Ein Register mit irgendeinem Fehler bleibt von der `overlap`-Prüfung ausgenommen.

Das [JSON Schema](schema/mbmap-2.schema.json) prüft die Struktur, die JSON-Typen und die Wertebereiche; die Regeln, die mehrere Werte verknüpfen (`unknown-enum`, Skalierungsfaktoren, `overlap`, `address-range`, `bad-reference` nach Typ, doppelte Schlüssel), brauchen Code. Der Ordner [`tests/`](tests/) enthält Beispieldateien mit den Diagnosen, die jede liefern muss, sodass jede Implementierung sich daran prüfen kann.

## 8. Kompatibilität und Versionierung

- Leser **MUST** Schlüssel ignorieren, die sie nicht kennen, auf der obersten Ebene und in Registern. So lassen sich neuere Dateien in älteren Lesern öffnen.
- Hersteller- oder werkzeugspezifische Schlüssel **SHOULD** mit `x_` beginnen (`"x_modbench_icon"`, `"x_alarm_high"`), damit sie nie mit künftigen Versionen dieser Spezifikation kollidieren. Ihre Werte **MAY** von beliebigem JSON-Typ sein.
- `mbmap` ist die **Haupt**version. Ein Leser **MUST** eine Datei ablehnen, deren `mbmap` er nicht unterstützt, und **SHOULD** sagen, welche Version er gefunden hat.
- Neue optionale Schlüssel, die ältere Leser gefahrlos ignorieren können, werden hinzugefügt, ohne `mbmap` zu ändern. Ein Schlüssel, dessen Bedeutung ein älterer Leser falsch verstehen würde, wenn er ihn ignoriert, braucht eine neue Hauptversion.
- Die Schemadatei ist nach der Hauptversion benannt (`mbmap-2.schema.json`) und erhält darin nur optionale Schlüssel.

## 9. Eine Map gegen das angeschlossene Gerät prüfen

Ein Werkzeug, das die Identitätsregister (§4.7) oder die von `identify` (§4.8) beschriebene Identitätsantwort des angeschlossenen Geräts liest, **SHOULD** sie mit der Map vergleichen, damit der Anwender keinen Werten einer für ein anderes Modell oder eine andere Firmware geschriebenen Map vertraut. Es kann dem Anwender auch erlauben, Modell oder Firmware von Hand anzugeben, wenn das Gerät sie nicht meldet.

Jede Prüfung hat eines von drei Ergebnissen:

| Ergebnis | Modell | Firmware |
|---|---|---|
| **match** | Das Modell des Geräts, ohne Groß-/Kleinschreibung und umgebende Leerzeichen verglichen, ist eines von `models` (oder `model`) | Die Version des Geräts liegt innerhalb von `firmware_min` … `firmware_max` |
| **mismatch** | Ist es nicht | Sie liegt außerhalb des Bereichs |
| **unknown** | Die Map hat kein `"model"`-Register, es konnte nicht gelesen werden oder es lieferte keinen Wert | Die Map hat kein `"firmware"`-Register, es konnte nicht gelesen werden, darin wurde keine Versionszeichenkette gefunden, oder die Map deklariert keinen Bereich |

Was ein Werkzeug mit jedem Ergebnis tut:

- **match**: nichts zu melden; das Werkzeug **MAY** anzeigen, dass das Gerät erkannt wurde.
- **mismatch**: Das Werkzeug **SHOULD** deutlich warnen, indem es sagt, was die Map erwartet und was das Gerät gemeldet hat, und **SHOULD** vor dem ersten Schreibvorgang auf das Gerät um Bestätigung bitten. Es **MUST NOT** deshalb das Lesen abbrechen: Lesen ist harmlos, und der Anwender weiß es vielleicht besser (ein umetikettiertes Gerät, eine neuere Firmware mit denselben Registern).
- **unknown**: kein Problem. Die meisten Geräte melden kein Modell und keine Firmware, und die meisten Maps gelten für jede Firmware. Das Werkzeug **MUST NOT** es als mismatch behandeln und **MAY** erwähnen, dass die Map einen Firmware-Bereich deklariert, der nicht geprüft werden konnte.

Register mit eigenem Firmware-Bereich (§3.2):

- Ist die Firmware **bekannt**, **SHOULD** ein Werkzeug nur die Register verwenden, deren Bereich sie einschließt: Die anderen existieren auf diesem Gerät nicht, und ein von mehreren Firmware-Bereichen geteilter Registername bedeutet dann ein Register.
- Ist die Firmware **unbekannt**, **SHOULD** ein Werkzeug jedes Register lesen und **SHOULD** zeigen, welche von der Firmware abhängen (zum Beispiel „Firmware 2.1 und neuer“), und **MAY** den Anwender die Version wählen lassen.

Eine Map ohne `models`, `firmware_min`, `firmware_max` und Identitätsregister wird gegen nichts geprüft, was für eine Map richtig ist, die für jedes Gerät ihres Modells gilt.

## 10. Ältere Dateien

Version 1 des Formats, auf CSV beruhend, ist veraltet. Neue Leser müssen sie nicht unterstützen; Dateien in diesem Format lassen sich mit [`tools/migrate/migrate.py`](tools/migrate/migrate.py) umwandeln (siehe [legacy/v1](legacy/v1/)).
