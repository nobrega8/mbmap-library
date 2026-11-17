# Ein Modbus-Register liest 0, 0xFFFF oder 0x8000

Die Anfrage gelingt, aber der Wert ergibt keinen Sinn. Bevor Sie das Gerät verdächtigen, prüfen Sie, was es Ihnen sagen will.

## Häufige Gründe

- **Falscher Bereich.** Dieselbe Adresse kann als Eingangs- und als Halteregister mit unterschiedlichem Inhalt existieren. Wer das Halteregister liest, obwohl der Wert im Eingangsregister liegt, kann Nullen erhalten. Siehe [Funktionscodes](modbus-function-codes).
- **Um eins verschoben.** Wer die zweite Hälfte eines 32-Bit-Wertes statt der ersten liest, erhält bei kleinen Werten oft 0. Siehe [Adressen](modbus-address-off-by-one).
- **Nicht implementiert.** Viele Geräte beantworten das Lesen unbenutzter Register mit 0, 0xFFFF, 0x7FFF oder 0x8000 statt mit einer Exception. SunSpec-Geräte verwenden 0x8000 (−32768) für „nicht implementiert“ in Feldern mit Vorzeichen und 0xFFFF in Feldern ohne.
- **Nicht gemessen.** Ein Neutralleiterstrom bei Dreileiteranschluss, eine nicht angeschlossene Phase oder ein Sensoreingang ohne Anschluss liest 0 oder eine feste Markierung.
- **Nicht bereit.** Manche Geräte liefern nach dem Einschalten einige Sekunden lang Nullen oder bis ihr erster Messzyklus abgeschlossen ist.
- **Modellunterschiede.** Ein im Familienhandbuch aufgeführtes Register kann nur bei manchen Modellen existieren: Die anderen liefern 0.
- **Skalierung zu grob.** Ein kleiner Strom bei einer Skalierung von 1 A liest 0.

<mb-scaling></mb-scaling>

## Wie MBMap-Maps das festhalten

Eine Map kann `sentinels` auflisten, die Werte, die für jeden Typ „nicht verfügbar“ bedeuten, sodass ein Werkzeug sie als fehlend statt als Messwert anzeigt. Registerbeschreibungen vermerken, welche Modelle oder Verdrahtung ein Wert benötigt.
