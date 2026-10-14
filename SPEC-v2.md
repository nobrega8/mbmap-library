# `.mbmap` — Modbus Map format, version 2

> **Status: current.** Version 2 replaces version 1 ([SPEC.md](SPEC.md)), which is deprecated: readers **SHOULD** keep reading version 1 files, and writers **SHOULD** write version 2. The reasons are in [docs/json-evaluation.md](docs/json-evaluation.md). Changes follow §8.

Version 2 describes the same thing as version 1, the Modbus register map of one device model, as a JSON document instead of metadata lines followed by a CSV table. The meaning of every field is the meaning it has in version 1, with one change: the four-letter `byte_order` is split into `byte_order` and `word_order` (§5), as announced in SPEC.md §9.

The key words **MUST**, **SHOULD** and **MAY** are used as in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## 1. Example

The version 1 example of SPEC.md, as version 2 (`tools/migrate.py` writes this layout):

```json
{
  "$schema": "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json",
  "mbmap": 2,
  "vendor": "Example Corp",
  "model": "EM-100",
  "description": "Single-phase energy meter",
  "notes": [
    "Measurements"
  ],
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
    {"name": "Voltage", "group": "Measurements", "area": "input", "address": 0, "type": "float32", "scale": 1, "offset": 0, "unit": "V", "access": "R", "description": "RMS voltage"},
    {"name": "Current", "group": "Measurements", "area": "input", "address": 6, "type": "float32", "scale": 1, "offset": 0, "unit": "A", "access": "R", "description": "RMS current"},
    {"name": "Active energy", "group": "Energy", "area": "holding", "address": 256, "type": "uint32", "scale": 0.01, "offset": 0, "unit": "kWh", "access": "R", "byte_order": "big", "word_order": "little"},
    {"name": "Relay state", "group": "Status", "area": "holding", "address": 512, "type": "bool", "bit": 3, "access": "R", "enum": "relay", "description": "Bit 3 of status word"},
    {"name": "Reset energy", "group": "Commands", "area": "coil", "address": 0, "type": "bool", "access": "W", "description": "Write 1 to reset counters"},
    {"name": "Serial number", "group": "Info", "area": "holding", "address": 1024, "type": "string", "length": 8, "access": "R", "description": "16 ASCII characters"}
  ]
}
```

## 2. File

- A version 2 file is one JSON object ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), encoded as UTF-8. Readers **MUST** accept and ignore a leading BOM. Writers **SHOULD NOT** write one.
- The file name ends in `.mbmap.json`, so editors recognise it as JSON. A reader that is given a file can also tell the versions apart from the content: the first character after an optional BOM and white space is `{` in version 2, and never in version 1.
- An object **MUST NOT** repeat a key. JSON parsers handle duplicate keys differently, so a file with one is invalid.
- Every string value and key is used as written: there is no trimming and, unlike version 1, enumerated values are case-sensitive (`"holding"`, not `"Holding"`).
- JSON has no comments. Notes about the whole file go in `notes`, notes about a register in its `comment` (§4). Both are free text that tools **MAY** show and **MUST NOT** interpret.
- Writers **SHOULD** use the layout of §1: two-space indentation, and one line per register and per `enums`/`sentinels` table, so that a change to one register is a one-line diff.
- Optional `$schema` points to the [JSON Schema](schema/mbmap-2.schema.json) for editors. Readers **MUST** ignore it.

### 2.1 Integers

Where a field below is an **integer**, it **MAY** be written as a JSON integer (`1040`) or as a string holding a decimal integer or `0x` hex (`"0x0410"`). Strings keep the hex spelling that manuals use for addresses and identifiers, and carry 64-bit values that not every JSON parser reads exactly as numbers (beyond 2^53). Keys of `enums` and `sentinels` tables are always strings, in the same two forms.

## 3. Top-level fields

