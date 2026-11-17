# Unit ID Modbus (slave ID): perangkat mana yang menjawab

Setiap permintaan Modbus membawa unit ID satu byte, disebut juga slave ID, alamat slave, atau alamat perangkat.

## Pada RS-485 (Modbus RTU)

- Setiap perangkat di bus memiliki alamat sendiri dari 1 sampai 247, diatur pada layarnya, dengan DIP switch, atau di perangkat lunak konfigurasinya.
- Alamat 0 adalah broadcast: setiap perangkat melaksanakan penulisan, dan tidak ada yang menjawab. Pembacaan ke 0 tidak mendapat balasan.
- Perangkat yang diatur ke alamat lain mengabaikan permintaan Anda sepenuhnya, sehingga unit ID yang salah tampak seperti perangkat mati: Anda mendapat [timeout](modbus-timeout-no-response), bukan kesalahan.

## Pada Modbus TCP

- Perangkat yang dijangkau langsung lewat IP biasanya mengabaikan unit ID atau mengharapkan 1. Ada yang mengharapkan 0 atau 255, dan beberapa menolak apa pun selain nilai yang dikonfigurasi.
- Di belakang gateway TCP-ke-RTU, unit ID memilih perangkat serial: harus cocok dengan alamat RS-485 perangkat itu. Gateway sendiri sering menjawab pada 0, 255, atau ID yang dikonfigurasi.
- Beberapa perangkat dengan beberapa bagian internal (inverter dengan meter dan baterai) menjawab unit ID berbeda untuk setiap bagian.

<mb-gateway></mb-gateway>

## Mencari alamat yang tidak diketahui

- Baca dari layar atau label perangkat.
- Pindai: kirim pembacaan register umum ke setiap alamat dari 1 sampai 247 pada baud rate perangkat dan catat mana yang menjawab. Lakukan dengan hanya perangkat itu yang terhubung.
- Setel ulang ke pengaturan pabrik; manual menyebutkan nilai bawaannya (sering 1).

## Cara peta MBMap mencatatnya

Peta menyebutkan `unit_id` bawaan perangkat (serta pengaturan serial dan port TCP). Nilai bawaan hanyalah titik awal: perangkat biasanya dikonfigurasi ulang saat dipasang.
