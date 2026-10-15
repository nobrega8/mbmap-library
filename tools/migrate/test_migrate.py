#!/usr/bin/env python3
"""Check that tools/migrate/migrate.py converts version 1 maps to version 2 without loss.

Usage: python tools/migrate/test_migrate.py

For every valid version 1 file (legacy/v1: examples, tests/valid, tests/warnings)
it migrates the file and compares, field by field, what a reader would get
from the original and from the result: metadata with its defaults, enum and
sentinel tables, and every register with byte order, enum and reference
resolved. If the `jsonschema` package is installed, every result is also
checked against schema/mbmap-2.schema.json.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "validate"))
from migrate import SPLIT_ORDER, dumps, migrate_text, read_v1  # noqa: E402
from validate import parse_int  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
LEGACY = ROOT / "legacy" / "v1"
# Version 1 files to migrate, and version 2 files to check against the schema.
SOURCES = [LEGACY / "examples", LEGACY / "tests" / "valid", LEGACY / "tests" / "warnings",
           ROOT / "maps", ROOT / "examples", ROOT / "tests" / "valid", ROOT / "tests" / "warnings"]
META_DEFAULTS = {
    "protocol": "tcp+rtu", "unit_id": 1, "port": 502, "baudrate": 9600, "parity": "E",
    "databits": 8, "stopbits": 1, "address_base": 0, "max_read_registers": 125, "max_read_bits": 2000,
}
INTEGER_TYPES = {"int16", "uint16", "int32", "uint32", "int64", "uint64"}


def as_int(value: object) -> int:
    if isinstance(value, int):
        return value
    n = parse_int(str(value))
    assert n is not None, value
    return n


def as_table(value: object) -> dict[int, str]:
    if isinstance(value, str):  # v1 `0=Off|1=On`
        pairs = (p.partition("=") for p in value.split("|"))
        return {as_int(k.strip()): label.strip() for k, _, label in pairs}
    return {as_int(k): v for k, v in value.items()}


def v1_view(text: str) -> tuple[dict, list[dict]]:
    meta, _notes, _header, rows, _trailing = read_v1(text)
    def meta_value(key: str) -> object:
        value = meta[key]
        return value.lower() if key == "protocol" else value.upper() if key == "parity" else int(value)

    file_meta = {k: meta_value(k) if k in meta else d for k, d in META_DEFAULTS.items()}
    file_meta["order"] = SPLIT_ORDER[meta.get("byte_order", "ABCD").upper()]
    for key in ("vendor", "model", "vendor_website", "description", "firmware", "source"):
        file_meta[key] = meta.get(key)
    file_meta["enums"] = {k[5:]: as_table(v) for k, v in meta.items() if k.startswith("enum_") and len(k) > 5}
    file_meta["sentinels"] = {k[9:]: as_table(v) for k, v in meta.items() if k.startswith("sentinel_")}
    file_meta["extra"] = {k: v for k, v in meta.items() if k.startswith("x_")}

    regs = []
    for row, _comments in rows:
        typ = row["type"].lower()
        bitfield = bool(row.get("bits"))
        ref = row.get("reference", "")
        if ref:
            if bitfield or typ in INTEGER_TYPES:
                ref = as_int(ref)
            elif typ == "bool":
                ref = ref.lower() in ("1", "true")
            elif typ in ("float32", "float64"):
                ref = float(ref)
        enum = row.get("enum", "")
        regs.append({
            "name": row["name"],
            "group": row.get("group") or None,
            "area": row["area"].lower(),
            "address": as_int(row["address"]),
            "type": typ,
            "length": int(row["length"]) if row.get("length") else None,
            "bit": int(row["bit"]) if row.get("bit") else None,
            "bits": int(row["bits"]) if row.get("bits") else None,
            "scale": float(row.get("scale") or 1),
            "scale_factor": row.get("scale_factor") or None,
            "offset": float(row.get("offset") or 0),
            "unit": row.get("unit") or None,
            "access": (row.get("access") or "R").upper(),
            "order": SPLIT_ORDER[row["byte_order"].upper()] if row.get("byte_order") else file_meta["order"],
            "write_min": float(row["write_min"]) if row.get("write_min") else None,
            "write_max": float(row["write_max"]) if row.get("write_max") else None,
            "enum": file_meta["enums"][enum[1:]] if enum.startswith("@") else as_table(enum) if enum else None,
            "reference": ref if ref != "" else None,
            "description": row.get("description") or None,
            "extra": {k: v for k, v in row.items() if k.startswith("x_") and v},
        })
    return file_meta, regs


def v2_view(doc: dict) -> tuple[dict, list[dict]]:
    file_meta = {k: doc.get(k, d) for k, d in META_DEFAULTS.items()}
    file_meta["order"] = (doc.get("byte_order", "big"), doc.get("word_order", "big"))
    for key in ("vendor", "model", "vendor_website", "description", "firmware", "source"):
        file_meta[key] = doc.get(key)
    file_meta["enums"] = {k: as_table(v) for k, v in doc.get("enums", {}).items()}
    file_meta["sentinels"] = {k: as_table(v) for k, v in doc.get("sentinels", {}).items()}
    file_meta["extra"] = {k: v for k, v in doc.items() if k.startswith("x_")}

    regs = []
    for reg in doc["registers"]:
        typ = reg["type"]
        ref = reg.get("reference")
        if ref is not None and ("bits" in reg or typ in INTEGER_TYPES):
            ref = as_int(ref)
        elif isinstance(ref, (int, float)) and not isinstance(ref, bool):
            ref = float(ref)
        enum = reg.get("enum")
        regs.append({
            "name": reg["name"],
            "group": reg.get("group"),
            "area": reg["area"],
            "address": as_int(reg["address"]),
            "type": typ,
            "length": reg.get("length"),
            "bit": reg.get("bit"),
            "bits": reg.get("bits"),
            "scale": float(reg.get("scale", 1)),
            "scale_factor": reg.get("scale_factor"),
            "offset": float(reg.get("offset", 0)),
            "unit": reg.get("unit"),
            "access": reg.get("access", "R"),
            "order": (reg.get("byte_order", file_meta["order"][0]), reg.get("word_order", file_meta["order"][1])),
            "write_min": float(reg["write_min"]) if "write_min" in reg else None,
            "write_max": float(reg["write_max"]) if "write_max" in reg else None,
            "enum": file_meta["enums"][enum] if isinstance(enum, str) else as_table(enum) if enum else None,
            "reference": ref,
            "description": reg.get("description"),
            "extra": {k: v for k, v in reg.items() if k.startswith("x_")},
        })
    return file_meta, regs


def load_validator():
    try:
        import jsonschema
    except ImportError:
        return None
    schema = json.loads((ROOT / "schema" / "mbmap-2.schema.json").read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(schema)
    return jsonschema.Draft202012Validator(schema)


def main() -> int:
    validator = load_validator()
    files = [f for s in SOURCES for f in sorted(s.rglob("*.mbmap"))]
    failures = 0
    for path in files:
        name = path.relative_to(ROOT).as_posix()
        text = path.read_bytes().decode("utf-8")
        doc = migrate_text(text)
        problems = []
        if json.loads(dumps(doc)) != doc:
            problems.append("dumps() output does not parse back to the same document")
        old_meta, old_regs = v1_view(text)
        new_meta, new_regs = v2_view(doc)
        for key in old_meta:
            if old_meta[key] != new_meta[key]:
                problems.append(f"{key}: {old_meta[key]!r} != {new_meta[key]!r}")
        if len(old_regs) != len(new_regs):
            problems.append(f"{len(old_regs)} registers became {len(new_regs)}")
        for i, (a, b) in enumerate(zip(old_regs, new_regs)):
            for key in a:
                if a[key] != b[key]:
                    problems.append(f"register {i} ({a['name']}) {key}: {a[key]!r} != {b[key]!r}")
        if validator is not None:
            for err in validator.iter_errors(doc):
                problems.append(f"schema: /{'/'.join(map(str, err.absolute_path))}: {err.message}")
        if problems:
            failures += 1
            print(f"FAIL {name}")
            for p in problems[:10]:
                print(f"    {p}")

    # The version 2 example is the tool's output for the version 1 example.
    example = LEGACY / "examples" / "example-corp" / "em-100.mbmap"
    prototype = ROOT / "examples" / "example-corp" / "em-100.mbmap.json"
    if prototype.read_text(encoding="utf-8") != dumps(migrate_text(example.read_text(encoding="utf-8"))):
        failures += 1
        print(f"FAIL {prototype.relative_to(ROOT).as_posix()}: out of date, run python tools/migrate/migrate.py {example.relative_to(ROOT).as_posix()}")

    # Every valid version 2 file of the repository follows the schema.
    if validator is not None:
        v2_files = [f for s in SOURCES for f in sorted(s.rglob("*.mbmap.json"))]
        for path in v2_files:
            doc = json.loads(path.read_text(encoding="utf-8-sig"))
            for err in list(validator.iter_errors(doc))[:1]:
                failures += 1
                where = "/".join(map(str, err.absolute_path))
                print(f"FAIL {path.relative_to(ROOT).as_posix()}: schema: /{where}: {err.message}")
        print(f"{len(v2_files)} version 2 file(s) checked against the schema")

    schema_note = "checked against the schema" if validator else "schema not checked (pip install jsonschema)"
    print(f"\n{len(files)} file(s) migrated, {failures} failure(s), {schema_note}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
