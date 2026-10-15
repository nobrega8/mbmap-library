# Compatibility

Tools that read `.mbmap` files, and which parts of the format ([SPEC.md](SPEC.md)) each one supports.

## Tools

| Tool | What it is | What it does with a map |
|---|---|---|
| <img src="https://raw.githubusercontent.com/nobrega8/modbench/main/assets/icon.svg" width="20" height="20" alt="" align="top"> [Modbench](https://github.com/nobrega8/modbench) | Modbus TCP/UDP/RTU/ASCII client for Windows, Linux and macOS, with a command line (`modbench-cli`) and an MCP server | Opens a map and reads (and writes) the device by register name; browses and downloads this library; runs a simulated device shaped after a map. From the command line: `validate` and `convert` maps, and `map` reads every register of a map from a device; the MCP tools `read_map` and `validate_map` do the same for an AI assistant |

## Support by feature

Legend: **Yes** supported · **Kept** read and written back, not shown.

| Feature (SPEC.md section) | <img src="https://raw.githubusercontent.com/nobrega8/modbench/main/assets/icon.svg" width="16" height="16" alt="" align="top"> Modbench |
|---|---|
| Format version 2, JSON (§2, §3) | Yes |
| Format version 1, CSV (§10, deprecated) | Yes: opens it with a warning and converts it to version 2 |
| All types: `bool`, 16/32/64-bit integers, `float32`, `float64`, `string` (§6) | Yes |
| `byte_order` and `word_order`, per file and per register (§6) | Yes, and the user can override the byte order of a map |
| `address_base` 0 and 1 (§5) | Yes |
| Connection defaults: `protocol`, `unit_id`, `port`, `baudrate`, `parity`, `databits`, `stopbits` (§3) | Yes: filled in when the map is opened |
| `max_read_registers`, `max_read_bits` (§3) | Yes: longer reads are split |
| Translation tables, named (`enums`) and inline (§4.1) | Yes: labels shown, and offered when writing |
| Sentinel values (§4.2) | Yes: shown as their label, left out of charts and alarms |
| Bit fields, `bit` and `bits` (§4.3) | Yes: read, and written by changing only the field |
| Scale factor registers, `scale_factor` (§4.4) | Yes: the exponent register is read with the value |
| Write limits, `write_min` and `write_max` (§4.5) | Yes: values outside them are refused before writing |
| Reference values (§4.6) | Yes: match, mismatch and failed checks are shown |
| Identity registers, `role`, and `models` (§4.7, §9) | Yes: the device is checked against the map's models and firmware |
| Firmware ranges, per map and per register (§3.2, §9) | Yes: once the firmware is known, only its registers are read |
| `revision` and `revised` (§3.1) | Yes: shown with the map |
| `source`, `sources`, `notes`, `comment` (§3.3, §2) | Kept |
| Validation codes (§7) | Yes: all of them, with the same codes and JSON Pointers; checked against [`tests/`](tests/) |
| `x_status` (this library, not the format) | Yes: shown as an icon in the library and the map picker |

## Adding a tool

Building a tool that reads `.mbmap`? Follow [SPEC.md](SPEC.md) and check it against the sample files in [`tests/`](tests/): each one lists the diagnostics a reader must report. Then open a pull request that adds your tool to this page, with what it supports. Partial support is fine: say which parts it reads and which it ignores.
