# Hoe u de Modbus-registerkaart van een apparaat vindt

De registerkaart (ook Modbus-tabel, puntenlijst, geheugenkaart of communicatieprotocol genoemd) staat zelden in het installatieblad. Waar u kunt zoeken:

1. **Zoek in deze bibliotheek** op model, modelcode of alias. Elke kaart verwijst naar het document waaruit hij is geschreven.
2. **Het downloadgedeelte van de fabrikant.** Zoek met de modelnaam naar “communication protocol”, “Modbus protocol”, “Modbus register map”, “Modbus table” of “point map”. Vaak is het een apart pdf-bestand naast de gebruikershandleiding.
3. **De volledige gebruikershandleiding.** In veel handleidingen staat de tabel in een hoofdstuk tegen het einde (“Communication”, “Modbus”, “Appendix B”).
4. **Configuratiesoftware.** Sommige leveranciers leveren de kaart mee in hun software of als Excel-bestand ernaast.
5. **Het familiedocument.** Een model deelt zijn kaart vaak met zijn familie (“EM24 DIN”, “PM5000 series”). Controleer of de familiehandleiding uw variant dekt.
6. **Vraag de support van de fabrikant.** Sommige kaarten worden alleen op verzoek gestuurd, soms onder NDA; controleer of u hem mag delen voordat u een kaart publiceert die ervan is gemaakt.
7. **Integraties van andere projecten.** Configuraties van Home Assistant, openHAB, Node-RED en EVCC bevatten vaak werkende registerlijsten, maar controleer ze tegen de handleiding.

<mb-flow name="find"></mb-flow>

## Wat u erin moet lezen

- De **adresseringsconventie** (lijnadres, vanaf 1 of Modicon). Zie [adressen](modbus-address-off-by-one).
- De **datatypen**, **woordvolgorde** en **schaal** van elke waarde. Zie [byte- en woordvolgorde](byte-and-word-order) en [schaling](scaling-and-units).
- De **ondersteunde functiecodes** en het grootste aantal registers per verzoek.
- De **standaard seriële instellingen** en het unit-ID.

## Niet in deze bibliotheek?

[Vraag een kaart aan](https://github.com/nobrega8/mbmap-library/issues/new/choose) met een link naar het document, of schrijf er zelf een: het formaat is gewone JSON en de [specificatie](/spec) legt elke sleutel uit.