| Key | Required | JSON type | Default | Same as v1 |
|---|---|---|---|---|
| `mbmap` | yes | integer `2` | | `@mbmap` |
| `vendor` | yes | non-empty string | | `@vendor` |
| `model` | yes | non-empty string | | `@model` |
| `vendor_website` | no | string | | `@vendor_website` |
| `description` | no | string | | `@description` |
| `firmware` | no | string | | `@firmware` |
| `source` | no | string | | `@source` |
| `notes` | no | array of strings | | full-line `#` comments before the header |
| `protocol` | no | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | `@protocol` |
| `unit_id` | no | integer `0`–`255` | `1` | `@unit_id` |
| `port` | no | integer `1`–`65535` | `502` | `@port` |
| `baudrate` | no | integer | `9600` | `@baudrate` |
| `parity` | no | `"N"`, `"E"`, `"O"` | `"E"` | `@parity` |
| `databits` | no | `7`, `8` | `8` | `@databits` |
| `stopbits` | no | `1`, `2` | `1` | `@stopbits` |
| `byte_order` | no | `"big"`, `"little"` | `"big"` | byte part of `@byte_order` (§5) |
| `word_order` | no | `"big"`, `"little"` | `"big"` | word part of `@byte_order` (§5) |
| `address_base` | no | `0`, `1` | `0` | `@address_base` |
| `max_read_registers` | no | integer `1`–`125` | `125` | `@max_read_registers` |
| `max_read_bits` | no | integer `1`–`2000` | `2000` | `@max_read_bits` |
| `enums` | no | object: name → table | | `@enum_<name>` |
| `sentinels` | no | object: type → table | | `@sentinel_<type>` |
| `registers` | yes | array of register objects | | the CSV rows |

A **table** is an object whose keys are integers written as strings (§2.1) and whose values are non-empty labels: `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Two keys of one table **MUST NOT** have the same value (`"1"` and `"0x1"`). Enum names use `a`–`z`, `0`–`9` and `_`. Sentinel types are `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Meaning: SPEC.md §4.1 and §4.2.

Connection values are defaults, as in version 1.

## 4. Register fields

`name`, `area`, `address` and `type` are required. A missing field takes its default; JSON `null` is not a valid value for any field.

| Key | JSON type | Default | Same as v1 column |
|---|---|---|---|
| `name` | non-empty string | | `name` |
| `group` | string | | `group` |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | `area` |
| `address` | integer (§2.1) | | `address` |
| `type` | `"bool"`, `"int16"`, `"uint16"`, `"int32"`, `"uint32"`, `"float32"`, `"int64"`, `"uint64"`, `"float64"`, `"string"` | | `type` |
| `length` | integer ≥ 1 | | `length` |
| `bit` | integer `0`–`15` | | `bit` |
| `bits` | integer `1`–`16` | | `bits` |
| `scale` | number | `1` | `scale` |
| `scale_factor` | string: a register `name` | | `scale_factor` |
| `offset` | number | `0` | `offset` |
| `unit` | string | | `unit` |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | `access` |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | byte part of `byte_order` (§5) |
| `word_order` | `"big"`, `"little"` | file `word_order` | word part of `byte_order` (§5) |
| `write_min` | number | | `write_min` |
| `write_max` | number | | `write_max` |
| `enum` | string (a name in `enums`) or table | | `enum` (`@name` or inline pairs) |
| `reference` | see below | | `reference` |
| `description` | string | | `description` |
| `comment` | string | | full-line `#` comments above the row |

`reference` is written in the JSON type of the raw value: an integer (§2.1) for the integer types and for bit fields, a number for `float32`/`float64`, `true`/`false` for `bool`, a string for `string`.

The rules of SPEC.md apply unchanged: translation tables (§4.1), sentinels (§4.2), bit fields (§4.3), scale factors (§4.4), write limits (§4.5), reference values (§4.6), areas and addresses (§5), types (§6).

## 5. Byte order and word order

Version 2 uses the model of SPEC.md §9: `byte_order` is the order of the two bytes inside each register, `word_order` the order of the registers of a 32-bit or 64-bit value. Both are `"big"` or `"little"`. Their effect on each type is the table of SPEC.md §9.2.

A register's `byte_order` and `word_order` each override the file default on their own: a register that sets only `word_order: "little"` keeps the file's byte order.

