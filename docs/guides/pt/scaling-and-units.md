# Escalas e unidades: quando o valor está dez ou mil vezes errado

O registo é lido na ordem certa e, mesmo assim, a tensão é 2301 em vez de 230,1, ou a corrente é 4560 em vez de 4,56 A. A maioria dos contadores envia inteiros e espera que aplique uma escala fixa.

## Escala fixa

Os manuais escrevem a escala de várias formas que querem dizer o mesmo:

| O manual diz | Significado | Valor lido 2301 |
|---|---|---|
| “resolution 0.1 V”, “× 0.1”, “unit 0.1 V” | multiplicar por 0,1 | 230,1 V |
| “Value weight: Volt × 10”, “÷ 10” | dividir por 10 | 230,1 V |
| “1 decimal”, “format XXX.X” | dividir por 10 | 230,1 V |
| “mA”, “mV”, “Wh” como unidade | o inteiro já está nessa unidade | 2301 mV |

Atenção à unidade tanto como ao fator: um contador de energia em Wh e outro em kWh × 0,01 diferem por um fator de dez.

## Escala definida pela configuração

Alguns dispositivos mudam a escala com uma definição: o número de casas decimais mostradas no visor, a relação do TC ou o intervalo de tensão. O manual dá então uma tabela (“se o registo 40018 for 2, divida por 100”). Leia primeiro essa definição.

<mb-scaling></mb-scaling>

## Registos de fator de escala (SunSpec e outros)

Os inversores e contadores SunSpec enviam cada valor com um registo de *fator de escala* à parte, uma potência de dez com sinal. O valor é `registo × 10^fator_de_escala`: uma potência de 4523 com fator de escala −1 é 452,3 W. O fator de escala pode mudar com o dispositivo em funcionamento, por isso leia-o com o valor, no mesmo pedido.

## Floats

Os valores enviados como floats de 32 bits (IEEE 754) não precisam de escala; já estão em unidades de engenharia. Se um float parecer absurdo, verifique a [ordem das palavras](byte-and-word-order) antes da escala.

## Como os mapas MBMap o registam

Um registo tem uma `scale` (o multiplicador), um `offset` opcional, uma `unit`, ou um `scale_factor` que nomeia o registo com a potência de dez. As páginas dos dispositivos e as exportações aplicam-nos, para o número que configura ser o do manual.
