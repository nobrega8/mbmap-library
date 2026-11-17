# Cara menemukan peta register Modbus sebuah perangkat

Peta register (disebut juga tabel Modbus, daftar titik, peta memori, atau protokol komunikasi) jarang ada di lembar instalasi. Tempat mencarinya:

1. **Cari di pustaka ini** menurut model, kode model, atau alias. Setiap peta menautkan ke dokumen yang menjadi sumbernya.
2. **Area unduhan produsen.** Cari “communication protocol”, “Modbus protocol”, “Modbus register map”, “Modbus table”, atau “point map” bersama nama model. Sering kali berupa PDF terpisah dari manual pengguna.
3. **Manual pengguna lengkap.** Banyak manual menaruh tabel di bab mendekati akhir (“Communication”, “Modbus”, “Appendix B”).
4. **Perangkat lunak konfigurasi.** Beberapa produsen menyertakan peta di dalam perangkat lunaknya atau sebagai file Excel di sampingnya.
5. **Dokumen keluarga produk.** Sebuah model sering berbagi peta dengan keluarganya (“EM24 DIN”, “PM5000 series”). Pastikan manual keluarga mencakup varian Anda.
6. **Tanyakan dukungan produsen.** Beberapa peta hanya dikirim atas permintaan, kadang di bawah NDA; periksa apakah Anda boleh membagikannya sebelum menerbitkan peta yang dibuat darinya.
7. **Integrasi proyek lain.** Konfigurasi Home Assistant, openHAB, Node-RED, dan EVCC sering berisi daftar register yang berfungsi, tetapi periksa terhadap manual.

<mb-flow name="find"></mb-flow>

## Yang perlu dibaca di dalamnya

- **Konvensi pengalamatan** (alamat di kabel, berbasis 1, atau Modicon). Lihat [alamat](modbus-address-off-by-one).
- **Tipe data**, **urutan word**, dan **skala** setiap nilai. Lihat [urutan byte dan word](byte-and-word-order) dan [penskalaan](scaling-and-units).
- **Kode fungsi yang didukung** dan jumlah register terbanyak per permintaan.
- **Pengaturan serial bawaan** dan unit ID.

## Tidak ada di pustaka ini?

[Minta peta](https://github.com/nobrega8/mbmap-library/issues/new/choose) dengan tautan ke dokumennya, atau tulis sendiri: formatnya JSON biasa dan [spesifikasi](/spec) menjelaskan setiap kunci.
