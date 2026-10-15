#!/usr/bin/env python3
"""Check tools/validate/validate.py against the fixtures in tests/ (format version 2)
and legacy/v1/tests/ (the deprecated version 1).

Usage: python tools/validate/run_tests.py

Each entry in a suite's expected.json lists the (location, code) pairs a
reader must report for that file, as errors and as warnings. Order does not
matter. The location is a JSON Pointer (version 2), a line number (version
1), or null for problems that belong to the whole file.
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from validate import check_file  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
SUITES = [REPO / "tests", REPO / "legacy" / "v1" / "tests"]


def run_suite(root: Path) -> tuple[int, int]:
    """Failures and fixture count of one folder with an expected.json."""
    expected = json.loads((root / "expected.json").read_text(encoding="utf-8"))
    on_disk = {p.relative_to(root).as_posix() for p in root.rglob("*")
               if p.name.endswith((".mbmap", ".mbmap.json"))}
    prefix = root.relative_to(REPO).as_posix()
    failures = 0

    for name in sorted(on_disk - expected.keys()):
        print(f"FAIL {prefix}/{name}: no entry in expected.json")
        failures += 1

    for name, want in sorted(expected.items()):
        if name not in on_disk:
            print(f"FAIL {prefix}/{name}: listed in expected.json but missing")
            failures += 1
            continue
        diags = check_file(root / name)
        for severity in ("errors", "warnings"):
            got = Counter((d.line, d.code) for d in diags if d.severity + "s" == severity)
            exp = Counter(tuple(x) for x in want[severity])
            if got != exp:
                failures += 1
                print(f"FAIL {prefix}/{name} {severity}")
                for item in sorted((exp - got).elements(), key=str):
                    print(f"    missing  {item}")
                for item in sorted((got - exp).elements(), key=str):
                    print(f"    extra    {item}")
    return failures, len(expected)


def main() -> int:
    failures = total = 0
    for suite in SUITES:
        f, n = run_suite(suite)
        failures += f
        total += n
    print(f"\n{total} fixture(s), {failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
