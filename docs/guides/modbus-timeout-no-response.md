# Modbus timeouts: the device does not answer

A timeout means nothing came back that your tool could accept. Work through the list from the bottom of the stack up.

## Modbus RTU (RS-485)

1. **Wiring.** A and B (or D+ and D−, or + and −) are not named the same way by every manufacturer. If nothing answers, swap the two wires: it does no harm.
2. **Common ground.** Connect the signal ground (GND, C, 0 V) when the device has one; long cables without it give errors that come and go.
3. **Termination.** Put a 120 Ω resistor at both ends of the bus, not at every device. Short bench cables usually work without it.
4. **Serial settings.** Baud rate, data bits, parity and stop bits must match exactly. A common factory setting is 9600 or 19200 baud, 8 data bits, even or no parity. A parity mismatch is silent.
5. **Unit ID.** Every device on the bus needs its own address, 1 to 247. A device set to 1 does not answer requests for 2. See [unit ID](modbus-unit-id-slave-id).
6. **One master.** Two masters on the same bus (a PLC and a laptop) collide.
7. **Converter direction.** Cheap USB–RS-485 converters sometimes switch direction too slowly at high baud rates. Try a lower rate.

## Modbus TCP

1. **Reach the device first.** `ping` it and check that port 502 is open.
2. **Connection limit.** Many devices accept only a few TCP connections. A tool that leaves connections open can lock others out until the device times them out.
3. **Unit ID through gateways.** Behind a TCP-to-RTU gateway the unit ID picks the serial device and must match its address; some gateways need 0 or 255 for themselves.
4. **Modbus TCP enabled?** Some devices ship with it off, or answer only on another port.

## The device answers some requests but not others

- Requests that are too large, or that cover gaps in the register table, may be answered with an exception or ignored. Read smaller blocks.
- Some devices need a pause between requests (3.5 character times on RTU, more on slow devices). Raise the poll interval.
- Some answer only after a delay of tens or hundreds of milliseconds; raise the response timeout before anything else.
