# Modbus addresses: why your reading is one register off

You read register 40001 and get the value the manual lists for 40002, or the device answers *illegal data address* for a register that is in the table. Almost always the cause is the same: the manual and your tool count registers differently.

## Three ways to write the same register

| What the manual prints | What it means | What goes on the wire |
|---|---|---|
| `40001` (Modicon reference) | holding register number 1, counted from 1, with `4` as the area prefix | address `0` |
| `1` (register number) | holding register 1, counted from 1 | address `0` |
| `0` or `0x0000` (offset) | the address itself | address `0` |

A Modbus frame always carries an address from 0 to 65535. The `4` (holding), `3` (input), `1` (discrete input) and `0` (coil) prefixes are not sent: the area is chosen by the function code (03 for holding, 04 for input, 02 for discrete inputs, 01 for coils). The leftover number is often counted from 1, so the wire address is that number **minus one**.

Six-digit references such as `400001` or `300013` work the same way: drop the first digit and subtract one (`300013` → input register `12`).

## How to tell which one your manual uses

- **Hex addresses** (`0x0BB7`, `1004h`) are almost always the wire address.
- **A first register of 40001 or 30001** means Modicon references: subtract 40001 or 30001.
- **A first register of 1** usually means 1-based numbers; a first register of 0 means wire addresses.
- **Look for a worked example.** Many manuals show a request frame ("read register 40011: 01 03 00 0A 00 01 …"). The two bytes after the function code are the wire address and settle the question.
- **Some manuals mix them**, for example a decimal "register" column that is one more than the hex "address" column next to it. Trust the hex column and the example frames.

## What your tool expects

Tools differ too. Some ask for the wire address, some for a 1-based register number, and some accept a Modicon reference and strip the prefix. If a value is shifted by exactly one register (a 32-bit value looks like garbage, or every value seems to belong to its neighbour), try the address one lower or one higher.

## How MBMap maps record it

Every `.mbmap.json` file says which convention its addresses use with `address_base`: `0` means the addresses are the wire addresses, `1` means they are 1-based and the wire address is one less. The device pages on this site, the CSV export and the Home Assistant export show the wire address next to the address as written in the map, so you never have to guess.
