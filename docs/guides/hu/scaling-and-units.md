# Skálázás és egységek: ha az érték tízszeresen vagy ezerszeresen téves

A regiszter jó sorrendben olvasódik, mégis a feszültség 2301 a 230,1 helyett, vagy az áram 4560 a 4,56 A helyett. A legtöbb mérő egész számokat küld, és azt várja, hogy Ön alkalmazzon egy rögzített skálát.

## Rögzített skála

A kézikönyvek a skálát többféleképpen írják, amelyek ugyanazt jelentik:

| A kézikönyv szerint | Jelentése | Az olvasott 2301 érték |
|---|---|---|
| „resolution 0.1 V”, „× 0.1”, „unit 0.1 V” | szorozni 0,1-gyel | 230,1 V |
| „Value weight: Volt × 10”, „÷ 10” | osztani 10-zel | 230,1 V |
| „1 decimal”, „format XXX.X” | osztani 10-zel | 230,1 V |
| „mA”, „mV”, „Wh” mint egység | az egész szám már ebben az egységben van | 2301 mV |

Az együttható mellett az egységre is figyeljen: a Wh-ban számoló energiaszámláló és a kWh × 0,01-es egymástól tízszeresen különbözik.

## A konfiguráció által megadott skála

Egyes eszközök egy beállítással változtatják a skálát: a kijelzőn mutatott tizedesjegyek számával, az áramváltó áttételével vagy a feszültségtartománnyal. A kézikönyv ilyenkor táblázatot ad („ha a 40018-as regiszter 2, osszon 100-zal”). Először olvassa el ezt a beállítást.

<mb-scaling></mb-scaling>

## Skálázási tényező regiszterek (SunSpec és mások)

A SunSpec inverterek és mérők minden értéket külön *skálázási tényező* regiszterrel küldenek, amely egy előjeles tízhatvány. Az érték `regiszter × 10^skálázási_tényező`: egy 4523-as teljesítmény −1-es tényezővel 452,3 W. A skálázási tényező az eszköz működése közben változhat, ezért az értékkel együtt, ugyanabban a kérésben olvassa be.

## Floatok

A 32 bites floatként (IEEE 754) küldött értékeknek nincs szükségük skálára; már mérnöki egységben vannak. Ha egy float képtelenségnek tűnik, a skála előtt ellenőrizze a [szósorrendet](byte-and-word-order).

## Hogyan rögzítik ezt az MBMap térképek

Egy regiszternek lehet `scale` (szorzó), választható `offset`, `unit` vagy a tízhatványt tároló regisztert megnevező `scale_factor` értéke. Az eszközoldalak és az exportálások alkalmazzák ezeket, így az Ön által beállított szám a kézikönyvben szereplő.
