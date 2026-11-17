# Modbus RTU, Modbus TCP, dan RS-485

Tiga nama yang sering tertukar.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Media | jalur serial, hampir selalu RS-485 (kadang RS-232) | Ethernet atau Wi-Fi |
| Pengalamatan | unit ID 1–247 pada bus | alamat IP dan port (502), ditambah unit ID |
| Pemeriksaan kesalahan | CRC-16 di setiap frame | pemeriksaan TCP sendiri; tanpa CRC |
| Pembingkaian | hening 3,5 karakter antar frame | header 7 byte (MBAP) dengan panjang |
| Perangkat per tautan | hingga 32 unit beban per segmen (lebih banyak dengan transceiver beban rendah), satu master | banyak klien per perangkat, dibatasi perangkat |
| Kecepatan umum | 9600–115200 baud | 10/100 Mbit/s, dibatasi perangkat |

**RS-485** hanyalah lapisan listrik: dua kabel, sinyal diferensial, sebuah bus. Modbus RTU berjalan di atasnya, begitu juga protokol lain (BACnet MS/TP, DMX, M-Bus lewat adaptor RS-485).

**Modbus ASCII** mengirim permintaan yang sama sebagai teks hex yang dapat dibaca; kini jarang dipakai.

<mb-adu></mb-adu>

## Register yang sama

Peta register sama apa pun transportnya: perangkat yang menawarkan keduanya menjawab dengan alamat, tipe, dan skala yang sama. Yang berubah adalah cara menjangkaunya: pengaturan serial dan unit ID pada RTU, alamat IP dan port pada TCP.

## Gateway

Gateway Modbus TCP-ke-RTU memungkinkan alat Ethernet menjangkau perangkat serial. Unit ID pada permintaan TCP memilih perangkat di sisi serial. Gateway menambahkan timeout-nya sendiri; jika perangkat di belakangnya tidak menjawab, periksa dahulu pengaturan serial pada gateway.

## Cara peta MBMap mencatatnya

Peta menyatakan transport apa yang ditawarkan perangkat (`protocol`: `rtu`, `tcp`, atau keduanya) dan nilai bawaannya (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`).
