# Modbus istisna kodları: cihaz size ne söylüyor

Bir Modbus cihazı bir isteği anladığı ama yerine getiremediği zaman bir istisnayla yanıt verir: en yüksek biti ayarlanmış fonksiyon kodu (tutma register'larının başarısız bir okuması için `0x83`) ve bir baytlık bir kod.

| Kod | Ad | Olağan neden | Denenecekler |
|---|---|---|---|
| 01 | Illegal function | Cihaz bu fonksiyon kodunu desteklemiyor: yalnızca tutma register'ı olan bir cihazdan giriş register'larını (04) okumak ya da yalnızca 06 kabul eden bir cihaza 16 ile yazmak | O tablo için kılavuzun listelediği fonksiyon kodunu kullanın |
| 02 | Illegal data address | Adres yok ya da istediğiniz blok bir boşluğa giriyor | [Adres kaymasını](modbus-address-off-by-one) kontrol edin; bir seferde daha az register okuyun |
| 03 | Illegal data value | Adet çok büyük (125'ten fazla register) ya da yazılan değer aralığın dışında | Daha küçük bloklar okuyun; yazmadan önce izin verilen aralığı kontrol edin |
| 04 | Server device failure | Cihaz bunu yaparken arızalandı; bazı cihazlar bunu reddedilen her yazma için ya da izin vermediği bir bloğun okunması için kullanır | Her seferinde bir register okuyun; cihazın durumunu kontrol edin |
| 05 | Acknowledge | Kabul edildi, ama biraz sürecek (programlama, kaydetme) | Bekleyin, sonra sorgulayın |
| 06 | Server device busy | Cihaz meşgul | Daha sonra yeniden deneyin |
| 0A | Gateway path unavailable | Bir ağ geçidi arkasındaki cihaza ulaşamadı | Ağ geçidinin seri tarafını ve yönlendirmesini kontrol edin |
| 0B | Gateway target failed to respond | Ağ geçidi isteği iletti ama cihaz yanıt vermedi | Ağ geçidinin arkasındaki unit ID'yi, baud hızını ve kablolamayı kontrol edin |

<mb-exceptions></mb-exceptions>

## Hiç yanıt gelmemesi bir istisna değildir

Hatalı CRC'li, yanlış unit ID'li ya da parite hatalı bir çerçeve alan cihaz sessiz kalır: istisna değil, zaman aşımı alırsınız. Bkz. [zaman aşımları](modbus-timeout-no-response).

## Boşlukları kapsayan bloklar

Birçok cihaz, ihtiyacınız olan her register var olsa bile kullanılmayan herhangi bir adresi kapsayan bir okumayı reddeder. 20 register okumak 02 ile başarısız oluyor ama tek tek okumak çalışıyorsa, isteği boşluklardan bölün. Haritalar bir cihazın istek başına kaç register kabul ettiğini belirtebilir (`max_read_registers`).
