# mbmap-library

[![Validate maps](https://github.com/nobrega8/mbmap-library/actions/workflows/validate.yml/badge.svg)](https://github.com/nobrega8/mbmap-library/actions/workflows/validate.yml)
[![Maps](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnobrega8%2Fmbmap-library%2Fmain%2Findex.json&query=%24.maps.length&label=maps&color=blue)](index.json)
[![Format](https://img.shields.io/badge/format-.mbmap%20v2-informational)](SPEC.md)
[![License: CC0-1.0](https://img.shields.io/badge/license-CC0--1.0-lightgrey)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)](CONTRIBUTING.md)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-support-FF5E5B?logo=ko-fi&logoColor=white)](https://ko-fi.com/nobrega)

An open library of Modbus register maps in the [`.mbmap` format](SPEC.md), a JSON format with a [JSON Schema](schema/mbmap-2.schema.json).

Each file describes one device model: the manufacturer, how to connect to it and what every register means. Load a map into a compatible tool and you get the device's variables, already named, scaled and typed, without typing addresses from a PDF manual.

## Layout

```text
SPEC.md                           the .mbmap format specification
schema/mbmap-2.schema.json        its JSON Schema
maps/<vendor>/<model>.mbmap.json  the shared maps
examples/                         fictional maps that show the format
index.json                        list of the maps, for apps that browse the library
tools/validate.py                 validator (also runs in CI)
tools/build_index.py              rebuilds index.json
tests/                            sample files and the diagnostics each must produce,
                                  for checking any .mbmap reader against the spec
legacy/v1/                        the deprecated CSV-based format, and how to convert it
```

Folder and file names are lowercase slugs, e.g. `maps/acme-meters/pm-200.mbmap.json`.

## Verified and unverified maps

The maps written from a manufacturer's manual name that document in `source`. A large part of the library was **converted from other open catalogues** of Modbus tables to get everyone started. Those files contain `"x_status": "unverified"`: nobody has checked them against the manufacturer's documentation yet, and some details (byte order, which register area, scaling) may be wrong. Read them as a draft and check a value on the real device before you rely on the rest.

Corrections are the most useful contribution: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Using the maps

A map is a JSON file with one register per line, so it reads well in any text editor and any language can load it with its JSON parser; editors that support JSON Schema check it as you type. Tools that read the format:

- [Modbench](https://github.com/nobrega8/modbench): a lightweight Modbus TCP/RTU client for Windows and Linux. It can browse and download the maps in this repository directly.

Building a tool that reads `.mbmap`? Follow [SPEC.md](SPEC.md), check it against the samples in [`tests/`](tests/), and open a pull request to add it here.

## Contributing

New maps and fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), then check your file:

```sh
python tools/validate.py maps/your-vendor/your-model.mbmap.json
```

## Contributors

Thanks to everyone who has added or corrected a map.

[![Contributors](https://contrib.rocks/image?repo=nobrega8/mbmap-library)](https://github.com/nobrega8/mbmap-library/graphs/contributors)

## License

The maps, the spec and the tools are dedicated to the public domain under [CC0 1.0](LICENSE). You can use them for anything, including commercial products, without asking or giving credit.

The maps are provided as is. Always check a map against the manufacturer's documentation before you write to a live device.

## Funding

The library is free and in the public domain. If it saves you time, you can support its development on Ko-fi:

<a href="https://ko-fi.com/nobrega"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support mbmap-library on Ko-fi" height="36"></a>
