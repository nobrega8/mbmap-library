# Urutan byte dan urutan word: saat nilai 32-bit keluar salah

Tegangan terbaca 1,7 × 10³⁸, penghitung energi melompat 65.536 sekali waktu, atau suhu menjadi angka negatif kecil. Register-nya benar; urutan penyusunan dua register dari nilai 32-bit yang tidak benar.

## Satu register mudah, dua tidak

Register Modbus berukuran 16 bit, dikirim dengan byte paling signifikan lebih dulu. Standar tidak mengatur nilai yang lebih panjang dari satu register, sehingga setiap produsen memilih sendiri cara membagi bilangan bulat atau float 32-bit ke dua register (dan nilai 64-bit ke empat register).

Keempat urutan biasanya dinamai dari byte nilai, dengan `A` sebagai yang paling signifikan:

| Nama | Register 1 | Register 2 | Disebut juga |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, word tinggi dahulu |
| `CDAB` | C D | A B | tukar word, word rendah dahulu, LSW first |
| `BADC` | B A | D C | tukar byte |
| `DCBA` | D C | B A | little-endian, keduanya ditukar |

`ABCD` dan `CDAB` mencakup hampir semua perangkat. `CDAB` umum pada Schneider, Carlo Gavazzi, dan banyak meter buatan Tiongkok; `ABCD` pada Siemens, Janitza, dan sebagian besar perangkat SunSpec.

<mb-byte-order></mb-byte-order>

## Cara menemukan yang benar

1. **Baca bagian format data di manual.** Cari “word order”, “LSW first”, “MSW first”, “high word first”, atau “big endian”.
2. **Baca nilai yang Anda ketahui.** Baca tegangan yang seharusnya sekitar 230 V sebagai float dalam setiap urutan. Hanya satu yang memberi angka masuk akal.
3. **Amati sebuah penghitung.** Jika register rendah penghitung energi meluap ke bagian yang oleh alat Anda ditampilkan sebagai bagian tinggi, tukar word-nya.
4. **Periksa nilai 64-bit secara terpisah.** Beberapa perangkat menyimpan nilai 32-bit dengan word tinggi dahulu dan nilai 64-bit dalam urutan lain.

## String

Teks biasanya dua karakter per register, dengan karakter pertama di byte tinggi. Beberapa perangkat menaruh karakter pertama di byte rendah, sehingga “EM24” terbaca “ME42”.

## Cara peta MBMap mencatatnya

Peta menetapkan `byte_order` dan `word_order` untuk seluruh perangkat, dan register mana pun dapat menimpanya. Halaman perangkat menampilkan urutan setiap nilai multi-register dalam notasi di atas (misalnya `float32 CDAB`), dan ekspor Home Assistant mengubahnya menjadi opsi `swap:` yang tepat.
