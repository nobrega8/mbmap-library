# mbmap-library

An open library of Modbus register maps in the [`.mbmap` format](SPEC.md).

Each file describes one device model: the manufacturer, how to connect to it and what every register means. Load a map into a compatible tool and you get the device's variables, already named, scaled and typed, without typing addresses from a PDF manual.

## Layout

```text
SPEC.md                         the .mbmap format specification
maps/<vendor>/<model>.mbmap     the shared maps
examples/                       fictional maps that show the format
tools/validate.py               validator (also runs in CI)
```

Folder and file names are lowercase slugs, e.g. `maps/acme-meters/pm-200.mbmap`.

## Using the maps

`.mbmap` is plain text based on CSV, so you can open a map in any text editor or spreadsheet. Tools that read the format:

- [Modbench](https://github.com/nobrega8/modbench): a lightweight Modbus TCP/RTU client (in development)

Building a tool that reads `.mbmap`? Open a pull request to add it here.

## Contributing

New maps and fixes are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md), then check your file:

```sh
python tools/validate.py maps/your-vendor/your-model.mbmap
```

## License

The maps, the spec and the tools are dedicated to the public domain under [CC0 1.0](LICENSE). You can use them for anything, including commercial products, without asking or giving credit.

The maps are provided as is. Always check a map against the manufacturer's documentation before you write to a live device.
