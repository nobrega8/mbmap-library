# `.mbmap` — formato Modbus Map, versión 2

Un archivo `.mbmap.json` describe el mapa de registros Modbus de un modelo de dispositivo: quién lo fabrica, cómo comunicarse con él y qué significa cada registro. Es un documento JSON, por lo que cualquier lenguaje puede leerlo con su analizador JSON estándar, y un [JSON Schema](schema/mbmap-2.schema.json) describe su estructura.

Las palabras clave **MUST**, **SHOULD** y **MAY** se usan como en la [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **MUST** significa obligatorio, **SHOULD** recomendado (con excepciones justificadas) y **MAY** opcional. Esta traducción conserva las palabras en inglés para facilitar la comparación con el original.

## 1. Ejemplo

```json
{
  "$schema": "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json",
  "mbmap": 2,
  "vendor": "Example Corp",
  "model": "EM-100",
  "description": "Single-phase energy meter",
  "protocol": "rtu",
  "unit_id": 1,
  "baudrate": 9600,
  "parity": "E",
  "stopbits": 1,
  "byte_order": "big",
  "word_order": "big",
  "address_base": 0,
  "enums": {
    "relay": {"0": "Open", "1": "Closed"}
  },
  "registers": [
    {"name": "Voltage", "group": "Measurements", "area": "input", "address": 0, "type": "float32", "unit": "V", "description": "RMS voltage"},
    {"name": "Current", "group": "Measurements", "area": "input", "address": 6, "type": "float32", "unit": "A", "description": "RMS current"},
    {"name": "Active energy", "group": "Energy", "area": "holding", "address": 256, "type": "uint32", "scale": 0.01, "unit": "kWh", "word_order": "little"},
    {"name": "Relay state", "group": "Status", "area": "holding", "address": 512, "type": "bool", "bit": 3, "enum": "relay", "description": "Bit 3 of the status word"},
    {"name": "Reset energy", "group": "Commands", "area": "coil", "address": 0, "type": "bool", "access": "W", "description": "Write 1 to reset counters"},
    {"name": "Serial number", "group": "Info", "area": "holding", "address": 1024, "type": "string", "length": 8, "description": "16 ASCII characters"}
  ]
}
```

Un ejemplo completo está en [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. Archivo

- Un mapa es un objeto JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), codificado en UTF-8. Los lectores **MUST** aceptar e ignorar un BOM inicial. Los escritores **SHOULD NOT** escribir uno.
- El nombre del archivo termina en `.mbmap.json`.
- Un objeto **MUST NOT** repetir una clave. Los analizadores JSON tratan las claves duplicadas de formas distintas, por lo que un archivo que tenga una no es válido.
- Las cadenas se usan tal como están escritas: no se recortan espacios, y los valores enumerados distinguen mayúsculas de minúsculas (`"holding"`, no `"Holding"`).
- El `null` de JSON no es un valor válido para ninguna clave; omite la clave en su lugar.
- JSON no tiene comentarios. Las notas sobre todo el archivo van en `notes`, y una nota sobre un registro en su `comment`. Ambos son texto libre que las herramientas **MAY** mostrar y **MUST NOT** interpretar.
- Los escritores **SHOULD** usar la disposición de la sección 1: sangría de dos espacios y una línea por registro y por tabla de `enums`/`sentinels`, de modo que un cambio en un registro sea una diferencia de una sola línea.
- `$schema` es opcional y dirige a los editores al JSON Schema. Los lectores **MUST** ignorarlo.

### 2.1 Enteros

Donde un valor es un **entero**, **MAY** escribirse como un entero JSON (`1040`) o como una cadena con un entero decimal o hexadecimal `0x` (`"0x0410"`). Las cadenas conservan la grafía hexadecimal que usan los manuales para direcciones e identificadores, y transportan valores de 64 bits que no todos los analizadores JSON leen exactamente como números (por encima de 2^53). Las claves de las tablas `enums` y `sentinels` son siempre cadenas, en las mismas dos formas.

### 2.2 Tablas

Una **tabla** asigna etiquetas a valores sin procesar: un objeto cuyas claves son enteros escritos como cadenas (2.1) y cuyos valores son etiquetas no vacías, por ejemplo `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Una tabla tiene al menos una entrada, y dos claves **MUST NOT** representar el mismo valor (`"1"` y `"0x1"`).

## 3. Claves de primer nivel

`mbmap`, `vendor`, `model` y `registers` son obligatorias. Todas las demás claves son opcionales; cuando faltan, se aplica el valor por defecto.

| Clave | Tipo JSON | Por defecto | Significado |
|---|---|---|---|
| `mbmap` | entero `2` | | Versión del formato (3.1, sección 8) |
| `vendor` | cadena no vacía | | Fabricante |
| `model` | cadena no vacía | | Modelo o familia de modelos, tal como se muestra a las personas |
| `models` | matriz de cadenas no vacías | `[model]` | Todos los nombres o códigos de modelo a los que se aplica el mapa (3.2) |
| `vendor_website` | cadena: un dominio o una URL `http(s)://` | | Sitio web del fabricante, p. ej. `se.com` o `https://www.se.com` |
| `description` | cadena | | Descripción breve |
| `revision` | entero ≥ 1 | | Revisión del contenido de este mapa (3.1) |
| `revised` | cadena `YYYY-MM-DD` | | Fecha de esa revisión |
| `firmware` | cadena | | Texto libre sobre el firmware al que se aplica el mapa |
| `firmware_min` | cadena de versión (3.2) | | El firmware más antiguo al que se aplica el mapa |
| `firmware_max` | cadena de versión (3.2) | | El firmware más reciente al que se aplica el mapa |
| `source` | cadena | | Resumen en texto libre de dónde procede el mapa |
| `sources` | matriz de objetos de fuente | | Documentos a partir de los cuales se hizo o se comprobó el mapa (3.3) |
| `notes` | matriz de cadenas | | Notas libres sobre el archivo |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transportes que admite el dispositivo |
| `unit_id` | entero `0`–`255` | `1` | ID de unidad / esclavo por defecto |
| `port` | entero `1`–`65535` | `502` | Puerto TCP por defecto |
| `baudrate` | entero | `9600` | Velocidad RTU por defecto |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Paridad RTU por defecto |
| `databits` | `7`, `8` | `8` | Bits de datos RTU por defecto |
| `stopbits` | `1`, `2` | `1` | Bits de parada RTU por defecto |
| `byte_order` | `"big"`, `"little"` | `"big"` | Orden de bytes por defecto dentro de cada registro (sección 6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Orden por defecto de los registros de un valor de varios registros (sección 6) |
| `address_base` | `0`, `1` | `0` | Si `address` se cuenta desde 0 o desde 1 (sección 5) |
| `max_read_registers` | entero `1`–`125` | `125` | El mayor bloque que acepta el dispositivo por lectura (FC03/04) |
| `max_read_bits` | entero `1`–`2000` | `2000` | El mayor bloque que acepta el dispositivo por lectura (FC01/02) |
| `enums` | objeto: nombre → tabla | | Tablas de traducción con nombre (4.1). Los nombres usan `a`–`z`, `0`–`9` y `_` |
| `sentinels` | objeto: tipo → tabla | | Valores sin procesar reservados por tipo entero (4.2) |
| `identify` | objeto | | Cómo leer la identidad del dispositivo con Report Slave ID (FC17) o Read Device Identification (FC43) (4.8) |
| `registers` | matriz de objetos de registro | | Los registros (sección 4) |

Los valores de conexión son **valores por defecto**: el usuario puede cambiarlos al conectar.

### 3.1 Versión del formato y revisión del mapa

Dos números describen un mapa, y cambian por razones distintas:

- **`mbmap`, la versión del formato**, indica qué versión de esta especificación sigue el archivo, para que un lector sepa si puede leerlo (sección 8). Es la misma en todos los mapas escritos según esta especificación y solo cambia cuando cambia el formato.
- **`revision`, la revisión del mapa**, indica qué edición del contenido de este mapa es el archivo. Empieza en `1` y **SHOULD** aumentar de uno en uno con cada cambio publicado que afecte a cómo se lee o se escribe un dispositivo: un registro, un valor de conexión por defecto, una tabla, un rango de firmware o un modelo. **MAY** mantenerse igual en cambios solo de texto libre (`description`, `notes`, `comment`, `source`). `revised` da la fecha de ese cambio.

Una herramienta que tenga dos copias del mismo mapa (el mismo `vendor` y `model`) **SHOULD** tratar la de `revision` más alta como la más reciente, y **MAY** ofrecerla al usuario. Un mapa sin `revision` no puede compararse así. La revisión no es la versión de firmware del dispositivo: el firmware pertenece a la sección 3.2.

### 3.2 Modelos y firmware

Un mapa se aplica a los modelos de `models`, o solo a `model` cuando falta `models`. `model` es el nombre que se muestra a las personas: un dispositivo, o el nombre de la familia o serie cuando el mapa abarca varios (`"PM5100 and PM5300 series"`), no una lista de dispositivos. `models` enumera cada nombre o código que un dispositivo puede comunicar, para que una herramienta pueda compararlo con el dispositivo conectado (sección 9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` y `firmware_max` indican a qué versiones de firmware se aplica el mapa. Ambos son opcionales: sin ellos el mapa se aplica a todo el firmware, que es también la elección correcta cuando se desconoce la versión. `firmware` sigue disponible para lo que un rango no puede decir («2.x, excepto 2.3 beta»).

Una **cadena de versión** es uno o más números enteros separados por puntos: `"2"`, `"2.1"`, `"1.02.7"`. Los componentes se comparan como números, de izquierda a derecha (`"1.10"` es más reciente que `"1.9"`, y `"1.02"` es igual a `"1.2"`), así que escribe las versiones como las comunica el dispositivo. Un límite abarca todas las versiones que empiezan por él:

- `firmware_min` `"2.1"` incluye `2.1`, `2.1.4` y `3.0`, pero no `2.0.9`;
- `firmware_max` `"2"` incluye todas las `2.x` y `2.x.y`, pero no `3.0`; `firmware_max` `"2.3"` incluye `2.3.7` pero no `2.4`.

Así, `"firmware_min": "1", "firmware_max": "2"` se lee «firmware 1.x y 2.x». `firmware_min` **MUST NOT** ser posterior a `firmware_max`.

**Registros que dependen del firmware.** Un registro puede llevar sus propios `firmware_min` y `firmware_max`, con el mismo significado, cuando solo existe en algunas versiones de firmware. Esto permite mantener un solo archivo para revisiones de firmware que difieren en unos pocos registros. Un registro sin ellos se aplica allí donde se aplique el mapa. Dos registros **MAY** compartir un `name` (y una dirección) cuando sus rangos de firmware no se solapan: la herramienta usa el que coincide con el dispositivo.

Ejemplo: el firmware 2.1 movió el contador de energía y añadió un registro de factor de potencia:

```json
"firmware_min": "1",
"firmware_max": "2",
"registers": [
  {"name": "Firmware version", "area": "holding", "address": 0, "type": "string", "length": 4, "role": "firmware"},
  {"name": "Voltage", "area": "input", "address": 10, "type": "float32", "unit": "V"},
  {"name": "Active energy", "area": "input", "address": 20, "type": "uint32", "unit": "Wh", "firmware_max": "2.0"},
  {"name": "Active energy", "area": "input", "address": 40, "type": "uint64", "unit": "Wh", "firmware_min": "2.1"},
  {"name": "Power factor", "area": "input", "address": 30, "type": "int16", "scale": 0.001, "firmware_min": "2.1"}
]
```

Cuando las diferencias son grandes (cambian la mayoría de las direcciones, o los ajustes de conexión), es más claro usar archivos separados: un mapa por rango de firmware, cada uno con sus propios `firmware_min` y `firmware_max`.

### 3.3 Fuentes

`sources` registra los documentos a partir de los cuales se hizo un mapa o con los que se comprobó, para que un lector pueda encontrarlos y saber qué edición se usó. Cada elemento es un objeto:

| Clave | Tipo JSON | Significado |
|---|---|---|
| `title` | cadena no vacía, obligatoria | Título del documento, p. ej. `"EM530/EM540 Modbus communication protocol"` |
| `version` | cadena | Edición o revisión del documento, tal como está impresa en él |
| `date` | cadena `YYYY`, `YYYY-MM` o `YYYY-MM-DD` | Fecha de publicación de esa edición |
| `url` | URL `http(s)://` | Dónde puede encontrarse el documento |
| `note` | cadena | Qué parte se usó, o cómo se comprobó el mapa (p. ej. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | cadena `YYYY-MM-DD` | Cuándo se descargó o leyó el documento, ya que un documento en la misma URL puede cambiar sin una versión nueva |
| `sha256` | cadena de 64 dígitos hexadecimales | SHA-256 del archivo que se usó, para que un lector pueda saber si el documento en `url` sigue siendo el mismo |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` aparece arriba abreviado; en un archivo son los 64 dígitos hexadecimales. Una herramienta **MAY** compararlo con el documento que descarga y avisar cuando difieran: el documento se actualizó y puede que haya que volver a comprobar el mapa.

`source` sigue siendo un resumen de una línea en texto libre, para las personas y para los mapas cuyas fuentes no se conocen con este detalle. Un mapa **MAY** tener ambos.

## 4. Registros

Cada elemento de `registers` es un objeto. `name`, `area`, `address` y `type` son obligatorios; todas las demás claves son opcionales, y se aplica el valor por defecto cuando faltan.

| Clave | Tipo JSON | Por defecto | Significado |
|---|---|---|---|
| `name` | cadena no vacía | | Nombre de la variable. **SHOULD** ser único en el archivo |
| `group` | cadena | | Agrupación libre para mostrar (p. ej. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Área de datos Modbus (sección 5) |
| `address` | entero (2.1) | | Dirección del primer registro / bit (sección 5) |
| `type` | ver sección 6 | | Tipo de datos |
| `length` | entero ≥ 1 | | Número de registros. Obligatorio para `string`, se ignora en los demás |
| `bit` | entero `0`–`15` | | Para `bool` en `input`/`holding`: qué bit del registro, 0 = menos significativo. Para un campo de bits `uint16`: su bit más bajo |
| `bits` | entero `1`–`16` | | Para `uint16` en `input`/`holding`: anchura de un campo de bits que empieza en `bit` (4.3) |
| `scale` | número | `1` | Multiplicador |
| `scale_factor` | cadena: el `name` de un registro | | Registro cuyo valor entero es un exponente de potencia de diez para este (4.4) |
| `offset` | número | `0` | Se suma después de aplicar la escala |
| `unit` | cadena | | Unidad de ingeniería (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Operaciones permitidas |
| `byte_order` | `"big"`, `"little"` | `byte_order` del archivo | Sustituye el valor por defecto del archivo para este registro (sección 6) |
| `word_order` | `"big"`, `"little"` | `word_order` del archivo | Sustituye el valor por defecto del archivo para este registro (sección 6) |
| `write_min` | número | | Menor valor que se acepta al escribir, en unidades de ingeniería (4.5) |
| `write_max` | número | | Mayor valor que se acepta al escribir, en unidades de ingeniería (4.5) |
| `enum` | cadena (un nombre de `enums`) o tabla | | Etiquetas para valores enteros o booleanos (4.1) |
| `reference` | ver 4.6 | | Valor sin procesar que este registro debe contener en un dispositivo sano |
| `firmware_min` | cadena de versión (3.2) | | El firmware más antiguo que tiene este registro |
| `firmware_max` | cadena de versión (3.2) | | El firmware más reciente que tiene este registro |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Este registro identifica el dispositivo (4.7) |
| `read_alone` | booleano | `false` | El registro se lee en una petición propia (4.9) |
| `read_group` | cadena no vacía | | El registro se lee solo junto con registros del mismo grupo (4.9) |
| `parts` | matriz de objetos | | Da nombre a los valores dentro de un registro de bloque, para que una herramienta pueda mostrarlos y editarlos uno a uno (4.10) |
| `description` | cadena | | Texto libre |
| `comment` | cadena | | Nota libre sobre el registro, para quien edita el mapa |

Valor de ingeniería = bruto × 10^`scale_factor` × `scale` + `offset` (sin `scale_factor`: bruto × `scale` + `offset`). Al escribir, una herramienta aplica la inversa y redondea al entero más próximo en los tipos enteros.

### 4.1 Tablas de traducción

Muchos registros guardan un número que representa un estado: `0` es parado, `1` es inactivo, `2` es arrancando, y así sucesivamente. `enum` convierte esos números en etiquetas. Es:

- **una tabla** escrita en el registro: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **el nombre de una tabla** en `enums`, en el primer nivel, de modo que la misma lista se escriba una sola vez para todos los registros que la usan:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Los valores se comparan con el valor **sin procesar**, antes de `scale` y `offset`. Un valor que no está en la tabla se muestra como un número simple. Las herramientas **SHOULD** ofrecer las etiquetas al escribir.

### 4.2 Valores centinela

Algunos dispositivos responden con un valor sin procesar reservado en lugar de una lectura: un valor significa «no implementado», otro «sobre el rango», otro «fallo del sensor». `sentinels` los declara para todos los registros de un tipo:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- Las claves de `sentinels` son `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Una tabla se aplica a todos los registros de ese tipo.
- Los valores **MUST** caber en el tipo y se comparan con el valor **sin procesar**, antes de `scale` y `offset`.
- Cuando una lectura coincide, las herramientas **SHOULD** mostrar la etiqueta en lugar de un número y **SHOULD NOT** tratarla como una medida (en gráficos, límites o promedios).
- Una etiqueta de `enum` para el mismo valor sin procesar tiene precedencia sobre el centinela.

### 4.3 Campos de bits

Algunos dispositivos empaquetan varios valores pequeños en un registro, por ejemplo cuatro códigos de alarma de 4 bits. Un registro `uint16` con `bit` y `bits` lee uno de ellos: valor sin procesar = (registro >> `bit`) & (2^`bits` − 1). `bit` + `bits` **MUST NOT** superar 16.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Los registros que leen campos distintos del mismo registro no se solapan. Al escribir un campo, **SHOULD** leerse el registro, cambiar solo los bits del campo y escribirlo de nuevo.

### 4.4 Factores de escala

Algunos dispositivos, en particular los inversores y contadores SunSpec, envían un registro de exponente aparte para un valor en lugar de una escala fija: el valor es bruto × 10^exponente, y el exponente puede cambiar con el rango del dispositivo. `scale_factor` nombra ese registro de exponente:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- El registro nombrado **MUST** ser un registro del mismo archivo con un tipo entero (`int16` … `uint64`) y sin `bits`, y **MUST NOT** tener él mismo un `scale_factor`. Si varios registros comparten el nombre, cuenta el primero.
- Solo los tipos numéricos pueden tener un `scale_factor` (no `bool` ni `string`).
- Una herramienta lee el registro del exponente junto con el valor, incluso cuando el usuario eligió no mostrarlo. Si el exponente no puede leerse, o es un centinela (4.2, p. ej. el `-32768` de SunSpec = no implementado), el valor no está disponible.
- Al escribir, una herramienta lee primero el exponente y aplica la inversa.

### 4.5 Límites de escritura

`write_min` y `write_max` declaran qué valores acepta un registro al escribirse, para que una herramienta pueda rechazar un valor malo antes de que llegue al dispositivo.

- Ambos son números en **unidades de ingeniería**: el valor que ve el usuario, una vez aplicados `scale_factor`, `scale` y `offset`. Un límite de `0.5` en un registro con `scale` `0.1` significa un valor sin procesar de 5.
- Cualquiera de los dos puede omitirse: un límite ausente deja ese lado abierto. Con ambos ausentes, un registro no tiene límite declarado (decide el dispositivo).
- `write_min` **MUST NOT** ser mayor que `write_max`. Los límites son inclusivos.
- Una herramienta **MUST NOT** enviar una escritura cuyo valor de ingeniería esté por debajo de `write_min` o por encima de `write_max`, y **SHOULD** decir al usuario qué límite se superó.
- Se aplican al valor que pide el usuario, antes de convertirlo en un valor sin procesar y redondearlo. Un valor dentro de los límites que aun así no cabe en el tipo del registro lo rechazan las comprobaciones normales de tipo.
- No tienen sentido para registros `bool` y `string` ni para registros que no pueden escribirse (`access` `"R"`), y allí se ignoran.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Valores de referencia

`reference` da un valor que se sabe que un dispositivo sano contiene en este registro (un número de modelo, un identificador de protocolo fijo, un código de fabricante). Una herramienta puede leer el registro y compararlo con la referencia para detectar una dirección, una base, un orden de bytes o un tipo de datos erróneos antes de que el usuario se fíe de los demás valores. No todos los dispositivos tienen un registro así, por lo que la mayoría de los registros no tienen `reference`.

- Es el valor **sin procesar**, antes de `scale_factor`, `scale` y `offset`, en el tipo JSON de ese valor: un entero (2.1) para los tipos enteros y los campos de bits, un número para `float32` y `float64`, `true` / `false` para `bool`, una cadena para `string`. **MUST** caber en el tipo (y en la anchura de un campo de bits, o `2 × length` caracteres para una cadena).
- La comprobación es el propio registro: una herramienta lee su `area` y `address` (ya ajustados según `address_base`) y decodifica su `type` con su orden de bytes y de palabras.
- Un mapa puede tener cualquier número de registros con `reference`.
- Resultado de cada comprobación: **match** (el valor sin procesar decodificado es igual a la referencia), **mismatch** (difiere), **failed** (la lectura devolvió un error o agotó el tiempo, así que no se sabe nada), **not checked** (el registro no se leyó). Una herramienta **SHOULD** informar de ellos por separado: un mismatch apunta a un mapa o unos ajustes equivocados, una lectura fallida a un problema de conexión o de direccionamiento.
- Los flotantes se comparan con la precisión del propio tipo (una referencia `float32` se compara como un flotante de 32 bits). Las cadenas se comparan tras eliminar los caracteres NUL y los espacios finales.
- Una referencia solo apoya un diagnóstico. Varios órdenes de bytes o de palabras pueden decodificar los mismos bytes con el mismo valor (un número pequeño o un palíndromo se lee igual en más de un orden), así que una coincidencia no demuestra que todo el mapa sea correcto. Los mapas **SHOULD** usar un valor distintivo y **SHOULD** dar más de uno cuando el dispositivo los tenga.
- Una `reference` en un registro que no puede leerse (`access` `"W"`) es un error.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Registros de identidad

`role` marca los registros que dicen qué dispositivo está conectado, para que una herramienta pueda comprobar el mapa con él (sección 9):

- **`"model"`**: el nombre o código de modelo del dispositivo. Su valor, o su etiqueta de `enum` cuando la tiene, se compara con `models`. Conviene dar una etiqueta a un código de modelo numérico: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: la versión del firmware. Un registro de cadena se lee como texto y se usa la primera cadena de versión que contenga (`"V2.01b"` da `2.01`). Un número da su valor de ingeniería (`102` con `scale` `0.01` da `1.02`). Cuando varios registros tienen este papel, sus valores se unen con puntos en el orden del archivo, lo que sirve para dispositivos que guardan las versiones mayor y menor por separado, por ejemplo como dos campos de bits de un registro (`"bit": 8, "bits": 8` y `"bit": 0, "bits": 8`).
- **`"serial"`**: el número de serie. Las herramientas **MAY** mostrarlo; nunca se compara.

Como máximo un registro **MAY** tener el papel `"model"` y como máximo uno `"serial"`. Un registro con papel **MUST** poder leerse. Por lo demás, los registros con papel son registros normales: se leen y se muestran como los otros, y también pueden tener una `reference`.

### 4.8 Identidad desde el dispositivo (FC17, FC43)

Algunos dispositivos informan de lo que son con una función propia y no tienen registro de identidad. `identify` dice qué función enviar y dónde está la identidad en la respuesta, para que una herramienta pueda comprobar el mapa como hace con los registros de la sección 4.7 (sección 9). Un mapa tiene como máximo un `identify`.

```json
"enums": {"type_codes": {"0x41": "DMG610", "0x57": "DMG620"}},
"identify": {
  "function": 17,
  "fields": [
    {"name": "Type", "offset": 0, "type": "uint8", "role": "model", "enum": "type_codes"},
    {"name": "Software revision", "offset": 1, "type": "uint8", "role": "firmware"},
    {"name": "Hardware revision", "offset": 2, "type": "uint8"}
  ]
}
```

```json
"identify": {
  "function": 43,
  "fields": [
    {"name": "Vendor name", "object": 0},
    {"name": "Product code", "object": 1, "role": "model"},
    {"name": "Revision", "object": 2, "role": "firmware"}
  ]
}
```

| Clave | Tipo JSON | Por defecto | Significado |
|---|---|---|---|
| `function` | `17` o `43` | | `17`: Report Slave ID. `43`: Read Device Identification (transporte de interfaz encapsulada, tipo MEI `0x0E`) |
| `fields` | matriz no vacía de objetos de campo | | Los valores que se toman de la respuesta |

Cada campo es un objeto. `name` es siempre obligatorio. `role` y las claves siguientes dependen de `function`.

| Clave | Tipo JSON | Por defecto | Significado |
|---|---|---|---|
| `name` | cadena no vacía | | Nombre que se muestra a las personas |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Significado del valor, como en los registros (4.7). Como máximo un `"model"` y un `"serial"` |
| `offset` | entero ≥ 0 | | **Solo FC17, obligatorio.** Posición del campo, en bytes, en los datos de la respuesta. El desplazamiento `0` es el primer byte tras el recuento de bytes, así que los datos son los bytes que un dispositivo enumera después de «byte count» en su manual |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Solo FC17, obligatorio.** `uint16` es big-endian. `string` es ASCII, sin los caracteres NUL ni los espacios finales |
| `length` | entero ≥ 1 | | **Solo FC17.** Longitud en bytes. Obligatorio para `string` |
| `enum` | nombre de tabla o tabla integrada | | **Solo FC17.** Traduce un número en una etiqueta (4.1). Conviene dar una etiqueta a un código de modelo, que se compara entonces con `models` |
| `object` | entero 0–255 | | **Solo FC43, obligatorio.** ID del objeto: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` definidos por el dispositivo |

- **FC43:** el valor de un objeto es una cadena ASCII, sin los caracteres NUL ni los espacios finales. Una herramienta pide el nivel de acceso (básico, normal o extendido) que incluye todos los objetos que nombran los campos y sigue el indicador «hay más» hasta tenerlos. Para `"firmware"` se usa la primera cadena de versión del texto, como en un registro de cadena (4.7).
- **Ambas funciones:** un dispositivo responde en un ID de unidad, no en una dirección de registro, por lo que `address_base` no se aplica.
- **Sin valor:** una respuesta más corta de lo que necesita un campo, una respuesta de excepción, un objeto ausente o un dispositivo que no admite la función no dan valor. La comprobación es **unknown** (sección 9), no un mismatch.
- **Varias fuentes:** `identify` y los registros con `role` pueden estar presentes a la vez. Cuando ambos dan un valor para el mismo papel, una herramienta **SHOULD** usar los registros y **MAY** usar `identify` para los papeles que ningún registro da.

### 4.9 Lectura en peticiones separadas

Un lector normalmente une los registros vecinos en una sola petición. Algunos dispositivos rechazan una petición que cruza la frontera entre dos tablas internas, aunque existan todos los registros que contiene. Dos claves opcionales limitan cómo se unen los registros:

- **`read_alone`**: `true` significa que el registro se lee en una petición que no contiene ningún otro registro. Los campos de bits y otros registros que ocupan las mismas palabras cuentan como el mismo registro.
- **`read_group`**: un nombre. Los registros con el mismo nombre **MAY** leerse en una sola petición, y una petición **MUST NOT** contener registros de grupos distintos ni un registro sin grupo. Los registros sin `read_group` se unen como antes.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Cuando están presentes las dos claves, `read_alone` prevalece. Las claves solo limitan la unión: un lector es libre de hacer más peticiones de las necesarias, y `max_read_registers` y `max_read_bits` siguen aplicándose. Afectan solo a cómo se piden los registros, no a lo que significan, así que un lector que no las conozca lee los mismos registros, unidos como siempre. Por eso no necesitan una nueva versión de `mbmap` (sección 8): en un dispositivo que rechaza la petición unida, un lector antiguo falla exactamente como lo haría sin las claves.

### 4.10 Partes de un bloque

Algunos dispositivos guardan varios valores en un bloque y solo aceptan el bloque entero: una escritura que empieza a mitad de él, o que no lo cubre, se rechaza (excepción `0x02` o `0x03`). Un caso típico es una pasarela de SMS cuyo bloque contiene el número del destinatario seguido del texto del mensaje. El mapa describe ese bloque como **un** registro, como siempre ha hecho, y `parts` dice qué hay dentro:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Clave | Tipo JSON | Por defecto | Significado |
|---|---|---|---|
| `name` | cadena no vacía | | Nombre que se muestra a las personas |
| `offset` | entero ≥ 0 | | Posición de la parte en el bloque, en **registros** desde el primer registro del registro |
| `type` | `"string"` o un tipo numérico (sección 6) | `"string"` | Cómo se lee y se escribe la parte |
| `length` | entero ≥ 1 | | Número de registros. Obligatorio para `string`, se ignora en los demás tipos |
| `description` | cadena | | Texto libre |

- `parts` es solo para un registro `string`. **MUST NOT** estar vacío. Cada parte **MUST** quedar dentro del bloque (`offset` más sus registros es como máximo el `length` del registro) y las partes **MUST NOT** solaparse. Se permiten registros que ninguna parte cubre: son relleno.
- El registro en sí mantiene su significado. Un lector que no conozca `parts` lee y escribe el bloque entero como una sola cadena, en una sola petición, exactamente como antes, de modo que ese mapa sigue funcionando en todas las herramientas.
- Una herramienta que conozca `parts` **SHOULD** mostrar cada parte como un campo propio. Para leer, decodifica cada parte del bloque con el `byte_order` y el `word_order` del registro (sección 6). Para escribir, construye el bloque **entero** a partir de las partes y lo envía en una sola petición (FC16): una parte que el usuario dejó vacía se envía como bytes a cero, de modo que un campo vacío nunca conserva por accidente un valor antiguo. Una herramienta **MUST NOT** enviar una escritura que cubra solo algunas partes, porque el dispositivo la rechaza.
- Una parte `string` es ASCII, rellenada con caracteres NUL hasta su `length`. La herramienta **MUST** rechazar un texto de más de `2 × length` caracteres. Una parte numérica se codifica como de costumbre (sección 6).
- `access` es el del registro: las partes no pueden ser más escribibles que el bloque.
- `parts` solo describe lo que hay dentro de un registro, así que no necesita una nueva versión de `mbmap` (sección 8). Los lectores que lo ignoran se comportan como antes.

## 5. Áreas y direcciones

| `area` | Unidad | Lectura | Escritura | `access` permitido |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | registro de 16 bits | FC04 | — | `R` |
| `holding` | registro de 16 bits | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Con `address_base` `0`, `address` es la dirección que se envía por el cable (0–65535). Con `address_base` `1`, la dirección en el cable es `address − 1` (1–65536), lo que coincide con los manuales que numeran los registros desde 1.

La notación «Modicon» de 5 y 6 dígitos (`40001`, `300010`) **no** es válida en `address`. Escríbela como un área más un número: `40001` pasa a ser `"area": "holding"`, `"address": 1`, con `"address_base": 1`.

## 6. Tipos, orden de bytes y orden de palabras

| `type` | Registros | Notas |
|---|---|---|
| `bool` | — | En `coil`/`discrete`: un bit. En `input`/`holding`: un bit de un registro, por lo que `bit` es obligatorio |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Los flotantes son IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 caracteres ASCII por registro. Al leer se eliminan los caracteres NUL y los espacios finales |

Dos ajustes independientes indican cómo llegan los bytes de un valor:

- **`byte_order`**, dentro de cada registro de 16 bits: `"big"` envía primero el byte alto (el estándar Modbus), `"little"` el byte bajo primero.
- **`word_order`**, entre los registros de un valor de 32 o 64 bits: `"big"` pone primero el registro más significativo (en la dirección más baja), `"little"` primero el menos significativo.

Las claves de primer nivel fijan el valor por defecto del archivo; el `byte_order` y el `word_order` de un registro lo sustituyen cada uno por su cuenta (un registro que solo fija `"word_order": "little"` conserva el orden de bytes del archivo).

| Tipo | `byte_order` | `word_order` |
|---|---|---|
| `bool` | no se usa | no se usa |
| `int16`, `uint16` | intercambia los dos bytes del registro | no se usa (un registro) |
| `int32`, `uint32`, `float32` | intercambia los dos bytes de cada registro | decide cuál de los 2 registros es la palabra alta |
| `int64`, `uint64`, `float64` | intercambia los dos bytes de cada registro | `"little"` invierte los 4 registros en conjunto |
| `string` | `"big"`: el primer byte recibido es el primer carácter; `"little"`: el segundo byte recibido es el primer carácter | no se usa (los registros se leen en orden de dirección) |

En los valores de 64 bits, el orden de palabras little invierte toda la secuencia de cuatro registros; no intercambia por separado dos mitades de 32 bits.

Orden en el cable del valor de 32 bits `0x0A0B0C0D`:

| `byte_order` | `word_order` | Bytes en el cable | Nombre habitual |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Estándar Modbus |
| `big` | `little` | `0C 0D 0A 0B` | «intercambio de palabras», usado por muchos contadores y PLC |
| `little` | `big` | `0B 0A 0D 0C` | «intercambio de bytes» (raro) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Validación

Los lectores **SHOULD** informar de cada problema con uno de los códigos siguientes y un [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) al valor (`/registers/3/address`, `/enums/relay`), para que las herramientas coincidan en lo que está mal. Los problemas que afectan a todo el archivo no llevan puntero. Un **error** invalida el archivo. Una **advertencia** se comunica, pero el archivo sigue siendo utilizable.

| Código | Gravedad | Cuándo |
|---|---|---|
| `not-utf8` | error | El archivo no es UTF-8 válido |
| `not-json` | error | El archivo no es un único objeto JSON válido, o repite una clave en un objeto. Se comunica para todo el archivo: los analizadores sitúan los errores de sintaxis en posiciones distintas, así que la posición va en el mensaje |
| `bad-json-type` | error | Una clave conocida tiene el tipo JSON equivocado (una cadena donde se espera un número, `null`, …) |
| `missing-key` | error | Falta `mbmap`, `vendor`, `model` o `registers` (para todo el archivo), o un registro carece de `name`, `area`, `address` o `type`, o lo tiene vacío (en el registro) |
| `bad-meta-value` | error | Una clave de primer nivel tiene un valor fuera de su conjunto o rango permitido, incluido un `mbmap` distinto de `2` |
| `bad-area` | error | `area` desconocida, o no escrita en minúsculas |
| `bad-type` | error | `type` desconocido, o no escrito en minúsculas |
| `type-area` | error | Un tipo distinto de `bool` en `coil` o `discrete` |
| `bad-address` | error | `address` no es un entero |
| `address-range` | error | La dirección está por debajo de `address_base`, o el valor supera la dirección 65535 |
| `missing-bit` | error | `bool` en `input`/`holding` sin `bit` |
| `bad-bit` | error | `bit` fuera de `0`–`15` |
| `missing-length` | error | `string` sin `length` |
| `bad-length` | error | `length` no es un entero ≥ 1 |
| `bad-access` | error | `access` desconocido (o no escrito en mayúsculas), o no permitido para el `area` |
| `bad-byte-order` | error | El `byte_order` o el `word_order` de un registro no es `"big"` ni `"little"` |
| `bad-enum` | error | Una tabla enum (2.2) tiene una clave que no es un entero, una etiqueta vacía, un valor repetido o ninguna entrada, o un nombre de `enums` no es `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` nombra un tipo no admitido, o una tabla no es válida (2.2) o tiene un valor que no cabe en el tipo |
| `bad-bits` | error | `bits` no es un entero de 1 a 16, se usa en un tipo que no es `uint16` o fuera de `input`/`holding`, no tiene `bit`, o `bit` + `bits` supera 16 |
| `unknown-enum` | error | `enum` nombra una tabla que `enums` no define |
| `bad-write-limit` | error | `write_min` es mayor que `write_max` |
| `bad-reference` | error | `reference` no es un valor sin procesar válido para el `type` del registro (no es un entero, está fuera del rango del tipo, es más ancho que el campo de bits, no es un booleano para `bool`, no es un número finito para flotantes, es más largo que la cadena), o está definido en un registro que no puede leerse |
| `unknown-scale-factor` | error | `scale_factor` no nombra ningún registro del archivo (los registros con errores no cuentan) |
| `bad-scale-factor` | error | `scale_factor` está definido en un `bool` o `string`, o nombra un registro que no es un entero completo (un flotante, `bool`, `string` o campo de bits) o que tiene él mismo un `scale_factor` |
| `bad-version` | error | `firmware_min` o `firmware_max`, en el archivo o en un registro, no es una cadena de versión (3.2) |
| `bad-firmware-range` | error | `firmware_min` es posterior a `firmware_max`, en el archivo o en un registro |
| `bad-source` | error | Un elemento de `sources` no es un objeto con un `title` no vacío, o tiene un `version`, `date`, `url`, `note`, `accessed` o `sha256` de forma incorrecta |
| `bad-role` | error | `role` no es `"model"`, `"firmware"` ni `"serial"`, está definido en un registro que no puede leerse, o `"model"` o `"serial"` se usa más de una vez |
| `bad-identify` | error | `identify` no es válido (4.8): `function` no es `17` ni `43`, `fields` está vacío, o un campo carece de `name`, tiene un `role` desconocido o repetido para `"model"` o `"serial"`, o incumple las reglas de su función (FC17: `offset` ausente o negativo, `type` ausente o desconocido, `string` sin `length`, un `enum` que no nombra ninguna tabla o no es una tabla válida, un `object`; FC43: `object` ausente o fuera de 0–255, un `offset`, `type`, `length` o `enum`) |
| `bad-parts` | error | `parts` está vacío, está definido en un registro que no es una `string` con un `length` válido, o tiene una parte sin `name` o `offset`, con un `offset` negativo, un `type` desconocido o `bool`, una parte `string` sin `length`, una parte que sobrepasa el bloque, o partes que se solapan (4.10) |
| `no-rows` | warning | `registers` está vacío |
| `duplicate-name` | warning | Un `name` lo usan más de una vez registros cuyos rangos de firmware se solapan (3.2) |
| `model-list` | warning | `model` enumera dispositivos separados por « / »; da el nombre de la familia y enumera los dispositivos en `models` (3.2) |
| `overlap` | warning | Un valor empieza dentro de los registros de otro valor en la misma área, lo que normalmente significa una dirección o un tipo erróneos. Los registros que empiezan en la misma dirección son lecturas alternativas de los mismos datos (por ejemplo un código leído como número y como texto) y nunca cuentan como solapamiento; tampoco los bits y campos de bits de un registro (`bool` + `bit`, `uint16` + `bit` + `bits`), ni los registros cuyos rangos de firmware no se solapan |
| `firmware-outside-map` | warning | El rango de firmware de un registro no tiene ninguna versión en común con el del archivo, por lo que nunca se aplica |
| `bad-read` | error | `read_group` es una cadena vacía |
| `unknown-key` | warning | Un registro tiene una clave que no está en esta especificación y no empieza por `x_` |
| `unused-write-limit` | warning | `write_min` o `write_max` está definido en un registro donde no tiene efecto (`bool`, `string`, o `access` `"R"`) |
| `unused-bit` | warning | `bit` está definido en un registro donde no tiene efecto (cualquier tipo salvo `bool`, a menos que `bits` también esté definido en un `uint16`) |

Un registro con un error en `name`, `area`, `address` o `type` no se comprueba más. Un registro con cualquier error queda fuera de la comprobación de `overlap`.

El [JSON Schema](schema/mbmap-2.schema.json) comprueba la estructura, los tipos JSON y los rangos de valores; las reglas que relacionan varios valores (`unknown-enum`, factores de escala, `overlap`, `address-range`, `bad-reference` por tipo, claves duplicadas) necesitan código. La carpeta [`tests/`](tests/) contiene archivos de ejemplo con los diagnósticos que debe producir cada uno, de modo que cualquier implementación pueda comprobarse con ellos.

## 8. Compatibilidad y versiones

- Los lectores **MUST** ignorar las claves que no conocen, en el primer nivel y en los registros. Esto permite que archivos más nuevos se abran en lectores más antiguos.
- Las claves específicas de un fabricante o de una herramienta **SHOULD** empezar por `x_` (`"x_modbench_icon"`, `"x_alarm_high"`) para no chocar nunca con futuras versiones de esta especificación. Sus valores **MAY** ser de cualquier tipo JSON.
- `mbmap` es la versión **mayor**. Un lector **MUST** rechazar un archivo cuyo `mbmap` no admite y **SHOULD** decir qué versión encontró.
- Las nuevas claves opcionales que los lectores más antiguos pueden ignorar sin riesgo se añaden sin cambiar `mbmap`. Una clave cuyo significado un lector antiguo interpretaría mal si la ignorase requiere una nueva versión mayor.
- El archivo de schema lleva el nombre de la versión mayor (`mbmap-2.schema.json`) y dentro de ella solo gana claves opcionales.

## 9. Comprobar un mapa con el dispositivo conectado

Una herramienta que lee los registros de identidad (4.7), o la respuesta de identidad descrita por `identify` (4.8), del dispositivo conectado **SHOULD** compararlos con el mapa, para que el usuario no se fíe de valores de un mapa escrito para otro modelo o firmware. También puede dejar que el usuario indique a mano el modelo o el firmware cuando el dispositivo no los comunica.

Cada comprobación tiene uno de tres resultados:

| Resultado | Modelo | Firmware |
|---|---|---|
| **match** | El modelo del dispositivo, comparado sin distinguir mayúsculas y sin espacios alrededor, es uno de `models` (o `model`) | La versión del dispositivo está dentro de `firmware_min` … `firmware_max` |
| **mismatch** | No lo es | Está fuera del rango |
| **unknown** | El mapa no tiene registro `"model"`, no pudo leerse, o no dio valor | El mapa no tiene registro `"firmware"`, no pudo leerse, no se encontró en él ninguna cadena de versión, o el mapa no declara rango |

Qué hace una herramienta con cada uno:

- **match**: nada que comunicar; la herramienta **MAY** mostrar que se reconoció el dispositivo.
- **mismatch**: la herramienta **SHOULD** avisar con claridad, indicando lo que espera el mapa y lo que comunicó el dispositivo, y **SHOULD** pedir confirmación antes de la primera escritura en el dispositivo. **MUST NOT** dejar de leer por ello: leer es inofensivo, y el usuario puede saber más (un dispositivo de otra marca, un firmware más reciente que conservó los mismos registros).
- **unknown**: no es un problema. La mayoría de los dispositivos no comunican modelo ni firmware, y la mayoría de los mapas se aplican a todo el firmware. La herramienta **MUST NOT** tratarlo como un mismatch y **MAY** mencionar que el mapa declara un rango de firmware que no pudo comprobarse.

Registros con su propio rango de firmware (3.2):

- Cuando el firmware es **conocido**, una herramienta **SHOULD** usar solo los registros cuyo rango lo incluye: los demás no existen en este dispositivo, y un nombre de registro compartido por varios rangos de firmware significa entonces un único registro.
- Cuando el firmware es **desconocido**, una herramienta **SHOULD** leer todos los registros, **SHOULD** mostrar cuáles dependen del firmware (por ejemplo «firmware 2.1 y posterior») y **MAY** dejar que el usuario elija la versión.

Un mapa sin `models`, `firmware_min`, `firmware_max` ni registros de identidad no se comprueba con nada, lo cual es correcto para un mapa que se aplica a todos los dispositivos de su modelo.

## 10. Archivos antiguos

La versión 1 del formato, basada en CSV, está obsoleta. Los nuevos lectores no necesitan admitirla; los archivos en ese formato pueden convertirse con [`tools/migrate/migrate.py`](tools/migrate/migrate.py) (consulta [legacy/v1](legacy/v1/)).
