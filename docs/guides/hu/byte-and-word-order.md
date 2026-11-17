# Bájt- és szósorrend: ha a 32 bites értékek hibásak

Egy feszültség 1,7 × 10³⁸-nak olvasódik, egy energiaszámláló 65 536-os ugrásokkal lép, vagy egy hőmérséklet apró negatív szám. A regiszterek helyesek; az a sorrend nem, ahogyan egy 32 bites érték két regiszterét összeillesztik.

## Egy regiszter egyszerű, kettő nem

Egy Modbus-regiszter 16 bites, a legjelentősebb bájttal előre küldve. A szabvány nem mond semmit az egy regiszternél hosszabb értékekről, ezért minden gyártó maga dönti el, hogyan osztja szét a 32 bites egészet vagy floatot két regiszterre (a 64 bites értéket négyre).

A négy sorrendet általában az érték bájtjairól nevezik el, ahol az `A` a legjelentősebb:

| Név | 1. regiszter | 2. regiszter | Más néven |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, a magasabb szó előbb |
| `CDAB` | C D | A B | szócsere, az alacsonyabb szó előbb, LSW first |
| `BADC` | B A | D C | bájtcsere |
| `DCBA` | D C | B A | little-endian, mindkettő felcserélve |

Az `ABCD` és a `CDAB` szinte minden eszközt lefed. A `CDAB` gyakori a Schneider, a Carlo Gavazzi és sok kínai mérő esetében; az `ABCD` a Siemensnél, a Janitzánál és a legtöbb SunSpec-eszköznél.

<mb-byte-order></mb-byte-order>

## Hogyan találja meg a helyeset

1. **Olvassa el a kézikönyv adatformátum-fejezetét.** Keresse a „word order”, „LSW first”, „MSW first”, „high word first” vagy „big endian” kifejezést.
2. **Olvasson be egy ismert értéket.** Olvasson be egy 230 V körüli feszültséget floatként minden sorrendben. Csak az egyik ad észszerű számot.
3. **Figyeljen egy számlálót.** Ha egy energiaszámláló alsó regisztere abba csordul át, amit az eszköz felső résznek mutat, cserélje fel a szavakat.
4. **A 64 bites értékeket külön ellenőrizze.** Egyes eszközök a 32 bites értékeket a magasabb szóval előre, a 64 biteseket más sorrendben tárolják.

## Karakterláncok

A szöveg általában regiszterenként két karakter, az első karakter a magasabb bájtban. Néhány eszköz az első karaktert az alacsonyabb bájtba teszi, ezért az „EM24” „ME42”-ként olvasódik.

## Hogyan rögzítik ezt az MBMap térképek

A térkép a `byte_order` és a `word_order` mezővel állítja be az egész eszköz sorrendjét, és bármely regiszter felülírhatja azokat. Az eszközoldalak minden többregiszteres érték sorrendjét a fenti jelöléssel mutatják (például `float32 CDAB`), a Home Assistant-exportálás pedig a megfelelő `swap:` opcióvá alakítja.
