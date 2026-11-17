# Bir Modbus cihazına yazmak güvenli mi?

Bir register'ı okumak zararsızdır. Yazmak ise cihazı değiştirir, bazen geri almak zor şekillerde.

## Neler ters gidebilir

- **Yanlış register.** [Bir kayık bir adres](modbus-address-off-by-one) değerinizi komşu ayara yazar: bir akım trafosu oranı, bir koruma sınırı, bir baud hızı.
- **İletişim ayarları.** Unit ID, baud hızı veya parite yazmak, yeni değerlerle yeniden bağlanana kadar sizi dışarıda bırakır.
- **Belleğin aşınması.** Birçok cihaz ayarları sınırlı sayıda yazma ömrü olan flash veya EEPROM'a kaydeder. Her saniye bir ayar noktası yazmak onu aylar içinde eskitebilir. Bazı cihazlar sık yazmalar için yalnızca RAM'deki bir adres sunar.
- **Komutlar hemen etki eder.** Çalıştır/durdur, şalter aç/kapat, enerji sayaçlarını sıfırlama ve fabrika ayarlarına dönme, onay olmadan yazma anında gerçekleşir.
- **Yarım yazılmış değerler.** 32 bitlik bir değerin iki register'ını ayrı isteklerle yazmak, bir an için karışık bir değer bırakabilir ya da reddedilebilir.

<mb-flow name="write"></mb-flow>

## Yazmadan önce

1. Haritayı üreticinin belgesiyle karşılaştırın ve *doğrulanmış* veya *resmi* işaretli haritaları tercih edin.
2. Önce register'ı okuyun ve beklediğiniz değeri içerdiğini doğrulayın.
3. İzin verilen aralığı kontrol edin; birçok cihaz aralık dışı değerleri kırpar veya reddeder.
4. Çok register'lı değerleri tek istekte yazın (fonksiyon 16).
5. Eski değeri nasıl geri yükleyeceğinizi bilin.
6. Güç veya makine kontrol eden ekipmanda, izole edilmiş halde test edin.

## MBMap haritaları nasıl yardım eder

Register'ların bir `access` değeri (`R`, `W`, `RW`) vardır ve yazılabilir olanlar `write_min` ile `write_max` taşıyabilir. Her haritanın, bir cihazda denenip denenmediğini, üreticinin belgesinden alınıp alınmadığını veya henüz kontrol edilmediğini söyleyen bir durumu vardır. Araçlar, modeli haritayla uyuşmayan bir cihaza yazmadan önce uyarmalıdır.
