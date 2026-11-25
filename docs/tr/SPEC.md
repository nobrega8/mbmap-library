# `.mbmap` — Modbus Map biçimi, sürüm 2

Bir `.mbmap.json` dosyası, bir cihaz modelinin Modbus register haritasını tanımlar: kim üretir, onunla nasıl konuşulur ve her register ne anlama gelir. Bir JSON belgesidir; bu yüzden her dil onu standart JSON ayrıştırıcısıyla okuyabilir ve bir [JSON Schema](schema/mbmap-2.schema.json) yapısını tanımlar.

**MUST** (zorunlu), **SHOULD** (önerilir) ve **MAY** (isteğe bağlı) anahtar sözcükleri [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)'daki gibi kullanılır.

## 1. Örnek

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

Tam bir örnek [examples/example-corp/em-100.mbmap.json](examples/example-corp/em-100.mbmap.json) dosyasındadır.

## 2. Dosya

- Bir harita, UTF-8 olarak kodlanmış tek bir JSON nesnesidir ([RFC 8259](https://www.rfc-editor.org/rfc/rfc8259)). Okuyucular baştaki bir BOM'u kabul edip yok **saymalıdır (MUST)**. Yazıcılar bir BOM yazmamalıdır **(SHOULD NOT)**.
- Dosya adı `.mbmap.json` ile biter.
- Bir nesne bir anahtarı yinelememelidir **(MUST NOT)**. JSON ayrıştırıcıları yinelenen anahtarları farklı ele alır; bu yüzden bir tane içeren dosya geçersizdir.
- Metinler yazıldığı gibi kullanılır: kırpma yoktur ve sıralı değerler büyük/küçük harfe duyarlıdır (`"holding"`, `"Holding"` değil).
- JSON `null` hiçbir anahtar için geçerli bir değer değildir; bunun yerine anahtarı bırakın.
- JSON'da yorum yoktur. Tüm dosya hakkındaki notlar `notes` içine, bir register hakkındaki not onun `comment` alanına gider. İkisi de araçların gösterebileceği **(MAY)** ve yorumlamaması gereken **(MUST NOT)** serbest metindir.
- Yazıcılar §1'deki düzeni kullanmalıdır **(SHOULD)**: iki boşluk girinti ve register başına ve `enums`/`sentinels` tablosu başına bir satır; böylece bir register'daki değişiklik tek satırlık bir fark olur.
- `$schema` isteğe bağlıdır ve düzenleyicileri JSON Schema'ya yönlendirir. Okuyucular bunu yok saymalıdır **(MUST)**.

### 2.1 Tam sayılar

Bir değerin **tam sayı** olduğu yerde, JSON tam sayısı (`1040`) veya ondalık tam sayı ya da `0x` hex içeren bir metin (`"0x0410"`) olarak yazılabilir **(MAY)**. Metinler, kılavuzların adresler ve tanımlayıcılar için kullandığı hex yazımını korur ve her JSON ayrıştırıcısının sayı olarak tam okumadığı 64 bitlik değerleri taşır (2^53'ün ötesi). `enums` ve `sentinels` tablolarının anahtarları her zaman bu iki biçimdeki metinlerdir.

### 2.2 Tablolar

Bir **tablo** ham değerleri etiketlere eşler: anahtarları metin olarak yazılmış tam sayılar (§2.1) ve değerleri boş olmayan etiketler olan bir nesne, örneğin `{"0": "Stopped", "1": "Idle", "0xFFFF": "Unimplemented"}`. Bir tabloda en az bir giriş vardır ve iki anahtar aynı değeri göstermemelidir **(MUST NOT)** (`"1"` ve `"0x1"`).

## 3. Üst düzey anahtarlar

`mbmap`, `vendor`, `model` ve `registers` zorunludur. Diğer her anahtar isteğe bağlıdır; eksikse varsayılan geçerlidir.

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `mbmap` | integer `2` | | Biçim sürümü (§3.1, §8) |
| `vendor` | non-empty string | | Üretici |
| `model` | non-empty string | | İnsanlara gösterilen model veya model ailesi |
| `models` | array of non-empty strings | `[model]` | Haritanın geçerli olduğu her model adı veya kodu (§3.2) |
| `vendor_website` | string: a domain or an `http(s)://` URL | | Üreticinin web sitesi, örn. `se.com` veya `https://www.se.com` |
| `description` | string | | Kısa açıklama |
| `revision` | integer ≥ 1 | | Bu haritanın içeriğinin revizyonu (§3.1) |
| `revised` | string `YYYY-MM-DD` | | O revizyonun tarihi |
| `firmware` | string | | Haritanın geçerli olduğu donanım yazılımı hakkında serbest metin |
| `firmware_min` | version string (§3.2) | | Haritanın geçerli olduğu en eski donanım yazılımı |
| `firmware_max` | version string (§3.2) | | Haritanın geçerli olduğu en yeni donanım yazılımı |
| `source` | string | | Haritanın nereden geldiğinin serbest metin özeti |
| `sources` | array of source objects | | Haritanın oluşturulduğu veya kontrol edildiği belgeler (§3.3) |
| `notes` | array of strings | | Dosya hakkında serbest notlar |
| `protocol` | `"tcp"`, `"rtu"`, `"tcp+rtu"` | `"tcp+rtu"` | Cihazın desteklediği taşıma yöntemleri |
| `unit_id` | integer `0`–`255` | `1` | Varsayılan unit / slave id |
| `port` | integer `1`–`65535` | `502` | Varsayılan TCP portu |
| `baudrate` | integer | `9600` | Varsayılan RTU baud hızı |
| `parity` | `"N"`, `"E"`, `"O"` | `"E"` | Varsayılan RTU paritesi |
| `databits` | `7`, `8` | `8` | Varsayılan RTU veri bitleri |
| `stopbits` | `1`, `2` | `1` | Varsayılan RTU stop bitleri |
| `byte_order` | `"big"`, `"little"` | `"big"` | Her register içindeki varsayılan bayt sırası (§6) |
| `word_order` | `"big"`, `"little"` | `"big"` | Çok register'lı bir değerin register'larının varsayılan sırası (§6) |
| `address_base` | `0`, `1` | `0` | `address`'in 0'dan mı 1'den mi başladığı (§5) |
| `max_read_registers` | integer `1`–`125` | `125` | Cihazın okuma başına kabul ettiği en büyük blok (FC03/04) |
| `max_read_bits` | integer `1`–`2000` | `2000` | Cihazın okuma başına kabul ettiği en büyük blok (FC01/02) |
| `enums` | object: name → table | | Adlandırılmış çeviri tabloları (§4.1). Adlar `a`–`z`, `0`–`9` ve `_` kullanır |
| `sentinels` | object: type → table | | Tam sayı türü başına ayrılmış ham değerler (§4.2) |
| `identify` | object | | Cihaz kimliğinin Report Slave ID (FC17) veya Read Device Identification (FC43) ile nasıl okunacağı (§4.8) |
| `function_reads` | okuma nesneleri dizisi | | Dört veri alanının dışındaki bir işlev koduyla yapılan okumalar (4.11) |
| `registers` | array of register objects | | Register'lar (§4) |

Bağlantı değerleri **varsayılanlardır**: kullanıcı bağlanırken yine de değiştirebilir.

### 3.1 Biçim sürümü ve harita revizyonu

Bir haritayı iki sayı tanımlar ve farklı nedenlerle değişirler:

- **`mbmap`, biçim sürümü**, dosyanın bu şartnamenin hangi sürümüne uyduğunu söyler; böylece bir okuyucu onu okuyup okuyamayacağını bilir (§8). Bu şartnameye göre yazılmış her haritada aynıdır ve yalnızca biçim değiştiğinde değişir.
- **`revision`, harita revizyonu**, dosyanın bu haritanın içeriğinin hangi baskısı olduğunu söyler. `1`'den başlar ve cihazın nasıl okunduğunu veya yazıldığını etkileyen her yayımlanmış değişiklikte (bir register, bir bağlantı varsayılanı, bir tablo, bir donanım yazılımı aralığı veya bir model) bir artırılmalıdır **(SHOULD)**. Yalnızca serbest metin değişikliklerinde (`description`, `notes`, `comment`, `source`) aynı kalabilir **(MAY)**. `revised` o değişikliğin tarihini verir.

Aynı haritanın iki kopyasına (aynı `vendor` ve `model`) sahip bir araç, daha yüksek `revision`'ı daha yeni sayar **(SHOULD)** ve kullanıcıya daha yeniyi sunabilir **(MAY)**. `revision`'ı olmayan bir harita bu şekilde karşılaştırılamaz. Revizyon, cihazın donanım yazılımı sürümü değildir: donanım yazılımı §3.2'ye aittir.

### 3.2 Modeller ve donanım yazılımı

Bir harita `models` içindeki modeller için, `models` yoksa yalnızca `model` için geçerlidir. `model` insanlara gösterilen addır: bir cihaz ya da harita birkaçını kapsıyorsa aile veya seri adı (`"PM5100 and PM5300 series"`), cihazların bir listesi değil. `models` bir cihazın bildirebileceği her adı veya kodu listeler; böylece bir araç bunu bağlı cihazla karşılaştırabilir (§9):

```json
"model": "PM5100 and PM5300 series",
"models": ["PM5110", "PM5111", "PM5310", "PM5320", "PM5330"]
```

`firmware_min` ve `firmware_max`, haritanın hangi donanım yazılımı sürümleri için geçerli olduğunu söyler. İkisi de isteğe bağlıdır: onlarsız harita her donanım yazılımı için geçerlidir; sürüm bilinmediğinde de doğru seçim budur. `firmware` bir aralığın söyleyemediği her şey için kullanılabilir kalır (“2.x, 2.3 beta hariç”).

Bir **sürüm metni**, noktalarla ayrılmış bir veya daha fazla tam sayıdır: `"2"`, `"2.1"`, `"1.02.7"`. Bileşenler soldan itibaren sayı olarak karşılaştırılır (`"1.10"`, `"1.9"`'dan yenidir ve `"1.02"`, `"1.2"` ile aynıdır); bu yüzden sürümleri cihazın bildirdiği şekilde yazın. Bir sınır, onunla başlayan her sürümü kapsar:

- `firmware_min` `"2.1"`, `2.1`, `2.1.4` ve `3.0`'ı içerir ama `2.0.9`'u içermez;
- `firmware_max` `"2"`, her `2.x` ve `2.x.y`'yi içerir ama `3.0`'ı içermez; `firmware_max` `"2.3"`, `2.3.7`'yi içerir ama `2.4`'ü içermez.

Yani `"firmware_min": "1", "firmware_max": "2"` “donanım yazılımı 1.x ve 2.x” diye okunur. `firmware_min`, `firmware_max`'tan sonra olmamalıdır **(MUST NOT)**.

**Donanım yazılımına bağlı register'lar.** Bir register yalnızca bazı donanım yazılımı sürümlerinde varsa, aynı anlamla kendi `firmware_min` ve `firmware_max` değerlerini taşıyabilir. Bu, birkaç register'da farklılaşan donanım yazılımı revizyonları için tek bir dosya tutmayı sağlar. Bunlar olmayan bir register, haritanın geçerli olduğu her yerde geçerlidir. İki register, donanım yazılımı aralıkları çakışmıyorsa bir `name`'i (ve bir adresi) paylaşabilir **(MAY)**: araç cihaza uyanı kullanır.

Örnek: donanım yazılımı 2.1 enerji sayacını taşıdı ve bir güç faktörü register'ı ekledi:

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

Farklar büyük olduğunda (çoğu adres veya bağlantı ayarları değişir), ayrı dosyalar daha açıktır: her donanım yazılımı aralığı için bir harita, her biri kendi `firmware_min` ve `firmware_max` değerleriyle.

### 3.3 Kaynaklar

`sources`, bir haritanın oluşturulduğu veya karşılaştırıldığı belgeleri kaydeder; böylece bir okuyucu onları bulabilir ve hangi baskının kullanıldığını söyleyebilir. Her öğe bir nesnedir:

| Key | JSON type | Anlamı |
|---|---|---|
| `title` | non-empty string, required | Belge başlığı, örn. `"EM530/EM540 Modbus communication protocol"` |
| `version` | string | Belgenin üzerinde basıldığı şekliyle baskısı veya revizyonu |
| `date` | string `YYYY`, `YYYY-MM` or `YYYY-MM-DD` | O baskının yayın tarihi |
| `url` | `http(s)://` URL | Belgenin bulunabileceği yer |
| `note` | string | Hangi bölümün kullanıldığı veya haritanın nasıl kontrol edildiği (örn. `"tables 4.1-4.24"`, `"tested on a device with firmware 2.1"`) |
| `accessed` | string `YYYY-MM-DD` | Belgenin ne zaman indirildiği veya okunduğu; çünkü aynı URL'deki bir belge yeni sürüm olmadan değişebilir |
| `sha256` | string of 64 hex digits | Kullanılan dosyanın SHA-256 değeri; böylece bir okuyucu `url`'deki belgenin hâlâ aynı olup olmadığını söyleyebilir |

```json
"sources": [
  {"title": "EM530/EM540 Modbus communication protocol", "version": "1.3", "date": "2024-02-13", "url": "https://www.gavazziautomation.com/...", "note": "tables 4.1-4.24", "accessed": "2026-11-14", "sha256": "9f2b…"}
]
```

`sha256` yukarıda kısaltılmış gösterilmiştir; bir dosyada 64 hex hanenin tamamıdır. Bir araç bunu indirdiği belgeyle karşılaştırabilir **(MAY)** ve farklıysa uyarabilir: belge güncellenmiştir ve haritanın yeniden kontrol edilmesi gerekebilir.

`source`, insanlar için ve kaynakları bu ayrıntıda bilinmeyen haritalar için tek satırlık serbest metin özeti olarak kalır. Bir harita ikisine de sahip olabilir **(MAY)**.

## 4. Register'lar

`registers` içindeki her öğe bir nesnedir. `name`, `area`, `address` ve `type` zorunludur; diğer her anahtar isteğe bağlıdır ve eksikse varsayılan geçerlidir.

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `name` | non-empty string | | Değişken adı. Dosyada benzersiz olmalıdır **(SHOULD)** |
| `group` | string | | Görüntüleme için serbest gruplama (örn. `Measurements`) |
| `area` | `"coil"`, `"discrete"`, `"input"`, `"holding"` | | Modbus veri alanı (§5) |
| `address` | integer (§2.1) | | İlk register / bit adresi (§5) |
| `type` | see §6 | | Veri türü |
| `length` | integer ≥ 1 | | Register sayısı. `string` için zorunlu, aksi halde yok sayılır |
| `bit` | integer `0`–`15` | | `input`/`holding` içindeki `bool` için: register'ın hangi biti, 0 = en az anlamlı. Bir `uint16` bit alanı için: en düşük biti |
| `bits` | integer `1`–`16` | | `input`/`holding` içindeki `uint16` için: `bit`'ten başlayan bir bit alanının genişliği (§4.3) |
| `scale` | number | `1` | Çarpan |
| `scale_factor` | string: a register `name` | | Tam sayı değeri, bunun için 10 kuvveti üssü olan register (§4.4) |
| `offset` | number | `0` | Ölçeklemeden sonra eklenir |
| `unit` | string | | Mühendislik birimi (`V`, `kWh`, `°C`…) |
| `access` | `"R"`, `"W"`, `"RW"` | `"R"` | İzin verilen işlemler |
| `byte_order` | `"big"`, `"little"` | file `byte_order` | Bu register için dosya varsayılanını geçersiz kılar (§6) |
| `word_order` | `"big"`, `"little"` | file `word_order` | Bu register için dosya varsayılanını geçersiz kılar (§6) |
| `write_min` | number | | Yazarken kabul edilen en küçük değer, mühendislik biriminde (§4.5) |
| `write_max` | number | | Yazarken kabul edilen en büyük değer, mühendislik biriminde (§4.5) |
| `enum` | string (a name in `enums`) or table | | Tam sayı veya bool değerleri için etiketler (§4.1) |
| `reference` | see §4.6 | | Sağlıklı bir cihazda bu register'ın tutması beklenen ham değer |
| `firmware_min` | version string (§3.2) | | Bu register'a sahip en eski donanım yazılımı |
| `firmware_max` | version string (§3.2) | | Bu register'a sahip en yeni donanım yazılımı |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Bu register cihazı tanımlar (§4.7) |
| `read_alone` | boolean | `false` | Register kendi isteğinde okunur (§4.9) |
| `read_group` | non-empty string | | Register yalnızca aynı gruptaki register'larla birlikte okunur (§4.9) |
| `parts` | array of objects | | Bir blok register'ının içindeki değerleri veya bir kelime register'ının bit alanlarını adlandırır; böylece bir araç bunları tek tek gösterip düzenleyebilir (§4.10) |
| `description` | string | | Serbest metin |
| `comment` | string | | Haritayı düzenleyen insanlar için register hakkında serbest not |

Mühendislik değeri = ham × 10^`scale_factor` × `scale` + `offset` (`scale_factor` olmadan: ham × `scale` + `offset`). Yazarken bir araç tersini uygular ve tam sayı türleri için en yakın tam sayıya yuvarlar.

### 4.1 Çeviri tabloları

Birçok register bir durumu temsil eden bir sayı tutar: `0` durdurulmuş, `1` boşta, `2` başlıyor, vb. `enum` bu sayıları etiketlere çevirir. Şunlardan biridir:

- **register'a yazılmış bir tablo**: `"enum": {"0": "Stopped", "1": "Idle", "2": "Starting"}`;
- **üst düzey `enums` içindeki bir tablonun adı**; böylece aynı liste, onu kullanan her register için bir kez yazılır:

```json
"enums": {
  "run_state": {"0": "Stopped", "1": "Idle", "2": "Starting", "3": "Running", "4": "Fault"}
},
"registers": [
  {"name": "Pump 1 state", "area": "holding", "address": 100, "type": "uint16", "enum": "run_state"},
  {"name": "Pump 2 state", "area": "holding", "address": 101, "type": "uint16", "enum": "run_state"}
]
```

Değerler, `scale` ve `offset`'ten önceki **ham** değerle karşılaştırılır. Tabloda olmayan bir değer düz bir sayı olarak gösterilir. Araçlar yazarken etiketleri sunmalıdır **(SHOULD)**.

### 4.2 Nöbetçi değerler

Bazı cihazlar bir okuma yerine ayrılmış bir ham değerle yanıt verir: bir değer “uygulanmamış”, bir başkası “aralık üstü”, bir diğeri “sensör arızası” demektir. `sentinels` bunları bir türün her register'ı için bildirir:

```json
"sentinels": {
  "uint16": {"0xFFFF": "Unimplemented", "0xFFFE": "Over range", "0xFFFD": "Under range"},
  "int16": {"0x7FFF": "Unimplemented", "0x7FFE": "Over range", "0x7FFD": "Under range"},
  "uint32": {"0xFFFFFFFF": "Unimplemented"}
}
```

- `sentinels` anahtarları `int16`, `uint16`, `int32`, `uint32`, `int64`, `uint64`'tür. Bir tablo o türdeki her register için geçerlidir.
- Değerler türe sığmalıdır **(MUST)** ve `scale` ile `offset`'ten önceki **ham** değerle karşılaştırılır.
- Bir okuma eşleştiğinde araçlar sayı yerine etiketi göstermeli **(SHOULD)** ve onu bir ölçüm saymamalıdır **(SHOULD NOT)** (grafiklerde, sınırlarda veya ortalamalarda).
- Aynı ham değer için bir `enum` etiketi, nöbetçiye göre önceliklidir.

### 4.3 Bit alanları

Bazı cihazlar bir register'a birkaç küçük değer paketler, örneğin dört adet 4 bitlik alarm kodu. `bit` ve `bits` içeren bir `uint16` register'ı bunlardan birini okur: ham değer = (register >> `bit`) & (2^`bits` − 1). `bit` + `bits`, 16'yı aşmamalıdır **(MUST NOT)**.

```json
{"name": "Alarm A", "area": "holding", "address": 100, "type": "uint16", "bit": 12, "bits": 4, "enum": "alarm_condition"},
{"name": "Alarm B", "area": "holding", "address": 100, "type": "uint16", "bit": 8, "bits": 4, "enum": "alarm_condition"}
```

Aynı register'ın farklı alanlarını okuyan register'lar çakışmaz. Bir alan yazılırken register okunmalı, yalnızca alanın bitleri değiştirilmeli ve geri yazılmalıdır **(SHOULD)**.

### 4.4 Ölçek çarpanları

Bazı cihazlar, özellikle SunSpec eviriciler ve sayaçlar, bir değer için sabit bir ölçek yerine ayrı bir üs register'ı gönderir: değer ham × 10^üs olur ve üs cihazın aralığıyla değişebilir. `scale_factor` bu üs register'ını adlandırır:

```json
{"name": "AC power", "area": "holding", "address": 40083, "type": "int16", "unit": "W", "scale_factor": "W_SF"},
{"name": "W_SF", "area": "holding", "address": 40084, "type": "int16"}
```

- Adlandırılan register, aynı dosyada tam sayı türünde (`int16` … `uint64`) ve `bits` olmayan bir register olmalıdır **(MUST)** ve kendisinin bir `scale_factor`'ı olmamalıdır **(MUST NOT)**. Birkaç register adı paylaşıyorsa ilki geçerlidir.
- Yalnızca sayısal türlerin `scale_factor`'ı olabilir (`bool` veya `string` değil).
- Bir araç, kullanıcı göstermemeyi seçmiş olsa bile üs register'ını değerle birlikte okur. Üs okunamazsa veya bir nöbetçiyse (§4.2, örn. SunSpec'in `-32768` = uygulanmamış), değer kullanılamaz.
- Yazarken bir araç önce üssü okur ve tersini uygular.

### 4.5 Yazma sınırları

`write_min` ve `write_max`, bir register'ın yazılırken hangi değerleri kabul ettiğini bildirir; böylece bir araç kötü bir değeri cihaza ulaşmadan reddedebilir.

- İkisi de **mühendislik birimlerinde** sayılardır: `scale_factor`, `scale` ve `offset` uygulandıktan sonra kullanıcının gördüğü değer. `scale` değeri `0.1` olan bir register'da `0.5` sınırı, ham değer 5 demektir.
- İkisi de atlanabilir: eksik bir sınır o tarafı açık bırakır. İkisi de eksikse bir register'ın bildirilmiş sınırı yoktur (cihaz karar verir).
- `write_min`, `write_max`'tan büyük olmamalıdır **(MUST NOT)**. Sınırlar dahildir.
- Bir araç, mühendislik değeri `write_min`'in altında veya `write_max`'ın üstünde olan bir yazma göndermemelidir **(MUST NOT)** ve kullanıcıya hangi sınırın aşıldığını söylemelidir **(SHOULD)**.
- Ham değere dönüştürülmeden ve yuvarlanmadan önce, kullanıcının istediği değer için geçerlidirler. Sınırlar içinde olup yine de register'ın türüne sığmayan bir değer, olağan tür kontrolleriyle reddedilir.
- `bool` ve `string` register'larında veya yazılamayan register'larda (`access` `"R"`) bir anlamları yoktur ve yok sayılırlar.

```json
{"name": "Setpoint", "area": "holding", "address": 100, "type": "uint16", "scale": 0.1, "unit": "°C", "access": "RW", "write_min": 5, "write_max": 30}
```

### 4.6 Referans değerleri

`reference`, sağlıklı bir cihazın bu register'da tuttuğu bilinen bir değeri verir (bir model numarası, sabit bir protokol tanımlayıcısı, bir üretici kodu). Bir araç register'ı okuyup referansla karşılaştırarak, kullanıcı diğer değerlere güvenmeden önce yanlış bir adresi, tabanı, bayt sırasını veya veri türünü tespit edebilir. Her cihazda böyle bir register yoktur; bu yüzden çoğu register'ın `reference`'ı yoktur.

- `scale_factor`, `scale` ve `offset`'ten önceki **ham** değerdir ve o değerin JSON türündedir: tam sayı türleri ve bit alanları için bir tam sayı (§2.1), `float32` ve `float64` için bir sayı, `bool` için `true` / `false`, `string` için bir metin. Türe (ve bit alanının genişliğine veya bir metin için `2 × length` karaktere) sığmalıdır **(MUST)**.
- Kontrol register'ın kendisidir: bir araç onun `area` ve `address` değerini (`address_base`'e göre ayarlanmış) okur ve `type`'ını bayt ve kelime sırasıyla çözer.
- Bir haritada `reference`'lı istenildiği kadar register olabilir.
- Her kontrolün sonucu: **match** (çözülen ham değer referansa eşit), **mismatch** (farklı), **failed** (okuma hata döndürdü veya zaman aşımına uğradı, yani hiçbir şey bilinmiyor), **not checked** (register okunmadı). Bir araç bunları ayrı ayrı bildirmelidir **(SHOULD)**: mismatch yanlış bir haritaya veya ayara, failed bir bağlantı veya adresleme sorununa işaret eder.
- Float'lar türün kendi hassasiyetinde karşılaştırılır (bir `float32` referansı 32 bitlik float olarak karşılaştırılır). Metinler, sondaki NUL ve boşluk karakterleri kırpıldıktan sonra karşılaştırılır.
- Bir referans yalnızca bir teşhisi destekler. Birkaç bayt veya kelime sırası aynı baytları aynı değere çözebilir (küçük bir sayı veya bir palindrom birden fazla sırada aynı okunur); bu yüzden bir eşleşme tüm haritanın doğru olduğunu kanıtlamaz. Haritalar ayırt edici bir değer kullanmalı **(SHOULD)** ve cihazda birden fazlası varsa birden fazlasını vermelidir **(SHOULD)**.
- Okunamayan bir register'daki (`access` `"W"`) `reference` bir hatadır.

```json
{"name": "Manufacturer code", "area": "holding", "address": 768, "type": "uint16", "reference": "0x016A"},
{"name": "Serial prefix", "area": "holding", "address": 770, "type": "uint32", "word_order": "little", "reference": "0x00010002"}
```

### 4.7 Kimlik register'ları

`role`, hangi cihazın bağlı olduğunu söyleyen register'ları işaretler; böylece bir araç haritayı buna karşı kontrol edebilir (§9):

- **`"model"`**: cihazın model adı veya kodu. Değeri, veya varsa `enum` etiketi, `models` ile karşılaştırılır. Sayısal bir model koduna etiket vermek en iyisidir: `"enum": {"0x016A": "EM-100"}`.
- **`"firmware"`**: donanım yazılımı sürümü. Bir metin register'ı metin olarak okunur ve içindeki ilk sürüm metni kullanılır (`"V2.01b"` `2.01` verir). Bir sayı mühendislik değerini verir (`scale` `0.01` ile `102`, `1.02` verir). Birkaç register bu role sahipse değerleri dosyadaki sırayla noktalarla birleştirilir; bu, ana ve ikincil sürümleri ayrı tutan cihazlara uyar, örneğin bir register'ın iki bit alanı olarak (`"bit": 8, "bits": 8` ve `"bit": 0, "bits": 8`).
- **`"serial"`**: seri numarası. Araçlar bunu gösterebilir **(MAY)**; asla karşılaştırılmaz.

En fazla bir register `"model"` ve en fazla bir tanesi `"serial"` rolüne sahip olabilir **(MAY)**. Rolü olan bir register okunabilir olmalıdır **(MUST)**. Rolü olan register'lar başka açılardan sıradan register'lardır: diğerleri gibi okunur ve gösterilir ve bir `reference`'ları da olabilir.

### 4.8 Cihazdan kimlik (FC17, FC43)

Bazı cihazlar ne olduklarını kendi fonksiyonlarıyla bildirir ve kimlik register'ları yoktur. `identify`, hangi fonksiyonun gönderileceğini ve kimliğin yanıtta nerede olduğunu söyler; böylece bir araç haritayı §4.7'deki register'larda olduğu gibi kontrol edebilir (§9). Bir haritada en fazla bir `identify` vardır.

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

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `function` | `17` or `43` | | `17`: Report Slave ID. `43`: Read Device Identification (encapsulated interface transport, MEI türü `0x0E`) |
| `fields` | non-empty array of field objects | | Yanıttan alınacak değerler |

Her alan bir nesnedir. `name` her zaman zorunludur. `role` ve aşağıdaki anahtarlar `function`'a bağlıdır.

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `name` | non-empty string | | İnsanlara gösterilen ad |
| `role` | `"model"`, `"firmware"`, `"serial"` | | Değerin anlamı, register'larda olduğu gibi (§4.7). En fazla bir `"model"` ve bir `"serial"` |
| `offset` | integer ≥ 0 | | **Yalnızca FC17, zorunlu.** Alanın yanıtın verisindeki konumu, bayt cinsinden. Ofset `0`, bayt sayısından sonraki ilk bayttır; yani veri, bir cihazın kılavuzunda “byte count”tan sonra listelediği baytlardır |
| `type` | `"uint8"`, `"uint16"`, `"string"` | | **Yalnızca FC17, zorunlu.** `uint16` big-endian'dır. `string` ASCII'dir, sondaki NUL ve boşluk karakterleri kırpılır |
| `length` | integer ≥ 1 | | **Yalnızca FC17.** Bayt cinsinden uzunluk. `string` için zorunlu |
| `enum` | table name or inline table | | **Yalnızca FC17.** Bir sayıyı etikete çevirir (§4.1). Bir model koduna etiket vermek en iyisidir; bu etiket sonra `models` ile karşılaştırılır |
| `object` | integer 0–255 | | **Yalnızca FC43, zorunlu.** Nesne id'si: `0x00` VendorName, `0x01` ProductCode, `0x02` MajorMinorRevision, `0x03` VendorUrl, `0x04` ProductName, `0x05` ModelName, `0x06` UserApplicationName, `0x80`–`0xFF` cihaz tarafından tanımlanır |

- **FC43:** Bir nesnenin değeri bir ASCII metnidir, sondaki NUL ve boşluk karakterleri kırpılır. Bir araç, alanların adlandırdığı her nesneyi içeren erişim düzeyini (basic, regular veya extended) ister ve hepsini alana kadar “more follows” bayrağını izler. `"firmware"` için, bir metin register'ında olduğu gibi (§4.7), metindeki ilk sürüm metni kullanılır.
- **Her iki fonksiyon:** Bir cihaz bir register adresine değil, bir unit id'ye yanıt verir; bu yüzden `address_base` uygulanmaz.
- **Değer yok:** Bir alanın ihtiyacından kısa bir yanıt, bir istisna yanıtı, eksik bir nesne veya fonksiyonu desteklemeyen bir cihaz değer vermez. Kontrol **unknown**'dır (§9), mismatch değil.
- **Birkaç kaynak:** `identify` ve `role`'lü register'lar birlikte bulunabilir. İkisi de aynı rol için bir değer verirse bir araç register'ları kullanmalı **(SHOULD)** ve hiçbir register'ın vermediği roller için `identify`'ı kullanabilir **(MAY)**.

### 4.9 Ayrı isteklerle okuma

Bir okuyucu normalde komşu register'ları tek bir istekte birleştirir. Bazı cihazlar, içindeki her register var olsa bile iki iç tablo arasındaki sınırı aşan bir isteği reddeder. İki isteğe bağlı anahtar register'ların nasıl birleştirileceğini sınırlar:

- **`read_alone`**: `true`, register'ın başka hiçbir register içermeyen bir istekte okunduğu anlamına gelir. Aynı sözcükleri kaplayan bit alanları ve diğer register'lar aynı register sayılır.
- **`read_group`**: bir ad. Aynı ada sahip register'lar tek istekte okunabilir **(MAY)** ve bir istek farklı grupların register'larını veya grupsuz bir register'ı içermemelidir **(MUST NOT)**. `read_group`'u olmayan register'lar eskisi gibi birleştirilir.

```json
{"name": "Digital input status", "area": "holding", "address": 768, "type": "uint16", "read_group": "status"},
{"name": "Active tariff", "area": "holding", "address": 769, "type": "uint16", "read_group": "status"},
{"name": "Firmware", "area": "holding", "address": 770, "type": "uint16", "read_alone": true}
```

İki anahtar da varsa `read_alone` kazanır. Anahtarlar yalnızca birleştirmeyi sınırlar: bir okuyucu gerekenden fazla istek yapmakta serbesttir ve `max_read_registers` ile `max_read_bits` yine geçerlidir. Yalnızca register'ların nasıl istendiğini etkilerler, ne anlama geldiklerini değil; bu yüzden onları bilmeyen bir okuyucu aynı register'ları her zamanki gibi birleştirerek okur. Bu nedenle yeni bir `mbmap` sürümü gerektirmezler (§8): birleştirilmiş isteği reddeden bir cihazda, eski bir okuyucu anahtarlar olmadan nasıl başarısız olacaksa aynen öyle başarısız olur.

### 4.10 Bir bloğun parçaları

Bazı cihazlar bir blokta birkaç değer tutar ve yalnızca bloğu bütün olarak kabul eder: ortasında başlayan veya onu kapsamayan bir yazma reddedilir (istisna `0x02` veya `0x03`). Tipik bir örnek, bloğunda alıcının numarasını mesaj metni izleyen bir SMS ağ geçididir. Harita bu bloğu eskisi gibi **tek** bir register olarak tanımlar ve `parts` içinde ne olduğunu söyler:

```json
{
  "name": "Add SMS", "area": "holding", "address": 397, "type": "string", "length": 90, "access": "RW",
  "parts": [
    {"name": "Recipient", "offset": 0, "length": 10, "description": "Phone number as 00 + digits (00 stands for +)"},
    {"name": "Text", "offset": 10, "length": 80}
  ]
}
```

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `name` | non-empty string | | İnsanlara gösterilen ad |
| `offset` | integer ≥ 0 | | Parçanın bloktaki konumu, register'ın ilk register'ından itibaren **register** cinsinden |
| `type` | `"string"` or a numeric type (§6) | `"string"` | Parçanın nasıl okunup yazıldığı |
| `length` | integer ≥ 1 | | Register sayısı. `string` için zorunlu, diğer türler için yok sayılır |
| `description` | string | | Serbest metin |

- `parts` yalnızca bir `string` register'ı içindir. Boş olmamalıdır **(MUST NOT)**. Her parça bloğun içinde kalmalıdır **(MUST)** (`offset` artı register'ları en fazla register'ın `length`'i kadar) ve parçalar çakışmamalıdır **(MUST NOT)**. Hiçbir parçanın kapsamadığı register'lara izin verilir: bunlar dolgudur.
- Register kendi anlamını korur. `parts`'ı bilmeyen bir okuyucu tüm bloğu eskisi gibi tek bir metin olarak, tek istekte okur ve yazar; böylece böyle bir harita her araçta çalışmaya devam eder.
- `parts`'ı bilen bir araç her parçayı kendi alanı olarak göstermelidir **(SHOULD)**. Okumak için, register'ın `byte_order` ve `word_order` değerleriyle (§6) her parçayı bloktan çözer. Yazmak için, bloğun **tamamını** parçalardan oluşturur ve tek istekte (FC16) gönderir: kullanıcının boş bıraktığı bir parça sıfır baytlar olarak gönderilir; böylece boş bir alan hiçbir zaman yanlışlıkla eski bir değeri korumaz. Bir araç yalnızca bazı parçaları kapsayan bir yazma göndermemelidir **(MUST NOT)**; çünkü cihaz bunu reddeder.
- Bir `string` parçası ASCII'dir ve `length` değerine kadar NUL karakterleriyle doldurulur. Araç, `2 × length` karakterden uzun bir metni reddetmelidir **(MUST)**. Sayısal bir parça olağan şekilde kodlanır (§6).
- `access` register'ınkidir: parçalar bloktan daha yazılabilir olamaz.
- `parts` yalnızca bir register'ın içinde ne olduğunu tanımlar; bu yüzden yeni bir `mbmap` sürümü gerektirmez (§8). Onu yok sayan okuyucular eskisi gibi davranır.

#### Bir kelimenin bit alanları

Bazı cihazlar birkaç ayarı, yalnızca **bütün olarak** kabul ettikleri tek bir kelimede tutar: bir biti ayarlayan yazma diğerlerini sıfırlar. Aynı `parts` anahtarı bu kelimeyi `uint16`, `uint32` veya `uint64` register'ında tanımlar. Register tek bir sıradan sayı olarak kalır; bu yüzden `parts`'ı bilmeyen bir okuyucu onu eskisi gibi okur ve yazar.

```json
{
  "name": "Control word", "area": "holding", "address": 2001, "type": "uint32", "access": "RW",
  "parts": [
    {"name": "Command", "bit": 0, "bits": 4, "enum": "command", "description": "Play, ready or stop"},
    {"name": "Error acknowledge", "bit": 4},
    {"name": "Enable unit 1", "bit": 21}
  ]
}
```

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `name` | non-empty string | | İnsanlara gösterilen ad |
| `bit` | integer ≥ 0 | | Alanın en düşük biti; 0 = register'ın `byte_order` ve `word_order` değerleriyle çözülen değerin en düşük anlamlı biti (§6) |
| `bits` | integer ≥ 1 | `1` | Alanın genişliği |
| `enum` | string | | Alanın değeri için bir çeviri tablosunun adı (§4.1) |
| `description` | string | | Serbest metin |

- `bit` + `bits` register genişliğini (16, 32 veya 64) aşmamalıdır (**MUST NOT**). Alanlar çakışmamalıdır (**MUST NOT**). Hiçbir alanın kapsamadığı bitlere izin verilir: kullanılmaz veya ayrılmıştır.
- Bit alanının `offset`, `length` veya `type` anahtarı yoktur: bunlar `string` register'ının parçalarına aittir ve iki tür aynı register'da karıştırılmaz.
- `parts`'ı bilen bir araç her alanı ayrı göstermelidir (**SHOULD**). Okumak için alanı çözülmüş değerden çıkarır. Yazmak için alanlardan **bütün** değeri oluşturur (ayarlanmamış alan 0 olarak gönderilir) ve kelimenin tüm register'larını tek istekte yazar (FC16). Yalnızca bazı alanları veya register'ları kapsayan bir yazma göndermemelidir (**MUST NOT**).
- `access` register'ınkidir. Okunabilir bir register'daki salt okunur bit alanları `bit` ve `bits` anahtarlarını register'ın kendisinde kullanmaya devam eder (§4.3); `parts` bütün olarak yazılması gereken kelimeler içindir.
- Bu `parts`'ı kullanan register'lar eski bir doğrulayıcıda hata verir (`bad-parts`: bu eklemeden önce `parts` yalnızca string içindi), ancak `parts`'ı yok sayan okuyucular register'ı eskisi gibi okur. Bu yüzden yeni bir `mbmap` sürümü gerekmez (§8).

### 4.11 Başka işlev kodlarıyla okuma

Bazı cihazlar anlık durumlarının bir kısmını yalnızca dört alandan (bölüm 5) hiçbirini okumayan bir işlevle verir; örneğin Read Exception Status (FC07) ile okunan bir durum baytı. `function_reads` bu tür okumaları listeler. Üst düzey bir anahtardır ve boş olmayan bir dizidir:

```json
"function_reads": [
  {
    "name": "Controller status",
    "function": 7,
    "fields": [
      {"name": "Alarm", "bit": 0},
      {"name": "Fan speed", "bit": 1, "bits": 2, "enum": {"0": "Stopped", "1": "Low", "2": "High"}}
    ]
  }
]
```

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `name` | boş olmayan dize, zorunlu | | İnsanlara gösterilen ad |
| `function` | tam sayı, zorunlu | | İşlev kodu, aşağıdaki tablodakilerden biri |
| `description` | dize | | Serbest metin |
| `fields` | alan nesnelerinden oluşan boş olmayan dizi, zorunlu | | Yanıttan alınacak değerler |

| `function` | Ad | İstek verisi | Yanıt |
|---|---|---|---|
| `7` | Read Exception Status | yok | bir durum baytı |

Her alan, durum baytının bir değeridir:

| Key | JSON type | Default | Anlamı |
|---|---|---|---|
| `name` | boş olmayan dize, zorunlu | | İnsanlara gösterilen ad |
| `bit` | tam sayı `0`–`7` | | Değerin en düşük biti, 0 = en az anlamlı. `bit` yoksa değer 0 ile 255 arasında baytın tamamıdır |
| `bits` | tam sayı `1`–`8` | `1` | Değerin genişliği. `bit` gerektirir ve `bit` + `bits` 8 değerini **MUST NOT** aşmasın |
| `enum` | tablo adı veya satır içi tablo | | Değeri bir etikete çevirir (4.1) |
| `description` | dize | | Serbest metin |

- **İşlev listesi kapalıdır.** Harita başkasının yazdığı bir veridir ve araç onu her istek için sormadan okur; oysa aracın tanımadığı bir işlev kodu cihazı değiştirebilir veya yeniden başlatabilir. Bu nedenle harita, ister genel ister kullanıcı tanımlı olsun, başka bir işlev belirtemez ve istek verisi veremez. Bir işlev bu belirtime yalnızca okumaktan başka bir şey yapmıyorsa ve isteği ile yanıtı burada tanımlanarak eklenir.
- Bir araç, kullandığı belirtim sürümünün tablosunda yer almayan bir işlevi, kullanıcı onaylayacak olsa bile **MUST NOT** göndermesin. O girdiyi atlar ve haritanın geri kalanını okur.
- İstek yalnızca işlev kodundan oluşur. Bir harita her işlev için en fazla bir girdi içerir.
- Bu değerler salt okunurdur: bir alana yazılamaz.
- Cihaz bir register adresine değil bir unit id değerine yanıt verir, bu yüzden `address_base` uygulanmaz.
- **Değer yok:** bir istisna yanıtı, yanıt gelmemesi, tek bir durum baytı olmayan bir yanıt ya da işlevi desteklemeyen bir cihaz veya ağ geçidi değer vermez. Bu, haritada bir hata değildir ve registerlar her zamanki gibi okunur. Modbus FC07 işlevini seri hatlar için tanımlar, bu yüzden bir Modbus TCP ağ geçidi onu reddedebilir.
- FC07 baytındaki her bitin anlamı cihaza bağlıdır.
- `function_reads` değer ekler ve başka hiçbir şeyi değiştirmez; onu yok sayan bir okuyucu eskisi gibi davranır, bu yüzden yeni bir `mbmap` sürümü gerekmez (8).

## 5. Alanlar ve adresler

| `area` | Birim | Okuma | Yazma | İzin verilen `access` |
|---|---|---|---|---|
| `coil` | bit | FC01 | FC05 / FC15 | `R`, `W`, `RW` |
| `discrete` | bit | FC02 | — | `R` |
| `input` | 16 bit register | FC04 | — | `R` |
| `holding` | 16 bit register | FC03 | FC06 / FC16 | `R`, `W`, `RW` |

`address_base` `0` iken `address`, hatta gönderilen adrestir (0–65535). `address_base` `1` iken hattaki adres `address − 1`'dir (1–65536); bu, register'ları 1'den numaralandıran kılavuzlarla uyuşur.

5 ve 6 haneli “Modicon” gösterimi (`40001`, `300010`) `address` içinde geçerli **değildir**. Bir alan artı bir sayı olarak yazın: `40001`, `"address_base": 1` ile `"area": "holding"`, `"address": 1` olur.

## 6. Türler, bayt sırası ve kelime sırası

| `type` | Register | Notlar |
|---|---|---|
| `bool` | — | `coil`/`discrete` içinde: bir bit. `input`/`holding` içinde: bir register'ın bir biti, bu yüzden `bit` zorunludur |
| `int16`, `uint16` | 1 | |
| `int32`, `uint32`, `float32` | 2 | Float'lar IEEE 754'tür |
| `int64`, `uint64`, `float64` | 4 | |
| `string` | `length` | Register başına 2 ASCII karakter. Okurken sondaki NUL ve boşluk karakterleri kırpılır |

İki bağımsız ayar, bir değerin baytlarının nasıl geldiğini belirler:

- **`byte_order`**, her 16 bitlik register'ın içinde: `"big"` yüksek baytı önce gönderir (Modbus standardı), `"little"` düşük baytı önce.
- **`word_order`**, 32 bitlik veya 64 bitlik bir değerin register'ları arasında: `"big"` en anlamlı register'ı ilk koyar (en düşük adreste), `"little"` en az anlamlı register'ı ilk.

Üst düzey anahtarlar dosya varsayılanını belirler; bir register'ın `byte_order` ve `word_order` değerleri her biri kendi başına bunu geçersiz kılar (yalnızca `"word_order": "little"` belirleyen bir register dosyanın bayt sırasını korur).

| Tür | `byte_order` | `word_order` |
|---|---|---|
| `bool` | kullanılmaz | kullanılmaz |
| `int16`, `uint16` | register'ın iki baytını değiştirir | kullanılmaz (tek register) |
| `int32`, `uint32`, `float32` | her register'ın iki baytını değiştirir | 2 register'dan hangisinin yüksek kelime olduğuna karar verir |
| `int64`, `uint64`, `float64` | her register'ın iki baytını değiştirir | `"little"` 4 register'ı bütün olarak tersine çevirir |
| `string` | `"big"`: alınan ilk bayt ilk karakterdir; `"little"`: alınan ikinci bayt ilk karakterdir | kullanılmaz (register'lar adres sırasıyla okunur) |

64 bitlik değerlerde little kelime sırası dört register'ın tüm dizisini tersine çevirir; iki 32 bitlik yarıyı ayrı ayrı değiştirmez.

32 bitlik `0x0A0B0C0D` değerinin hattaki sırası:

| `byte_order` | `word_order` | Hattaki baytlar | Yaygın ad |
|---|---|---|---|
| `big` | `big` | `0A 0B 0C 0D` | Modbus standardı |
| `big` | `little` | `0C 0D 0A 0B` | “kelime değişimi”, birçok sayaç ve PLC kullanır |
| `little` | `big` | `0B 0A 0D 0C` | “bayt değişimi” (nadir) |
| `little` | `little` | `0D 0C 0B 0A` | little-endian |

## 7. Doğrulama

Okuyucular her sorunu aşağıdaki kodlardan biriyle ve değere bir [JSON Pointer](https://www.rfc-editor.org/rfc/rfc6901) ile (`/registers/3/address`, `/enums/relay`) bildirmelidir **(SHOULD)**; böylece araçlar neyin yanlış olduğu konusunda anlaşır. Tüm dosyaya ait sorunların işaretçisi yoktur. Bir **error** dosyayı geçersiz kılar. Bir **warning** bildirilir ama dosya yine de kullanılabilirdir.

| Code | Severity | Ne zaman |
|---|---|---|
| `not-utf8` | error | Dosya geçerli UTF-8 değil |
| `not-json` | error | Dosya tek bir geçerli JSON nesnesi değil veya bir nesnede bir anahtarı yineliyor. Tüm dosya için bildirilir: ayrıştırıcılar sözdizimi hatalarını farklı konumlara koyar; bu yüzden konum iletide yer alır |
| `bad-json-type` | error | Bilinen bir anahtar yanlış JSON türünde bir değer tutuyor (sayı beklenen yerde metin, `null`, …) |
| `missing-key` | error | `mbmap`, `vendor`, `model` veya `registers` eksik (tüm dosya için), ya da bir register'da `name`, `area`, `address` veya `type` yok ya da boş (register'da) |
| `bad-meta-value` | error | Bir üst düzey anahtar, izin verilen kümesi veya aralığı dışında bir değer taşıyor; `2`'den başka bir `mbmap` dahil |
| `bad-area` | error | Bilinmeyen `area` veya küçük harfle yazılmamış |
| `bad-type` | error | Bilinmeyen `type` veya küçük harfle yazılmamış |
| `type-area` | error | `coil` veya `discrete` içinde `bool` dışında bir tür |
| `bad-address` | error | `address` bir tam sayı değil |
| `address-range` | error | Adres `address_base`'in altında veya değer 65535 adresini aşıyor |
| `missing-bit` | error | `input`/`holding` içindeki `bool`'da `bit` yok |
| `bad-bit` | error | `bit`, `0`–`15` dışında |
| `missing-length` | error | `string`'te `length` yok |
| `bad-length` | error | `length` ≥ 1 bir tam sayı değil |
| `bad-access` | error | Bilinmeyen `access` (veya büyük harfle değil) ya da `area` için izin verilmeyen |
| `bad-byte-order` | error | Bir register'ın `byte_order` veya `word_order` değeri `"big"` ya da `"little"` değil |
| `bad-enum` | error | Bir enum tablosunda (§2.2) tam sayı olmayan bir anahtar, boş bir etiket, yinelenen bir değer veya hiç giriş yok, ya da bir `enums` adı `a`–`z`, `0`–`9`, `_` değil |
| `bad-sentinel` | error | `sentinels` desteklenmeyen bir tür adlandırıyor, ya da bir tablo geçerli değil (§2.2) veya türe sığmayan bir değer içeriyor |
| `bad-bits` | error | `bits` 1 ile 16 arasında bir tam sayı değil, `uint16` dışında bir türde veya `input`/`holding` dışında kullanılıyor, `bit` yok ya da `bit` + `bits` 16'yı aşıyor |
| `unknown-enum` | error | `enum`, `enums`'ın tanımlamadığı bir tabloyu adlandırıyor |
| `bad-write-limit` | error | `write_min`, `write_max`'tan büyük |
| `bad-reference` | error | `reference`, register'ın `type`'ı için geçerli bir ham değer değil (tam sayı değil, türün aralığı dışında, bit alanından geniş, `bool` için boolean değil, float'lar için sonlu bir sayı değil, metinden uzun), ya da okunamayan bir register'da ayarlı |
| `unknown-scale-factor` | error | `scale_factor` dosyanın hiçbir register'ını adlandırmıyor (hatalı register'lar sayılmaz) |
| `bad-scale-factor` | error | `scale_factor` bir `bool` veya `string` üzerinde ayarlı, ya da tam sayı olmayan (float, `bool`, `string` veya bit alanı) veya kendisinin bir `scale_factor`'ı olan bir register'ı adlandırıyor |
| `bad-version` | error | Dosyada veya bir register'da `firmware_min` ya da `firmware_max` bir sürüm metni değil (§3.2) |
| `bad-firmware-range` | error | Dosyada veya bir register'da `firmware_min`, `firmware_max`'tan sonra |
| `bad-source` | error | `sources` öğesi boş olmayan bir `title`'ı olan bir nesne değil ya da yanlış biçimde bir `version`, `date`, `url`, `note`, `accessed` veya `sha256`'sı var |
| `bad-role` | error | `role` `"model"`, `"firmware"` veya `"serial"` değil, okunamayan bir register'da ayarlı, ya da `"model"` veya `"serial"` birden fazla kez kullanılıyor |
| `bad-identify` | error | `identify` geçerli değil (§4.8): `function` `17` veya `43` değil, `fields` boş, ya da bir alanın `name`'i yok, `"model"` veya `"serial"` için bilinmeyen ya da yinelenen bir `role`'ü var, veya fonksiyonunun kurallarını çiğniyor (FC17: `offset` eksik veya negatif, `type` eksik veya bilinmeyen, `length`'siz `string`, hiçbir tabloyu adlandırmayan ya da geçerli bir tablo olmayan bir `enum`, bir `object`; FC43: `object` eksik veya 0–255 dışında, bir `offset`, `type`, `length` ya da `enum`) |
| `bad-parts` | error | `parts` boş, geçerli bir `length`'i olan bir `string` olmayan register'da ayarlı, ya da bir parçanın `name` veya `offset`'i yok, negatif bir `offset`'i, bilinmeyen veya `bool` bir `type`'ı var, `length`'siz bir `string` parçası, bloğu aşan bir parça veya çakışan parçalar var; `uint16`, `uint32` veya `uint64` register'ında ilk koşul geçerli değildir ve parçalar bit alanlarıdır: orada `bit`siz bir parça, negatif `bit`, 1'in altında `bits`, `offset`, `length` veya `type`, register genişliğini aşan bir alan ya da çakışan alanlar hatadır; tablosu olmayan `enum` `unknown-enum` verir (§4.10) |
| `bad-function-read` | error | `function_reads` geçerli değil (§4.11): boş, ya da bir girdi nesne değil, `name` içermiyor, §4.11 tablosunda olmayan veya iki kez kullanılan bir `function` içeriyor, `request` içeriyor veya `fields` içermiyor; ya da bir alan nesne değil, `name` içermiyor, `0`–`7` dışında bir `bit`, `bit` olmadan veya baytın 8 bitini aşan `bits`, ya da tablo adı vermeyen veya geçerli bir tablo olmayan bir `enum` içeriyor; ya da bir `description` dize değil |
| `no-rows` | warning | `registers` boş |
| `duplicate-name` | warning | Bir `name`, donanım yazılımı aralıkları çakışan register'lar tarafından birden fazla kez kullanılıyor (§3.2) |
| `model-list` | warning | `model` cihazları “ / ” ile ayırarak listeliyor; aile adını verin ve cihazları `models` içinde listeleyin (§3.2) |
| `overlap` | warning | Bir değer, aynı alanda başka bir değerin register'ları içinde başlıyor; bu genellikle yanlış bir adres veya türe işaret eder. Aynı adreste başlayan register'lar aynı verinin alternatif okumalarıdır (örneğin bir kodun sayı ve metin olarak okunması) ve asla çakışma sayılmaz; bir register'ın bitleri ve bit alanları (`bool` + `bit`, `uint16` + `bit` + `bits`) ve donanım yazılımı aralıkları çakışmayan register'lar da sayılmaz |
| `firmware-outside-map` | warning | Bir register'ın donanım yazılımı aralığının dosyanınkiyle ortak hiçbir sürümü yok; bu yüzden asla geçerli olmaz |
| `bad-read` | error | `read_group` boş bir metin |
| `unknown-key` | warning | Bir register'da bu şartnamede olmayan ve `x_` ile başlamayan bir anahtar var |
| `unused-write-limit` | warning | `write_min` veya `write_max`, hiçbir etkisi olmayan bir register'da ayarlı (`bool`, `string` veya `access` `"R"`) |
| `unused-bit` | warning | `bit`, hiçbir etkisi olmayan bir register'da ayarlı (`bool` dışındaki her tür; ancak bir `uint16` üzerinde `bits` de ayarlıysa değil) |

`name`, `area`, `address` veya `type` alanında hatası olan bir register daha fazla kontrol edilmez. Herhangi bir hatası olan bir register `overlap` kontrolü dışında bırakılır.

[JSON Schema](schema/mbmap-2.schema.json) yapıyı, JSON türlerini ve değer aralıklarını kontrol eder; birkaç değeri ilişkilendiren kurallar (`unknown-enum`, ölçek çarpanları, `overlap`, `address-range`, türe göre `bad-reference`, yinelenen anahtarlar) kod gerektirir. [`tests/`](tests/) klasörü, her birinin üretmesi gereken tanılarla birlikte örnek dosyalar içerir; böylece her uygulama kendini onlara karşı kontrol edebilir.

## 8. Uyumluluk ve sürümleme

- Okuyucular tanımadıkları anahtarları, üst düzeyde ve register'larda, yok saymalıdır **(MUST)**. Bu, yeni dosyaların eski okuyucularda açılmasını sağlar.
- Üretici veya araca özgü anahtarlar `x_` ile başlamalıdır **(SHOULD)** (`"x_modbench_icon"`, `"x_alarm_high"`); böylece bu şartnamenin gelecek sürümleriyle asla çakışmazlar. Değerleri herhangi bir JSON türünde olabilir **(MAY)**.
- `mbmap` **ana** sürümdür. Bir okuyucu, `mbmap` değerini desteklemediği bir dosyayı reddetmelidir **(MUST)** ve hangi sürümü bulduğunu söylemelidir **(SHOULD)**.
- Eski okuyucuların güvenle yok sayabileceği yeni isteğe bağlı anahtarlar `mbmap` değişmeden eklenir. Eski bir okuyucunun yok sayarsa anlamını yanlış anlayacağı bir anahtar yeni bir ana sürüm gerektirir.
- Şema dosyası ana sürümün adını taşır (`mbmap-2.schema.json`) ve onun içinde yalnızca isteğe bağlı anahtarlar kazanır.

## 9. Bir haritayı bağlı cihazla karşılaştırma

Bağlı cihazın kimlik register'larını (§4.7) veya `identify`'ın (§4.8) tanımladığı kimlik yanıtını okuyan bir araç, kullanıcı başka bir model veya donanım yazılımı için yazılmış bir haritanın değerlerine güvenmesin diye bunları haritayla karşılaştırmalıdır **(SHOULD)**. Cihaz bildirmiyorsa kullanıcının modeli veya donanım yazılımını elle belirtmesine de izin verebilir.

Her kontrolün üç sonuçtan biri vardır:

| Sonuç | Model | Donanım yazılımı |
|---|---|---|
| **match** | Cihazın modeli, büyük/küçük harf ve çevresindeki boşluklar yok sayılarak karşılaştırıldığında, `models`'ın (veya `model`'in) biridir | Cihazın sürümü `firmware_min` … `firmware_max` içindedir |
| **mismatch** | Değildir | Aralığın dışındadır |
| **unknown** | Haritada `"model"` register'ı yok, okunamadı ya da değer vermedi | Haritada `"firmware"` register'ı yok, okunamadı, içinde sürüm metni bulunamadı veya harita bir aralık bildirmiyor |

Bir aracın her sonuçla ne yaptığı:

- **match**: bildirilecek bir şey yok; araç cihazın tanındığını gösterebilir **(MAY)**.
- **mismatch**: araç açıkça uyarmalı **(SHOULD)**, haritanın ne beklediğini ve cihazın ne bildirdiğini söylemeli ve cihaza ilk yazmadan önce onay istemelidir **(SHOULD)**. Bu yüzden okumayı durdurmamalıdır **(MUST NOT)**: okuma zararsızdır ve kullanıcı daha iyi bilebilir (yeniden markalanmış bir cihaz, aynı register'ları koruyan daha yeni bir donanım yazılımı).
- **unknown**: sorun değil. Çoğu cihaz model veya donanım yazılımı bildirmez ve çoğu harita her donanım yazılımı için geçerlidir. Araç bunu mismatch saymamalıdır **(MUST NOT)** ve haritanın kontrol edilemeyen bir donanım yazılımı aralığı bildirdiğini belirtebilir **(MAY)**.

Kendi donanım yazılımı aralığı olan register'lar (§3.2):

- Donanım yazılımı **biliniyorsa**, bir araç yalnızca aralığı onu kapsayan register'ları kullanmalıdır **(SHOULD)**: diğerleri bu cihazda yoktur ve birkaç donanım yazılımı aralığı tarafından paylaşılan bir register adı o zaman tek bir register demektir.
- Donanım yazılımı **bilinmiyorsa**, bir araç her register'ı okumalı **(SHOULD)**, hangilerinin donanım yazılımına bağlı olduğunu göstermeli **(SHOULD)** (örneğin “donanım yazılımı 2.1 ve sonrası”) ve kullanıcının sürümü seçmesine izin verebilir **(MAY)**.

`models`, `firmware_min`, `firmware_max` ve kimlik register'ları olmayan bir harita hiçbir şeyle karşılaştırılmaz; bu, modelinin her cihazı için geçerli bir harita için doğrudur.

## 10. Eski dosyalar

CSV tabanlı biçimin 1. sürümü kullanımdan kalkmıştır. Yeni okuyucuların onu desteklemesi gerekmez; bu biçimdeki dosyalar [`tools/migrate/migrate.py`](tools/migrate/migrate.py) ile dönüştürülebilir (bkz. [legacy/v1](legacy/v1/)).
