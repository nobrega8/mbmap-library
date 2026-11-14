# Is it safe to write to a Modbus device?

Reading a register is harmless. Writing one changes the device, sometimes in ways that are hard to undo.

## What can go wrong

- **Wrong register.** An [off-by-one address](modbus-address-off-by-one) writes your value into the neighbouring setting: a CT ratio, a protection limit, a baud rate.
- **Communication settings.** Writing the unit ID, baud rate or parity cuts you off until you reconnect with the new values.
- **Wearing out memory.** Many devices save settings to flash or EEPROM with a limited number of writes. Writing a setpoint every second can wear it out in months. Some devices offer a RAM-only address for frequent writes.
- **Commands act at once.** Run/stop, breaker open/close, reset of energy counters and factory reset happen on the write, with no confirmation.
- **Half-written values.** Writing the two registers of a 32-bit value in separate requests can leave a mixed value for a moment, or be refused.

## Before writing

1. Check the map against the manufacturer's document, and prefer maps marked *verified* or *official*.
2. Read the register first and confirm it holds what you expect.
3. Check the allowed range; many devices clamp or reject values outside it.
4. Write multi-register values in one request (function 16).
5. Know how to restore the old value.
6. On equipment that controls power or machinery, test with it isolated.

## How MBMap maps help

Registers have an `access` (`R`, `W`, `RW`), and writable ones can carry `write_min` and `write_max`. Each map has a status that says whether it was tested on a device, taken from the manufacturer's document, or not yet checked. Tools should warn before writing to a device whose model does not match the map.
