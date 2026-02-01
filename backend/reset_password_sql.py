import sqlite3
import os
import hashlib
import binascii
from django.contrib.auth.hashers import PBKDF2PasswordHasher

# We will use Django's hasher to generate a valid hash, then insert it manually
# This avoids the "no such table" error from the ORM level if it's a config issue

# Manually mimicking Django's default hasher (PBKDF2)
# Or better, just import the hasher if possible without full setup
# But full setup failed. 
# Let's try to do a minimal setup just for hashing

import django
from django.conf import settings

# Minimal settings configuration
if not settings.configured:
    settings.configure(
        SECRET_KEY='temporary_secret_key_for_hashing',
        PASSWORD_HASHERS=['django.contrib.auth.hashers.PBKDF2PasswordHasher'],
    )

hasher = PBKDF2PasswordHasher()
password = 'admin123'
salt = hasher.salt()
encoded = hasher.encode(password, salt)

print(f"Generated hash: {encoded}")

db_path = os.path.join(os.getcwd(), 'backend', 'db.sqlite3')
print(f"Connecting to database at: {db_path}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Update the password for user with ID 1 (admin)
    # The table name is 'users_user' based on previous discovery
    cursor.execute("UPDATE users_user SET password = ? WHERE id = 1", (encoded,))
    conn.commit()
    
    if cursor.rowcount > 0:
        print("SUCCESS: Password updated manually via SQL.")
    else:
        print("ERROR: No user found with ID 1.")
        
    conn.close()

except Exception as e:
    print(f"SQL Execution failed: {e}")
