# JSON as a format for `.mbmap` maps

> Decision record, October 2026. The current format is in [SPEC.md](../SPEC.md); the deprecated CSV format and its conversion are in [legacy/v1](../legacy/v1/).

Evaluation for [issue #5](https://github.com/nobrega8/mbmap-library/issues/5): should the CSV-based format (version 1) stay, gain a JSON encoding, or give way to JSON in a new version?

## Decision

**JSON becomes format version 2. Version 1 is deprecated but stays readable.** The maps of this repository are in version 2.

- [SPEC.md](../SPEC.md) defines version 2 and [schema/mbmap-2.schema.json](../schema/mbmap-2.schema.json) is its JSON Schema.
- [tools/migrate/migrate.py](../tools/migrate/migrate.py) converts version 1 files to version 2. [tools/migrate/test_migrate.py](../tools/migrate/test_migrate.py) runs it on every valid version 1 file in the repository (431 today) and checks that nothing changes meaning; CI runs it with the schema check.
- The rollout below is complete: Modbench reads version 2, `validate.py` checks both versions, and the maps were converted with `migrate.py`.

Not chosen:

- **Keep CSV only.** The problems below (two syntaxes, string-only cells, comments that tools cannot keep) stay, and the byte/word order split planned in version 1 (§9) needs a new version anyway.
- **JSON as a second encoding of version 1.** Two encodings of the same version means every reader implements both forever, and every rule is written twice. A new major version lets readers keep v1 as a read-only legacy path and lets the library move once.

## Comparison

### Ease of implementation

| | Version 1 (CSV) | Version 2 (JSON) |
|---|---|---|
| Parsing | Custom line classifier (blank / `#` / `@key=value` / CSV), then RFC 4180 per line, then `key=value\|…` mini-syntax inside cells for enums and sentinels | One call to the platform's JSON parser |
| Types | Every value is a string; the reader converts and validates each one | Numbers, integers, booleans and strings arrive typed |
| Pitfalls readers hit | BOM, CRLF, `;` exports, `#`/`@` in the first field, case-insensitive values, trimming, short rows | Duplicate keys (not rejected by most parsers), 64-bit integers beyond 2^53 (handled with strings, SPEC.md §2.1) |
| Reference implementation | [validate.py](../tools/validate/validate.py): about 60 lines of `check_text` plus the enum/sentinel helpers only to read the file, before any rule is checked | Parsing is free; the semantic rules (§7) are the same work in both versions |

JSON removes the format-specific parsing, which is where independent implementations tend to disagree. It does not remove the semantic checks (scale factor targets, overlap, address range).

### Schema validation and forward compatibility

- Version 1 can only be checked by a custom validator. Version 2 has a standard JSON Schema: editors (VS Code and others) validate and autocomplete a file through its `$schema` key, and any language has a schema validator. The schema covers structure, types and ranges; cross-field rules still need code, as listed in SPEC.md §7.
- Both versions ignore unknown keys and reserve `x_`. In JSON an extension can hold structured data (an object, a list), where version 1 can only hold a string.
- Versioning: `mbmap` stays the major version; additions that can be ignored keep it (SPEC.md §8).

### Human editing, spreadsheets and Git diffs

This is where CSV is better, and the reason version 1 is not dropped in a hurry.

- **Spreadsheets.** A version 1 map opens as a table in Excel or LibreOffice. A version 2 map does not. Contributors who build a map from a PDF table in a spreadsheet keep that workflow by exporting CSV and running `migrate.py`, which is one more step.
- **Size.** Every register repeats its key names. The 410 maps of the library take 1.7 MB in version 1 and 3.5 MB in version 2 (×2.1). Line count barely changes (31 771 → 34 239) because of the layout below.
- **Diffs.** `migrate.py` writes one register per line (SPEC.md §2), so changing a register is still a one-line diff, as in CSV. Keys are named on every line, so a reviewer sees `"scale": 0.1` instead of counting commas to find the 7th column; adding a column no longer touches every row.
- **Comments.** CSV allows `#` lines anywhere; JSON has none. Version 2 has `notes` and a per-register `comment`. Unlike `#` lines, these survive when a tool loads and saves the file.

### Connection settings, enums and register rows

- Connection settings map one-to-one to top-level keys, with integers as integers.
- Enums and sentinels become objects (`{"0": "Off", "1": "On"}`) instead of the `0=Off|1=On` mini-syntax, so labels can contain `|` and `=`. A register refers to a named table by name (`"enum": "relay"`), not with the `@` prefix that collides with metadata lines in version 1.
- Registers become objects. Empty cells become absent keys. Hex addresses keep their spelling as strings (`"0x0410"`): 294 rows of the library use hex.

### Concepts that do not map directly

| Version 1 | Version 2 | Kept? |
|---|---|---|
| `#` comment lines | `notes` / register `comment` | Text kept, position approximated (attached to the next register) |
| Blank lines, column order | none | Not kept: no meaning |
| Case-insensitive `area`, `type`, `access`… | Exact spelling, case-sensitive | Normalised; same meaning |
| `byte_order` `ABCD`/`CDAB`/`BADC`/`DCBA` | `byte_order` + `word_order` | Exact |
| `0x` hex in `address`, enum and sentinel values, `reference` | String with the same spelling | Kept |
| `bool` reference `0`/`1`/`true`/`false` | `false`/`true` | Same meaning |
| Line numbers in diagnostics | JSON Pointer | Same rules; codes named after keys (SPEC.md §7) |
| Unknown columns, `x_` keys | Same key, string value | Kept |

`test_migrate.py` compares what a reader gets from both versions (metadata with defaults, tables, and each register with byte order, enum and reference resolved) for every file, so the "Kept" column is checked, not assumed.

### Migration cost and compatibility

- **Library:** one command, `python tools/migrate/migrate.py maps`, plus updating `validate.py`, `build_index.py` and the CI to version 2.
- **Readers:** Modbench (the only known reader) needs a version 2 loader, and should keep its version 1 loader to open users' own files. Readers that only know version 1 cannot open version 2 files; they report `missing-meta` and `missing-column` on the first line and refuse the file, not misread it.
- **Users' private maps:** keep working in any reader that keeps version 1; `migrate.py` converts them when the user wants.
- **index.json** keeps its fields; only `path` changes to `.mbmap.json`.

## Rollout

1. *(this change)* Spec draft, schema, migration tool, lossless test and a prototype ([examples/example-corp/em-100.mbmap.json](../examples/example-corp/em-100.mbmap.json), generated from the version 1 example). Version 1 unchanged.
2. Modbench reads version 2 (and keeps version 1) *(done)*.
3. `validate.py` checks version 2 files with the same codes; `tests/` gains version 2 fixtures *(done)*.
4. The library is converted in one commit with `migrate.py`; `build_index.py` indexes `.mbmap.json`; CONTRIBUTING.md documents the spreadsheet → CSV → `migrate.py` path for new maps *(done)*.
5. Version 2 becomes SPEC.md; version 1 moves to legacy/v1 *(done)*.
