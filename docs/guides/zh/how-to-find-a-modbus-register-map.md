# 如何找到设备的 Modbus 寄存器映射表

寄存器映射表（也叫 Modbus 表、点表、内存映射或通信协议）很少出现在安装说明里。可以从以下途径查找：

1. **在本库中搜索**型号、型号代码或别名。每个映射表都链接到它所依据的文档。
2. **制造商的下载区。** 用型号名称搜索“communication protocol”“Modbus protocol”“Modbus register map”“Modbus table”或“point map”。它往往是与用户手册分开的一份 PDF。
3. **完整的用户手册。** 许多手册把表放在靠后的章节中（“通信”“Modbus”“附录 B”）。
4. **配置软件。** 有些厂商把映射表放在软件内部，或者在软件旁附带一个 Excel 文件。
5. **系列文档。** 一个型号常常与其所属系列共用映射表（“EM24 DIN”“PM5000 系列”）。请确认系列手册涵盖了你的变体。
6. **询问制造商的技术支持。** 有些映射表只在要求时提供，有时需要签署保密协议；在发布依据它编写的映射表之前，请先确认你是否可以分享。
7. **其他项目的集成。** Home Assistant、openHAB、Node-RED 和 EVCC 的配置中常包含可用的寄存器列表，但请对照手册核实。

<mb-flow name="find"></mb-flow>

## 要在其中读什么

- **寻址约定**（线路地址、从 1 开始计数，或 Modicon）。参见[地址](modbus-address-off-by-one)。
- 每个值的**数据类型**、**字序**和**比例**。参见[字节序和字序](byte-and-word-order)和[比例](scaling-and-units)。
- **支持的功能码**，以及每次请求的最大寄存器数。
- **默认的串口设置**和单元 ID。

## 本库里没有？

[请求添加映射表](https://github.com/nobrega8/mbmap-library/issues/new/choose)并附上文档链接，或者自己编写一个：格式是简单的 JSON，[规范](/spec)解释了每个键。
