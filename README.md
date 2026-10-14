# mbmap-library

[![Validate maps](https://github.com/nobrega8/mbmap-library/actions/workflows/validate.yml/badge.svg)](https://github.com/nobrega8/mbmap-library/actions/workflows/validate.yml)
[![Maps](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnobrega8%2Fmbmap-library%2Fmain%2Findex.json&query=%24.maps.length&label=maps&color=blue)](index.json)
[![Format](https://img.shields.io/badge/format-.mbmap%20v1-informational)](SPEC.md)
[![License: CC0-1.0](https://img.shields.io/badge/license-CC0--1.0-lightgrey)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)

An open library of Modbus register maps in the [`.mbmap` format](SPEC.md).

Each file describes one device model: the manufacturer, how to connect to it and what every register means. Load a map into a compatible tool and you get the device's variables, already named, scaled and typed, without typing addresses from a PDF manual.

## Layout

```text
SPEC.md                         the .mbmap format specification
maps/<vendor>/<model>.mbmap     the shared maps
examples/                       fictional maps that show the format
index.json                      list of the maps, for apps that browse the library
ATTRIBUTION.md                  where converted maps come from, and their licences
tools/validate.py               validator (also runs in CI)
tools/build_index.py            rebuilds index.json
tests/                          sample files and the diagnostics each must produce,
                                for checking any .mbmap reader against the spec
```

Folder and file names are lowercase slugs, e.g. `maps/acme-meters/pm-200.mbmap`.

## Verified and unverified maps

The maps written from a manufacturer's manual name that document in `@source`. A large part of the library was **converted from other open catalogues** of Modbus tables to get everyone started. Those files contain `@x_status=unverified`: nobody has checked them against the manufacturer's documentation yet, and some details (byte order, which register area, scaling) may be wrong. Read them as a draft and check a value on the real device before you rely on the rest.

Corrections are the most useful contribution: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Using the maps

`.mbmap` is plain text based on CSV, so you can open a map in any text editor or spreadsheet. Tools that read the format:

- [Modbench](https://github.com/nobrega8/modbench): a lightweight Modbus TCP/RTU client for Windows and Linux. It can browse and download the maps in this repository directly.

Building a tool that reads `.mbmap`? Open a pull request to add it here.

### Format version 2 (draft)

A JSON-based version 2 of the format is proposed in [SPEC-v2.md](SPEC-v2.md); the reasons are in [docs/json-evaluation.md](docs/json-evaluation.md). The maps here stay in version 1 until readers support it. To convert a version 1 map:

```sh
python tools/migrate.py path/to/model.mbmap        # writes path/to/model.mbmap.json
```

## Contributing

New maps and fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), then check your file:

```sh
python tools/validate.py maps/your-vendor/your-model.mbmap
```

## Contributors

Thanks to everyone who has added or corrected a map.

[![Contributors](https://contrib.rocks/image?repo=nobrega8/mbmap-library)](https://github.com/nobrega8/mbmap-library/graphs/contributors)

## License

The maps, the spec and the tools are dedicated to the public domain under [CC0 1.0](LICENSE). You can use them for anything, including commercial products, without asking or giving credit.

The maps are provided as is. Always check a map against the manufacturer's documentation before you write to a live device.
