# Comment trouver la carte de registres Modbus d’un périphérique

La carte de registres (aussi appelée table Modbus, liste de points, plan mémoire ou protocole de communication) figure rarement dans la notice d’installation. Où chercher :

1. **Cherchez dans cette bibliothèque** par modèle, code de modèle ou alias. Chaque carte renvoie au document à partir duquel elle a été écrite.
2. **L’espace de téléchargement du fabricant.** Cherchez « communication protocol », « Modbus protocol », « Modbus register map », « Modbus table » ou « point map » avec le nom du modèle. C’est souvent un PDF distinct du manuel d’utilisation.
3. **Le manuel d’utilisation complet.** Beaucoup de manuels placent le tableau dans un chapitre vers la fin (« Communication », « Modbus », « Appendix B »).
4. **Le logiciel de configuration.** Certains fabricants livrent la carte dans leur logiciel ou dans un fichier Excel à côté.
5. **Le document de la famille.** Un modèle partage souvent sa carte avec sa famille (« EM24 DIN », « série PM5000 »). Vérifiez que le manuel de la famille couvre votre variante.
6. **Demandez au support du fabricant.** Certaines cartes ne sont envoyées que sur demande, parfois sous NDA ; vérifiez si vous avez le droit de la partager avant de publier une carte qui en est issue.
7. **Intégrations d’autres projets.** Les configurations de Home Assistant, openHAB, Node-RED et EVCC contiennent souvent des listes de registres qui fonctionnent, mais vérifiez-les avec le manuel.

<mb-flow name="find"></mb-flow>

## Ce qu’il faut y lire

- La **convention d’adressage** (adresse du fil, comptée à partir de 1 ou Modicon). Voir les [adresses](modbus-address-off-by-one).
- Les **types de données**, l’**ordre des mots** et l’**échelle** de chaque valeur. Voir l’[ordre des octets et des mots](byte-and-word-order) et la [mise à l’échelle](scaling-and-units).
- Les **codes de fonction pris en charge** et le plus grand nombre de registres par requête.
- Les **paramètres série par défaut** et l’ID d’unité.

## Pas dans cette bibliothèque ?

[Demandez une carte](https://github.com/nobrega8/mbmap-library/issues/new/choose) avec un lien vers le document, ou écrivez-en une vous-même : le format est du JSON simple et la [spécification](/spec) explique chaque clé.
