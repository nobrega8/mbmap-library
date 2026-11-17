# Ordre des octets et des mots : quand les valeurs 32 bits sont fausses

Une tension affiche 1,7 × 10³⁸, un compteur d’énergie saute de 65 536 en 65 536, ou une température est un minuscule nombre négatif. Les registres sont corrects ; c’est l’ordre dans lequel on assemble les deux registres d’une valeur 32 bits qui ne l’est pas.

## Un registre, c’est facile ; deux, non

Un registre Modbus fait 16 bits et l’octet de poids fort est envoyé en premier. La norme ne dit rien des valeurs de plus d’un registre : chaque fabricant choisit donc comment répartir un entier ou un flottant 32 bits sur deux registres (et une valeur 64 bits sur quatre).

Les quatre ordres portent généralement le nom des octets de la valeur, `A` étant le plus significatif :

| Nom | Registre 1 | Registre 2 | Aussi appelé |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, mot de poids fort d’abord |
| `CDAB` | C D | A B | échange de mots, mot de poids faible d’abord, LSW d’abord |
| `BADC` | B A | D C | échange d’octets |
| `DCBA` | D C | B A | little-endian, les deux échangés |

`ABCD` et `CDAB` couvrent presque tous les périphériques. `CDAB` est courant chez Schneider, Carlo Gavazzi et de nombreux compteurs chinois ; `ABCD` chez Siemens, Janitza et la plupart des périphériques SunSpec.

<mb-byte-order></mb-byte-order>

## Comment trouver le bon ordre

1. **Lisez la section du manuel sur le format des données.** Cherchez « word order », « LSW first », « MSW first », « high word first » ou « big endian ».
2. **Lisez une valeur que vous connaissez.** Lisez comme flottant, dans chaque ordre, une tension censée être d’environ 230 V. Un seul ordre donne un nombre cohérent.
3. **Observez un compteur.** Si le registre de poids faible d’un compteur d’énergie déborde vers ce que votre outil affiche comme la partie haute, échangez les mots.
4. **Vérifiez les valeurs 64 bits séparément.** Certains périphériques stockent les valeurs 32 bits avec le mot de poids fort d’abord et les valeurs 64 bits dans un autre ordre.

## Chaînes de caractères

Le texte compte en général deux caractères par registre, le premier dans l’octet de poids fort. Quelques périphériques placent le premier caractère dans l’octet de poids faible, ce qui fait lire « EM24 » comme « ME42 ».

## Comment les cartes MBMap l’enregistrent

Une carte fixe `byte_order` et `word_order` pour tout le périphérique, et n’importe quel registre peut les redéfinir. Les pages de périphériques affichent l’ordre de chaque valeur multi-registres avec la notation ci-dessus (par exemple `float32 CDAB`), et l’export Home Assistant le convertit en option `swap:` correcte.
