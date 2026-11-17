# Bir Modbus register'ı 0, 0xFFFF veya 0x8000 okuyor

İstek başarılı oluyor ama değerin bir anlamı yok. Cihazdan şüphelenmeden önce, size ne söylemeye çalıştığına bakın.

## Yaygın nedenler

- **Yanlış alan.** Aynı adres hem giriş hem de tutma register'ı olarak farklı içerikle var olabilir. Değer bir giriş register'ındayken tutma register'ını okumak sıfır döndürebilir. Bkz. [fonksiyon kodları](modbus-function-codes).
- **Bir kayık.** 32 bitlik bir değerin ilk yarısı yerine ikinci yarısını okumak, küçük değerlerde çoğu zaman 0 verir. Bkz. [adresler](modbus-address-off-by-one).
- **Uygulanmamış.** Birçok cihaz, kullanılmayan register'ların okunmasına istisna yerine 0, 0xFFFF, 0x7FFF veya 0x8000 ile yanıt verir. SunSpec cihazları işaretli alanlarda “uygulanmamış” için 0x8000 (−32768), işaretsizlerde 0xFFFF kullanır.
- **Ölçülmüyor.** Üç telli bir bağlantıdaki nötr akımı, bağlanmamış bir faz veya hiçbir şeyin bağlı olmadığı bir sensör girişi 0 ya da sabit bir işaret okur.
- **Hazır değil.** Bazı cihazlar açıldıktan sonra birkaç saniye boyunca veya ilk ölçüm döngüsü bitene kadar sıfır döndürür.
- **Model farkları.** Bir aile kılavuzunda listelenen bir register yalnızca bazı modellerde bulunabilir: diğerleri 0 döndürür.
- **Ölçek fazla kaba.** 1 A ölçekli küçük bir akım 0 okunur.

<mb-scaling></mb-scaling>

## MBMap haritaları bunu nasıl kaydeder

Bir harita, her tür için “mevcut değil” anlamına gelen değerleri, yani `sentinels`'i listeleyebilir; böylece bir araç bunları ölçüm olarak değil, eksik olarak gösterir. Register açıklamaları, bir değerin hangi modelleri veya bağlantıyı gerektirdiğini belirtir.
