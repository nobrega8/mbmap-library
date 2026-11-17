# Modbus zaman aşımları: cihaz yanıt vermiyor

Zaman aşımı, aracınızın kabul edebileceği hiçbir şeyin geri gelmediği anlamına gelir. Listeyi yığının en altından yukarı doğru gözden geçirin.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Kablolama.** A ve B (veya D+ ve D−, ya da + ve −) her üretici tarafından aynı şekilde adlandırılmaz. Hiçbir şey yanıt vermiyorsa iki teli değiştirin: zararı olmaz.
2. **Ortak toprak.** Cihazda varsa sinyal topraklamasını (GND, C, 0 V) bağlayın; bunsuz uzun kablolar gelip giden hatalara yol açar.
3. **Sonlandırma.** Veri yolunun iki ucuna 120 Ω'luk birer direnç takın, her cihaza değil. Masa üstündeki kısa kablolar genellikle bunsuz da çalışır.
4. **Seri ayarlar.** Baud hızı, veri bitleri, parite ve stop bitleri tam olarak uyuşmalıdır. Yaygın bir fabrika ayarı 9600 veya 19200 baud, 8 veri biti, çift veya hiç parite şeklindedir. Parite uyuşmazlığı sessizce geçer.
5. **Unit ID.** Veri yolundaki her cihazın 1 ile 247 arasında kendi adresi olmalıdır. 1'e ayarlı bir cihaz 2'ye gelen isteklere yanıt vermez. Bkz. [unit ID](modbus-unit-id-slave-id).
6. **Tek master.** Aynı veri yolundaki iki master (bir PLC ve bir dizüstü) çakışır.
7. **Dönüştürücü yönü.** Ucuz USB–RS-485 dönüştürücüler yüksek baud hızlarında yönü bazen çok yavaş değiştirir. Daha düşük bir hız deneyin.

## Modbus TCP

1. **Önce cihaza ulaşın.** `ping` atın ve 502 numaralı portun açık olduğunu kontrol edin.
2. **Bağlantı sınırı.** Birçok cihaz yalnızca birkaç TCP bağlantısı kabul eder. Bağlantıları açık bırakan bir araç, cihaz bunları zaman aşımına uğratana kadar başkalarını dışarıda bırakabilir.
3. **Ağ geçitleri üzerinden unit ID.** Bir TCP–RTU ağ geçidinin arkasında unit ID seri cihazı seçer ve onun adresiyle uyuşmalıdır; bazı ağ geçitleri kendileri için 0 veya 255 ister.
4. **Modbus TCP etkin mi?** Bazı cihazlar kapalı olarak gelir ya da yalnızca başka bir portta yanıt verir.

## Cihaz bazı isteklere yanıt veriyor, bazılarına vermiyor

- Çok büyük istekler veya register tablosundaki boşlukları kapsayanlar istisnayla yanıtlanabilir ya da yok sayılabilir. Daha küçük bloklar okuyun.
- Bazı cihazların istekler arasında bir ara vermesi gerekir (RTU'da 3,5 karakter süresi, yavaş cihazlarda daha fazla). Sorgu aralığını artırın.
- Bazıları on veya yüz milisaniyelik bir gecikmeden sonra yanıt verir; her şeyden önce yanıt zaman aşımını artırın.
