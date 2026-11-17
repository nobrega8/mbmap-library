# `.mbmap` — format Modbus Map, versi 2

File `.mbmap.json` menggambarkan peta register Modbus dari satu model perangkat: siapa yang membuatnya, cara berkomunikasi dengannya, dan arti setiap register. Ini adalah dokumen JSON, sehingga bahasa apa pun dapat membacanya dengan parser JSON standarnya, dan sebuah [JSON Schema](schema/mbmap-2.schema.json) menjelaskan strukturnya.

Kata kunci **MUST** (harus), **SHOULD** (sebaiknya), dan **MAY** (boleh) digunakan seperti dalam [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## 1. Contoh

```json
{
  "$schema": "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json",
  "mbmap": 2,
  "vendor": "Example Corp",
  "model": "EM-100",
  "description": "Single-phase energy meter",
  "protocol": "rtu",
  "unit_id": 1,
  "baudrate": 9600,
  "parity": "E",
  "stopbits": 1,
  "byte_order": "big",
  "word_order": "big",
  "address_base": 0,
  "enums": {
    "relay": {"0": "Open", "1": "Closed"}
  },
  "registers": [
    {"name": "Voltage", "group": "Measurements", "area": "input", "address": 0, "type": "float32", "unit": "V", "description": "RMS voltage"},
    {"name": "Current", "group": "Measurements", "area": "input", "address": 6, "type": "float32", "unit": "A", "description": "RMS current"},
    {"name": "Active energy", "group": "Energy", "area": "holding", "address": 256, "type": "uint32", "scale": 0.01, "unit": "kWh", "word_order": "little"},
    {"name": "Relay state", "group": "Status", "area": "holding", "address": 512, "type": "bool", "bit": 3, "enum": "relay", "description": "Bit 3 of the status word"},
    {"name": "Reset energy", "group": "Commands", "area": "coil", "address": 0, "type": "bool", "access": "W", "description": "Write 1 to reset counters"},
    {"name": "Serial number", "group": "Info", "area": "holding", "address": 1024, "type": "string", "length": 8, "description": "16 ASCII characters"}
  ]
}
```

Contoh lengkap ada di [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json).

## 2. File

- Sebuah peta adalah satu objek JSON ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)), dikodekan dalam UTF-8. Pembaca **MUST** menerima dan mengabaikan BOM di awal. Penulis **SHOULD NOT** menuliskannya.
- Nama file berakhir dengan `.mbmap.json`.
- Sebuah objek **MUST NOT** mengulang kunci. Parser JSON menangani kunci duplikat secara berbeda, sehingga file dengan kunci duplikat tidak valid.
- String digunakan apa adanya: tidak ada pemangkasan, dan nilai enumerasi peka huruf besar-kecil (`"holding"`, bukan `"Holding"`).
- JSON `null` bukan nilai yang valid untuk kunci mana pun; hilangkan kuncinya.
- JSON tidak memiliki komentar. Catatan tentang seluruh file ditaruh di `notes`, catatan tentang satu register di `comment`-nya. Keduanya adalah teks bebas yang boleh **(MAY)** ditampilkan alat dan tidak boleh **(MUST NOT)** ditafsirkan.
- Penulis **SHOULD** menggunakan tata letak §1: indentasi dua spasi, dan satu baris per register serta per tabel `enums`/`sentinels`, sehingga perubahan pada satu register hanyalah selisih satu baris.
- `$schema` bersifat opsional dan mengarahkan editor ke JSON Schema. Pembaca **MUST** mengabaikannya.

### 2.1 Bilangan bulat

Di mana sebuah nilai adalah **bilangan bulat**, nilai itu boleh **(MAY)** ditulis sebagai bilangan bulat JSON (`1040`) atau sebagai string berisi bilangan bulat desimal atau hex `0x` (`"0x0410"`). String mempertahankan penulisan hex yang dipakai manual untuk alamat dan pengenal, dan membawa nilai 64-bit yang tidak dibaca secara tepat sebagai angka oleh setiap parser JSON (di atas 2^53). Kunci tabel `enums` dan `sentinels` selalu berupa string, dalam kedua bentuk yang sama.

### 2.2 Tabel

