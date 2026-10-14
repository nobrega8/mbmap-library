#!/usr/bin/env python3
"""Tests for tools/check_revisions.py. Usage: python tools/test_check_revisions.py"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from check_revisions import problems  # noqa: E402

REG = {"name": "Voltage", "area": "input", "address": 0, "type": "float32", "unit": "V"}


def doc(revision: int | None = 1, **changes: object) -> dict:
    d = {"mbmap": 2, "vendor": "T", "model": "M", "registers": [dict(REG)]}
    if revision is not None:
        d["revision"] = revision
    for key, value in changes.items():
        if key.startswith("reg_"):
            d["registers"][0][key[4:]] = value
        else:
            d[key] = value
    return d


CASES = [
    ("new map with a revision", None, doc(1), 0),
    ("new map without a revision", None, doc(None), 1),
    ("unchanged", doc(1), doc(1), 0),
    ("free text only", doc(1), doc(1, description="Better words", reg_description="x", reg_comment="c",
                                   notes=["n"], source="s", sources=[{"title": "t"}], revised="2026-10-14",
                                   x_status="verified"), 0),
    ("register changed, revision bumped", doc(1), doc(2, reg_address=2), 0),
    ("register changed, same revision", doc(1), doc(1, reg_address=2), 1),
    ("connection default changed", doc(1), doc(1, unit_id=5), 1),
    ("firmware range changed", doc(1), doc(1, firmware_max="2"), 1),
    ("map without revision changed, revision added", doc(None), doc(1, reg_unit="kV"), 0),
    ("map without revision changed, none added", doc(None), doc(None, reg_unit="kV"), 1),
    ("revision went down", doc(3), doc(2), 1),
]


def main() -> int:
    failures = 0
    for name, old, new, want in CASES:
        got = problems(old, new)
        if len(got) != want:
            failures += 1
            print(f"FAIL {name}: expected {want} problem(s), got {got}")
    print(f"{len(CASES)} case(s), {failures} failure(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
