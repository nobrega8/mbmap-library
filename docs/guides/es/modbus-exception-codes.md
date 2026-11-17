# Códigos de excepción Modbus: qué te está diciendo el dispositivo

Cuando un dispositivo Modbus entiende una petición pero no puede llevarla a cabo, responde con una excepción: el código de función con su bit más alto activado (`0x83` para una lectura fallida de registros de retención) y un código de un byte.

| Código | Nombre | Causa habitual | Qué probar |
|---|---|---|---|
| 01 | Illegal function | El dispositivo no admite este código de función: leer registros de entrada (04) en un dispositivo que solo tiene registros de retención, o escribir con 16 en uno que solo acepta 06 | Usa el código de función que el manual indica para esa tabla |
| 02 | Illegal data address | La dirección no existe, o el bloque pedido cae en un hueco | Comprueba el [desplazamiento de dirección](modbus-address-off-by-one); lee menos registros a la vez |
| 03 | Illegal data value | La cantidad es demasiado grande (más de 125 registros) o el valor escrito está fuera de rango | Lee bloques más pequeños; comprueba el rango permitido antes de escribir |
| 04 | Server device failure | El dispositivo falló al hacerlo; algunos lo usan para cualquier escritura rechazada o para la lectura de un bloque que no permiten | Lee un registro cada vez; comprueba el estado del dispositivo |
| 05 | Acknowledge | Aceptado, pero tardará un rato (programación, guardado) | Espera y luego sondea |
| 06 | Server device busy | El dispositivo está ocupado | Reintenta más tarde |
| 0A | Gateway path unavailable | Una pasarela no pudo llegar al dispositivo que tiene detrás | Revisa el lado serie de la pasarela y su enrutamiento |
| 0B | Gateway target failed to respond | La pasarela reenvió la petición pero el dispositivo no respondió | Revisa el ID de unidad, la velocidad y el cableado detrás de la pasarela |

<mb-exceptions></mb-exceptions>

## No recibir respuesta no es una excepción

Un dispositivo que recibe una trama con un CRC erróneo, un ID de unidad equivocado o un error de paridad se queda callado: obtienes un tiempo de espera agotado, no una excepción. Consulta los [tiempos de espera](modbus-timeout-no-response).

## Bloques que abarcan huecos

Muchos dispositivos rechazan una lectura que abarque cualquier dirección sin usar, aunque existan todos los registros que necesitas. Si leer 20 registros falla con 02 pero leerlos de uno en uno funciona, divide la petición por los huecos. Los mapas pueden indicar cuántos registros acepta un dispositivo por petición (`max_read_registers`).
