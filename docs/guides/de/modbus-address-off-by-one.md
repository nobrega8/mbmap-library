# Modbus-Adressen: warum Ihr Messwert ein Register danebenliegt

Sie lesen Register 40001 und erhalten den Wert, den das Handbuch für 40002 nennt, oder das Gerät antwortet mit *illegal data address* für ein Register, das in der Tabelle steht. Fast immer ist die Ursache dieselbe: Handbuch und Werkzeug zählen Register unterschiedlich.

## Drei Schreibweisen für dasselbe Register

| Was im Handbuch steht | Was es bedeutet | Was auf die Leitung geht |
|---|---|---|
| `40001` (Modicon-Referenz) | Halteregister Nummer 1, ab 1 gezählt, mit `4` als Bereichspräfix | Adresse `0` |
| `1` (Registernummer) | Halteregister 1, ab 1 gezählt | Adresse `0` |
| `0` oder `0x0000` (Offset) | die Adresse selbst | Adresse `0` |

Ein Modbus-Frame enthält immer eine Adresse von 0 bis 65535. Die Präfixe `4` (Halteregister), `3` (Eingangsregister), `1` (diskreter Eingang) und `0` (Coil) werden nicht gesendet: Der Bereich ergibt sich aus dem Funktionscode (03 für Halteregister, 04 für Eingangsregister, 02 für diskrete Eingänge, 01 für Coils). Die übrig bleibende Zahl wird oft ab 1 gezählt, die Adresse auf der Leitung ist dann diese Zahl **minus eins**.

Sechsstellige Referenzen wie `400001` oder `300013` funktionieren genauso: erste Ziffer weglassen und eins abziehen (`300013` → Eingangsregister `12`).

<mb-address></mb-address>

## Woran Sie erkennen, welche Schreibweise Ihr Handbuch verwendet

- **Hex-Adressen** (`0x0BB7`, `1004h`) sind fast immer die Adresse auf der Leitung.
- **Ein erstes Register 40001 oder 30001** bedeutet Modicon-Referenzen: 40001 bzw. 30001 abziehen.
- **Ein erstes Register 1** bedeutet meist eine Zählung ab 1; ein erstes Register 0 bedeutet Adressen auf der Leitung.
- **Suchen Sie ein durchgerechnetes Beispiel.** Viele Handbücher zeigen einen Anfrage-Frame („Register 40011 lesen: 01 03 00 0A 00 01 …“). Die zwei Bytes nach dem Funktionscode sind die Adresse auf der Leitung und klären die Frage.
- **Manche Handbücher mischen beides**, etwa eine dezimale Spalte „Register“, die um eins größer ist als die danebenstehende Hex-Spalte „Adresse“. Vertrauen Sie der Hex-Spalte und den Beispiel-Frames.

## Was Ihr Werkzeug erwartet

Auch Werkzeuge unterscheiden sich. Manche verlangen die Adresse auf der Leitung, manche eine Registernummer ab 1, und manche akzeptieren eine Modicon-Referenz und entfernen das Präfix. Wenn ein Wert genau um ein Register verschoben ist (ein 32-Bit-Wert sieht aus wie Unsinn, oder jeder Wert scheint zu seinem Nachbarn zu gehören), versuchen Sie die Adresse um eins niedriger oder höher.

## Wie MBMap-Maps das festhalten

Jede `.mbmap.json`-Datei gibt mit `address_base` an, welche Konvention ihre Adressen verwenden: `0` bedeutet, die Adressen sind die Adressen auf der Leitung, `1` bedeutet, sie zählen ab 1 und die Adresse auf der Leitung ist um eins kleiner. Die Geräteseiten dieser Website, der CSV-Export und der Home-Assistant-Export zeigen die Adresse auf der Leitung neben der in der Map geschriebenen Adresse, sodass Sie nie raten müssen.
