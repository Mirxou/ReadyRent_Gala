import os
import django
import sys
from django.db import transaction

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User, VerificationStatus, Blacklist
from apps.social.models import Referral

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
    log("SETUP", "Initializing The Propaganda (Graduated 3-Strikes)...", "WAIT", "yellow")
    
    # Cleanup
    User.objects.filter(email__startswith='bad_child').delete()
    try:
        parent = User.objects.get(email='parent_graduated@sovereign.com')
        parent.delete()
    except User.DoesNotExist:
        pass

    # 1. Create Parent
    log("STEP 1", "Creating Patient Parent...", "ACTION", "yellow")
    parent = User.objects.create_user(username='parent_g', email='parent_graduated@sovereign.com', password='password123')
    v_status, _ = VerificationStatus.objects.get_or_create(user=parent, defaults={'risk_score': 0})

    def simulate_bad_referral(child_email, step_name):
        child = User.objects.create_user(username=child_email, email=child_email, password='123')
        ref = Referral.objects.create(referrer=parent, referred=child, social_collateral=20)
        
        log(step_name, f"Referral Created: {child_email}", "INFO")
        
        # Blacklist -> Triggers Signal
        Blacklist.objects.create(user=child, reason="Bad Behavior", added_by=parent)
        
        ref.refresh_from_db()
        return ref

    # 2. Strike 1
    log("STEP 2", "Strike 1 (Warning)...", "ACTION", "yellow")
    simulate_bad_referral('bad_child_1@sovereign.com', "STRIKE 1")
    
    v_status.refresh_from_db()
    if v_status.risk_score == 0:
        log("STRIKE 1", "Risk Score Unchanged (Correct)", "SUCCESS", "green")
    else:
        log("STRIKE 1", f"Risk Score Changed! {v_status.risk_score}", "FAIL", "red")

    # 3. Strike 2
    log("STEP 3", "Strike 2 (Freeze)...", "ACTION", "yellow")
    simulate_bad_referral('bad_child_2@sovereign.com', "STRIKE 2")
    
    v_status.refresh_from_db()
    if v_status.risk_score == 0:
        log("STRIKE 2", "Risk Score Unchanged (Correct)", "SUCCESS", "green")
    else:
        log("STRIKE 2", f"Risk Score Changed! {v_status.risk_score}", "FAIL", "red")
        
    # 4. Strike 3
    log("STEP 4", "Strike 3 (Trust Hit)...", "ACTION", "yellow")
    simulate_bad_referral('bad_child_3@sovereign.com', "STRIKE 3")
    
    v_status.refresh_from_db()
    if v_status.risk_score == 20:
        log("STRIKE 3", "Risk Score INCREASED (+20) (Justice Served)", "SUCCESS", "green")
    else:
        log("STRIKE 3", f"Risk Score Mismatch: {v_status.risk_score}", "FAIL", "red")

if __name__ == "__main__":
    run_test()
