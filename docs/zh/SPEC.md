# `.mbmap` — Modbus 映射表格式，第 2 版

一个 `.mbmap.json` 文件描述一种设备型号的 Modbus 寄存器映射表：谁制造它、如何与它通信，以及每个寄存器的含义。它是一份 JSON 文档，因此任何语言都可以用标准 JSON 解析器读取，并且有一份 [JSON Schema](schema/mbmap-2.schema.json) 描述其结构。

关键词 **MUST**、**SHOULD** 和 **MAY** 的用法与 [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) 相同：**MUST** 表示必须，**SHOULD** 表示应当（有充分理由时可例外），**MAY** 表示可以。本译文保留这些英文关键词，以便与英文原文对照。

## 1. 示例

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

完整的示例见 [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json)。

## 2. 文件

- 映射表是一个 JSON 对象（[RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)），编码为 UTF-8。读取方 **MUST** 接受并忽略开头的 BOM。写入方 **SHOULD NOT** 写入 BOM。
- 文件名以 `.mbmap.json` 结尾。
- 一个对象 **MUST NOT** 重复同一个键。各 JSON 解析器对重复键的处理方式不同，所以含有重复键的文件无效。
- 字符串按原样使用：不做去空格处理，枚举值区分大小写（`"holding"`，而不是 `"Holding"`）。
- JSON 的 `null` 对任何键都不是有效值；请省略该键。
- JSON 没有注释。关于整个文件的说明放在 `notes` 中，关于单个寄存器的说明放在其 `comment` 中。两者都是自由文本，工具 **MAY** 显示，但 **MUST NOT** 解释其含义。
- 写入方 **SHOULD** 使用第 1 节的版式：两个空格缩进，每个寄存器以及每个 `enums`/`sentinels` 表各占一行，这样对某个寄存器的修改只产生一行差异。
- `$schema` 是可选的，用于让编辑器找到 JSON Schema。读取方 **MUST** 忽略它。

### 2.1 整数

凡取值为**整数**之处，**MAY** 写成 JSON 整数（`1040`），也可以写成包含十进制整数或 `0x` 十六进制数的字符串（`"0x0410"`）。字符串保留了手册中表示地址和标识符的十六进制写法，也可用来承载并非所有 JSON 解析器都能精确读成数字的 64 位数值（超过 2^53）。`enums` 和 `sentinels` 表的键始终是字符串，同样采用这两种形式。

### 2.2 表

**表**把原始值映射为标签：一个对象，其键是写成字符串的整数（见 2.1），其值是非空标签，例如 `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`。表至少有一个条目，并且两个键 **MUST NOT** 表示同一个值（`"1"` 和 `"0x1"`）。

## 3. 顶层键

`mbmap`、`vendor`、`model` 和 `registers` 是必需的。其他所有键都是可选的；缺失时使用默认值。

| 键 | JSON 类型 | 默认值 | 含义 |
|---|---|---|---|
| `mbmap` | 整数 `2` | | 格式版本（3.1、第 8 节） |
| `vendor` | 非空字符串 | | 制造商 |
| `model` | 非空字符串 | | 型号或型号系列，按面向用户的形式 |
| `models` | 非空字符串数组 | `[model]` | 此映射表适用的每个型号名称或代码（3.2） |
| `vendor_website` | 字符串：域名或 `http(s)://` URL | | 制造商网站，例如 `se.com` 或 `https://www.se.com` |
| `description` | 字符串 | | 简短说明 |
| `revision` | 整数 ≥ 1 | | 此映射表内容的修订号（3.1） |
| `revised` | 字符串 `YYYY-MM-DD` | | 该修订的日期 |
| `firmware` | 字符串 | | 关于映射表所适用固件的自由文本 |
| `firmware_min` | 版本字符串（3.2） | | 映射表适用的最旧固件 |
| `firmware_max` | 版本字符串（3.2） | | 映射表适用的最新固件 |
| `source` | 字符串 | | 映射表来源的自由文本概述 |
| `sources` | 来源对象数组 | | 编写或核对映射表所依据的文档（3.3） |
| `notes` | 字符串数组 | | 关于文件的自由备注 |
| `protocol` | `"tcp"`、`"rtu"`、`"tcp+rtu"` | `"tcp+rtu"` | 设备支持的传输方式 |
| `unit_id` | 整数 `0`–`255` | `1` | 默认的单元 ID / 从站 ID |
| `port` | 整数 `1`–`65535` | `502` | 默认的 TCP 端口 |
| `baudrate` | 整数 | `9600` | 默认的 RTU 波特率 |
| `parity` | `"N"`、`"E"`、`"O"` | `"E"` | 默认的 RTU 校验位 |
| `databits` | `7`、`8` | `8` | 默认的 RTU 数据位 |
| `stopbits` | `1`、`2` | `1` | 默认的 RTU 停止位 |
| `byte_order` | `"big"`、`"little"` | `"big"` | 每个寄存器内部的默认字节序（第 6 节） |
| `word_order` | `"big"`、`"little"` | `"big"` | 多寄存器数值中各寄存器的默认顺序（第 6 节） |
| `address_base` | `0`、`1` | `0` | `address` 是从 0 还是从 1 起计（第 5 节） |
| `max_read_registers` | 整数 `1`–`125` | `125` | 设备每次读取（FC03/04）接受的最大块 |
| `max_read_bits` | 整数 `1`–`2000` | `2000` | 设备每次读取（FC01/02）接受的最大块 |
| `enums` | 对象：名称 → 表 | | 具名对照表（4.1）。名称使用 `a`–`z`、`0`–`9` 和 `_` |
| `sentinels` | 对象：类型 → 表 | | 每种整数类型保留的原始值（4.2） |
| `identify` | 对象 | | 如何用报告从站 ID（FC17）或读设备标识（FC43）读取设备标识（4.8） |
| `registers` | 寄存器对象数组 | | 寄存器（第 4 节） |

