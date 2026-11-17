# Modbus függvénykódok és regiszterterületek

Minden Modbus-kérés megnevez egy függvénykódot. Ez határozza meg a műveletet és az eszköznek azt a területét, amelyre hat.

| Kód | Név | Terület | Méret |
|---|---|---|---|
| 01 | Read Coils | coilok (0x) | bit, olvasás/írás |
| 02 | Read Discrete Inputs | diszkrét bemenetek (1x) | bit, csak olvasható |
| 03 | Read Holding Registers | tartóregiszterek (4x) | 16 bit, olvasás/írás |
| 04 | Read Input Registers | bemeneti regiszterek (3x) | 16 bit, csak olvasható |
| 05 | Write Single Coil | coilok | `0xFF00`-t írjon bekapcsoláshoz, `0x0000`-t kikapcsoláshoz |
| 06 | Write Single Register | tartóregiszterek | egy regiszter |
| 15 (0x0F) | Write Multiple Coils | coilok | több bit |
| 16 (0x10) | Write Multiple Registers | tartóregiszterek | több regiszter |
| 17 (0x11) | Report Server ID | — | az eszköz azonosítója, a formátumot az eszköz határozza meg |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | gyártó, termékkód, revízió szövegként |

## Tartó vagy bemeneti?

A kézikönyv táblázata vagy a címelőtag megmondja: a `3xxxx` olvasása 04-gyel, a `4xxxx` olvasása 03-mal történik. Egyes eszközök mindkét függvényre ugyanazokkal az adatokkal válaszolnak; mások a rosszat 01-es kivétellel (illegal function) utasítják el. Ha a kézikönyv sem előtagot, sem függvényt nem ad meg, próbálja először a 03-at.

## Írás

- Egy 32 bites érték két regisztert igényel, együtt írva 16-tal; a fél értékek egyenkénti írása 06-tal vegyes értéket hagyhat az eszközben, vagy elutasítást kaphat.
- Egyes eszközök csak a 06-ot fogadják el, mások csak a 16-ot. A kézikönyv támogatott függvényeinek listája eldönti.
- Az 05-tel írt coiloknak pontosan `0xFF00`-t vagy `0x0000`-t kell hordozniuk.

## Hogyan rögzítik ezt az MBMap térképek

Minden regiszternek van `area` mezője (`coil`, `discrete`, `input`, `holding`) és `access` mezője (`R`, `W`, `RW`); az eszköz ezekből választ függvényt. A térképek leírhatják a 17-es és 43-as azonosító függvényeket is, hogy az eszköz ellenőrizhesse, melyik eszközzel beszél.
