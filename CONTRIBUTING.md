# Contributing

Thanks for sharing a map. A good map saves the next person an afternoon with a PDF manual.

## Adding a map

1. Create `maps/<vendor>/<model>.mbmap.json`. Use lowercase slugs with `-` (`schneider-electric`, `pm5560`). If one map covers a model family, name the file after the family.
2. Start from [`examples/example-corp/em-100.mbmap.json`](examples/example-corp/em-100.mbmap.json) and follow [SPEC.md](SPEC.md). Editors that support JSON Schema (VS Code and others) check the file as you type through its `$schema` key.
3. Record the documents you used in `sources` (title, version, date and a public URL if there is one; SPEC.md section 3.3), and set `"revision": 1`.
4. If the device reports its model or firmware in a register, give that register a `role` (SPEC.md section 4.7). If the map only fits some firmware versions, say so with `firmware_min` / `firmware_max`; leave them out when it fits every version or you do not know (SPEC.md section 3.2).
5. Run the validator and fix every error:

   ```sh
   python tools/validate.py maps/<vendor>/<model>.mbmap.json
   ```

6. Add the map to the index:

   ```sh
   python tools/build_index.py
   ```

7. Open a pull request. In the description, say whether you tested the map on a real device, and with which firmware.

## Changing a map

- Increase `revision` by one, and set `revised` to today's date, when the change affects how a device is read or written: a register, a connection default, a table, a firmware range or a model. Fixing a description or a note does not need a new revision. CI checks this on every pull request (`python tools/check_revisions.py origin/main` runs the same check locally).
- A newer firmware that adds or moves a few registers: add those registers with `firmware_min` (and give the old ones `firmware_max`) instead of making a new file. When most of the map changes, make a separate file per firmware range.
- Add the document you checked against to `sources`.

## Checking and correcting a converted map

Files with `"x_status": "unverified"` were converted from other catalogues. To verify one:

1. Compare it with the manufacturer's manual: addresses, types, scaling, units, which register area (`holding` or `input`) and the byte and word order.
2. Fix what is wrong. If the device has a register with a fixed value, add it as a `reference` (SPEC.md section 4.6) so tools can check the map.
3. Change `source` to the document you used (title, version, public URL) and **delete the `x_status` key**.
4. In the pull request, say whether you also tested it on a real device.

If a map cannot be fixed (the model is not documented anywhere you can reach), correct what you can and leave `x_status` in place.

## Rules

- **Only public information.** Build maps from publicly available manuals or from your own testing. Do not submit anything from documents under NDA or marked confidential.
- **Do not copy manuals.** Register addresses, types and units are facts. Long descriptions copied from a manual are not. Write short descriptions in your own words, and never add PDFs or copied tables to the repo.
- **No private data.** Do not include IP addresses, serial numbers, site names, customer names or anything else from a real installation. Leave connection metadata at the device's factory defaults.
- **Prefer accuracy over coverage.** A short map with correct registers is more useful than a long one with guesses. If you are unsure about a register, leave it out or say so in its `description`.
- **One model (or family) per file.** If a newer firmware changes the map, mention it in `@firmware` or create a separate file.

By contributing, you agree to release your contribution under [CC0 1.0](LICENSE).