连接相关的值是**默认值**：用户在连接时仍可更改。

### 3.1 格式版本和映射表修订号

两个数字描述一个映射表，它们的变化原因不同：

- **`mbmap`，格式版本**，说明文件遵循本规范的哪个版本，读取方据此知道自己能否读取（第 8 节）。依据本规范编写的所有映射表该值相同，只有格式变化时它才会变。
- **`revision`，映射表修订号**，说明该文件是此映射表内容的第几版。它从 `1` 开始，每次发布影响设备读取或写入方式的变更（寄存器、连接默认值、表、固件范围或型号）时，**SHOULD** 加一。仅修改自由文本（`description`、`notes`、`comment`、`source`）时，**MAY** 保持不变。`revised` 给出该次修订的日期。

如果工具持有同一个映射表（相同的 `vendor` 和 `model`）的两份副本，**SHOULD** 将 `revision` 较高的视为较新的，并且 **MAY** 向用户提供较新的那份。没有 `revision` 的映射表无法按此方式比较。修订号不是设备的固件版本：固件属于 3.2。

### 3.2 型号和固件

映射表适用于 `models` 中的型号；如果没有 `models`，则只适用于 `model`。`model` 是面向用户显示的名称：一台设备，或者当映射表涵盖多个型号时的系列名称（`"PM5100 and PM5300 series"`），而不是设备列表。`models` 列出设备可能报告的每个名称或代码，这样工具可以将其与所连接的设备比较（第 9 节）：

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` 和 `firmware_max` 说明映射表适用于哪些固件版本。两者都是可选的：缺省时映射表适用于所有固件，在版本未知时这也是正确的选择。`firmware` 仍可用于范围无法表达的内容（“2.x，2.3 测试版除外”）。

**版本字符串**是由点分隔的一个或多个整数：`"2"`、`"2.1"`、`"1.02.7"`。各组成部分从左起按数值比较（`"1.10"` 比 `"1.9"` 新，`"1.02"` 与 `"1.2"` 相同），因此请按设备报告的方式书写版本。一个边界涵盖所有以它开头的版本：

- `firmware_min` 为 `"2.1"` 包括 `2.1`、`2.1.4` 和 `3.0`，但不包括 `2.0.9`；
- `firmware_max` 为 `"2"` 包括所有 `2.x` 和 `2.x.y`，但不包括 `3.0`；`firmware_max` 为 `"2.3"` 包括 `2.3.7`，但不包括 `2.4`。

因此 `"firmware_min": "1", "firmware_max": "2"` 读作“固件 1.x 和 2.x”。`firmware_min` **MUST NOT** 晚于 `firmware_max`。

**依赖固件的寄存器。** 当某个寄存器只存在于部分固件版本中时，它可以带有自己的 `firmware_min` 和 `firmware_max`，含义相同。这样，对于仅在少数寄存器上不同的固件修订版，可以共用一个文件。没有这些键的寄存器适用于映射表适用的所有情形。当两个寄存器的固件范围不重叠时，它们 **MAY** 共用同一个 `name`（和地址）：工具使用与设备匹配的那个。

示例：固件 2.1 移动了电能计数器，并新增了一个功率因数寄存器：

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

当差异很大（多数地址发生变化，或连接设置发生变化）时，分成不同的文件更清楚：每个固件范围一个映射表，各有自己的 `firmware_min` 和 `firmware_max`。

### 3.3 来源

`sources` 记录映射表所依据或核对过的文档，这样读者可以找到它们，并知道使用的是哪个版本。每一项是一个对象：

| 键 | JSON 类型 | 含义 |
|---|---|---|
| `title` | 非空字符串，必需 | 文档标题，例如 `"EM530/EM540 Modbus communication protocol"` |
| `version` | 字符串 | 文档的版本或修订号，按文档上的印刷形式 |
| `date` | 字符串 `YYYY`、`YYYY-MM` 或 `YYYY-MM-DD` | 该版本的发布日期 |
| `url` | `http(s)://` URL | 可以找到该文档的位置 |
| `note` | 字符串 | 使用了哪一部分，或如何核对映射表（例如 `"tables 4.1-4.24"`、`"tested on a device with firmware 2.1"`） |
| `accessed` | 字符串 `YYYY-MM-DD` | 下载或阅读该文档的时间，因为同一 URL 上的文档可能在没有新版本的情况下发生变化 |
| `sha256` | 64 位十六进制字符串 | 所用文件的 SHA-256，读者可据此判断 `url` 处的文档是否仍是同一份 |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

上面的 `sha256` 做了缩写显示；在文件中它是完整的 64 位十六进制数字。工具 **MAY** 将其与下载到的文档比较，并在不一致时发出警告：文档已更新，映射表可能需要重新核对。

`source` 仍保留为一行自由文本概述，供人阅读，也适用于来源没有如此详细信息的映射表。一个映射表 **MAY** 同时有两者。

## 4. 寄存器

`registers` 的每一项都是一个对象。`name`、`area`、`address` 和 `type` 是必需的；其他所有键都是可选的，缺失时使用默认值。

