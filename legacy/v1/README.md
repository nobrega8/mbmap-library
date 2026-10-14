# Format version 1 (deprecated)

Before version 2, `.mbmap` files were CSV-based: `@key=value` metadata lines followed by a CSV register table. That format is **deprecated**. Do not use it for new maps, and new readers do not need to support it: the current format is described in [SPEC.md](../../SPEC.md) at the root of this repository.

This folder is kept for converting old files and for tools that still open them:

```text
SPEC.md       the version 1 specification, for reading old files
examples/     the version 1 example (examples/example-corp/em-100.mbmap.json is its conversion)
tests/        version 1 fixtures and their expected diagnostics (tools/run_tests.py runs them)
```

## Converting a version 1 file

```sh
python tools/migrate.py path/to/model.mbmap              # writes path/to/model.mbmap.json next to it
python tools/migrate.py old-maps/ --out-dir converted/   # a whole folder
python tools/migrate.py path/to/model.mbmap --stdout
```

`migrate.py` refuses a file that has errors in version 1 (`python tools/validate.py path/to/model.mbmap` lists them). The conversion keeps every value and its meaning:

| Version 1 | Version 2 |
|---|---|
| `@key=value` metadata | top-level key; integers become JSON integers |
| `@byte_order=ABCD` / `CDAB` / `BADC` / `DCBA` | `byte_order` + `word_order`: big/big, big/little, little/big, little/little |
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

What is not kept: blank lines, the order of columns, and the spelling of case-insensitive values. [`tools/test_migrate.py`](../../tools/test_migrate.py) converts every valid file in this folder and checks that a reader gets the same metadata, tables and registers from both versions.

Version 1 files are told apart from version 2 by their content: after an optional BOM and white space, a version 2 file starts with `{`, which a version 1 line never does.
