# Modbus-Funktionscodes und Registerbereiche

Jede Modbus-Anfrage nennt einen Funktionscode. Er bestimmt sowohl die Aktion als auch den Bereich des Geräts, auf den sie wirkt.

| Code | Name | Bereich | Größe |
|---|---|---|---|
| 01 | Read Coils | Coils (0x) | Bits, Lesen/Schreiben |
| 02 | Read Discrete Inputs | diskrete Eingänge (1x) | Bits, nur Lesen |
| 03 | Read Holding Registers | Halteregister (4x) | 16 Bit, Lesen/Schreiben |
| 04 | Read Input Registers | Eingangsregister (3x) | 16 Bit, nur Lesen |
| 05 | Write Single Coil | Coils | `0xFF00` für Ein, `0x0000` für Aus schreiben |
| 06 | Write Single Register | Halteregister | ein Register |
| 15 (0x0F) | Write Multiple Coils | Coils | mehrere Bits |
| 16 (0x10) | Write Multiple Registers | Halteregister | mehrere Register |
| 17 (0x11) | Report Server ID | — | Geräteidentität, Format vom Gerät festgelegt |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | Hersteller, Produktcode, Revision als Text |

## Halte- oder Eingangsregister?

Die Tabelle im Handbuch oder das Adresspräfix verrät es: `3xxxx` wird mit 04 gelesen, `4xxxx` mit 03. Manche Geräte beantworten beide Funktionen mit denselben Daten; andere lehnen die falsche mit der Exception 01 (illegal function) ab. Nennt ein Handbuch weder Präfix noch Funktion, versuchen Sie zuerst 03.

## Schreiben

- Ein 32-Bit-Wert braucht zwei zusammen mit 16 geschriebene Register; das einzelne Schreiben der Hälften mit 06 kann das Gerät mit einem gemischten Wert zurücklassen oder abgelehnt werden.
- Manche Geräte akzeptieren nur 06, andere nur 16. Die Liste der unterstützten Funktionen im Handbuch klärt das.
- Mit 05 geschriebene Coils müssen genau `0xFF00` oder `0x0000` enthalten.

## Wie MBMap-Maps das festhalten

Jedes Register hat einen `area` (`coil`, `discrete`, `input`, `holding`) und einen `access` (`R`, `W`, `RW`); ein Werkzeug wählt daraus die Funktion. Maps können auch die Identitätsfunktionen 17 und 43 beschreiben, damit ein Werkzeug prüfen kann, mit welchem Gerät es spricht.
