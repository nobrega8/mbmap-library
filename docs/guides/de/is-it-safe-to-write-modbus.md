# Ist es sicher, auf ein Modbus-Gerät zu schreiben?

Ein Register zu lesen ist harmlos. Eines zu schreiben verändert das Gerät, manchmal auf eine Weise, die sich schwer rückgängig machen lässt.

## Was schiefgehen kann

- **Falsches Register.** Eine [um eins verschobene Adresse](modbus-address-off-by-one) schreibt Ihren Wert in die benachbarte Einstellung: ein Wandlerverhältnis, eine Schutzgrenze, eine Baudrate.
- **Kommunikationseinstellungen.** Das Schreiben von Unit-ID, Baudrate oder Parität sperrt Sie aus, bis Sie sich mit den neuen Werten neu verbinden.
- **Speicherverschleiß.** Viele Geräte speichern Einstellungen in Flash oder EEPROM mit begrenzter Zahl von Schreibzyklen. Wer jede Sekunde einen Sollwert schreibt, kann ihn in Monaten verschleißen. Manche Geräte bieten für häufiges Schreiben eine nur im RAM liegende Adresse.
- **Befehle wirken sofort.** Start/Stopp, Schalter auf/zu, das Zurücksetzen von Energiezählern und der Werksreset geschehen beim Schreiben, ohne Bestätigung.
- **Halb geschriebene Werte.** Werden die zwei Register eines 32-Bit-Wertes in getrennten Anfragen geschrieben, kann kurzzeitig ein gemischter Wert entstehen, oder es wird abgelehnt.

<mb-flow name="write"></mb-flow>

## Vor dem Schreiben

1. Vergleichen Sie die Map mit dem Dokument des Herstellers und bevorzugen Sie Maps mit dem Status *geprüft* oder *offiziell*.
2. Lesen Sie das Register zuerst und bestätigen Sie, dass es enthält, was Sie erwarten.
3. Prüfen Sie den zulässigen Bereich; viele Geräte begrenzen oder lehnen Werte außerhalb ab.
4. Schreiben Sie Mehrregisterwerte in einer Anfrage (Funktion 16).
5. Wissen Sie, wie Sie den alten Wert wiederherstellen.
6. Testen Sie bei Anlagen, die Energie oder Maschinen steuern, im isolierten Zustand.

## Wie MBMap-Maps helfen

Register haben einen `access` (`R`, `W`, `RW`), und beschreibbare können `write_min` und `write_max` tragen. Jede Map hat einen Status, der angibt, ob sie an einem Gerät getestet, aus dem Dokument des Herstellers übernommen oder noch nicht geprüft wurde. Werkzeuge sollten vor dem Schreiben auf ein Gerät warnen, dessen Modell nicht zur Map passt.
