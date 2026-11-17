# Kesalahan CRC Modbus pada RS-485

Kesalahan CRC berarti sebuah frame tiba tetapi checksum-nya tidak cocok: byte berubah atau hilang di perjalanan. Berbeda dengan alamat yang salah, ini menunjuk pada tautan fisik atau pewaktuan.

## Penyebab umum

- **Noise.** Kabel tanpa selubung yang dipasang berdampingan dengan kabel daya atau drive. Gunakan kabel twisted pair berselubung dengan selubung di-ground hanya di satu ujung.
- **Terminasi kurang atau berlebih.** Satu resistor 120 Ω di setiap ujung bus; tidak ada di antaranya.
- **Tanpa bias.** Bus yang menganggur tanpa resistor bias mengambang, dan byte pertama frame dapat terbaca salah. Banyak konverter dan master memiliki opsi bias.
- **Cabang dan kabel bintang.** RS-485 menginginkan satu jalur dari perangkat ke perangkat, bukan percabangan.
- **Baud rate sedikit meleset** pada konverter murah atau pada kecepatan tinggi. Coba baud rate lebih rendah.
- **Frame menyatu.** Jika master mengirim permintaan berikutnya sebelum bus sunyi selama 3,5 waktu karakter, perangkat melihat satu frame panjang yang rusak. Perbesar jeda antar permintaan.
- **Dua master**, atau perangkat yang menjawab pada alamat yang sama dengan perangkat lain.

<mb-crc></mb-crc>

## Langkah-langkah

1. Turunkan baud rate dan lihat apakah kesalahan berhenti.
2. Uji dengan satu perangkat dan kabel pendek. Jika berfungsi, masalahnya di bus, bukan perangkat.
3. Periksa terminasi saat daya mati: hambatan antara A dan B seharusnya sekitar 60 Ω dengan kedua terminator terpasang.
4. Tambahkan bias jika master atau konverter menyediakannya.
5. Perbesar interval polling dan timeout.

Kesalahan CRC sesekali pada bus industri yang panjang adalah hal normal; alat sebaiknya mengulang. Kesalahan pada sebagian besar frame bukan hal normal.
