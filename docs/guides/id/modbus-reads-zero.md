# Register Modbus terbaca 0, 0xFFFF, atau 0x8000

Permintaan berhasil tetapi nilainya tidak masuk akal. Sebelum mencurigai perangkat, periksa apa yang ingin disampaikannya.

## Penyebab umum

- **Area salah.** Alamat yang sama dapat ada sebagai input register dan holding register dengan isi berbeda. Membaca holding register padahal nilainya ada di input register bisa menghasilkan nol. Lihat [kode fungsi](modbus-function-codes).
- **Bergeser satu.** Membaca separuh kedua dari nilai 32-bit alih-alih separuh pertama sering menghasilkan 0 untuk nilai kecil. Lihat [alamat](modbus-address-off-by-one).
- **Tidak diimplementasikan.** Banyak perangkat menjawab pembacaan register yang tidak dipakai dengan 0, 0xFFFF, 0x7FFF, atau 0x8000 alih-alih pengecualian. Perangkat SunSpec memakai 0x8000 (−32768) untuk “tidak diimplementasikan” pada bidang bertanda dan 0xFFFF pada yang tidak bertanda.
- **Tidak diukur.** Arus netral pada sambungan tiga kabel, fasa yang tidak dikabel, atau input sensor tanpa sambungan terbaca 0 atau penanda tetap.
- **Belum siap.** Beberapa perangkat mengembalikan nol beberapa detik setelah dinyalakan, atau sampai siklus pengukuran pertama selesai.
- **Perbedaan model.** Register yang tercantum di manual keluarga produk mungkin hanya ada pada beberapa model: yang lain mengembalikan 0.
- **Skala terlalu kasar.** Arus kecil dengan skala 1 A terbaca 0.

<mb-scaling></mb-scaling>

## Cara peta MBMap mencatatnya

Peta dapat mencantumkan `sentinels`, yaitu nilai yang berarti “tidak tersedia” untuk setiap tipe, sehingga alat menampilkannya sebagai hilang, bukan sebagai pembacaan. Deskripsi register menyebutkan model atau pengkabelan yang diperlukan suatu nilai.
