# Modbus CRC-hibák RS-485-ön

A CRC-hiba azt jelenti, hogy egy keret megérkezett, de az ellenőrzőösszege nem egyezett: bájtok megváltoztak vagy elvesztek útközben. A téves címmel ellentétben a fizikai összeköttetésre vagy az időzítésre utal.

## Gyakori okok

- **Zaj.** Árnyékolatlan kábel erősáramú kábelek vagy hajtások mellett. Használjon árnyékolt sodrott érpárt, az árnyékolást csak az egyik végén földelve.
- **Hiányzó vagy többlet lezárás.** Egy 120 Ω-os ellenállás a busz mindkét végén; egy sem közöttük.
- **Nincs előfeszítés.** A bias-ellenállások nélküli üres busz lebeg, és a keret első bájtjait hibásan olvashatják. Sok átalakítónak és masternek van bias-opciója.
- **Leágazások és csillagkötés.** Az RS-485 egy vonalat kíván eszközről eszközre, nem elágazásokat.
- **Kissé eltérő baudráta** olcsó átalakítókon vagy nagy sebességeknél. Próbáljon alacsonyabb baudrátát.
- **Összeolvadó keretek.** Ha a master a következő kérést azelőtt küldi, hogy a busz 3,5 karakteridőig csendes lett volna, az eszközök egyetlen hosszú, hibás keretet látnak. Növelje a kérések közti késleltetést.
- **Két master**, vagy egy eszköz, amely ugyanazon a címen válaszol, mint egy másik.

<mb-crc></mb-crc>

## Lépések

1. Csökkentse a baudrátát, és nézze meg, megszűnnek-e a hibák.
2. Tesztelje egy eszközzel és rövid kábellel. Ha így működik, a probléma a busz, nem az eszköz.
3. Ellenőrizze a lezárást kikapcsolt tápnál: az A és B közti ellenállásnak kb. 60 Ω-nak kell lennie, mindkét lezáróval.
4. Adjon hozzá bias-t, ha a master vagy az átalakító kínálja.
5. Növelje a lekérdezési időközt és az időtúllépést.

Egy hosszú ipari buszon az alkalmi CRC-hiba normális; az eszköznek újra kell próbálnia. A legtöbb keretnél jelentkező hibák nem azok.
