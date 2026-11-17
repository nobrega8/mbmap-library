# Un registre Modbus lit 0, 0xFFFF ou 0x8000

La requête aboutit mais la valeur n’a aucun sens. Avant de soupçonner le périphérique, vérifiez ce qu’il essaie de vous dire.

## Raisons courantes

- **Mauvaise zone.** La même adresse peut exister comme registre d’entrée et comme registre de maintien, avec des contenus différents. Lire le registre de maintien alors que la valeur est dans un registre d’entrée peut renvoyer des zéros. Voir les [codes de fonction](modbus-function-codes).
- **Décalage d’un cran.** Lire la seconde moitié d’une valeur 32 bits au lieu de la première donne souvent 0 pour les petites valeurs. Voir les [adresses](modbus-address-off-by-one).
- **Non implémenté.** Beaucoup de périphériques répondent à la lecture de registres inutilisés par 0, 0xFFFF, 0x7FFF ou 0x8000 au lieu d’une exception. Les périphériques SunSpec utilisent 0x8000 (−32768) pour « non implémenté » dans les champs signés et 0xFFFF dans les champs non signés.
- **Non mesuré.** Un courant de neutre sur un raccordement à trois fils, une phase non câblée ou une entrée de capteur sans rien de branché lisent 0 ou un marqueur fixe.
- **Pas prêt.** Certains périphériques renvoient des zéros pendant quelques secondes après la mise sous tension, ou jusqu’à la fin de leur premier cycle de mesure.
- **Différences entre modèles.** Un registre listé dans le manuel d’une famille peut n’exister que sur certains modèles : les autres renvoient 0.
- **Échelle trop grossière.** Un petit courant avec une échelle de 1 A se lit 0.

<mb-scaling></mb-scaling>

## Comment les cartes MBMap l’enregistrent

Une carte peut lister des `sentinels`, les valeurs qui signifient « non disponible » pour chaque type, afin qu’un outil les affiche comme absentes plutôt que comme une mesure. Les descriptions des registres indiquent les modèles ou le câblage qu’exige une valeur.
