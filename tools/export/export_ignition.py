#!/usr/bin/env python3
"""Export a .mbmap.json map as Ignition 8.1 tags (JSON tag import).

Usage: python tools/export/export_ignition.py MAP [-o OUT.json] [--device NAME]
                                       [--unit ID] [--zero-based] [--strict]

Every register becomes an OPC tag of Ignition's built-in Modbus driver, with
an item path such as ns=1;s=[Meter]1.HRF41, in a folder per group. Import the
result in the Designer (Tag Browser, Import Tags). See docs/ignition.md for
how fields translate and the device settings to check in Ignition.

What Ignition cannot represent reliably is listed on stderr and left out (or
exported raw, when only the scaling is lost). --strict exits with 1 when
anything was left out. Standard library only.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

OPC_SERVER = "Ignition OPC UA Server"

# (designator, Ignition dataType) per area and type. Ignition's Int2 is signed
# 16-bit, so unsigned values take the next larger type.
DESIGNATORS = {
    "holding": {
        "int16": ("HR", "Int2"), "uint16": ("HRUS", "Int4"),
        "int32": ("HRI", "Int4"), "uint32": ("HRUI", "Int8"),
        "int64": ("HRI_64", "Int8"), "uint64": ("HRUI_64", "Int8"),
        "float32": ("HRF", "Float4"), "float64": ("HRD", "Float8"),
        "string": ("HRS", "String"),
    },
    "input": {
        "int16": ("IR", "Int2"), "uint16": ("IRUS", "Int4"),
        "int32": ("IRI", "Int4"), "uint32": ("IRUI", "Int8"),
        "int64": ("IRI_64", "Int8"), "uint64": ("IRUI_64", "Int8"),
        "float32": ("IRF", "Float4"), "float64": ("IRD", "Float8"),
    },
}
MULTI_REGISTER = {"int32", "uint32", "float32", "int64", "uint64", "float64"}
# Characters Ignition accepts in a tag name; anything else becomes "_".
NAME_CHARS = re.compile(r"[^A-Za-z0-9 _\-'()]")


@dataclass
class Export:
    tags: dict = field(default_factory=dict)
    skipped: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    reverse_word_order: bool = False


def integer(value: int | str) -> int:
    """An integer of the file (SPEC 2.1): a JSON number or a "0x..." string."""
    return value if isinstance(value, int) else int(value, 0)


def tag_name(text: str, taken: set[str]) -> str:
    """A tag name Ignition accepts, unique within its folder."""
    base = NAME_CHARS.sub("_", text).strip() or "Register"
    name, n = base, 2
    while name.lower() in taken:
        name, n = f"{base} {n}", n + 1
    taken.add(name.lower())
    return name


def export(mbmap: dict, device: str, unit: int | None = None,
           zero_based: bool = False) -> Export:
    """Ignition tags for a parsed map, with what could not be exported."""
    out = Export()
    base = mbmap.get("address_base", 0)
    file_byte = mbmap.get("byte_order", "big")
    file_word = mbmap.get("word_order", "big")
    unit_id = unit if unit is not None else mbmap.get("unit_id", 1)
    registers = mbmap.get("registers", [])

    # Word order is one setting for the whole device in Ignition: take the
    # order most multi-register values use, and leave the others out.
    def word(r: dict) -> str:
        return r.get("word_order", file_word)

    multi = [r for r in registers if r.get("type") in MULTI_REGISTER]
    little = sum(word(r) == "little" for r in multi)
    out.reverse_word_order = little > len(multi) - little
    device_word = "little" if out.reverse_word_order else "big"

    labelled = 0
    folders: dict[str, list] = {}
    names: dict[str, set[str]] = {}
    for i, r in enumerate(registers):
        where = f"/registers/{i} ({r.get('name', '?')})"
        area, kind = r["area"], r["type"]
        wire = integer(r["address"]) - base
        address = wire if zero_based else wire + 1
        byte = r.get("byte_order", file_byte)

        if area in ("coil", "discrete"):
            item, data_type = f"{'C' if area == 'coil' else 'DI'}{address}", "Boolean"
        elif kind == "bool":
            item, data_type = f"{'HR' if area == 'holding' else 'IR'}{address}.{r['bit']}", "Boolean"
        elif kind == "string":
            if area != "holding":
                out.skipped.append(f"{where}: Ignition reads strings only from holding registers")
                continue
            item, data_type = f"HRS{address}:{2 * r['length']}", "String"
        elif r.get("bits") == 1:
            # A 1-bit field reads like a bool
            item, data_type = f"{'HR' if area == 'holding' else 'IR'}{address}.{r.get('bit', 0)}", "Boolean"
        else:
            if "bits" in r and (r.get("bit", 0), r["bits"]) != (0, 16):
                out.skipped.append(f"{where}: a field of {r['bits']} bits from bit {r.get('bit', 0)} has no Ignition designator")
                continue
            if byte == "little":
                out.skipped.append(f"{where}: Ignition cannot swap the bytes of a numeric register")
                continue
            if kind in MULTI_REGISTER and word(r) != device_word:
                out.skipped.append(f"{where}: word order {word(r)!r}, but the device is set to {device_word!r} for most registers")
                continue
            designator, data_type = DESIGNATORS[area][kind]
            item = f"{designator}{address}"

        tag = {
            "name": "",
            "tagType": "AtomicTag",
            "valueSource": "opc",
            "opcServer": OPC_SERVER,
            "opcItemPath": f"ns=1;s=[{device}]{unit_id}.{item}",
            "dataType": data_type,
            "readOnly": area in ("discrete", "input") or r.get("access", "R") == "R",
        }
        if r.get("unit"):
            tag["engUnit"] = r["unit"]

        scale, offset = r.get("scale", 1), r.get("offset", 0)
        if "scale_factor" in r:
            out.skipped.append(f"{where}: exported raw: the scale factor register {r['scale_factor']!r} cannot be applied in Ignition")
        elif data_type not in ("Boolean", "String") and (scale != 1 or offset != 0):
            # Linear: raw 0..1 -> offset..offset+scale, so value = raw * scale + offset
            tag.update(dataType="Float8", scaleMode="Linear", rawLow=0, rawHigh=1,
                       scaledLow=offset, scaledHigh=offset + scale)
        if r.get("enum") is not None:
            labelled += 1

        group = r.get("group") or ""
        folder = folders.setdefault(group, [])
        tag["name"] = tag_name(r["name"], names.setdefault(group, set()))
        folder.append(tag)

    children = []
    for group, tags in folders.items():
        if group:
            children.append({"name": tag_name(group, names.setdefault("", set())),
                             "tagType": "Folder", "tags": tags})
        else:
            children.extend(tags)
    title = " ".join(x for x in (mbmap.get("vendor"), mbmap.get("model")) if x)
    out.tags = {"name": tag_name(title or device, set()), "tagType": "Folder", "tags": children}

    if multi:
        out.notes.insert(0, f"device setting: Reverse Word Order {'ON' if out.reverse_word_order else 'OFF'}")
    out.notes.insert(0, f"device setting: Zero-based Addressing {'ON' if zero_based else 'OFF'}")
    if labelled:
        out.notes.append(f"{labelled} register(s) have labels (enum), which are not exported: their tags show the number")
    strings = [r for r in registers if r.get("type") == "string" and r["area"] == "holding"]
    if strings:
        orders = {r.get("byte_order", file_byte) for r in strings}
        if len(orders) > 1:
            out.notes.append("strings use both byte orders; Reverse String Byte Order applies to all of them")
        on = "big" in orders
        out.notes.append(f"device setting: Reverse String Byte Order {'ON' if on else 'OFF'} (check one string on the device)")
    return out


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("map", type=Path)
    ap.add_argument("-o", "--output", type=Path, help="file to write (default: stdout)")
    ap.add_argument("--device", default="Modbus", help="Ignition device name (default: Modbus)")
    ap.add_argument("--unit", type=int, help="unit ID (default: the map's unit_id, or 1)")
    ap.add_argument("--zero-based", action="store_true",
                    help="the Ignition device has Zero-based Addressing on")
    ap.add_argument("--strict", action="store_true", help="exit with 1 if any register was left out")
    args = ap.parse_args(argv)

    if not re.fullmatch(r"[A-Za-z0-9_]+", args.device):
        ap.error("--device: Ignition device names are letters, digits and _ only")
    mbmap = json.loads(args.map.read_text(encoding="utf-8-sig"))
    result = export(mbmap, args.device, args.unit, args.zero_based)

    text = json.dumps(result.tags, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)
    for line in result.notes:
        print(f"note: {line}", file=sys.stderr)
    for line in result.skipped:
        print(f"skipped: {line}", file=sys.stderr)
    return 1 if args.strict and result.skipped else 0


if __name__ == "__main__":
    sys.exit(main())
