# `.mbmap` — Modbus Map format, version 2

A `.mbmap.json` file describes the Modbus register map of one device model: who makes it, how to talk to it, and what every register means. It is a JSON document, so any language can read it with its standard JSON parser, and a [JSON Schema](schema/mbmap-2.schema.json) describes its structure.

The key words **MUST**, **SHOULD** and **MAY** are used as in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## 1. Example

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

A complete example is in [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. File

- A map is one JSON object ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), encoded as UTF-8. Readers **MUST** accept and ignore a leading BOM. Writers **SHOULD NOT** write one.
- The file name ends in `.mbmap.json`.
- An object **MUST NOT** repeat a key. JSON parsers handle duplicate keys differently, so a file with one is invalid.
- Strings are used as written: there is no trimming, and enumerated values are case-sensitive (`"holding"`, not `"Holding"`).
- JSON `null` is not a valid value for any key; leave the key out instead.
- JSON has no comments. Notes about the whole file go in `notes`, a note about one register in its `comment`. Both are free text that tools **MAY** show and **MUST NOT** interpret.
- Writers **SHOULD** use the layout of §1: two-space indentation, and one line per register and per `enums`/`sentinels` table, so that a change to one register is a one-line diff.
- `$schema` is optional and points editors to the JSON Schema. Readers **MUST** ignore it.

### 2.1 Integers

Where a value is an **integer**, it **MAY** be written as a JSON integer (`1040`) or as a string holding a decimal integer or `0x` hex (`"0x0410"`). Strings keep the hex spelling that manuals use for addresses and identifiers, and carry 64-bit values that not every JSON parser reads exactly as numbers (beyond 2^53). Keys of `enums` and `sentinels` tables are always strings, in the same two forms.

### 2.2 Tables