## 6. Unknown keys and extensions

- Readers **MUST** ignore keys they do not know, at the top level and in registers. This lets newer files open in older version 2 readers.
- Vendor- or tool-specific keys **SHOULD** start with `x_` (`"x_modbench_icon"`, `"x_alarm_high"`). Their values **MAY** be of any JSON type.

## 7. Validation

Readers **SHOULD** report problems with the codes of SPEC.md §7, so that tools agree across versions. Where version 1 gives a line number, version 2 gives a [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) to the value (`/registers/3/address`, `/enums/relay`).

- Codes about text layout do not exist in version 2: `no-header`, `malformed-meta`, `meta-after-header`, `missing-column`, `duplicate-column`, `too-many-fields`, `duplicate-meta`.
- New codes:

| Code | Severity | When |
|---|---|---|
| `not-json` | error | The file is not one valid JSON object, or repeats a key in an object |
| `bad-json-type` | error | A known key holds the wrong JSON type (a string where a number is expected, `null`, …) |

- `missing-meta` covers a missing `mbmap`, `vendor`, `model` or `registers`; `empty-cell` a missing or empty `name`, `area`, `address` or `type` in a register; `bad-byte-order` a `byte_order` or `word_order` that is not `"big"` or `"little"`; `unknown-column` an unknown key that does not start with `x_` (warning). All other codes keep their meaning.

[`schema/mbmap-2.schema.json`](schema/mbmap-2.schema.json) checks the structure, the JSON types and the value ranges. Rules that relate several values (an `enum` name that has no table, `scale_factor` targets, `overlap`, `address-range`, `bad-reference` by type, duplicate keys) need a reader-side check, as in version 1.

## 8. Versioning

- `mbmap` is the **major** version. A reader **MUST** refuse a file whose `mbmap` it does not support, and **SHOULD** say which version it found.
- New optional keys that older readers can ignore are added without changing `mbmap` (§6). A key whose meaning an older reader would get wrong if it ignored it needs a new major version.
- Readers that support version 2 **SHOULD** also read version 1 files. Writers **SHOULD** keep the version a file already has unless the user asks to convert it.
- The schema file is named after the major version (`mbmap-2.schema.json`) and only gains optional keys within it.

## 9. Migration from version 1

`tools/migrate.py` converts version 1 files:

```sh
python tools/migrate.py maps/carlo-gavazzi/em530-em540.mbmap          # writes em530-em540.mbmap.json next to it
python tools/migrate.py maps --out-dir build/v2                         # a whole folder
python tools/migrate.py examples/example-corp/em-100.mbmap --stdout
```

It refuses a file that has validation errors in version 1. The conversion is:

| Version 1 | Version 2 |
|---|---|
| `@key=value` metadata | top-level key; integers become JSON integers |
| `@byte_order=ABCD` / `CDAB` / `BADC` / `DCBA` | `byte_order` + `word_order`: big/big, big/little, little/big, little/little (SPEC.md §9.3), both written |
| `@enum_<name>`, `@sentinel_<type>` | `enums.<name>`, `sentinels.<type>` |
| Comment lines before the header | `notes` (without the leading `# `) |
| Comment lines between rows | `comment` of the next register, lines joined with `\n`; comments after the last row go to the end of `notes` |
| Empty cell | key left out |
| `address`, integer `reference` | JSON integer, or a string when written in `0x` hex (spelling kept) |
| `scale`, `offset`, `write_min`, `write_max`, float `reference` | JSON number |
| `bool` `reference` (`0`, `1`, `true`, `false`) | `false` / `true` |
| `enum` = `@name` | `"name"` |
| `enum` = inline pairs | table |
| `area`, `type`, `protocol` | lowercase |
| `access`, `parity` | uppercase |
| `x_` metadata and columns, unknown columns | kept as strings under the same key |

What is not kept: blank lines, the order of columns, and the spelling of case-insensitive values. `tools/test_migrate.py` migrates every valid version 1 file of the repository and checks that a reader gets the same metadata, tables and registers from both versions.
