-- Phase 16C.4b Final Burn SQL
-- Step 1: Verify ciphertext completeness
SELECT COUNT(*) AS "email_not_encrypted" FROM users_user WHERE email IS NULL OR email NOT LIKE 'enc:v%';

-- Step 2: Verify backup column contamination
SELECT COUNT(*) AS "backup_is_enc" FROM users_user WHERE email_plaintext_backup IS NOT NULL AND email_plaintext_backup LIKE 'enc:%';

-- Step 3: Wipe plaintext
UPDATE users_user SET email_plaintext_backup = NULL WHERE email_plaintext_backup IS NOT NULL;

-- Step 4: Verify wipe complete
SELECT COUNT(*) AS "remaining_plaintext" FROM users_user WHERE email_plaintext_backup IS NOT NULL;
