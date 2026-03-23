import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, VerificationStatus, Blacklist
from apps.social.models import Referral
from django.db import transaction

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
    log("SETUP", "Initializing The Propaganda (Social Collateral)...", "WAIT", "yellow")
    
    # Clean up previous test runs
    User.objects.filter(email__in=['parent@sovereign.com', 'child@sovereign.com']).delete()

    # 1. Create Actors
    log("STEP 1", "Creating Parent and Child...", "ACTION", "yellow")
    parent = User.objects.create_user(username='parent', email='parent@sovereign.com', password='password123')
    child = User.objects.create_user(username='child', email='child@sovereign.com', password='password123')
    
    # Ensure Verification Status exists for Parent (holds the Risk Score)
    v_status, _ = VerificationStatus.objects.get_or_create(user=parent, defaults={'risk_score': 0})
    
    log("AUDIT", f"Parent Initial Risk Score: {v_status.risk_score}", "INFO")

    # 2. Create Referral (The Bond)
    log("STEP 2", "Creating Referral Bond...", "ACTION", "yellow")
    referral = Referral.objects.create(
        referrer=parent,
        referred=child,
        social_collateral=25 # Custom high stakes
    )
    log("AUDIT", f"Bond Created: {referral} (Stake: 25)", "INFO")

    # 3. Blacklist the Child (The Betrayal)
    log("STEP 3", "Blacklisting Child (Simulating Fraud)...", "ACTION", "yellow")
    
    Blacklist.objects.create(
        user=child,
        reason="Attempted to rent a drone for illegal smuggling.",
        added_by=parent # Ironically, or admin
    )

    # 4. Verify Consequences
    log("STEP 4", "Verifying Sovereign Justice...", "CHECK", "yellow")
    
    # Reload Parent Data
    v_status.refresh_from_db()
    referral.refresh_from_db()
    
    expected_score = 25
    
    if v_status.risk_score == expected_score:
        log("STEP 4", f"Parent Risk Score Increased to {v_status.risk_score} (Penalty Applied)", "SUCCESS", "green")
    else:
        log("STEP 4", f"Parent Escaped Justice! Score: {v_status.risk_score} (Expected {expected_score})", "FAIL", "red")
        
    if referral.status == 'revoked':
        log("STEP 4", "Referral Bond Revoked", "SUCCESS", "green")
    else:
        log("STEP 4", f"Referral Status Incorrect: {referral.status}", "FAIL", "red")

if __name__ == "__main__":
    run_test()
