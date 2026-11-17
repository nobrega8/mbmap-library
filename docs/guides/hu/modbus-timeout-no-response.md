# Modbus-időtúllépések: az eszköz nem válaszol

Az időtúllépés azt jelenti, hogy semmi sem érkezett vissza, amit az Ön eszköze elfogadhatna. Haladjon végig a listán alulról felfelé.

<mb-flow name="timeout"></mb-flow>

## Modbus RTU (RS-485)

1. **Vezetékezés.** Az A és B (vagy D+ és D−, illetve + és −) elnevezését nem minden gyártó egyformán használja. Ha semmi sem válaszol, cserélje fel a két vezetéket: nem árt.
2. **Közös föld.** Kösse be a jelföldet (GND, C, 0 V), ha az eszköznek van; hosszú kábelek ennek hiányában jövő-menő hibákat okoznak.
3. **Lezárás.** Tegyen 120 Ω-os ellenállást a busz mindkét végére, ne minden eszközre. Rövid asztali kábelek általában enélkül is működnek.
4. **Soros beállítások.** A baudrátának, az adatbiteknek, a paritásnak és a stopbiteknek pontosan egyezniük kell. Gyakori gyári beállítás a 9600 vagy 19200 baud, 8 adatbit, páros vagy nincs paritás. A paritás eltérése némán marad.
5. **Unit ID.** A buszon minden eszköznek saját címre van szüksége, 1 és 247 között. Az 1-re állított eszköz nem válaszol a 2-nek szóló kérésekre. Lásd a [unit ID-t](modbus-unit-id-slave-id).
6. **Egy master.** Két master ugyanazon a buszon (egy PLC és egy laptop) ütközik.
7. **Az átalakító iránya.** Az olcsó USB–RS-485 átalakítók néha túl lassan váltanak irányt nagy baudrátánál. Próbáljon alacsonyabbat.

## Modbus TCP

1. **Először érje el az eszközt.** Pingelje meg, és ellenőrizze, hogy az 502-es port nyitva van-e.
2. **Kapcsolatkorlát.** Sok eszköz csak néhány TCP-kapcsolatot fogad el. Az a kliens, amelyik nyitva hagyja a kapcsolatokat, kizárhat másokat, amíg az eszköz időtúllépéssel le nem zárja őket.
3. **Unit ID átjárókon át.** Egy TCP–RTU átjáró mögött a unit ID választja ki a soros eszközt, és egyeznie kell annak címével; egyes átjáróknak saját magukhoz 0 vagy 255 kell.
4. **Be van kapcsolva a Modbus TCP?** Egyes eszközök kikapcsolva érkeznek, vagy csak egy másik porton válaszolnak.

## Az eszköz egyes kérésekre válaszol, másokra nem

- A túl nagy kéréseket, vagy azokat, amelyek rések fölött ívelnek a regisztertáblában, kivétellel válaszolhatják meg, vagy figyelmen kívül hagyhatják. Olvasson kisebb blokkokat.
- Egyes eszközöknek szünetre van szükségük a kérések között (RTU-nál 3,5 karakteridő, lassú eszközöknél több). Növelje a lekérdezési időközt.
- Egyesek tíz vagy száz ezredmásodperces késleltetés után válaszolnak; mindenek előtt növelje a válasz időtúllépését.
