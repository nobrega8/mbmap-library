# Modbus-Unit-ID (Slave-ID): welches Gerät antwortet

Jede Modbus-Anfrage trägt eine Ein-Byte-Unit-ID, auch Slave-ID, Slave-Adresse oder Geräteadresse genannt.

## Bei RS-485 (Modbus RTU)

- Jedes Gerät am Bus hat eine eigene Adresse von 1 bis 247, eingestellt am Display, mit DIP-Schaltern oder in seiner Konfigurationssoftware.
- Adresse 0 ist Broadcast: Jedes Gerät führt einen Schreibvorgang aus, und keines antwortet. Lesevorgänge an 0 erhalten keine Antwort.
- Ein auf eine andere Adresse eingestelltes Gerät ignoriert Ihre Anfrage vollständig, daher sieht eine falsche Unit-ID wie ein totes Gerät aus: Sie erhalten einen [Timeout](modbus-timeout-no-response), keinen Fehler.

## Bei Modbus TCP

- Ein direkt per IP erreichtes Gerät ignoriert die Unit-ID meist oder erwartet 1. Manche erwarten 0 oder 255, und wenige lehnen alles außer ihrem eingestellten Wert ab.
- Hinter einem TCP-zu-RTU-Gateway wählt die Unit-ID das serielle Gerät: Sie muss zur RS-485-Adresse dieses Geräts passen. Das Gateway selbst antwortet oft auf 0, 255 oder eine eingestellte ID.
- Manche Geräte mit mehreren internen Teilen (ein Wechselrichter mit Zähler und Batterie) antworten auf unterschiedliche Unit-IDs für jeden Teil.

<mb-gateway></mb-gateway>

## Eine unbekannte Adresse finden

- Lesen Sie sie vom Display oder Typenschild des Geräts ab.
- Scannen Sie: Senden Sie mit der Baudrate des Geräts das Lesen eines gängigen Registers an jede Adresse von 1 bis 247 und notieren Sie, welche antwortet. Tun Sie das nur mit diesem einen angeschlossenen Gerät.
- Setzen Sie auf Werkseinstellungen zurück; das Handbuch nennt den Standardwert (oft 1).

## Wie MBMap-Maps das festhalten

Eine Map nennt die Standard-`unit_id` des Geräts (sowie serielle Einstellungen und TCP-Port). Der Standardwert ist nur ein Ausgangspunkt: Geräte werden bei der Installation meist umkonfiguriert.
