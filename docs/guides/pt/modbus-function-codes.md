# Códigos de função Modbus e áreas de registos

Cada pedido Modbus indica um código de função. Ele decide tanto a ação como a área do dispositivo sobre a qual atua.

| Código | Nome | Área | Tamanho |
|---|---|---|---|
| 01 | Read Coils | bobinas (0x) | bits, leitura/escrita |
| 02 | Read Discrete Inputs | entradas discretas (1x) | bits, só leitura |
| 03 | Read Holding Registers | registos de retenção (4x) | 16 bits, leitura/escrita |
| 04 | Read Input Registers | registos de entrada (3x) | 16 bits, só leitura |
| 05 | Write Single Coil | bobinas | escreva `0xFF00` para ligado, `0x0000` para desligado |
| 06 | Write Single Register | registos de retenção | um registo |
| 15 (0x0F) | Write Multiple Coils | bobinas | vários bits |
| 16 (0x10) | Write Multiple Registers | registos de retenção | vários registos |
| 17 (0x11) | Report Server ID | — | identidade do dispositivo, formato definido pelo dispositivo |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | fabricante, código do produto, revisão em texto |

## Retenção ou entrada?

A tabela do manual ou o prefixo do endereço dizem-lhe: `3xxxx` lê-se com 04, `4xxxx` com 03. Alguns dispositivos respondem às duas funções com os mesmos dados; outros recusam a errada com a exceção 01 (illegal function). Se o manual não der prefixo nem função, experimente primeiro 03.

## Escrita

- Um valor de 32 bits precisa de dois registos escritos juntos com 16; escrever as metades uma a uma com 06 pode deixar o dispositivo com um valor misto, ou ser recusado.
- Alguns dispositivos só aceitam 06, outros só 16. A lista de funções suportadas do manual resolve a questão.
- As bobinas escritas com 05 têm de levar exatamente `0xFF00` ou `0x0000`.

## Como os mapas MBMap o registam

Cada registo tem uma `area` (`coil`, `discrete`, `input`, `holding`) e um `access` (`R`, `W`, `RW`); uma ferramenta escolhe a função a partir deles. Os mapas também podem descrever as funções de identidade 17 e 43, para uma ferramenta poder verificar com que dispositivo está a falar.
