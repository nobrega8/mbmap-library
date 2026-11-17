# ¿Es seguro escribir en un dispositivo Modbus?

Leer un registro es inofensivo. Escribir en uno modifica el dispositivo, a veces de maneras difíciles de deshacer.

## Qué puede salir mal

- **Registro equivocado.** Una [dirección desplazada en uno](modbus-address-off-by-one) escribe tu valor en el ajuste vecino: una relación de TC, un límite de protección, una velocidad.
- **Ajustes de comunicación.** Escribir el ID de unidad, la velocidad o la paridad te deja sin conexión hasta que vuelvas a conectar con los nuevos valores.
- **Desgaste de la memoria.** Muchos dispositivos guardan los ajustes en flash o EEPROM con un número limitado de escrituras. Escribir una consigna cada segundo puede agotarla en meses. Algunos dispositivos ofrecen una dirección solo en RAM para escrituras frecuentes.
- **Los comandos actúan al instante.** Marcha/paro, apertura/cierre de interruptores, puesta a cero de contadores de energía y restablecimiento de fábrica ocurren en la escritura, sin confirmación.
- **Valores escritos a medias.** Escribir los dos registros de un valor de 32 bits en peticiones separadas puede dejar un valor mezclado durante un momento, o ser rechazado.

<mb-flow name="write"></mb-flow>

## Antes de escribir

1. Comprueba el mapa con el documento del fabricante, y prefiere los mapas marcados como *verificados* u *oficiales*.
2. Lee primero el registro y confirma que contiene lo que esperas.
3. Comprueba el rango permitido; muchos dispositivos recortan o rechazan los valores fuera de él.
4. Escribe los valores de varios registros en una sola petición (función 16).
5. Sabe cómo restaurar el valor anterior.
6. En equipos que controlan potencia o maquinaria, prueba con ellos aislados.

## Cómo ayudan los mapas MBMap

Los registros tienen un `access` (`R`, `W`, `RW`), y los escribibles pueden llevar `write_min` y `write_max`. Cada mapa tiene un estado que indica si se probó en un dispositivo, si procede del documento del fabricante o si aún no se ha comprobado. Las herramientas deberían avisar antes de escribir en un dispositivo cuyo modelo no coincida con el mapa.
