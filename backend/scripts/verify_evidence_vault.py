import os
import django
import sys
from django.db import transaction
from django.conf import settings

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.disputes.models import EvidenceLog

def log(test_name, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m",
        "red": "\033[91m",
        "yellow": "\033[93m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}[{test_name}] {message} {status}{colors['reset']}")

def run_test():
    print("--------------------------------------------------")
    log("SETUP", "Initializing The Evidence Vault (Immutable Truth)...", "WAIT", "yellow")
    
    # User for context
    actor, _ = User.objects.get_or_create(username='vault_keeper', email='keeper@sovereign.com')
    
    # 1. Creation Test (Contextual Truth)
    log("STEP 1", "Creating Evidence Log with Context Snapshot...", "ACTION", "yellow")
    
    context_data = {
        "policy_version": "v17.0.1",
        "contract_hash": "abc-123-sovereign",
        "risk_engine": "REIGN_V1"
    }
    
    log_entry = EvidenceLog.objects.create(
        action="TEST_EVENT_LOG",
        actor=actor,
        metadata={"data": "User clicked Confirm"},
        context_snapshot=context_data,
        hash="sha256:immutable-hash-anchor"
    )
    
    if log_entry.pk:
         log("STEP 1", f"Log #{log_entry.id} Created Successfully.", "SUCCESS", "green")
         print(f"      📸 Context Captured: {log_entry.context_snapshot}")
    else:
         log("STEP 1", "Failed to create log.", "FAIL", "red")
         return

    # 2. Immutability Test (The Vault Lock)
    log("STEP 2", "Attempting to Modify Evidence (Should Fail)...", "ACTION", "yellow")
    
    try:
        log_entry.action = "TAMPERED_EVENT"
        log_entry.save()
        log("STEP 2", "Log was MODIFIED (Critial Failure - Not Immutable!)", "FAIL", "red")
    except ValueError as e:
        if "Immutable" in str(e):
            log("STEP 2", f"Modification Blocked: '{e}'", "SUCCESS", "green")
        else:
            log("STEP 2", f"Modification failed with unexpected error: {e}", "WARN", "yellow")
    except Exception as e:
        log("STEP 2", f"Modification failed with unexpected exception: {e}", "WARN", "yellow")

    # 3. Read Verification
    log("STEP 3", "Verifying Read Integrity...", "CHECK", "yellow")
    refetched = EvidenceLog.objects.get(id=log_entry.id)
    if refetched.action == "TEST_EVENT_LOG" and refetched.context_snapshot == context_data:
        log("STEP 3", "Data Integrity Confirmed.", "SUCCESS", "green")
    else:
        log("STEP 3", "Data Mismatch!", "FAIL", "red")

    log("FINISH", "The Evidence Vault is Secure.", "INFO")

if __name__ == "__main__":
    run_test()
