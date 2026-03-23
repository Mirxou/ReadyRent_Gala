import secrets
import base64

pii_hash_key = base64.b64encode(secrets.token_bytes(32)).decode()
ip_hash_key = base64.b64encode(secrets.token_bytes(32)).decode()
pii_enc_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()

# Write to .env.pii_keys file for manual addition to .env
with open('.env.pii_keys', 'w') as f:
    f.write(f"PII_HASH_KEY={pii_hash_key}\n")
    f.write(f"IP_HASH_KEY={ip_hash_key}\n")
    f.write(f"PII_ENCRYPTION_KEY_V1={pii_enc_key}\n")
    f.write("PII_CURRENT_KEY_VERSION=1\n")

print("Keys written to .env.pii_keys")
print(f"PII_HASH_KEY={pii_hash_key}")
print(f"IP_HASH_KEY={ip_hash_key}")
print(f"PII_ENCRYPTION_KEY_V1={pii_enc_key}")
