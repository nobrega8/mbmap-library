# Modbus-Exception-Codes: was das Gerät Ihnen sagt

Wenn ein Modbus-Gerät eine Anfrage versteht, sie aber nicht ausführen kann, antwortet es mit einer Exception: dem Funktionscode mit gesetztem höchstem Bit (`0x83` bei einem fehlgeschlagenen Lesen von Halteregistern) und einem Ein-Byte-Code.

| Code | Name | Übliche Ursache | Was Sie versuchen können |
|---|---|---|---|
| 01 | Illegal function | Das Gerät unterstützt diesen Funktionscode nicht: Eingangsregister (04) von einem Gerät lesen, das nur Halteregister hat, oder mit 16 auf ein Gerät schreiben, das nur 06 akzeptiert | Verwenden Sie den Funktionscode, den das Handbuch für diese Tabelle nennt |
| 02 | Illegal data address | Die Adresse existiert nicht, oder der angeforderte Block läuft in eine Lücke | Prüfen Sie den [Adressversatz](modbus-address-off-by-one); lesen Sie weniger Register auf einmal |
| 03 | Illegal data value | Die Anzahl ist zu groß (mehr als 125 Register) oder ein geschriebener Wert liegt außerhalb des Bereichs | Lesen Sie kleinere Blöcke; prüfen Sie vor dem Schreiben den zulässigen Bereich |
| 04 | Server device failure | Das Gerät ist dabei ausgefallen; manche Geräte verwenden ihn für jeden abgelehnten Schreibvorgang oder für das Lesen eines Blocks, den sie nicht zulassen | Lesen Sie jeweils ein Register; prüfen Sie den Zustand des Geräts |
| 05 | Acknowledge | Angenommen, dauert aber eine Weile (Programmierung, Speichern) | Warten, dann abfragen |
| 06 | Server device busy | Das Gerät ist beschäftigt | Später erneut versuchen |
| 0A | Gateway path unavailable | Ein Gateway konnte das Gerät hinter sich nicht erreichen | Prüfen Sie die serielle Seite des Gateways und sein Routing |
| 0B | Gateway target failed to respond | Das Gateway hat die Anfrage weitergeleitet, aber das Gerät hat nicht geantwortet | Prüfen Sie Unit-ID, Baudrate und Verdrahtung hinter dem Gateway |

<mb-exceptions></mb-exceptions>

## Keine Antwort ist keine Exception

Ein Gerät, das einen Frame mit falschem CRC, falscher Unit-ID oder einem Paritätsfehler empfängt, bleibt stumm: Sie erhalten einen Timeout, keine Exception. Siehe [Timeouts](modbus-timeout-no-response).

## Blöcke über Lücken hinweg

Viele Geräte lehnen einen Lesevorgang ab, der eine ungenutzte Adresse berührt, auch wenn jedes benötigte Register existiert. Schlägt das Lesen von 20 Registern mit 02 fehl, das einzelne Lesen aber funktioniert, teilen Sie die Anfrage an den Lücken. Maps können angeben, wie viele Register ein Gerät pro Anfrage akzeptiert (`max_read_registers`).
