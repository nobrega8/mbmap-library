#!/usr/bin/env python3
"""Check tools/validate.py against tests/expected.json.

Usage: python tools/run_tests.py

Each entry in expected.json lists the (line, code) pairs a reader must report
for that file, as errors and as warnings. Order does not matter; line is null
for problems that belong to the whole file.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from validate import check_file  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent / "tests"


def main() -> int:
    expected = json.loads((ROOT / "expected.json").read_text(encoding="utf-8"))
    on_disk = {p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*.mbmap")}
    failures = 0

    for name in sorted(on_disk - expected.keys()):
        print(f"FAIL {name}: no entry in expected.json")
        failures += 1

    for name, want in sorted(expected.items()):
        if name not in on_disk:
            print(f"FAIL {name}: listed in expected.json but missing")
            failures += 1
            continue
        diags = check_file(ROOT / name)
        for severity in ("errors", "warnings"):
            got = Counter((d.line, d.code) for d in diags if d.severity + "s" == severity)
            exp = Counter(tuple(x) for x in want[severity])
            if got != exp:
                failures += 1
                print(f"FAIL {name} {severity}")
                for item in sorted((exp - got).elements(), key=str):
                    print(f"    missing  {item}")
                for item in sorted((got - exp).elements(), key=str):
                    print(f"    extra    {item}")

    print(f"\n{len(expected)} fixture(s), {failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
