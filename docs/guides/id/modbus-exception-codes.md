# Kode pengecualian Modbus: apa yang disampaikan perangkat

Ketika perangkat Modbus memahami permintaan tetapi tidak dapat melaksanakannya, ia menjawab dengan pengecualian: kode fungsi dengan bit teratas disetel (`0x83` untuk pembacaan holding register yang gagal) dan kode satu byte.

| Kode | Nama | Penyebab umum | Yang bisa dicoba |
|---|---|---|---|
| 01 | Illegal function | Perangkat tidak mendukung kode fungsi ini: membaca input register (04) dari perangkat yang hanya punya holding register, atau menulis dengan 16 ke perangkat yang hanya menerima 06 | Gunakan kode fungsi yang tercantum manual untuk tabel itu |
| 02 | Illegal data address | Alamat tidak ada, atau blok yang diminta menabrak celah | Periksa [pergeseran alamat](modbus-address-off-by-one); baca lebih sedikit register sekaligus |
| 03 | Illegal data value | Jumlah terlalu besar (lebih dari 125 register) atau nilai yang ditulis di luar rentang | Baca blok yang lebih kecil; periksa rentang yang diizinkan sebelum menulis |
| 04 | Server device failure | Perangkat gagal saat melakukannya; beberapa perangkat memakainya untuk setiap penulisan yang ditolak atau untuk membaca blok yang tidak diizinkan | Baca satu register sekaligus; periksa keadaan perangkat |
| 05 | Acknowledge | Diterima, tetapi perlu waktu (pemrograman, penyimpanan) | Tunggu, lalu lakukan polling |
| 06 | Server device busy | Perangkat sibuk | Coba lagi nanti |
| 0A | Gateway path unavailable | Gateway tidak dapat menjangkau perangkat di belakangnya | Periksa sisi serial gateway dan perutenannya |
| 0B | Gateway target failed to respond | Gateway meneruskan permintaan tetapi perangkat tidak menjawab | Periksa unit ID, baud rate, dan pengkabelan di belakang gateway |

<mb-exceptions></mb-exceptions>

## Tidak ada jawaban sama sekali bukan pengecualian

Perangkat yang menerima frame dengan CRC salah, unit ID salah, atau kesalahan paritas akan diam: Anda mendapat timeout, bukan pengecualian. Lihat [timeout](modbus-timeout-no-response).

## Blok yang melintasi celah

Banyak perangkat menolak pembacaan yang mencakup alamat tak terpakai, meskipun setiap register yang Anda perlukan ada. Jika membaca 20 register gagal dengan 02 tetapi membacanya satu per satu berhasil, pecah permintaan di celahnya. Peta dapat menyatakan berapa register yang diterima perangkat per permintaan (`max_read_registers`).
