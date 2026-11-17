# Modbus-CRC-Fehler bei RS-485

Ein CRC-Fehler bedeutet, dass ein Frame ankam, aber seine Prüfsumme nicht stimmte: Bytes wurden unterwegs verändert oder gingen verloren. Anders als eine falsche Adresse weist er auf die physische Verbindung oder das Timing hin.

## Häufige Ursachen

- **Störungen.** Ungeschirmtes Kabel neben Starkstromkabeln oder Antrieben. Verwenden Sie verdrillte, geschirmte Leitung, deren Schirm nur an einem Ende geerdet ist.
- **Fehlender oder zusätzlicher Abschluss.** Ein 120-Ω-Widerstand an jedem Ende des Busses; keiner dazwischen.
- **Keine Vorspannung.** Ein ruhender Bus ohne Bias-Widerstände schwebt, und die ersten Bytes eines Frames können falsch gelesen werden. Viele Wandler und Master haben eine Bias-Option.
- **Stichleitungen und Sternverdrahtung.** RS-485 will eine Leitung von Gerät zu Gerät, keine Abzweige.
- **Baudrate leicht abweichend** bei billigen Wandlern oder hohen Raten. Versuchen Sie eine niedrigere Baudrate.
- **Frames verschmelzen.** Sendet der Master die nächste Anfrage, bevor der Bus 3,5 Zeichenzeiten ruhig war, sehen die Geräte einen langen, defekten Frame. Erhöhen Sie die Pause zwischen den Anfragen.
- **Zwei Master**, oder ein Gerät, das auf derselben Adresse wie ein anderes antwortet.

<mb-crc></mb-crc>

## Schritte

1. Senken Sie die Baudrate und prüfen Sie, ob die Fehler aufhören.
2. Testen Sie mit einem Gerät und einem kurzen Kabel. Funktioniert das, liegt das Problem am Bus, nicht am Gerät.
3. Prüfen Sie den Abschluss bei ausgeschalteter Spannung: Der Widerstand zwischen A und B sollte bei beiden Abschlusswiderständen etwa 60 Ω betragen.
4. Fügen Sie Bias hinzu, wenn Master oder Wandler dies anbieten.
5. Erhöhen Sie Abfrageintervall und Timeout.

Ein gelegentlicher CRC-Fehler auf einem langen Industriebus ist normal; ein Werkzeug sollte es erneut versuchen. Fehler bei den meisten Frames sind es nicht.
