"""
HMAC-SHA256 Shadow Column Hashing — Phase 16
Used for searchable shadow columns. Never use raw SHA-256 for PII.
"""
import hmac
import hashlib
import base64
from django.conf import settings


def compute_pii_hash(value: str, key: bytes) -> str:
    """
    Compute HMAC-SHA256 of a normalized PII value.
    
    Args:
        value: Already-normalized plaintext value.
        key: Secret HMAC key bytes (from PII_HASH_KEY or IP_HASH_KEY).
    
    Returns:
        Base64-encoded HMAC digest (64 chars).
    
    Security:
        - HMAC prevents rainbow table attacks on small PII spaces (phone, email).
        - Key must be kept secret. Compromise = all shadow hashes must be rotated.
    """
    if not value:
        return ''
    digest = hmac.new(key, value.encode('utf-8'), hashlib.sha256).digest()
    return base64.b64encode(digest).decode('ascii')


def get_pii_hash_key() -> bytes:
    """Load PII HMAC key from settings."""
    key = getattr(settings, 'PII_HASH_KEY', None)
    if not key:
        raise RuntimeError("PII_HASH_KEY is not configured. Cannot compute PII hash.")
    return base64.b64decode(key)


def get_ip_hash_key() -> bytes:
    """Load IP HMAC key from settings (isolated from PII key)."""
    key = getattr(settings, 'IP_HASH_KEY', None)
    if not key:
        raise RuntimeError("IP_HASH_KEY is not configured. Cannot compute IP hash.")
    return base64.b64decode(key)
