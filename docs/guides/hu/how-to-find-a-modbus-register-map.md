# Hogyan találja meg egy eszköz Modbus regisztertérképét

A regisztertérkép (Modbus-táblázat, pontlista, memóriatérkép vagy kommunikációs protokoll néven is ismert) ritkán szerepel a telepítési lapon. Hol keresse:

1. **Keressen ebben a könyvtárban** modell, modellkód vagy alias szerint. Minden térkép hivatkozik arra a dokumentumra, amelyből készült.
2. **A gyártó letöltési területe.** Keressen a modellnévvel együtt a „communication protocol”, „Modbus protocol”, „Modbus register map”, „Modbus table” vagy „point map” kifejezésre. Gyakran külön PDF a felhasználói kézikönyvtől.
3. **A teljes felhasználói kézikönyv.** Sok kézikönyvben a táblázat a vége felé egy fejezetben van („Communication”, „Modbus”, „Appendix B”).
4. **Konfigurációs szoftver.** Egyes gyártók a térképet a szoftverükbe csomagolják, vagy Excel-fájlként mellékelik.
5. **A családi dokumentum.** Egy modell gyakran a családjával közös térképet használ („EM24 DIN”, „PM5000 series”). Ellenőrizze, hogy a családi kézikönyv lefedi-e az Ön változatát.
6. **Kérdezze a gyártó támogatását.** Egyes térképeket csak kérésre küldenek, néha NDA alatt; mielőtt egy belőle készült térképet közzétenne, ellenőrizze, megoszthatja-e.
7. **Más projektek integrációi.** A Home Assistant, az openHAB, a Node-RED és az EVCC konfigurációi gyakran tartalmaznak működő regiszterlistákat, de vesse össze őket a kézikönyvvel.

<mb-flow name="find"></mb-flow>

## Mit olvasson ki belőle

- A **címzési konvenciót** (vezetékcím, 1-től induló vagy Modicon). Lásd a [címeket](modbus-address-off-by-one).
- Az egyes értékek **adattípusát**, **szósorrendjét** és **skáláját**. Lásd a [bájt- és szósorrendet](byte-and-word-order) és a [skálázást](scaling-and-units).
- A **támogatott függvénykódokat** és a kérésenkénti legnagyobb regiszterszámot.
- Az **alapértelmezett soros beállításokat** és a unit ID-t.

## Nincs ebben a könyvtárban?

[Kérjen térképet](https://github.com/nobrega8/mbmap-library/issues/new/choose) a dokumentum hivatkozásával, vagy írjon egyet maga: a formátum egyszerű JSON, és a [specifikáció](/spec) minden kulcsot elmagyaráz.
