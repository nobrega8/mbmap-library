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
from dataclasses import dataclass
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
SENTINEL_RANGES = {
    "int16": (-(2**15), 2**15 - 1),
    "uint16": (0, 2**16 - 1),
    "int32": (-(2**31), 2**31 - 1),
    "uint32": (0, 2**32 - 1),
    "int64": (-(2**63), 2**63 - 1),
    "uint64": (0, 2**64 - 1),
}
REQUIRED_META = ("mbmap", "vendor", "model")
REQUIRED_COLUMNS = ("name", "area", "address", "type")
KNOWN_COLUMNS = {
    "name", "group", "area", "address", "type", "length", "scale", "offset",
    "unit", "access", "byte_order", "bit", "enum", "description",
}
META_KEY_RE = re.compile(r"^[a-z0-9_]+$")
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


def parse_int(text: str) -> int | None:
    """Decimal or 0x hex integer, as allowed in `address`."""
    try:
        if text.lower().startswith("0x"):
            return int(text[2:], 16)
        if re.fullmatch(r"[+-]?[0-9]+", text):
            return int(text, 10)
    except ValueError:
        pass
    return None


def int_in(lo: int, hi: int):
    def check(v: str) -> bool:
        n = parse_int(v) if not v.lower().startswith("0x") else None
        return n is not None and lo <= n <= hi
    return check


def one_of(*values: str):
    allowed = {v.lower() for v in values}
    return lambda v: v.lower() in allowed


META_RULES = {
    "mbmap": one_of("1"),
    "protocol": one_of("tcp", "rtu", "tcp+rtu"),
    "unit_id": int_in(0, 255),
    "port": int_in(1, 65535),
    "baudrate": int_in(1, 10_000_000),
    "parity": one_of("N", "E", "O"),
    "databits": one_of("7", "8"),
    "stopbits": one_of("1", "2"),
    "byte_order": one_of(*BYTE_ORDERS),
    "address_base": one_of("0", "1"),
    "max_read_registers": int_in(1, 125),
    "max_read_bits": int_in(1, 2000),
}


def is_number(text: str) -> bool:
    try:
        float(text)
    except ValueError:
        return False
    return text.lower() not in {"nan", "inf", "-inf", "+inf", "infinity", "-infinity"}


def valid_sentinels(type_name: str, text: str) -> bool:
    if type_name not in SENTINEL_RANGES or not valid_enum(text):
        return False
    lo, hi = SENTINEL_RANGES[type_name]
    return all(lo <= parse_int(pair.partition("=")[0].strip()) <= hi for pair in text.split("|"))


def valid_enum(text: str) -> bool:
    for pair in text.split("|"):
        value, sep, label = pair.partition("=")
        if not sep or parse_int(value.strip()) is None or not label.strip():
            return False
    return True


@dataclass(frozen=True)
class Diagnostic:
    severity: str  # "error" | "warning"
    line: int | None
    code: str
    message: str