| 键 | JSON 类型 | 默认值 | 含义 |
|---|---|---|---|
| `name` | 非空字符串 | | 变量名。在文件中 **SHOULD** 唯一 |
| `group` | 字符串 | | 用于显示的自由分组（例如 `Measurements`） |
| `area` | `"coil"`、`"discrete"`、`"input"`、`"holding"` | | Modbus 数据区域（第 5 节） |
| `address` | 整数（2.1） | | 第一个寄存器 / 位的地址（第 5 节） |
| `type` | 见第 6 节 | | 数据类型 |
| `length` | 整数 ≥ 1 | | 寄存器数量。`string` 必需，其他类型忽略 |
| `bit` | 整数 `0`–`15` | | 对于 `input`/`holding` 中的 `bool`：寄存器的哪一位，0 为最低位。对于 `uint16` 位字段：其最低位 |
| `bits` | 整数 `1`–`16` | | 对于 `input`/`holding` 中的 `uint16`：从 `bit` 开始的位字段宽度（4.3） |
| `scale` | 数字 | `1` | 乘数 |
| `scale_factor` | 字符串：某个寄存器的 `name` | | 其整数值是本寄存器的十的幂指数的寄存器（4.4） |
| `offset` | 数字 | `0` | 在换算比例之后相加 |
| `unit` | 字符串 | | 工程单位（`V`、`kWh`、`°C`……） |
| `access` | `"R"`、`"W"`、`"RW"` | `"R"` | 允许的操作 |
| `byte_order` | `"big"`、`"little"` | 文件的 `byte_order` | 覆盖此寄存器的文件默认值（第 6 节） |
| `word_order` | `"big"`、`"little"` | 文件的 `word_order` | 覆盖此寄存器的文件默认值（第 6 节） |
| `write_min` | 数字 | | 写入时接受的最小值，以工程单位表示（4.5） |
| `write_max` | 数字 | | 写入时接受的最大值，以工程单位表示（4.5） |
| `enum` | 字符串（`enums` 中的名称）或表 | | 整数或布尔值的标签（4.1） |
| `reference` | 见 4.6 | | 正常设备中此寄存器应当持有的原始值 |
| `firmware_min` | 版本字符串（3.2） | | 拥有此寄存器的最旧固件 |
| `firmware_max` | 版本字符串（3.2） | | 拥有此寄存器的最新固件 |
| `role` | `"model"`、`"firmware"`、`"serial"` | | 此寄存器用于识别设备（4.7） |
| `read_alone` | 布尔值 | `false` | 此寄存器在单独的请求中读取（4.9） |
| `read_group` | 非空字符串 | | 此寄存器只与同一分组的寄存器一起读取（4.9） |
| `parts` | 对象数组 | | 给块寄存器内的值，或字寄存器的位字段命名，使工具能逐个显示和编辑（4.10） |
| `description` | 字符串 | | 自由文本 |
| `comment` | 字符串 | | 关于该寄存器的自由备注，供编辑映射表的人阅读 |

工程值 = 原始值 × 10^`scale_factor` × `scale` + `offset`（没有 `scale_factor` 时：原始值 × `scale` + `offset`）。写入时，工具应用其逆运算，对整数类型四舍五入到最接近的整数。

### 4.1 对照表

许多寄存器保存的数字代表某种状态：`0` 表示停止，`1` 表示空闲，`2` 表示正在启动，依此类推。`enum` 把这些数字变成标签。它可以是：

- 写在寄存器中的**一张表**：`"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`；
- 顶层 `enums` 中的**表名**，这样同一份列表只需写一次，供所有使用它的寄存器引用：

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

比较的对象是**原始**值，即在应用 `scale` 和 `offset` 之前。不在表中的值显示为普通数字。工具 **SHOULD** 在写入时提供这些标签。

### 4.2 哨兵值

有些设备会用一个保留的原始值来代替读数：一个值表示“未实现”，另一个表示“超量程”，还有一个表示“传感器故障”。`sentinels` 为同一类型的所有寄存器声明这些值：

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- `sentinels` 的键为 `int16`、`uint16`、`int32`、`uint32`、`int64`、`uint64`。一张表适用于该类型的所有寄存器。
- 值 **MUST** 符合该类型，并与**原始**值比较，即在应用 `scale` 和 `offset` 之前。
- 当读数与其匹配时，工具 **SHOULD** 显示标签而不是数字，并且 **SHOULD NOT** 将其视为测量值（在图表、限值或平均值中）。
- 对同一原始值，`enum` 的标签优先于哨兵值。

### 4.3 位字段

有些设备把几个小的值打包进一个寄存器，例如四个 4 位的报警代码。带有 `bit` 和 `bits` 的 `uint16` 寄存器读取其中一个：原始值 = (寄存器 >> `bit`) & (2^`bits` − 1)。`bit` + `bits` **MUST NOT** 超过 16。

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

读取同一寄存器中不同字段的寄存器不算重叠。写入字段时 **SHOULD** 先读取寄存器，只修改该字段的位，然后写回。

### 4.4 比例因子

