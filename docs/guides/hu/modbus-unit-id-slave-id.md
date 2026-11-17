# Modbus unit ID (slave ID): melyik eszköz válaszol

Minden Modbus-kérés egybájtos unit ID-t hordoz, amelyet slave ID-nek, slave címnek vagy eszközcímnek is neveznek.

## RS-485-ön (Modbus RTU)

- A buszon minden eszköznek saját címe van 1 és 247 között, amelyet a kijelzőn, DIP-kapcsolókkal vagy a konfigurációs szoftverben állítanak be.
- A 0-s cím a broadcast: minden eszköz végrehajtja az írást, és egyik sem válaszol. A 0-ra küldött olvasásokra nincs válasz.
- Egy másik címre állított eszköz teljesen figyelmen kívül hagyja a kérést, ezért a téves unit ID halott eszköznek látszik: [időtúllépést](modbus-timeout-no-response) kap, nem hibát.

## Modbus TCP-n

- Egy IP-n közvetlenül elért eszköz általában figyelmen kívül hagyja a unit ID-t, vagy 1-et vár. Egyesek 0-t vagy 255-öt várnak, és néhány elutasít mindent a beállított értéken kívül.
- Egy TCP–RTU átjáró mögött a unit ID választja ki a soros eszközt: egyeznie kell az eszköz RS-485 címével. Maga az átjáró gyakran a 0-ra, 255-re vagy egy beállított ID-re válaszol.
- Néhány több belső résszel rendelkező eszköz (mérővel és akkumulátorral ellátott inverter) minden részhez más unit ID-re válaszol.

<mb-gateway></mb-gateway>

## Ismeretlen cím megtalálása

- Olvassa le az eszköz kijelzőjéről vagy címkéjéről.
- Pásztázzon: küldjön egy gyakori regiszter olvasását az eszköz baudrátájával az 1-től 247-ig minden címre, és jegyezze fel, melyik válaszol. Ezt csak az adott eszköz csatlakoztatásával tegye.
- Állítsa vissza a gyári beállításokat; a kézikönyv megadja az alapértelmezést (gyakran 1).

## Hogyan rögzítik ezt az MBMap térképek

A térkép megadja az eszköz alapértelmezett `unit_id` értékét (valamint a soros beállításokat és a TCP-portot). Az alapértelmezés csak kiindulópont: az eszközöket telepítéskor általában újrakonfigurálják.
