# Biztonságos-e Modbus-eszközre írni?

Egy regiszter olvasása ártalmatlan. Írása megváltoztatja az eszközt, néha nehezen visszacsinálható módon.

## Mi romolhat el

- **Rossz regiszter.** Egy [eggyel eltolt cím](modbus-address-off-by-one) a szomszédos beállításba írja az Ön értékét: áramváltó-áttételbe, védelmi határba, baudrátába.
- **Kommunikációs beállítások.** A unit ID, a baudráta vagy a paritás írása kizárja Önt, amíg az új értékekkel újra nem csatlakozik.
- **A memória kopása.** Sok eszköz a beállításokat korlátozott írásszámú flash vagy EEPROM memóriába menti. Ha minden másodpercben írnak egy alapjelet, hónapok alatt elhasználhatják. Egyes eszközök gyakori íráshoz csak RAM-ban lévő címet kínálnak.
- **A parancsok azonnal hatnak.** A futtatás/leállítás, a megszakító nyitása/zárása, az energiaszámlálók nullázása és a gyári visszaállítás az íráskor megtörténik, megerősítés nélkül.
- **Félig írt értékek.** Egy 32 bites érték két regiszterének külön kérésekben való írása egy pillanatra vegyes értéket hagyhat, vagy elutasítást kaphat.

<mb-flow name="write"></mb-flow>

## Írás előtt

1. Vesse össze a térképet a gyártó dokumentumával, és részesítse előnyben az *ellenőrzött* vagy *hivatalos* jelölésű térképeket.
2. Olvassa be előbb a regisztert, és győződjön meg róla, hogy azt tartalmazza, amit vár.
3. Ellenőrizze a megengedett tartományt; sok eszköz korlátozza vagy elutasítja a tartományon kívüli értékeket.
4. A többregiszteres értékeket egy kérésben írja (16-os függvény).
5. Tudja, hogyan állíthatja vissza a régi értéket.
6. Energiát vagy gépeket vezérlő berendezésen elszigetelten tesztelje.

## Hogyan segítenek az MBMap térképek

A regisztereknek van `access` mezőjük (`R`, `W`, `RW`), és az írhatók hordozhatnak `write_min` és `write_max` értéket. Minden térképnek van státusza, amely megmondja, hogy eszközön tesztelték-e, a gyártó dokumentumából származik-e, vagy még nem ellenőrizték. Az eszközöknek figyelmeztetniük kell az írás előtt, ha az eszköz modellje nem egyezik a térképpel.