def check_text(text: str) -> list[Diagnostic]:
    """All diagnostics for the contents of one .mbmap file."""
    out: list[Diagnostic] = []

    def error(line: int | None, code: str, msg: str) -> None:
        out.append(Diagnostic("error", line, code, msg))

    def warn(line: int | None, code: str, msg: str) -> None:
        out.append(Diagnostic("warning", line, code, msg))

    if text.startswith("﻿"):
        text = text[1:]

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
                error(lineno, "meta-after-header", "metadata after the header")
                continue
            key, eq, value = line[1:].partition("=")
            key, value = key.strip(), value.strip()
            if not eq or not META_KEY_RE.match(key):
                error(lineno, "malformed-meta", f"malformed metadata line: {line!r}")
            elif key in meta:
                error(lineno, "duplicate-meta", f"duplicate metadata key @{key}")
            else:
                meta[key] = value
                rule = META_RULES.get(key)
                if key.startswith("sentinel_"):
                    if not valid_sentinels(key[len("sentinel_"):], value):
                        error(lineno, "bad-sentinel", f"invalid sentinel table @{key}")
                elif key.startswith("enum_") and len(key) > 5:
                    if not valid_enum(value):
                        error(lineno, "bad-enum", f"malformed table @{key} (expected 0=Off|1=On)")
                elif rule and not rule(value):
                    error(lineno, "bad-meta-value", f"invalid value for @{key}: {value!r}")
            continue

        if header is None:
            comma, semi = line.find(","), line.find(";")
            sep = ";" if semi != -1 and (comma == -1 or semi < comma) else ","
            header = [c.strip().lower() for c in next(csv.reader([line], delimiter=sep))]
            seen: set[str] = set()
            for col in header:
                if col in seen:
                    error(lineno, "duplicate-column", f"duplicate column {col!r}")
                seen.add(col)
            for col in REQUIRED_COLUMNS:
                if col not in header:
                    error(lineno, "missing-column", f"header is missing required column {col!r}")
            continue

        fields = [f.strip() for f in next(csv.reader([line], delimiter=sep))]
        if len(fields) > len(header):
            error(lineno, "too-many-fields", f"row has {len(fields)} fields, header has {len(header)}")
            continue
        fields += [""] * (len(header) - len(fields))
        # With a duplicated column, the first occurrence wins.
        row: dict[str, str] = {}
        for col, val in zip(header, fields):
            row.setdefault(col, val)
        rows.append((lineno, row))

    for key in REQUIRED_META:
        if key not in meta:
            error(None, "missing-meta", f"missing required metadata @{key}")
    if header is None:
        error(None, "no-header", "no header line")
        return out
    for col in dict.fromkeys(header):
        if col not in KNOWN_COLUMNS and not col.startswith("x_"):
            warn(None, "unknown-column", f"unknown column {col!r} (custom columns should start with 'x_')")
    if any(col not in header for col in REQUIRED_COLUMNS):
        return out
    if not rows:
        warn(None, "no-rows", "no register rows")

    base = 1 if meta.get("address_base") == "1" else 0
    names: dict[str, int] = {}
    spans: list[tuple[str, int, int, int, str]] = []  # area, start, end, line, name

    for lineno, row in rows:
        name, area, typ = row["name"], row["area"].lower(), row["type"].lower()
        errors_before = sum(d.severity == "error" for d in out)

        empty = [c for c in REQUIRED_COLUMNS if not row[c]]
        if empty:
            for col in empty:
                error(lineno, "empty-cell", f"empty required cell {col!r}")
            continue

        if name in names:
            warn(lineno, "duplicate-name", f"name {name!r} already used on line {names[name]}")
        names.setdefault(name, lineno)

        if area not in AREAS:
            error(lineno, "bad-area", f"unknown area {row['area']!r}")
            continue
        if typ not in TYPE_REGISTERS:
            error(lineno, "bad-type", f"unknown type {row['type']!r}")
            continue
        address = parse_int(row["address"])
        if address is None:
            error(lineno, "bad-address", f"invalid address {row['address']!r}")
            continue
        if area in BIT_AREAS and typ != "bool":
            error(lineno, "type-area", f"area {area!r} only holds bool values")
            continue

        bit = row.get("bit", "")
        if typ == "bool" and area not in BIT_AREAS:
            if not bit:
                error(lineno, "missing-bit", "bool in a register area needs a 'bit' (0-15)")
            elif not int_in(0, 15)(bit):
                error(lineno, "bad-bit", f"invalid bit {bit!r}")
        elif bit:
            warn(lineno, "unused-bit", "'bit' is only used for bool in input/holding; ignored")

        count = TYPE_REGISTERS[typ]
        length = row.get("length", "")
        length_ok = True
        if typ == "string":
            if not length:
                error(lineno, "missing-length", "string needs a 'length' (registers)")
                length_ok = False
            elif not int_in(1, 65536)(length):
                error(lineno, "bad-length", f"invalid length {length!r}")
                length_ok = False
            else:
                count = int(length)
        count = max(count or 0, 1)

        wire = address - base
        if wire < 0:
            error(lineno, "address-range", f"address {address} is below @address_base={base}")
        elif length_ok and wire + count > 65536:
            error(lineno, "address-range", "value goes beyond address 65535")

        access = (row.get("access") or "R").upper()
        if access not in ACCESS_BY_AREA[area]:
            error(lineno, "bad-access", f"access {access!r} is not allowed for area {area!r}")

        order = row.get("byte_order", "").upper()
        if order and order not in BYTE_ORDERS:
            error(lineno, "bad-byte-order", f"invalid byte_order {row['byte_order']!r}")

        for col in ("scale", "offset"):
            if row.get(col) and not is_number(row[col]):
                error(lineno, "bad-number", f"{col} is not a number: {row[col]!r}")

        enum = row.get("enum", "")
        if enum.startswith("@"):
            if f"enum_{enum[1:]}" not in meta:
                error(lineno, "unknown-enum", f"no table @enum_{enum[1:]} for {enum!r}")
        elif enum and not valid_enum(enum):
            error(lineno, "bad-enum", f"malformed enum {enum!r} (expected 0=Off|1=On)")

        # Rows with errors are left out of the overlap check. Bits of the same
        # register (bool + bit) are meant to share it.
        row_ok = sum(d.severity == "error" for d in out) == errors_before
        if row_ok and not (typ == "bool" and area not in BIT_AREAS):
            spans.append((area, wire, wire + count, lineno, name))

    spans.sort()
    for i, (a2, s2, _e2, l2, n2) in enumerate(spans):
        for a1, _s1, e1, l1, n1 in reversed(spans[:i]):
            if a1 == a2 and s2 < e1:
                warn(l2, "overlap", f"{n2!r} overlaps {n1!r} (line {l1})")
                break

    return out


def check_file(path: Path) -> list[Diagnostic]:
    try:
        text = path.read_bytes().decode("utf-8")
    except UnicodeDecodeError:
        return [Diagnostic("error", None, "not-utf8", "file is not valid UTF-8")]
    return check_text(text)


def check_location(path: Path) -> list[Diagnostic]:
    """Files in maps/ must live at maps/<vendor>/<model>.mbmap with lowercase slugs."""
    parts = path.as_posix().split("/")
    if "maps" not in parts:
        return []
    rel = parts[parts.index("maps") + 1:]
    if len(rel) == 2 and all(SLUG_RE.match(p) for p in (rel[0], rel[1].removesuffix(".mbmap"))):
        return []
    return [Diagnostic("error", None, "bad-location",
                       "maps must be at maps/<vendor-slug>/<model-slug>.mbmap (lowercase, a-z 0-9 -)")]


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
        diags = check_file(f) + check_location(f)
        diags.sort(key=lambda d: (d.line or 0, d.severity))
        for d in diags:
            where = f"{f}:{d.line}" if d.line else str(f)
            print(f"{d.severity}: {where}: {d.message} [{d.code}]")
        errors += sum(d.severity == "error" for d in diags)
        warnings += sum(d.severity == "warning" for d in diags)

    print(f"\n{len(files)} file(s), {errors} error(s), {warnings} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
