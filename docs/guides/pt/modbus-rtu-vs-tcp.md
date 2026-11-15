# Modbus RTU, Modbus TCP e RS-485

Três nomes que muitas vezes se confundem.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Meio | linha série, quase sempre RS-485 (por vezes RS-232) | Ethernet ou Wi-Fi |
| Endereçamento | ID da unidade 1–247 no barramento | endereço IP e porta (502), mais um ID da unidade |
| Verificação de erros | CRC-16 em cada trama | as verificações próprias do TCP; sem CRC |
| Enquadramento | silêncio de 3,5 carateres entre tramas | cabeçalho de 7 bytes (MBAP) com um comprimento |
| Dispositivos por ligação | até 32 cargas de unidade por segmento (mais com transcetores de baixa carga), um mestre | vários clientes por dispositivo, limitados pelo dispositivo |
| Velocidade típica | 9600–115200 baud | 10/100 Mbit/s, limitada pelo dispositivo |

O **RS-485** é apenas a camada elétrica: dois fios, um sinal diferencial, um barramento. O Modbus RTU corre sobre ele, tal como outros protocolos (BACnet MS/TP, DMX, M-Bus através de adaptadores RS-485).

O **Modbus ASCII** envia os mesmos pedidos como texto hexadecimal legível; hoje é raro.

<mb-adu></mb-adu>

## Os mesmos registos

O mapa de registos é o mesmo seja qual for o transporte: um dispositivo que ofereça os dois responde com os mesmos endereços, tipos e escalas. O que muda é a forma de lá chegar: definições série e ID da unidade no RTU, endereço IP e porta no TCP.

## Gateways

Um gateway Modbus TCP para RTU permite que ferramentas Ethernet cheguem a dispositivos série. O ID da unidade do pedido TCP escolhe o dispositivo do lado série. Os gateways acrescentam os seus próprios tempos limite; se um dispositivo atrás de um não responder, verifique primeiro as definições série do gateway.

## Como os mapas MBMap o registam

Um mapa diz que transportes o dispositivo oferece (`protocol`: `rtu`, `tcp` ou ambos) e os respetivos valores por omissão (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
