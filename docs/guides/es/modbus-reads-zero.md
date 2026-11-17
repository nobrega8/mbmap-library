# Un registro Modbus lee 0, 0xFFFF o 0x8000

La petición tiene éxito pero el valor no tiene sentido. Antes de sospechar del dispositivo, comprueba qué intenta decirte.

## Razones habituales

- **Área equivocada.** La misma dirección puede existir como registro de entrada y como registro de retención con contenidos distintos. Leer el registro de retención cuando el valor está en un registro de entrada puede devolver ceros. Consulta los [códigos de función](modbus-function-codes).
- **Desplazamiento de uno.** Leer la segunda mitad de un valor de 32 bits en lugar de la primera suele dar 0 para valores pequeños. Consulta las [direcciones](modbus-address-off-by-one).
- **No implementado.** Muchos dispositivos responden a la lectura de registros sin usar con 0, 0xFFFF, 0x7FFF o 0x8000 en lugar de una excepción. Los dispositivos SunSpec usan 0x8000 (−32768) para «no implementado» en campos con signo y 0xFFFF en los que no lo tienen.
- **No medido.** Una corriente de neutro en una conexión de tres hilos, una fase sin cablear o una entrada de sensor sin nada conectado leen 0 o un marcador fijo.
- **No listo.** Algunos dispositivos devuelven ceros unos segundos tras arrancar, o hasta que termina su primer ciclo de medida.
- **Diferencias entre modelos.** Un registro que figura en el manual de una familia puede existir solo en algunos modelos: los demás devuelven 0.
- **Escala demasiado gruesa.** Una corriente pequeña con una escala de 1 A se lee como 0.

<mb-scaling></mb-scaling>

## Cómo lo registran los mapas MBMap

Un mapa puede enumerar `sentinels`, los valores que significan «no disponible» para cada tipo, de modo que una herramienta los muestre como ausentes y no como una lectura. Las descripciones de los registros indican qué modelos o cableado necesita un valor.