有些设备，尤其是 SunSpec 逆变器和电表，不使用固定比例，而是为一个值单独发送一个指数寄存器：数值为原始值 × 10^指数，指数可能随设备的量程变化。`scale_factor` 指明该指数寄存器：

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- 所指的寄存器 **MUST** 是同一文件中的寄存器，具有整数类型（`int16` … `uint64`）且没有 `bits`，并且自身 **MUST NOT** 带有 `scale_factor`。如果有多个寄存器同名，以第一个为准。
- 只有数值类型可以有 `scale_factor`（`bool` 或 `string` 不行）。
- 工具会把指数寄存器与数值一起读取，即使用户选择不显示它。如果无法读取指数，或者它是哨兵值（4.2，例如 SunSpec 的 `-32768` = 未实现），则该值不可用。
- 写入时，工具先读取指数，再应用其逆运算。

### 4.5 写入限制

`write_min` 和 `write_max` 声明寄存器在写入时接受哪些值，这样工具可以在坏值到达设备之前拒绝它。

- 两者都是**工程单位**的数值：即用户所见的值，已应用 `scale_factor`、`scale` 和 `offset`。在 `scale` 为 `0.1` 的寄存器上，限值 `0.5` 表示原始值 5。
- 两者都可以省略：缺失的限值表示该侧不设限。两者都缺失时，寄存器没有声明限制（由设备决定）。
- `write_min` **MUST NOT** 大于 `write_max`。限值包含边界值。
- 工具 **MUST NOT** 发送工程值低于 `write_min` 或高于 `write_max` 的写入，并且 **SHOULD** 告诉用户超出了哪个限值。
- 它们适用于用户要求的值，即在转换为原始值并取整之前。在限值之内但仍然不符合寄存器类型的值，会被常规的类型检查拒绝。
- 对 `bool` 和 `string` 寄存器，以及无法写入的寄存器（`access` 为 `"R"`），它们没有意义，会被忽略。

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 参考值

`reference` 给出正常设备在此寄存器中已知应当持有的值（型号编号、固定的协议标识符、制造商代码）。工具可以读取该寄存器并与参考值比较，在用户信任其他数值之前发现地址、基数、字节序或数据类型有误。并非每台设备都有这样的寄存器，所以多数寄存器没有 `reference`。

- 它是**原始**值，即在应用 `scale_factor`、`scale` 和 `offset` 之前，采用该值的 JSON 类型：整数类型和位字段用整数（2.1），`float32` 和 `float64` 用数字，`bool` 用 `true` / `false`，`string` 用字符串。它 **MUST** 符合该类型（以及位字段的宽度，或字符串的 `2 × length` 个字符）。
- 检查的对象就是该寄存器本身：工具读取其 `area` 和 `address`（已按 `address_base` 调整），并用其字节序和字序解码其 `type`。
- 一个映射表可以有任意多个带 `reference` 的寄存器。
- 每次检查的结果：**match**（解码后的原始值等于参考值）、**mismatch**（不同）、**failed**（读取返回错误或超时，因此一无所知）、**not checked**（没有读取该寄存器）。工具 **SHOULD** 分别报告它们：mismatch 表明映射表或设置有误，failed 表明连接或寻址有问题。
- 浮点数按该类型自身的精度比较（`float32` 的参考值按 32 位浮点数比较）。字符串在去掉末尾的 NUL 和空格字符之后比较。
- 参考值只用于辅助诊断。几种字节序或字序可能把相同的字节解码成相同的值（小数字或回文数在多种顺序下读起来相同），因此匹配并不能证明整个映射表正确。映射表 **SHOULD** 使用有特色的值，并且在设备具备时 **SHOULD** 提供多个。
- 在无法读取的寄存器（`access` 为 `"W"`）上设置 `reference` 是错误。

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 标识寄存器

`role` 标记那些能说明所连接的是哪台设备的寄存器，使工具可以据此核对映射表（第 9 节）：

- **`"model"`**：设备的型号名称或代码。它的值，或者它的 `enum` 标签（如果有的话），会与 `models` 比较。数字型的型号代码最好给出标签：`"enum": {"0x016A": "EM-100"}`。
- **`"firmware"`**：固件版本。字符串寄存器按文本读取，并使用其中第一个版本字符串（`"V2.01b"` 得到 `2.01`）。数字则取其工程值（`scale` 为 `0.01` 时，`102` 得到 `1.02`）。当多个寄存器具有此角色时，它们的值按文件中的顺序用点连接，这适合把主版本号和次版本号分开存放的设备，例如作为同一个寄存器的两个位字段（`"bit": 8, "bits": 8` 和 `"bit": 0, "bits": 8`）。
- **`"serial"`**：序列号。工具 **MAY** 显示它；但从不用来比较。

最多一个寄存器 **MAY** 具有 `"model"` 角色，最多一个具有 `"serial"` 角色。带有角色的寄存器 **MUST** 可读。其余方面，带角色的寄存器与普通寄存器相同：与其他寄存器一样被读取和显示，也可以带有 `reference`。

### 4.8 来自设备的标识（FC17、FC43）

有些设备通过自己的功能报告其身份，没有标识寄存器。`identify` 说明发送哪个功能，以及标识在应答中的位置，这样工具可以像核对 4.7 的寄存器一样核对映射表（第 9 节）。一个映射表最多有一个 `identify`。

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

| 键 | JSON 类型 | 默认值 | 含义 |
|---|---|---|---|
| `function` | `17` 或 `43` | | `17`：报告从站 ID。`43`：读设备标识（封装接口传输，MEI 类型 `0x0E`） |
| `fields` | 字段对象的非空数组 | | 要从应答中取出的值 |

每个字段是一个对象。`name` 始终必需。`role` 和下面的键取决于 `function`。

