# Modbus-kivételkódok: mit mond az eszköz

Amikor egy Modbus-eszköz megérti a kérést, de nem tudja végrehajtani, kivétellel válaszol: a felső bitje beállított függvénykóddal (`0x83` a tartóregiszterek sikertelen olvasásakor) és egybájtos kóddal.

| Kód | Név | Szokásos ok | Mit próbáljon |
|---|---|---|---|
| 01 | Illegal function | Az eszköz nem támogatja ezt a függvénykódot: bemeneti regiszterek (04) olvasása olyan eszközről, amelynek csak tartóregiszterei vannak, vagy 16-tal írás olyan eszközre, amely csak a 06-ot fogadja el | Használja azt a függvénykódot, amelyet a kézikönyv az adott táblához felsorol |
| 02 | Illegal data address | A cím nem létezik, vagy a kért blokk egy résbe fut | Ellenőrizze a [címeltolást](modbus-address-off-by-one); egyszerre kevesebb regisztert olvasson |
| 03 | Illegal data value | A darabszám túl nagy (125-nél több regiszter), vagy az írt érték a tartományon kívül esik | Olvasson kisebb blokkokat; írás előtt ellenőrizze a megengedett tartományt |
| 04 | Server device failure | Az eszköz meghibásodott közben; egyes eszközök minden elutasított íráshoz vagy egy nem engedélyezett blokk olvasásához ezt használják | Olvasson egyszerre egy regisztert; ellenőrizze az eszköz állapotát |
| 05 | Acknowledge | Elfogadva, de időbe telik (programozás, mentés) | Várjon, majd kérdezze le |
| 06 | Server device busy | Az eszköz foglalt | Próbálja újra később |
| 0A | Gateway path unavailable | Egy átjáró nem érte el a mögötte lévő eszközt | Ellenőrizze az átjáró soros oldalát és útválasztását |
| 0B | Gateway target failed to respond | Az átjáró továbbította a kérést, de az eszköz nem válaszolt | Ellenőrizze az átjáró mögötti unit ID-t, baudrátát és vezetékezést |

<mb-exceptions></mb-exceptions>

## A válasz teljes hiánya nem kivétel

Az az eszköz, amely rossz CRC-jű, rossz unit ID-jű vagy paritáshibás keretet kap, hallgat: Ön időtúllépést kap, nem kivételt. Lásd az [időtúllépéseket](modbus-timeout-no-response).

## Réseken átívelő blokkok

Sok eszköz elutasítja azt az olvasást, amely bármely használaton kívüli címet érint, akkor is, ha minden szükséges regiszter létezik. Ha 20 regiszter olvasása 02-vel hibázik, de egyenként működik, ossza fel a kérést a réseknél. A térképek megadhatják, hány regisztert fogad el az eszköz kérésenként (`max_read_registers`).
