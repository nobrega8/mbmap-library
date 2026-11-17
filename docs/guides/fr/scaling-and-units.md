# Mise à l’échelle et unités : quand la valeur est dix ou mille fois fausse

Le registre est lu dans le bon ordre et pourtant la tension vaut 2301 au lieu de 230,1, ou le courant 4560 au lieu de 4,56 A. La plupart des compteurs envoient des entiers et attendent que vous appliquiez une échelle fixe.

## Échelle fixe

Les manuels écrivent l’échelle de plusieurs façons qui veulent dire la même chose :

| Le manuel dit | Signification | Valeur lue 2301 |
|---|---|---|
| « resolution 0.1 V », « × 0.1 », « unit 0.1 V » | multiplier par 0,1 | 230,1 V |
| « Value weight: Volt × 10 », « ÷ 10 » | diviser par 10 | 230,1 V |
| « 1 decimal », « format XXX.X » | diviser par 10 | 230,1 V |
| « mA », « mV », « Wh » comme unité | l’entier est déjà dans cette unité | 2301 mV |

Surveillez l’unité autant que le facteur : un compteur d’énergie en Wh et un autre en kWh × 0,01 diffèrent d’un facteur dix.

## Échelle déterminée par la configuration

Certains périphériques modifient l’échelle selon un réglage : le nombre de décimales affichées, le rapport du TC ou la plage de tension. Le manuel donne alors un tableau (« si le registre 40018 vaut 2, divisez par 100 »). Lisez d’abord ce réglage.

<mb-scaling></mb-scaling>

## Registres de facteur d’échelle (SunSpec et autres)

Les onduleurs et compteurs SunSpec envoient chaque valeur avec un registre de *facteur d’échelle* distinct, une puissance de dix signée. La valeur est `registre × 10^facteur_d_échelle` : une puissance de 4523 avec un facteur d’échelle de −1 fait 452,3 W. Le facteur d’échelle peut changer pendant que le périphérique fonctionne ; lisez-le donc avec la valeur, dans la même requête.

## Flottants

Les valeurs envoyées en flottants 32 bits (IEEE 754) n’ont pas besoin d’échelle ; elles sont déjà en unités d’ingénierie. Si un flottant paraît absurde, vérifiez l’[ordre des mots](byte-and-word-order) avant l’échelle.

## Comment les cartes MBMap l’enregistrent

Un registre peut avoir un `scale` (le multiplicateur), un `offset` facultatif, une `unit`, ou un `scale_factor` qui nomme le registre contenant la puissance de dix. Les pages de périphériques et les exports les appliquent, de sorte que le nombre que vous configurez est celui du manuel.
