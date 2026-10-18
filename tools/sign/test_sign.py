#!/usr/bin/env python3
"""Tests for sign.py: round trip, tampering, wrong key, malformed signature."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import sign  # noqa: E402
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey  # noqa: E402


class SignTests(unittest.TestCase):
    def setUp(self):
        self.key = Ed25519PrivateKey.generate()
        self.public = self.key.public_key()
        self.data = b'{"mbmap_index": 1}\n'

    def test_round_trip(self):
        self.assertTrue(sign.signature_ok(self.public, self.data, sign.sign_bytes(self.key, self.data)))

    def test_tampered_data_fails(self):
        signature = sign.sign_bytes(self.key, self.data)
        self.assertFalse(sign.signature_ok(self.public, self.data + b" ", signature))

    def test_other_key_fails(self):
        signature = sign.sign_bytes(Ed25519PrivateKey.generate(), self.data)
        self.assertFalse(sign.signature_ok(self.public, self.data, signature))

    def test_malformed_signature_fails(self):
        for bad in ("", "not base64!", "AAAA"):
            self.assertFalse(sign.signature_ok(self.public, self.data, bad))

    def test_public_line_loads(self):
        import tempfile
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "key.pub"
            path.write_text(sign.public_line(self.key))
            self.assertTrue(sign.signature_ok(sign.load_public(path), self.data, sign.sign_bytes(self.key, self.data)))


if __name__ == "__main__":
    unittest.main()
