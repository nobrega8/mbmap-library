#!/usr/bin/env python3
"""Check that changed maps increase their revision (SPEC.md 3.1).

Usage: python tools/check_revisions.py BASE   (a commit, e.g. origin/main)

For every map in maps/ that differs from BASE:
- a new map needs a "revision";
- a map whose content changed in a way that affects how a device is read or
  written needs a higher "revision" than in BASE;
- a revision never goes down.

Free text (description, notes, comment, source, sources), the revision date
and tool-specific x_ keys may change without a new revision.
Standard library only; needs git.
"""

from __future__ import annotations

import json
import subprocess
import sys

FREE_TEXT_TOP = {"$schema", "description", "notes", "source", "sources", "revision", "revised"}
FREE_TEXT_REGISTER = {"description", "comment"}


def content(doc: dict) -> dict:
    """The part of a map that affects how a device is read or written."""
    out = {k: v for k, v in doc.items() if k not in FREE_TEXT_TOP and not k.startswith("x_")}
    out["registers"] = [
        {k: v for k, v in reg.items() if k not in FREE_TEXT_REGISTER and not k.startswith("x_")}
        if isinstance(reg, dict) else reg
        for reg in doc.get("registers", [])
    ]
    return out


def problems(old: dict | None, new: dict) -> list[str]:
    """What is wrong with the revision of `new`, given the map in the base."""
    rev = new.get("revision")
    if old is None:
        return [] if isinstance(rev, int) else ['a new map needs "revision": 1']
    old_rev = old.get("revision")
    if isinstance(old_rev, int) and isinstance(rev, int) and rev < old_rev:
        return [f"revision went down from {old_rev} to {rev}"]
    if content(old) == content(new):
        return []
    if not isinstance(rev, int):
        return ['the map changed: add "revision"']
    if isinstance(old_rev, int) and rev <= old_rev:
        return [f"the map changed: increase revision to {old_rev + 1} (and set revised)"]
    return []


def git(*args: str) -> str:
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True,
                          encoding="utf-8").stdout


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print(__doc__)
        return 2
    base = argv[0]
    changed = git("diff", "--name-only", "--diff-filter=AMR", "--no-renames", base, "--", "maps").split()
    failures = 0
    for path in changed:
        if not path.endswith(".mbmap.json"):
            continue
        try:
            new = json.loads(open(path, encoding="utf-8-sig").read())
        except (OSError, ValueError):
            continue  # validate.py reports files that cannot be read
        try:
            old = json.loads(git("show", f"{base}:{path}").lstrip("﻿"))
        except subprocess.CalledProcessError:
            old = None  # not in the base: a new map
        except ValueError:
            old = {}
        for problem in problems(old, new):
            print(f"error: {path}: {problem}")
            failures += 1
    print(f"\n{len(changed)} changed map(s), {failures} revision problem(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
