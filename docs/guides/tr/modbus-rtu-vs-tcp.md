# Modbus RTU, Modbus TCP ve RS-485

Sık sık karıştırılan üç ad.

| | Modbus RTU | Modbus TCP |
|---|---|---|
| Ortam | seri hat, neredeyse her zaman RS-485 (bazen RS-232) | Ethernet veya Wi-Fi |
| Adresleme | veri yolunda unit ID 1–247 | IP adresi ve port (502), artı bir unit ID |
| Hata denetimi | her çerçevede CRC-16 | TCP'nin kendi denetimleri; CRC yok |
| Çerçeveleme | çerçeveler arasında 3,5 karakterlik sessizlik | uzunluk içeren 7 baytlık başlık (MBAP) |
| Bağlantı başına cihaz | segment başına en fazla 32 birim yük (düşük yüklü alıcı-vericilerle daha fazla), bir master | cihaz başına birçok istemci, cihazla sınırlı |
| Tipik hız | 9600–115200 baud | 10/100 Mbit/s, cihazla sınırlı |

**RS-485** yalnızca elektriksel katmandır: iki tel, diferansiyel bir sinyal, bir veri yolu. Modbus RTU onun üzerinde çalışır, diğer protokoller de (BACnet MS/TP, DMX, RS-485 adaptörleri üzerinden M-Bus).

**Modbus ASCII** aynı istekleri okunabilir hex metni olarak gönderir; bugün nadirdir.

<mb-adu></mb-adu>

## Aynı register'lar

Register haritası taşıma yönteminden bağımsız olarak aynıdır: ikisini de sunan bir cihaz aynı adresler, türler ve ölçeklerle yanıt verir. Değişen, ona nasıl ulaştığınızdır: RTU'da seri ayarlar ve unit ID, TCP'de IP adresi ve port.

## Ağ geçitleri

Bir Modbus TCP–RTU ağ geçidi, Ethernet araçlarının seri cihazlara ulaşmasını sağlar. TCP isteğinin unit ID'si seri taraftaki cihazı seçer. Ağ geçitleri kendi zaman aşımlarını ekler; arkasındaki bir cihaz yanıt vermiyorsa önce ağ geçidindeki seri ayarları kontrol edin.

## MBMap haritaları bunu nasıl kaydeder

Bir harita cihazın hangi taşıma yöntemlerini sunduğunu (`protocol`: `rtu`, `tcp` veya ikisi) ve bunların varsayılanlarını (`baudrate`, `parity`, `databits`, `stopbits`, `port`, `unit_id`) belirtir.