| 键 | JSON 类型 | 默认值 | 含义 |
|---|---|---|---|
| `name` | 非空字符串 | | 面向用户显示的名称 |
| `role` | `"model"`、`"firmware"`、`"serial"` | | 值的含义，与寄存器相同（4.7）。最多一个 `"model"` 和一个 `"serial"` |
| `offset` | 整数 ≥ 0 | | **仅 FC17，必需。** 字段在应答数据中的位置，以字节计。偏移 `0` 是字节计数之后的第一个字节，因此数据就是设备手册中“字节计数”之后列出的字节 |
| `type` | `"uint8"`、`"uint16"`、`"string"` | | **仅 FC17，必需。** `uint16` 为大端序。`string` 为 ASCII，去掉末尾的 NUL 和空格字符 |
| `length` | 整数 ≥ 1 | | **仅 FC17。** 长度，以字节计。`string` 必需 |
| `enum` | 表名或内联表 | | **仅 FC17。** 把数字翻译成标签（4.1）。型号代码最好给出标签，然后用它与 `models` 比较 |
| `object` | 整数 0–255 | | **仅 FC43，必需。** 对象 ID：`0x00` VendorName，`0x01` ProductCode，`0x02` MajorMinorRevision，`0x03` VendorUrl，`0x04` ProductName，`0x05` ModelName，`0x06` UserApplicationName，`0x80`–`0xFF` 由设备定义 |

- **FC43：**对象的值是 ASCII 字符串，去掉末尾的 NUL 和空格字符。工具请求能涵盖各字段所指的全部对象的访问级别（基本、常规或扩展），并跟随“后续还有”标志，直到取得所有对象。对于 `"firmware"`，与字符串寄存器一样，使用文本中的第一个版本字符串（4.7）。
- **两种功能：**设备按单元 ID 应答，而不是按寄存器地址，所以 `address_base` 不适用。
- **没有值：**应答比字段所需的短、异常应答、缺少对象，或设备不支持该功能，都得不到值。检查结果是**未知**（第 9 节），而不是不匹配。
- **多个来源：**`identify` 和带有 `role` 的寄存器可以同时存在。当两者对同一角色都给出值时，工具 **SHOULD** 使用寄存器，并且对于没有寄存器给出的角色 **MAY** 使用 `identify`。

### 4.9 分开请求读取

读取方通常会把相邻的寄存器合并成一个请求。有些设备会拒绝跨越两个内部表边界的请求，即使其中每个寄存器都存在。两个可选的键用来限制寄存器如何合并：

- **`read_alone`**：`true` 表示该寄存器在不含其他寄存器的请求中读取。位字段和占用相同字的其他寄存器视为同一个寄存器。
- **`read_group`**：一个名称。名称相同的寄存器 **MAY** 在一个请求中读取，并且一个请求 **MUST NOT** 包含不同分组的寄存器，也不能包含没有分组的寄存器。没有 `read_group` 的寄存器按原来的方式合并。

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

两个键同时存在时，`read_alone` 优先。这两个键只限制合并：读取方可以自由发出比所需更多的请求，`max_read_registers` 和 `max_read_bits` 仍然适用。它们只影响寄存器如何请求，不影响其含义，所以不认识它们的读取方读取的是相同的寄存器，并按原来的方式合并。这就是它们不需要新的 `mbmap` 版本的原因（第 8 节）：在拒绝合并请求的设备上，旧的读取方与没有这些键时一样失败。

### 4.10 块的各部分

有些设备把多个值放在一个块里，并且只接受整个块：从块中间开始的写入，或者没有覆盖整个块的写入，会被拒绝（异常 `0x02` 或 `0x03`）。典型的例子是短信网关，其块中先是收件人号码，然后是短信文本。映射表仍像以前一样把这个块描述为**一个**寄存器，并由 `parts` 说明其中的内容：

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| 键 | JSON 类型 | 默认值 | 含义 |
|---|---|---|---|
| `name` | 非空字符串 | | 面向用户显示的名称 |
| `offset` | 整数 ≥ 0 | | 该部分在块中的位置，以**寄存器**为单位，从该寄存器的第一个寄存器算起 |
| `type` | `"string"` 或数值类型（第 6 节） | `"string"` | 该部分如何读取和写入 |
| `length` | 整数 ≥ 1 | | 寄存器数量。`string` 必需，其他类型忽略 |
| `description` | 字符串 | | 自由文本 |

- `parts` 只用于 `string` 寄存器。它 **MUST NOT** 为空。每个部分 **MUST** 位于块之内（`offset` 加上其寄存器数最多等于该寄存器的 `length`），并且各部分 **MUST NOT** 重叠。没有任何部分覆盖的寄存器是允许的：它们是填充。
- 寄存器本身保持原来的含义。不认识 `parts` 的读取方，仍像以前一样以一个请求把整个块作为一个字符串读写，所以这样的映射表在所有工具中都能继续使用。
- 认识 `parts` 的工具 **SHOULD** 把每个部分显示为单独的字段。读取时，它用该寄存器的 `byte_order` 和 `word_order`（第 6 节）从块中解码每个部分。写入时，它由各部分构建**整个**块，并以一个请求发送（FC16）：用户留空的部分以零字节发送，因此空字段不会意外保留旧值。工具 **MUST NOT** 发送只覆盖部分内容的写入，因为设备会拒绝它。
- `string` 部分为 ASCII，用 NUL 字符填充到其 `length`。对于超过 `2 × length` 个字符的文本，工具 **MUST** 拒绝。数值部分按常规方式编码（第 6 节）。
- `access` 沿用该寄存器的：各部分不能比块更可写。
- `parts` 只描述寄存器内部的内容，因此不需要新的 `mbmap` 版本（第 8 节）。忽略它的读取方行为与以前相同。

