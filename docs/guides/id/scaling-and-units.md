# Penskalaan dan satuan: saat nilai meleset sepuluh atau seribu kali

Register dibaca dengan urutan yang benar, tetapi tegangan tetap 2301, bukan 230,1, atau arus 4560, bukan 4,56 A. Sebagian besar meter mengirim bilangan bulat dan mengharapkan Anda menerapkan skala tetap.

## Skala tetap

Manual menulis skala dengan beberapa cara yang bermakna sama:

| Manual menyebutkan | Artinya | Nilai terbaca 2301 |
|---|---|---|
| “resolution 0.1 V”, “× 0.1”, “unit 0.1 V” | kalikan 0,1 | 230,1 V |
| “Value weight: Volt × 10”, “÷ 10” | bagi 10 | 230,1 V |
| “1 decimal”, “format XXX.X” | bagi 10 | 230,1 V |
| “mA”, “mV”, “Wh” sebagai satuan | bilangan bulat sudah dalam satuan itu | 2301 mV |

Perhatikan satuan selain faktornya: penghitung energi dalam Wh dan yang dalam kWh × 0,01 berbeda sepuluh kali lipat.

## Skala yang ditetapkan oleh konfigurasi

Beberapa perangkat mengubah skala melalui pengaturan: jumlah desimal yang ditampilkan di layar, rasio CT, atau rentang tegangan. Manual lalu memberi tabel (“jika register 40018 bernilai 2, bagi 100”). Baca pengaturan itu lebih dulu.

<mb-scaling></mb-scaling>

## Register faktor skala (SunSpec dan lainnya)

Inverter dan meter SunSpec mengirim setiap nilai bersama register *faktor skala* terpisah, yaitu pangkat sepuluh bertanda. Nilainya adalah `register × 10^faktor_skala`: daya 4523 dengan faktor skala −1 adalah 452,3 W. Faktor skala dapat berubah saat perangkat berjalan, jadi baca bersama nilainya, dalam permintaan yang sama.

## Float

Nilai yang dikirim sebagai float 32-bit (IEEE 754) tidak memerlukan skala; sudah dalam satuan teknik. Jika sebuah float tampak mustahil, periksa [urutan word](byte-and-word-order) sebelum skalanya.

## Cara peta MBMap mencatatnya

Sebuah register memiliki `scale` (pengali), `offset` opsional, `unit`, atau `scale_factor` yang menyebut register berisi pangkat sepuluh. Halaman perangkat dan ekspor menerapkannya, sehingga angka yang Anda atur adalah angka yang ada di manual.
