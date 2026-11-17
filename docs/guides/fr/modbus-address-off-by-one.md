# Adresses Modbus : pourquoi votre lecture est décalée d’un registre

Vous lisez le registre 40001 et vous obtenez la valeur que le manuel indique pour le 40002, ou bien le périphérique répond *illegal data address* pour un registre qui figure bien dans le tableau. Presque toujours, la cause est la même : le manuel et votre outil ne comptent pas les registres de la même façon.

## Trois façons d’écrire le même registre

| Ce qu’imprime le manuel | Ce que cela signifie | Ce qui part sur le fil |
|---|---|---|
| `40001` (référence Modicon) | registre de maintien numéro 1, compté à partir de 1, avec `4` comme préfixe de zone | adresse `0` |
| `1` (numéro de registre) | registre de maintien 1, compté à partir de 1 | adresse `0` |
| `0` ou `0x0000` (décalage) | l’adresse elle-même | adresse `0` |

Une trame Modbus porte toujours une adresse de 0 à 65535. Les préfixes `4` (maintien), `3` (entrée), `1` (entrée discrète) et `0` (bobine) ne sont pas envoyés : la zone est choisie par le code de fonction (03 pour le maintien, 04 pour l’entrée, 02 pour les entrées discrètes, 01 pour les bobines). Le nombre restant est souvent compté à partir de 1, donc l’adresse sur le fil est ce nombre **moins un**.

Les références à six chiffres comme `400001` ou `300013` fonctionnent de la même manière : retirez le premier chiffre et soustrayez un (`300013` → registre d’entrée `12`).

<mb-address></mb-address>

## Comment savoir laquelle votre manuel utilise

- **Les adresses hexadécimales** (`0x0BB7`, `1004h`) sont presque toujours l’adresse du fil.
- **Un premier registre 40001 ou 30001** indique des références Modicon : soustrayez 40001 ou 30001.
- **Un premier registre 1** signifie en général des numéros comptés à partir de 1 ; un premier registre 0 signifie des adresses du fil.
- **Cherchez un exemple détaillé.** Beaucoup de manuels montrent une trame de requête (« lire le registre 40011 : 01 03 00 0A 00 01 … »). Les deux octets qui suivent le code de fonction sont l’adresse du fil et tranchent la question.
- **Certains manuels mélangent les deux**, par exemple une colonne décimale « registre » supérieure d’une unité à la colonne hexadécimale « adresse » voisine. Fiez-vous à la colonne hexadécimale et aux trames d’exemple.

## Ce qu’attend votre outil

Les outils diffèrent eux aussi. Certains demandent l’adresse du fil, d’autres un numéro de registre compté à partir de 1, et d’autres encore acceptent une référence Modicon et retirent le préfixe. Si une valeur est décalée d’exactement un registre (une valeur 32 bits ressemble à du bruit, ou chaque valeur semble appartenir à son voisin), essayez l’adresse inférieure ou supérieure d’une unité.

## Comment les cartes MBMap l’enregistrent

Chaque fichier `.mbmap.json` indique la convention de ses adresses avec `address_base` : `0` signifie que les adresses sont celles du fil, `1` qu’elles sont comptées à partir de 1 et que l’adresse du fil est inférieure d’une unité. Les pages de périphériques de ce site, l’export CSV et l’export Home Assistant affichent l’adresse du fil à côté de l’adresse telle qu’écrite dans la carte, de sorte que vous n’avez jamais à deviner.
