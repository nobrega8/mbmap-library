# Códigos de función Modbus y áreas de registros

Cada petición Modbus nombra un código de función. Este decide tanto la acción como el área del dispositivo sobre la que actúa.

| Código | Nombre | Área | Tamaño |
|---|---|---|---|
| 01 | Read Coils | bobinas (0x) | bits, lectura/escritura |
| 02 | Read Discrete Inputs | entradas discretas (1x) | bits, solo lectura |
| 03 | Read Holding Registers | registros de retención (4x) | 16 bits, lectura/escritura |
| 04 | Read Input Registers | registros de entrada (3x) | 16 bits, solo lectura |
| 05 | Write Single Coil | bobinas | escribe `0xFF00` para activar, `0x0000` para desactivar |
| 06 | Write Single Register | registros de retención | un registro |
| 15 (0x0F) | Write Multiple Coils | bobinas | varios bits |
| 16 (0x10) | Write Multiple Registers | registros de retención | varios registros |
| 17 (0x11) | Report Server ID | — | identidad del dispositivo, el formato lo fija el dispositivo |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | fabricante, código de producto, revisión como texto |

## ¿Retención o entrada?

La tabla del manual o el prefijo de su dirección te lo dice: `3xxxx` se lee con 04, `4xxxx` con 03. Algunos dispositivos responden a ambas funciones con los mismos datos; otros rechazan la incorrecta con la excepción 01 (illegal function). Si un manual no da prefijo ni función, prueba primero con 03.

## Escritura

- Un valor de 32 bits necesita dos registros escritos a la vez con 16; escribir sus mitades una a una con 06 puede dejar el dispositivo con un valor mezclado, o ser rechazado.
- Algunos dispositivos aceptan solo 06, otros solo 16. La lista de funciones admitidas del manual lo aclara.
- Las bobinas escritas con 05 deben llevar exactamente `0xFF00` o `0x0000`.

## Cómo lo registran los mapas MBMap

Cada registro tiene un `area` (`coil`, `discrete`, `input`, `holding`) y un `access` (`R`, `W`, `RW`); una herramienta elige la función a partir de ellos. Los mapas también pueden describir las funciones de identidad 17 y 43, de modo que una herramienta pueda comprobar con qué dispositivo está hablando.
