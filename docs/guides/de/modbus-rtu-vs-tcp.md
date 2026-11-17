# Modbus RTU, Modbus TCP und RS-485

Drei Namen, die oft verwechselt werden.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Medium | serielle Leitung, fast immer RS-485 (manchmal RS-232) | Ethernet oder WLAN |
| Adressierung | Unit-ID 1–247 am Bus | IP-Adresse und Port (502), plus Unit-ID |
| Fehlerprüfung | CRC-16 in jedem Frame | eigene Prüfungen von TCP; kein CRC |
| Framing | Stille von 3,5 Zeichen zwischen Frames | 7-Byte-Header (MBAP) mit einer Länge |
| Geräte pro Verbindung | bis zu 32 Einheitslasten pro Segment (mehr mit Transceivern geringer Last), ein Master | viele Clients pro Gerät, vom Gerät begrenzt |
| Typische Geschwindigkeit | 9600–115200 Baud | 10/100 Mbit/s, vom Gerät begrenzt |

**RS-485** ist nur die elektrische Schicht: zwei Drähte, ein differentielles Signal, ein Bus. Modbus RTU läuft darauf, ebenso andere Protokolle (BACnet MS/TP, DMX, M-Bus über RS-485-Adapter).

**Modbus ASCII** sendet dieselben Anfragen als lesbaren Hex-Text; es ist heute selten.

<mb-adu></mb-adu>

## Dieselben Register

Die Registermap ist unabhängig vom Transport dieselbe: Ein Gerät, das beides anbietet, antwortet mit denselben Adressen, Typen und Skalierungen. Was sich ändert, ist der Zugang: serielle Einstellungen und Unit-ID bei RTU, IP-Adresse und Port bei TCP.

## Gateways

Ein Modbus-TCP-zu-RTU-Gateway lässt Ethernet-Werkzeuge serielle Geräte erreichen. Die Unit-ID der TCP-Anfrage wählt das Gerät auf der seriellen Seite. Gateways bringen eigene Timeouts mit; antwortet ein Gerät dahinter nicht, prüfen Sie zuerst die seriellen Einstellungen am Gateway.

## Wie MBMap-Maps das festhalten

Eine Map gibt an, welche Transporte das Gerät anbietet (`protocol`: `rtu`, `tcp` oder beide) und deren Standardwerte (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
