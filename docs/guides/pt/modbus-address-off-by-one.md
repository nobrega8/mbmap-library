# Endereços Modbus: porque é que a leitura está um registo ao lado

Lê o registo 40001 e obtém o valor que o manual indica para o 40002, ou o dispositivo responde *illegal data address* para um registo que consta da tabela. Quase sempre a causa é a mesma: o manual e a sua ferramenta contam os registos de forma diferente.

## Três formas de escrever o mesmo registo

| O que o manual imprime | O que significa | O que vai no fio |
|---|---|---|
| `40001` (referência Modicon) | registo de retenção número 1, contado a partir de 1, com `4` como prefixo da área | endereço `0` |
| `1` (número do registo) | registo de retenção 1, contado a partir de 1 | endereço `0` |
| `0` ou `0x0000` (deslocamento) | o próprio endereço | endereço `0` |

Uma trama Modbus leva sempre um endereço de 0 a 65535. Os prefixos `4` (retenção), `3` (entrada), `1` (entrada discreta) e `0` (bobina) não são enviados: a área é escolhida pelo código de função (03 para retenção, 04 para entrada, 02 para entradas discretas, 01 para bobinas). O número que sobra costuma ser contado a partir de 1, por isso o endereço no fio é esse número **menos um**.

As referências de seis dígitos, como `400001` ou `300013`, funcionam da mesma maneira: tire o primeiro dígito e subtraia um (`300013` → registo de entrada `12`).

<mb-address></mb-address>

## Como saber qual usa o seu manual

- **Os endereços hexadecimais** (`0x0BB7`, `1004h`) são quase sempre o endereço no fio.
- **Um primeiro registo 40001 ou 30001** significa referências Modicon: subtraia 40001 ou 30001.
- **Um primeiro registo 1** costuma significar números a partir de 1; um primeiro registo 0 significa endereços no fio.
- **Procure um exemplo resolvido.** Muitos manuais mostram uma trama de pedido (“ler o registo 40011: 01 03 00 0A 00 01 …”). Os dois bytes a seguir ao código de função são o endereço no fio e resolvem a dúvida.
- **Alguns manuais misturam as duas coisas**, por exemplo uma coluna decimal “registo” que é uma unidade acima da coluna hexadecimal “endereço” ao lado. Confie na coluna hexadecimal e nas tramas de exemplo.

## O que a sua ferramenta espera

As ferramentas também diferem. Umas pedem o endereço no fio, outras um número de registo a partir de 1, e outras aceitam uma referência Modicon e retiram o prefixo. Se um valor estiver deslocado exatamente um registo (um valor de 32 bits parece lixo, ou cada valor parece pertencer ao vizinho), experimente o endereço uma unidade abaixo ou acima.

## Como os mapas MBMap o registam

Cada ficheiro `.mbmap.json` diz que convenção usam os seus endereços com `address_base`: `0` significa que os endereços são os do fio, `1` que são a partir de 1 e que o endereço no fio é um a menos. As páginas dos dispositivos neste site, a exportação CSV e a exportação para o Home Assistant mostram o endereço no fio junto ao endereço tal como está escrito no mapa, para nunca ter de adivinhar.
