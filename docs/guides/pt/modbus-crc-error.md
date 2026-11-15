# Erros de CRC Modbus em RS-485

Um erro de CRC significa que chegou uma trama, mas o seu checksum não coincidiu: bytes foram alterados ou perdidos pelo caminho. Ao contrário de um endereço errado, aponta para a ligação física ou para a temporização.

## Causas comuns

- **Ruído.** Cabo sem blindagem junto a cabos de potência ou variadores. Use par entrançado blindado, com a blindagem ligada à terra só numa ponta.
- **Terminação em falta ou a mais.** Uma resistência de 120 Ω em cada extremo do barramento; nenhuma pelo meio.
- **Sem polarização (bias).** Um barramento inativo sem resistências de polarização flutua e os primeiros bytes de uma trama podem ser lidos mal. Muitos conversores e mestres têm uma opção de polarização.
- **Derivações e cablagem em estrela.** O RS-485 quer uma só linha de dispositivo para dispositivo, não ramos.
- **Baud rate ligeiramente desviado** em conversores baratos ou a velocidades altas. Experimente um baud rate mais baixo.
- **Tramas a fundirem-se.** Se o mestre envia o pedido seguinte antes de o barramento estar silencioso durante 3,5 tempos de caráter, os dispositivos veem uma trama longa e partida. Aumente o intervalo entre pedidos.
- **Dois mestres**, ou um dispositivo a responder no mesmo endereço que outro.

<mb-crc></mb-crc>

## Passos

1. Baixe o baud rate e veja se os erros param.
2. Teste com um dispositivo e um cabo curto. Se isso funcionar, o problema é o barramento, não o dispositivo.
3. Verifique a terminação com a alimentação desligada: a resistência entre A e B deve rondar os 60 Ω com os dois terminadores colocados.
4. Acrescente polarização se o mestre ou o conversor a oferecer.
5. Aumente o intervalo de consulta e o tempo limite.

Um erro de CRC ocasional num barramento industrial comprido é normal; uma ferramenta deve tentar de novo. Erros na maioria das tramas, não.
