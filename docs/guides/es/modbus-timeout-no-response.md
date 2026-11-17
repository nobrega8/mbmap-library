# Tiempos de espera Modbus: el dispositivo no responde

Un tiempo de espera agotado significa que no ha vuelto nada que tu herramienta pueda aceptar. Repasa la lista desde la capa más baja hacia arriba.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Cableado.** No todos los fabricantes llaman igual a A y B (o D+ y D−, o + y −). Si no responde nada, intercambia los dos hilos: no hace ningún daño.
2. **Masa común.** Conecta la masa de señal (GND, C, 0 V) cuando el dispositivo la tenga; los cables largos sin ella dan errores intermitentes.
3. **Terminación.** Pon una resistencia de 120 Ω en ambos extremos del bus, no en cada dispositivo. Los cables cortos de banco suelen funcionar sin ella.
4. **Ajustes serie.** La velocidad, los bits de datos, la paridad y los bits de parada deben coincidir exactamente. Un ajuste de fábrica habitual es 9600 o 19200 baudios, 8 bits de datos, paridad par o ninguna. Una paridad que no coincide no avisa de nada.
5. **ID de unidad.** Cada dispositivo del bus necesita su propia dirección, de 1 a 247. Un dispositivo configurado en 1 no responde a las peticiones dirigidas al 2. Consulta el [ID de unidad](modbus-unit-id-slave-id).
6. **Un solo maestro.** Dos maestros en el mismo bus (un PLC y un portátil) chocan.
7. **Dirección del conversor.** Los conversores USB–RS-485 baratos a veces cambian de dirección demasiado despacio a velocidades altas. Prueba con una velocidad menor.

## Modbus TCP

1. **Llega primero al dispositivo.** Hazle `ping` y comprueba que el puerto 502 está abierto.
2. **Límite de conexiones.** Muchos dispositivos aceptan solo unas pocas conexiones TCP. Una herramienta que deja conexiones abiertas puede bloquear a las demás hasta que el dispositivo las cierre por inactividad.
3. **ID de unidad a través de pasarelas.** Detrás de una pasarela TCP a RTU, el ID de unidad elige el dispositivo serie y debe coincidir con su dirección; algunas pasarelas necesitan 0 o 255 para sí mismas.
4. **¿Está activado Modbus TCP?** Algunos dispositivos lo traen desactivado, o responden solo en otro puerto.

## El dispositivo responde a unas peticiones pero no a otras

- Las peticiones demasiado grandes, o que abarcan huecos de la tabla de registros, pueden recibir una excepción o ser ignoradas. Lee bloques más pequeños.
- Algunos dispositivos necesitan una pausa entre peticiones (3,5 tiempos de carácter en RTU, más en los lentos). Aumenta el intervalo de sondeo.
- Algunos responden solo tras un retraso de decenas o cientos de milisegundos; aumenta antes que nada el tiempo de espera de respuesta.
