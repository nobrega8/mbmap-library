#!/usr/bin/env python3
"""Builds index.json: one entry per map in maps/, read by apps to browse the library.

    python tools/build_index.py           # rewrite index.json
    python tools/build_index.py --check   # fail if index.json is out of date
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.json"


def entry(path: Path) -> dict:
    """Index entry for a version 2 map."""
    doc = json.loads(path.read_bytes().decode("utf-8-sig"))
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "vendor": doc.get("vendor", ""),
        "model": doc.get("model", ""),
        "description": doc.get("description"),
        "vendor_website": doc.get("vendor_website"),
        "status": doc.get("x_status"),
        "registers": len(doc.get("registers", [])),
    }


def entry_v1(path: Path) -> dict:
    """Index entry for a deprecated version 1 map."""
    text = path.read_bytes().decode("utf-8-sig")
    meta: dict[str, str] = {}
    registers = 0
    header_seen = False
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or (stripped.startswith("#") and not header_seen):
            continue
        if not header_seen and stripped.startswith("@"):
            key, _, value = stripped[1:].partition("=")
            meta[key.strip().lower()] = value.strip()
        elif not header_seen:
            header_seen = True
        elif not stripped.startswith("#"):
            registers += 1
    return {
        "path": path.relative_to(ROOT).as_posix(),
        "vendor": meta.get("vendor", ""),
        "model": meta.get("model", ""),
        "description": meta.get("description"),
        "vendor_website": meta.get("vendor_website"),
        "status": meta.get("x_status"),
        "registers": registers,
    }


def build() -> str:
    maps = sorted((ROOT / "maps").glob("*/*.mbmap.json"))
    legacy = sorted((ROOT / "maps").glob("*/*.mbmap"))
    entries = sorted(
        [entry(p) for p in maps] + [entry_v1(p) for p in legacy],
        key=lambda e: (e["vendor"].lower(), e["model"].lower()),
    )
    return json.dumps({"mbmap_index": 1, "maps": entries}, indent=2, ensure_ascii=False) + "\n"


def main() -> int:
    text = build()
    if "--check" in sys.argv[1:]:
        current = INDEX.read_text(encoding="utf-8") if INDEX.exists() else ""
        if current != text:
            print("index.json is out of date: run python tools/build_index.py")
            return 1
        print("index.json is up to date")
        return 0
    INDEX.write_bytes(text.encode("utf-8"))
    print(f"index.json: {len(json.loads(text)['maps'])} map(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
