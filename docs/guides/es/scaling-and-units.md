# Escalado y unidades: cuando el valor está diez o mil veces mal

El registro se lee en el orden correcto y aun así la tensión es 2301 en vez de 230,1, o la corriente es 4560 en vez de 4,56 A. La mayoría de los contadores envían enteros y esperan que apliques una escala fija.

## Escala fija

Los manuales escriben la escala de varias formas que significan lo mismo:

| El manual dice | Significado | Valor leído 2301 |
|---|---|---|
| «resolution 0.1 V», «× 0.1», «unit 0.1 V» | multiplicar por 0,1 | 230,1 V |
| «Value weight: Volt × 10», «÷ 10» | dividir entre 10 | 230,1 V |
| «1 decimal», «format XXX.X» | dividir entre 10 | 230,1 V |
| «mA», «mV», «Wh» como unidad | el entero ya está en esa unidad | 2301 mV |

Fíjate también en la unidad, no solo en el factor: un contador de energía en Wh y otro en kWh × 0,01 difieren en un factor diez.

## Escala fijada por la configuración

Algunos dispositivos cambian la escala con un ajuste: el número de decimales que muestra la pantalla, la relación del TC o el rango de tensión. El manual da entonces una tabla («si el registro 40018 vale 2, divide entre 100»). Lee primero ese ajuste.

<mb-scaling></mb-scaling>

## Registros de factor de escala (SunSpec y otros)

Los inversores y contadores SunSpec envían cada valor con un registro de *factor de escala* aparte, una potencia de diez con signo. El valor es `registro × 10^factor_de_escala`: una potencia de 4523 con un factor de escala de −1 son 452,3 W. El factor de escala puede cambiar mientras el dispositivo funciona, así que léelo junto con el valor, en la misma petición.

## Flotantes

Los valores enviados como flotantes de 32 bits (IEEE 754) no necesitan escala; ya están en unidades de ingeniería. Si un flotante parece absurdo, revisa el [orden de palabras](byte-and-word-order) antes que la escala.

## Cómo lo registran los mapas MBMap

Un registro puede llevar `scale` (el multiplicador), un `offset` opcional, una `unit`, o un `scale_factor` que nombra el registro que contiene la potencia de diez. Las páginas de dispositivo y las exportaciones los aplican, de modo que el número que configuras es el del manual.
