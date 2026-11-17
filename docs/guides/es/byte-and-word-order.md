# Orden de bytes y de palabras: cuando los valores de 32 bits salen mal

Una tensión marca 1,7 × 10³⁸, un contador de energía salta de 65 536 en 65 536, o una temperatura es un número negativo diminuto. Los registros están bien; lo que falla es el orden en que se unen los dos registros de un valor de 32 bits.

## Un registro es fácil, dos no

Un registro Modbus tiene 16 bits y se envía primero el byte más significativo. El estándar no dice nada sobre los valores de más de un registro, así que cada fabricante decide cómo repartir un entero o un flotante de 32 bits entre dos registros (y uno de 64 bits entre cuatro).

Los cuatro órdenes suelen nombrarse por los bytes del valor, siendo `A` el más significativo:

| Nombre | Registro 1 | Registro 2 | También llamado |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, palabra alta primero |
| `CDAB` | C D | A B | intercambio de palabras, palabra baja primero, LSW primero |
| `BADC` | B A | D C | intercambio de bytes |
| `DCBA` | D C | B A | little-endian, ambos intercambiados |

`ABCD` y `CDAB` cubren casi todos los dispositivos. `CDAB` es habitual en Schneider, Carlo Gavazzi y muchos contadores chinos; `ABCD` en Siemens, Janitza y la mayoría de los dispositivos SunSpec.

<mb-byte-order></mb-byte-order>

## Cómo encontrar el correcto

1. **Lee la sección de formato de datos del manual.** Busca «word order», «LSW first», «MSW first», «high word first» o «big endian».
2. **Lee un valor que conozcas.** Lee como flotante, en cada orden, una tensión que debería rondar los 230 V. Solo uno dará un número razonable.
3. **Observa un contador.** Si el registro bajo de un contador de energía desborda hacia lo que tu herramienta muestra como parte alta, intercambia las palabras.
4. **Comprueba aparte los valores de 64 bits.** Algunos dispositivos guardan los valores de 32 bits con la palabra alta primero y los de 64 bits en otro orden.

## Cadenas de texto

El texto suele llevar dos caracteres por registro, con el primero en el byte alto. Unos pocos dispositivos ponen el primer carácter en el byte bajo, de modo que «EM24» se lee como «ME42».

## Cómo lo registran los mapas MBMap

Un mapa fija `byte_order` y `word_order` para todo el dispositivo, y cualquier registro puede sobrescribirlos. Las páginas de dispositivo muestran el orden de cada valor de varios registros con la notación anterior (por ejemplo `float32 CDAB`), y la exportación a Home Assistant lo convierte en la opción `swap:` correcta.
