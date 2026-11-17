# Modbus-timeouts: het apparaat antwoordt niet

Een timeout betekent dat er niets terugkwam wat uw hulpmiddel kon accepteren. Loop de lijst door van onderaan de stapel naar boven.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Bedrading.** A en B (of D+ en D−, of + en −) worden niet door elke fabrikant hetzelfde genoemd. Als niets antwoordt, verwissel dan de twee draden: dat kan geen kwaad.
2. **Gemeenschappelijke massa.** Sluit de signaalmassa (GND, C, 0 V) aan als het apparaat die heeft; lange kabels zonder geven fouten die komen en gaan.
3. **Afsluiting.** Plaats een weerstand van 120 Ω aan beide uiteinden van de bus, niet bij elk apparaat. Korte kabels op de werkbank werken meestal ook zonder.
4. **Seriële instellingen.** Baudrate, databits, pariteit en stopbits moeten exact overeenkomen. Een gebruikelijke fabrieksinstelling is 9600 of 19200 baud, 8 databits, even of geen pariteit. Een afwijkende pariteit blijft stil.
5. **Unit-ID.** Elk apparaat op de bus heeft een eigen adres nodig, 1 tot 247. Een apparaat dat op 1 staat, antwoordt niet op verzoeken voor 2. Zie [unit-ID](modbus-unit-id-slave-id).
6. **Eén master.** Twee masters op dezelfde bus (een PLC en een laptop) botsen.
7. **Richting van de omzetter.** Goedkope USB–RS-485-omzetters schakelen bij hoge baudrates soms te traag van richting. Probeer een lagere snelheid.

## Modbus TCP

1. **Bereik eerst het apparaat.** Ping het en controleer of poort 502 open is.
2. **Verbindingslimiet.** Veel apparaten accepteren maar een paar TCP-verbindingen. Een hulpmiddel dat verbindingen open laat staan, kan anderen buitensluiten totdat het apparaat ze met een timeout beëindigt.
3. **Unit-ID via gateways.** Achter een TCP-naar-RTU-gateway kiest het unit-ID het seriële apparaat en moet het overeenkomen met diens adres; sommige gateways hebben voor zichzelf 0 of 255 nodig.
4. **Modbus TCP ingeschakeld?** Sommige apparaten worden uitgeschakeld geleverd of antwoorden alleen op een andere poort.

## Het apparaat beantwoordt sommige verzoeken wel, andere niet

- Te grote verzoeken, of verzoeken die gaten in de registertabel overspannen, worden mogelijk met een uitzondering beantwoord of genegeerd. Lees kleinere blokken.
- Sommige apparaten hebben een pauze tussen verzoeken nodig (3,5 tekentijden bij RTU, meer bij trage apparaten). Verhoog het pollinginterval.
- Sommige antwoorden pas na een vertraging van tientallen of honderden milliseconden; verhoog vóór al het andere de antwoordtimeout.
