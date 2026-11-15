# Tempos limite Modbus: o dispositivo não responde

Um tempo limite significa que não voltou nada que a sua ferramenta pudesse aceitar. Percorra a lista de baixo para cima na pilha.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Cablagem.** A e B (ou D+ e D−, ou + e −) não são nomeados da mesma forma por todos os fabricantes. Se nada responde, troque os dois fios: não faz mal.
2. **Massa comum.** Ligue a massa de sinal (GND, C, 0 V) quando o dispositivo a tiver; cabos compridos sem ela dão erros que vão e vêm.
3. **Terminação.** Ponha uma resistência de 120 Ω nos dois extremos do barramento, não em cada dispositivo. Cabos curtos de bancada costumam funcionar sem ela.
4. **Definições série.** O baud rate, os bits de dados, a paridade e os bits de paragem têm de coincidir exatamente. Uma definição de fábrica comum é 9600 ou 19200 baud, 8 bits de dados, paridade par ou nenhuma. Uma paridade diferente é silenciosa.
5. **ID da unidade.** Cada dispositivo no barramento precisa do seu próprio endereço, de 1 a 247. Um dispositivo configurado como 1 não responde a pedidos para o 2. Veja [ID da unidade](modbus-unit-id-slave-id).
6. **Um só mestre.** Dois mestres no mesmo barramento (um PLC e um portátil) colidem.
7. **Sentido do conversor.** Os conversores USB–RS-485 baratos por vezes mudam de sentido demasiado devagar a baud rates altos. Experimente uma velocidade mais baixa.

## Modbus TCP

1. **Chegue primeiro ao dispositivo.** Faça `ping` e verifique que a porta 502 está aberta.
2. **Limite de ligações.** Muitos dispositivos aceitam só algumas ligações TCP. Uma ferramenta que deixa ligações abertas pode bloquear as outras até o dispositivo as fechar por tempo limite.
3. **ID da unidade através de gateways.** Atrás de um gateway TCP para RTU o ID da unidade escolhe o dispositivo série e tem de coincidir com o seu endereço; alguns gateways usam 0 ou 255 para si próprios.
4. **Modbus TCP ativo?** Alguns dispositivos saem de fábrica com ele desligado, ou respondem só noutra porta.

## O dispositivo responde a alguns pedidos mas não a outros

- Os pedidos demasiado grandes, ou que cobrem lacunas na tabela de registos, podem ser respondidos com uma exceção ou ignorados. Leia blocos mais pequenos.
- Alguns dispositivos precisam de uma pausa entre pedidos (3,5 tempos de caráter em RTU, mais em dispositivos lentos). Aumente o intervalo de consulta.
- Alguns só respondem após um atraso de dezenas ou centenas de milissegundos; aumente primeiro o tempo limite de resposta.
