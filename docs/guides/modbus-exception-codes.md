# Modbus exception codes: what the device is telling you

When a Modbus device understands a request but cannot carry it out, it answers with an exception: the function code with its top bit set (`0x83` for a failed read of holding registers) and a one-byte code.

| Code | Name | Usual cause | What to try |
|---|---|---|---|
| 01 | Illegal function | The device does not support this function code: reading input registers (04) from a device with holding registers only, or writing with 16 to a device that only accepts 06 | Use the function code the manual lists for that table |
| 02 | Illegal data address | The address does not exist, or the block you asked for runs into a gap | Check the [address offset](modbus-address-off-by-one); read fewer registers at once |
| 03 | Illegal data value | The quantity is too large (more than 125 registers) or a written value is out of range | Read smaller blocks; check the allowed range before writing |
| 04 | Server device failure | The device failed while doing it; some devices use it for any refused write or for reading a block it does not allow | Read one register at a time; check the device's state |
| 05 | Acknowledge | Accepted, but it will take a while (programming, saving) | Wait, then poll |
| 06 | Server device busy | The device is busy | Retry later |
| 0A | Gateway path unavailable | A gateway could not reach the device behind it | Check the serial side of the gateway and its routing |
| 0B | Gateway target failed to respond | The gateway forwarded the request but the device did not answer | Check the unit ID, baud rate and wiring behind the gateway |

## No answer at all is not an exception

A device that receives a frame with a bad CRC, a wrong unit ID or a parity error stays silent: you get a timeout, not an exception. See [timeouts](modbus-timeout-no-response).

## Blocks that span gaps

Many devices refuse a read that covers any unused address, even when every register you need exists. If reading 20 registers fails with 02 but reading them one by one works, split the request at the gaps. Maps can say how many registers a device accepts per request (`max_read_registers`).
