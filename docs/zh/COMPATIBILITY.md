# 兼容性

读取 `.mbmap` 文件的工具，以及它们各自支持格式（[SPEC.md](SPEC.md)）的哪些部分。

## 工具

| 工具 | 简介 | 对映射表的处理 |
|---|---|---|
| <img src="https://raw.githubusercontent.com/nobrega8/modbench/main/assets/icon.svg" width="20" height="20" alt="" align="top"> [Modbench](https://github.com/nobrega8/modbench) | 适用于 Windows、Linux 和 macOS 的 Modbus TCP/UDP/RTU/ASCII 客户端，带命令行（`modbench-cli`）和 MCP 服务器 | 打开映射表，并按寄存器名称读取（和写入）设备；浏览和下载本库；运行依照映射表构建的模拟设备。命令行方面：`validate` 和 `convert` 映射表，`map` 从设备读取映射表的所有寄存器；MCP 工具 `read_map` 和 `validate_map` 为 AI 助手提供同样的功能 |
| <img src="assets/tools/scanbus-br.png" width="20" height="20" alt="" align="top"> [ScanBus-BR](https://github.com/ortegahernandes/ScanBus-BR-Simulator-Modbus) | 适用于 Windows 和 Linux 的免费 Modbus RTU/TCP 主站、从站模拟器和 RTU 嗅探器（自 5.2.0 版起） | 搜索本库并显示设备的寄存器（名称、功能码、地址）；将寄存器名称导入为别名，并填入第一个寄存器的功能码、起始地址、类型和字节序，以及映射表的单元 ID、波特率和校验位。其主表读取连续的块（起始地址和数量），而不是按名称读取单个寄存器；点击某个寄存器会在单独的窗口中打开该寄存器。显示每个映射表的状态，并可将映射表保存为 CSV（仅寄存器）、TXT 或 RTF（含说明和备注） |
| <img src="assets/tools/mtui.png" width="20" height="20" alt="" align="top"> [MTUI](https://github.com/inowattio/MTUI) | 键盘驱动的终端 Modbus TCP/RTU 客户端，适用于 Windows、Linux 和 macOS，并有网页演示（自 1.6.0 版起） | 导入粘贴的映射表：每个寄存器被固定并以其名称和单位标注，还会获得一条规则，用于解码其类型、字节序和字序、比例、偏移和对照表。无法解码的寄存器（字符串、多位字段）只保留标签 |
| <img src="assets/tools/modbus-tools.png" width="20" height="20" alt="" align="top"> [Modbus Tools](https://github.com/serhmarch/ModbusTools) | Modbus 客户端（ModbusClient）和服务器模拟器（ModbusServer），适用于 Windows 和 Linux，支持 TCP、UDP、RTU 和 ASCII（尚未发布：该支持已合并到 `v0.5dev` 分支） | **Data › Import Data View…** 和 **Import Items…** 接受 `.mbmap.json` 文件：每个寄存器成为一个数据视图条目（地址、格式、字节序和字序，以及包含名称、单位、比例和偏移的备注），视图以映射表命名。寄存器中的位字段和 `bool` 位会合并成每个寄存器一个 `Bin16` 条目，其备注写明每一位。导出不变 |
| <img src="assets/tools/open-modscan.png" width="20" height="20" alt="" align="top"> [Open ModScan](https://github.com/sanny32/OpenModScan) | 适用于 Windows 和 Linux 的免费 Modbus 主站（客户端）（已合并到 `dev` 分支，尚未发布：1.16.2 版没有它） | File › Open 接受 `.mbmap.json` 文件：寄存器按区域、显示模式和字节序分组到各个窗口（最多容许 10 个地址的空隙，且在读取限制之内），每个窗口设置好点类型、起始地址、长度、设备 ID、地址基数和显示模式，寄存器名称（含单位和比例）作为地址说明。超过 8 个窗口的映射表会打开一个列表供选择。File › Device Map Library 会下载本库的索引，带筛选地列出映射表，并打开所选的那个 |

## 按功能的支持情况

图例：**Yes** 支持 · **Kept** 读取并写回，但不显示 · **—** 不支持或未说明。

| 功能（SPEC.md 章节） | <img src="https://raw.githubusercontent.com/nobrega8/modbench/main/assets/icon.svg" width="16" height="16" alt="" align="top"> Modbench | <img src="assets/tools/scanbus-br.png" width="16" height="16" alt="" align="top"> ScanBus-BR | <img src="assets/tools/mtui.png" width="16" height="16" alt="" align="top"> MTUI | <img src="assets/tools/modbus-tools.png" width="16" height="16" alt="" align="top"> [Modbus Tools](https://github.com/serhmarch/ModbusTools) | <img src="assets/tools/open-modscan.png" width="16" height="16" alt="" align="top"> [Open ModScan](https://github.com/sanny32/OpenModScan) |
|---|---|---|---|---|---|
| 格式版本 2，JSON（§2、§3） | Yes | Yes：来自本库的映射表 | Yes：以 JSON 粘贴 | Yes：仅版本 2；其他版本和无效的 JSON 会被拒绝并给出提示 | Yes：仅版本 2；其他版本会被拒绝并给出提示 |
| 格式版本 1，CSV（§10，已弃用） | Yes：打开时给出警告，并转换为版本 2 | — | — | — | — |
| 所有类型：`bool`、16/32/64 位整数、`float32`、`float64`、`string`（§6） | Yes | Yes：使用第一个寄存器或所点击寄存器的类型 | Yes：仅作标注 | Yes：每种成为一种数据视图格式；`bool` 仅限 `coil` 和 `discrete`，`string` 每个寄存器 2 个字符 | Yes：作为显示模式显示（整数、浮点数、ANSI 字符串）；寄存器中的 `bool` 是一个位 |
| `byte_order` 和 `word_order`，按文件和按寄存器（§6） | Yes，并且用户可以覆盖映射表的字节序 | Yes：使用第一个寄存器或所点击寄存器的字节序 | Yes | Yes：按文件和按寄存器 | Yes：按文件和按寄存器 |
| `address_base` 0 和 1（§5） | Yes | — | Yes | Yes | Yes |
| 连接默认值：`protocol`、`unit_id`、`port`、`baudrate`、`parity`、`databits`、`stopbits`（§3） | Yes：打开映射表时自动填入 | 仅 `unit_id`、`baudrate` 和 `parity`：未连接时填入，并且可以编辑 | — | — | 仅 `unit_id`：各窗口的设备 ID |
| `max_read_registers`、`max_read_bits`（§3） | Yes：更长的读取会被拆分 | — | — | — | Yes：窗口保持在其限制之内 |
| 对照表，具名（`enums`）和内联（§4.1） | Yes：显示标签，并在写入时提供选择 | — | Yes：显示标签 | — | — |
| 哨兵值（§4.2） | Yes：显示为其标签，不计入图表和报警 | — | — | — | — |
| 位字段，`bit` 和 `bits`（§4.3） | Yes：读取，并且写入时只修改该字段 | — | 仅 `bit`：同一寄存器的各位共用一条规则；`bits` 仅作标注 | Yes：每个寄存器一个 `Bin16` 条目，其备注写明每一位或字段 | Yes：以二进制显示，每一位或字段的名称在说明中 |
| 比例因子寄存器，`scale_factor`（§4.4） | Yes：指数寄存器与数值一起读取 | — | — | — | — |
| 写入限制，`write_min` 和 `write_max`（§4.5） | Yes：超出范围的值在写入前被拒绝 | — | — | — | — |
| 参考值（§4.6） | Yes：显示匹配、不匹配和检查失败 | — | — | — | — |
| 标识寄存器，`role`，以及 `models`（§4.7、§9） | Yes：根据映射表的型号和固件核对设备 | — | — | — | — |
| 来自设备的标识，使用 FC17 或 FC43 的 `identify`（§4.8、§9） | Yes：读取、校验，在保存映射表时保留，并通过“检查设备”（应用和命令行）与映射表的型号和固件比较。FC43 完整。运行指示字节不是 `0x00` 或 `0xFF` 的 FC17 应答会被 Modbus 库拒绝，因此这些设备的检查结果为未知。映射表构建器暂时还没有相应字段 | — | — | — | — |
| 单独的读取请求，`read_alone` 和 `read_group`（§4.9） | Yes：校验，并在规划读取时遵守（轮询和 Node-RED 导出）。映射表构建器暂时还没有相应字段 | — | — | — | — |
| 块的各部分，`parts`（§4.10） | Yes（0.7.3）：读取、校验，在保存映射表时保留。写入列表和寄存器表将各部分显示为单独的字段；写入时由各部分组成整个块，并通过一次请求发送，读取时数值会被拆分为各部分 | — | — | — | — |
| 固件范围，按映射表和按寄存器（§3.2、§9） | Yes：一旦知道固件版本，就只读取适用的寄存器 | — | — | — | — |
| `revision` 和 `revised`（§3.1） | Yes：随映射表显示 | — | — | — | — |
| `source`、`sources`、`notes`、`comment`（§3.3、§2） | Kept | 备注和说明：将映射表保存为 TXT 或 RTF 时包含 | — | — | — |
| 校验代码（§7） | Yes：全部支持，使用相同的代码和 JSON Pointer；已对照 [`tests/`](tests/) 检查 | — | — | — | — |
| `x_status`（本库的约定，不属于格式） | Yes：在库和映射表选择器中显示为图标 | Yes：显示为指示标记（官方、非官方、已验证） | — | — | — |

## 添加工具

正在开发读取 `.mbmap` 的工具？请遵循 [SPEC.md](SPEC.md)，并对照 [`tests/`](tests/) 中的示例文件检查：每个文件都列出了读取方必须报告的诊断信息。然后提交拉取请求，把您的工具及其支持的内容添加到本页。部分支持也可以：请说明读取了哪些部分、忽略了哪些部分。
