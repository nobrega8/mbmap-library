# Modbus RTU, Modbus TCP and RS-485

Three names that are often mixed up.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Medium | serial line, almost always RS-485 (sometimes RS-232) | Ethernet or Wi-Fi |
| Addressing | unit ID 1–247 on the bus | IP address and port (502), plus a unit ID |
| Error check | CRC-16 in every frame | TCP's own checks; no CRC |
| Framing | silence of 3.5 characters between frames | 7-byte header (MBAP) with a length |
| Devices per link | up to 32 unit loads per segment (more with low-load transceivers), one master | many clients per device, limited by the device |
| Typical speed | 9600–115200 baud | 10/100 Mbit/s, limited by the device |

**RS-485** is only the electrical layer: two wires, a differential signal, a bus. Modbus RTU runs on it, and so do other protocols (BACnet MS/TP, DMX, M-Bus over RS-485 adapters).

**Modbus ASCII** sends the same requests as readable hex text; it is rare today.

## Same registers

The register map is the same whatever the transport: a device that offers both answers with the same addresses, types and scales. What changes is how you reach it: serial settings and unit ID on RTU, IP address and port on TCP.

## Gateways

A Modbus TCP-to-RTU gateway lets Ethernet tools reach serial devices. The TCP request's unit ID picks the device on the serial side. Gateways add their own timeouts; if a device behind one does not answer, check the serial settings on the gateway first.

## How MBMap maps record it

A map says which transports the device offers (`protocol`: `rtu`, `tcp` or both) and their defaults (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
