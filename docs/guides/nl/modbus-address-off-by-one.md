# Modbus-adressen: waarom uw meting één register ernaast zit

U leest register 40001 en krijgt de waarde die de handleiding voor 40002 noemt, of het apparaat antwoordt *illegal data address* voor een register dat in de tabel staat. Bijna altijd is de oorzaak dezelfde: de handleiding en uw hulpmiddel tellen registers verschillend.

## Drie manieren om hetzelfde register te schrijven

| Wat de handleiding vermeldt | Wat het betekent | Wat op de lijn gaat |
|---|---|---|
| `40001` (Modicon-verwijzing) | houdregister nummer 1, geteld vanaf 1, met `4` als gebiedsvoorvoegsel | adres `0` |
| `1` (registernummer) | houdregister 1, geteld vanaf 1 | adres `0` |
| `0` of `0x0000` (offset) | het adres zelf | adres `0` |

Een Modbus-frame draagt altijd een adres van 0 tot 65535. De voorvoegsels `4` (houd), `3` (ingang), `1` (discrete ingang) en `0` (coil) worden niet verzonden: het gebied wordt bepaald door de functiecode (03 voor houd, 04 voor ingang, 02 voor discrete ingangen, 01 voor coils). Het overgebleven nummer wordt vaak vanaf 1 geteld, dus het lijnadres is dat nummer **min één**.

Zescijferige verwijzingen zoals `400001` of `300013` werken op dezelfde manier: laat het eerste cijfer vallen en trek er één af (`300013` → ingangsregister `12`).

<mb-address></mb-address>

## Hoe u ziet welke uw handleiding gebruikt

- **Hexadecimale adressen** (`0x0BB7`, `1004h`) zijn bijna altijd het lijnadres.
- **Een eerste register van 40001 of 30001** betekent Modicon-verwijzingen: trek 40001 of 30001 af.
- **Een eerste register van 1** betekent meestal nummering vanaf 1; een eerste register van 0 betekent lijnadressen.
- **Zoek een uitgewerkt voorbeeld.** Veel handleidingen tonen een verzoekframe (“lees register 40011: 01 03 00 0A 00 01 …”). De twee bytes na de functiecode zijn het lijnadres en beslechten de kwestie.
- **Sommige handleidingen mengen ze**, bijvoorbeeld een decimale kolom “register” die één hoger is dan de hexadecimale kolom “adres” ernaast. Vertrouw de hexkolom en de voorbeeldframes.

## Wat uw hulpmiddel verwacht

Ook hulpmiddelen verschillen. Sommige vragen het lijnadres, sommige een registernummer vanaf 1 en sommige accepteren een Modicon-verwijzing en halen het voorvoegsel eraf. Als een waarde precies één register verschoven is (een 32-bitswaarde ziet er onzinnig uit, of elke waarde lijkt bij zijn buurman te horen), probeer dan het adres één lager of één hoger.

## Hoe MBMap-kaarten dit vastleggen

Elk `.mbmap.json`-bestand geeft met `address_base` aan welke conventie zijn adressen volgen: `0` betekent dat de adressen lijnadressen zijn, `1` dat ze vanaf 1 geteld zijn en het lijnadres er één lager is. De apparaatpagina's op deze site, de CSV-export en de Home Assistant-export tonen het lijnadres naast het adres zoals in de kaart geschreven, zodat u nooit hoeft te raden.
