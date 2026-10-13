#!/usr/bin/env python3
"""Validate .mbmap files against SPEC.md (format version 1).

Usage: python tools/validate.py [PATH ...]   (defaults to maps/ and examples/)

Exits with 1 if any file has errors. Warnings are printed but do not fail.
Standard library only.
"""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

AREAS = {"coil", "discrete", "input", "holding"}
BIT_AREAS = {"coil", "discrete"}
ACCESS_BY_AREA = {
    "coil": {"R", "W", "RW"},
    "discrete": {"R"},
    "input": {"R"},
    "holding": {"R", "W", "RW"},
}
TYPE_REGISTERS = {
    "bool": 0,
    "int16": 1, "uint16": 1,
    "int32": 2, "uint32": 2, "float32": 2,
    "int64": 4, "uint64": 4, "float64": 4,
    "string": None,
}
BYTE_ORDERS = {"ABCD", "CDAB", "BADC", "DCBA"}
REQUIRED_META = ("mbmap", "vendor", "model")
REQUIRED_COLUMNS = ("name", "area", "address", "type")
KNOWN_COLUMNS = {
    "name", "group", "area", "address", "type", "length", "scale", "offset",
    "unit", "access", "byte_order", "bit", "enum", "description",
}
META_KEY_RE = re.compile(r"^[a-z0-9_]+$")
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def int_in(lo: int, hi: int):
    def check(v: str) -> bool:
        try:
            return lo <= int(v) <= hi
        except ValueError:
            return False
    return check


def one_of(*values: str):
    return lambda v: v in values


META_RULES = {
    "mbmap": one_of("1"),
    "protocol": one_of("tcp", "rtu", "tcp+rtu"),
    "unit_id": int_in(0, 255),
    "port": int_in(1, 65535),
    "baudrate": int_in(1, 10_000_000),
    "parity": one_of("N", "E", "O"),
    "databits": one_of("7", "8"),
    "stopbits": one_of("1", "2"),
    "byte_order": lambda v: v in BYTE_ORDERS,
    "address_base": one_of("0", "1"),
    "max_read_registers": int_in(1, 125),
    "max_read_bits": int_in(1, 2000),
}


def parse_int(text: str) -> int | None:
    try:
        return int(text, 16) if text.lower().startswith("0x") else int(text, 10)
    except ValueError:
        return None


def is_number(text: str) -> bool:
    try:
        float(text)
        return True
    except ValueError:
        return False


def valid_enum(text: str) -> bool:
    for pair in text.split("|"):
        value, sep, label = pair.partition("=")
        if not sep or parse_int(value.strip()) is None or not label.strip():
            return False
    return True


class Report:
    def __init__(self, path: Path):
        self.path = path
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, line: int | None, msg: str) -> None:
        self.errors.append(f"{self.path}:{line}: {msg}" if line else f"{self.path}: {msg}")

    def warn(self, line: int | None, msg: str) -> None:
        self.warnings.append(f"{self.path}:{line}: {msg}" if line else f"{self.path}: {msg}")


