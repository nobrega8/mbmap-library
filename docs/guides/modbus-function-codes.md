# Modbus function codes and register areas

Every Modbus request names a function code. It decides both the action and the area of the device it acts on.

| Code | Name | Area | Size |
|---|---|---|---|
| 01 | Read Coils | coils (0x) | bits, read/write |
| 02 | Read Discrete Inputs | discrete inputs (1x) | bits, read only |
| 03 | Read Holding Registers | holding registers (4x) | 16-bit, read/write |
| 04 | Read Input Registers | input registers (3x) | 16-bit, read only |
| 05 | Write Single Coil | coils | write `0xFF00` for on, `0x0000` for off |
| 06 | Write Single Register | holding registers | one register |
| 15 (0x0F) | Write Multiple Coils | coils | several bits |
| 16 (0x10) | Write Multiple Registers | holding registers | several registers |
| 17 (0x11) | Report Server ID | — | device identity, format set by the device |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | vendor, product code, revision as text |

## Holding or input?

The manual's table or its address prefix tells you: `3xxxx` is read with 04, `4xxxx` with 03. Some devices answer both functions with the same data; others refuse the wrong one with exception 01 (illegal function). If a manual gives no prefix and no function, try 03 first.

## Writing

- A 32-bit value needs two registers written together with 16; writing its halves one at a time with 06 can leave the device with a mixed value, or be refused.
- Some devices accept only 06, others only 16. The manual's list of supported functions settles it.
- Coils written with 05 must carry exactly `0xFF00` or `0x0000`.

## How MBMap maps record it

Each register has an `area` (`coil`, `discrete`, `input`, `holding`) and an `access` (`R`, `W`, `RW`); a tool picks the function from them. Maps can also describe the identity functions 17 and 43, so a tool can check which device it is talking to.
