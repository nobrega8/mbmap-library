# `.mbmap` — formato Modbus Map, versão 2

Um ficheiro `.mbmap.json` descreve o mapa de registos Modbus de um modelo de dispositivo: quem o fabrica, como comunicar com ele e o que significa cada registo. É um documento JSON, pelo que qualquer linguagem o pode ler com o seu analisador JSON normal, e um [JSON Schema](schema/mbmap-2.schema.json) descreve a sua estrutura.

As palavras-chave **MUST**, **SHOULD** e **MAY** são usadas como na [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119): **MUST** significa obrigatório, **SHOULD** recomendado (com exceções justificadas) e **MAY** facultativo. Esta tradução mantém as palavras em inglês para facilitar a comparação com o original.

## 1. Exemplo

```json
{
  "$schema": "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json",
  "mbmap": 2,
  "vendor": "Example Corp",
  "model": "EM-100",
  "description": "Single-phase energy meter",
  "protocol": "rtu",
  "unit_id": 1,
  "baudrate": 9600,
  "parity": "E",
  "stopbits": 1,
  "byte_order": "big",
  "word_order": "big",
  "address_base": 0,
  "enums": {
    "relay": {"0": "Open", "1": "Closed"}
  },
  "registers": [
    {"name": "Voltage", "group": "Measurements", "area": "input", "address": 0, "type": "float32", "unit": "V", "description": "RMS voltage"},
    {"name": "Current", "group": "Measurements", "area": "input", "address": 6, "type": "float32", "unit": "A", "description": "RMS current"},
    {"name": "Active energy", "group": "Energy", "area": "holding", "address": 256, "type": "uint32", "scale": 0.01, "unit": "kWh", "word_order": "little"},
    {"name": "Relay state", "group": "Status", "area": "holding", "address": 512, "type": "bool", "bit": 3, "enum": "relay", "description": "Bit 3 of the status word"},
    {"name": "Reset energy", "group": "Commands", "area": "coil", "address": 0, "type": "bool", "access": "W", "description": "Write 1 to reset counters"},
    {"name": "Serial number", "group": "Info", "area": "holding", "address": 1024, "type": "string", "length": 8, "description": "16 ASCII characters"}
  ]
}
```

Um exemplo completo está em [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. Ficheiro

- Um mapa é um objeto JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), codificado em UTF-8. Os leitores **MUST** aceitar e ignorar um BOM inicial. Os escritores **SHOULD NOT** escrever um.
- O nome do ficheiro termina em `.mbmap.json`.
- Um objeto **MUST NOT** repetir uma chave. Os analisadores JSON tratam as chaves duplicadas de formas diferentes, pelo que um ficheiro com uma é inválido.
- As cadeias são usadas tal como estão escritas: não há remoção de espaços, e os valores enumerados distinguem maiúsculas de minúsculas (`"holding"`, não `"Holding"`).
- O `null` do JSON não é um valor válido para nenhuma chave; omita a chave.
- O JSON não tem comentários. As notas sobre o ficheiro todo vão em `notes`, uma nota sobre um registo no seu `comment`. Ambos são texto livre que as ferramentas **MAY** mostrar e **MUST NOT** interpretar.
- Os escritores **SHOULD** usar o aspeto da secção 1: indentação de dois espaços e uma linha por registo e por tabela de `enums`/`sentinels`, para que uma alteração a um registo seja uma diferença de uma só linha.
- `$schema` é facultativo e encaminha os editores para o JSON Schema. Os leitores **MUST** ignorá-lo.

### 2.1 Inteiros

Onde um valor é um **inteiro**, **MAY** ser escrito como um inteiro JSON (`1040`) ou como uma cadeia com um inteiro decimal ou hexadecimal `0x` (`"0x0410"`). As cadeias mantêm a grafia hexadecimal que os manuais usam para endereços e identificadores, e transportam valores de 64 bits que nem todos os analisadores JSON leem exatamente como números (acima de 2^53). As chaves das tabelas `enums` e `sentinels` são sempre cadeias, nas mesmas duas formas.

### 2.2 Tabelas

