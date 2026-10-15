# Exporting a map to Ignition

[`tools/export/export_ignition.py`](../tools/export/export_ignition.py) turns a `.mbmap.json` map into tags for **Inductive Automation Ignition 8.1**, read through Ignition's built-in **Modbus TCP driver**. The result is a tag file in Ignition's JSON format, to import in the Designer.

```sh
python tools/export/export_ignition.py maps/carlo-gavazzi/em530-em540.mbmap.json \
    --device EM540 -o em540-tags.json
```

| Option | Meaning |
|---|---|
| `--device NAME` | The device name in Ignition (letters, digits and `_`). Default `Modbus` |
| `--unit ID` | Unit ID in every item path. Default: the map's `unit_id` |
| `--zero-based` | The Ignition device has **Zero-based Addressing** on |
| `--strict` | Exit with 1 if any register was left out |

The tags are written to the output file (or stdout). Notes and the registers left out are printed on stderr, each with its location in the map, e.g. `/registers/176 (Firmware major)`.

A sample: [`ignition/em-200-tags.json`](ignition/em-200-tags.json), exported from [`examples/example-corp/em-200.mbmap.json`](../examples/example-corp/em-200.mbmap.json) with `--device EM200`, and its report, [`ignition/em-200-report.txt`](ignition/em-200-report.txt).

## Steps in Ignition

1. In the Gateway, under **Config › OPC UA › Device Connections**, add a **Modbus TCP** device. Its name is the one you pass as `--device`; host and port are the meter's (or its gateway's).
2. Set the device's advanced settings as the report says:
   - **Zero-based Addressing**: off, unless you exported with `--zero-based`.
   - **Reverse Word Order**: on when most 32- and 64-bit values of the map have `word_order` `"little"`.
   - **Reverse String Byte Order** (String Handling): as the report says. The translation follows Ignition's manual (without the option the low byte comes first), so check one string on the device.
3. In the Designer's Tag Browser, choose **Import Tags** and pick the JSON file. The map arrives as one folder (vendor and model), with a folder per `group`.
4. Read a value you know (a voltage, the model code) and compare it with the device's display.

## How the map translates

### Addresses

Each tag's OPC item path is `ns=1;s=[Device]Unit.Designator Address`, for example `ns=1;s=[EM540]1.HRI1`. The address is the address on the wire (after `address_base`) plus 1, since an Ignition device without Zero-based Addressing numbers each area from 1 (`HR1` is `40001`). With `--zero-based`, it is the address on the wire.

### Types

| `.mbmap` type | `holding` | `input` | Ignition data type |
|---|---|---|---|
| `int16` | `HR` | `IR` | `Int2` |
| `uint16` | `HRUS` | `IRUS` | `Int4` |
| `int32` | `HRI` | `IRI` | `Int4` |
| `uint32` | `HRUI` | `IRUI` | `Int8` |
| `int64` | `HRI_64` | `IRI_64` | `Int8` |
| `uint64` | `HRUI_64` | `IRUI_64` | `Int8` |
| `float32` | `HRF` | `IRF` | `Float4` |
| `float64` | `HRD` | `IRD` | `Float8` |
| `string` (`length` registers) | `HRS<address>:<2 × length>` | left out | `String` |
| `bool` in `coil` / `discrete` | `C` / `DI` | | `Boolean` |
| `bool` with `bit` (or a 1-bit field) | `HR<address>.<bit>` | `IR<address>.<bit>` | `Boolean` |

Ignition's `Int2` is signed, so unsigned values take the next larger type. `uint64` values above 2^63 − 1 do not fit `Int8`.

### Other fields

| `.mbmap` | Ignition tag |
|---|---|
| `name` | Tag name. Characters Ignition does not accept become `_`; a repeated name gets ` 2`, ` 3`… |
| `group` | A folder |
| `unit` | `engUnit` |
| `scale`, `offset` | `scaleMode` `Linear` with `rawLow` 0, `rawHigh` 1, `scaledLow` = `offset`, `scaledHigh` = `offset + scale`, so value = raw × `scale` + `offset`. The tag becomes `Float8` |
| `access` `R`, area `input` or `discrete` | `readOnly` true |
| `access` `W` or `RW` | `readOnly` false |

## What is not exported

These are listed on stderr; `--strict` makes them an error.

| In the map | Why | What the tool does |
|---|---|---|
| A bit field (`bits` 2–15, or 16 not from bit 0) | Ignition has no designator for part of a register | Left out |
| `byte_order` `"little"` on a numeric register | Ignition cannot swap the bytes inside a register | Left out |
| A 32- or 64-bit value whose `word_order` differs from most others | Reverse Word Order is one setting for the whole device | Left out. Export it again for a second device with the other setting |
| `string` in `input` | There is no `IRS` designator | Left out |
| `scale_factor` | Ignition cannot read the exponent register | Exported raw, without scaling |
| `enum` labels | Not part of an OPC tag | The tag shows the number; noted once |
| `reference`, `role`, `write_min` / `write_max`, `firmware_min` / `firmware_max`, `sentinels`, `description` | No matching tag property in the import format | Not exported |

## Not confirmed

- The defaults of Zero-based Addressing and Reverse Word Order on a new device. Ignition's manual says only to keep the defaults; set both as the report says.
- Whether Reverse Word Order also reverses the four registers of 64-bit values. The manual describes it for 32-bit values. Compare one 64-bit value with the device after import.
- Reading single bits of input registers (`IR<address>.<bit>`). The manual's examples use holding registers.

Sources: Ignition 8.1 manual, [Modbus Addressing](https://www.docs.inductiveautomation.com/docs/8.1/ignition-modules/opc-ua/opc-ua-drivers/modbus/modbus-addressing), [Connecting to a Modbus Device](https://www.docs.inductiveautomation.com/docs/8.1/ignition-modules/opc-ua/opc-ua-drivers/modbus/connecting-to-modbus-device), [Exporting and Importing Tags](https://www.docs.inductiveautomation.com/docs/8.1/platform/tags/exporting-and-importing-tags) and [Tag Properties](https://www.docs.inductiveautomation.com/docs/8.1/platform/tags/tag-properties).
