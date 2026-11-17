# Skalierung und Einheiten: wenn der Wert um das Zehn- oder Tausendfache danebenliegt

Das Register wird in der richtigen Reihenfolge gelesen, und trotzdem ist die Spannung 2301 statt 230,1 oder der Strom 4560 statt 4,56 A. Die meisten Zähler senden Ganzzahlen und erwarten, dass Sie eine feste Skalierung anwenden.

## Feste Skalierung

Handbücher schreiben die Skalierung auf mehrere Arten, die dasselbe bedeuten:

| Handbuch sagt | Bedeutung | Gelesener Wert 2301 |
|---|---|---|
| „resolution 0.1 V“, „× 0.1“, „unit 0.1 V“ | mit 0,1 multiplizieren | 230,1 V |
| „Value weight: Volt × 10“, „÷ 10“ | durch 10 teilen | 230,1 V |
| „1 decimal“, „format XXX.X“ | durch 10 teilen | 230,1 V |
| „mA“, „mV“, „Wh“ als Einheit | die Ganzzahl ist bereits in dieser Einheit | 2301 mV |

Achten Sie nicht nur auf den Faktor, sondern auch auf die Einheit: Ein Energiezähler in Wh und einer in kWh × 0,01 unterscheiden sich um den Faktor zehn.

## Durch die Konfiguration gesetzte Skalierung

Manche Geräte ändern die Skalierung über eine Einstellung: die Anzahl der Nachkommastellen im Display, das Wandlerverhältnis oder den Spannungsbereich. Das Handbuch gibt dann eine Tabelle an („wenn Register 40018 gleich 2 ist, durch 100 teilen“). Lesen Sie zuerst diese Einstellung.

<mb-scaling></mb-scaling>

## Skalierungsfaktor-Register (SunSpec und andere)

SunSpec-Wechselrichter und -Zähler senden jeden Wert mit einem eigenen Register für den *Skalierungsfaktor*, eine vorzeichenbehaftete Zehnerpotenz. Der Wert ist `Register × 10^Skalierungsfaktor`: Eine Leistung von 4523 mit dem Faktor −1 ergibt 452,3 W. Der Skalierungsfaktor kann sich im Betrieb ändern, lesen Sie ihn daher zusammen mit dem Wert in derselben Anfrage.

## Floats

Als 32-Bit-Float (IEEE 754) gesendete Werte brauchen keine Skalierung; sie liegen bereits in technischen Einheiten vor. Wenn ein Float absurd aussieht, prüfen Sie die [Wortreihenfolge](byte-and-word-order), bevor Sie die Skalierung prüfen.

## Wie MBMap-Maps das festhalten

Ein Register hat eine `scale` (den Multiplikator), ein optionales `offset`, eine `unit` oder einen `scale_factor`, der das Register mit der Zehnerpotenz benennt. Die Geräteseiten und die Exporte wenden sie an, sodass die Zahl, die Sie einstellen, die aus dem Handbuch ist.
