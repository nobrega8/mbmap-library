# Um registo Modbus lê 0, 0xFFFF ou 0x8000

O pedido tem êxito mas o valor não faz sentido. Antes de suspeitar do dispositivo, veja o que ele está a tentar dizer-lhe.

## Razões comuns

- **Área errada.** O mesmo endereço pode existir como registo de entrada e como registo de retenção com conteúdos diferentes. Ler o registo de retenção quando o valor é um registo de entrada pode devolver zeros. Veja [códigos de função](modbus-function-codes).
- **Deslocado de um.** Ler a segunda metade de um valor de 32 bits em vez da primeira dá muitas vezes 0 para valores pequenos. Veja [endereços](modbus-address-off-by-one).
- **Não implementado.** Muitos dispositivos respondem a leituras de registos não usados com 0, 0xFFFF, 0x7FFF ou 0x8000 em vez de uma exceção. Os dispositivos SunSpec usam 0x8000 (−32768) para “não implementado” nos campos com sinal e 0xFFFF nos sem sinal.
- **Não medido.** Uma corrente de neutro numa ligação a três fios, uma fase que não está ligada ou uma entrada de sensor sem nada ligado lê 0 ou uma marca fixa.
- **Não está pronto.** Alguns dispositivos devolvem zeros durante alguns segundos depois de arrancar, ou até terminarem o primeiro ciclo de medição.
- **Diferenças entre modelos.** Um registo listado num manual de família pode existir só em alguns modelos: os outros devolvem 0.
- **Escala demasiado grosseira.** Uma corrente pequena com escala de 1 A lê 0.

<mb-scaling></mb-scaling>

## Como os mapas MBMap o registam

Um mapa pode listar `sentinels`, os valores que significam “não disponível” para cada tipo, para uma ferramenta os mostrar como em falta e não como uma leitura. As descrições dos registos indicam que modelos ou ligações um valor exige.
