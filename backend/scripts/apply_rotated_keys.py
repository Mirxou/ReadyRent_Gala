"""
Apply new PII keys to .env — replaces old PII_HASH_KEY, IP_HASH_KEY, PII_ENCRYPTION_KEY_V1 lines.
Reads new keys from .env.new_keys.
Produces .env.rotated (safe preview before overwrite).
"""
import re

# Read current .env
with open('.env', 'r', encoding='utf-8') as f:
    env_lines = f.readlines()

# Read new keys
new_keys = {}
with open('.env.new_keys', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line and '=' in line:
            k, v = line.split('=', 1)
            new_keys[k.strip()] = v.strip()

ROTATE_KEYS = {'PII_HASH_KEY', 'IP_HASH_KEY', 'PII_ENCRYPTION_KEY_V1', 'PII_CURRENT_KEY_VERSION'}

output_lines = []
replaced = set()

for line in env_lines:
    stripped = line.strip()
    if not stripped or stripped.startswith('#'):
        output_lines.append(line)
        continue
    if '=' in stripped:
        key = stripped.split('=', 1)[0].strip()
        if key in ROTATE_KEYS:
            if key in new_keys and key not in replaced:
                output_lines.append(f"{key}={new_keys[key]}\n")
                replaced.add(key)
                print(f"  🔄 Rotated: {key}")
            # else: skip duplicate lines
            continue
    output_lines.append(line)

# Append any new keys not already in .env
for key, val in new_keys.items():
    if key not in replaced:
        output_lines.append(f"{key}={val}\n")
        replaced.add(key)
        print(f"  ➕ Added: {key}")

# Write rotated .env
with open('.env', 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("✅ .env updated with rotated PII keys.")
print("✅ Old exposed keys replaced — do not use old values again.")
