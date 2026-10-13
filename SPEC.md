# `.mbmap` — Modbus Map format, version 1

A `.mbmap` file describes the Modbus register map of one device model: who makes it, how to talk to it, and what every register means. Any tool can read or write it. It is plain text, based on CSV, so it can be edited in a spreadsheet or a text editor and diffed in git.

The key words **MUST**, **SHOULD** and **MAY** are used as in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## 1. Example

```text
@mbmap=1
@vendor=Example Corp
@model=EM-100
@description=Single-phase energy meter
@protocol=rtu
@unit_id=1
@baudrate=9600
@parity=E
@stopbits=1
@byte_order=ABCD
@address_base=0

# Measurements
name,group,area,address,type,length,scale,offset,unit,access,byte_order,bit,enum,description
Voltage,Measurements,input,0,float32,,1,0,V,R,,,,RMS voltage
Current,Measurements,input,6,float32,,1,0,A,R,,,,RMS current
Active energy,Energy,holding,256,uint32,,0.01,0,kWh,R,CDAB,,,
Relay state,Status,holding,512,bool,,,,,R,,3,0=Open|1=Closed,Bit 3 of status word
Reset energy,Commands,coil,0,bool,,,,,W,,,,Write 1 to reset counters
Serial number,Info,holding,1024,string,8,,,,R,,,,16 ASCII characters
```

## 2. File structure

- Encoding **MUST** be UTF-8. Readers **MUST** accept and ignore a leading BOM.
- Line endings **MAY** be LF or CRLF. Writers **SHOULD** use LF.
- Each line is one of:
  - **blank**: ignored.
  - **comment**: the first non-space character is `#`. The whole line is ignored. Only full-line comments exist; there are no trailing comments.
  - **metadata**: starts with `@`, in the form `@key=value`.
  - **CSV**: everything else. The first CSV line is the **header**, and every line after it is a **register row**.
- Every metadata line **MUST** come before the header.
- The separator is `,` or `;`, chosen by whichever appears first in the header line. The rest of the file uses the same separator. `;` is allowed because spreadsheets in many locales export with it.
- Fields follow [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180) quoting: a field that contains the separator or `"` is wrapped in `"`, and a `"` inside it is written as `""`. A quoted field **MUST NOT** span multiple lines.
- Leading and trailing spaces around unquoted fields and metadata values are trimmed.

## 3. Metadata

Keys are lowercase (`a-z`, `0-9`, `_`). A key **MUST NOT** appear twice in the same file.

| Key | Required | Values | Default | Meaning |
|---|---|---|---|---|
| `mbmap` | yes | `1` | | Format version |
| `vendor` | yes | text | | Manufacturer |
| `model` | yes | text | | Model or model family |
| `description` | no | text | | Short description |
| `firmware` | no | text | | Firmware version(s) the map applies to |
| `source` | no | text / URL | | Document the map was built from (manual name, version, URL) |
| `protocol` | no | `tcp`, `rtu`, `tcp+rtu` | `tcp+rtu` | Transports the device supports |
| `unit_id` | no | `0`–`255` | `1` | Default unit / slave id |
| `port` | no | `1`–`65535` | `502` | Default TCP port |
| `baudrate` | no | integer | `9600` | Default RTU baud rate |
| `parity` | no | `N`, `E`, `O` | `E` | Default RTU parity |
| `databits` | no | `7`, `8` | `8` | Default RTU data bits |
| `stopbits` | no | `1`, `2` | `1` | Default RTU stop bits |
| `byte_order` | no | `ABCD`, `CDAB`, `BADC`, `DCBA` | `ABCD` | Default byte order (§6) |
| `address_base` | no | `0`, `1` | `0` | Whether `address` is 0-based or 1-based (§5) |
| `max_read_registers` | no | `1`–`125` | `125` | Largest block the device accepts per read (FC03/04) |
| `max_read_bits` | no | `1`–`2000` | `2000` | Largest block the device accepts per read (FC01/02) |

Connection values are **defaults**: the user can still change them when connecting.

## 4. Register columns