#### 字的位字段

有些设备把多个设置放在一个字里，并且只接受**整个**字：只设置一位的写入会把其他位清零。同一个 `parts` 键用来描述 `uint16`、`uint32` 或 `uint64` 寄存器上的这种字。寄存器仍然是一个普通数字，所以不认识 `parts` 的读取方会像以前一样读写它。

```json
{
  "name": "Control word", "area": "holding", "address": 2001, "type": "uint32", "access": "RW",
  "parts": [
    {"name": "Command", "bit": 0, "bits": 4, "enum": "command", "description": "Play, ready or stop"},
    {"name": "Error acknowledge", "bit": 4},
    {"name": "Enable unit 1", "bit": 21}
  ]
}
```

| 键 | JSON 类型 | 默认值 | 含义 |
|---|---|---|---|
| `name` | 非空字符串 | | 面向用户显示的名称 |
| `bit` | 整数 ≥ 0 | | 字段的最低位；0 = 按寄存器的 `byte_order` 和 `word_order` 解码后的值的最低有效位（6） |
| `bits` | 整数 ≥ 1 | `1` | 字段的宽度 |
| `enum` | 字符串 | | 字段值所用转换表的名称（4.1） |
| `description` | 字符串 | | 自由文本 |

- `bit` + `bits` **MUST NOT** 超过寄存器的宽度（16、32 或 64）。字段 **MUST NOT** 重叠。允许存在没有字段覆盖的位：它们未使用或为保留位。
- 位字段没有 `offset`、`length` 和 `type`：这些属于 `string` 寄存器的各部分，两种不会在同一个寄存器里混用。
- 认识 `parts` 的工具 **SHOULD** 把每个字段单独显示。读取时，从解码后的值中取出字段。写入时，用各字段组成**整个**值（未设置的字段按 0 发送），并用一个请求（FC16）写入该字的所有寄存器。它 **MUST NOT** 发送只覆盖部分字段或寄存器的写入。
- `access` 与寄存器相同。可读寄存器中的只读位字段仍在寄存器本身使用 `bit` 和 `bits`（4.3）；`parts` 用于必须整体写入的字。
- 使用这类 `parts` 的寄存器在旧版验证器中会失败（`bad-parts`：此前 `parts` 只用于字符串），但忽略 `parts` 的读取方仍像以前一样读取该寄存器。因此不需要新的 `mbmap` 版本（8）。

## 5. 区域和地址

| `area` | 单位 | 读取 | 写入 | 允许的 `access` |
|---|---|---|---|---|
| `coil` | 位 | FC01 | FC05 / FC15 | `R`、`W`、`RW` |
| `discrete` | 位 | FC02 | — | `R` |
| `input` | 16 位寄存器 | FC04 | — | `R` |
| `holding` | 16 位寄存器 | FC03 | FC06 / FC16 | `R`、`W`、`RW` |

当 `address_base` 为 `0` 时，`address` 就是线路上发送的地址（0–65535）。当 `address_base` 为 `1` 时，线路上的地址是 `address − 1`（1–65536），这与从 1 开始为寄存器编号的手册一致。

5 位和 6 位的“Modicon”记法（`40001`、`300010`）在 `address` 中**无效**。请将其写成区域加数字：`40001` 变为 `"area": "holding"`、`"address": 1`，并设置 `"address_base": 1`。

## 6. 类型、字节序和字序

| `type` | 寄存器数 | 说明 |
|---|---|---|
| `bool` | — | 在 `coil`/`discrete` 中：一位。在 `input`/`holding` 中：寄存器的一位，因此 `bit` 必需 |
| `int16`、`uint16` | 1 | |
| `int32`、`uint32`、`float32` | 2 | 浮点数为 IEEE 754 |
| `int64`、`uint64`、`float64` | 4 | |
| `string` | `length` | 每个寄存器 2 个 ASCII 字符。读取时去掉末尾的 NUL 和空格字符 |

两个相互独立的设置说明数值的字节如何到达：

- **`byte_order`**，在每个 16 位寄存器内部：`"big"` 先发送高字节（Modbus 标准），`"little"` 先发送低字节。
- **`word_order`**，在 32 位或 64 位数值的各寄存器之间：`"big"` 把最高有效寄存器放在最前（地址最低），`"little"` 则把最低有效寄存器放在最前。

顶层键设置文件的默认值；寄存器的 `byte_order` 和 `word_order` 各自可单独覆盖它（只设置 `"word_order": "little"` 的寄存器保留文件的字节序）。

| 类型 | `byte_order` | `word_order` |
|---|---|---|
| `bool` | 不使用 | 不使用 |
| `int16`、`uint16` | 交换寄存器的两个字节 | 不使用（只有一个寄存器） |
| `int32`、`uint32`、`float32` | 交换每个寄存器的两个字节 | 决定 2 个寄存器中哪个是高字 |
| `int64`、`uint64`、`float64` | 交换每个寄存器的两个字节 | `"little"` 把 4 个寄存器作为整体反转 |
| `string` | `"big"`：先收到的字节是第一个字符；`"little"`：第二个收到的字节是第一个字符 | 不使用（寄存器按地址顺序读取） |

对于 64 位数值，小字序会把四个寄存器的整个序列反转；它并不是分别交换两个 32 位的半部分。

