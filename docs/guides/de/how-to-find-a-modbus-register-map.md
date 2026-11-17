# So finden Sie die Modbus-Registermap eines Geräts

Die Registermap (auch Modbus-Tabelle, Punktliste, Speicherbelegung oder Kommunikationsprotokoll genannt) steht selten im Installationsblatt. Wo Sie suchen können:

1. **Durchsuchen Sie diese Bibliothek** nach Modell, Modellcode oder Alias. Jede Map verweist auf das Dokument, aus dem sie geschrieben wurde.
2. **Der Download-Bereich des Herstellers.** Suchen Sie mit dem Modellnamen nach „communication protocol“, „Modbus protocol“, „Modbus register map“, „Modbus table“ oder „point map“. Oft ist es ein vom Benutzerhandbuch getrenntes PDF.
3. **Das vollständige Benutzerhandbuch.** In vielen Handbüchern steht die Tabelle in einem Kapitel gegen Ende („Communication“, „Modbus“, „Appendix B“).
4. **Konfigurationssoftware.** Manche Hersteller liefern die Map in ihrer Software oder als Excel-Datei daneben mit.
5. **Das Familiendokument.** Ein Modell teilt seine Map oft mit seiner Familie („EM24 DIN“, „PM5000 series“). Prüfen Sie, ob das Familienhandbuch Ihre Variante abdeckt.
6. **Fragen Sie den Support des Herstellers.** Manche Maps werden nur auf Anfrage verschickt, mitunter unter NDA; prüfen Sie, ob Sie sie weitergeben dürfen, bevor Sie eine daraus erstellte Map veröffentlichen.
7. **Integrationen anderer Projekte.** Konfigurationen von Home Assistant, openHAB, Node-RED und EVCC enthalten oft funktionierende Registerlisten, aber prüfen Sie sie gegen das Handbuch.

<mb-flow name="find"></mb-flow>

## Was Sie darin lesen sollten

- Die **Adressierungskonvention** (Adresse auf der Leitung, ab 1 oder Modicon). Siehe [Adressen](modbus-address-off-by-one).
- **Datentypen**, **Wortreihenfolge** und **Skalierung** jedes Wertes. Siehe [Byte- und Wortreihenfolge](byte-and-word-order) und [Skalierung](scaling-and-units).
- Die **unterstützten Funktionscodes** und die größte Zahl von Registern pro Anfrage.
- Die **seriellen Standardeinstellungen** und die Unit-ID.

## Nicht in dieser Bibliothek?

[Fordern Sie eine Map an](https://github.com/nobrega8/mbmap-library/issues/new/choose) und verlinken Sie das Dokument, oder schreiben Sie selbst eine: Das Format ist schlichtes JSON, und die [Spezifikation](/spec) erklärt jeden Schlüssel.
