# ID da unidade Modbus (ID de escravo): que dispositivo responde

Cada pedido Modbus leva um ID da unidade de um byte, também chamado ID de escravo, endereço de escravo ou endereço do dispositivo.

## Em RS-485 (Modbus RTU)

- Cada dispositivo no barramento tem o seu próprio endereço, de 1 a 247, definido no visor, com interruptores DIP ou no software de configuração.
- O endereço 0 é difusão (broadcast): todos os dispositivos atuam numa escrita e nenhum responde. As leituras para 0 não têm resposta.
- Um dispositivo configurado com outro endereço ignora completamente o pedido, por isso um ID da unidade errado parece um dispositivo morto: obtém-se um [tempo limite](modbus-timeout-no-response), não um erro.

## Em Modbus TCP

- Um dispositivo a que se chega diretamente por IP costuma ignorar o ID da unidade ou esperar 1. Alguns esperam 0 ou 255, e poucos recusam tudo menos o valor configurado.
- Atrás de um gateway TCP para RTU o ID da unidade seleciona o dispositivo série: tem de coincidir com o endereço RS-485 desse dispositivo. O próprio gateway responde muitas vezes em 0, 255 ou num ID configurado.
- Alguns dispositivos com várias partes internas (um inversor com um contador e uma bateria) respondem com IDs de unidade diferentes para cada parte.

<mb-gateway></mb-gateway>

## Encontrar um endereço desconhecido

- Leia-o no visor ou na etiqueta do dispositivo.
- Faça uma pesquisa: envie a leitura de um registo comum a cada endereço de 1 a 247 ao baud rate do dispositivo e anote qual responde. Faça-o só com esse dispositivo ligado.
- Reponha os valores de fábrica; o manual indica o valor por omissão (muitas vezes 1).

## Como os mapas MBMap o registam

Um mapa indica o `unit_id` por omissão do dispositivo (e as definições série e a porta TCP). O valor por omissão é só um ponto de partida: os dispositivos costumam ser reconfigurados na instalação.
