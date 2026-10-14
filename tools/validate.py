#!/usr/bin/env python3
"""Validate map files: version 2 (.mbmap.json, SPEC-v2.md) and the
deprecated version 1 (.mbmap, SPEC.md).

Usage: python tools/validate.py [PATH ...]   (defaults to maps/ and examples/)

Exits with 1 if any file has errors. Warnings are printed but do not fail.
Standard library only.
"""

from __future__ import annotations

import csv
import json
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
    "name", "group", "area", "address", "type", "length", "scale", "scale_factor", "offset",
    "write_min", "write_max", "reference",
    "unit", "access", "byte_order", "bit", "bits", "enum", "description",
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


WEBSITE = re.compile(r"(https?://)?[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]+)?(/\S*)?")


def is_website(v: str) -> bool:
    return WEBSITE.fullmatch(v) is not None


META_RULES = {
    "mbmap": one_of("1"),
    "vendor_website": is_website,
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


def valid_reference(typ: str, bits: int | None, text: str, length: int | None) -> bool:
    """Whether `text` is a raw value that a row of this type can hold."""
    if bits is not None:
        n = parse_int(text)
        return n is not None and 0 <= n < (1 << bits)
    if typ == "bool":
        return text.lower() in {"0", "1", "true", "false"}
    if typ in SENTINEL_RANGES:
        n = parse_int(text)
        lo, hi = SENTINEL_RANGES[typ]
        return n is not None and lo <= n <= hi
    if typ in ("float32", "float64"):
        return is_number(text)
    if typ == "string":
        return length is None or len(text) <= 2 * length
    return False


def valid_enum(text: str) -> bool:
    for pair in text.split("|"):
        value, sep, label = pair.partition("=")
        if not sep or parse_int(value.strip()) is None or not label.strip():
            return False
    return True


@dataclass(frozen=True)
class Diagnostic:
    severity: str  # "error" | "warning"
    line: int | str | None  # line (version 1, or JSON syntax), JSON Pointer (version 2), or None
    code: str
    message: str


def describe(loc: int | str | None) -> str:
    if isinstance(loc, int):
        return f"line {loc}"
    return loc or "the file"


class Checker:
    def __init__(self) -> None:
        self.out: list[Diagnostic] = []

    def error(self, loc: int | str | None, code: str, msg: str) -> None:
        self.out.append(Diagnostic("error", loc, code, msg))

    def warn(self, loc: int | str | None, code: str, msg: str) -> None:
        self.out.append(Diagnostic("warning", loc, code, msg))

    def errors(self) -> int:
        return sum(d.severity == "error" for d in self.out)


# A row before the rules: where it is, and its cells as version 1 text.
Row = tuple[int | str, dict[str, str]]


def check_text(text: str) -> list[Diagnostic]:
    """All diagnostics for the contents of one map file, of either version."""
    ck = Checker()
    if text.startswith("﻿"):
        text = text[1:]
    # A version 2 file is a JSON object; a version 1 line never starts with '{'.
    read = read_v2 if text.lstrip().startswith("{") else read_v1
    parsed = read(text, ck)
    if parsed is not None:
        check_rows(ck, *parsed)
    return ck.out


def read_v1(text: str, ck: Checker) -> tuple[dict[str, str], list[Row]] | None:
    meta: dict[str, str] = {}
    header: list[str] | None = None
    sep = ","
    rows: list[Row] = []

    for lineno, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue

        if line.startswith("@"):
            if header is not None:
                ck.error(lineno, "meta-after-header", "metadata after the header")
                continue
            key, eq, value = line[1:].partition("=")
            key, value = key.strip(), value.strip()
            if not eq or not META_KEY_RE.match(key):
                ck.error(lineno, "malformed-meta", f"malformed metadata line: {line!r}")
            elif key in meta:
                ck.error(lineno, "duplicate-meta", f"duplicate metadata key @{key}")
            else:
                meta[key] = value
                rule = META_RULES.get(key)
                if key.startswith("sentinel_"):
                    if not valid_sentinels(key[len("sentinel_"):], value):
                        ck.error(lineno, "bad-sentinel", f"invalid sentinel table @{key}")
                elif key.startswith("enum_") and len(key) > 5:
                    if not valid_enum(value):
                        ck.error(lineno, "bad-enum", f"malformed table @{key} (expected 0=Off|1=On)")
                elif rule and not rule(value):
                    ck.error(lineno, "bad-meta-value", f"invalid value for @{key}: {value!r}")
            continue

        if header is None:
            # A file saved with ';' is not valid; say so instead of a bare missing-column.
            semicolon_hint = ";" in line and "," not in line
            header = [c.strip().lower() for c in next(csv.reader([line], delimiter=sep))]
            seen: set[str] = set()
            for col in header:
                if col in seen:
                    ck.error(lineno, "duplicate-column", f"duplicate column {col!r}")
                seen.add(col)
            for col in REQUIRED_COLUMNS:
                if col not in header:
                    hint = " (fields are separated by commas; this line uses ';')" if semicolon_hint else ""
                    ck.error(lineno, "missing-column", f"header is missing required column {col!r}{hint}")
            continue

        fields = [f.strip() for f in next(csv.reader([line], delimiter=sep))]
        if len(fields) > len(header):
            ck.error(lineno, "too-many-fields", f"row has {len(fields)} fields, header has {len(header)}")
            continue
        fields += [""] * (len(header) - len(fields))
        # With a duplicated column, the first occurrence wins.
        row: dict[str, str] = {}
        for col, val in zip(header, fields):
            row.setdefault(col, val)
        rows.append((lineno, row))

    for key in REQUIRED_META:
        if key not in meta:
            ck.error(None, "missing-meta", f"missing required metadata @{key}")
    if header is None:
        ck.error(None, "no-header", "no header line")
        return None
    for col in dict.fromkeys(header):
        if col not in KNOWN_COLUMNS and not col.startswith("x_"):
            ck.warn(None, "unknown-column", f"unknown column {col!r} (custom columns should start with 'x_')")
    if any(col not in header for col in REQUIRED_COLUMNS):
        return None
    return meta, rows


# ---- version 2 (JSON, SPEC-v2.md)

V2_ORDERS = {"big", "little"}
V2_TEXT_META = {"vendor", "model", "vendor_website", "description", "firmware", "source"}
V2_INT_META = {"unit_id", "port", "baudrate", "databits", "stopbits", "address_base",
               "max_read_registers", "max_read_bits"}
V2_EXACT = {"protocol": {"tcp", "rtu", "tcp+rtu"}, "parity": {"N", "E", "O"}}
V2_TEXT_COLS = {"name", "group", "unit", "description", "scale_factor", "comment"}
V2_INT_COLS = {"address", "length", "bit", "bits"}
V2_NUM_COLS = {"scale", "offset", "write_min", "write_max"}
V2_KNOWN_COLS = KNOWN_COLUMNS | {"word_order", "comment"}
JOIN_ORDER = {("big", "big"): "ABCD", ("little", "big"): "BADC",
              ("big", "little"): "CDAB", ("little", "little"): "DCBA"}
ENUM_NAME_RE = re.compile(r"^[a-z0-9_]+$")


class DuplicateKey(ValueError):
    pass


def no_duplicates(pairs: list[tuple[str, object]]) -> dict:
    out: dict = {}
    for key, value in pairs:
        if key in out:
            raise DuplicateKey(f"duplicate key {key!r}")
        out[key] = value
    return out


def child(pointer: str, key: object) -> str:
    return f"{pointer}/{str(key).replace('~', '~0').replace('/', '~1')}"


def json_kind(value: object) -> str:
    if value is None:
        return "null"
    return {bool: "a boolean", int: "a number", float: "a number", str: "a string",
            list: "an array", dict: "an object"}[type(value)]


def is_json_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def as_text(value: object) -> str:
    """A JSON scalar as version 1 cell text."""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def v2_table(ck: Checker, at: str, value: object, code: str, lo: int | None = None, hi: int | None = None) -> bool:
    if not isinstance(value, dict) or not value:
        ck.error(at, code, "expected a non-empty object of value -> label")
        return False
    seen: set[int] = set()
    for key, label in value.items():
        n = parse_int(key)
        if (n is None or n in seen or not isinstance(label, str) or not label.strip()
                or (lo is not None and not lo <= n <= hi)):
            ck.error(child(at, key), code, f"{key!r} is not a valid value with a label, or repeats a value")
            return False
        seen.add(n)
    return True


def read_v2(text: str, ck: Checker) -> tuple[dict[str, str], list[Row]] | None:
    try:
        doc = json.loads(text, object_pairs_hook=no_duplicates)
    except DuplicateKey as exc:
        ck.error(None, "not-json", f"not a valid JSON document: {exc}")
        return None
    except json.JSONDecodeError as exc:
        # Parsers place syntax errors differently, so the position is only in the message.
        ck.error(None, "not-json", f"not a valid JSON document: {exc.msg} (line {exc.lineno}, column {exc.colno})")
        return None
    if not isinstance(doc, dict):
        ck.error(None, "not-json", "the document is not a JSON object")
        return None

    def wrong_type(at: str, expected: str, value: object) -> None:
        ck.error(at, "bad-json-type", f"expected {expected}, found {json_kind(value)}")

    # Metadata in version 1 spelling, so check_rows applies the same rules.
    meta: dict[str, str] = {}
    order = {"byte_order": "big", "word_order": "big"}
    for key, value in doc.items():
        at = child("", key)
        if key == "$schema":
            continue
        if key == "mbmap":
            if value != 2 or isinstance(value, bool):
                ck.error(at, "bad-meta-value", f"this validator supports mbmap 2, found {value!r}")
            meta[key] = "2"
        elif key in V2_TEXT_META or key in V2_EXACT:
            if not isinstance(value, str):
                wrong_type(at, "a string", value)
                continue
            meta[key] = value
            rule = META_RULES.get(key)
            if (key in V2_EXACT and value not in V2_EXACT[key]) or (rule and not rule(value)):
                ck.error(at, "bad-meta-value", f"invalid value for {key}: {value!r}")
        elif key in V2_INT_META:
            if not (isinstance(value, str) or is_json_number(value)):
                wrong_type(at, "an integer", value)
                continue
            meta[key] = as_text(value)
            if not META_RULES[key](meta[key]):
                ck.error(at, "bad-meta-value", f"invalid value for {key}: {value!r}")
        elif key in order:
            if not isinstance(value, str):
                wrong_type(at, "a string", value)
            elif value not in V2_ORDERS:
                ck.error(at, "bad-meta-value", f'{key} must be "big" or "little", not {value!r}')
            else:
                order[key] = value
        elif key == "enums":
            if not isinstance(value, dict):
                wrong_type(at, "an object", value)
                continue
            for name, table in value.items():
                if not ENUM_NAME_RE.match(name):
                    ck.error(child(at, name), "bad-enum", f"invalid enum name {name!r} (a-z, 0-9, _)")
                v2_table(ck, child(at, name), table, "bad-enum")
                meta[f"enum_{name}"] = "(table)"  # defined, so rows using it are not reported twice
        elif key == "sentinels":
            if not isinstance(value, dict):
                wrong_type(at, "an object", value)
                continue
            for type_name, table in value.items():
                lo, hi = SENTINEL_RANGES.get(type_name, (None, None))
                if lo is None:
                    ck.error(child(at, type_name), "bad-sentinel", f"no sentinels for type {type_name!r}")
                else:
                    v2_table(ck, child(at, type_name), table, "bad-sentinel", lo, hi)
        elif key == "notes":
            if not isinstance(value, list) or not all(isinstance(n, str) for n in value):
                wrong_type(at, "an array of strings", value)
        elif key == "registers":
            if not isinstance(value, list):
                wrong_type(at, "an array", value)
        else:
            meta[key] = as_text(value)  # x_ and unknown keys
    meta["byte_order"] = JOIN_ORDER[order["byte_order"], order["word_order"]]

    for key in ("mbmap", "vendor", "model", "registers"):
        if key not in doc:
            ck.error(None, "missing-meta", f"missing required key {key!r}")
    registers = doc.get("registers")
    if not isinstance(registers, list):
        return None

    warned: set[str] = set()
    rows: list[Row] = []
    for i, reg in enumerate(registers):
        at = f"/registers/{i}"
        if not isinstance(reg, dict):
            wrong_type(at, "an object", reg)
            continue
        row: dict[str, str] = {}
        reg_order: dict[str, str] = {}
        for key, value in reg.items():
            here = child(at, key)
            if key in V2_TEXT_COLS:
                if isinstance(value, str):
                    row[key] = value
                else:
                    wrong_type(here, "a string", value)
            elif key in ("area", "type", "access"):
                if not isinstance(value, str):
                    wrong_type(here, "a string", value)
                    continue
                exact = value.upper() if key == "access" else value.lower()
                if value != exact:
                    code = {"area": "bad-area", "type": "bad-type", "access": "bad-access"}[key]
                    ck.error(here, code, f"{key} {value!r} must be written {exact!r}")
                row[key] = value
            elif key in V2_INT_COLS:
                if isinstance(value, str) or is_json_number(value):
                    row[key] = as_text(value)
                else:
                    wrong_type(here, "an integer", value)
            elif key in V2_NUM_COLS:
                if is_json_number(value):
                    row[key] = as_text(value)
                else:
                    wrong_type(here, "a number", value)
            elif key == "reference":
                if isinstance(value, (str, bool)) or is_json_number(value):
                    row[key] = as_text(value)
                else:
                    wrong_type(here, "a number, boolean or string", value)
            elif key in ("byte_order", "word_order"):
                if not isinstance(value, str):
                    wrong_type(here, "a string", value)
                elif value not in V2_ORDERS:
                    ck.error(here, "bad-byte-order", f'{key} must be "big" or "little", not {value!r}')
                else:
                    reg_order[key] = value
            elif key == "enum":
                if isinstance(value, str):
                    row[key] = f"@{value}"
                elif isinstance(value, dict):
                    v2_table(ck, here, value, "bad-enum")
                else:
                    wrong_type(here, "a table name or an object", value)
            else:
                if not key.startswith("x_") and key not in warned:
                    warned.add(key)
                    ck.warn(here, "unknown-column", f"unknown key {key!r} (custom keys should start with 'x_')")
                row[key] = as_text(value)
        if reg_order:
            row["byte_order"] = JOIN_ORDER[
                reg_order.get("byte_order", order["byte_order"]),
                reg_order.get("word_order", order["word_order"]),
            ]
        rows.append((at, row))
    return meta, rows


# ---- rules shared by both versions

def check_rows(ck: Checker, meta: dict[str, str], rows: list[Row]) -> None:
    if not rows:
        ck.warn(None, "no-rows", "no register rows")

    base = 1 if meta.get("address_base") == "1" else 0
    names: dict[str, int | str] = {}
    spans: list[tuple[str, int, int, int, str]] = []  # area, start, end, row index, name
    locs: list[int | str] = [loc for loc, _ in rows]
    valid: dict[str, tuple[str, bool, str]] = {}  # name -> type, bit field, scale_factor
    scaled: list[tuple[int | str, str, str]] = []  # location, type, scale_factor

    for index, (lineno, row) in enumerate(rows):
        get = lambda col: row.get(col, "")  # noqa: E731
        name, area, typ = get("name"), get("area").lower(), get("type").lower()
        errors_before = ck.errors()

        empty = [c for c in REQUIRED_COLUMNS if not get(c)]
        if empty:
            for col in empty:
                ck.error(lineno, "empty-cell", f"empty required cell {col!r}")
            continue

        if name in names:
            ck.warn(lineno, "duplicate-name", f"name {name!r} already used at {describe(names[name])}")
        names.setdefault(name, lineno)

        if area not in AREAS:
            ck.error(lineno, "bad-area", f"unknown area {row['area']!r}")
            continue
        if typ not in TYPE_REGISTERS:
            ck.error(lineno, "bad-type", f"unknown type {row['type']!r}")
            continue
        address = parse_int(row["address"])
        if address is None:
            ck.error(lineno, "bad-address", f"invalid address {row['address']!r}")
            continue
        if area in BIT_AREAS and typ != "bool":
            ck.error(lineno, "type-area", f"area {area!r} only holds bool values")
            continue

        bit = get("bit")
        bits = get("bits")
        bitfield = False
        if bits:
            if not int_in(1, 16)(bits) or typ != "uint16" or area in BIT_AREAS or not bit:
                ck.error(lineno, "bad-bits", f"invalid bit field: bits={bits!r}")
            elif not int_in(0, 15)(bit):
                ck.error(lineno, "bad-bit", f"invalid bit {bit!r}")
            elif int(bit) + int(bits) > 16:
                ck.error(lineno, "bad-bits", f"bit {bit} + bits {bits} exceeds 16")
            else:
                bitfield = True
        elif typ == "bool" and area not in BIT_AREAS:
            if not bit:
                ck.error(lineno, "missing-bit", "bool in a register area needs a 'bit' (0-15)")
            elif not int_in(0, 15)(bit):
                ck.error(lineno, "bad-bit", f"invalid bit {bit!r}")
        elif bit:
            ck.warn(lineno, "unused-bit", "'bit' is only used for bool in input/holding; ignored")

        count = TYPE_REGISTERS[typ]
        length = get("length")
        length_ok = True
        if typ == "string":
            if not length:
                ck.error(lineno, "missing-length", "string needs a 'length' (registers)")
                length_ok = False
            elif not int_in(1, 65536)(length):
                ck.error(lineno, "bad-length", f"invalid length {length!r}")
                length_ok = False
            else:
                count = int(length)
        count = max(count or 0, 1)

        wire = address - base
        if wire < 0:
            ck.error(lineno, "address-range", f"address {address} is below address_base={base}")
        elif length_ok and wire + count > 65536:
            ck.error(lineno, "address-range", "value goes beyond address 65535")

        access = (get("access") or "R").upper()
        if access not in ACCESS_BY_AREA[area]:
            ck.error(lineno, "bad-access", f"access {access!r} is not allowed for area {area!r}")

        order = get("byte_order").upper()
        if order and order not in BYTE_ORDERS:
            ck.error(lineno, "bad-byte-order", f"invalid byte_order {row['byte_order']!r}")

        for col in ("scale", "offset", "write_min", "write_max"):
            if get(col) and not is_number(row[col]):
                ck.error(lineno, "bad-number", f"{col} is not a number: {row[col]!r}")

        lo, hi = get("write_min"), get("write_max")
        if lo and hi and is_number(lo) and is_number(hi) and float(lo) > float(hi):
            ck.error(lineno, "bad-write-limit", f"write_min {lo} is greater than write_max {hi}")
        if (lo or hi) and (typ in ("bool", "string") or access == "R"):
            ck.warn(lineno, "unused-write-limit", "write_min/write_max have no effect on this row")

        ref = get("reference")
        if ref:
            if access == "W":
                ck.error(lineno, "bad-reference", "reference on a row that cannot be read")
            elif not valid_reference(typ, int(bits) if bitfield else None, ref, int(length) if typ == "string" and length_ok and length else None):
                ck.error(lineno, "bad-reference", f"invalid reference {ref!r} for type {typ}")

        enum = get("enum")
        if enum.startswith("@"):
            if f"enum_{enum[1:]}" not in meta:
                ck.error(lineno, "unknown-enum", f"no enum table named {enum[1:]!r}")
        elif enum and not valid_enum(enum):
            ck.error(lineno, "bad-enum", f"malformed enum {enum!r} (expected 0=Off|1=On)")

        # Rows with errors are left out of the overlap check. Bits of the same
        # register (bool + bit) are meant to share it.
        row_ok = ck.errors() == errors_before
        if row_ok and not (typ == "bool" and area not in BIT_AREAS) and not bitfield:
            spans.append((area, wire, wire + count, index, name))
        if row_ok:
            sf = get("scale_factor")
            valid.setdefault(name, (typ, bitfield, sf))
            if sf:
                scaled.append((lineno, typ, sf))

    # A scale factor names an integer register of the file that does not
    # itself depend on a scale factor.
    for lineno, typ, sf in scaled:
        if sf not in valid:
            ck.error(lineno, "unknown-scale-factor", f"no register named {sf!r} for the scale factor")
            continue
        sf_type, sf_bitfield, sf_sf = valid[sf]
        if typ in ("bool", "string"):
            ck.error(lineno, "bad-scale-factor", f"{typ} values cannot have a scale factor")
        elif sf_type in ("bool", "string", "float32", "float64") or sf_bitfield:
            ck.error(lineno, "bad-scale-factor", f"scale factor {sf!r} must be a whole integer register")
        elif sf_sf:
            ck.error(lineno, "bad-scale-factor", f"scale factor {sf!r} has a scale factor itself")

    spans.sort()
    for i, (a2, s2, _e2, i2, n2) in enumerate(spans):
        for a1, s1, e1, i1, n1 in reversed(spans[:i]):
            # Rows that start at the same address are alternative readings
            # of the same data, not an overlap.
            if a1 == a2 and s1 != s2 and s2 < e1:
                ck.warn(locs[i2], "overlap", f"{n2!r} overlaps {n1!r} ({describe(locs[i1])})")
                break


def check_file(path: Path) -> list[Diagnostic]:
    try:
        text = path.read_bytes().decode("utf-8")
    except UnicodeDecodeError:
        return [Diagnostic("error", None, "not-utf8", "file is not valid UTF-8")]
    return check_text(text)


def check_location(path: Path) -> list[Diagnostic]:
    """Files in maps/ must live at maps/<vendor>/<model>.mbmap.json with lowercase slugs."""
    parts = path.as_posix().split("/")
    if "maps" not in parts:
        return []
    rel = parts[parts.index("maps") + 1:]
    if len(rel) == 2 and rel[1].endswith(".mbmap.json") and all(
            SLUG_RE.match(p) for p in (rel[0], rel[1].removesuffix(".mbmap.json"))):
        return []
    return [Diagnostic("error", None, "bad-location",
                       "maps must be at maps/<vendor-slug>/<model-slug>.mbmap.json (lowercase, a-z 0-9 -)")]


def main(argv: list[str]) -> int:
    targets = [Path(a) for a in argv] or [Path("maps"), Path("examples")]
    files: list[Path] = []
    for t in targets:
        if t.is_dir():
            files += sorted(f for f in t.rglob("*") if f.name.endswith((".mbmap", ".mbmap.json")))
        elif t.is_file():
            files.append(t)
        else:
            print(f"warning: {t} not found", file=sys.stderr)

    errors = warnings = 0
    for f in files:
        diags = check_file(f) + check_location(f)
        diags.sort(key=lambda d: (isinstance(d.line, str), d.line or 0, d.severity))
        for d in diags:
            where = f"{f}:{d.line}" if isinstance(d.line, int) else f"{f}#{d.line}" if d.line else str(f)
            print(f"{d.severity}: {where}: {d.message} [{d.code}]")
        errors += sum(d.severity == "error" for d in diags)
        warnings += sum(d.severity == "warning" for d in diags)

    print(f"\n{len(files)} file(s), {errors} error(s), {warnings} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
