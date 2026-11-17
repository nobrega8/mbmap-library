# Amankah menulis ke perangkat Modbus?

Membaca register tidak berbahaya. Menulisnya mengubah perangkat, kadang dengan cara yang sulit dibatalkan.

## Apa yang bisa salah

- **Register salah.** [Alamat yang bergeser satu](modbus-address-off-by-one) menulis nilai Anda ke pengaturan di sebelahnya: rasio CT, batas proteksi, baud rate.
- **Pengaturan komunikasi.** Menulis unit ID, baud rate, atau paritas memutus Anda sampai Anda tersambung kembali dengan nilai baru.
- **Memori aus.** Banyak perangkat menyimpan pengaturan ke flash atau EEPROM dengan jumlah penulisan terbatas. Menulis setpoint setiap detik dapat menghabiskannya dalam hitungan bulan. Beberapa perangkat menyediakan alamat khusus RAM untuk penulisan yang sering.
- **Perintah langsung bekerja.** Jalan/berhenti, buka/tutup pemutus, reset penghitung energi, dan reset pabrik terjadi saat ditulis, tanpa konfirmasi.
- **Nilai yang tertulis setengah.** Menulis dua register dari nilai 32-bit dalam permintaan terpisah dapat meninggalkan nilai campuran sesaat, atau ditolak.

<mb-flow name="write"></mb-flow>

## Sebelum menulis

1. Periksa peta terhadap dokumen produsen, dan utamakan peta bertanda *terverifikasi* atau *resmi*.
2. Baca register terlebih dahulu dan pastikan isinya sesuai harapan.
3. Periksa rentang yang diizinkan; banyak perangkat membatasi atau menolak nilai di luarnya.
4. Tulis nilai multi-register dalam satu permintaan (fungsi 16).
5. Ketahui cara memulihkan nilai lama.
6. Pada peralatan yang mengendalikan daya atau mesin, uji dalam keadaan terisolasi.

## Cara peta MBMap membantu

Register memiliki `access` (`R`, `W`, `RW`), dan yang dapat ditulis dapat membawa `write_min` dan `write_max`. Setiap peta memiliki status yang menyatakan apakah sudah diuji pada perangkat, diambil dari dokumen produsen, atau belum diperiksa. Alat sebaiknya memberi peringatan sebelum menulis ke perangkat yang modelnya tidak cocok dengan peta.
