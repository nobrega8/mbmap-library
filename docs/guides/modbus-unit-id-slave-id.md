# Modbus unit ID (slave ID): which device answers

Every Modbus request carries a one-byte unit ID, also called slave ID, slave address or device address.

## On RS-485 (Modbus RTU)

- Each device on the bus has its own address from 1 to 247, set on its display, with DIP switches or in its configuration software.
- Address 0 is broadcast: every device acts on a write, and none answers. Reads to 0 get no reply.
- A device set to another address ignores your request completely, so a wrong unit ID looks like a dead device: you get a [timeout](modbus-timeout-no-response), not an error.

## On Modbus TCP

- A device reached directly by IP usually ignores the unit ID or expects 1. Some expect 0 or 255, and a few refuse anything but their configured value.
- Behind a TCP-to-RTU gateway the unit ID selects the serial device: it must match that device's RS-485 address. The gateway itself often answers on 0, 255 or a configured ID.
- Some devices with several internal parts (an inverter with a meter and a battery) answer different unit IDs for each part.

## Finding an unknown address

- Read it from the device's display or label.
- Scan: send a read of a common register to every address from 1 to 247 at the device's baud rate and note which answers. Do it with only that device connected.
- Reset to factory settings; the manual gives the default (often 1).

## How MBMap maps record it

A map gives the device's default `unit_id` (and serial settings and TCP port). The default is only a starting point: devices are usually reconfigured when installed.
