# Bir cihazın Modbus register haritası nasıl bulunur

Register haritası (Modbus tablosu, nokta listesi, bellek haritası veya iletişim protokolü de denir) kurulum föyünde nadiren bulunur. Nerelere bakılır:

1. **Bu kitaplıkta arayın**: modele, model koduna veya takma ada göre. Her harita, yazıldığı belgeye bağlantı verir.
2. **Üreticinin indirme alanı.** Model adıyla birlikte “communication protocol”, “Modbus protocol”, “Modbus register map”, “Modbus table” veya “point map” arayın. Genellikle kullanım kılavuzundan ayrı bir PDF'tir.
3. **Kullanım kılavuzunun tamamı.** Birçok kılavuzda tablo sona yakın bir bölümdedir (“Communication”, “Modbus”, “Appendix B”).
4. **Yapılandırma yazılımı.** Bazı üreticiler haritayı yazılımlarının içinde ya da yanında bir Excel dosyası olarak gönderir.
5. **Aile belgesi.** Bir model, haritasını çoğu zaman ailesiyle paylaşır (“EM24 DIN”, “PM5000 series”). Aile kılavuzunun sizin varyantınızı kapsadığını kontrol edin.
6. **Üreticinin destek birimine sorun.** Bazı haritalar yalnızca istek üzerine, bazen NDA altında gönderilir; ondan yapılmış bir haritayı yayımlamadan önce paylaşıp paylaşamayacağınızı kontrol edin.
7. **Diğer projelerin entegrasyonları.** Home Assistant, openHAB, Node-RED ve EVCC yapılandırmaları çoğu zaman çalışan register listeleri içerir, ama kılavuzla karşılaştırın.

<mb-flow name="find"></mb-flow>

## İçinde neleri okumalı

- **Adresleme kuralı** (hat adresi, 1'den başlayan veya Modicon). Bkz. [adresler](modbus-address-off-by-one).
- Her değerin **veri türleri**, **kelime sırası** ve **ölçeği**. Bkz. [bayt ve kelime sırası](byte-and-word-order) ve [ölçekleme](scaling-and-units).
- **Desteklenen fonksiyon kodları** ve istek başına en fazla register sayısı.
- **Varsayılan seri ayarlar** ve unit ID.

## Bu kitaplıkta yok mu?

Belgeye bağlantı vererek [bir harita isteyin](https://github.com/nobrega8/mbmap-library/issues/new/choose) ya da kendiniz yazın: biçim sade JSON'dur ve [şartname](/spec) her anahtarı açıklar.
