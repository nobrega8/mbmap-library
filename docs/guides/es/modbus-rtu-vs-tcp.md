# Modbus RTU, Modbus TCP y RS-485

Tres nombres que a menudo se confunden.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Medio | línea serie, casi siempre RS-485 (a veces RS-232) | Ethernet o Wi-Fi |
| Direccionamiento | ID de unidad 1–247 en el bus | dirección IP y puerto (502), más un ID de unidad |
| Comprobación de errores | CRC-16 en cada trama | las comprobaciones propias de TCP; sin CRC |
| Delimitación de tramas | silencio de 3,5 caracteres entre tramas | cabecera de 7 bytes (MBAP) con una longitud |
| Dispositivos por enlace | hasta 32 cargas unitarias por segmento (más con transceptores de baja carga), un maestro | varios clientes por dispositivo, según el límite del dispositivo |
| Velocidad típica | 9600–115200 baudios | 10/100 Mbit/s, limitada por el dispositivo |

**RS-485** es solo la capa eléctrica: dos hilos, una señal diferencial, un bus. Modbus RTU funciona sobre ella, y también otros protocolos (BACnet MS/TP, DMX, M-Bus mediante adaptadores RS-485).

**Modbus ASCII** envía las mismas peticiones como texto hexadecimal legible; hoy es raro.

<mb-adu></mb-adu>

## Los mismos registros

El mapa de registros es el mismo sea cual sea el transporte: un dispositivo que ofrece ambos responde con las mismas direcciones, tipos y escalas. Lo que cambia es cómo se llega a él: ajustes serie e ID de unidad en RTU, dirección IP y puerto en TCP.

## Pasarelas

Una pasarela Modbus TCP a RTU permite que las herramientas Ethernet lleguen a dispositivos serie. El ID de unidad de la petición TCP elige el dispositivo del lado serie. Las pasarelas añaden sus propios tiempos de espera; si un dispositivo detrás de una no responde, revisa primero los ajustes serie de la pasarela.

## Cómo lo registran los mapas MBMap

Un mapa indica qué transportes ofrece el dispositivo (`protocol`: `rtu`, `tcp` o ambos) y sus valores por defecto (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