32 位数值 `0x0A0B0C0D` 在线路上的顺序：

| `byte_order` | `word_order` | 线路上的字节 | 常见名称 |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Modbus 标准 |
| `big` | `little` | `0C 0D 0A 0B` | “字交换”，许多电表和 PLC 使用 |
| `little` | `big` | `0B 0A 0D 0C` | “字节交换”（少见） |
| `little` | `little` | `0D 0C 0B 0A` | 小端序 |

## 7. 校验

读取方 **SHOULD** 用下列代码之一和指向该值的 [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901)（`/registers/3/address`、`/enums/relay`）报告每个问题，使各工具对错误所在的认定一致。属于整个文件的问题没有指针。**error（错误）**会使文件无效。**warning（警告）**会被报告，但文件仍可使用。

| 代码 | 严重程度 | 何时出现 |
|---|---|---|
| `not-utf8` | error | 文件不是有效的 UTF-8 |
| `not-json` | error | 文件不是一个有效的 JSON 对象，或者在某个对象中重复了某个键。按整个文件报告：各解析器给出的语法错误位置不同，所以位置写在消息里 |
| `bad-json-type` | error | 已知的键持有错误的 JSON 类型（该用数字的地方用了字符串、`null` 等） |
| `missing-key` | error | 缺少 `mbmap`、`vendor`、`model` 或 `registers`（针对整个文件），或者某个寄存器缺少 `name`、`area`、`address` 或 `type`，或者其值为空（针对该寄存器） |
| `bad-meta-value` | error | 顶层键的取值超出其允许的集合或范围，包括 `mbmap` 不是 `2` |
| `bad-area` | error | 未知的 `area`，或者没有用小写书写 |
| `bad-type` | error | 未知的 `type`，或者没有用小写书写 |
| `type-area` | error | 在 `coil` 或 `discrete` 中使用了 `bool` 以外的类型 |
| `bad-address` | error | `address` 不是整数 |
| `address-range` | error | 地址低于 `address_base`，或者数值超出地址 65535 |
| `missing-bit` | error | `input`/`holding` 中的 `bool` 没有 `bit` |
| `bad-bit` | error | `bit` 超出 `0`–`15` |
| `missing-length` | error | `string` 没有 `length` |
| `bad-length` | error | `length` 不是 ≥ 1 的整数 |
| `bad-access` | error | 未知的 `access`（或者不是大写），或者对该 `area` 不允许 |
| `bad-byte-order` | error | 寄存器的 `byte_order` 或 `word_order` 不是 `"big"` 或 `"little"` |
| `bad-enum` | error | 枚举表（2.2）的键不是整数、标签为空、值重复或没有条目，或者 `enums` 的名称不是 `a`–`z`、`0`–`9`、`_` |
| `bad-sentinel` | error | `sentinels` 指明了不支持的类型，或者某个表无效（2.2），或者有不符合该类型的值 |
| `bad-bits` | error | `bits` 不是 1 到 16 的整数、用在 `uint16` 以外的类型或 `input`/`holding` 之外、没有 `bit`，或者 `bit` + `bits` 超过 16 |
| `unknown-enum` | error | `enum` 指明了 `enums` 中没有定义的表 |
| `bad-write-limit` | error | `write_min` 大于 `write_max` |
| `bad-reference` | error | `reference` 不是该寄存器 `type` 的有效原始值（不是整数、超出该类型的范围、比位字段更宽、`bool` 不是布尔值、浮点数不是有限数、比字符串更长），或者设置在无法读取的寄存器上 |
| `unknown-scale-factor` | error | `scale_factor` 指明的寄存器在文件中不存在（有错误的寄存器不计） |
| `bad-scale-factor` | error | `scale_factor` 设置在 `bool` 或 `string` 上，或者指明的寄存器不是完整的整数（浮点数、`bool`、`string` 或位字段），或者它自身带有 `scale_factor` |
| `bad-version` | error | 文件或寄存器中的 `firmware_min` 或 `firmware_max` 不是版本字符串（3.2） |
| `bad-firmware-range` | error | 文件或寄存器中的 `firmware_min` 晚于 `firmware_max` |
| `bad-source` | error | `sources` 中的某一项不是带有非空 `title` 的对象，或者其 `version`、`date`、`url`、`note`、`accessed` 或 `sha256` 的格式有误 |
| `bad-role` | error | `role` 不是 `"model"`、`"firmware"` 或 `"serial"`，设置在无法读取的寄存器上，或者 `"model"` 或 `"serial"` 被使用了多次 |
| `bad-identify` | error | `identify` 无效（4.8）：`function` 不是 `17` 或 `43`，`fields` 为空，或者某个字段缺少 `name`、其 `role` 未知或 `"model"`、`"serial"` 重复，或者违反其功能的规则（FC17：`offset` 缺失或为负，`type` 缺失或未知，`string` 没有 `length`，`enum` 指明的表不存在或不是有效的表，带有 `object`；FC43：`object` 缺失或超出 0–255，带有 `offset`、`type`、`length` 或 `enum`） |
| `bad-parts` | error | `parts` 为空，设置在不是带有效 `length` 的 `string` 的寄存器上，或者某个部分没有 `name` 或 `offset`、`offset` 为负、`type` 未知或为 `bool`、`string` 部分没有 `length`、某个部分超出块的范围，或者各部分重叠；对 `uint16`、`uint32` 或 `uint64` 寄存器，第一个条件不适用，各部分是位字段：此时的错误是没有 `bit` 的部分、负的 `bit`、小于 1 的 `bits`、带有 `offset`、`length` 或 `type`、超出寄存器宽度的字段，或重叠的字段；`enum` 没有对应的表则为 `unknown-enum`（4.10） |
| `no-rows` | warning | `registers` 为空 |
| `duplicate-name` | warning | 同一个 `name` 被固件范围重叠的多个寄存器使用（3.2） |
| `model-list` | warning | `model` 用“ / ”分隔列出了多台设备；请给出系列名称，并在 `models` 中列出这些设备（3.2） |
| `overlap` | warning | 某个值从同一区域中另一个值的寄存器内部开始，这通常意味着地址或类型有误。从同一地址开始的寄存器是对同一数据的不同读法（例如一个代码既按数字又按文本读取），从不算重叠；同一寄存器的位和位字段（`bool` + `bit`、`uint16` + `bit` + `bits`）以及固件范围不重叠的寄存器也不算 |
| `firmware-outside-map` | warning | 寄存器的固件范围与文件的固件范围没有共同的版本，因此永远不适用 |
| `bad-read` | error | `read_group` 是空字符串 |
| `unknown-key` | warning | 寄存器带有本规范中没有、也不以 `x_` 开头的键 |
| `unused-write-limit` | warning | `write_min` 或 `write_max` 设置在不起作用的寄存器上（`bool`、`string`，或 `access` 为 `"R"`） |
| `unused-bit` | warning | `bit` 设置在不起作用的寄存器上（除 `bool` 外的任何类型，除非 `uint16` 上同时设置了 `bits`） |

