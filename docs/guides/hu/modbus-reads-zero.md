# Egy Modbus-regiszter 0-t, 0xFFFF-et vagy 0x8000-et olvas

A kérés sikeres, de az érték értelmetlen. Mielőtt az eszközre gyanakodna, nézze meg, mit akar mondani.

## Gyakori okok

- **Rossz terület.** Ugyanaz a cím létezhet bemeneti és tartóregiszterként is, eltérő tartalommal. Ha a tartóregisztert olvassa, miközben az érték a bemeneti regiszterben van, nullákat kaphat. Lásd a [függvénykódokat](modbus-function-codes).
- **Eggyel eltolva.** Ha egy 32 bites érték második felét olvassa az első helyett, kis értékeknél gyakran 0-t kap. Lásd a [címeket](modbus-address-off-by-one).
- **Nincs megvalósítva.** Sok eszköz a használaton kívüli regiszterek olvasására kivétel helyett 0, 0xFFFF, 0x7FFF vagy 0x8000 értékkel válaszol. A SunSpec-eszközök az előjeles mezőkben a 0x8000-et (−32768), az előjel nélkülieknél a 0xFFFF-et használják a „nincs megvalósítva” jelzésére.
- **Nincs mérve.** Háromvezetékes kapcsolásban a nullavezető áram, egy be nem kötött fázis vagy egy szenzorbemenet, amelyre semmi sincs csatlakoztatva, 0-t vagy rögzített jelzőértéket olvas.
- **Még nem kész.** Egyes eszközök bekapcsolás után néhány másodpercig, vagy az első mérési ciklus befejezéséig nullákat adnak.
- **Modellkülönbségek.** Egy családi kézikönyvben felsorolt regiszter csak egyes modelleken létezhet: a többi 0-t ad.
- **Túl durva skála.** Egy kis áram 1 A-es skálával 0-nak olvasódik.

<mb-scaling></mb-scaling>

## Hogyan rögzítik ezt az MBMap térképek

A térkép felsorolhatja a `sentinels` mezőben az egyes típusoknál a „nem elérhető” jelentésű értékeket, így az eszköz hiányzóként mutatja őket, nem mérésként. A regiszterleírások jelzik, hogy egy érték mely modelleket vagy bekötést igényel.
