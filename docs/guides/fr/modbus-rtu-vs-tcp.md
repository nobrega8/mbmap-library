# Modbus RTU, Modbus TCP et RS-485

Trois noms que l’on confond souvent.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Support | ligne série, presque toujours RS-485 (parfois RS-232) | Ethernet ou Wi-Fi |
| Adressage | ID d’unité 1–247 sur le bus | adresse IP et port (502), plus un ID d’unité |
| Contrôle d’erreurs | CRC-16 dans chaque trame | contrôles propres à TCP ; pas de CRC |
| Délimitation des trames | silence de 3,5 caractères entre les trames | en-tête de 7 octets (MBAP) avec une longueur |
| Périphériques par liaison | jusqu’à 32 charges unitaires par segment (davantage avec des émetteurs-récepteurs à faible charge), un maître | plusieurs clients par périphérique, selon la limite du périphérique |
| Vitesse typique | 9600–115200 bauds | 10/100 Mbit/s, limitée par le périphérique |

Le **RS-485** n’est que la couche électrique : deux fils, un signal différentiel, un bus. Modbus RTU fonctionne dessus, et d’autres protocoles aussi (BACnet MS/TP, DMX, M-Bus via des adaptateurs RS-485).

**Modbus ASCII** envoie les mêmes requêtes sous forme de texte hexadécimal lisible ; il est rare aujourd’hui.

<mb-adu></mb-adu>

## Les mêmes registres

La carte de registres est la même quel que soit le transport : un périphérique qui offre les deux répond avec les mêmes adresses, types et échelles. Ce qui change, c’est la manière de l’atteindre : paramètres série et ID d’unité en RTU, adresse IP et port en TCP.

## Passerelles

Une passerelle Modbus TCP vers RTU permet aux outils Ethernet d’atteindre des périphériques série. L’ID d’unité de la requête TCP choisit le périphérique côté série. Les passerelles ajoutent leurs propres délais d’attente ; si un périphérique situé derrière l’une d’elles ne répond pas, vérifiez d’abord les paramètres série de la passerelle.

## Comment les cartes MBMap l’enregistrent

Une carte indique quels transports le périphérique offre (`protocol` : `rtu`, `tcp` ou les deux) et leurs valeurs par défaut (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
