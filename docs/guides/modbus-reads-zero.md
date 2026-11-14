# A Modbus register reads 0, 0xFFFF or 0x8000

The request succeeds but the value makes no sense. Before suspecting the device, check what it is trying to tell you.

## Common reasons

- **Wrong area.** The same address can exist as an input and as a holding register with different contents. Reading the holding register when the value is an input register can return zeros. See [function codes](modbus-function-codes).
- **Off by one.** Reading the second half of a 32-bit value instead of its first half often gives 0 for small values. See [addresses](modbus-address-off-by-one).
- **Not implemented.** Many devices answer reads of unused registers with 0, 0xFFFF, 0x7FFF or 0x8000 instead of an exception. SunSpec devices use 0x8000 (−32768) for "not implemented" in signed fields and 0xFFFF in unsigned ones.
- **Not measured.** A neutral current on a three-wire connection, a phase that is not wired, or a sensor input with nothing connected reads 0 or a fixed marker.
- **Not ready.** Some devices return zeros for a few seconds after power-up, or until their first measurement cycle is done.
- **Model differences.** A register listed in a family manual may exist only on some models: the others return 0.
- **Scale too coarse.** A small current with a scale of 1 A reads 0.

## How MBMap maps record it

A map can list `sentinels`, the values that mean "not available" for each type, so a tool shows them as missing rather than as a reading. Register descriptions note which models or wiring a value needs.
