import os
import sys
import hashlib
import json
import sqlite3
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / 'backend'))

def generate_blake2b_hash(payload):
    """Replicates the logic in EvidenceLog.generate_integrity_hash"""
    data = json.dumps(payload, sort_keys=True).encode()
    return hashlib.blake2b(data).hexdigest()

def verify_evidence_vault():
    print("--- ReadyRent Forensic Evidence Audit ---")
    
    db_path = BASE_DIR / 'db.sqlite3'
    if not db_path.exists():
        print(f"Error: Database not found at {db_path}")
        return

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='disputes_evidencelog';")
        if not cursor.fetchone():
            print("Notice: 'disputes_evidencelog' table not found. Vault is currently empty.")
            return

        # Fetch all logs ordered by ID (Creation order)
        cursor.execute("SELECT * FROM disputes_evidencelog ORDER BY id ASC")
        logs = cursor.fetchall()
        
        if not logs:
            print("Vault Status: Empty. Integrity verified (by default).")
            return

        print(f"Auditing {len(logs)} evidence records...")
        
        previous_hash = None
        for i, log in enumerate(logs):
            # 1. Payload construction (matching models.py)
            payload = {
                "action": log['action'],
                "actor": log['actor_id'],
                "booking": log['booking_id'],
                "dispute": log['dispute_id'],
                "metadata": json.loads(log['metadata']),
                "previous_hash": log['previous_hash']
            }
            
            # 2. Calculated vs Stored Hash
            calculated_hash = generate_blake2b_hash(payload)
            stored_hash = log['hash']
            
            if calculated_hash != stored_hash:
                print(f"CRITICAL FAILURE: Tampering detected at Log ID {log['id']}!")
                print(f"  Stored: {stored_hash}")
                print(f"  Calculated: {calculated_hash}")
                return False

            # 3. Chain verification
            if log['previous_hash'] != previous_hash:
                print(f"CHAIN BREAK: Link broken between Log {log['id']-1 if i > 0 else 'Initial'} and {log['id']}!")
                print(f"  Expected Prev Hash: {previous_hash}")
                print(f"  Actual Prev Hash: {log['previous_hash']}")
                return False
                
            previous_hash = stored_hash
            
        print("RESULT: All EvidenceLog entries are Cryptographically Valid. WORM Integrity Preserved.")
        return True

    except Exception as e:
        print(f"Audit Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    verify_evidence_vault()
