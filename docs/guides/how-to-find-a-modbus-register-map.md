# How to find the Modbus register map of a device

The register map (also called Modbus table, point list, memory map or communication protocol) is rarely in the installation sheet. Where to look:

1. **Search this library** by model, model code or alias. Every map links to the document it was written from.
2. **The manufacturer's download area.** Search for "communication protocol", "Modbus protocol", "Modbus register map", "Modbus table" or "point map" with the model name. It is often a separate PDF from the user manual.
3. **The full user manual.** Many manuals have the table in a chapter near the end ("Communication", "Modbus", "Appendix B").
4. **Configuration software.** Some vendors ship the map inside their software or as an Excel file next to it.
5. **The family document.** A model often shares its map with its family ("EM24 DIN", "PM5000 series"). Check that the family manual covers your variant.
6. **Ask the manufacturer's support.** Some maps are sent only on request, sometimes under NDA; check whether you may share it before publishing a map made from it.
7. **Integrations of other projects.** Home Assistant, openHAB, Node-RED and EVCC configurations often contain working register lists, but check them against the manual.

## What to read in it

- The **addressing convention** (wire address, 1-based or Modicon). See [addresses](modbus-address-off-by-one).
- The **data types**, **word order** and **scale** of each value. See [byte and word order](byte-and-word-order) and [scaling](scaling-and-units).
- The **supported function codes** and the largest number of registers per request.
- The **default serial settings** and unit ID.

## Not in this library?

[Request a map](https://github.com/nobrega8/mbmap-library/issues/new/choose) with a link to the document, or write one yourself: the format is plain JSON and the [specification](/spec) explains every key.
