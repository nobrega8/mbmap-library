#!/usr/bin/env python3
"""Convert .mbmap files from format version 1 (CSV) to version 2 (JSON).

Usage:
    python tools/migrate/migrate.py PATH [PATH ...]        # writes <name>.mbmap.json next to each file
    python tools/migrate/migrate.py FILE --stdout          # prints the result instead
    python tools/migrate/migrate.py PATH --out-dir DIR     # writes the results under DIR

A directory is searched for *.mbmap files. A file with validation errors
(tools/validate/validate.py) is not converted. The conversion keeps every value and
its meaning (see legacy/v1/README.md): only blank lines, the spelling of
case-insensitive values and the column order are not kept.

Standard library only.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "validate"))
from validate import check_text, parse_int  # noqa: E402

SCHEMA_URL = "https://raw.githubusercontent.com/nobrega8/mbmap-library/main/schema/mbmap-2.schema.json"

# Version 1 byte_order -> version 2 (byte_order, word_order), legacy/v1/SPEC.md §9.3.
SPLIT_ORDER = {
    "ABCD": ("big", "big"),
    "BADC": ("little", "big"),
    "CDAB": ("big", "little"),
    "DCBA": ("little", "little"),
}

# Top-level keys in the order they are written. Anything else (x_ keys,
# unknown keys) follows, in the order of the source file.
DEVICE_KEYS = ("vendor", "model", "vendor_website", "description", "firmware", "source")
CONNECTION_KEYS = (
    "protocol", "unit_id", "port", "baudrate", "parity", "databits", "stopbits",
    "byte_order", "word_order", "address_base", "max_read_registers", "max_read_bits",
)
INT_META = {"unit_id", "port", "baudrate", "databits", "stopbits", "address_base",
            "max_read_registers", "max_read_bits"}
ENUM_META = {"protocol": str.lower, "parity": str.upper}

REGISTER_KEYS = (
    "name", "group", "area", "address", "type", "length", "bit", "bits", "scale", "scale_factor",
    "offset", "unit", "access", "byte_order", "word_order", "write_min", "write_max", "enum",
    "reference", "description", "comment",
)
INTEGER_TYPES = {"int16", "uint16", "int32", "uint32", "int64", "uint64"}
SAFE_INTEGER = 2**53 - 1  # largest integer every JSON parser reads exactly


class MigrationError(Exception):
    pass


def integer(text: str) -> int | str:
    """A v1 integer cell: decimal becomes a JSON integer, 0x hex stays a string."""
    n = parse_int(text)
    if n is None:
        raise MigrationError(f"not an integer: {text!r}")
    if text.lower().startswith("0x") or abs(n) > SAFE_INTEGER:
        return "0x" + text[2:].upper() if text.lower().startswith("0x") else str(n)
    return n


def number(text: str) -> int | float:
    if re.fullmatch(r"[+-]?[0-9]+", text):
        return int(text)
    return float(text)


def table(text: str) -> dict[str, str]:
    """`0=Off|1=On` -> {"0": "Off", "1": "On"}, keeping hex spellings."""
    out: dict[str, str] = {}
    seen: dict[int, str] = {}
    for pair in text.split("|"):
        value, _, label = pair.partition("=")
        value = value.strip()
        key = "0x" + value[2:].upper() if value.lower().startswith("0x") else str(parse_int(value))
        n = parse_int(value)
        if n in seen:
            raise MigrationError(f"value {value} appears twice in {text!r}")
        seen[n] = key
        out[key] = label.strip()
    return out


def reference(text: str, typ: str, bitfield: bool) -> object:
    if bitfield or typ in INTEGER_TYPES:
        return integer(text)
    if typ == "bool":
        return text.lower() in {"1", "true"}
    if typ in ("float32", "float64"):
        return number(text)
    return text


def comment_text(line: str) -> str:
    text = line.strip()[1:]
    return text[1:] if text.startswith(" ") else text


def read_v1(text: str) -> tuple[dict[str, str], list[str], list[str], list[tuple[dict[str, str], list[str]]], list[str]]:
    """Metadata, comments before the header, header, rows with the comments
    right above each one, and comments after the last row."""
    if text.startswith("﻿"):
        text = text[1:]
    meta: dict[str, str] = {}
    notes: list[str] = []
    header: list[str] | None = None
    rows: list[tuple[dict[str, str], list[str]]] = []
    pending: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            (notes if header is None else pending).append(comment_text(line))
            continue
        if line.startswith("@") and header is None:
            key, _, value = line[1:].partition("=")
            meta[key.strip()] = value.strip()
            continue
        fields = [f.strip() for f in next(csv.reader([line]))]
        if header is None:
            header = [c.lower() for c in fields]
            continue
        fields += [""] * (len(header) - len(fields))
        row: dict[str, str] = {}
        for col, val in zip(header, fields):
            row.setdefault(col, val)
        rows.append((row, pending))
        pending = []
    return meta, notes, header or [], rows, pending


def convert_row(row: dict[str, str], comments: list[str]) -> dict:
    typ = row["type"].lower()
    bitfield = bool(row.get("bits"))
    out: dict[str, object] = {}
    for col, val in row.items():
        if not val:
            continue
        if col in ("area", "type"):
            out[col] = val.lower()
        elif col == "address":
            out[col] = integer(val)
        elif col in ("length", "bit", "bits"):
            out[col] = int(val)
        elif col in ("scale", "offset", "write_min", "write_max"):
            out[col] = number(val)
        elif col == "access":
            out[col] = val.upper()
        elif col == "byte_order":
            out["byte_order"], out["word_order"] = SPLIT_ORDER[val.upper()]
        elif col == "enum":
            out[col] = val[1:] if val.startswith("@") else table(val)
        elif col == "reference":
            out[col] = reference(val, typ, bitfield)
        else:
            out[col] = val  # name, group, unit, scale_factor, description, x_ and unknown columns
    if comments:
        out["comment"] = "\n".join(comments)
    known = [k for k in REGISTER_KEYS if k in out]
    return {k: out[k] for k in known + [k for k in out if k not in REGISTER_KEYS]}


def migrate_text(text: str) -> dict:
    """The version 2 document for a valid version 1 file."""
    errors = [d for d in check_text(text) if d.severity == "error"]
    if errors:
        first = errors[0]
        where = f"line {first.line}: " if first.line else ""
        raise MigrationError(f"{len(errors)} validation error(s), first: {where}{first.message} [{first.code}]")

    meta, notes, _header, rows, trailing = read_v1(text)
    doc: dict[str, object] = {"$schema": SCHEMA_URL, "mbmap": 2}
    for key in DEVICE_KEYS:
        if key in meta:
            doc[key] = meta[key]
    if notes or trailing:
        doc["notes"] = notes + trailing

    file_order = SPLIT_ORDER[meta.get("byte_order", "ABCD").upper()]
    for key in CONNECTION_KEYS:
        if key == "byte_order" and "byte_order" in meta:
            doc["byte_order"], doc["word_order"] = file_order
        elif key in INT_META and key in meta:
            doc[key] = int(meta[key])
        elif key in ENUM_META and key in meta:
            doc[key] = ENUM_META[key](meta[key])

    enums = {k[len("enum_"):]: table(v) for k, v in meta.items() if k.startswith("enum_") and len(k) > 5}
    sentinels = {k[len("sentinel_"):]: table(v) for k, v in meta.items() if k.startswith("sentinel_")}
    if enums:
        doc["enums"] = enums
    if sentinels:
        doc["sentinels"] = sentinels

    handled = {"mbmap", *DEVICE_KEYS, *CONNECTION_KEYS}
    for key, value in meta.items():
        if key not in handled and not key.startswith(("enum_", "sentinel_")):
            doc[key] = value  # x_ keys and keys from a newer v1 revision, kept as text

    doc["registers"] = [convert_row(row, comments) for row, comments in rows]
    return doc


def dumps(doc: dict) -> str:
    """JSON with one register, enum or sentinel table per line, so a change
    to one register is a one-line diff, as in version 1."""
    def compact(value: object) -> str:
        return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))

    lines = ["{"]
    items = list(doc.items())
    for i, (key, value) in enumerate(items):
        comma = "," if i < len(items) - 1 else ""
        name = json.dumps(key)
        if key == "registers" or key == "notes":
            if not value:
                lines.append(f"  {name}: []{comma}")
                continue
            lines.append(f"  {name}: [")
            lines += [f"    {compact(v)}," for v in value[:-1]] + [f"    {compact(value[-1])}"]
            lines.append(f"  ]{comma}")
        elif key in ("enums", "sentinels"):
            lines.append(f"  {name}: {{")
            entries = list(value.items())
            for j, (k, v) in enumerate(entries):
                lines.append(f"    {json.dumps(k)}: {compact(v)}{',' if j < len(entries) - 1 else ''}")
            lines.append(f"  }}{comma}")
        else:
            lines.append(f"  {name}: {compact(value)}{comma}")
    lines.append("}")
    return "\n".join(lines) + "\n"


def target_for(src: Path, base: Path | None, out_dir: Path | None) -> Path:
    name = src.name + ".json"
    if out_dir is None:
        return src.with_name(name)
    rel = src.parent.relative_to(base) if base is not None else Path()
    return out_dir / rel / name


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Convert .mbmap files from version 1 (CSV) to version 2 (JSON).")
    parser.add_argument("paths", nargs="+", type=Path, help=".mbmap files or folders")
    parser.add_argument("--stdout", action="store_true", help="print the result of a single file")
    parser.add_argument("--out-dir", type=Path, help="write under this folder, keeping the folder layout")
    args = parser.parse_args(argv)

    jobs: list[tuple[Path, Path | None]] = []
    for p in args.paths:
        if p.is_dir():
            jobs += [(f, p) for f in sorted(p.rglob("*.mbmap"))]
        elif p.is_file():
            jobs.append((p, None))
        else:
            print(f"error: {p} not found", file=sys.stderr)
            return 2
    if args.stdout and len(jobs) != 1:
        print("error: --stdout takes exactly one file", file=sys.stderr)
        return 2

    failed = 0
    for src, base in jobs:
        try:
            text = src.read_bytes().decode("utf-8")
            out = dumps(migrate_text(text))
        except UnicodeDecodeError:
            print(f"skipped: {src}: file is not valid UTF-8 [not-utf8]", file=sys.stderr)
            failed += 1
            continue
        except MigrationError as exc:
            print(f"skipped: {src}: {exc}", file=sys.stderr)
            failed += 1
            continue
        if args.stdout:
            sys.stdout.buffer.write(out.encode("utf-8"))
            continue
        dest = target_for(src, base, args.out_dir)
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(out.encode("utf-8"))
        print(f"{src} -> {dest}")

    if not args.stdout:
        print(f"\n{len(jobs) - failed} converted, {failed} skipped")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
