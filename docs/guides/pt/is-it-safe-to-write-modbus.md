# É seguro escrever num dispositivo Modbus?

Ler um registo é inofensivo. Escrever num registo altera o dispositivo, por vezes de formas difíceis de desfazer.

## O que pode correr mal

- **Registo errado.** Um [endereço deslocado de um](modbus-address-off-by-one) escreve o seu valor na definição vizinha: uma relação de TC, um limite de proteção, uma velocidade de transmissão.
- **Definições de comunicação.** Escrever o ID da unidade, o baud rate ou a paridade corta-lhe a ligação até voltar a ligar com os novos valores.
- **Desgaste da memória.** Muitos dispositivos guardam as definições em flash ou EEPROM, com um número limitado de escritas. Escrever um valor de referência todos os segundos pode gastá-la em meses. Alguns dispositivos oferecem um endereço só em RAM para escritas frequentes.
- **Os comandos atuam de imediato.** Arrancar/parar, abrir/fechar um disjuntor, repor contadores de energia e repor valores de fábrica acontecem na escrita, sem confirmação.
- **Valores meio escritos.** Escrever os dois registos de um valor de 32 bits em pedidos separados pode deixar por um instante um valor misto, ou ser recusado.

<mb-flow name="write"></mb-flow>

## Antes de escrever

1. Confira o mapa com o documento do fabricante e prefira mapas marcados como *verificado* ou *oficial*.
2. Leia primeiro o registo e confirme que tem o que espera.
3. Verifique o intervalo permitido; muitos dispositivos limitam ou rejeitam valores fora dele.
4. Escreva os valores de vários registos num só pedido (função 16).
5. Saiba como repor o valor anterior.
6. Em equipamento que controla energia ou maquinaria, teste-o isolado.

## Como os mapas MBMap ajudam

Os registos têm um `access` (`R`, `W`, `RW`), e os que se podem escrever podem levar `write_min` e `write_max`. Cada mapa tem um estado que diz se foi testado num dispositivo, tirado do documento do fabricante, ou ainda não verificado. As ferramentas devem avisar antes de escrever num dispositivo cujo modelo não corresponde ao do mapa.
