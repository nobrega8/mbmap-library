# Modbus CRC errors on RS-485

A CRC error means a frame arrived but its checksum did not match: bytes were changed or lost on the way. Unlike a wrong address, it points at the physical link or the timing.

## Common causes

- **Noise.** Unshielded cable run next to power cables or drives. Use twisted pair, shielded, with the shield grounded at one end only.
- **Missing or extra termination.** One 120 Ω resistor at each end of the bus; none in between.
- **No bias.** An idle bus with no bias resistors floats, and the first bytes of a frame can be read wrong. Many converters and masters have a bias option.
- **Stubs and star wiring.** RS-485 wants one line from device to device, not branches.
- **Baud rate slightly off** on cheap converters or at high rates. Try a lower baud rate.
- **Frames merging.** If the master sends the next request before the bus is quiet for 3.5 character times, devices see one long, broken frame. Increase the delay between requests.
- **Two masters**, or a device answering on the same address as another.

## Steps

1. Lower the baud rate and see whether the errors stop.
2. Test with one device and a short cable. If that works, the problem is the bus, not the device.
3. Check termination with the power off: the resistance between A and B should be about 60 Ω with both terminators fitted.
4. Add bias if the master or converter offers it.
5. Increase the poll interval and the timeout.

An occasional CRC error on a long industrial bus is normal; a tool should retry. Errors on most frames are not.
