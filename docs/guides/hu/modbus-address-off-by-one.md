# Modbus-címek: miért tér el eggyel regiszterrel az olvasott érték

Beolvassa a 40001-es regisztert, és azt az értéket kapja, amelyet a kézikönyv a 40002-esnél közöl, vagy az eszköz *illegal data address* hibával válaszol egy olyan regiszterre, amely szerepel a táblázatban. Szinte mindig ugyanaz az ok: a kézikönyv és az Ön eszköze másképp számolja a regisztereket.

## Három módja ugyanannak a regiszternek

| Mit nyomtat a kézikönyv | Mit jelent | Mi kerül a vezetékre |
|---|---|---|
| `40001` (Modicon-hivatkozás) | az 1-es számú tartóregiszter, 1-től számolva, `4` területelőtaggal | `0` cím |
| `1` (regiszterszám) | az 1-es tartóregiszter, 1-től számolva | `0` cím |
| `0` vagy `0x0000` (eltolás) | maga a cím | `0` cím |

Egy Modbus-keret mindig 0 és 65535 közötti címet hordoz. A `4` (tartó), `3` (bemeneti), `1` (diszkrét bemenet) és `0` (coil) előtagokat nem küldik el: a területet a függvénykód választja ki (03 a tartóregiszterekhez, 04 a bemenetiekhez, 02 a diszkrét bemenetekhez, 01 a coilokhoz). A megmaradó számot gyakran 1-től számolják, így a vezetékcím ez a szám **mínusz egy**.

A hatjegyű hivatkozások, például a `400001` vagy a `300013`, ugyanígy működnek: hagyja el az első számjegyet, és vonjon le egyet (`300013` → `12`-es bemeneti regiszter).

<mb-address></mb-address>

## Hogyan állapíthatja meg, melyiket használja a kézikönyv

- A **hex címek** (`0x0BB7`, `1004h`) szinte mindig a vezetékcímek.
- Ha az **első regiszter 40001 vagy 30001**, Modicon-hivatkozásokról van szó: vonja le a 40001-et vagy a 30001-et.
- Ha az **első regiszter 1**, az általában 1-től induló számozást jelent; ha az első regiszter 0, vezetékcímekről van szó.
- **Keressen kidolgozott példát.** Sok kézikönyv mutat kérésbeli keretet („a 40011-es regiszter olvasása: 01 03 00 0A 00 01 …”). A függvénykód utáni két bájt a vezetékcím, és eldönti a kérdést.
- **Egyes kézikönyvek keverik a kettőt**, például egy decimális „regiszter” oszlop eggyel nagyobb, mint a mellette lévő hex „cím” oszlop. Bízzon a hex oszlopban és a példakeretekben.

## Mit vár az Ön eszköze

Az eszközök is különböznek. Egyesek a vezetékcímet kérik, mások 1-től számolt regiszterszámot, és vannak, amelyek elfogadnak Modicon-hivatkozást, és levágják az előtagot. Ha egy érték pontosan egy regiszterrel el van tolva (egy 32 bites érték értelmetlennek tűnik, vagy minden érték a szomszédjához tartozónak látszik), próbálja eggyel kisebb vagy eggyel nagyobb címmel.

## Hogyan rögzítik ezt az MBMap térképek

Minden `.mbmap.json` fájl az `address_base` mezővel jelzi, melyik konvenciót követik a címei: a `0` azt jelenti, hogy a címek vezetékcímek, az `1` azt, hogy 1-től számoltak, és a vezetékcím eggyel kisebb. Az oldal eszközoldalai, a CSV-exportálás és a Home Assistant-exportálás a térképen írt cím mellett a vezetékcímet is megmutatják, így soha nem kell találgatnia.
