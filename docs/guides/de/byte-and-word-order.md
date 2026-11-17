# Byte- und Wortreihenfolge: wenn 32-Bit-Werte falsch herauskommen

Eine Spannung liest sich als 1,7 × 10³⁸, ein Energiezähler springt in Schritten von 65 536, oder eine Temperatur ist eine winzige negative Zahl. Die Register sind richtig; falsch ist die Reihenfolge, in der die beiden Register eines 32-Bit-Wertes zusammengesetzt werden.

## Ein Register ist einfach, zwei nicht

Ein Modbus-Register hat 16 Bit und wird mit dem höchstwertigen Byte zuerst gesendet. Für Werte, die länger als ein Register sind, sagt der Standard nichts, daher legt jeder Hersteller selbst fest, wie er eine 32-Bit-Ganzzahl oder einen Float auf zwei Register verteilt (und einen 64-Bit-Wert auf vier).

Die vier Reihenfolgen werden meist nach den Bytes des Wertes benannt, wobei `A` das höchstwertige ist:

| Name | Register 1 | Register 2 | Auch genannt |
|---|---|---|---|
| `ABCD` | A B | C D | Big-Endian, höheres Wort zuerst |
| `CDAB` | C D | A B | Wortvertauschung, niederes Wort zuerst, LSW first |
| `BADC` | B A | D C | Bytevertauschung |
| `DCBA` | D C | B A | Little-Endian, beides vertauscht |

`ABCD` und `CDAB` decken fast alle Geräte ab. `CDAB` ist bei Schneider, Carlo Gavazzi und vielen chinesischen Zählern verbreitet; `ABCD` bei Siemens, Janitza und den meisten SunSpec-Geräten.

<mb-byte-order></mb-byte-order>

## So finden Sie die richtige

1. **Lesen Sie den Abschnitt zum Datenformat im Handbuch.** Suchen Sie nach „word order“, „LSW first“, „MSW first“, „high word first“ oder „big endian“.
2. **Lesen Sie einen bekannten Wert.** Lesen Sie eine Spannung, die um 230 V liegen sollte, in jeder Reihenfolge als Float. Nur eine ergibt eine vernünftige Zahl.
3. **Beobachten Sie einen Zähler.** Wenn das niedrige Register eines Energiezählers in das überläuft, was Ihr Werkzeug als hohen Teil anzeigt, vertauschen Sie die Wörter.
4. **Prüfen Sie 64-Bit-Werte gesondert.** Manche Geräte speichern 32-Bit-Werte mit dem höheren Wort zuerst und 64-Bit-Werte in anderer Reihenfolge.

## Zeichenketten

Text steht meist mit zwei Zeichen pro Register, das erste Zeichen im höheren Byte. Einige Geräte legen das erste Zeichen ins niedrige Byte, wodurch „EM24“ als „ME42“ gelesen wird.

## Wie MBMap-Maps das festhalten

Eine Map legt `byte_order` und `word_order` für das ganze Gerät fest, und jedes Register kann sie überschreiben. Die Geräteseiten zeigen die Reihenfolge jedes Mehrregisterwertes in der obigen Schreibweise (zum Beispiel `float32 CDAB`), und der Home-Assistant-Export macht daraus die richtige `swap:`-Option.
