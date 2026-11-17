# Délais d’attente Modbus : le périphérique ne répond pas

Un délai d’attente dépassé signifie que rien n’est revenu que votre outil puisse accepter. Reprenez la liste en partant de la couche la plus basse.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Câblage.** A et B (ou D+ et D−, ou + et −) ne sont pas nommés de la même façon par tous les fabricants. Si rien ne répond, inversez les deux fils : cela ne risque rien.
2. **Masse commune.** Raccordez la masse du signal (GND, C, 0 V) quand le périphérique en a une ; les longs câbles sans elle provoquent des erreurs intermittentes.
3. **Terminaison.** Placez une résistance de 120 Ω aux deux extrémités du bus, pas sur chaque périphérique. Les câbles courts de paillasse fonctionnent généralement sans.
4. **Paramètres série.** Le débit, les bits de données, la parité et les bits d’arrêt doivent correspondre exactement. Un réglage d’usine courant est 9600 ou 19200 bauds, 8 bits de données, parité paire ou aucune. Une parité qui ne correspond pas ne prévient de rien.
5. **ID d’unité.** Chaque périphérique du bus a besoin de sa propre adresse, de 1 à 247. Un périphérique réglé sur 1 ne répond pas aux requêtes destinées au 2. Voir l’[ID d’unité](modbus-unit-id-slave-id).
6. **Un seul maître.** Deux maîtres sur le même bus (un automate et un ordinateur portable) entrent en collision.
7. **Sens du convertisseur.** Les convertisseurs USB–RS-485 bon marché basculent parfois trop lentement le sens de transmission à haut débit. Essayez un débit plus faible.

## Modbus TCP

1. **Atteignez d’abord le périphérique.** Faites-lui un `ping` et vérifiez que le port 502 est ouvert.
2. **Limite de connexions.** Beaucoup de périphériques n’acceptent que quelques connexions TCP. Un outil qui laisse des connexions ouvertes peut en exclure d’autres jusqu’à ce que le périphérique les expire.
3. **ID d’unité derrière une passerelle.** Derrière une passerelle TCP vers RTU, l’ID d’unité choisit le périphérique série et doit correspondre à son adresse ; certaines passerelles ont besoin de 0 ou de 255 pour elles-mêmes.
4. **Modbus TCP est-il activé ?** Certains périphériques sont livrés avec ce mode désactivé, ou ne répondent que sur un autre port.

## Le périphérique répond à certaines requêtes mais pas à d’autres

- Les requêtes trop volumineuses, ou qui couvrent des trous du tableau de registres, peuvent recevoir une exception ou être ignorées. Lisez des blocs plus petits.
- Certains périphériques ont besoin d’une pause entre les requêtes (3,5 temps de caractère en RTU, davantage pour les lents). Augmentez l’intervalle d’interrogation.
- Certains ne répondent qu’après un délai de quelques dizaines ou centaines de millisecondes ; augmentez d’abord le délai d’attente de la réponse.
