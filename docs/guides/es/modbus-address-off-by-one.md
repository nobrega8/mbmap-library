# Direcciones Modbus: por qué tu lectura está desplazada un registro

Lees el registro 40001 y obtienes el valor que el manual indica para el 40002, o el dispositivo responde *illegal data address* para un registro que sí está en la tabla. Casi siempre la causa es la misma: el manual y tu herramienta cuentan los registros de forma distinta.

## Tres formas de escribir el mismo registro

| Lo que imprime el manual | Qué significa | Qué va por el cable |
|---|---|---|
| `40001` (referencia Modicon) | registro de retención número 1, contado desde 1, con `4` como prefijo del área | dirección `0` |
| `1` (número de registro) | registro de retención 1, contado desde 1 | dirección `0` |
| `0` o `0x0000` (desplazamiento) | la propia dirección | dirección `0` |

Una trama Modbus siempre lleva una dirección de 0 a 65535. Los prefijos `4` (retención), `3` (entrada), `1` (entrada discreta) y `0` (bobina) no se envían: el área la elige el código de función (03 para retención, 04 para entrada, 02 para entradas discretas, 01 para bobinas). El número que queda suele contarse desde 1, así que la dirección en el cable es ese número **menos uno**.

Las referencias de seis dígitos como `400001` o `300013` funcionan igual: quita el primer dígito y resta uno (`300013` → registro de entrada `12`).

<mb-address></mb-address>

## Cómo saber cuál usa tu manual

- **Las direcciones hexadecimales** (`0x0BB7`, `1004h`) casi siempre son la dirección del cable.
- **Un primer registro 40001 o 30001** indica referencias Modicon: resta 40001 o 30001.
- **Un primer registro 1** suele indicar números contados desde 1; un primer registro 0 indica direcciones del cable.
- **Busca un ejemplo resuelto.** Muchos manuales muestran una trama de petición («leer el registro 40011: 01 03 00 0A 00 01 …»). Los dos bytes que siguen al código de función son la dirección del cable y zanjan la cuestión.
- **Algunos manuales los mezclan**, por ejemplo una columna decimal de «registro» que es una unidad mayor que la columna hexadecimal de «dirección» contigua. Fíate de la columna hexadecimal y de las tramas de ejemplo.

## Qué espera tu herramienta

Las herramientas también difieren. Unas piden la dirección del cable, otras un número de registro contado desde 1, y otras aceptan una referencia Modicon y le quitan el prefijo. Si un valor está desplazado exactamente un registro (un valor de 32 bits parece basura, o cada valor parece pertenecer a su vecino), prueba con la dirección una unidad menos o una más.

## Cómo lo registran los mapas MBMap

Cada archivo `.mbmap.json` indica qué convención usan sus direcciones con `address_base`: `0` significa que las direcciones son las del cable, `1` que se cuentan desde 1 y que la dirección del cable es una menos. Las páginas de dispositivo de este sitio, la exportación a CSV y la exportación a Home Assistant muestran la dirección del cable junto a la dirección tal como figura en el mapa, así que nunca tienes que adivinarla.