The header names the columns. Order does not matter, and names are case-insensitive. `name`, `area`, `address` and `type` are required. Every other column is optional; when a column is missing, or a cell is empty, the default applies.

| Column | Values | Default | Meaning |
|---|---|---|---|
| `name` | text | | Variable name. **SHOULD** be unique in the file |
| `group` | text | | Free grouping for display (e.g. `Measurements`) |
| `area` | `coil`, `discrete`, `input`, `holding` | | Modbus data area (§5) |
| `address` | integer, decimal or `0x` hex | | First register / bit address |
| `type` | see §6 | | Data type |
| `length` | integer ≥ 1 | | Number of registers. Required for `string`, ignored otherwise |
| `scale` | number | `1` | Multiplier |
| `offset` | number | `0` | Added after scaling |
| `unit` | text | | Engineering unit (`V`, `kWh`, `°C`…) |
| `access` | `R`, `W`, `RW` | `R` | Allowed operations |
| `byte_order` | `ABCD`, `CDAB`, `BADC`, `DCBA` | file `@byte_order` | Overrides the default for this register |
| `bit` | `0`–`15` | | For `bool` in `input`/`holding`: which bit of the register, 0 = least significant |
| `enum` | `value=label` pairs separated by `\|` | | Labels for integer or bool values, e.g. `0=Off\|1=On\|2=Fault` |
| `description` | text | | Free text |

Engineering value = raw × `scale` + `offset`. When writing, a tool applies the inverse and rounds to the nearest integer for integer types.

## 5. Areas and addresses

| `area` | Unit | Read | Write | Allowed `access` |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | 16-bit register | FC04 | — | `R` |
| `holding` | 16-bit register | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

With `@address_base=0`, `address` is the address sent on the wire (0–65535). With `@address_base=1`, the address on the wire is `address − 1` (1–65536), which matches manuals that number registers from 1.

The 5- and 6-digit "Modicon" notation (`40001`, `300010`) is **not** valid in `address`. Write it as an area plus a number: `40001` becomes `area=holding`, `address=1`, `@address_base=1`.

## 6. Types and byte order

| `type` | Registers | Notes |
|---|---|---|
| `bool` | — | In `coil`/`discrete`: one bit. In `input`/`holding`: one bit of a register, so `bit` is required |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Floats are IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 ASCII characters per register. Trailing NUL and space characters are trimmed when reading |

Byte order names the order in which the bytes of the value arrive, where `A` is the most significant byte. It combines two independent choices:

| `byte_order` | Word order | Bytes in each register |
|---|---|---|
| `ABCD` | most significant register first | high byte first (Modbus standard) |
| `CDAB` | least significant register first | high byte first ("word swap") |
| `BADC` | most significant register first | low byte first ("byte swap") |
| `DCBA` | least significant register first | low byte first (little-endian) |

The same two choices apply to 64-bit types. For 16-bit types only the byte part applies: `BADC` and `DCBA` swap the two bytes. For `string`, the byte part decides which character of each register comes first.

## 7. Validation

A file is **invalid**, and readers **SHOULD** reject it with the line number, when:

- `@mbmap`, `@vendor` or `@model` is missing, or `@mbmap` is not `1`;
- a metadata key is repeated, or a known key has a value outside its allowed range;
- metadata appears after the header;
- the header lacks `name`, `area`, `address` or `type`, or repeats a column;
- a row has more fields than the header;
- a required cell is empty, or a cell has a value outside its allowed set;
- `address` plus the register count goes beyond the 65536-address space;
- `access` is not allowed for the `area`;
- `bool` in `input`/`holding` has no `bit`, or `string` has no `length`;
- `enum` is malformed.

Readers **SHOULD** warn, without rejecting, when names are repeated or registers overlap. Overlap can be intentional, for example the same register read as a whole word and as single bits.

## 8. Compatibility

- Readers **MUST** ignore metadata keys and columns they do not know. This lets newer files open in older tools.
- Vendor- or tool-specific additions **SHOULD** use an `x_` prefix (`@x_modbench_icon=…`, column `x_alarm_high`) so they never clash with future versions of this spec.
- A change that older readers cannot safely ignore requires a new `@mbmap` version.
