# Ordem de bytes e de palavras: quando os valores de 32 bits saem errados

Uma tensão lê 1,7 × 10³⁸, um contador de energia salta de 65 536 em 65 536 ou uma temperatura é um pequeno número negativo. Os registos estão certos; o que falha é a ordem em que os dois registos de um valor de 32 bits são juntos.

## Um registo é fácil, dois não

Um registo Modbus tem 16 bits, enviados com o byte mais significativo primeiro. A norma não diz nada sobre valores maiores do que um registo, por isso cada fabricante escolhe como dividir um inteiro ou um float de 32 bits por dois registos (e um valor de 64 bits por quatro).

As quatro ordens costumam ter o nome dos bytes do valor, sendo `A` o mais significativo:

| Nome | Registo 1 | Registo 2 | Também chamada |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, palavra alta primeiro |
| `CDAB` | C D | A B | troca de palavras, palavra baixa primeiro, LSW primeiro |
| `BADC` | B A | D C | troca de bytes |
| `DCBA` | D C | B A | little-endian, ambos trocados |

`ABCD` e `CDAB` cobrem quase todos os dispositivos. `CDAB` é comum na Schneider, na Carlo Gavazzi e em muitos contadores chineses; `ABCD` na Siemens, na Janitza e na maioria dos dispositivos SunSpec.

<mb-byte-order></mb-byte-order>

## Como encontrar a certa

1. **Leia a secção do manual sobre o formato dos dados.** Procure “word order”, “LSW first”, “MSW first”, “high word first” ou “big endian”.
2. **Leia um valor que conhece.** Leia uma tensão que deve rondar os 230 V como float em cada ordem. Só uma dá um número sensato.
3. **Observe um contador.** Se o registo baixo de um contador de energia transborda para o que a sua ferramenta mostra como parte alta, troque as palavras.
4. **Verifique os valores de 64 bits em separado.** Alguns dispositivos guardam os valores de 32 bits com a palavra alta primeiro e os de 64 bits noutra ordem.

## Texto (strings)

O texto costuma levar dois carateres por registo, com o primeiro no byte alto. Alguns dispositivos põem o primeiro caráter no byte baixo, o que faz “EM24” ler-se como “ME42”.

## Como os mapas MBMap o registam

Um mapa define `byte_order` e `word_order` para o dispositivo todo, e qualquer registo os pode substituir. As páginas dos dispositivos mostram a ordem de cada valor de vários registos na notação acima (por exemplo `float32 CDAB`), e a exportação para o Home Assistant converte-a na opção `swap:` certa.
