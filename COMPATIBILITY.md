# Compatibility

Tools that read or check `.mbmap` files, and which parts of the format ([SPEC.md](SPEC.md)) each one supports.

## Tools

| Tool | What it is | What it does with a map |
|---|---|---|
| [Modbench](https://github.com/nobrega8/modbench) | Modbus TCP/UDP/RTU/ASCII client for Windows, Linux and macOS | Opens a map and reads (and writes) the device by register name; browses and downloads this library; runs a simulated device shaped after a map |
| `modbench-cli` (ships with Modbench) | Command line and MCP server | `validate` and `convert` maps; `map` reads every register of a map from a device; the MCP tools `read_map` and `validate_map` do the same for an AI assistant |
| [`tools/validate.py`](tools/validate.py) (this repository) | Reference validator | Reports every problem with the codes of SPEC.md section 7; runs in CI on every pull request |
| [`tools/migrate.py`](tools/migrate.py) (this repository) | Converter | Converts format version 1 (CSV) files to version 2 |
| Editors with JSON Schema support (VS Code and others) | Text editor | Check the structure, JSON types and value ranges as you type, through the `$schema` key ([schema](schema/mbmap-2.schema.json)) |

Apps that browse the library read [`index.json`](index.json): one entry per map with its vendor, model, path, status and register count.

## Support by feature

Legend: **Yes** supported · **Kept** read and written back, not shown · **No** not supported · **—** does not apply.

| Feature (SPEC.md section) | Modbench | `validate.py` | JSON Schema |
|---|---|---|---|
| Format version 2, JSON (§2, §3) | Yes | Yes | Yes |
| Format version 1, CSV (§10, deprecated) | Yes: opens it with a warning and converts it to version 2 | Yes | No |
| All types: `bool`, 16/32/64-bit integers, `float32`, `float64`, `string` (§6) | Yes | Yes | Yes |
| `byte_order` and `word_order`, per file and per register (§6) | Yes, and the user can override the byte order of a map | Yes | Yes |
| `address_base` 0 and 1 (§5) | Yes | Yes | Yes |
| Connection defaults: `protocol`, `unit_id`, `port`, `baudrate`, `parity`, `databits`, `stopbits` (§3) | Yes: filled in when the map is opened | Yes | Yes |
| `max_read_registers`, `max_read_bits` (§3) | Yes: longer reads are split | Yes | Yes |
| Translation tables, named (`enums`) and inline (§4.1) | Yes: labels shown, and offered when writing | Yes | Structure only |
| Sentinel values (§4.2) | Yes: shown as their label, left out of charts and alarms | Yes | Structure only |
| Bit fields, `bit` and `bits` (§4.3) | Yes: read, and written by changing only the field | Yes | Yes |
| Scale factor registers, `scale_factor` (§4.4) | Yes: the exponent register is read with the value | Yes | No |
| Write limits, `write_min` and `write_max` (§4.5) | Yes: values outside them are refused before writing | Yes | Yes |
| Reference values (§4.6) | Yes: match, mismatch and failed checks are shown | Yes | Structure only |
| Identity registers, `role`, and `models` (§4.7, §9) | Yes: the device is checked against the map's models and firmware | Yes | Structure only |
| Firmware ranges, per map and per register (§3.2, §9) | Yes: once the firmware is known, only its registers are read | Yes | Format only |
| `revision` and `revised` (§3.1) | Yes: shown with the map | Yes | Yes |
| `source`, `sources`, `notes`, `comment` (§3.3, §2) | Kept | Yes | Yes |
| Validation codes (§7) | Yes: all of them, with the same codes and JSON Pointers; checked against [`tests/`](tests/) | Yes: reference | Structure only |
| `x_status` (this library, not the format) | Yes: shown as an icon in the library and the map picker | — | — |

"Structure only" means the schema checks the shape of the value but not the rules that need code, such as an `enum` naming a table that exists or a `reference` fitting the register's type (SPEC.md section 7).

## Adding a tool

Building a tool that reads `.mbmap`? Follow [SPEC.md](SPEC.md) and check it against the sample files in [`tests/`](tests/): each one lists the diagnostics a reader must report. Then open a pull request that adds your tool to this page, with what it supports. Partial support is fine: say which parts it reads and which it ignores.
