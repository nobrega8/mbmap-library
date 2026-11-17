# Codes de fonction Modbus et zones de registres

Chaque requête Modbus désigne un code de fonction. Il détermine à la fois l’action et la zone du périphérique sur laquelle elle porte.

| Code | Nom | Zone | Taille |
|---|---|---|---|
| 01 | Read Coils | bobines (0x) | bits, lecture/écriture |
| 02 | Read Discrete Inputs | entrées discrètes (1x) | bits, lecture seule |
| 03 | Read Holding Registers | registres de maintien (4x) | 16 bits, lecture/écriture |
| 04 | Read Input Registers | registres d’entrée (3x) | 16 bits, lecture seule |
| 05 | Write Single Coil | bobines | écrire `0xFF00` pour activer, `0x0000` pour désactiver |
| 06 | Write Single Register | registres de maintien | un registre |
| 15 (0x0F) | Write Multiple Coils | bobines | plusieurs bits |
| 16 (0x10) | Write Multiple Registers | registres de maintien | plusieurs registres |
| 17 (0x11) | Report Server ID | — | identité du périphérique, format défini par le périphérique |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | fabricant, code produit, révision sous forme de texte |

## Maintien ou entrée ?

Le tableau du manuel ou le préfixe de son adresse vous l’indique : `3xxxx` se lit avec 04, `4xxxx` avec 03. Certains périphériques répondent aux deux fonctions avec les mêmes données ; d’autres refusent la mauvaise avec l’exception 01 (illegal function). Si un manuel ne donne ni préfixe ni fonction, essayez d’abord 03.

## Écriture

- Une valeur 32 bits nécessite deux registres écrits ensemble avec 16 ; écrire ses moitiés une à une avec 06 peut laisser le périphérique avec une valeur mélangée, ou être refusé.
- Certains périphériques n’acceptent que 06, d’autres que 16. La liste des fonctions prises en charge du manuel tranche.
- Les bobines écrites avec 05 doivent porter exactement `0xFF00` ou `0x0000`.

## Comment les cartes MBMap l’enregistrent

Chaque registre a une `area` (`coil`, `discrete`, `input`, `holding`) et un `access` (`R`, `W`, `RW`) ; un outil en déduit la fonction. Les cartes peuvent aussi décrire les fonctions d’identité 17 et 43, afin qu’un outil puisse vérifier avec quel périphérique il dialogue.
