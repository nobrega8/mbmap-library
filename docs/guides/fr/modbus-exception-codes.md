# Codes d’exception Modbus : ce que vous dit le périphérique

Quand un périphérique Modbus comprend une requête mais ne peut pas l’exécuter, il répond par une exception : le code de fonction avec son bit de poids fort à 1 (`0x83` pour une lecture échouée de registres de maintien) et un code d’un octet.

| Code | Nom | Cause habituelle | Que faire |
|---|---|---|---|
| 01 | Illegal function | Le périphérique ne gère pas ce code de fonction : lecture de registres d’entrée (04) sur un périphérique qui n’a que des registres de maintien, ou écriture avec 16 sur un périphérique qui n’accepte que 06 | Utilisez le code de fonction que le manuel indique pour ce tableau |
| 02 | Illegal data address | L’adresse n’existe pas, ou le bloc demandé tombe dans un trou | Vérifiez le [décalage d’adresse](modbus-address-off-by-one) ; lisez moins de registres à la fois |
| 03 | Illegal data value | La quantité est trop grande (plus de 125 registres) ou la valeur écrite est hors plage | Lisez des blocs plus petits ; vérifiez la plage autorisée avant d’écrire |
| 04 | Server device failure | Le périphérique a échoué en l’exécutant ; certains l’utilisent pour toute écriture refusée ou pour la lecture d’un bloc qu’ils n’autorisent pas | Lisez un registre à la fois ; vérifiez l’état du périphérique |
| 05 | Acknowledge | Accepté, mais cela prendra du temps (programmation, enregistrement) | Attendez, puis interrogez à nouveau |
| 06 | Server device busy | Le périphérique est occupé | Réessayez plus tard |
| 0A | Gateway path unavailable | Une passerelle n’a pas pu joindre le périphérique situé derrière elle | Vérifiez le côté série de la passerelle et son routage |
| 0B | Gateway target failed to respond | La passerelle a transmis la requête mais le périphérique n’a pas répondu | Vérifiez l’ID d’unité, le débit et le câblage derrière la passerelle |

<mb-exceptions></mb-exceptions>

## Une absence de réponse n’est pas une exception

Un périphérique qui reçoit une trame avec un CRC erroné, un mauvais ID d’unité ou une erreur de parité reste silencieux : vous obtenez un délai d’attente dépassé, pas une exception. Voir les [délais d’attente](modbus-timeout-no-response).

## Blocs qui enjambent des trous

Beaucoup de périphériques refusent une lecture qui couvre une adresse inutilisée, même si tous les registres dont vous avez besoin existent. Si lire 20 registres échoue avec 02 mais que les lire un par un fonctionne, découpez la requête aux trous. Les cartes peuvent indiquer combien de registres un périphérique accepte par requête (`max_read_registers`).
