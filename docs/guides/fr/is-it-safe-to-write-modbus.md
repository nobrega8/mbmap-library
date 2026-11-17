# Est-il sûr d’écrire sur un périphérique Modbus ?

Lire un registre est sans danger. En écrire un modifie le périphérique, parfois d’une manière difficile à annuler.

## Ce qui peut mal tourner

- **Mauvais registre.** Une [adresse décalée d’un cran](modbus-address-off-by-one) écrit votre valeur dans le réglage voisin : un rapport de TC, une limite de protection, un débit.
- **Paramètres de communication.** Écrire l’ID d’unité, le débit ou la parité vous coupe la liaison jusqu’à ce que vous vous reconnectiez avec les nouvelles valeurs.
- **Usure de la mémoire.** Beaucoup de périphériques enregistrent leurs réglages en flash ou en EEPROM avec un nombre d’écritures limité. Écrire une consigne chaque seconde peut l’user en quelques mois. Certains périphériques offrent une adresse en RAM seule pour les écritures fréquentes.
- **Les commandes agissent immédiatement.** Marche/arrêt, ouverture/fermeture de disjoncteur, remise à zéro des compteurs d’énergie et retour aux réglages d’usine s’exécutent à l’écriture, sans confirmation.
- **Valeurs à moitié écrites.** Écrire les deux registres d’une valeur 32 bits dans des requêtes séparées peut laisser un instant une valeur mélangée, ou être refusé.

<mb-flow name="write"></mb-flow>

## Avant d’écrire

1. Vérifiez la carte avec le document du fabricant, et préférez les cartes marquées *vérifiée* ou *officielle*.
2. Lisez d’abord le registre et confirmez qu’il contient ce que vous attendez.
3. Vérifiez la plage autorisée ; beaucoup de périphériques écrêtent ou rejettent les valeurs hors plage.
4. Écrivez les valeurs multi-registres en une seule requête (fonction 16).
5. Sachez comment rétablir l’ancienne valeur.
6. Sur un équipement qui commande de la puissance ou une machine, testez-le isolé.

## Ce que les cartes MBMap apportent

Les registres ont un `access` (`R`, `W`, `RW`), et ceux qui sont inscriptibles peuvent porter `write_min` et `write_max`. Chaque carte a un statut qui dit si elle a été testée sur un périphérique, tirée du document du fabricant ou pas encore vérifiée. Les outils devraient avertir avant d’écrire sur un périphérique dont le modèle ne correspond pas à la carte.
