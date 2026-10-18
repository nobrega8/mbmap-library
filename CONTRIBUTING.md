# Contributing

Thanks for sharing a map. A good map saves the next person an afternoon with a PDF manual.

## Adding a map

1. Create `maps/<vendor>/<model>.mbmap.json`. Use lowercase slugs with `-` (`schneider-electric`, `pm5560`). If one map covers a model family, name the file after the family.
2. Start from [`examples/example-corp/em-100.mbmap.json`](examples/example-corp/em-100.mbmap.json) and follow [SPEC.md](SPEC.md). Editors that support JSON Schema (VS Code and others) check the file as you type through its `$schema` key.
3. Record the documents you used in `sources` (title, version, date and a public URL if there is one; SPEC.md section 3.3), set `"revision": 1` and, if you can, `x_status` (see [Status](#status)).
4. If the device reports its model or firmware in a register, give that register a `role` (SPEC.md section 4.7). If the map only fits some firmware versions, say so with `firmware_min` / `firmware_max`; leave them out when it fits every version or you do not know (SPEC.md section 3.2).
5. Run the validator and fix every error:

   ```sh
   python tools/validate/validate.py maps/<vendor>/<model>.mbmap.json
   ```

6. Add the map to the index:

   ```sh
   python tools/index/build_index.py
   ```

7. Open a pull request. In the description, say whether you tested the map on a real device, and with which firmware.

## Changing a map

- Increase `revision` by one, and set `revised` to today's date, when the change affects how a device is read or written: a register, a connection default, a table, a firmware range or a model. Fixing a description or a note does not need a new revision. CI checks this on every pull request (`python tools/revisions/check_revisions.py origin/main` runs the same check locally).
- A newer firmware that adds or moves a few registers: add those registers with `firmware_min` (and give the old ones `firmware_max`) instead of making a new file. When most of the map changes, make a separate file per firmware range.
- Add the document you checked against to `sources`.

## Status

`x_status` is not part of the mbmap format: it is an optional key that this library and Modbench use to show how far a map can be trusted. The maps in this repository set it to one of:

| `x_status` | Meaning |
|---|---|
| `verified` | Tested on a real device. |
| `official` | Written from an official source (the manufacturer's manual or protocol document) but not tested on a device. |
| `unofficial` | Copied from an unofficial source (another catalogue, a forum, a third-party integration) and not tested. |

`x_status` is a tool-specific key, so changing it does not need a new `revision`.

## Reporting a test

Anyone who reads a device with a map can mark it as tested. You do not need to be the author of the map.

1. Read the device with the map and compare the values with the device's display or its own software. Check at least one value per register group, and the byte and word order of a 32-bit value.
2. Fix what is wrong (with a new `revision`, see above).
3. Set `"x_status": "verified"` and add a line to `notes`: `"Tested on <model>, firmware <version>, <month year>."`
4. Open a pull request and fill in the **Test report** part of the template: device, firmware, connection and the registers you checked.

If you do not want to make a pull request, open a [test report issue](https://github.com/nobrega8/mbmap-library/issues/new?template=1-test-report.yml) instead and someone will update the map.

A test that finds problems you cannot fix is useful too: report it in an issue so the map is not marked as verified.

## Checking and correcting an unofficial map

Files with `"x_status": "unofficial"` were converted from other catalogues. To check one against the manufacturer's documentation:

1. Compare it with the manufacturer's manual: addresses, types, scaling, units, which register area (`holding` or `input`) and the byte and word order.
2. Fix what is wrong. If the device has a register with a fixed value, add it as a `reference` (SPEC.md section 4.6) so tools can check the map.
3. Change `source` to the document you used (title, version, public URL), remove the notes that say the map was converted, and set `x_status` to `official` (or `verified` if you also tested it on a device).

If a map cannot be checked (the model is not documented anywhere you can reach), correct what you can and leave it `unofficial`.

## Rules

- **Only public information.** Build maps from publicly available manuals or from your own testing. Do not submit anything from documents under NDA or marked confidential.
- **Do not copy manuals.** Register addresses, types and units are facts. Long descriptions copied from a manual are not. Write short descriptions in your own words, and never add PDFs or copied tables to the repo.
- **No private data.** Do not include IP addresses, serial numbers, site names, customer names or anything else from a real installation. Leave connection metadata at the device's factory defaults.
- **Prefer accuracy over coverage.** A short map with correct registers is more useful than a long one with guesses. If you are unsure about a register, leave it out or say so in its `description`.
- **One model (or family) per file.** If a newer firmware changes the map, mention it in `@firmware` or create a separate file.

## Where to ask

- A map is wrong or missing: an issue ([map request](https://github.com/nobrega8/mbmap-library/issues/new?template=2-map-request.yml), [test report](https://github.com/nobrega8/mbmap-library/issues/new?template=1-test-report.yml)) or a pull request.
- Questions about writing a map or about the format: [Q&A](https://github.com/nobrega8/mbmap-library/discussions/categories/q-a).
- Changes to the format or the tools: [Ideas](https://github.com/nobrega8/mbmap-library/discussions/categories/ideas), before a pull request to SPEC.md.
- A tool or project that uses `.mbmap`: [Show and tell](https://github.com/nobrega8/mbmap-library/discussions/categories/show-and-tell).

By contributing, you agree to release your contribution under [CC0 1.0](LICENSE).

## Signed index

`index.json` lists the sha256 and size of every map. After each push to `main`, the *Sign index*
workflow signs `index.json` with Ed25519 (the secret `MBMAP_SIGNING_KEY`) and publishes
`index.json`, `index.json.sig` and `signing/mbmap-library.pub` together on the `signed` branch.
Contributors do nothing: run `build_index.py` as above and never sign by hand.

Apps that download maps should fetch the pair from the `signed` branch, check the signature
against the public key built into the app, and check each map against its sha256 before they
install it. `python tools/sign/sign.py verify index.json --maps` is the reference check.

The key is not in the repository. To rotate it: `python tools/sign/sign.py keygen <file>`, replace
`signing/mbmap-library.pub`, set the new secret, and ship the new public key in the apps.
