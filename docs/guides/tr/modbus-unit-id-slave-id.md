# Modbus unit ID (slave ID): hangi cihaz yanıt veriyor

Her Modbus isteği, slave ID, slave adresi veya cihaz adresi de denen bir baytlık bir unit ID taşır.

## RS-485'te (Modbus RTU)

- Veri yolundaki her cihazın 1 ile 247 arasında kendi adresi vardır; bu adres ekrandan, DIP anahtarlarıyla veya yapılandırma yazılımında ayarlanır.
- 0 adresi yayındır (broadcast): her cihaz bir yazmayı uygular ve hiçbiri yanıt vermez. 0'a yapılan okumalar yanıtsız kalır.
- Başka bir adrese ayarlı bir cihaz isteğinizi tümüyle yok sayar; bu yüzden yanlış bir unit ID ölü bir cihaz gibi görünür: hata değil, [zaman aşımı](modbus-timeout-no-response) alırsınız.

## Modbus TCP'de

- IP ile doğrudan ulaşılan bir cihaz genellikle unit ID'yi yok sayar ya da 1 bekler. Bazıları 0 veya 255 bekler, birkaçı da yapılandırılmış değerinden başkasını reddeder.
- Bir TCP–RTU ağ geçidinin arkasında unit ID seri cihazı seçer: o cihazın RS-485 adresiyle uyuşmalıdır. Ağ geçidinin kendisi çoğu zaman 0, 255 veya yapılandırılmış bir ID'ye yanıt verir.
- Birkaç iç parçası olan bazı cihazlar (sayaçlı ve bataryalı bir evirici) her parça için farklı unit ID'lere yanıt verir.

<mb-gateway></mb-gateway>

## Bilinmeyen bir adresi bulma

- Cihazın ekranından veya etiketinden okuyun.
- Tarayın: cihazın baud hızında, 1'den 247'ye kadar her adrese yaygın bir register'ın okunmasını gönderin ve hangisinin yanıt verdiğine bakın. Bunu yalnızca o cihaz bağlıyken yapın.
- Fabrika ayarlarına sıfırlayın; kılavuz varsayılanı verir (çoğu zaman 1).

## MBMap haritaları bunu nasıl kaydeder

Bir harita cihazın varsayılan `unit_id` değerini (ve seri ayarlarını ve TCP portunu) verir. Varsayılan yalnızca bir başlangıç noktasıdır: cihazlar kurulurken çoğunlukla yeniden yapılandırılır.