`name`、`area`、`address` 或 `type` 有错误的寄存器不再做进一步检查。有任何错误的寄存器不参与 `overlap` 检查。

[JSON Schema](schema/mbmap-2.schema.json) 检查结构、JSON 类型和取值范围；涉及多个值关系的规则（`unknown-enum`、比例因子、`overlap`、`address-range`、按类型的 `bad-reference`、重复键）需要代码来实现。[`tests/`](tests/) 文件夹中有示例文件，并列出了每个文件必须产生的诊断，任何实现都可以据此自我检查。

## 8. 兼容性和版本管理

- 读取方 **MUST** 忽略不认识的键，无论在顶层还是在寄存器中。这样较新的文件可以在较旧的读取方中打开。
- 厂商或工具专用的键 **SHOULD** 以 `x_` 开头（`"x_modbench_icon"`、`"x_alarm_high"`），这样它们不会与本规范未来的版本冲突。它们的值 **MAY** 是任何 JSON 类型。
- `mbmap` 是**主**版本号。读取方 **MUST** 拒绝其 `mbmap` 不被支持的文件，并且 **SHOULD** 说明发现的是哪个版本。
- 新增较旧的读取方可以安全忽略的可选键时，不改变 `mbmap`。如果某个键被较旧的读取方忽略就会误解其含义，则需要新的主版本。
- schema 文件以主版本号命名（`mbmap-2.schema.json`），并且在其中只会增加可选键。

## 9. 对照所连接的设备检查映射表

读取所连接设备的标识寄存器（4.7）或 `identify` 描述的标识应答（4.8）的工具，**SHOULD** 将它们与映射表比较，这样用户就不会信任为另一种型号或固件编写的映射表中的数值。当设备不报告型号或固件时，也可以让用户手动指明。

每项检查有三种结果之一：

| 结果 | 型号 | 固件 |
|---|---|---|
| **match** | 设备的型号（不区分大小写，忽略首尾空格）是 `models`（或 `model`）之一 | 设备的版本在 `firmware_min` … `firmware_max` 之内 |
| **mismatch** | 不是 | 超出该范围 |
| **unknown** | 映射表没有 `"model"` 寄存器、无法读取它，或它没有给出值 | 映射表没有 `"firmware"` 寄存器、无法读取它、在其中找不到版本字符串，或者映射表没有声明范围 |

工具对每种结果的处理：

- **match**：无需报告；工具 **MAY** 显示设备已被识别。
- **mismatch**：工具 **SHOULD** 明确发出警告，说明映射表期望什么以及设备报告了什么，并且在第一次向设备写入之前 **SHOULD** 请求确认。它 **MUST NOT** 因此停止读取：读取是无害的，而且用户可能更清楚（贴牌设备，或者保留了相同寄存器的较新固件）。
- **unknown**：不是问题。大多数设备不报告型号或固件，大多数映射表适用于所有固件。工具 **MUST NOT** 将其视为 mismatch，并且 **MAY** 提示映射表声明了一个无法检查的固件范围。

带有自身固件范围的寄存器（3.2）：

- 当固件**已知**时，工具 **SHOULD** 只使用其范围包含它的寄存器：其他寄存器在这台设备上不存在，因此被多个固件范围共用的寄存器名称就只表示一个寄存器。
- 当固件**未知**时，工具 **SHOULD** 读取所有寄存器，**SHOULD** 显示哪些寄存器依赖于固件（例如“固件 2.1 及更高版本”），并且 **MAY** 让用户选择版本。

没有 `models`、`firmware_min`、`firmware_max` 和标识寄存器的映射表不会与任何内容比较，这对于适用于其型号全部设备的映射表是正确的。

## 10. 旧文件

基于 CSV 的第 1 版格式已被弃用。新的读取方无需支持它；该格式的文件可以用 [`tools/migrate/migrate.py`](tools/migrate/migrate.py) 转换（见 [legacy/v1](legacy/v1/)）。
