# Timeout Modbus: perangkat tidak menjawab

Timeout berarti tidak ada yang kembali yang dapat diterima alat Anda. Telusuri daftar ini dari lapisan paling bawah ke atas.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Pengkabelan.** A dan B (atau D+ dan D−, atau + dan −) tidak diberi nama sama oleh setiap produsen. Jika tidak ada yang menjawab, tukar kedua kabel: tidak berbahaya.
2. **Ground bersama.** Hubungkan ground sinyal (GND, C, 0 V) bila perangkat memilikinya; kabel panjang tanpa itu menimbulkan kesalahan yang datang dan pergi.
3. **Terminasi.** Pasang resistor 120 Ω di kedua ujung bus, bukan di setiap perangkat. Kabel pendek di meja biasanya bekerja tanpanya.
4. **Pengaturan serial.** Baud rate, bit data, paritas, dan bit stop harus cocok persis. Pengaturan pabrik yang umum adalah 9600 atau 19200 baud, 8 bit data, paritas genap atau tanpa. Ketidakcocokan paritas tidak menimbulkan pesan apa pun.
5. **Unit ID.** Setiap perangkat di bus memerlukan alamatnya sendiri, 1 sampai 247. Perangkat yang diatur ke 1 tidak menjawab permintaan untuk 2. Lihat [unit ID](modbus-unit-id-slave-id).
6. **Satu master.** Dua master pada bus yang sama (sebuah PLC dan laptop) saling bertabrakan.
7. **Arah konverter.** Konverter USB–RS-485 murah kadang berpindah arah terlalu lambat pada baud rate tinggi. Coba kecepatan lebih rendah.

## Modbus TCP

1. **Jangkau perangkat lebih dulu.** Lakukan `ping` dan pastikan port 502 terbuka.
2. **Batas koneksi.** Banyak perangkat hanya menerima beberapa koneksi TCP. Alat yang membiarkan koneksi terbuka dapat mengunci yang lain sampai perangkat memutusnya karena timeout.
3. **Unit ID melalui gateway.** Di belakang gateway TCP-ke-RTU, unit ID memilih perangkat serial dan harus cocok dengan alamatnya; beberapa gateway memerlukan 0 atau 255 untuk dirinya sendiri.
4. **Modbus TCP aktif?** Beberapa perangkat dikirim dalam keadaan nonaktif, atau hanya menjawab di port lain.

## Perangkat menjawab beberapa permintaan tetapi tidak yang lain

- Permintaan yang terlalu besar, atau yang melintasi celah di tabel register, mungkin dijawab dengan pengecualian atau diabaikan. Baca blok yang lebih kecil.
- Beberapa perangkat memerlukan jeda antar permintaan (3,5 waktu karakter pada RTU, lebih lama untuk perangkat lambat). Naikkan interval polling.
- Beberapa menjawab hanya setelah tertunda puluhan atau ratusan milidetik; naikkan timeout respons sebelum hal lain.
