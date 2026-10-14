# Contributing

Thanks for sharing a map. A good map saves the next person an afternoon with a PDF manual.

## Adding a map

1. Create `maps/<vendor>/<model>.mbmap`. Use lowercase slugs with `-` (`schneider-electric`, `pm5560`). If one map covers a model family, name the file after the family.
2. Start from [`examples/example-corp/em-100.mbmap`](examples/example-corp/em-100.mbmap) and follow [SPEC.md](SPEC.md).
3. Fill in `@source` with the document you used: manual title, version or date, and a public URL if there is one.
4. Run the validator and fix every error:

   ```sh
   python tools/validate.py maps/<vendor>/<model>.mbmap
   ```

5. Add the map to the index:

   ```sh
   python tools/build_index.py
   ```

6. Open a pull request. In the description, say whether you tested the map on a real device, and with which firmware.

## Checking and correcting a converted map

Files with `@x_status=unverified` were converted from other catalogues. To verify one:

1. Compare it with the manufacturer's manual: addresses, types, scaling, units, which register area (`holding` or `input`) and the byte order.
2. Fix what is wrong. If the device has a register with a fixed value, add it as a `reference` (SPEC section 4.6) so tools can check the map.
3. Change `@source` to the document you used (title, version, public URL) and **delete the `@x_status` line**.
4. In the pull request, say whether you also tested it on a real device.

If a map cannot be fixed (the model is not documented anywhere you can reach), correct what you can and leave `@x_status` in place.

## Rules

- **Only public information.** Build maps from publicly available manuals or from your own testing. Do not submit anything from documents under NDA or marked confidential.
- **Do not copy manuals.** Register addresses, types and units are facts. Long descriptions copied from a manual are not. Write short descriptions in your own words, and never add PDFs or copied tables to the repo.
- **No private data.** Do not include IP addresses, serial numbers, site names, customer names or anything else from a real installation. Leave connection metadata at the device's factory defaults.
- **Prefer accuracy over coverage.** A short map with correct registers is more useful than a long one with guesses. If you are unsure about a register, leave it out or say so in its `description`.
- **One model (or family) per file.** If a newer firmware changes the map, mention it in `@firmware` or create a separate file.

By contributing, you agree to release your contribution under [CC0 1.0](LICENSE).
