# ID d’unité Modbus (ID d’esclave) : quel périphérique répond

Chaque requête Modbus porte un ID d’unité d’un octet, appelé aussi ID d’esclave, adresse d’esclave ou adresse de périphérique.

## Sur RS-485 (Modbus RTU)

- Chaque périphérique du bus a sa propre adresse de 1 à 247, définie sur son afficheur, avec des commutateurs DIP ou dans son logiciel de configuration.
- L’adresse 0 est la diffusion (broadcast) : tous les périphériques exécutent une écriture et aucun ne répond. Les lectures vers 0 restent sans réponse.
- Un périphérique réglé sur une autre adresse ignore complètement votre requête : un mauvais ID d’unité ressemble donc à un périphérique mort, vous obtenez un [délai d’attente dépassé](modbus-timeout-no-response), pas une erreur.

## Sur Modbus TCP

- Un périphérique joint directement par IP ignore généralement l’ID d’unité ou attend 1. Certains attendent 0 ou 255, et quelques-uns refusent toute valeur autre que celle qui est configurée.
- Derrière une passerelle TCP vers RTU, l’ID d’unité sélectionne le périphérique série : il doit correspondre à l’adresse RS-485 de ce périphérique. La passerelle elle-même répond souvent sur 0, 255 ou un ID configuré.
- Certains périphériques à plusieurs parties internes (un onduleur avec un compteur et une batterie) répondent à un ID d’unité différent pour chaque partie.

<mb-gateway></mb-gateway>

## Retrouver une adresse inconnue

- Lisez-la sur l’afficheur ou l’étiquette du périphérique.
- Balayez : envoyez la lecture d’un registre courant à chaque adresse de 1 à 247 au débit du périphérique et notez laquelle répond. Faites-le avec ce seul périphérique connecté.
- Rétablissez les réglages d’usine ; le manuel donne la valeur par défaut (souvent 1).

## Comment les cartes MBMap l’enregistrent

Une carte donne l’`unit_id` par défaut du périphérique (ainsi que les paramètres série et le port TCP). La valeur par défaut n’est qu’un point de départ : les périphériques sont généralement reconfigurés à l’installation.
