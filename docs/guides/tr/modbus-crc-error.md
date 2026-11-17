# RS-485'te Modbus CRC hataları

CRC hatası, bir çerçevenin geldiği ama sağlama toplamının uyuşmadığı anlamına gelir: baytlar yolda değişmiş veya kaybolmuştur. Yanlış bir adresten farklı olarak fiziksel bağlantıya veya zamanlamaya işaret eder.

## Yaygın nedenler

- **Gürültü.** Güç kablolarının veya sürücülerin yanından geçen ekransız kablo. Ekranı yalnızca bir ucundan topraklanmış, ekranlı, bükümlü çift kullanın.
- **Eksik veya fazla sonlandırma.** Veri yolunun her ucunda bir adet 120 Ω direnç; arada hiç.
- **Önyükleme (bias) yok.** Bias dirençleri olmayan boşta bir veri yolu yüzer ve bir çerçevenin ilk baytları yanlış okunabilir. Birçok dönüştürücü ve master'da bir bias seçeneği vardır.
- **Dallar ve yıldız kablolama.** RS-485 cihazdan cihaza tek bir hat ister, dallanma değil.
- **Baud hızı hafifçe kaymış**, ucuz dönüştürücülerde veya yüksek hızlarda. Daha düşük bir baud hızı deneyin.
- **Çerçevelerin birleşmesi.** Master, veri yolu 3,5 karakter süresince sessiz kalmadan sonraki isteği gönderirse, cihazlar tek uzun, bozuk bir çerçeve görür. İstekler arasındaki gecikmeyi artırın.
- **İki master**, ya da başka bir cihazla aynı adreste yanıt veren bir cihaz.

<mb-crc></mb-crc>

## Adımlar

1. Baud hızını düşürün ve hataların durup durmadığına bakın.
2. Tek bir cihaz ve kısa bir kabloyla deneyin. Çalışıyorsa sorun cihaz değil, veri yoludur.
3. Sonlandırmayı güç kapalıyken kontrol edin: iki sonlandırıcı takılıyken A ile B arasındaki direnç yaklaşık 60 Ω olmalıdır.
4. Master veya dönüştürücü sunuyorsa bias ekleyin.
5. Sorgu aralığını ve zaman aşımını artırın.

Uzun bir endüstriyel veri yolunda ara sıra görülen bir CRC hatası normaldir; bir araç yeniden denemelidir. Çerçevelerin çoğunda görülen hatalar normal değildir.
