# Alamat Modbus: mengapa pembacaan Anda bergeser satu register

Anda membaca register 40001 dan mendapat nilai yang di manual tercantum untuk 40002, atau perangkat menjawab *illegal data address* untuk register yang ada di tabel. Hampir selalu penyebabnya sama: manual dan alat Anda menghitung register dengan cara berbeda.

## Tiga cara menulis register yang sama

| Yang dicetak manual | Artinya | Yang dikirim di kabel |
|---|---|---|
| `40001` (referensi Modicon) | holding register nomor 1, dihitung dari 1, dengan `4` sebagai awalan area | alamat `0` |
| `1` (nomor register) | holding register 1, dihitung dari 1 | alamat `0` |
| `0` atau `0x0000` (offset) | alamat itu sendiri | alamat `0` |

Frame Modbus selalu membawa alamat dari 0 sampai 65535. Awalan `4` (holding), `3` (input), `1` (input diskret), dan `0` (coil) tidak dikirim: area dipilih oleh kode fungsi (03 untuk holding, 04 untuk input, 02 untuk input diskret, 01 untuk coil). Angka yang tersisa sering dihitung dari 1, sehingga alamat di kabel adalah angka itu **dikurangi satu**.

Referensi enam digit seperti `400001` atau `300013` bekerja dengan cara yang sama: buang digit pertama dan kurangi satu (`300013` → input register `12`).

<mb-address></mb-address>

## Cara mengetahui mana yang dipakai manual Anda

- **Alamat hex** (`0x0BB7`, `1004h`) hampir selalu merupakan alamat di kabel.
- **Register pertama 40001 atau 30001** berarti referensi Modicon: kurangi 40001 atau 30001.
- **Register pertama 1** biasanya berarti penomoran dari 1; register pertama 0 berarti alamat di kabel.
- **Cari contoh perhitungan.** Banyak manual menampilkan frame permintaan (“baca register 40011: 01 03 00 0A 00 01 …”). Dua byte setelah kode fungsi adalah alamat di kabel dan menyelesaikan pertanyaan itu.
- **Beberapa manual mencampurnya**, misalnya kolom “register” desimal yang lebih besar satu dari kolom “alamat” hex di sebelahnya. Percayai kolom hex dan frame contoh.

## Yang diharapkan alat Anda

Alat juga berbeda. Ada yang meminta alamat di kabel, ada yang nomor register berbasis 1, dan ada yang menerima referensi Modicon lalu membuang awalannya. Jika sebuah nilai bergeser tepat satu register (nilai 32-bit tampak seperti sampah, atau setiap nilai seolah milik tetangganya), coba alamat yang lebih rendah satu atau lebih tinggi satu.

## Cara peta MBMap mencatatnya

Setiap file `.mbmap.json` menyatakan konvensi alamatnya dengan `address_base`: `0` berarti alamat adalah alamat di kabel, `1` berarti dihitung dari 1 dan alamat di kabel lebih kecil satu. Halaman perangkat di situs ini, ekspor CSV, dan ekspor Home Assistant menampilkan alamat di kabel di samping alamat sebagaimana tertulis di peta, sehingga Anda tidak perlu menebak.