Uma **tabela** faz corresponder valores em bruto a etiquetas: um objeto cujas chaves são inteiros escritos como cadeias (2.1) e cujos valores são etiquetas não vazias, por exemplo `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Uma tabela tem pelo menos uma entrada, e duas chaves **MUST NOT** representar o mesmo valor (`"1"` e `"0x1"`).

## 3. Chaves de topo

`mbmap`, `vendor`, `model` e `registers` são obrigatórias. Todas as outras chaves são facultativas; quando faltam, aplica-se o valor por omissão.

| Chave | Tipo JSON | Por omissão | Significado |
|---|---|---|---|
| `mbmap` | inteiro `2` | | Versão do formato (3.1, secção 8) |
| `vendor` | cadeia não vazia | | Fabricante |
| `model` | cadeia não vazia | | Modelo ou família de modelos, como é mostrado às pessoas |
| `models` | matriz de cadeias não vazias | `[model]` | Todos os nomes ou códigos de modelo a que o mapa se aplica (3.2) |
| `vendor_website` | cadeia: um domínio ou um URL `http(s)://` | | Sítio do fabricante, por exemplo `se.com` ou `https://www.se.com` |
| `description` | cadeia | | Descrição curta |
| `revision` | inteiro ≥ 1 | | Revisão do conteúdo deste mapa (3.1) |
| `revised` | cadeia `YYYY-MM-DD` | | Data dessa revisão |
| `firmware` | cadeia | | Texto livre sobre o firmware a que o mapa se aplica |
| `firmware_min` | cadeia de versão (3.2) | | O firmware mais antigo a que o mapa se aplica |
| `firmware_max` | cadeia de versão (3.2) | | O firmware mais recente a que o mapa se aplica |
| `source` | cadeia | | Resumo em texto livre de onde o mapa vem |
| `sources` | matriz de objetos de fonte | | Documentos a partir dos quais o mapa foi feito ou conferido (3.3) |
| `notes` | matriz de cadeias | | Notas livres sobre o ficheiro |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transportes que o dispositivo suporta |
| `unit_id` | inteiro `0`–`255` | `1` | ID da unidade / escravo por omissão |
| `port` | inteiro `1`–`65535` | `502` | Porta TCP por omissão |
| `baudrate` | inteiro | `9600` | Baud rate RTU por omissão |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Paridade RTU por omissão |
| `databits` | `7`, `8` | `8` | Bits de dados RTU por omissão |
| `stopbits` | `1`, `2` | `1` | Bits de paragem RTU por omissão |
| `byte_order` | `"big"`, `"little"` | `"big"` | Ordem de bytes por omissão dentro de cada registo (secção 6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Ordem por omissão dos registos de um valor de vários registos (secção 6) |
| `address_base` | `0`, `1` | `0` | Se `address` conta a partir de 0 ou de 1 (secção 5) |
| `max_read_registers` | inteiro `1`–`125` | `125` | O maior bloco que o dispositivo aceita por leitura (FC03/04) |
| `max_read_bits` | inteiro `1`–`2000` | `2000` | O maior bloco que o dispositivo aceita por leitura (FC01/02) |
| `enums` | objeto: nome → tabela | | Tabelas de tradução com nome (4.1). Os nomes usam `a`–`z`, `0`–`9` e `_` |
| `sentinels` | objeto: tipo → tabela | | Valores em bruto reservados por tipo inteiro (4.2) |
| `identify` | objeto | | Como ler a identidade do dispositivo com Report Slave ID (FC17) ou Read Device Identification (FC43) (4.8) |
| `registers` | matriz de objetos de registo | | Os registos (secção 4) |

Os valores de ligação são **valores por omissão**: o utilizador pode alterá-los ao ligar.

### 3.1 Versão do formato e revisão do mapa

Dois números descrevem um mapa, e mudam por razões diferentes:

- **`mbmap`, a versão do formato**, diz qual a versão desta especificação que o ficheiro segue, para que um leitor saiba se o consegue ler (secção 8). É igual em todos os mapas escritos segundo esta especificação e só muda quando o formato muda.
- **`revision`, a revisão do mapa**, diz qual a edição do conteúdo deste mapa que o ficheiro é. Começa em `1` e **SHOULD** aumentar de um em um com cada alteração publicada que afete a forma como um dispositivo é lido ou escrito: um registo, um valor de ligação por omissão, uma tabela, um intervalo de firmware ou um modelo. **MAY** manter-se igual em alterações só de texto livre (`description`, `notes`, `comment`, `source`). `revised` dá a data dessa alteração.

Uma ferramenta que tenha duas cópias do mesmo mapa (o mesmo `vendor` e `model`) **SHOULD** tratar a de `revision` mais alta como a mais recente e **MAY** oferecê-la ao utilizador. Um mapa sem `revision` não pode ser comparado desta forma. A revisão não é a versão de firmware do dispositivo: o firmware pertence à secção 3.2.

### 3.2 Modelos e firmware

Um mapa aplica-se aos modelos de `models`, ou só a `model` quando `models` falta. `model` é o nome mostrado às pessoas: um dispositivo, ou o nome da família ou série quando o mapa cobre vários (`"PM5100 and PM5300 series"`), não uma lista de dispositivos. `models` lista cada nome ou código que um dispositivo pode comunicar, para que uma ferramenta o possa comparar com o dispositivo ligado (secção 9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` e `firmware_max` dizem a que versões de firmware o mapa se aplica. Ambos são facultativos: sem eles o mapa aplica-se a todo o firmware, o que é também a escolha certa quando a versão não é conhecida. `firmware` continua disponível para tudo o que um intervalo não consegue dizer (“2.x, exceto 2.3 beta”).

Uma **cadeia de versão** é um ou mais números inteiros separados por pontos: `"2"`, `"2.1"`, `"1.02.7"`. Os componentes são comparados como números, da esquerda para a direita (`"1.10"` é mais recente do que `"1.9"`, e `"1.02"` é igual a `"1.2"`), por isso escreva as versões como o dispositivo as comunica. Um limite abrange todas as versões que começam por ele:

- `firmware_min` `"2.1"` inclui `2.1`, `2.1.4` e `3.0`, mas não `2.0.9`;
- `firmware_max` `"2"` inclui todas as `2.x` e `2.x.y`, mas não `3.0`; `firmware_max` `"2.3"` inclui `2.3.7`, mas não `2.4`.

Assim, `"firmware_min": "1", "firmware_max": "2"` lê-se “firmware 1.x e 2.x”. `firmware_min` **MUST NOT** ser posterior a `firmware_max`.

**Registos que dependem do firmware.** Um registo pode ter os seus próprios `firmware_min` e `firmware_max`, com o mesmo significado, quando só existe em algumas versões de firmware. Isto mantém um só ficheiro para revisões de firmware que diferem em poucos registos. Um registo sem eles aplica-se onde quer que o mapa se aplique. Dois registos **MAY** partilhar um `name` (e um endereço) quando os seus intervalos de firmware não se sobrepõem: a ferramenta usa o que corresponde ao dispositivo.

Exemplo: o firmware 2.1 mudou o contador de energia de sítio e acrescentou um registo de fator de potência:

```json
"firmware_min": "1",
"firmware_max": "2",
"registers": [
  {"name": "Firmware version", "area": "holding", "address": 0, "type": "string", "length": 4, "role": "firmware"},
  {"name": "Voltage", "area": "input", "address": 10, "type": "float32", "unit": "V"},
  {"name": "Active energy", "area": "input", "address": 20, "type": "uint32", "unit": "Wh", "firmware_max": "2.0"},
  {"name": "Active energy", "area": "input", "address": 40, "type": "uint64", "unit": "Wh", "firmware_min": "2.1"},
  {"name": "Power factor", "area": "input", "address": 30, "type": "int16", "scale": 0.001, "firmware_min": "2.1"}
]
```

Quando as diferenças são grandes (a maior parte dos endereços muda, ou as definições de ligação mudam), ficheiros separados são mais claros: um mapa por intervalo de firmware, cada um com os seus `firmware_min` e `firmware_max`.

### 3.3 Fontes

`sources` regista os documentos a partir dos quais um mapa foi feito ou com os quais foi conferido, para que um leitor os possa encontrar e saber que edição foi usada. Cada item é um objeto:

| Chave | Tipo JSON | Significado |
|---|---|---|
| `title` | cadeia não vazia, obrigatória | Título do documento, por exemplo `"EM530/EM540 Modbus communication protocol"` |
| `version` | cadeia | Edição ou revisão do documento, como está impressa nele |
| `date` | cadeia `YYYY`, `YYYY-MM` ou `YYYY-MM-DD` | Data de publicação dessa edição |
| `url` | URL `http(s)://` | Onde o documento pode ser encontrado |
| `note` | cadeia | Que parte foi usada, ou como o mapa foi conferido (por exemplo `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | cadeia `YYYY-MM-DD` | Quando o documento foi descarregado ou lido, já que um documento no mesmo URL pode mudar sem uma nova versão |
| `sha256` | cadeia de 64 dígitos hexadecimais | SHA-256 do ficheiro que foi usado, para que um leitor possa saber se o documento em `url` continua a ser o mesmo |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` aparece acima abreviado; num ficheiro são os 64 dígitos hexadecimais todos. Uma ferramenta **MAY** compará-lo com o documento que descarrega e avisar quando diferem: o documento foi atualizado e o mapa pode precisar de nova conferência.

`source` continua a ser um resumo de uma linha em texto livre, para as pessoas e para mapas cujas fontes não são conhecidas com este pormenor. Um mapa **MAY** ter ambos.

## 4. Registos

Cada item de `registers` é um objeto. `name`, `area`, `address` e `type` são obrigatórios; todas as outras chaves são facultativas, e aplica-se o valor por omissão quando faltam.

| Chave | Tipo JSON | Por omissão | Significado |
|---|---|---|---|
| `name` | cadeia não vazia | | Nome da variável. **SHOULD** ser único no ficheiro |
| `group` | cadeia | | Agrupamento livre para apresentação (por exemplo `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Área de dados Modbus (secção 5) |
| `address` | inteiro (2.1) | | Endereço do primeiro registo / bit (secção 5) |
| `type` | ver secção 6 | | Tipo de dados |
| `length` | inteiro ≥ 1 | | Número de registos. Obrigatório para `string`, ignorado nos outros |
| `bit` | inteiro `0`–`15` | | Para `bool` em `input`/`holding`: que bit do registo, 0 = menos significativo. Para um campo de bits `uint16`: o seu bit mais baixo |
| `bits` | inteiro `1`–`16` | | Para `uint16` em `input`/`holding`: largura de um campo de bits que começa em `bit` (4.3) |
| `scale` | número | `1` | Multiplicador |
| `scale_factor` | cadeia: o `name` de um registo | | Registo cujo valor inteiro é um expoente de potência de dez para este (4.4) |
| `offset` | número | `0` | Somado depois de aplicar a escala |
| `unit` | cadeia | | Unidade de engenharia (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Operações permitidas |
| `byte_order` | `"big"`, `"little"` | `byte_order` do ficheiro | Substitui o valor por omissão do ficheiro para este registo (secção 6) |
| `word_order` | `"big"`, `"little"` | `word_order` do ficheiro | Substitui o valor por omissão do ficheiro para este registo (secção 6) |
| `write_min` | número | | Menor valor aceite ao escrever, em unidades de engenharia (4.5) |
| `write_max` | número | | Maior valor aceite ao escrever, em unidades de engenharia (4.5) |
| `enum` | cadeia (um nome de `enums`) ou tabela | | Etiquetas para valores inteiros ou booleanos (4.1) |
| `reference` | ver 4.6 | | Valor em bruto que este registo deve conter num dispositivo saudável |
| `firmware_min` | cadeia de versão (3.2) | | O firmware mais antigo que tem este registo |
| `firmware_max` | cadeia de versão (3.2) | | O firmware mais recente que tem este registo |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Este registo identifica o dispositivo (4.7) |
| `read_alone` | booleano | `false` | O registo é lido num pedido só seu (4.9) |
| `read_group` | cadeia não vazia | | O registo só é lido juntamente com registos do mesmo grupo (4.9) |
| `parts` | matriz de objetos | | Dá nomes aos valores dentro de um registo de bloco, para que uma ferramenta os possa mostrar e editar um a um (4.10) |
| `description` | cadeia | | Texto livre |
| `comment` | cadeia | | Nota livre sobre o registo, para quem edita o mapa |

Valor de engenharia = bruto × 10^`scale_factor` × `scale` + `offset` (sem `scale_factor`: bruto × `scale` + `offset`). Ao escrever, uma ferramenta aplica a operação inversa e arredonda para o inteiro mais próximo nos tipos inteiros.

### 4.1 Tabelas de tradução

Muitos registos guardam um número que representa um estado: `0` é parado, `1` é inativo, `2` é a arrancar, e assim por diante. `enum` transforma esses números em etiquetas. É:

- **uma tabela** escrita no registo: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **o nome de uma tabela** em `enums`, no topo, para que a mesma lista seja escrita uma só vez para todos os registos que a usam:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Os valores são comparados com o valor **em bruto**, antes de `scale` e `offset`. Um valor que não está na tabela é mostrado como um número simples. As ferramentas **SHOULD** oferecer as etiquetas ao escrever.

### 4.2 Valores sentinela

Alguns dispositivos respondem com um valor em bruto reservado em vez de uma leitura: um valor significa “não implementado”, outro “acima do intervalo”, outro “falha do sensor”. `sentinels` declara-os para todos os registos de um tipo:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- As chaves de `sentinels` são `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Uma tabela aplica-se a todos os registos desse tipo.
- Os valores **MUST** caber no tipo e são comparados com o valor **em bruto**, antes de `scale` e `offset`.
- Quando uma leitura coincide, as ferramentas **SHOULD** mostrar a etiqueta em vez de um número e **SHOULD NOT** tratá-la como uma medição (em gráficos, limites ou médias).
- Uma etiqueta de `enum` para o mesmo valor em bruto tem precedência sobre o sentinela.

### 4.3 Campos de bits

Alguns dispositivos agrupam vários valores pequenos num só registo, por exemplo quatro códigos de alarme de 4 bits. Um registo `uint16` com `bit` e `bits` lê um deles: valor em bruto = (registo >> `bit`) & (2^`bits` − 1). `bit` + `bits` **MUST NOT** exceder 16.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Os registos que leem campos diferentes do mesmo registo não se sobrepõem. Escrever um campo **SHOULD** ler o registo, alterar só os bits do campo e escrevê-lo de volta.

### 4.4 Fatores de escala

Alguns dispositivos, nomeadamente os inversores e contadores SunSpec, enviam um registo de expoente separado para um valor em vez de uma escala fixa: o valor é bruto × 10^expoente, e o expoente pode mudar com o intervalo do dispositivo. `scale_factor` indica o nome desse registo de expoente:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- O registo indicado **MUST** ser um registo do mesmo ficheiro com um tipo inteiro (`int16` … `uint64`) e sem `bits`, e **MUST NOT** ter ele próprio um `scale_factor`. Se vários registos partilham o nome, conta o primeiro.
- Só os tipos numéricos podem ter `scale_factor` (não `bool` nem `string`).
- Uma ferramenta lê o registo do expoente juntamente com o valor, mesmo quando o utilizador escolheu não o mostrar. Se o expoente não puder ser lido, ou for um sentinela (4.2, por exemplo o `-32768` do SunSpec = não implementado), o valor não está disponível.
- Ao escrever, uma ferramenta lê primeiro o expoente e aplica a operação inversa.

### 4.5 Limites de escrita

`write_min` e `write_max` declaram que valores um registo aceita ao ser escrito, para que uma ferramenta possa recusar um valor mau antes de chegar ao dispositivo.

- Ambos são números em **unidades de engenharia**: o valor que o utilizador vê, depois de aplicados `scale_factor`, `scale` e `offset`. Um limite de `0.5` num registo com `scale` `0.1` significa um valor em bruto de 5.
- Qualquer um pode ser omitido: um limite em falta deixa esse lado aberto. Com os dois em falta, um registo não tem limite declarado (decide o dispositivo).
- `write_min` **MUST NOT** ser maior do que `write_max`. Os limites são inclusivos.
- Uma ferramenta **MUST NOT** enviar uma escrita cujo valor de engenharia esteja abaixo de `write_min` ou acima de `write_max`, e **SHOULD** dizer ao utilizador que limite foi excedido.
- Aplicam-se ao valor que o utilizador pede, antes de ser convertido num valor em bruto e arredondado. Um valor dentro dos limites que mesmo assim não caiba no tipo do registo é recusado pelas verificações normais de tipo.
- Não têm significado para registos `bool` e `string` nem para registos que não podem ser escritos (`access` `"R"`), e são ignorados nesses casos.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Valores de referência

`reference` dá um valor que se sabe que um dispositivo saudável guarda neste registo (um número de modelo, um identificador de protocolo fixo, um código de fabricante). Uma ferramenta pode ler o registo e compará-lo com a referência para detetar um endereço, uma base, uma ordem de bytes ou um tipo de dados errados antes de o utilizador confiar nos outros valores. Nem todos os dispositivos têm um registo assim, pelo que a maior parte dos registos não tem `reference`.

- É o valor **em bruto**, antes de `scale_factor`, `scale` e `offset`, no tipo JSON desse valor: um inteiro (2.1) para os tipos inteiros e para campos de bits, um número para `float32` e `float64`, `true` / `false` para `bool`, uma cadeia para `string`. **MUST** caber no tipo (e na largura de um campo de bits, ou `2 × length` carateres para uma cadeia).
- A verificação é o próprio registo: uma ferramenta lê o seu `area` e `address` (já ajustado por `address_base`) e descodifica o seu `type` com a sua ordem de bytes e de palavras.
- Um mapa pode ter qualquer número de registos com `reference`.
- Resultado de cada verificação: **match** (o valor em bruto descodificado é igual à referência), **mismatch** (difere), **failed** (a leitura devolveu um erro ou excedeu o tempo, pelo que nada se sabe), **not checked** (o registo não foi lido). Uma ferramenta **SHOULD** comunicá-los em separado: um mismatch aponta para um mapa ou definições errados, uma leitura falhada para um problema de ligação ou de endereçamento.
- Os valores de vírgula flutuante são comparados com a precisão do próprio tipo (uma referência `float32` é comparada como um float de 32 bits). As cadeias são comparadas depois de remover os carateres NUL e espaços finais.
- Uma referência só apoia um diagnóstico. Várias ordens de bytes ou de palavras podem descodificar os mesmos bytes para o mesmo valor (um número pequeno ou um palíndromo lê-se igual em mais de uma ordem), pelo que uma coincidência não prova que o mapa todo esteja certo. Os mapas **SHOULD** usar um valor distintivo e **SHOULD** dar mais do que um quando o dispositivo os tem.
- Uma `reference` num registo que não pode ser lido (`access` `"W"`) é um erro.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Registos de identidade

`role` marca os registos que dizem que dispositivo está ligado, para que uma ferramenta possa conferir o mapa com ele (secção 9):

- **`"model"`**: o nome ou código de modelo do dispositivo. O seu valor, ou a sua etiqueta de `enum` quando a tem, é comparado com `models`. A um código de modelo numérico convém dar uma etiqueta: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: a versão do firmware. Um registo de cadeia é lido como texto e usa-se a primeira cadeia de versão que contém (`"V2.01b"` dá `2.01`). Um número dá o seu valor de engenharia (`102` com `scale` `0.01` dá `1.02`). Quando vários registos têm este papel, os seus valores são juntados com pontos pela ordem do ficheiro, o que serve a dispositivos que guardam as versões maior e menor em separado, por exemplo como dois campos de bits de um registo (`"bit": 8, "bits": 8` e `"bit": 0, "bits": 8`).
- **`"serial"`**: o número de série. As ferramentas **MAY** mostrá-lo; nunca é comparado.

No máximo um registo **MAY** ter o papel `"model"` e no máximo um `"serial"`. Um registo com papel **MUST** poder ser lido. Fora isso, os registos com papel são registos normais: são lidos e mostrados como os outros e também podem ter uma `reference`.

### 4.8 Identidade vinda do dispositivo (FC17, FC43)

Alguns dispositivos dizem o que são com uma função própria e não têm registo de identidade. `identify` diz que função enviar e onde está a identidade na resposta, para que uma ferramenta possa conferir o mapa como faz com os registos da secção 4.7 (secção 9). Um mapa tem no máximo um `identify`.

```json
"enums": {"type_codes": {"0x41": "DMG610", "0x57": "DMG620"}},
"identify": {
  "function": 17,
  "fields": [
    {"name": "Type", "offset": 0, "type": "uint8", "role": "model", "enum": "type_codes"},
    {"name": "Software revision", "offset": 1, "type": "uint8", "role": "firmware"},
    {"name": "Hardware revision", "offset": 2, "type": "uint8"}
  ]
}
```

```json
"identify": {
  "function": 43,
  "fields": [
    {"name": "Vendor name", "object": 0},
    {"name": "Product code", "object": 1, "role": "model"},
    {"name": "Revision", "object": 2, "role": "firmware"}
  ]
}
```

| Chave | Tipo JSON | Por omissão | Significado |
|---|---|---|---|
| `function` | `17` ou `43` | | `17`: Report Slave ID. `43`: Read Device Identification (transporte de interface encapsulada, tipo MEI `0x0E`) |
| `fields` | matriz não vazia de objetos de campo | | Os valores a tirar da resposta |

Cada campo é um objeto. `name` é sempre obrigatório. `role` e as chaves seguintes dependem de `function`.

| Chave | Tipo JSON | Por omissão | Significado |
|---|---|---|---|
| `name` | cadeia não vazia | | Nome mostrado às pessoas |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Significado do valor, como nos registos (4.7). No máximo um `"model"` e um `"serial"` |
| `offset` | inteiro ≥ 0 | | **Só FC17, obrigatório.** Posição do campo, em bytes, nos dados da resposta. O offset `0` é o primeiro byte depois da contagem de bytes, pelo que os dados são os bytes que um dispositivo lista a seguir a “byte count” no seu manual |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Só FC17, obrigatório.** `uint16` é big-endian. `string` é ASCII, sem os carateres NUL e espaços finais |
| `length` | inteiro ≥ 1 | | **Só FC17.** Comprimento em bytes. Obrigatório para `string` |
| `enum` | nome de tabela ou tabela inline | | **Só FC17.** Traduz um número numa etiqueta (4.1). A um código de modelo convém dar uma etiqueta, que é então comparada com `models` |
| `object` | inteiro 0–255 | | **Só FC43, obrigatório.** ID do objeto: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` definidos pelo dispositivo |

- **FC43:** o valor de um objeto é uma cadeia ASCII, sem os carateres NUL e espaços finais. Uma ferramenta pede o nível de acesso (básico, regular ou alargado) que inclui todos os objetos que os campos nomeiam e segue a indicação “mais a seguir” até os ter. Para `"firmware"` usa-se a primeira cadeia de versão do texto, como num registo de cadeia (4.7).
- **Ambas as funções:** um dispositivo responde num ID de unidade, não num endereço de registo, pelo que `address_base` não se aplica.
- **Sem valor:** uma resposta mais curta do que um campo precisa, uma resposta de exceção, um objeto em falta ou um dispositivo que não suporta a função não dão valor. A verificação é **unknown** (secção 9), não um mismatch.
- **Várias fontes:** `identify` e registos com `role` podem estar ambos presentes. Quando ambos dão um valor para o mesmo papel, uma ferramenta **SHOULD** usar os registos e **MAY** usar `identify` para os papéis que nenhum registo dá.

### 4.9 Leitura em pedidos separados

Um leitor normalmente junta os registos vizinhos num só pedido. Alguns dispositivos recusam um pedido que atravessa a fronteira entre duas tabelas internas, mesmo que todos os registos nele existam. Duas chaves facultativas limitam a forma como os registos são juntados:

- **`read_alone`**: `true` significa que o registo é lido num pedido que não contém nenhum outro registo. Os campos de bits e outros registos que ocupam as mesmas palavras contam como o mesmo registo.
- **`read_group`**: um nome. Os registos com o mesmo nome **MAY** ser lidos num só pedido, e um pedido **MUST NOT** conter registos de grupos diferentes nem um registo sem grupo. Os registos sem `read_group` são juntados como dantes.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Quando as duas chaves estão presentes, `read_alone` prevalece. As chaves só limitam a junção: um leitor é livre de fazer mais pedidos do que os necessários, e `max_read_registers` e `max_read_bits` continuam a aplicar-se. Afetam apenas a forma como os registos são pedidos, não o que significam, pelo que um leitor que não as conhece lê os mesmos registos, juntos como sempre. É por isso que não precisam de uma nova versão de `mbmap` (secção 8): num dispositivo que recusa o pedido juntado, um leitor mais antigo falha exatamente como falharia sem as chaves.

### 4.10 Partes de um bloco

Alguns dispositivos guardam vários valores num bloco e só aceitam o bloco inteiro: uma escrita que começa a meio, ou que não o cobre, é recusada (exceção `0x02` ou `0x03`). Um caso típico é um gateway de SMS cujo bloco contém o número do destinatário seguido do texto da mensagem. O mapa descreve esse bloco como **um** registo, como sempre fez, e `parts` diz o que há dentro dele:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Chave | Tipo JSON | Por omissão | Significado |
|---|---|---|---|
| `name` | cadeia não vazia | | Nome mostrado às pessoas |
| `offset` | inteiro ≥ 0 | | Posição da parte no bloco, em **registos**, a partir do primeiro registo do registo |
| `type` | `"string"` ou um tipo numérico (secção 6) | `"string"` | Como a parte é lida e escrita |
| `length` | inteiro ≥ 1 | | Número de registos. Obrigatório para `string`, ignorado nos outros tipos |
| `description` | cadeia | | Texto livre |

- `parts` é só para um registo `string`. **MUST NOT** estar vazio. Cada parte **MUST** ficar dentro do bloco (`offset` mais os seus registos é no máximo o `length` do registo) e as partes **MUST NOT** sobrepor-se. Os registos que nenhuma parte cobre são permitidos: são enchimento.
- O registo em si mantém o seu significado. Um leitor que não conhece `parts` lê e escreve o bloco inteiro como uma só cadeia, num só pedido, exatamente como dantes, pelo que esse mapa continua a funcionar em todas as ferramentas.
- Uma ferramenta que conhece `parts` **SHOULD** mostrar cada parte como um campo próprio. Para ler, descodifica cada parte do bloco, com o `byte_order` e o `word_order` do registo (secção 6). Para escrever, constrói o bloco **inteiro** a partir das partes e envia-o num só pedido (FC16): uma parte que o utilizador deixou vazia é enviada como bytes a zero, para que um campo vazio nunca mantenha por acidente um valor antigo. Uma ferramenta **MUST NOT** enviar uma escrita que cubra só algumas partes, porque o dispositivo a recusa.
- Uma parte `string` é ASCII, preenchida com carateres NUL até ao seu `length`. A ferramenta **MUST** recusar um texto com mais de `2 × length` carateres. Uma parte numérica é codificada como de costume (secção 6).
- `access` é o do registo: as partes não podem ser mais graváveis do que o bloco.
- `parts` só descreve o que há dentro de um registo, pelo que não precisa de uma nova versão de `mbmap` (secção 8). Os leitores que o ignoram comportam-se como dantes.

## 5. Áreas e endereços

| `area` | Unidade | Leitura | Escrita | `access` permitido |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | registo de 16 bits | FC04 | — | `R` |
| `holding` | registo de 16 bits | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Com `address_base` `0`, `address` é o endereço enviado no fio (0–65535). Com `address_base` `1`, o endereço no fio é `address − 1` (1–65536), o que corresponde aos manuais que numeram os registos a partir de 1.

A notação “Modicon” de 5 e 6 dígitos (`40001`, `300010`) **não** é válida em `address`. Escreva-a como uma área mais um número: `40001` passa a `"area": "holding"`, `"address": 1`, com `"address_base": 1`.

## 6. Tipos, ordem de bytes e ordem de palavras

| `type` | Registos | Notas |
|---|---|---|
| `bool` | — | Em `coil`/`discrete`: um bit. Em `input`/`holding`: um bit de um registo, pelo que `bit` é obrigatório |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Os floats são IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 carateres ASCII por registo. Os carateres NUL e espaços finais são removidos ao ler |

Duas definições independentes dizem como chegam os bytes de um valor:

- **`byte_order`**, dentro de cada registo de 16 bits: `"big"` envia primeiro o byte alto (o padrão Modbus), `"little"` primeiro o byte baixo.
- **`word_order`**, entre os registos de um valor de 32 ou 64 bits: `"big"` põe primeiro o registo mais significativo (no endereço mais baixo), `"little"` primeiro o menos significativo.

As chaves de topo definem o valor por omissão do ficheiro; `byte_order` e `word_order` de um registo substituem-no cada um por si (um registo que só define `"word_order": "little"` mantém a ordem de bytes do ficheiro).

| Tipo | `byte_order` | `word_order` |
|---|---|---|
| `bool` | não usado | não usado |
| `int16`, `uint16` | troca os dois bytes do registo | não usado (um só registo) |
| `int32`, `uint32`, `float32` | troca os dois bytes de cada registo | decide qual dos 2 registos é a palavra alta |
| `int64`, `uint64`, `float64` | troca os dois bytes de cada registo | `"little"` inverte os 4 registos no seu conjunto |
| `string` | `"big"`: o primeiro byte recebido é o primeiro carácter; `"little"`: o segundo byte recebido é o primeiro carácter | não usado (os registos são lidos por ordem de endereço) |

Nos valores de 64 bits, a ordem de palavras little inverte toda a sequência dos quatro registos; não troca separadamente duas metades de 32 bits.

Ordem no fio do valor de 32 bits `0x0A0B0C0D`:

| `byte_order` | `word_order` | Bytes no fio | Nome corrente |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Padrão Modbus |
| `big` | `little` | `0C 0D 0A 0B` | “troca de palavras”, usada por muitos contadores e PLC |
| `little` | `big` | `0B 0A 0D 0C` | “troca de bytes” (rara) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Validação

Os leitores **SHOULD** comunicar cada problema com um dos códigos abaixo e um [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) para o valor (`/registers/3/address`, `/enums/relay`), para que as ferramentas concordem sobre o que está errado. Os problemas que dizem respeito ao ficheiro todo não têm ponteiro. Um **error** torna o ficheiro inválido. Um **warning** é comunicado, mas o ficheiro continua utilizável.

| Código | Gravidade | Quando |
|---|---|---|
| `not-utf8` | error | O ficheiro não é UTF-8 válido |
| `not-json` | error | O ficheiro não é um único objeto JSON válido, ou repete uma chave num objeto. Comunicado para o ficheiro todo: os analisadores situam os erros de sintaxe em posições diferentes, pelo que a posição vai na mensagem |
| `bad-json-type` | error | Uma chave conhecida tem o tipo JSON errado (uma cadeia onde se espera um número, `null`, …) |
| `missing-key` | error | Falta `mbmap`, `vendor`, `model` ou `registers` (para o ficheiro todo), ou um registo não tem `name`, `area`, `address` ou `type`, ou tem-no vazio (no registo) |
| `bad-meta-value` | error | Uma chave de topo tem um valor fora do conjunto ou intervalo permitido, incluindo `mbmap` diferente de `2` |
| `bad-area` | error | `area` desconhecida, ou não escrita em minúsculas |
| `bad-type` | error | `type` desconhecido, ou não escrito em minúsculas |
| `type-area` | error | Um tipo diferente de `bool` em `coil` ou `discrete` |
| `bad-address` | error | `address` não é um inteiro |
| `address-range` | error | O endereço está abaixo de `address_base`, ou o valor ultrapassa o endereço 65535 |
| `missing-bit` | error | `bool` em `input`/`holding` sem `bit` |
| `bad-bit` | error | `bit` fora de `0`–`15` |
| `missing-length` | error | `string` sem `length` |
| `bad-length` | error | `length` não é um inteiro ≥ 1 |
| `bad-access` | error | `access` desconhecido (ou não escrito em maiúsculas), ou não permitido para a `area` |
| `bad-byte-order` | error | `byte_order` ou `word_order` de um registo não é `"big"` nem `"little"` |
| `bad-enum` | error | Uma tabela enum (2.2) tem uma chave que não é um inteiro, uma etiqueta vazia, um valor repetido ou nenhuma entrada, ou um nome de `enums` não é `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` indica um tipo não suportado, ou uma tabela não é válida (2.2) ou tem um valor que não cabe no tipo |
| `bad-bits` | error | `bits` não é um inteiro de 1 a 16, é usado num tipo que não `uint16` ou fora de `input`/`holding`, não tem `bit`, ou `bit` + `bits` excede 16 |
| `unknown-enum` | error | `enum` indica uma tabela que `enums` não define |
| `bad-write-limit` | error | `write_min` é maior do que `write_max` |
| `bad-reference` | error | `reference` não é um valor em bruto válido para o `type` do registo (não é um inteiro, está fora do intervalo do tipo, é mais largo do que o campo de bits, não é um booleano para `bool`, não é um número finito para floats, é mais longo do que a cadeia), ou está definido num registo que não pode ser lido |
| `unknown-scale-factor` | error | `scale_factor` não indica nenhum registo do ficheiro (os registos com erros não contam) |
| `bad-scale-factor` | error | `scale_factor` está definido num `bool` ou `string`, ou indica um registo que não é um inteiro completo (um float, `bool`, `string` ou campo de bits) ou que tem ele próprio um `scale_factor` |
| `bad-version` | error | `firmware_min` ou `firmware_max`, no ficheiro ou num registo, não é uma cadeia de versão (3.2) |
| `bad-firmware-range` | error | `firmware_min` é posterior a `firmware_max`, no ficheiro ou num registo |
| `bad-source` | error | Um item de `sources` não é um objeto com um `title` não vazio, ou tem um `version`, `date`, `url`, `note`, `accessed` ou `sha256` de forma errada |
| `bad-role` | error | `role` não é `"model"`, `"firmware"` nem `"serial"`, está definido num registo que não pode ser lido, ou `"model"` ou `"serial"` é usado mais de uma vez |
| `bad-identify` | error | `identify` não é válido (4.8): `function` não é `17` nem `43`, `fields` está vazio, ou um campo não tem `name`, tem um `role` desconhecido ou repetido para `"model"` ou `"serial"`, ou quebra as regras da sua função (FC17: `offset` em falta ou negativo, `type` em falta ou desconhecido, `string` sem `length`, um `enum` que não indica nenhuma tabela ou não é uma tabela válida, um `object`; FC43: `object` em falta ou fora de 0–255, um `offset`, `type`, `length` ou `enum`) |
| `bad-parts` | error | `parts` está vazio, está definido num registo que não é uma `string` com um `length` válido, ou tem uma parte sem `name` ou `offset`, com um `offset` negativo, um `type` desconhecido ou `bool`, uma parte `string` sem `length`, uma parte que ultrapassa o bloco, ou partes que se sobrepõem (4.10) |
| `no-rows` | warning | `registers` está vazio |
| `duplicate-name` | warning | Um `name` é usado mais de uma vez por registos cujos intervalos de firmware se sobrepõem (3.2) |
| `model-list` | warning | `model` lista dispositivos separados por “ / ”; dê o nome da família e liste os dispositivos em `models` (3.2) |
| `overlap` | warning | Um valor começa dentro dos registos de outro valor na mesma área, o que normalmente significa um endereço ou tipo errados. Os registos que começam no mesmo endereço são leituras alternativas dos mesmos dados (por exemplo um código lido como número e como texto) e nunca contam como sobreposição; também não contam os bits e campos de bits de um registo (`bool` + `bit`, `uint16` + `bit` + `bits`), nem os registos cujos intervalos de firmware não se sobrepõem |
| `firmware-outside-map` | warning | O intervalo de firmware de um registo não tem nenhuma versão em comum com o do ficheiro, pelo que nunca se aplica |
| `bad-read` | error | `read_group` é uma cadeia vazia |
| `unknown-key` | warning | Um registo tem uma chave que não está nesta especificação e não começa por `x_` |
| `unused-write-limit` | warning | `write_min` ou `write_max` está definido num registo onde não tem efeito (`bool`, `string`, ou `access` `"R"`) |
| `unused-bit` | warning | `bit` está definido num registo onde não tem efeito (qualquer tipo exceto `bool`, a menos que `bits` também esteja definido num `uint16`) |

Um registo com um erro em `name`, `area`, `address` ou `type` não é verificado mais. Um registo com qualquer erro fica de fora da verificação de `overlap`.

O [JSON Schema](schema/mbmap-2.schema.json) verifica a estrutura, os tipos JSON e os intervalos de valores; as regras que relacionam vários valores (`unknown-enum`, fatores de escala, `overlap`, `address-range`, `bad-reference` por tipo, chaves duplicadas) precisam de código. A pasta [`tests/`](tests/) tem ficheiros de exemplo com os diagnósticos que cada um deve produzir, para que qualquer implementação se possa conferir com eles.

## 8. Compatibilidade e versões

- Os leitores **MUST** ignorar as chaves que não conhecem, no topo e nos registos. Isto permite que ficheiros mais recentes abram em leitores mais antigos.
- As chaves específicas de um fabricante ou de uma ferramenta **SHOULD** começar por `x_` (`"x_modbench_icon"`, `"x_alarm_high"`) para nunca colidirem com versões futuras desta especificação. Os seus valores **MAY** ser de qualquer tipo JSON.
- `mbmap` é a versão **maior**. Um leitor **MUST** recusar um ficheiro cujo `mbmap` não suporta e **SHOULD** dizer que versão encontrou.
- As novas chaves facultativas que os leitores mais antigos podem ignorar sem risco são acrescentadas sem alterar `mbmap`. Uma chave cujo significado um leitor mais antigo interpretaria mal se a ignorasse exige uma nova versão maior.
- O ficheiro de schema tem o nome da versão maior (`mbmap-2.schema.json`) e dentro dela só ganha chaves facultativas.

## 9. Conferir um mapa com o dispositivo ligado

Uma ferramenta que lê os registos de identidade (4.7), ou a resposta de identidade descrita por `identify` (4.8), do dispositivo ligado **SHOULD** compará-los com o mapa, para que o utilizador não confie em valores de um mapa escrito para outro modelo ou firmware. Pode também deixar o utilizador indicar à mão o modelo ou o firmware quando o dispositivo não os comunica.

Cada verificação tem um de três resultados:

| Resultado | Modelo | Firmware |
|---|---|---|
| **match** | O modelo do dispositivo, comparado sem distinguir maiúsculas e sem espaços à volta, é um de `models` (ou `model`) | A versão do dispositivo está dentro de `firmware_min` … `firmware_max` |
| **mismatch** | Não é | Está fora do intervalo |
| **unknown** | O mapa não tem registo `"model"`, não foi possível lê-lo, ou não deu valor | O mapa não tem registo `"firmware"`, não foi possível lê-lo, não se encontrou nele nenhuma cadeia de versão, ou o mapa não declara intervalo |

O que uma ferramenta faz com cada um:

- **match**: nada a comunicar; a ferramenta **MAY** mostrar que o dispositivo foi reconhecido.
- **mismatch**: a ferramenta **SHOULD** avisar claramente, dizendo o que o mapa espera e o que o dispositivo comunicou, e **SHOULD** pedir confirmação antes da primeira escrita no dispositivo. **MUST NOT** parar a leitura por isso: ler é inofensivo, e o utilizador pode saber melhor (um dispositivo com outra marca, um firmware mais recente que manteve os mesmos registos).
- **unknown**: não é um problema. A maioria dos dispositivos não comunica modelo nem firmware, e a maioria dos mapas aplica-se a todo o firmware. A ferramenta **MUST NOT** tratá-lo como um mismatch e **MAY** mencionar que o mapa declara um intervalo de firmware que não pôde ser verificado.

Registos com o seu próprio intervalo de firmware (3.2):

- Quando o firmware é **conhecido**, uma ferramenta **SHOULD** usar só os registos cujo intervalo o inclui: os outros não existem neste dispositivo, e um nome de registo partilhado por vários intervalos de firmware significa então um só registo.
- Quando o firmware é **desconhecido**, uma ferramenta **SHOULD** ler todos os registos, **SHOULD** mostrar quais dependem do firmware (por exemplo “firmware 2.1 e posterior”) e **MAY** deixar o utilizador escolher a versão.

Um mapa sem `models`, `firmware_min`, `firmware_max` e registos de identidade não é conferido com nada, o que é correto para um mapa que se aplica a todos os dispositivos do seu modelo.

## 10. Ficheiros antigos

A versão 1 do formato, baseada em CSV, está obsoleta. Os novos leitores não precisam de a suportar; os ficheiros nesse formato podem ser convertidos com [`tools/migrate/migrate.py`](tools/migrate/migrate.py) (veja [legacy/v1](legacy/v1/)).
