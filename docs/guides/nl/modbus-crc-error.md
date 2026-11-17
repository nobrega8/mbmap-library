# Modbus-CRC-fouten op RS-485

Een CRC-fout betekent dat een frame is aangekomen, maar zijn controlesom niet klopte: bytes zijn onderweg veranderd of verloren gegaan. Anders dan een verkeerd adres wijst het op de fysieke verbinding of de timing.

## Veelvoorkomende oorzaken

- **Ruis.** Ongeschermde kabel naast voedingskabels of aandrijvingen. Gebruik afgeschermd getwist paar, met de afscherming aan één kant geaard.
- **Ontbrekende of extra afsluiting.** Eén weerstand van 120 Ω aan elk uiteinde van de bus; geen ertussen.
- **Geen bias.** Een ruststaande bus zonder biasweerstanden zweeft, en de eerste bytes van een frame kunnen verkeerd gelezen worden. Veel omzetters en masters hebben een biasoptie.
- **Stubs en sterbedrading.** RS-485 wil één lijn van apparaat naar apparaat, geen vertakkingen.
- **Baudrate iets afwijkend** bij goedkope omzetters of bij hoge snelheden. Probeer een lagere baudrate.
- **Samenvloeiende frames.** Als de master het volgende verzoek stuurt voordat de bus 3,5 tekentijden stil was, zien apparaten één lang, beschadigd frame. Vergroot de vertraging tussen verzoeken.
- **Twee masters**, of een apparaat dat op hetzelfde adres antwoordt als een ander.

<mb-crc></mb-crc>

## Stappen

1. Verlaag de baudrate en kijk of de fouten ophouden.
2. Test met één apparaat en een korte kabel. Als dat werkt, ligt het probleem bij de bus, niet bij het apparaat.
3. Controleer de afsluiting met uitgeschakelde voeding: de weerstand tussen A en B hoort ongeveer 60 Ω te zijn met beide afsluiters geplaatst.
4. Voeg bias toe als de master of omzetter die biedt.
5. Verhoog het pollinginterval en de timeout.

Een incidentele CRC-fout op een lange industriële bus is normaal; een hulpmiddel hoort het opnieuw te proberen. Fouten bij de meeste frames zijn dat niet.
