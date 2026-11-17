# Errores de CRC Modbus en RS-485

Un error de CRC significa que llegó una trama pero su suma de verificación no coincidió: se alteraron o perdieron bytes por el camino. A diferencia de una dirección equivocada, apunta al enlace físico o a la temporización.

## Causas habituales

- **Ruido.** Cable sin apantallar tendido junto a cables de potencia o variadores. Usa par trenzado apantallado, con la pantalla a tierra solo por un extremo.
- **Terminación ausente o de más.** Una resistencia de 120 Ω en cada extremo del bus; ninguna en medio.
- **Sin polarización (bias).** Un bus inactivo sin resistencias de polarización queda flotante, y los primeros bytes de una trama pueden leerse mal. Muchos conversores y maestros tienen una opción de polarización.
- **Derivaciones y cableado en estrella.** RS-485 quiere una única línea de dispositivo a dispositivo, no ramas.
- **Velocidad ligeramente desajustada** en conversores baratos o a velocidades altas. Prueba con una velocidad menor.
- **Tramas que se funden.** Si el maestro envía la petición siguiente antes de que el bus haya estado en silencio 3,5 tiempos de carácter, los dispositivos ven una trama larga y rota. Aumenta el retardo entre peticiones.
- **Dos maestros**, o un dispositivo que responde en la misma dirección que otro.

<mb-crc></mb-crc>

## Pasos

1. Baja la velocidad y mira si cesan los errores.
2. Prueba con un solo dispositivo y un cable corto. Si funciona, el problema es el bus, no el dispositivo.
3. Comprueba la terminación con la alimentación apagada: la resistencia entre A y B debe ser de unos 60 Ω con ambos terminadores puestos.
4. Añade polarización si el maestro o el conversor la ofrecen.
5. Aumenta el intervalo de sondeo y el tiempo de espera.

Un error de CRC ocasional en un bus industrial largo es normal; una herramienta debería reintentar. Errores en la mayoría de las tramas, no.
