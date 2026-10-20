# Tools

Scripts that work with `.mbmap.json` files. Run them from the root of the repository.

## In this repository

| Folder | What it does |
|---|---|
| [`validate/`](validate/) | Checks maps against [SPEC.md](../SPEC.md) (`validate.py`) and runs the sample files in `tests/` (`run_tests.py`) |
| [`index/`](index/) | Rebuilds `index.json` and the status chart in the README (`build_index.py`) |
| [`revisions/`](revisions/) | Checks that a changed map increases its `revision` (`check_revisions.py`) |
| [`migrate/`](migrate/) | Converts version 1 `.mbmap` files to version 2 JSON |
| [`export/`](export/) | Exports a map to other software: Ignition tags |
| [`sign/`](sign/) | Signs the library index, so apps can check what they download |

## From the community

- [mbmap-tools](https://github.com/NickHardy-Spotlight/mbmap-tools) by [@NickHardy-Spotlight](https://github.com/NickHardy-Spotlight) ([discussion](https://github.com/nobrega8/mbmap-library/discussions/48)): Python scripts that export the registers of a map to CSV and put them back after editing, for bulk changes. They do not know the schema rules, so run `tools/validate/validate.py` on the result.

Made a tool for `.mbmap` files? Tell us in [Show and tell](https://github.com/nobrega8/mbmap-library/discussions/categories/show-and-tell).
