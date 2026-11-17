# Cómo encontrar el mapa de registros Modbus de un dispositivo

El mapa de registros (llamado también tabla Modbus, lista de puntos, mapa de memoria o protocolo de comunicación) rara vez está en la hoja de instalación. Dónde buscar:

1. **Busca en esta biblioteca** por modelo, código de modelo o alias. Cada mapa enlaza con el documento a partir del cual se escribió.
2. **El área de descargas del fabricante.** Busca «communication protocol», «Modbus protocol», «Modbus register map», «Modbus table» o «point map» con el nombre del modelo. Suele ser un PDF aparte del manual de usuario.
3. **El manual de usuario completo.** Muchos manuales llevan la tabla en un capítulo cerca del final («Communication», «Modbus», «Appendix B»).
4. **El software de configuración.** Algunos fabricantes incluyen el mapa dentro de su software o como un archivo de Excel a su lado.
5. **El documento de la familia.** Un modelo suele compartir su mapa con su familia («EM24 DIN», «serie PM5000»). Comprueba que el manual de la familia cubre tu variante.
6. **Pregunta al soporte del fabricante.** Algunos mapas solo se envían a petición, a veces bajo NDA; comprueba si puedes compartirlo antes de publicar un mapa hecho a partir de él.
7. **Integraciones de otros proyectos.** Las configuraciones de Home Assistant, openHAB, Node-RED y EVCC suelen contener listas de registros que funcionan, pero contrástalas con el manual.

<mb-flow name="find"></mb-flow>

## Qué leer en él

- La **convención de direccionamiento** (dirección del cable, desde 1 o Modicon). Consulta las [direcciones](modbus-address-off-by-one).
- Los **tipos de datos**, el **orden de palabras** y la **escala** de cada valor. Consulta el [orden de bytes y de palabras](byte-and-word-order) y el [escalado](scaling-and-units).
- Los **códigos de función admitidos** y el mayor número de registros por petición.
- Los **ajustes serie por defecto** y el ID de unidad.

## ¿No está en esta biblioteca?

[Solicita un mapa](https://github.com/nobrega8/mbmap-library/issues/new/choose) con un enlace al documento, o escribe uno tú mismo: el formato es JSON sin más y la [especificación](/spec) explica cada clave.