def validate(path: Path) -> Report:
    rep = Report(path)
    try:
        text = path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        rep.error(None, "file is not valid UTF-8")
        return rep

    meta: dict[str, str] = {}
    header: list[str] | None = None
    sep = ","
    rows: list[tuple[int, dict[str, str]]] = []

    for lineno, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("@"):
            if header is not None:
                rep.error(lineno, "metadata after the header")
                continue
            key, eq, value = line[1:].partition("=")
            key, value = key.strip(), value.strip()
            if not eq or not META_KEY_RE.match(key):
                rep.error(lineno, f"malformed metadata line: {line!r}")
            elif key in meta:
                rep.error(lineno, f"duplicate metadata key @{key}")
            else:
                meta[key] = value
                rule = META_RULES.get(key)
                if rule and not rule(value):
                    rep.error(lineno, f"invalid value for @{key}: {value!r}")
            continue

        if header is None:
            comma, semi = line.find(","), line.find(";")
            sep = ";" if semi != -1 and (comma == -1 or semi < comma) else ","
            header = [c.strip().lower() for c in next(csv.reader([line], delimiter=sep))]
            seen = set()
            for col in header:
                if col in seen:
                    rep.error(lineno, f"duplicate column {col!r}")
                seen.add(col)
            for col in REQUIRED_COLUMNS:
                if col not in header:
                    rep.error(lineno, f"header is missing required column {col!r}")
            continue

        fields = [f.strip() for f in next(csv.reader([raw], delimiter=sep))]
        if len(fields) > len(header):
            rep.error(lineno, f"row has {len(fields)} fields, header has {len(header)}")
            continue
        fields += [""] * (len(header) - len(fields))
        rows.append((lineno, dict(zip(header, fields))))

    for key in REQUIRED_META:
        if key not in meta:
            rep.error(None, f"missing required metadata @{key}")
    if header is None:
        rep.error(None, "no header line")
        return rep
    if any(col not in header for col in REQUIRED_COLUMNS):
        return rep
    if not rows:
        rep.warn(None, "no register rows")

    base = 1 if meta.get("address_base") == "1" else 0
    names: dict[str, int] = {}
    spans: list[tuple[str, int, int, int, str]] = []  # area, start, end, line, name

    for lineno, row in rows:
        name, area, typ = row["name"], row["area"].lower(), row["type"].lower()

        for col in REQUIRED_COLUMNS:
            if not row[col]:
                rep.error(lineno, f"empty required cell {col!r}")
        if not all(row[c] for c in REQUIRED_COLUMNS):
            continue

        if name in names:
            rep.warn(lineno, f"name {name!r} already used on line {names[name]}")
        names.setdefault(name, lineno)

        if area not in AREAS:
            rep.error(lineno, f"unknown area {row['area']!r}")
            continue
        if typ not in TYPE_REGISTERS:
            rep.error(lineno, f"unknown type {row['type']!r}")
            continue

        address = parse_int(row["address"])
        if address is None:
            rep.error(lineno, f"invalid address {row['address']!r}")
            continue
        wire = address - base
        if wire < 0:
            rep.error(lineno, f"address {address} is below @address_base={base}")
            continue

        if area in BIT_AREAS and typ != "bool":
            rep.error(lineno, f"area {area!r} only holds bool values")
            continue

        bit = row.get("bit", "")
        if typ == "bool" and area not in BIT_AREAS:
            if not bit:
                rep.error(lineno, "bool in a register area needs a 'bit' (0-15)")
            elif not int_in(0, 15)(bit):
                rep.error(lineno, f"invalid bit {bit!r}")
        elif bit:
            rep.warn(lineno, "'bit' is only used for bool in input/holding; ignored")

        count = TYPE_REGISTERS[typ]
        length = row.get("length", "")
        if typ == "string":
            if not length:
                rep.error(lineno, "string needs a 'length' (registers)")
                continue
            if not int_in(1, 65536)(length):
                rep.error(lineno, f"invalid length {length!r}")
                continue
            count = int(length)
        count = max(count, 1)

        if wire + count > 65536:
            rep.error(lineno, "register span goes beyond address 65535")

        access = (row.get("access") or "R").upper()
        if access not in ACCESS_BY_AREA[area]:
            rep.error(lineno, f"access {access!r} is not allowed for area {area!r}")

        order = row.get("byte_order", "").upper()
        if order and order not in BYTE_ORDERS:
            rep.error(lineno, f"invalid byte_order {row['byte_order']!r}")

        for col in ("scale", "offset"):
            if row.get(col) and not is_number(row[col]):
                rep.error(lineno, f"{col} is not a number: {row[col]!r}")

        if row.get("enum") and not valid_enum(row["enum"]):
            rep.error(lineno, f"malformed enum {row['enum']!r} (expected 0=Off|1=On)")

        # Bits of the same register (bool + bit) are meant to share an address.
        if not (typ == "bool" and area not in BIT_AREAS):
            spans.append((area, wire, wire + count, lineno, name))

    for col in header:
        if col not in KNOWN_COLUMNS and not col.startswith("x_"):
            rep.warn(None, f"unknown column {col!r} (custom columns should start with 'x_')")

    spans.sort()
    for (a1, s1, e1, l1, n1), (a2, s2, e2, l2, n2) in zip(spans, spans[1:]):
        if a1 == a2 and s2 < e1:
            rep.warn(l2, f"{n2!r} overlaps {n1!r} (line {l1})")

    return rep


def check_location(path: Path, rep: Report) -> None:
    """Files in maps/ must live at maps/<vendor>/<model>.mbmap with lowercase slugs."""
    parts = path.as_posix().split("/")
    if "maps" not in parts:
        return
    rel = parts[parts.index("maps") + 1:]
    if len(rel) != 2 or not all(SLUG_RE.match(p) for p in (rel[0], rel[1].removesuffix(".mbmap"))):
        rep.error(None, "maps must be at maps/<vendor-slug>/<model-slug>.mbmap (lowercase, a-z 0-9 -)")


def main(argv: list[str]) -> int:
    targets = [Path(a) for a in argv] or [Path("maps"), Path("examples")]
    files: list[Path] = []
    for t in targets:
        if t.is_dir():
            files += sorted(t.rglob("*.mbmap"))
        elif t.is_file():
            files.append(t)
        else:
            print(f"warning: {t} not found", file=sys.stderr)

    errors = warnings = 0
    for f in files:
        rep = validate(f)
        check_location(f, rep)
        for w in rep.warnings:
            print(f"warning: {w}")
        for e in rep.errors:
            print(f"error: {e}")
        errors += len(rep.errors)
        warnings += len(rep.warnings)

    print(f"\n{len(files)} file(s), {errors} error(s), {warnings} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