A **table** maps raw values to labels: an object whose keys are integers written as strings (§2.1) and whose values are non-empty labels, e.g. `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. A table has at least one entry, and two keys **MUST NOT** stand for the same value (`"1"` and `"0x1"`).

## 3. Top-level keys

`mbmap`, `vendor`, `model` and `registers` are required. Every other key is optional; when it is missing, the default applies.

| Key | JSON type | Default | Meaning |
|---|---|---|---|
| `mbmap` | integer `2` | | Format version (§8) |
| `vendor` | non-empty string | | Manufacturer |
| `model` | non-empty string | | Model or model family |
| `vendor_website` | string: a domain or an `http(s)://` URL | | Manufacturer's website, e.g. `se.com` or `https://www.se.com` |
| `description` | string | | Short description |
| `firmware` | string | | Firmware version(s) the map applies to |
| `source` | string | | Document the map was built from (manual name, version, URL) |
| `notes` | array of strings | | Free notes about the file |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transports the device supports |
| `unit_id` | integer `0`–`255` | `1` | Default unit / slave id |
| `port` | integer `1`–`65535` | `502` | Default TCP port |
| `baudrate` | integer | `9600` | Default RTU baud rate |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Default RTU parity |
| `databits` | `7`, `8` | `8` | Default RTU data bits |
| `stopbits` | `1`, `2` | `1` | Default RTU stop bits |
| `byte_order` | `"big"`, `"little"` | `"big"` | Default byte order inside each register (§6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Default order of the registers of a multi-register value (§6) |
| `address_base` | `0`, `1` | `0` | Whether `address` is 0-based or 1-based (§5) |
| `max_read_registers` | integer `1`–`125` | `125` | Largest block the device accepts per read (FC03/04) |
| `max_read_bits` | integer `1`–`2000` | `2000` | Largest block the device accepts per read (FC01/02) |
| `enums` | object: name → table | | Named translation tables (§4.1). Names use `a`–`z`, `0`–`9` and `_` |
| `sentinels` | object: type → table | | Reserved raw values per integer type (§4.2) |
| `registers` | array of register objects | | The registers (§4) |

Connection values are **defaults**: the user can still change them when connecting.

## 4. Registers

Each item of `registers` is an object. `name`, `area`, `address` and `type` are required; every other key is optional, and the default applies when it is missing.

| Key | JSON type | Default | Meaning |
|---|---|---|---|
| `name` | non-empty string | | Variable name. **SHOULD** be unique in the file |
| `group` | string | | Free grouping for display (e.g. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Modbus data area (§5) |
| `address` | integer (§2.1) | | First register / bit address (§5) |
| `type` | see §6 | | Data type |
| `length` | integer ≥ 1 | | Number of registers. Required for `string`, ignored otherwise |
| `bit` | integer `0`–`15` | | For `bool` in `input`/`holding`: which bit of the register, 0 = least significant. For a `uint16` bit field: its lowest bit |
| `bits` | integer `1`–`16` | | For `uint16` in `input`/`holding`: width of a bit field starting at `bit` (§4.3) |
| `scale` | number | `1` | Multiplier |
| `scale_factor` | string: a register `name` | | Register whose integer value is a power-of-ten exponent for this one (§4.4) |
| `offset` | number | `0` | Added after scaling |
| `unit` | string | | Engineering unit (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Allowed operations |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | Overrides the file default for this register (§6) |
| `word_order` | `"big"`, `"little"` | file `word_order` | Overrides the file default for this register (§6) |
| `write_min` | number | | Smallest value accepted when writing, in engineering units (§4.5) |
| `write_max` | number | | Largest value accepted when writing, in engineering units (§4.5) |
| `enum` | string (a name in `enums`) or table | | Labels for integer or bool values (§4.1) |
| `reference` | see §4.6 | | Raw value this register is expected to hold on a healthy device |
| `description` | string | | Free text |
| `comment` | string | | Free note about the register, for people editing the map |

Engineering value = raw × 10^`scale_factor` × `scale` + `offset` (without a `scale_factor`: raw × `scale` + `offset`). When writing, a tool applies the inverse and rounds to the nearest integer for integer types.

### 4.1 Translation tables

Many registers hold a number that stands for a state: `0` is stopped, `1` is idle, `2` is starting, and so on. `enum` turns those numbers into labels. It is either:

- **a table** written in the register: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **the name of a table** in the top-level `enums`, so the same list is written once for every register that uses it:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Values are compared with the **raw** value, before `scale` and `offset`. A value that is not in the table is shown as a plain number. Tools **SHOULD** offer the labels when writing.

### 4.2 Sentinel values

Some devices answer with a reserved raw value instead of a reading: one value means "not implemented", another "over range", another "sensor fault". `sentinels` declares them for every register of one type:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- The keys of `sentinels` are `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. A table applies to every register of that type.
- Values **MUST** fit the type, and are compared with the **raw** value, before `scale` and `offset`.
- When a reading matches, tools **SHOULD** show the label instead of a number and **SHOULD NOT** treat it as a measurement (in charts, limits or averages).
- An `enum` label for the same raw value takes precedence over the sentinel.

### 4.3 Bit fields

Some devices pack several small values into one register, for example four 4-bit alarm codes. A `uint16` register with `bit` and `bits` reads one of them: raw value = (register >> `bit`) & (2^`bits` − 1). `bit` + `bits` **MUST NOT** exceed 16.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Registers that read different fields of the same register do not overlap. Writing a field **SHOULD** read the register, change only the field's bits and write it back.

### 4.4 Scale factors

Some devices, notably SunSpec inverters and meters, send a separate exponent register for a value instead of a fixed scale: the value is raw × 10^exponent, and the exponent can change with the device's range. `scale_factor` names that exponent register:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- The named register **MUST** be a register of the same file with an integer type (`int16` … `uint64`) and no `bits`, and **MUST NOT** itself have a `scale_factor`. If several registers share the name, the first one counts.
- Only numeric types can have a `scale_factor` (not `bool` or `string`).
- A tool reads the exponent register together with the value, also when the user chose not to show it. If the exponent cannot be read, or is a sentinel (§4.2, e.g. SunSpec's `-32768` = not implemented), the value is not available.
- When writing, a tool reads the exponent first and applies the inverse.

### 4.5 Write limits

`write_min` and `write_max` declare which values a register accepts when written, so a tool can reject a bad value before it reaches the device.

- Both are numbers in **engineering units**: the value the user sees, after `scale_factor`, `scale` and `offset` are applied. A limit of `0.5` on a register with `scale` `0.1` means a raw value of 5.
- Either may be left out: a missing limit leaves that side open. With both missing, a register has no declared limit (the device decides).
- `write_min` **MUST NOT** be greater than `write_max`. The limits are inclusive.
- A tool **MUST NOT** send a write whose engineering value is below `write_min` or above `write_max`, and **SHOULD** tell the user which limit was exceeded.
- They apply to the value the user asks for, before it is converted to a raw value and rounded. A value inside the limits that still does not fit the register's type is refused by the normal type checks.
- They have no meaning for `bool` and `string` registers or for registers that cannot be written (`access` `"R"`), and are ignored there.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Reference values

`reference` gives a value that a healthy device is known to hold in this register (a model number, a fixed protocol identifier, a manufacturer code). A tool can read the register and compare it with the reference to detect a wrong address, base, byte order or data type before the user trusts the other values. Not every device has such a register, so most registers have no `reference`.

- It is the **raw** value, before `scale_factor`, `scale` and `offset`, in the JSON type of that value: an integer (§2.1) for the integer types and for bit fields, a number for `float32` and `float64`, `true` / `false` for `bool`, a string for `string`. It **MUST** fit the type (and the width of a bit field, or `2 × length` characters for a string).
- The check is the register itself: a tool reads its `area` and `address` (already adjusted for `address_base`) and decodes its `type` with its byte and word order.
- A map can have any number of registers with a `reference`.
- Outcome of each check: **match** (the decoded raw value equals the reference), **mismatch** (it differs), **failed** (the read returned an error or timed out, so nothing is known), **not checked** (the register was not read). A tool **SHOULD** report them separately: a mismatch points to a wrong map or settings, a failed read to a connection or addressing problem.
- Floats are compared at the type's own precision (a `float32` reference is compared as a 32-bit float). Strings are compared after trimming trailing NUL and space characters.
- A reference only supports a diagnosis. Several byte or word orders can decode the same bytes to the same value (a small number or a palindrome reads the same in more than one order), so a match does not prove the whole map is correct. Maps **SHOULD** use a distinctive value and **SHOULD** give more than one where the device has them.
- A `reference` on a register that cannot be read (`access` `"W"`) is an error.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

## 5. Areas and addresses

| `area` | Unit | Read | Write | Allowed `access` |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | 16-bit register | FC04 | — | `R` |
| `holding` | 16-bit register | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

With `address_base` `0`, `address` is the address sent on the wire (0–65535). With `address_base` `1`, the address on the wire is `address − 1` (1–65536), which matches manuals that number registers from 1.

The 5- and 6-digit "Modicon" notation (`40001`, `300010`) is **not** valid in `address`. Write it as an area plus a number: `40001` becomes `"area": "holding"`, `"address": 1`, with `"address_base": 1`.

## 6. Types, byte order and word order

| `type` | Registers | Notes |
|---|---|---|
| `bool` | — | In `coil`/`discrete`: one bit. In `input`/`holding`: one bit of a register, so `bit` is required |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Floats are IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 ASCII characters per register. Trailing NUL and space characters are trimmed when reading |

Two independent settings say how the bytes of a value arrive:

- **`byte_order`**, inside each 16-bit register: `"big"` sends the high byte first (the Modbus standard), `"little"` the low byte first.
- **`word_order`**, across the registers of a 32-bit or 64-bit value: `"big"` puts the most significant register first (at the lowest address), `"little"` the least significant register first.

The top-level keys set the default for the file; a register's `byte_order` and `word_order` each override it on their own (a register that sets only `"word_order": "little"` keeps the file's byte order).

| Type | `byte_order` | `word_order` |
|---|---|---|
| `bool` | not used | not used |
| `int16`, `uint16` | swaps the two bytes of the register | not used (one register) |
| `int32`, `uint32`, `float32` | swaps the two bytes of each register | decides which of the 2 registers is the high word |
| `int64`, `uint64`, `float64` | swaps the two bytes of each register | `"little"` reverses the 4 registers as a whole |
| `string` | `"big"`: the first byte received is the first character; `"little"`: the second byte received is the first character | not used (registers are read in address order) |

For 64-bit values, little word order reverses the whole sequence of four registers; it does not swap two 32-bit halves separately.

Wire order of the 32-bit value `0x0A0B0C0D`:

| `byte_order` | `word_order` | Bytes on the wire | Common name |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Modbus standard |
| `big` | `little` | `0C 0D 0A 0B` | "word swap", used by many meters and PLCs |
| `little` | `big` | `0B 0A 0D 0C` | "byte swap" (rare) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Validation

Readers **SHOULD** report every problem with one of the codes below and a [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) to the value (`/registers/3/address`, `/enums/relay`), so tools agree on what is wrong. Problems that belong to the whole file have no pointer. An **error** makes the file invalid. A **warning** is reported, but the file is still usable.

| Code | Severity | When |
|---|---|---|
| `not-utf8` | error | The file is not valid UTF-8 |
| `not-json` | error | The file is not one valid JSON object, or repeats a key in an object. Reported for the whole file: parsers place syntax errors at different positions, so the position goes in the message |
| `bad-json-type` | error | A known key holds the wrong JSON type (a string where a number is expected, `null`, …) |
| `missing-key` | error | `mbmap`, `vendor`, `model` or `registers` is missing (for the whole file), or a register lacks `name`, `area`, `address` or `type`, or has it empty (at the register) |
| `bad-meta-value` | error | A top-level key has a value outside its allowed set or range, including `mbmap` other than `2` |
| `bad-area` | error | Unknown `area`, or not written in lowercase |
| `bad-type` | error | Unknown `type`, or not written in lowercase |
| `type-area` | error | A type other than `bool` in `coil` or `discrete` |
| `bad-address` | error | `address` is not an integer |
| `address-range` | error | The address is below `address_base`, or the value goes beyond address 65535 |
| `missing-bit` | error | `bool` in `input`/`holding` without `bit` |
| `bad-bit` | error | `bit` outside `0`–`15` |
| `missing-length` | error | `string` without `length` |
| `bad-length` | error | `length` is not an integer ≥ 1 |
| `bad-access` | error | Unknown `access` (or not in uppercase), or not allowed for the `area` |
| `bad-byte-order` | error | A register's `byte_order` or `word_order` is not `"big"` or `"little"` |
| `bad-enum` | error | An enum table (§2.2) has a key that is not an integer, an empty label, a repeated value or no entries, or an `enums` name is not `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` names an unsupported type, or a table is not valid (§2.2) or has a value that does not fit the type |
| `bad-bits` | error | `bits` is not an integer from 1 to 16, is used on a type other than `uint16` or outside `input`/`holding`, has no `bit`, or `bit` + `bits` exceeds 16 |
| `unknown-enum` | error | `enum` names a table that `enums` does not define |
| `bad-write-limit` | error | `write_min` is greater than `write_max` |
| `bad-reference` | error | `reference` is not a valid raw value for the register's `type` (not an integer, outside the type's range, wider than the bit field, not a boolean for `bool`, not a finite number for floats, longer than the string), or is set on a register that cannot be read |
| `unknown-scale-factor` | error | `scale_factor` names no register of the file (registers with errors do not count) |
| `bad-scale-factor` | error | `scale_factor` is set on a `bool` or `string`, or names a register that is not a whole integer (a float, `bool`, `string` or bit field) or that has a `scale_factor` itself |
| `no-rows` | warning | `registers` is empty |
| `duplicate-name` | warning | A `name` is used more than once |
| `overlap` | warning | A value starts inside another value's registers in the same area, which usually means a wrong address or type. Registers that start at the same address are alternative readings of the same data (for example a code read as a number and as text) and never count as overlap; neither do bits and bit fields of one register (`bool` + `bit`, `uint16` + `bit` + `bits`) |
| `unknown-key` | warning | A register has a key that is not in this spec and does not start with `x_` |
| `unused-write-limit` | warning | `write_min` or `write_max` is set on a register where it has no effect (`bool`, `string`, or `access` `"R"`) |
| `unused-bit` | warning | `bit` is set on a register where it has no effect (any type but `bool`, unless `bits` is also set on a `uint16`) |

A register with an error in `name`, `area`, `address` or `type` is not checked further. A register with any error is left out of the `overlap` check.

The [JSON Schema](schema/mbmap-2.schema.json) checks the structure, the JSON types and the value ranges; the rules that relate several values (`unknown-enum`, scale factors, `overlap`, `address-range`, `bad-reference` by type, duplicate keys) need code. The [`tests/`](tests/) folder holds sample files with the diagnostics each one must produce, so any implementation can check itself against them.

## 8. Compatibility and versioning

- Readers **MUST** ignore keys they do not know, at the top level and in registers. This lets newer files open in older readers.
- Vendor- or tool-specific keys **SHOULD** start with `x_` (`"x_modbench_icon"`, `"x_alarm_high"`) so they never clash with future versions of this spec. Their values **MAY** be of any JSON type.
- `mbmap` is the **major** version. A reader **MUST** refuse a file whose `mbmap` it does not support, and **SHOULD** say which version it found.
- New optional keys that older readers can safely ignore are added without changing `mbmap`. A key whose meaning an older reader would get wrong if it ignored it needs a new major version.
- The schema file is named after the major version (`mbmap-2.schema.json`) and only gains optional keys within it.

Version 1 of the format, based on CSV, is deprecated. New readers do not need to support it; files in that format can be converted with [`tools/migrate.py`](tools/migrate.py) (see [legacy/v1](legacy/v1/)).
