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
COMPATIBILITY.md                  tools that read the format, and what each supports
maps/<vendor>/<model>.mbmap.json  the shared maps
examples/                         fictional maps that show the format
index.json                        list of the maps, for apps that browse the library
tools/validate/                   the validator, and its test runner (both run in CI)
tools/index/                      rebuilds index.json
tools/revisions/                  checks that changed maps have a new revision
tools/migrate/                    converts version 1 files to version 2
tools/export/                     exports a map to other software (Ignition)
tests/                            sample files and the diagnostics each must produce,
                                  for checking any .mbmap reader against the spec
legacy/v1/                        the deprecated CSV-based format, and how to convert it
```

Folder and file names are lowercase slugs, e.g. `maps/acme-meters/pm-200.mbmap.json`.

## Map status

The maps in this library say how far they can be trusted in `x_status`. It is not part of the mbmap format, just an optional key that this library and Modbench read:

- **`verified`**: tested on a real device.
- **`unverified`**: written from the manufacturer's documentation (named in `source`), but not tested on a device yet.
- **`unofficial`**: copied from an unofficial source and not tested. A large part of the library was **converted from other open catalogues** of Modbus tables to get everyone started. Nobody has checked these against the manufacturer's documentation yet, and some details (byte order, which register area, scaling) may be wrong. Read them as a draft and check a value on the real device before you rely on the rest.

Tested a map on your device? Tell us in a pull request or a [test report](https://github.com/nobrega8/mbmap-library/issues/new?template=test-report.yml), even if you did not write the map.

Corrections are the most useful contribution: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Using the maps

A map is a JSON file with one register per line, so it reads well in any text editor and any language can load it with its JSON parser; editors that support JSON Schema check it as you type.

[COMPATIBILITY.md](COMPATIBILITY.md) lists the tools that read the format and which parts of it each one supports. The main one is [Modbench](https://github.com/nobrega8/modbench), a Modbus client for Windows, Linux and macOS that browses and downloads the maps in this repository directly.

Building a tool that reads `.mbmap`? Follow [SPEC.md](SPEC.md), check it against the samples in [`tests/`](tests/), and open a pull request to add it to [COMPATIBILITY.md](COMPATIBILITY.md).

## Badge

A tool that reads `.mbmap` files can say so with this badge, which links here:

[![Supports .mbmap](https://img.shields.io/badge/supports-.mbmap-0A7EA4?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8dGl0bGU+bWJtYXA8L3RpdGxlPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuNTUpIj4KICAgIDxnIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0ibm9uZSI+CiAgICAgIDxyZWN0IHg9IjEuNDUiIHk9IjUuMyIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiIHJ4PSIwLjUiLz4KICAgICAgPHJlY3QgeD0iNS45NSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIgcng9IjAuNSIvPgogICAgICA8cmVjdCB4PSIxMC40NSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIgcng9IjAuNSIvPgogICAgPC9nPgogICAgPHBhdGggZD0iTTIuNzUgMTguNnYtNi4xNWEyLjI1IDIuMjUgMCAwIDEgNC41IDB2Ni4xNW0wLTYuMTVhMi4yNSAyLjI1IDAgMCAxIDQuNSAwdjYuMTUiLz4KICAgIDxwYXRoIGQ9Ik0xNi4yNSA2LjV2MTIuMWgyLjc1YTIuMjUgMi4yNSAwIDAgMCAyLjI1LTIuMjV2LTMuOWEyLjI1IDIuMjUgMCAwIDAtMi4yNS0yLjI1aC0yLjc1Ii8+CiAgPC9nPgo8L3N2Zz4K)](https://github.com/nobrega8/mbmap-library)

```markdown
[![Supports .mbmap](https://img.shields.io/badge/supports-.mbmap-0A7EA4?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KICA8dGl0bGU+bWJtYXA8L3RpdGxlPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAgLTAuNTUpIj4KICAgIDxnIGZpbGw9IiNmZmZmZmYiIHN0cm9rZT0ibm9uZSI+CiAgICAgIDxyZWN0IHg9IjEuNDUiIHk9IjUuMyIgd2lkdGg9IjIuNiIgaGVpZ2h0PSIyLjYiIHJ4PSIwLjUiLz4KICAgICAgPHJlY3QgeD0iNS45NSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIgcng9IjAuNSIvPgogICAgICA8cmVjdCB4PSIxMC40NSIgeT0iNS4zIiB3aWR0aD0iMi42IiBoZWlnaHQ9IjIuNiIgcng9IjAuNSIvPgogICAgPC9nPgogICAgPHBhdGggZD0iTTIuNzUgMTguNnYtNi4xNWEyLjI1IDIuMjUgMCAwIDEgNC41IDB2Ni4xNW0wLTYuMTVhMi4yNSAyLjI1IDAgMCAxIDQuNSAwdjYuMTUiLz4KICAgIDxwYXRoIGQ9Ik0xNi4yNSA2LjV2MTIuMWgyLjc1YTIuMjUgMi4yNSAwIDAgMCAyLjI1LTIuMjV2LTMuOWEyLjI1IDIuMjUgMCAwIDAtMi4yNS0yLjI1aC0yLjc1Ii8+CiAgPC9nPgo8L3N2Zz4K)](https://github.com/nobrega8/mbmap-library)
```

The logo is in [`assets/`](assets/): [`mbmap-logo.svg`](assets/mbmap-logo.svg) (dark, for light backgrounds) and [`mbmap-logo-white.svg`](assets/mbmap-logo-white.svg) (for badges and dark backgrounds). Its squares are registers.

## Contributing

New maps and fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), then check your file:

```sh
python tools/validate/validate.py maps/your-vendor/your-model.mbmap.json
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
