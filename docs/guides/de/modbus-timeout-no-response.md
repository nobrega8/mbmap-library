# Modbus-Timeouts: das Gerät antwortet nicht

Ein Timeout bedeutet, dass nichts zurückkam, was Ihr Werkzeug akzeptieren konnte. Gehen Sie die Liste von unten nach oben durch.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Verdrahtung.** A und B (oder D+ und D−, oder + und −) werden nicht von jedem Hersteller gleich benannt. Wenn nichts antwortet, vertauschen Sie die beiden Drähte: Das schadet nicht.
2. **Gemeinsame Masse.** Schließen Sie die Signalmasse (GND, C, 0 V) an, wenn das Gerät eine hat; lange Kabel ohne sie führen zu Fehlern, die kommen und gehen.
3. **Abschluss.** Setzen Sie an beiden Enden des Busses einen 120-Ω-Widerstand ein, nicht an jedem Gerät. Kurze Kabel auf dem Tisch funktionieren meist auch ohne.
4. **Serielle Einstellungen.** Baudrate, Datenbits, Parität und Stoppbits müssen genau übereinstimmen. Eine übliche Werkseinstellung ist 9600 oder 19200 Baud, 8 Datenbits, gerade oder keine Parität. Eine abweichende Parität bleibt unbemerkt.
5. **Unit-ID.** Jedes Gerät am Bus braucht eine eigene Adresse von 1 bis 247. Ein auf 1 eingestelltes Gerät antwortet nicht auf Anfragen an 2. Siehe [Unit-ID](modbus-unit-id-slave-id).
6. **Ein Master.** Zwei Master am selben Bus (eine SPS und ein Laptop) kollidieren.
7. **Richtung des Wandlers.** Billige USB-RS-485-Wandler schalten die Richtung bei hohen Baudraten manchmal zu langsam um. Versuchen Sie eine niedrigere Rate.

## Modbus TCP

1. **Erreichen Sie zuerst das Gerät.** Senden Sie ein `ping` und prüfen Sie, ob Port 502 offen ist.
2. **Verbindungslimit.** Viele Geräte akzeptieren nur wenige TCP-Verbindungen. Ein Werkzeug, das Verbindungen offen lässt, kann andere aussperren, bis das Gerät sie per Timeout beendet.
3. **Unit-ID über Gateways.** Hinter einem TCP-zu-RTU-Gateway wählt die Unit-ID das serielle Gerät und muss zu dessen Adresse passen; manche Gateways brauchen für sich selbst 0 oder 255.
4. **Modbus TCP aktiviert?** Manche Geräte werden mit ausgeschaltetem Modbus TCP ausgeliefert oder antworten nur auf einem anderen Port.

## Das Gerät beantwortet manche Anfragen, andere nicht

- Zu große Anfragen oder solche, die Lücken in der Registertabelle überspannen, werden möglicherweise mit einer Exception beantwortet oder ignoriert. Lesen Sie kleinere Blöcke.
- Manche Geräte brauchen eine Pause zwischen Anfragen (3,5 Zeichenzeiten bei RTU, bei langsamen Geräten mehr). Erhöhen Sie das Abfrageintervall.
- Manche antworten erst nach einer Verzögerung von zehn oder hundert Millisekunden; erhöhen Sie vor allem anderen den Antwort-Timeout.
