# Ölçekleme ve birimler: değer on veya bin kat yanlış çıktığında

Register doğru sırayla okunuyor ve yine de gerilim 230,1 yerine 2301, akım 4,56 A yerine 4560 çıkıyor. Çoğu sayaç tam sayı gönderir ve sizden sabit bir ölçek uygulamanızı bekler.

## Sabit ölçek

Kılavuzlar ölçeği aynı anlama gelen birkaç şekilde yazar:

| Kılavuz diyor ki | Anlamı | Okunan değer 2301 |
|---|---|---|
| “resolution 0.1 V”, “× 0.1”, “unit 0.1 V” | 0,1 ile çarp | 230,1 V |
| “Value weight: Volt × 10”, “÷ 10” | 10'a böl | 230,1 V |
| “1 decimal”, “format XXX.X” | 10'a böl | 230,1 V |
| Birim olarak “mA”, “mV”, “Wh” | tam sayı zaten o birimde | 2301 mV |

Çarpanın yanı sıra birime de dikkat edin: Wh cinsinden bir enerji sayacı ile kWh × 0,01 olan bir sayaç on kat fark eder.

## Yapılandırmayla belirlenen ölçek

Bazı cihazlar ölçeği bir ayarla değiştirir: ekranda gösterilen ondalık sayısı, akım trafosu oranı veya gerilim aralığı. Kılavuz bu durumda bir tablo verir (“40018 register'ı 2 ise 100'e bölün”). Önce bu ayarı okuyun.

<mb-scaling></mb-scaling>

## Ölçek çarpanı register'ları (SunSpec ve diğerleri)

SunSpec eviriciler ve sayaçlar her değeri, işaretli bir 10 kuvveti olan ayrı bir *ölçek çarpanı* register'ıyla birlikte gönderir. Değer `register × 10^ölçek_çarpanı` olur: ölçek çarpanı −1 olan 4523 güç değeri 452,3 W eder. Ölçek çarpanı cihaz çalışırken değişebilir; bu yüzden onu değerle birlikte, aynı istekte okuyun.

## Float'lar

32 bitlik float (IEEE 754) olarak gönderilen değerler ölçek gerektirmez; zaten mühendislik birimindedir. Bir float saçma görünüyorsa, ölçekten önce [kelime sırasını](byte-and-word-order) kontrol edin.

## MBMap haritaları bunu nasıl kaydeder

Bir register'ın `scale` (çarpan), isteğe bağlı bir `offset`, bir `unit` veya 10 kuvvetini tutan register'ı adlandıran bir `scale_factor` değeri olabilir. Cihaz sayfaları ve dışa aktarımlar bunları uygular; böylece yapılandırdığınız sayı kılavuzdaki sayıdır.
