# Modbus fonksiyon kodları ve register alanları

Her Modbus isteği bir fonksiyon kodu belirtir. Bu kod hem eylemi hem de eylemin etki ettiği cihaz alanını belirler.

| Kod | Ad | Alan | Boyut |
|---|---|---|---|
| 01 | Read Coils | coil'ler (0x) | bit, okuma/yazma |
| 02 | Read Discrete Inputs | ayrık girişler (1x) | bit, salt okunur |
| 03 | Read Holding Registers | tutma register'ları (4x) | 16 bit, okuma/yazma |
| 04 | Read Input Registers | giriş register'ları (3x) | 16 bit, salt okunur |
| 05 | Write Single Coil | coil'ler | açık için `0xFF00`, kapalı için `0x0000` yazın |
| 06 | Write Single Register | tutma register'ları | tek register |
| 15 (0x0F) | Write Multiple Coils | coil'ler | birkaç bit |
| 16 (0x10) | Write Multiple Registers | tutma register'ları | birkaç register |
| 17 (0x11) | Report Server ID | — | cihaz kimliği, biçimi cihaz belirler |
| 43 / 14 (0x2B/0x0E) | Read Device Identification | — | üretici, ürün kodu, revizyon metin olarak |

## Tutma mı, giriş mi?

Kılavuzdaki tablo veya adres öneki size söyler: `3xxxx` 04 ile, `4xxxx` 03 ile okunur. Bazı cihazlar iki fonksiyona da aynı verilerle yanıt verir; diğerleri yanlış olanı 01 istisnasıyla (illegal function) reddeder. Bir kılavuz ne önek ne de fonksiyon belirtiyorsa önce 03'ü deneyin.

## Yazma

- 32 bitlik bir değer, 16 ile birlikte yazılan iki register gerektirir; yarılarını 06 ile tek tek yazmak cihazı karışık bir değerle bırakabilir ya da reddedilebilir.
- Bazı cihazlar yalnızca 06, diğerleri yalnızca 16 kabul eder. Kılavuzun desteklenen fonksiyon listesi bunu çözer.
- 05 ile yazılan coil'ler tam olarak `0xFF00` veya `0x0000` taşımalıdır.

## MBMap haritaları bunu nasıl kaydeder

Her register'ın bir `area`'sı (`coil`, `discrete`, `input`, `holding`) ve bir `access`'i (`R`, `W`, `RW`) vardır; bir araç fonksiyonu bunlardan seçer. Haritalar ayrıca 17 ve 43 kimlik fonksiyonlarını da tanımlayabilir; böylece bir araç hangi cihazla konuştuğunu kontrol edebilir.
