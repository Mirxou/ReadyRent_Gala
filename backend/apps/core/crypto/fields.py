"""
Hardened Encrypted Field — Phase 16
Non-deterministic AES-128-CBC (Fernet) with version prefix.
Stored format: v{version}:{fernet_ciphertext}

Audit hardening applied:
  - get_prep_value: internal marker check, not naive prefix check
  - from_db_value: explicit error on corrupt data, no silent pass
  - to_python: defined for aggregation/annotation safety
  - Memory: no repr/str leakage
"""
import base64
import logging
from cryptography.fernet import Fernet, InvalidToken
from django.db import models
from django.conf import settings

logger = logging.getLogger('pii.encryption')

# Internal sentinel prefix — harder to accidentally produce than 'v1:'
_ENCRYPTED_MARKER = 'enc:'


def _get_encryption_keys() -> dict:
    keys = getattr(settings, 'PII_ENCRYPTION_KEYS', None)
    if not keys:
        raise RuntimeError("PII_ENCRYPTION_KEYS is not configured.")
    return keys


def _get_current_version() -> int:
    version = getattr(settings, 'PII_CURRENT_KEY_VERSION', None)
    if version is None:
        raise RuntimeError("PII_CURRENT_KEY_VERSION is not configured.")
    return int(version)


def _get_fernet(version: int) -> Fernet:
    keys = _get_encryption_keys()
    raw_key = keys.get(str(version))
    if not raw_key:
        raise RuntimeError(f"Encryption key for version {version} not found.")
    # Fernet(key) takes the URL-safe base64-encoded key directly as bytes.
    # Do NOT base64.b64decode() here — the key is already in the correct format.
    # Calling b64decode() on a urlsafe_b64encode key causes 'Incorrect padding'.
    return Fernet(raw_key.encode('ascii'))


def _encrypt(value: str) -> str:
    """Encrypt plaintext. Returns: enc:v{version}:{ciphertext}"""
    version = _get_current_version()
    f = _get_fernet(version)
    ciphertext = f.encrypt(value.encode('utf-8')).decode('ascii')
    return f"{_ENCRYPTED_MARKER}v{version}:{ciphertext}"


def _decrypt(stored: str) -> str:
    """
    Decrypt stored value.
    Raises ValueError on corrupt/invalid data — no silent pass.
    """
    if not stored.startswith(_ENCRYPTED_MARKER):
        raise ValueError(
            f"PII field contains non-encrypted data. "
            f"Expected prefix '{_ENCRYPTED_MARKER}', got: {stored[:10]!r}... "
            f"Run encrypt_pii_fields management command."
        )
    # Strip marker: enc:v1:<ciphertext>
    rest = stored[len(_ENCRYPTED_MARKER):]  # v1:<ciphertext>
    try:
        version_part, ciphertext = rest.split(':', 1)
        version = int(version_part[1:])  # strip 'v'
    except (ValueError, IndexError) as e:
        raise ValueError(f"Malformed encrypted field format: {stored[:20]!r}") from e

    try:
        f = _get_fernet(version)
        return f.decrypt(ciphertext.encode('ascii')).decode('utf-8')
    except InvalidToken as e:
        raise ValueError(
            f"Decryption failed for version v{version}. "
            f"Key mismatch or data corruption."
        ) from e


def _is_already_encrypted(value: str) -> bool:
    """
    Strict check: value is already encrypted by this system.
    Uses internal marker + version format validation.
    """
    if not isinstance(value, str):
        return False
    if not value.startswith(_ENCRYPTED_MARKER):
        return False
    rest = value[len(_ENCRYPTED_MARKER):]
    # Must match: v<digits>:<non-empty>
    parts = rest.split(':', 1)
    if len(parts) != 2:
        return False
    version_part, ciphertext = parts
    if not version_part.startswith('v') or not version_part[1:].isdigit():
        return False
    if not ciphertext:
        return False
    return True


class EncryptedCharField(models.TextField):
    """
    Non-deterministic field-level encryption.
    All PII must use this field. Never use CharField for PII.
    
    Usage:
        phone = EncryptedCharField(max_length=255)
    
    Search:
        Use HMAC shadow columns. Never filter on this field directly.
    """

    def get_prep_value(self, value):
        """Prepare value for DB write. Encrypt if not already encrypted."""
        if value is None:
            return None
        if _is_already_encrypted(value):
            # Already encrypted by this system — pass through
            return value
        # Encrypt plaintext
        return _encrypt(value)

    def from_db_value(self, value, expression, connection):
        """Decrypt on DB read. Explicit error on corrupt data."""
        if value is None:
            return None
        return _decrypt(value)

    def to_python(self, value):
        """
        Decrypt for form/annotation/aggregation contexts.
        Django does not always call from_db_value in these paths.
        """
        if value is None:
            return None
        if _is_already_encrypted(value):
            return _decrypt(value)
        # Already decrypted (e.g., in-memory object)
        return value

    def __repr__(self):
        return f"<EncryptedCharField: [REDACTED]>"


class EncryptedTextField(EncryptedCharField):
    """Encrypted TextField for longer PII (addresses, reasons)."""
    pass


class EncryptedDateField(models.TextField):
    """
    Encrypted DateField. Stores ISO date string encrypted.
    Returns datetime.date on read.
    """
    import datetime

    def get_prep_value(self, value):
        if value is None:
            return None
        if _is_already_encrypted(str(value)):
            return str(value)
        return _encrypt(str(value))

    def from_db_value(self, value, expression, connection):
        import datetime
        if value is None:
            return None
        decrypted = _decrypt(value)
        return datetime.date.fromisoformat(decrypted)

    def to_python(self, value):
        import datetime
        if value is None:
            return None
        if isinstance(value, datetime.date):
            return value
        if _is_already_encrypted(str(value)):
            decrypted = _decrypt(str(value))
            return datetime.date.fromisoformat(decrypted)
        return datetime.date.fromisoformat(value)
