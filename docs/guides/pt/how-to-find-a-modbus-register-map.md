# Como encontrar o mapa de registos Modbus de um dispositivo

O mapa de registos (também chamado tabela Modbus, lista de pontos, mapa de memória ou protocolo de comunicação) raramente vem na ficha de instalação. Onde procurar:

1. **Pesquise nesta biblioteca** por modelo, código do modelo ou alias. Cada mapa liga ao documento a partir do qual foi escrito.
2. **A área de transferências do fabricante.** Procure “communication protocol”, “Modbus protocol”, “Modbus register map”, “Modbus table” ou “point map” com o nome do modelo. É muitas vezes um PDF separado do manual do utilizador.
3. **O manual do utilizador completo.** Muitos manuais têm a tabela num capítulo perto do fim (“Comunicação”, “Modbus”, “Apêndice B”).
4. **O software de configuração.** Alguns fabricantes incluem o mapa no software ou num ficheiro Excel ao lado.
5. **O documento da família.** Um modelo partilha muitas vezes o mapa com a sua família (“EM24 DIN”, “série PM5000”). Confirme que o manual da família cobre a sua variante.
6. **Peça ao apoio do fabricante.** Alguns mapas só são enviados a pedido, por vezes sob NDA; veja se pode partilhá-lo antes de publicar um mapa feito a partir dele.
7. **Integrações de outros projetos.** As configurações do Home Assistant, openHAB, Node-RED e EVCC contêm muitas vezes listas de registos que funcionam, mas confira-as com o manual.

<mb-flow name="find"></mb-flow>

## O que ler nele

- A **convenção de endereçamento** (endereço no fio, a partir de 1 ou Modicon). Veja [endereços](modbus-address-off-by-one).
- Os **tipos de dados**, a **ordem das palavras** e a **escala** de cada valor. Veja [ordem de bytes e palavras](byte-and-word-order) e [escalas](scaling-and-units).
- Os **códigos de função suportados** e o maior número de registos por pedido.
- As **definições série por omissão** e o ID da unidade.

## Não está nesta biblioteca?

[Peça um mapa](https://github.com/nobrega8/mbmap-library/issues/new/choose) com uma ligação para o documento, ou escreva um: o formato é JSON simples e a [especificação](/spec) explica cada chave.