Sebuah **tabel** memetakan nilai mentah ke label: objek yang kuncinya adalah bilangan bulat yang ditulis sebagai string (§2.1) dan nilainya adalah label yang tidak kosong, mis. `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Sebuah tabel memiliki setidaknya satu entri, dan dua kunci tidak boleh **(MUST NOT)** mewakili nilai yang sama (`"1"` dan `"0x1"`).

## 3. Kunci tingkat atas

`mbmap`, `vendor`, `model`, dan `registers` wajib ada. Setiap kunci lain bersifat opsional; jika tidak ada, nilai bawaan berlaku.

| Key | JSON type | Default | Arti |
|---|---|---|---|
| `mbmap` | integer `2` | | Versi format (§3.1, §8) |
| `vendor` | non-empty string | | Produsen |
| `model` | non-empty string | | Model atau keluarga model, sebagaimana ditampilkan kepada orang |
| `models` | array of non-empty strings | `[model]` | Setiap nama atau kode model yang berlaku untuk peta (§3.2) |
| `vendor_website` | string: a domain or an `http(s)://` URL | | Situs web produsen, mis. `se.com` atau `https://www.se.com` |
| `description` | string | | Deskripsi singkat |
| `revision` | integer ≥ 1 | | Revisi isi peta ini (§3.1) |
| `revised` | string `YYYY-MM-DD` | | Tanggal revisi itu |
| `firmware` | string | | Teks bebas tentang firmware yang menjadi sasaran peta |
| `firmware_min` | version string (§3.2) | | Firmware tertua yang menjadi sasaran peta |
| `firmware_max` | version string (§3.2) | | Firmware terbaru yang menjadi sasaran peta |
| `source` | string | | Ringkasan teks bebas tentang asal peta |
| `sources` | array of source objects | | Dokumen yang menjadi dasar atau pembanding peta (§3.3) |
| `notes` | array of strings | | Catatan bebas tentang file |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Transport yang didukung perangkat |
| `unit_id` | integer `0`–`255` | `1` | unit / slave id bawaan |
| `port` | integer `1`–`65535` | `502` | Port TCP bawaan |
| `baudrate` | integer | `9600` | Baud rate RTU bawaan |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Paritas RTU bawaan |
| `databits` | `7`, `8` | `8` | Bit data RTU bawaan |
| `stopbits` | `1`, `2` | `1` | Bit stop RTU bawaan |
| `byte_order` | `"big"`, `"little"` | `"big"` | Urutan byte bawaan di dalam setiap register (§6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Urutan bawaan register-register dari nilai multi-register (§6) |
| `address_base` | `0`, `1` | `0` | Apakah `address` dihitung dari 0 atau dari 1 (§5) |
| `max_read_registers` | integer `1`–`125` | `125` | Blok terbesar yang diterima perangkat per pembacaan (FC03/04) |
| `max_read_bits` | integer `1`–`2000` | `2000` | Blok terbesar yang diterima perangkat per pembacaan (FC01/02) |
| `enums` | object: name → table | | Tabel terjemahan bernama (§4.1). Nama menggunakan `a`–`z`, `0`–`9`, dan `_` |
| `sentinels` | object: type → table | | Nilai mentah yang dicadangkan per tipe bilangan bulat (§4.2) |
| `identify` | object | | Cara membaca identitas perangkat dengan Report Slave ID (FC17) atau Read Device Identification (FC43) (§4.8) |
| `registers` | array of register objects | | Register (§4) |

Nilai koneksi adalah **nilai bawaan**: pengguna tetap dapat mengubahnya saat menghubungkan.

### 3.1 Versi format dan revisi peta

Dua angka menggambarkan sebuah peta, dan keduanya berubah karena alasan yang berbeda:

- **`mbmap`, versi format**, menyatakan versi spesifikasi ini yang diikuti file, agar pembaca tahu apakah ia dapat membacanya (§8). Nilainya sama untuk setiap peta yang ditulis menurut spesifikasi ini dan hanya berubah saat formatnya berubah.
- **`revision`, revisi peta**, menyatakan edisi isi peta ini yang mana. Dimulai dari `1` dan **SHOULD** naik satu untuk setiap perubahan terbit yang memengaruhi cara perangkat dibaca atau ditulis: sebuah register, nilai bawaan koneksi, tabel, rentang firmware, atau model. Nilai ini boleh **(MAY)** tetap sama untuk perubahan teks bebas saja (`description`, `notes`, `comment`, `source`). `revised` memberi tanggal perubahan itu.

Alat yang memiliki dua salinan peta yang sama (`vendor` dan `model` yang sama) **SHOULD** menganggap `revision` yang lebih tinggi sebagai yang lebih baru, dan boleh **(MAY)** menawarkan yang lebih baru kepada pengguna. Peta tanpa `revision` tidak dapat dibandingkan dengan cara ini. Revisi bukan versi firmware perangkat: firmware termasuk dalam §3.2.

### 3.2 Model dan firmware

Sebuah peta berlaku untuk model dalam `models`, atau untuk `model` saja bila `models` tidak ada. `model` adalah nama yang ditampilkan kepada orang: satu perangkat, atau nama keluarga atau seri bila peta mencakup beberapa (`"PM5100 and PM5300 series"`), bukan daftar perangkat. `models` mencantumkan setiap nama atau kode yang dapat dilaporkan perangkat, sehingga alat dapat membandingkannya dengan perangkat yang terhubung (§9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` dan `firmware_max` menyatakan versi firmware mana yang menjadi sasaran peta. Keduanya opsional: tanpa keduanya peta berlaku untuk setiap firmware, yang juga merupakan pilihan tepat ketika versinya tidak diketahui. `firmware` tetap tersedia untuk apa pun yang tidak dapat dinyatakan oleh sebuah rentang (“2.x, kecuali 2.3 beta”).

Sebuah **string versi** adalah satu atau lebih bilangan bulat yang dipisahkan titik: `"2"`, `"2.1"`, `"1.02.7"`. Komponen dibandingkan sebagai angka dari kiri (`"1.10"` lebih baru daripada `"1.9"`, dan `"1.02"` sama dengan `"1.2"`), jadi tulislah versi seperti yang dilaporkan perangkat. Sebuah batas mencakup setiap versi yang diawali olehnya:

- `firmware_min` `"2.1"` mencakup `2.1`, `2.1.4`, dan `3.0`, tetapi tidak `2.0.9`;
- `firmware_max` `"2"` mencakup setiap `2.x` dan `2.x.y`, tetapi tidak `3.0`; `firmware_max` `"2.3"` mencakup `2.3.7` tetapi tidak `2.4`.

Jadi `"firmware_min": "1", "firmware_max": "2"` dibaca “firmware 1.x dan 2.x”. `firmware_min` tidak boleh **(MUST NOT)** berada setelah `firmware_max`.

**Register yang bergantung pada firmware.** Sebuah register dapat membawa `firmware_min` dan `firmware_max` sendiri, dengan arti yang sama, bila hanya ada pada beberapa versi firmware. Ini menjaga satu file untuk revisi firmware yang berbeda pada beberapa register. Register tanpa keduanya berlaku di mana pun peta berlaku. Dua register boleh **(MAY)** berbagi `name` (dan alamat) bila rentang firmware-nya tidak tumpang tindih: alat memakai yang cocok dengan perangkat.

Contoh: firmware 2.1 memindahkan penghitung energi dan menambahkan register faktor daya:

```json
"firmware_min": "1",
"firmware_max": "2",
"registers": [
  {"name": "Firmware version", "area": "holding", "address": 0, "type": "string", "length": 4, "role": "firmware"},
  {"name": "Voltage", "area": "input", "address": 10, "type": "float32", "unit": "V"},
  {"name": "Active energy", "area": "input", "address": 20, "type": "uint32", "unit": "Wh", "firmware_max": "2.0"},
  {"name": "Active energy", "area": "input", "address": 40, "type": "uint64", "unit": "Wh", "firmware_min": "2.1"},
  {"name": "Power factor", "area": "input", "address": 30, "type": "int16", "scale": 0.001, "firmware_min": "2.1"}
]
```

Ketika perbedaannya besar (sebagian besar alamat berubah, atau pengaturan koneksi), file terpisah lebih jelas: satu peta per rentang firmware, masing-masing dengan `firmware_min` dan `firmware_max` sendiri.

### 3.3 Sumber

`sources` mencatat dokumen yang menjadi dasar atau pembanding sebuah peta, agar pembaca dapat menemukannya dan mengetahui edisi mana yang digunakan. Setiap item adalah sebuah objek:

| Key | JSON type | Arti |
|---|---|---|
| `title` | non-empty string, required | Judul dokumen, mis. `"EM530/EM540 Modbus communication protocol"` |
| `version` | string | Edisi atau revisi dokumen, sebagaimana tercetak padanya |
| `date` | string `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | Tanggal terbit edisi itu |
| `url` | `http(s)://` URL | Tempat dokumen dapat ditemukan |
| `note` | string | Bagian mana yang digunakan, atau cara peta diperiksa (mis. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | string `YYYY-MM-DD` | Kapan dokumen diunduh atau dibaca, karena dokumen pada URL yang sama dapat berubah tanpa versi baru |
| `sha256` | string of 64 hex digits | SHA-256 dari file yang digunakan, agar pembaca dapat mengetahui apakah dokumen di `url` masih sama |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` ditampilkan di atas dalam bentuk singkat; dalam file berisi seluruh 64 digit hex. Alat boleh **(MAY)** membandingkannya dengan dokumen yang diunduhnya dan memperingatkan bila berbeda: dokumen telah diperbarui, dan peta mungkin perlu diperiksa kembali.

`source` tetap menjadi ringkasan teks bebas satu baris untuk orang dan untuk peta yang sumbernya tidak diketahui serinci ini. Sebuah peta boleh **(MAY)** memiliki keduanya.

## 4. Register

Setiap item `registers` adalah sebuah objek. `name`, `area`, `address`, dan `type` wajib ada; setiap kunci lain bersifat opsional, dan nilai bawaan berlaku bila tidak ada.

| Key | JSON type | Default | Arti |
|---|---|---|---|
| `name` | non-empty string | | Nama variabel. **SHOULD** unik dalam file |
| `group` | string | | Pengelompokan bebas untuk tampilan (mis. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Area data Modbus (§5) |
| `address` | integer (§2.1) | | Alamat register / bit pertama (§5) |
| `type` | see §6 | | Tipe data |
| `length` | integer ≥ 1 | | Jumlah register. Wajib untuk `string`, selain itu diabaikan |
| `bit` | integer `0`–`15` | | Untuk `bool` di `input`/`holding`: bit mana dari register, 0 = paling tidak signifikan. Untuk bidang bit `uint16`: bit terendahnya |
| `bits` | integer `1`–`16` | | Untuk `uint16` di `input`/`holding`: lebar bidang bit yang dimulai di `bit` (§4.3) |
| `scale` | number | `1` | Pengali |
| `scale_factor` | string: a register `name` | | Register yang nilai bilangan bulatnya adalah eksponen pangkat sepuluh untuk register ini (§4.4) |
| `offset` | number | `0` | Ditambahkan setelah penskalaan |
| `unit` | string | | Satuan teknik (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | Operasi yang diizinkan |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | Menimpa nilai bawaan file untuk register ini (§6) |
| `word_order` | `"big"`, `"little"` | file `word_order` | Menimpa nilai bawaan file untuk register ini (§6) |
| `write_min` | number | | Nilai terkecil yang diterima saat menulis, dalam satuan teknik (§4.5) |
| `write_max` | number | | Nilai terbesar yang diterima saat menulis, dalam satuan teknik (§4.5) |
| `enum` | string (a name in `enums`) or table | | Label untuk nilai bilangan bulat atau bool (§4.1) |
| `reference` | see §4.6 | | Nilai mentah yang seharusnya dimiliki register ini pada perangkat yang sehat |
| `firmware_min` | version string (§3.2) | | Firmware tertua yang memiliki register ini |
| `firmware_max` | version string (§3.2) | | Firmware terbaru yang memiliki register ini |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Register ini mengidentifikasi perangkat (§4.7) |
| `read_alone` | boolean | `false` | Register dibaca dalam permintaannya sendiri (§4.9) |
| `read_group` | non-empty string | | Register hanya dibaca bersama register dari grup yang sama (§4.9) |
| `parts` | array of objects | | Menamai nilai-nilai di dalam register blok, agar alat dapat menampilkan dan menyuntingnya satu per satu (§4.10) |
| `description` | string | | Teks bebas |
| `comment` | string | | Catatan bebas tentang register, untuk orang yang menyunting peta |

Nilai teknik = mentah × 10^`scale_factor` × `scale` + `offset` (tanpa `scale_factor`: mentah × `scale` + `offset`). Saat menulis, alat menerapkan kebalikannya dan membulatkan ke bilangan bulat terdekat untuk tipe bilangan bulat.

### 4.1 Tabel terjemahan

Banyak register menyimpan angka yang mewakili suatu status: `0` berhenti, `1` siaga, `2` memulai, dan seterusnya. `enum` mengubah angka-angka itu menjadi label. Isinya salah satu dari:

- **tabel** yang ditulis di register: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **nama tabel** di `enums` tingkat atas, sehingga daftar yang sama ditulis sekali untuk setiap register yang memakainya:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Nilai dibandingkan dengan nilai **mentah**, sebelum `scale` dan `offset`. Nilai yang tidak ada di tabel ditampilkan sebagai angka biasa. Alat **SHOULD** menawarkan label saat menulis.

### 4.2 Nilai sentinel

Beberapa perangkat menjawab dengan nilai mentah yang dicadangkan alih-alih pembacaan: satu nilai berarti “tidak diimplementasikan”, nilai lain “di atas rentang”, nilai lain “kegagalan sensor”. `sentinels` mendeklarasikannya untuk setiap register dari satu tipe:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- Kunci `sentinels` adalah `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`. Sebuah tabel berlaku untuk setiap register bertipe itu.
- Nilai **MUST** muat dalam tipenya, dan dibandingkan dengan nilai **mentah**, sebelum `scale` dan `offset`.
- Saat sebuah pembacaan cocok, alat **SHOULD** menampilkan label alih-alih angka dan **SHOULD NOT** memperlakukannya sebagai pengukuran (dalam grafik, batas, atau rata-rata).
- Label `enum` untuk nilai mentah yang sama didahulukan atas sentinel.

### 4.3 Bidang bit

Beberapa perangkat memadatkan beberapa nilai kecil ke dalam satu register, misalnya empat kode alarm 4-bit. Register `uint16` dengan `bit` dan `bits` membaca salah satunya: nilai mentah = (register >> `bit`) & (2^`bits` − 1). `bit` + `bits` tidak boleh **(MUST NOT)** melebihi 16.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Register yang membaca bidang berbeda dari register yang sama tidak tumpang tindih. Menulis sebuah bidang **SHOULD** membaca register, mengubah hanya bit bidang itu, dan menuliskannya kembali.

### 4.4 Faktor skala

Beberapa perangkat, terutama inverter dan meter SunSpec, mengirim register eksponen terpisah untuk sebuah nilai alih-alih skala tetap: nilainya adalah mentah × 10^eksponen, dan eksponen dapat berubah mengikuti rentang perangkat. `scale_factor` menamai register eksponen itu:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- Register yang dinamai **MUST** merupakan register dari file yang sama dengan tipe bilangan bulat (`int16` … `uint64`) dan tanpa `bits`, dan tidak boleh **(MUST NOT)** memiliki `scale_factor` sendiri. Jika beberapa register berbagi nama, yang pertama dipakai.
- Hanya tipe numerik yang dapat memiliki `scale_factor` (bukan `bool` atau `string`).
- Alat membaca register eksponen bersama nilainya, juga ketika pengguna memilih tidak menampilkannya. Jika eksponen tidak dapat dibaca, atau merupakan sentinel (§4.2, mis. `-32768` pada SunSpec = tidak diimplementasikan), nilainya tidak tersedia.
- Saat menulis, alat membaca eksponen terlebih dahulu dan menerapkan kebalikannya.

### 4.5 Batas penulisan

`write_min` dan `write_max` menyatakan nilai apa yang diterima sebuah register saat ditulis, agar alat dapat menolak nilai buruk sebelum mencapai perangkat.

- Keduanya adalah angka dalam **satuan teknik**: nilai yang dilihat pengguna, setelah `scale_factor`, `scale`, dan `offset` diterapkan. Batas `0.5` pada register dengan `scale` `0.1` berarti nilai mentah 5.
- Salah satunya dapat dihilangkan: batas yang hilang membiarkan sisi itu terbuka. Jika keduanya hilang, register tidak memiliki batas yang dinyatakan (perangkat yang menentukan).
- `write_min` tidak boleh **(MUST NOT)** lebih besar dari `write_max`. Batasnya inklusif.
- Alat tidak boleh **(MUST NOT)** mengirim penulisan yang nilai tekniknya di bawah `write_min` atau di atas `write_max`, dan **SHOULD** memberi tahu pengguna batas mana yang terlampaui.
- Keduanya berlaku untuk nilai yang diminta pengguna, sebelum dikonversi menjadi nilai mentah dan dibulatkan. Nilai di dalam batas yang tetap tidak muat dalam tipe register ditolak oleh pemeriksaan tipe yang biasa.
- Keduanya tidak bermakna untuk register `bool` dan `string` atau register yang tidak dapat ditulis (`access` `"R"`), dan diabaikan di sana.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Nilai referensi

`reference` memberikan nilai yang diketahui dimiliki perangkat sehat pada register ini (nomor model, pengenal protokol tetap, kode produsen). Alat dapat membaca register dan membandingkannya dengan referensi untuk mendeteksi alamat, basis, urutan byte, atau tipe data yang salah sebelum pengguna mempercayai nilai lainnya. Tidak setiap perangkat memiliki register seperti itu, sehingga sebagian besar register tidak memiliki `reference`.

- Ini adalah nilai **mentah**, sebelum `scale_factor`, `scale`, dan `offset`, dalam tipe JSON nilai itu: bilangan bulat (§2.1) untuk tipe bilangan bulat dan bidang bit, angka untuk `float32` dan `float64`, `true` / `false` untuk `bool`, string untuk `string`. Nilai ini **MUST** muat dalam tipenya (dan lebar bidang bit, atau `2 × length` karakter untuk string).
- Pemeriksaannya adalah register itu sendiri: alat membaca `area` dan `address`-nya (sudah disesuaikan dengan `address_base`) dan mendekode `type`-nya dengan urutan byte dan word.
- Sebuah peta dapat memiliki sebanyak apa pun register dengan `reference`.
- Hasil setiap pemeriksaan: **match** (nilai mentah yang didekode sama dengan referensi), **mismatch** (berbeda), **failed** (pembacaan mengembalikan kesalahan atau timeout, sehingga tidak ada yang diketahui), **not checked** (register tidak dibaca). Alat **SHOULD** melaporkannya secara terpisah: mismatch menunjuk pada peta atau pengaturan yang salah, failed pada masalah koneksi atau pengalamatan.
- Float dibandingkan pada presisi tipenya sendiri (referensi `float32` dibandingkan sebagai float 32-bit). String dibandingkan setelah NUL dan spasi di akhir dipangkas.
- Referensi hanya mendukung sebuah diagnosis. Beberapa urutan byte atau word dapat mendekode byte yang sama menjadi nilai yang sama (angka kecil atau palindrom terbaca sama dalam lebih dari satu urutan), sehingga kecocokan tidak membuktikan seluruh peta benar. Peta **SHOULD** memakai nilai yang khas dan **SHOULD** memberi lebih dari satu bila perangkat memilikinya.
- `reference` pada register yang tidak dapat dibaca (`access` `"W"`) adalah kesalahan.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Register identitas

`role` menandai register yang memberi tahu perangkat mana yang terhubung, agar alat dapat memeriksa peta terhadapnya (§9):

- **`"model"`**: nama atau kode model perangkat. Nilainya, atau label `enum`-nya bila ada, dibandingkan dengan `models`. Kode model numerik sebaiknya diberi label: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: versi firmware. Register string dibaca sebagai teks, dan string versi pertama di dalamnya dipakai (`"V2.01b"` menghasilkan `2.01`). Sebuah angka memberi nilai tekniknya (`102` dengan `scale` `0.01` menghasilkan `1.02`). Bila beberapa register memiliki peran ini, nilainya digabung dengan titik menurut urutan file, yang cocok untuk perangkat yang memisahkan versi mayor dan minor, misalnya sebagai dua bidang bit dari satu register (`"bit": 8, "bits": 8` dan `"bit": 0, "bits": 8`).
- **`"serial"`**: nomor seri. Alat boleh **(MAY)** menampilkannya; tidak pernah dibandingkan.

Paling banyak satu register boleh **(MAY)** berperan `"model"` dan paling banyak satu `"serial"`. Register yang berperan **MUST** dapat dibaca. Register dengan peran selain itu adalah register biasa: dibaca dan ditampilkan seperti yang lain, dan dapat juga memiliki `reference`.

### 4.8 Identitas dari perangkat (FC17, FC43)

Beberapa perangkat melaporkan siapa dirinya dengan fungsi tersendiri dan tidak memiliki register identitas. `identify` menyatakan fungsi mana yang dikirim dan di mana identitas berada dalam jawaban, sehingga alat dapat memeriksa peta seperti dengan register §4.7 (§9). Sebuah peta memiliki paling banyak satu `identify`.

```json
"enums": {"type_codes": {"0x41": "DMG610", "0x57": "DMG620"}},
"identify": {
  "function": 17,
  "fields": [
    {"name": "Type", "offset": 0, "type": "uint8", "role": "model", "enum": "type_codes"},
    {"name": "Software revision", "offset": 1, "type": "uint8", "role": "firmware"},
    {"name": "Hardware revision", "offset": 2, "type": "uint8"}
  ]
}
```

```json
"identify": {
  "function": 43,
  "fields": [
    {"name": "Vendor name", "object": 0},
    {"name": "Product code", "object": 1, "role": "model"},
    {"name": "Revision", "object": 2, "role": "firmware"}
  ]
}
```

| Key | JSON type | Default | Arti |
|---|---|---|---|
| `function` | `17` or `43` | | `17`: Report Slave ID. `43`: Read Device Identification (encapsulated interface transport, tipe MEI `0x0E`) |
| `fields` | non-empty array of field objects | | Nilai yang diambil dari jawaban |

Setiap bidang adalah sebuah objek. `name` selalu wajib. `role` dan kunci di bawah bergantung pada `function`.

| Key | JSON type | Default | Arti |
|---|---|---|---|
| `name` | non-empty string | | Nama yang ditampilkan kepada orang |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Arti nilai, seperti untuk register (§4.7). Paling banyak satu `"model"` dan satu `"serial"` |
| `offset` | integer ≥ 0 | | **Hanya FC17, wajib.** Posisi bidang, dalam byte, di data jawaban. Offset `0` adalah byte pertama setelah jumlah byte, sehingga datanya adalah byte yang dicantumkan perangkat setelah “byte count” di manualnya |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Hanya FC17, wajib.** `uint16` adalah big-endian. `string` adalah ASCII, dengan NUL dan spasi di akhir dipangkas |
| `length` | integer ≥ 1 | | **Hanya FC17.** Panjang dalam byte. Wajib untuk `string` |
| `enum` | table name or inline table | | **Hanya FC17.** Menerjemahkan angka menjadi label (§4.1). Kode model sebaiknya diberi label, yang kemudian dibandingkan dengan `models` |
| `object` | integer 0–255 | | **Hanya FC43, wajib.** ID objek: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` ditentukan oleh perangkat |

- **FC43:** Nilai sebuah objek adalah string ASCII, dengan NUL dan spasi di akhir dipangkas. Alat meminta tingkat akses (basic, regular, atau extended) yang mencakup setiap objek yang dinamai bidang, dan mengikuti penanda “more follows” sampai semuanya didapat. Untuk `"firmware"`, string versi pertama dalam teks dipakai, seperti pada register string (§4.7).
- **Kedua fungsi:** Perangkat menjawab pada sebuah unit id, bukan pada alamat register, sehingga `address_base` tidak berlaku.
- **Tanpa nilai:** Jawaban yang lebih pendek dari kebutuhan bidang, jawaban pengecualian, objek yang hilang, atau perangkat yang tidak mendukung fungsi tidak memberi nilai. Pemeriksaannya **unknown** (§9), bukan mismatch.
- **Beberapa sumber:** `identify` dan register ber-`role` dapat ada bersamaan. Bila keduanya memberi nilai untuk peran yang sama, alat **SHOULD** memakai register dan boleh **(MAY)** memakai `identify` untuk peran yang tidak diberikan register mana pun.

### 4.9 Membaca dalam permintaan terpisah

Pembaca biasanya menggabungkan register bertetangga menjadi satu permintaan. Beberapa perangkat menolak permintaan yang melintasi batas antara dua tabel internal, meskipun setiap register di dalamnya ada. Dua kunci opsional membatasi cara register digabung:

- **`read_alone`**: `true` berarti register dibaca dalam permintaan yang tidak memuat register lain. Bidang bit dan register lain yang menempati word yang sama dihitung sebagai register yang sama.
- **`read_group`**: sebuah nama. Register dengan nama yang sama boleh **(MAY)** dibaca dalam satu permintaan, dan sebuah permintaan tidak boleh **(MUST NOT)** memuat register dari grup berbeda atau register tanpa grup. Register tanpa `read_group` digabung seperti sebelumnya.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

Bila kedua kunci ada, `read_alone` menang. Kunci hanya membatasi penggabungan: pembaca bebas membuat lebih banyak permintaan dari yang diperlukan, dan `max_read_registers` serta `max_read_bits` tetap berlaku. Keduanya hanya memengaruhi cara register diminta, bukan artinya, sehingga pembaca yang tidak mengenalnya membaca register yang sama, digabung seperti biasa. Karena itu keduanya tidak memerlukan versi `mbmap` baru (§8): pada perangkat yang menolak permintaan gabungan, pembaca lama gagal persis seperti tanpa kunci tersebut.

### 4.10 Bagian dari sebuah blok

Beberapa perangkat menyimpan beberapa nilai dalam satu blok dan hanya menerima blok secara utuh: penulisan yang dimulai di tengahnya, atau yang tidak mencakupnya, ditolak (pengecualian `0x02` atau `0x03`). Kasus khasnya adalah gateway SMS yang bloknya berisi nomor penerima diikuti teks pesan. Peta menggambarkan blok itu sebagai **satu** register, seperti sebelumnya, dan `parts` menyatakan isinya:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Key | JSON type | Default | Arti |
|---|---|---|---|
| `name` | non-empty string | | Nama yang ditampilkan kepada orang |
| `offset` | integer ≥ 0 | | Posisi bagian dalam blok, dalam **register** dari register pertama register itu |
| `type` | `"string"` or a numeric type (§6) | `"string"` | Cara bagian dibaca dan ditulis |
| `length` | integer ≥ 1 | | Jumlah register. Wajib untuk `string`, diabaikan untuk tipe lain |
| `description` | string | | Teks bebas |

- `parts` hanya untuk register `string`. Tidak boleh **(MUST NOT)** kosong. Setiap bagian **MUST** berada di dalam blok (`offset` ditambah register-nya paling banyak `length` register), dan bagian tidak boleh **(MUST NOT)** tumpang tindih. Register yang tidak tercakup bagian mana pun diizinkan: itu adalah padding.
- Register itu sendiri mempertahankan artinya. Pembaca yang tidak mengenal `parts` membaca dan menulis seluruh blok sebagai satu string dalam satu permintaan, persis seperti sebelumnya, sehingga peta seperti itu tetap berfungsi di setiap alat.
- Alat yang mengenal `parts` **SHOULD** menampilkan setiap bagian sebagai bidang tersendiri. Untuk membaca, ia mendekode setiap bagian dari blok dengan `byte_order` dan `word_order` register (§6). Untuk menulis, ia membangun **seluruh** blok dari bagian-bagiannya dan mengirimkannya dalam satu permintaan (FC16): bagian yang dikosongkan pengguna dikirim sebagai byte nol, sehingga bidang kosong tidak pernah secara tidak sengaja mempertahankan nilai lama. Alat tidak boleh **(MUST NOT)** mengirim penulisan yang hanya mencakup sebagian bagian, karena perangkat akan menolaknya.
- Bagian `string` adalah ASCII, diisi karakter NUL sampai `length`-nya. Alat **MUST** menolak teks yang lebih panjang dari `2 × length` karakter. Bagian numerik dikodekan seperti biasa (§6).
- `access` adalah milik register: bagian tidak dapat lebih dapat ditulis daripada blok.
- `parts` hanya menggambarkan isi sebuah register, sehingga tidak memerlukan versi `mbmap` baru (§8). Pembaca yang mengabaikannya berperilaku seperti sebelumnya.

## 5. Area dan alamat

| `area` | Satuan | Baca | Tulis | `access` yang diizinkan |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | register 16-bit | FC04 | — | `R` |
| `holding` | register 16-bit | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

Dengan `address_base` `0`, `address` adalah alamat yang dikirim di kabel (0–65535). Dengan `address_base` `1`, alamat di kabel adalah `address − 1` (1–65536), yang sesuai dengan manual yang menomori register mulai dari 1.

Notasi “Modicon” 5 dan 6 digit (`40001`, `300010`) **tidak** valid di `address`. Tulis sebagai area plus angka: `40001` menjadi `"area": "holding"`, `"address": 1`, dengan `"address_base": 1`.

## 6. Tipe, urutan byte, dan urutan word

| `type` | Register | Catatan |
|---|---|---|
| `bool` | — | Di `coil`/`discrete`: satu bit. Di `input`/`holding`: satu bit dari sebuah register, sehingga `bit` wajib |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Float adalah IEEE 754 |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | 2 karakter ASCII per register. NUL dan spasi di akhir dipangkas saat membaca |

Dua pengaturan independen menentukan bagaimana byte sebuah nilai tiba:

- **`byte_order`**, di dalam setiap register 16-bit: `"big"` mengirim byte tinggi lebih dulu (standar Modbus), `"little"` byte rendah lebih dulu.
- **`word_order`**, di antara register dari nilai 32-bit atau 64-bit: `"big"` menaruh register paling signifikan lebih dulu (pada alamat terendah), `"little"` register paling tidak signifikan lebih dulu.

Kunci tingkat atas menetapkan nilai bawaan file; `byte_order` dan `word_order` sebuah register masing-masing menimpanya sendiri (register yang hanya menetapkan `"word_order": "little"` mempertahankan urutan byte file).

| Tipe | `byte_order` | `word_order` |
|---|---|---|
| `bool` | tidak digunakan | tidak digunakan |
| `int16`, `uint16` | menukar dua byte register | tidak digunakan (satu register) |
| `int32`, `uint32`, `float32` | menukar dua byte setiap register | menentukan register mana dari 2 yang menjadi word tinggi |
| `int64`, `uint64`, `float64` | menukar dua byte setiap register | `"little"` membalik 4 register secara keseluruhan |
| `string` | `"big"`: byte pertama yang diterima adalah karakter pertama; `"little"`: byte kedua yang diterima adalah karakter pertama | tidak digunakan (register dibaca menurut urutan alamat) |

Untuk nilai 64-bit, urutan word little membalik seluruh rangkaian empat register; tidak menukar dua bagian 32-bit secara terpisah.

Urutan nilai 32-bit `0x0A0B0C0D` di kabel:

| `byte_order` | `word_order` | Byte di kabel | Nama umum |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Standar Modbus |
| `big` | `little` | `0C 0D 0A 0B` | “tukar word”, dipakai banyak meter dan PLC |
| `little` | `big` | `0B 0A 0D 0C` | “tukar byte” (jarang) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Validasi

Pembaca **SHOULD** melaporkan setiap masalah dengan salah satu kode di bawah dan sebuah [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) ke nilainya (`/registers/3/address`, `/enums/relay`), agar alat sepakat tentang apa yang salah. Masalah yang berkaitan dengan seluruh file tidak memiliki pointer. Sebuah **error** membuat file tidak valid. Sebuah **warning** dilaporkan, tetapi file masih dapat digunakan.

| Code | Severity | Kapan |
|---|---|---|
| `not-utf8` | error | File bukan UTF-8 yang valid |
| `not-json` | error | File bukan satu objek JSON yang valid, atau mengulang kunci dalam sebuah objek. Dilaporkan untuk seluruh file: parser menempatkan kesalahan sintaks pada posisi berbeda, sehingga posisi disertakan dalam pesan |
| `bad-json-type` | error | Kunci yang dikenal memiliki tipe JSON yang salah (string di tempat yang mengharapkan angka, `null`, …) |
| `missing-key` | error | `mbmap`, `vendor`, `model`, atau `registers` tidak ada (untuk seluruh file), atau sebuah register tidak memiliki `name`, `area`, `address`, atau `type`, atau kosong (pada register) |
| `bad-meta-value` | error | Kunci tingkat atas memiliki nilai di luar himpunan atau rentang yang diizinkan, termasuk `mbmap` selain `2` |
| `bad-area` | error | `area` tidak dikenal, atau tidak ditulis dalam huruf kecil |
| `bad-type` | error | `type` tidak dikenal, atau tidak ditulis dalam huruf kecil |
| `type-area` | error | Tipe selain `bool` di `coil` atau `discrete` |
| `bad-address` | error | `address` bukan bilangan bulat |
| `address-range` | error | Alamat di bawah `address_base`, atau nilai melampaui alamat 65535 |
| `missing-bit` | error | `bool` di `input`/`holding` tanpa `bit` |
| `bad-bit` | error | `bit` di luar `0`–`15` |
| `missing-length` | error | `string` tanpa `length` |
| `bad-length` | error | `length` bukan bilangan bulat ≥ 1 |
| `bad-access` | error | `access` tidak dikenal (atau tidak dalam huruf besar), atau tidak diizinkan untuk `area` |
| `bad-byte-order` | error | `byte_order` atau `word_order` sebuah register bukan `"big"` atau `"little"` |
| `bad-enum` | error | Tabel enum (§2.2) memiliki kunci yang bukan bilangan bulat, label kosong, nilai berulang, atau tidak ada entri, atau nama `enums` bukan `a`–`z`, `0`–`9`, `_` |
| `bad-sentinel` | error | `sentinels` menamai tipe yang tidak didukung, atau tabel tidak valid (§2.2) atau memiliki nilai yang tidak muat dalam tipenya |
| `bad-bits` | error | `bits` bukan bilangan bulat dari 1 sampai 16, dipakai pada tipe selain `uint16` atau di luar `input`/`holding`, tidak memiliki `bit`, atau `bit` + `bits` melebihi 16 |
| `unknown-enum` | error | `enum` menamai tabel yang tidak didefinisikan oleh `enums` |
| `bad-write-limit` | error | `write_min` lebih besar dari `write_max` |
| `bad-reference` | error | `reference` bukan nilai mentah yang valid untuk `type` register (bukan bilangan bulat, di luar rentang tipe, lebih lebar dari bidang bit, bukan boolean untuk `bool`, bukan angka hingga untuk float, lebih panjang dari string), atau ditetapkan pada register yang tidak dapat dibaca |
| `unknown-scale-factor` | error | `scale_factor` tidak menamai register mana pun dalam file (register dengan kesalahan tidak dihitung) |
| `bad-scale-factor` | error | `scale_factor` ditetapkan pada `bool` atau `string`, atau menamai register yang bukan bilangan bulat utuh (float, `bool`, `string`, atau bidang bit) atau yang memiliki `scale_factor` sendiri |
| `bad-version` | error | `firmware_min` atau `firmware_max`, di file atau register, bukan string versi (§3.2) |
| `bad-firmware-range` | error | `firmware_min` berada setelah `firmware_max`, di file atau register |
| `bad-source` | error | Item `sources` bukan objek dengan `title` tidak kosong, atau memiliki `version`, `date`, `url`, `note`, `accessed`, atau `sha256` dengan bentuk yang salah |
| `bad-role` | error | `role` bukan `"model"`, `"firmware"`, atau `"serial"`, ditetapkan pada register yang tidak dapat dibaca, atau `"model"` atau `"serial"` dipakai lebih dari sekali |
| `bad-identify` | error | `identify` tidak valid (§4.8): `function` bukan `17` atau `43`, `fields` kosong, atau sebuah bidang tidak memiliki `name`, memiliki `role` yang tidak dikenal atau berulang untuk `"model"` atau `"serial"`, atau melanggar aturan fungsinya (FC17: `offset` hilang atau negatif, `type` hilang atau tidak dikenal, `string` tanpa `length`, `enum` yang tidak menamai tabel atau bukan tabel yang valid, sebuah `object`; FC43: `object` hilang atau di luar 0–255, sebuah `offset`, `type`, `length`, atau `enum`) |
| `bad-parts` | error | `parts` kosong, ditetapkan pada register yang bukan `string` dengan `length` valid, atau sebuah bagian tidak memiliki `name` atau `offset`, memiliki `offset` negatif, `type` yang tidak dikenal atau `bool`, bagian `string` tanpa `length`, bagian yang melewati blok, atau bagian yang tumpang tindih (§4.10) |
| `no-rows` | warning | `registers` kosong |
| `duplicate-name` | warning | Sebuah `name` dipakai lebih dari sekali oleh register yang rentang firmware-nya tumpang tindih (§3.2) |
| `model-list` | warning | `model` mencantumkan perangkat yang dipisahkan “ / ”; berikan nama keluarga dan cantumkan perangkat di `models` (§3.2) |
| `overlap` | warning | Sebuah nilai dimulai di dalam register nilai lain pada area yang sama, yang biasanya berarti alamat atau tipe yang salah. Register yang dimulai pada alamat yang sama adalah pembacaan alternatif dari data yang sama (misalnya kode yang dibaca sebagai angka dan sebagai teks) dan tidak pernah dihitung sebagai tumpang tindih; begitu pula bit dan bidang bit dari satu register (`bool` + `bit`, `uint16` + `bit` + `bits`), maupun register yang rentang firmware-nya tidak tumpang tindih |
| `firmware-outside-map` | warning | Rentang firmware sebuah register tidak memiliki versi yang sama dengan rentang file, sehingga tidak pernah berlaku |
| `bad-read` | error | `read_group` adalah string kosong |
| `unknown-key` | warning | Sebuah register memiliki kunci yang tidak ada dalam spesifikasi ini dan tidak diawali `x_` |
| `unused-write-limit` | warning | `write_min` atau `write_max` ditetapkan pada register yang tidak berpengaruh (`bool`, `string`, atau `access` `"R"`) |
| `unused-bit` | warning | `bit` ditetapkan pada register yang tidak berpengaruh (tipe apa pun selain `bool`, kecuali `bits` juga ditetapkan pada `uint16`) |

Register dengan kesalahan pada `name`, `area`, `address`, atau `type` tidak diperiksa lebih lanjut. Register dengan kesalahan apa pun dikeluarkan dari pemeriksaan `overlap`.

[JSON Schema](schema/mbmap-2.schema.json) memeriksa struktur, tipe JSON, dan rentang nilai; aturan yang mengaitkan beberapa nilai (`unknown-enum`, faktor skala, `overlap`, `address-range`, `bad-reference` menurut tipe, kunci duplikat) memerlukan kode. Folder [`tests/`](tests/) berisi file contoh beserta diagnostik yang harus dihasilkan masing-masing, sehingga implementasi apa pun dapat memeriksa dirinya terhadapnya.

## 8. Kompatibilitas dan pemberian versi

- Pembaca **MUST** mengabaikan kunci yang tidak dikenalnya, di tingkat atas dan di register. Ini memungkinkan file yang lebih baru terbuka di pembaca yang lebih lama.
- Kunci khusus produsen atau alat **SHOULD** diawali `x_` (`"x_modbench_icon"`, `"x_alarm_high"`) agar tidak pernah bentrok dengan versi spesifikasi ini di masa depan. Nilainya boleh **(MAY)** bertipe JSON apa pun.
- `mbmap` adalah versi **mayor**. Pembaca **MUST** menolak file yang `mbmap`-nya tidak didukungnya, dan **SHOULD** menyebutkan versi yang ditemukannya.
- Kunci opsional baru yang dapat diabaikan pembaca lama dengan aman ditambahkan tanpa mengubah `mbmap`. Kunci yang artinya akan disalahpahami pembaca lama bila diabaikan memerlukan versi mayor baru.
- File skema dinamai menurut versi mayor (`mbmap-2.schema.json`) dan di dalamnya hanya mendapat kunci opsional.

## 9. Memeriksa peta terhadap perangkat yang terhubung

Alat yang membaca register identitas (§4.7), atau jawaban identitas yang dijelaskan oleh `identify` (§4.8), dari perangkat yang terhubung **SHOULD** membandingkannya dengan peta, agar pengguna tidak mempercayai nilai dari peta yang ditulis untuk model atau firmware lain. Alat juga boleh membiarkan pengguna menyatakan model atau firmware secara manual bila perangkat tidak melaporkannya.

Setiap pemeriksaan memiliki salah satu dari tiga hasil:

| Hasil | Model | Firmware |
|---|---|---|
| **match** | Model perangkat, dibandingkan tanpa memperhatikan huruf besar-kecil dan spasi di sekelilingnya, adalah salah satu dari `models` (atau `model`) | Versi perangkat berada dalam `firmware_min` … `firmware_max` |
| **mismatch** | Bukan | Berada di luar rentang |
| **unknown** | Peta tidak memiliki register `"model"`, tidak dapat dibaca, atau tidak memberi nilai | Peta tidak memiliki register `"firmware"`, tidak dapat dibaca, tidak ditemukan string versi di dalamnya, atau peta tidak menyatakan rentang |

Yang dilakukan alat untuk masing-masing:

- **match**: tidak ada yang perlu dilaporkan; alat boleh **(MAY)** menunjukkan bahwa perangkat dikenali.
- **mismatch**: alat **SHOULD** memperingatkan dengan jelas, menyebutkan apa yang diharapkan peta dan apa yang dilaporkan perangkat, dan **SHOULD** meminta konfirmasi sebelum penulisan pertama ke perangkat. Alat tidak boleh **(MUST NOT)** berhenti membaca karenanya: membaca tidak berbahaya, dan pengguna mungkin lebih tahu (perangkat ganti merek, firmware lebih baru yang mempertahankan register yang sama).
- **unknown**: bukan masalah. Sebagian besar perangkat tidak melaporkan model atau firmware, dan sebagian besar peta berlaku untuk setiap firmware. Alat tidak boleh **(MUST NOT)** menganggapnya mismatch, dan boleh **(MAY)** menyebutkan bahwa peta menyatakan rentang firmware yang tidak dapat diperiksa.

Register dengan rentang firmware sendiri (§3.2):

- Bila firmware **diketahui**, alat **SHOULD** hanya memakai register yang rentangnya mencakupnya: yang lain tidak ada pada perangkat ini, dan nama register yang dibagi beberapa rentang firmware berarti satu register.
- Bila firmware **tidak diketahui**, alat **SHOULD** membaca setiap register dan **SHOULD** menunjukkan mana yang bergantung pada firmware (misalnya “firmware 2.1 dan yang lebih baru”), dan boleh **(MAY)** membiarkan pengguna memilih versi.

Peta tanpa `models`, `firmware_min`, `firmware_max`, dan register identitas tidak diperiksa terhadap apa pun, yang tepat untuk peta yang berlaku bagi setiap perangkat dari modelnya.

## 10. File lama

Format versi 1, yang berbasis CSV, sudah usang. Pembaca baru tidak perlu mendukungnya; file dalam format itu dapat dikonversi dengan [`tools/migrate/migrate.py`](tools/migrate/migrate.py) (lihat [legacy/v1](legacy/v1/)).
