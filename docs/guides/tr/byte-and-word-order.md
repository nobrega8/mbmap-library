# Bayt sırası ve kelime sırası: 32 bitlik değerler yanlış çıktığında

Bir gerilim 1,7 × 10³⁸ olarak okunuyor, bir enerji sayacı 65 536'şar atlıyor ya da bir sıcaklık küçük bir negatif sayı oluyor. Register'lar doğru; yanlış olan, 32 bitlik bir değerin iki register'ının birleştirilme sırası.

## Bir register kolaydır, iki register değil

Bir Modbus register'ı 16 bittir ve en anlamlı bayt önce olacak şekilde gönderilir. Standart, bir register'dan uzun değerler hakkında bir şey söylemez; bu yüzden her üretici 32 bitlik bir tam sayıyı veya float'ı iki register'a (64 bitlik bir değeri de dört register'a) nasıl böleceğini kendisi seçer.

Dört sıra genellikle değerin baytlarına göre adlandırılır; `A` en anlamlı olandır:

| Ad | Register 1 | Register 2 | Diğer adları |
|---|---|---|---|
| `ABCD` | A B | C D | big-endian, yüksek kelime önce |
| `CDAB` | C D | A B | kelime değişimi, düşük kelime önce, LSW first |
| `BADC` | B A | D C | bayt değişimi |
| `DCBA` | D C | B A | little-endian, ikisi de değişmiş |

`ABCD` ve `CDAB` hemen her cihazı kapsar. `CDAB` Schneider, Carlo Gavazzi ve birçok Çin yapımı sayaçta yaygındır; `ABCD` Siemens, Janitza ve çoğu SunSpec cihazında.

<mb-byte-order></mb-byte-order>

## Doğrusunu nasıl bulursunuz

1. **Kılavuzun veri biçimi bölümünü okuyun.** “word order”, “LSW first”, “MSW first”, “high word first” veya “big endian” arayın.
2. **Bildiğiniz bir değeri okuyun.** 230 V civarında olması gereken bir gerilimi her sırayla float olarak okuyun. Yalnızca biri makul bir sayı verir.
3. **Bir sayacı izleyin.** Bir enerji sayacının düşük register'ı, aracınızın yüksek kısım olarak gösterdiği yere taşıyorsa, kelimeleri değiştirin.
4. **64 bitlik değerleri ayrıca kontrol edin.** Bazı cihazlar 32 bitlik değerleri yüksek kelime önce, 64 bitlik değerleri ise başka bir sırayla saklar.

## Metinler

Metin genellikle register başına iki karakterdir ve ilk karakter yüksek baytta bulunur. Birkaç cihaz ilk karakteri düşük bayta koyar; bu da “EM24”ün “ME42” olarak okunmasına yol açar.

## MBMap haritaları bunu nasıl kaydeder

Bir harita tüm cihaz için `byte_order` ve `word_order` belirler, ve herhangi bir register bunları geçersiz kılabilir. Cihaz sayfaları, çok register'lı her değerin sırasını yukarıdaki gösterimle (örneğin `float32 CDAB`) gösterir; Home Assistant dışa aktarımı bunu doğru `swap:` seçeneğine çevirir.
