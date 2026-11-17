# Is het veilig om naar een Modbus-apparaat te schrijven?

Een register lezen is onschuldig. Een register schrijven verandert het apparaat, soms op manieren die moeilijk ongedaan te maken zijn.

## Wat er mis kan gaan

- **Verkeerd register.** Een [adres dat één ernaast zit](modbus-address-off-by-one) schrijft uw waarde in de naastgelegen instelling: een stroomtransformatorverhouding, een beveiligingsgrens, een baudrate.
- **Communicatie-instellingen.** Het schrijven van unit-ID, baudrate of pariteit sluit u buiten totdat u opnieuw verbindt met de nieuwe waarden.
- **Slijtage van het geheugen.** Veel apparaten slaan instellingen op in flash of EEPROM met een beperkt aantal schrijfacties. Elke seconde een setpoint schrijven kan het in maanden verslijten. Sommige apparaten bieden een adres dat alleen in RAM werkt voor veelvuldig schrijven.
- **Commando's werken meteen.** Start/stop, het openen/sluiten van een schakelaar, het resetten van energietellers en een fabrieksreset gebeuren bij het schrijven, zonder bevestiging.
- **Half geschreven waarden.** Het schrijven van de twee registers van een 32-bitswaarde in aparte verzoeken kan een ogenblik een gemengde waarde achterlaten of worden geweigerd.

<mb-flow name="write"></mb-flow>

## Voordat u schrijft

1. Vergelijk de kaart met het document van de fabrikant en geef de voorkeur aan kaarten met de status *geverifieerd* of *officieel*.
2. Lees het register eerst en bevestig dat het bevat wat u verwacht.
3. Controleer het toegestane bereik; veel apparaten begrenzen of weigeren waarden daarbuiten.
4. Schrijf waarden met meerdere registers in één verzoek (functie 16).
5. Weet hoe u de oude waarde kunt herstellen.
6. Test bij apparatuur die vermogen of machines bestuurt in geïsoleerde toestand.

## Hoe MBMap-kaarten helpen

Registers hebben een `access` (`R`, `W`, `RW`) en beschrijfbare kunnen `write_min` en `write_max` dragen. Elke kaart heeft een status die aangeeft of hij op een apparaat is getest, uit het document van de fabrikant is overgenomen of nog niet is gecontroleerd. Hulpmiddelen horen te waarschuwen voordat ze schrijven naar een apparaat waarvan het model niet bij de kaart past.
