# Kode fungsi Modbus dan area register

Setiap permintaan Modbus menyebut sebuah kode fungsi. Kode itu menentukan tindakan sekaligus area perangkat yang menjadi sasarannya.

| Kode | Nama | Area | Ukuran |
|---|---|---|---|
| 01 | Read Coils | coil (0x) | bit, baca/tulis |
| 02 | Read Discrete Inputs | input diskret (1x) | bit, hanya baca |
| 03 | Read Holding Registers | holding register (4x) | 16-bit, baca/tulis |
| 04 | Read Input Registers | input register (3x) | 16-bit, hanya baca |
| 05 | Write Single Coil | coil | tulis `0xFF00` untuk hidup, `0x0000` untuk mati |
| 06 | Write Single Register | holding register | satu register |
| 15 (0x0F) | Write Multiple Coils | coil | beberapa bit |
| 16 (0x10) | Write Multiple Registers | holding register | beberapa register |
| 17 (0x11) | Report Server ID | — | identitas perangkat, format ditentukan perangkat |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | produsen, kode produk, revisi sebagai teks |

## Holding atau input?

Tabel di manual atau awalan alamat memberi tahu Anda: `3xxxx` dibaca dengan 04, `4xxxx` dengan 03. Beberapa perangkat menjawab kedua fungsi dengan data yang sama; yang lain menolak yang salah dengan pengecualian 01 (illegal function). Jika manual tidak memberi awalan maupun fungsi, coba 03 lebih dulu.

## Menulis

- Nilai 32-bit memerlukan dua register yang ditulis bersamaan dengan 16; menulis separuhnya satu per satu dengan 06 dapat meninggalkan perangkat dengan nilai campuran, atau ditolak.
- Beberapa perangkat hanya menerima 06, yang lain hanya 16. Daftar fungsi yang didukung dalam manual menentukannya.
- Coil yang ditulis dengan 05 harus membawa tepat `0xFF00` atau `0x0000`.

## Cara peta MBMap mencatatnya

Setiap register memiliki `area` (`coil`, `discrete`, `input`, `holding`) dan `access` (`R`, `W`, `RW`); alat memilih fungsi dari keduanya. Peta juga dapat menjelaskan fungsi identitas 17 dan 43, sehingga alat dapat memeriksa perangkat mana yang diajaknya bicara.
