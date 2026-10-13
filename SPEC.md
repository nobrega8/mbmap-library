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
@enum_relay=0=Open|1=Closed

# Measurements
name,group,area,address,type,length,scale,offset,unit,access,byte_order,bit,enum,description
Voltage,Measurements,input,0,float32,,1,0,V,R,,,,RMS voltage
Current,Measurements,input,6,float32,,1,0,A,R,,,,RMS current
Active energy,Energy,holding,256,uint32,,0.01,0,kWh,R,CDAB,,,
Relay state,Status,holding,512,bool,,,,,R,,3,@relay,Bit 3 of status word
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
- Fields follow [RFC 4180](https://www.rfc-editor.org/rfc/rfc4180) quoting: a field that contains the separator or `"` is wrapped in `"`, and a `"` inside it is written as `""`. A quoted field **MUST NOT** span multiple lines. A row whose first field starts with `#` or `@` **MUST** quote that field, or it would be read as a comment or as metadata.
- Leading and trailing spaces are trimmed from every field (quoted or not) and every metadata value.
- Column names and enumerated values, in metadata and in cells (`area`, `type`, `access`, `byte_order`, `protocol`, `parity`), are case-insensitive. Writers **SHOULD** use the spelling shown in this spec.

## 3. Metadata

Keys are lowercase (`a-z`, `0-9`, `_`). A key **MUST NOT** appear twice in the same file.

| Key | Required | Values | Default | Meaning |
|---|---|---|---|---|
| `mbmap` | yes | `1` | | Format version |
| `vendor` | yes | text | | Manufacturer |
| `model` | yes | text | | Model or model family |
| `vendor_website` | no | domain or `http(s)://` URL | | Manufacturer's website, e.g. `se.com` or `https://www.se.com` |
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
| `sentinel_<type>` | no | `value=label` pairs separated by `\|` | | Reserved raw values for registers of that type (§4.2), e.g. `@sentinel_uint16=0xFFFF=Unimplemented` |
| `enum_<name>` | no | `value=label` pairs separated by `\|` | | A named translation table (§4.1), e.g. `@enum_run_state=0=Stopped\|1=Idle\|2=Running` |

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
| `scale_factor` | register `name` | | Name of another register in the file whose integer value is a power-of-ten exponent for this one (§4.4) |
| `offset` | number | `0` | Added after scaling |
| `unit` | text | | Engineering unit (`V`, `kWh`, `°C`…) |
| `access` | `R`, `W`, `RW` | `R` | Allowed operations |
| `byte_order` | `ABCD`, `CDAB`, `BADC`, `DCBA` | file `@byte_order` | Overrides the default for this register |
| `bit` | `0`–`15` | | For `bool` in `input`/`holding`: which bit of the register, 0 = least significant. For a `uint16` bit field: its lowest bit |
| `bits` | `1`–`16` | | For `uint16` in `input`/`holding`: width of a bit field starting at `bit` (§4.3) |
| `enum` | `value=label` pairs separated by `\|`, or `@name` | | Labels for integer or bool values (§4.1), e.g. `0=Off\|1=On\|2=Fault` or `@run_state` |
| `description` | text | | Free text |

### 4.1 Translation tables

Many registers hold a number that stands for a state: `0` is stopped, `1` is idle, `2` is starting, and so on. The `enum` column turns those numbers into labels. It takes either:

- **inline pairs**, written in the cell: `0=Stopped|1=Idle|2=Starting|3=Running|4=Fault`;
- **a named table**, defined once in the metadata and referenced as `@name`. This avoids repeating the same list on every register that uses it:

```text
@enum_run_state=0=Stopped|1=Idle|2=Starting|3=Running|4=Fault

name,area,address,type,enum
Pump 1 state,holding,100,uint16,@run_state
Pump 2 state,holding,101,uint16,@run_state
```

Values are integers (decimal or `0x` hex), compared with the **raw** value before `scale` and `offset`. A label is any text without `|`; leading and trailing spaces are trimmed. A value that is not in the table is shown as a plain number. Tools **SHOULD** offer the labels when writing.

### 4.2 Sentinel values

Some devices answer with a reserved raw value instead of a reading: one value means "not implemented", another "over range", another "sensor fault". A sentinel table declares them for every register of one type:

```text
@sentinel_uint16=0xFFFF=Unimplemented|0xFFFE=Over range|0xFFFD=Under range
@sentinel_int16=0x7FFF=Unimplemented|0x7FFE=Over range|0x7FFD=Under range
@sentinel_uint32=0xFFFFFFFF=Unimplemented
```

- `<type>` is one of `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. A table applies to every register of that type.
- Values are integers (decimal or `0x` hex) that fit the type, compared with the **raw** value before `scale` and `offset`.
- When a reading matches, tools **SHOULD** show the label instead of a number and **SHOULD NOT** treat it as a measurement (in charts, limits or averages).
- An `enum` label for the same raw value takes precedence over the sentinel.

### 4.3 Bit fields

Some devices pack several small values into one register, for example four 4-bit alarm codes. A `uint16` row with `bit` and `bits` reads one of them: raw value = (register >> `bit`) & (2^`bits` − 1). `bit` + `bits` **MUST NOT** exceed 16.

```text
name,area,address,type,bit,bits,enum
Alarm A,holding,100,uint16,12,4,@alarm_condition
Alarm B,holding,100,uint16,8,4,@alarm_condition
```

Rows that read different fields of the same register do not overlap. Writing a field **SHOULD** read the register, change only the field's bits and write it back.

### 4.4 Scale factors

Some devices, notably SunSpec inverters and meters, send a separate exponent register for a value instead of a fixed scale: the value is raw × 10^exponent, and the exponent can change with the device's range. The `scale_factor` column names that exponent register:

```text
name,area,address,type,unit,scale_factor
AC power,holding,40083,int16,W,W_SF
W_SF,holding,40084,int16,,
```

- The named register **MUST** be a row of the same file with an integer type (`int16` … `uint64`) and no `bits`, and **MUST NOT** itself have a `scale_factor`. If several rows share the name, the first one counts.
- Only numeric types can have a `scale_factor` (not `bool` or `string`).
- A tool reads the exponent register together with the value, also when the user chose not to show it. If the exponent cannot be read, or is a sentinel (§4.2, e.g. SunSpec's `-32768` = not implemented), the value is not available.
- When writing, a tool reads the exponent first and applies the inverse.

Engineering value = raw × 10^`scale_factor` × `scale` + `offset` (without a `scale_factor`: raw × `scale` + `offset`). When writing, a tool applies the inverse and rounds to the nearest integer for integer types.

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

Readers **SHOULD** report every problem with its line number and one of the codes below, so tools agree on what is wrong. An **error** makes the file invalid. A **warning** is reported, but the file is still usable.

| Code | Severity | When |
|---|---|---|
| `not-utf8` | error | The file is not valid UTF-8 |
| `no-header` | error | There is no header line |
| `missing-meta` | error | `@mbmap`, `@vendor` or `@model` is missing (reported without a line) |
| `malformed-meta` | error | A line starts with `@` but is not `@key=value` with a valid key |
| `duplicate-meta` | error | A metadata key appears twice |
| `bad-meta-value` | error | A known key has a value outside its allowed set or range, including `@mbmap` other than `1` |
| `meta-after-header` | error | Metadata appears after the header |
| `missing-column` | error | The header lacks `name`, `area`, `address` or `type` |
| `duplicate-column` | error | The header repeats a column |
| `too-many-fields` | error | A row has more fields than the header |
| `empty-cell` | error | `name`, `area`, `address` or `type` is empty in a row |
| `bad-area` | error | Unknown `area` |
| `bad-type` | error | Unknown `type` |
| `type-area` | error | A type other than `bool` in `coil` or `discrete` |
| `bad-address` | error | `address` is not an integer |
| `address-range` | error | The address is below `@address_base`, or the value goes beyond address 65535 |
| `missing-bit` | error | `bool` in `input`/`holding` without `bit` |
| `bad-bit` | error | `bit` outside `0`–`15` |
| `missing-length` | error | `string` without `length` |
| `bad-length` | error | `length` is not an integer ≥ 1 |
| `bad-access` | error | Unknown `access`, or not allowed for the `area` |
| `bad-byte-order` | error | Unknown `byte_order` in a row |
| `bad-number` | error | `scale` or `offset` is not a number |
| `bad-enum` | error | An `enum` cell or an `@enum_<name>` table is not a list of `integer=label` pairs |
| `bad-sentinel` | error | `@sentinel_<type>` names an unsupported type, is not a list of `integer=label` pairs, or has a value that does not fit the type |
| `bad-bits` | error | `bits` is not an integer from 1 to 16, is used on a type other than `uint16` or outside `input`/`holding`, has no `bit`, or `bit` + `bits` exceeds 16 |
| `unknown-enum` | error | An `enum` cell references `@name`, but no `@enum_<name>` table defines it |
| `unknown-scale-factor` | error | `scale_factor` names no register of the file (rows with errors do not count) |
| `bad-scale-factor` | error | `scale_factor` is set on a `bool` or `string`, or names a register that is not a whole integer (a float, `bool`, `string` or bit field) or that has a `scale_factor` itself |
| `no-rows` | warning | The file has a header but no registers |
| `duplicate-name` | warning | A `name` is used more than once |
| `overlap` | warning | A value starts inside another value's registers in the same area, which usually means a wrong address or type. Rows that start at the same address are alternative readings of the same data (for example a code read as a number and as text) and never count as overlap; neither do bits and bit fields of one register (`bool` + `bit`, `uint16` + `bit` + `bits`) |
| `unknown-column` | warning | A column is not in this spec and does not start with `x_` (reported without a line) |
| `unused-bit` | warning | `bit` is set on a row where it has no effect (any type but `bool`, unless `bits` is also set on a `uint16`) |

A row with an error in `name`, `area`, `address` or `type` is not checked further. A row with any error is left out of the `overlap` check.

The [`tests/`](tests/) folder holds sample files with the diagnostics each one must produce, so any implementation can check itself against them.

## 8. Compatibility

- Readers **MUST** ignore metadata keys and columns they do not know. This lets newer files open in older tools.
- Vendor- or tool-specific additions **SHOULD** use an `x_` prefix (`@x_modbench_icon=…`, column `x_alarm_high`) so they never clash with future versions of this spec.
- A change that older readers cannot safely ignore requires a new `@mbmap` version.
