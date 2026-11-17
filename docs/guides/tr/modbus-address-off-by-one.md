# Modbus adresleri: okumanız neden bir register kayık

40001 numaralı register'ı okuyorsunuz ve kılavuzun 40002 için verdiği değeri alıyorsunuz, ya da cihaz tabloda olan bir register için *illegal data address* ile yanıt veriyor. Neredeyse her zaman nedeni aynıdır: kılavuz ve aracınız register'ları farklı sayıyor.

## Aynı register'ı yazmanın üç yolu

| Kılavuzda yazan | Anlamı | Hatta giden |
|---|---|---|
| `40001` (Modicon referansı) | 1'den sayılan 1 numaralı tutma register'ı, alan öneki olarak `4` ile | adres `0` |
| `1` (register numarası) | 1'den sayılan 1 numaralı tutma register'ı | adres `0` |
| `0` veya `0x0000` (ofset) | adresin kendisi | adres `0` |

Bir Modbus çerçevesi her zaman 0 ile 65535 arasında bir adres taşır. `4` (tutma), `3` (giriş), `1` (ayrık giriş) ve `0` (coil) önekleri gönderilmez: alan fonksiyon koduyla seçilir (tutma için 03, giriş için 04, ayrık girişler için 02, coil'ler için 01). Geriye kalan numara çoğu zaman 1'den sayılır, dolayısıyla hattaki adres bu numaranın **bir eksiğidir**.

`400001` veya `300013` gibi altı haneli referanslar da aynı şekilde çalışır: ilk haneyi atın ve bir çıkarın (`300013` → giriş register'ı `12`).

<mb-address></mb-address>

## Kılavuzunuzun hangisini kullandığını nasıl anlarsınız

- **Hex adresleri** (`0x0BB7`, `1004h`) hemen her zaman hattaki adrestir.
- **İlk register'ın 40001 veya 30001 olması** Modicon referansları demektir: 40001 veya 30001'i çıkarın.
- **İlk register'ın 1 olması** genellikle 1'den başlayan numaralandırma demektir; ilk register'ın 0 olması hat adresleri demektir.
- **Çözülmüş bir örnek arayın.** Birçok kılavuz bir istek çerçevesi gösterir (“40011 register'ını oku: 01 03 00 0A 00 01 …”). Fonksiyon kodundan sonraki iki bayt hat adresidir ve soruyu çözer.
- **Bazı kılavuzlar ikisini karıştırır**, örneğin yanındaki hex “adres” sütunundan bir fazla olan ondalık bir “register” sütunu. Hex sütununa ve örnek çerçevelere güvenin.

## Aracınız ne bekler

Araçlar da farklılık gösterir. Bazıları hat adresini, bazıları 1'den başlayan bir register numarasını ister, bazıları da bir Modicon referansını kabul edip öneki siler. Bir değer tam bir register kayıksa (32 bitlik bir değer anlamsız görünüyorsa ya da her değer komşusuna aitmiş gibiyse), adresi bir eksik veya bir fazla deneyin.

## MBMap haritaları bunu nasıl kaydeder

Her `.mbmap.json` dosyası, adreslerinin hangi kuralı kullandığını `address_base` ile belirtir: `0` adreslerin hat adresi olduğu, `1` ise adreslerin 1'den başladığı ve hat adresinin bir eksik olduğu anlamına gelir. Bu sitedeki cihaz sayfaları, CSV dışa aktarımı ve Home Assistant dışa aktarımı, haritada yazıldığı şekliyle adresin yanında hat adresini de gösterir; böylece tahmin yürütmenize gerek kalmaz.
