#!/usr/bin/env python3
"""Ed25519 signing of the library index, so apps can check that what they download is the real library.

    python tools/sign/sign.py keygen <private-key-file>      # new key pair; prints the public key line
    python tools/sign/sign.py sign <file>                    # writes <file>.sig; key from MBMAP_SIGNING_KEY
    python tools/sign/sign.py verify <file> [--maps]         # check <file>.sig against signing/mbmap-library.pub

The private key is 32 random bytes in base64 (a file path, or the text itself in MBMAP_SIGNING_KEY).
The public key is one line, `ed25519 <base64>`, in signing/mbmap-library.pub. A signature is the
64 raw bytes of Ed25519 over the exact bytes of the file, in base64, in <file>.sig.

index.json lists the sha256 of every map, so signing the index covers the maps too. With --maps,
verify also hashes every map the index lists. Apps do the same: verify index.json, then check
each downloaded map against its sha256 and refuse it on a mismatch.
"""

from __future__ import annotations

import argparse
import base64
import binascii
import hashlib
import json
import os
import sys
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

ROOT = Path(__file__).resolve().parents[2]
PUBLIC_KEY = ROOT / "signing" / "mbmap-library.pub"
RAW = dict(encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw)


def public_line(key: Ed25519PrivateKey) -> str:
    return "ed25519 " + base64.b64encode(key.public_key().public_bytes(**RAW)).decode() + "\n"


def load_private(source: str) -> Ed25519PrivateKey:
    """The key from a file path or, failing that, from the base64 text itself."""
    path = Path(source)
    text = path.read_text().strip() if path.is_file() else source.strip()
    try:
        return Ed25519PrivateKey.from_private_bytes(base64.b64decode(text, validate=True))
    except (binascii.Error, ValueError) as error:
        raise SystemExit(f"not a valid private key: {error}")


def load_public(path: Path = PUBLIC_KEY) -> Ed25519PublicKey:
    algorithm, _, data = path.read_text().strip().partition(" ")
    if algorithm != "ed25519":
        raise SystemExit(f"{path}: expected `ed25519 <base64>`")
    return Ed25519PublicKey.from_public_bytes(base64.b64decode(data, validate=True))


def sign_bytes(key: Ed25519PrivateKey, data: bytes) -> str:
    return base64.b64encode(key.sign(data)).decode() + "\n"


def signature_ok(public: Ed25519PublicKey, data: bytes, signature: str) -> bool:
    try:
        public.verify(base64.b64decode(signature.strip(), validate=True), data)
    except (InvalidSignature, binascii.Error, ValueError):
        return False
    return True


def map_errors(index_path: Path) -> list[str]:
    """Maps the index lists whose size or sha256 does not match the file."""
    errors = []
    for e in json.loads(index_path.read_text(encoding="utf-8"))["maps"]:
        path = ROOT / e["path"]
        data = path.read_bytes() if path.is_file() else None
        if data is None:
            errors.append(f"{e['path']}: missing")
        elif hashlib.sha256(data).hexdigest() != e.get("sha256"):
            errors.append(f"{e['path']}: sha256 does not match the index")
        elif len(data) != e.get("size"):
            errors.append(f"{e['path']}: size does not match the index")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    keygen = sub.add_parser("keygen")
    keygen.add_argument("private_key_file", type=Path)
    sign = sub.add_parser("sign")
    sign.add_argument("file", type=Path)
    verify = sub.add_parser("verify")
    verify.add_argument("file", type=Path)
    verify.add_argument("--maps", action="store_true", help="also check the sha256 of every map in the index")
    args = parser.parse_args()

    if args.command == "keygen":
        if args.private_key_file.exists():
            raise SystemExit(f"{args.private_key_file} exists; not overwriting")
        key = Ed25519PrivateKey.generate()
        seed = key.private_bytes(
            serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption())
        fd = os.open(args.private_key_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(base64.b64encode(seed).decode() + "\n")
        print(f"private key written to {args.private_key_file}; keep it secret and back it up")
        print(f"public key (signing/mbmap-library.pub):\n{public_line(key)}", end="")
        return 0

    if args.command == "sign":
        source = os.environ.get("MBMAP_SIGNING_KEY")
        if not source:
            raise SystemExit("set MBMAP_SIGNING_KEY to the private key file or its base64 text")
        sig = args.file.with_name(args.file.name + ".sig")
        sig.write_text(sign_bytes(load_private(source), args.file.read_bytes()))
        print(f"signed {args.file} -> {sig}")
        return 0

    sig = args.file.with_name(args.file.name + ".sig")
    if not sig.is_file() or not signature_ok(load_public(), args.file.read_bytes(), sig.read_text()):
        print(f"{args.file}: signature missing or invalid")
        return 1
    errors = map_errors(args.file) if args.maps else []
    for error in errors:
        print(error)
    if errors:
        return 1
    print(f"{args.file}: signature ok" + (", maps match the index" if args.maps else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
