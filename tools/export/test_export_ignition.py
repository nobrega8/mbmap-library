#!/usr/bin/env python3
"""Check tools/export/export_ignition.py: designators, addresses, scaling, what is
left out, and that every map in maps/ and examples/ exports without error.

Usage: python tools/export/test_export_ignition.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from export_ignition import export  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
failures = 0


def check(what: str, got, want) -> None:
    global failures
    if got != want:
        failures += 1
        print(f"FAIL {what}: got {got!r}, want {want!r}")


def tags(result) -> dict:
    """Every tag of an export by name, folders flattened."""
    found = {}

    def walk(node):
        for child in node["tags"]:
            if child["tagType"] == "Folder":
                walk(child)
            else:
                found[child["name"]] = child
    walk(result.tags)
    return found


def one(register: dict, **meta) -> tuple[dict | None, list[str]]:
    """The tag one register becomes, and what was left out."""
    result = export({"vendor": "V", "model": "M", **meta, "registers": [register]}, "Dev")
    found = tags(result)
    return (next(iter(found.values())) if found else None), result.skipped


def path(register: dict, **meta) -> str | None:
    tag, _ = one(register, **meta)
    return tag["opcItemPath"] if tag else None


# Designators and addresses (Ignition is 1-based by default)
for area, kind, want in [
    ("holding", "int16", "HR1"), ("holding", "uint16", "HRUS1"),
    ("holding", "int32", "HRI1"), ("holding", "uint32", "HRUI1"),
    ("holding", "int64", "HRI_641"), ("holding", "uint64", "HRUI_641"),
    ("holding", "float32", "HRF1"), ("holding", "float64", "HRD1"),
    ("input", "int16", "IR1"), ("input", "float32", "IRF1"),
]:
    check(f"{area} {kind}", path({"name": "x", "area": area, "address": 0, "type": kind}),
          f"ns=1;s=[Dev]1.{want}")

check("coil", path({"name": "x", "area": "coil", "address": 9, "type": "bool"}), "ns=1;s=[Dev]1.C10")
check("discrete", path({"name": "x", "area": "discrete", "address": 9, "type": "bool"}), "ns=1;s=[Dev]1.DI10")
check("bit of a register", path({"name": "x", "area": "holding", "address": 4, "type": "bool", "bit": 3}),
      "ns=1;s=[Dev]1.HR5.3")
check("1-bit field", path({"name": "x", "area": "input", "address": 4, "type": "uint16", "bit": 7, "bits": 1}),
      "ns=1;s=[Dev]1.IR5.7")
check("string length in characters", path({"name": "x", "area": "holding", "address": 2, "type": "string", "length": 6}),
      "ns=1;s=[Dev]1.HRS3:12")
check("address_base 1", path({"name": "x", "area": "holding", "address": 1, "type": "int16"}, address_base=1),
      "ns=1;s=[Dev]1.HR1")
check("hex address", path({"name": "x", "area": "holding", "address": "0x0010", "type": "int16"}),
      "ns=1;s=[Dev]1.HR17")
check("unit ID from the map", path({"name": "x", "area": "holding", "address": 0, "type": "int16"}, unit_id=7),
      "ns=1;s=[Dev]7.HR1")
check("zero-based device",
      tags(export({"registers": [{"name": "x", "area": "holding", "address": 0, "type": "int16"}]}, "Dev",
                  zero_based=True))["x"]["opcItemPath"], "ns=1;s=[Dev]1.HR0")

# Scaling, units and access
tag, _ = one({"name": "x", "area": "holding", "address": 0, "type": "int16", "scale": 0.1,
              "offset": -40, "unit": "°C", "access": "RW"})
check("linear scaling", {k: tag[k] for k in ("dataType", "scaleMode", "rawLow", "rawHigh", "scaledLow", "scaledHigh")},
      {"dataType": "Float8", "scaleMode": "Linear", "rawLow": 0, "rawHigh": 1, "scaledLow": -40, "scaledHigh": -39.9})
check("unit", tag["engUnit"], "°C")
check("writable", tag["readOnly"], False)
check("input is read-only", one({"name": "x", "area": "input", "address": 0, "type": "int16", "access": "R"})[0]["readOnly"], True)
check("no scaling", "scaleMode" in one({"name": "x", "area": "holding", "address": 0, "type": "int16"})[0], False)

# Left out, with a reason
for what, register, meta in [
    ("bit field", {"name": "x", "area": "holding", "address": 0, "type": "uint16", "bit": 4, "bits": 4}, {}),
    ("swapped bytes", {"name": "x", "area": "holding", "address": 0, "type": "int16", "byte_order": "little"}, {}),
    ("input string", {"name": "x", "area": "input", "address": 0, "type": "string", "length": 2}, {}),
]:
    tag, skipped = one(register, **meta)
    check(f"{what} left out", (tag, len(skipped)), (None, 1))

tag, skipped = one({"name": "x", "area": "holding", "address": 0, "type": "int16", "scale_factor": "sf"})
check("scale_factor exported raw", ("scaleMode" in tag, len(skipped)), (False, 1))

# Word order: the device takes the majority, the others are left out
result = export({"word_order": "little", "registers": [
    {"name": "a", "area": "holding", "address": 0, "type": "float32"},
    {"name": "b", "area": "holding", "address": 2, "type": "float32"},
    {"name": "c", "area": "holding", "address": 4, "type": "float32", "word_order": "big"},
]}, "Dev")
check("reverse word order", result.reverse_word_order, True)
check("minority word order left out", sorted(tags(result)), ["a", "b"])

# Names: Ignition's characters, unique in a folder, groups as folders
result = export({"registers": [
    {"name": "V L1/N", "group": "Volt.s", "area": "holding", "address": 0, "type": "int16"},
    {"name": "V L1/N", "group": "Volt.s", "area": "holding", "address": 1, "type": "int16"},
]}, "Dev")
folder = result.tags["tags"][0]
check("folder name", folder["name"], "Volt_s")
check("unique names", [t["name"] for t in folder["tags"]], ["V L1_N", "V L1_N 2"])

# Every published map exports, and the result is JSON
count = 0
for f in sorted([*ROOT.glob("maps/*/*.mbmap.json"), *ROOT.glob("examples/*/*.mbmap.json")]):
    try:
        json.dumps(export(json.loads(f.read_text(encoding="utf-8-sig")), "Dev").tags)
        count += 1
    except Exception as e:  # noqa: BLE001
        failures += 1
        print(f"FAIL {f.relative_to(ROOT)}: {type(e).__name__}: {e}")

print(f"{count} maps exported; {failures} failure(s)")
sys.exit(1 if failures else 0)
