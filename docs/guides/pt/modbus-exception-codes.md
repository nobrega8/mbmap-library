# Códigos de exceção Modbus: o que o dispositivo lhe está a dizer

Quando um dispositivo Modbus percebe um pedido mas não o consegue executar, responde com uma exceção: o código de função com o bit mais alto ligado (`0x83` para uma leitura falhada de registos de retenção) e um código de um byte.

| Código | Nome | Causa habitual | O que tentar |
|---|---|---|---|
| 01 | Illegal function | O dispositivo não suporta este código de função: ler registos de entrada (04) num dispositivo só com registos de retenção, ou escrever com 16 num dispositivo que só aceita 06 | Use o código de função que o manual indica para essa tabela |
| 02 | Illegal data address | O endereço não existe, ou o bloco pedido atravessa uma lacuna | Verifique o [deslocamento do endereço](modbus-address-off-by-one); leia menos registos de cada vez |
| 03 | Illegal data value | A quantidade é demasiado grande (mais de 125 registos) ou um valor escrito está fora do intervalo | Leia blocos mais pequenos; verifique o intervalo permitido antes de escrever |
| 04 | Server device failure | O dispositivo falhou ao fazê-lo; alguns usam-no para qualquer escrita recusada ou para a leitura de um bloco que não permitem | Leia um registo de cada vez; verifique o estado do dispositivo |
| 05 | Acknowledge | Aceite, mas vai demorar (programação, gravação) | Espere e depois consulte |
| 06 | Server device busy | O dispositivo está ocupado | Tente mais tarde |
| 0A | Gateway path unavailable | Um gateway não conseguiu chegar ao dispositivo que está atrás dele | Verifique o lado série do gateway e o seu encaminhamento |
| 0B | Gateway target failed to respond | O gateway reencaminhou o pedido mas o dispositivo não respondeu | Verifique o ID da unidade, o baud rate e a cablagem atrás do gateway |

<mb-exceptions></mb-exceptions>

## Nenhuma resposta não é uma exceção

Um dispositivo que recebe uma trama com CRC errado, ID de unidade errado ou erro de paridade fica em silêncio: obtém-se um tempo limite, não uma exceção. Veja [tempos limite](modbus-timeout-no-response).

## Blocos que atravessam lacunas

Muitos dispositivos recusam uma leitura que cubra qualquer endereço não utilizado, mesmo quando todos os registos de que precisa existem. Se ler 20 registos falha com 02 mas lê-los um a um funciona, parta o pedido nas lacunas. Os mapas podem dizer quantos registos um dispositivo aceita por pedido (`max_read_registers`).
