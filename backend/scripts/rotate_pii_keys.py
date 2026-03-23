"""
Key rotation script — Phase 16 PII keys.
Generates NEW keys and writes to .env.new_keys for review.
Previous keys were exposed and must never be used again.
"""
import secrets
import base64

pii_hash_key = base64.b64encode(secrets.token_bytes(32)).decode()
ip_hash_key = base64.b64encode(secrets.token_bytes(32)).decode()
pii_enc_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()

output = (
    f"PII_HASH_KEY={pii_hash_key}\n"
    f"IP_HASH_KEY={ip_hash_key}\n"
    f"PII_ENCRYPTION_KEY_V1={pii_enc_key}\n"
    f"PII_CURRENT_KEY_VERSION=1\n"
)

with open('.env.new_keys', 'w') as f:
    f.write(output)

# Never print keys to stdout — write to file only
print("✅ New keys written to .env.new_keys")
print("⚠  Review .env.new_keys, then apply with:")
print("   copy .env.new_keys .env.pii_keys && type .env.pii_keys >> .env")
print("⚠  IMPORTANT: After rotation, re-run encrypt_pii_fields --force --batch=500")
print("   (Re-hash all email_hash values with the new PII_HASH_KEY)")
