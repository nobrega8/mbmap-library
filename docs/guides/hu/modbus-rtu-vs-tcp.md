# Modbus RTU, Modbus TCP és RS-485

Három név, amelyeket gyakran összekevernek.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Közeg | soros vonal, szinte mindig RS-485 (néha RS-232) | Ethernet vagy Wi-Fi |
| Címzés | 1–247 unit ID a buszon | IP-cím és port (502), plusz egy unit ID |
| Hibaellenőrzés | CRC-16 minden keretben | a TCP saját ellenőrzései; nincs CRC |
| Keretezés | 3,5 karakternyi csend a keretek között | 7 bájtos fejléc (MBAP) hosszal |
| Eszköz kapcsolatonként | szegmensenként legfeljebb 32 egységterhelés (kis terhelésű adóvevőkkel több), egy master | sok kliens eszközönként, az eszköz korlátozza |
| Jellemző sebesség | 9600–115200 baud | 10/100 Mbit/s, az eszköz korlátozza |

Az **RS-485** csak a villamos réteg: két vezeték, differenciális jel, egy busz. A Modbus RTU ezen fut, ahogy más protokollok is (BACnet MS/TP, DMX, M-Bus RS-485 adaptereken át).

A **Modbus ASCII** ugyanazokat a kéréseket olvasható hex szövegként küldi; ma ritka.

<mb-adu></mb-adu>

## Ugyanazok a regiszterek

A regisztertérkép a szállítástól függetlenül ugyanaz: az az eszköz, amely mindkettőt kínálja, ugyanazokkal a címekkel, típusokkal és skálákkal válaszol. Az változik, hogyan éri el: soros beállítások és unit ID RTU-n, IP-cím és port TCP-n.

## Átjárók

Egy Modbus TCP–RTU átjáró lehetővé teszi, hogy az Ethernet-eszközök soros eszközöket érjenek el. A TCP-kérés unit ID-ja választja ki az eszközt a soros oldalon. Az átjárók saját időtúllépést adnak hozzá; ha egy mögöttük lévő eszköz nem válaszol, először az átjáró soros beállításait ellenőrizze.

## Hogyan rögzítik ezt az MBMap térképek

A térkép megadja, mely szállításokat kínálja az eszköz (`protocol`: `rtu`, `tcp` vagy mindkettő), és azok alapértelmezéseit (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
