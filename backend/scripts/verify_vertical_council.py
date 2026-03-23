import os
import django
import sys
from django.db import transaction

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import VerticalReadinessAudit

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
    log("SETUP", "Initializing The Vertical Council (Dual Sign-off)...", "WAIT", "yellow")
    
    # Cleanup
    VerticalReadinessAudit.objects.filter(vertical_slug='vehicles').delete()
    
    # Create Guardians
    tech_guardian, _ = User.objects.get_or_create(username='tech_guard', email='tech@sovereign.com')
    legal_guardian, _ = User.objects.get_or_create(username='legal_guard', email='legal@sovereign.com')
    
    TARGET_VERTICAL = 'vehicles'

    # 1. Initial State
    log("STEP 1", f"Checking Status for '{TARGET_VERTICAL}'...", "CHECK", "yellow")
    is_verified = VerticalReadinessAudit.is_verified(TARGET_VERTICAL)
    if not is_verified:
        log("STEP 1", "Vertical is LOCKED (Correct)", "SUCCESS", "green")
    else:
        log("STEP 1", "Vertical is OPEN (FAIL) - Should be locked", "FAIL", "red")

    # 2. Tech Sign-off
    log("STEP 2", "Technical Guardian Signing off...", "ACTION", "yellow")
    VerticalReadinessAudit.objects.create(
        vertical_slug=TARGET_VERTICAL,
        guardian=tech_guardian,
        role='technical',
        notes="Dispute flow for scratches and dents verified. GPS tracking integration active."
    )
    
    is_verified = VerticalReadinessAudit.is_verified(TARGET_VERTICAL)
    if not is_verified:
        log("STEP 2", "Vertical still LOCKED (Correct - Missing Legal)", "SUCCESS", "green")
    else:
        log("STEP 2", "Vertical UNLOCKED prematurely (FAIL)", "FAIL", "red")

    # 3. Legal Sign-off
    log("STEP 3", "Legal Guardian Signing off...", "ACTION", "yellow")
    VerticalReadinessAudit.objects.create(
        vertical_slug=TARGET_VERTICAL,
        guardian=legal_guardian,
        role='legal',
        notes="Vehicle Rental Contract v4.2 approved. Liability clauses aligned with insurance."
    )
    
    is_verified = VerticalReadinessAudit.is_verified(TARGET_VERTICAL)
    if is_verified:
        log("STEP 3", "Vertical VERIFIED & UNLOCKED (Success)", "SUCCESS", "green")
    else:
        log("STEP 3", "Vertical still LOCKED (FAIL)", "FAIL", "red")
        
    # 4. Audit Trail
    log("AUDIT", "Displaying Sovereign Handshake Record:", "INFO")
    audits = VerticalReadinessAudit.objects.filter(vertical_slug=TARGET_VERTICAL)
    for audit in audits:
        print(f"   📜 [{audit.role.upper()}] Signed by {audit.guardian.username} at {audit.signed_at.strftime('%Y-%m-%d %H:%M')}")
        print(f"      📝 Notes: {audit.notes}")

if __name__ == "__main__":
    run_test()
