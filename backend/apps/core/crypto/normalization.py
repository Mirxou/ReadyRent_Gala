"""
Centralized PII Normalization — Phase 16
All hash inputs MUST pass through these functions before HMAC computation.
Inconsistent normalization = hash mismatches = auth failures.

Canonicalization order for email (CRITICAL — must not change after 16B backfill):
  1. Strip Unicode Cf (format) characters — ZWS, ZWJ, ZWNJ, BOM, soft hyphen, etc.
  2. NFKC normalize — collapses fullwidth, ligatures, compatibility forms
  3. strip() — remove leading/trailing whitespace
  4. lower() — case-fold to ASCII lowercase

╔══════════════════════════════════════════════════════════════════════════════╗
║  ⚠  IMMUTABLE CONTRACT — DO NOT MODIFY ORDER AFTER 16B BACKFILL  ⚠         ║
║                                                                              ║
║  After Phase 16B (encrypt_pii_fields backfill), the canonicalization         ║
║  pipeline is FROZEN. Any change to the order, steps, or logic will:          ║
║                                                                              ║
║    • Break login for ALL existing users (hash mismatch)                      ║
║    • Invalidate email_hash uniqueness (duplicate accounts possible)           ║
║    • Break get_by_natural_key() lookups (auth failure)                       ║
║    • Corrupt referential integrity (hash ≠ stored plaintext canonical form)  ║
║                                                                              ║
║  To change canonicalization after 16B:                                       ║
║    1. Create a new key version (PII_HASH_KEY_V2)                             ║
║    2. Write a migration command to re-hash all rows with the new pipeline     ║
║    3. Deploy atomically with a feature flag                                  ║
║    4. Never delete old hashes until re-hash is 100% verified                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
import unicodedata
import re


def _strip_invisible_chars(value: str) -> str:
    """
    Remove all Unicode category Cf (format) characters.
    These are invisible characters that have no visual representation
    but produce different byte sequences — a source of identity ambiguity.

    Cf includes:
      U+200B  ZERO WIDTH SPACE
      U+200C  ZERO WIDTH NON-JOINER
      U+200D  ZERO WIDTH JOINER
      U+200E  LEFT-TO-RIGHT MARK
      U+200F  RIGHT-TO-LEFT MARK
      U+FEFF  ZERO WIDTH NO-BREAK SPACE (BOM)
      U+00AD  SOFT HYPHEN
      U+2060  WORD JOINER
      U+2061..U+2064  INVISIBLE OPERATORS
      U+FFF9..U+FFFB  INTERLINEAR ANNOTATION
      ... and all others in category Cf

    This is input sanitization, not normalization.
    Unicode confusables are NOT distinct identities.
    """
    return ''.join(ch for ch in value if unicodedata.category(ch) != 'Cf')


def normalize_email(value: str) -> str:
    """
    Canonical email normalization for HMAC shadow hashing.

    Pipeline (order is fixed — do not reorder after 16B backfill):
      1. Strip Cf characters (ZWS, ZWJ, BOM, invisible format chars)
      2. NFKC normalize (fullwidth → ASCII, ligatures → base chars)
      3. strip() whitespace
      4. lower()

    Result: user@example.com, USER@EXAMPLE.COM, user​@example.com (ZWS),
            ｕｓｅｒ@example.com (fullwidth) → all produce identical hash.
    """
    if not value:
        return value
    value = _strip_invisible_chars(value)   # Step 1: remove Cf chars
    value = unicodedata.normalize('NFKC', value)  # Step 2: NFKC
    value = value.strip().lower()           # Step 3+4: whitespace + case
    return value


def normalize_phone(value: str) -> str:
    """
    Normalize phone number for HMAC hashing.
    - Strip Cf characters
    - NFKC normalize
    - Remove +, -, (, ), spaces
    """
    if not value:
        return value
    value = _strip_invisible_chars(value)
    value = unicodedata.normalize('NFKC', value)
    value = re.sub(r'[\s\+\-\(\)]', '', value)
    return value


def normalize_ip(value: str) -> str:
    """
    Normalize IP address for HMAC hashing.
    - Strip whitespace only (IPs are already canonical)
    """
    if not value:
        return value
    return value.strip()
