# ID de unidad Modbus (ID de esclavo): qué dispositivo responde

Cada petición Modbus lleva un ID de unidad de un byte, llamado también ID de esclavo, dirección de esclavo o dirección de dispositivo.

## En RS-485 (Modbus RTU)

- Cada dispositivo del bus tiene su propia dirección, de 1 a 247, que se fija en su pantalla, con interruptores DIP o con su software de configuración.
- La dirección 0 es difusión (broadcast): todos los dispositivos ejecutan una escritura y ninguno responde. Las lecturas a 0 no obtienen respuesta.
- Un dispositivo configurado con otra dirección ignora por completo tu petición, así que un ID de unidad equivocado parece un dispositivo muerto: obtienes un [tiempo de espera agotado](modbus-timeout-no-response), no un error.

## En Modbus TCP

- Un dispositivo al que se llega directamente por IP suele ignorar el ID de unidad o esperar 1. Algunos esperan 0 o 255, y unos pocos rechazan cualquier valor que no sea el configurado.
- Detrás de una pasarela TCP a RTU, el ID de unidad selecciona el dispositivo serie: debe coincidir con la dirección RS-485 de ese dispositivo. La propia pasarela suele responder a 0, 255 o a un ID configurado.
- Algunos dispositivos con varias partes internas (un inversor con un contador y una batería) responden a un ID de unidad distinto para cada parte.

<mb-gateway></mb-gateway>

## Cómo encontrar una dirección desconocida

- Léela en la pantalla o en la etiqueta del dispositivo.
- Escanea: envía la lectura de un registro común a cada dirección de 1 a 247, a la velocidad del dispositivo, y anota cuál responde. Hazlo con solo ese dispositivo conectado.
- Restablece los ajustes de fábrica; el manual indica el valor por defecto (a menudo 1).

## Cómo lo registran los mapas MBMap

Un mapa da el `unit_id` por defecto del dispositivo (y los ajustes serie y el puerto TCP). El valor por defecto es solo un punto de partida: los dispositivos suelen reconfigurarse al instalarlos.
