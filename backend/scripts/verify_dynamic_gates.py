import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from constance import config
from apps.bookings.launch_policy import SovereignLaunchPolicy
from apps.products.models import Product, Category

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
    log("SETUP", "Initializing The Gates (Dynamic Policy)...", "WAIT", "yellow")
    
    # Mock Objects
    cat_elec = Category(slug='electronics')
    cat_vehicle = Category(slug='vehicles')
    
    prod_algiers = Product(wilaya=16, category=cat_elec)
    prod_oran = Product(wilaya=31, category=cat_elec) # Oran is 31
    
    # 1. Baseline Check
    log("STEP 1", "Checking Baseline (Algiers Only)...", "CHECK", "yellow")
    try:
        SovereignLaunchPolicy.validate_booking(prod_algiers)
        log("STEP 1", "Algiers Allowed", "SUCCESS", "green")
    except Exception as e:
        log("STEP 1", f"Algiers Blocked: {e}", "FAIL", "red")

    try:
        SovereignLaunchPolicy.validate_booking(prod_oran)
        log("STEP 1", "Oran Allowed (Unexpected)", "FAIL", "red")
    except Exception as e:
        log("STEP 1", "Oran Blocked (Correct)", "SUCCESS", "green")

    # 2. Dynamic Unlock (The Reign)
    log("STEP 2", "ADMIN ACTION: Unlocking Oran (Wilaya 31)...", "ACTION", "yellow")
    
    # Simulate Admin changing config
    original_wilayas = config.SOVEREIGN_ALLOWED_WILAYAS
    log("CONFIG", f"Original: {original_wilayas}", "INFO")
    
    new_wilayas = list(original_wilayas) + [31]
    config.SOVEREIGN_ALLOWED_WILAYAS = new_wilayas
    
    log("CONFIG", f"Updated: {config.SOVEREIGN_ALLOWED_WILAYAS}", "INFO", "green")
    
    # 3. Verify Unlock
    log("STEP 3", "Verifying Oran Access...", "CHECK", "yellow")
    try:
        SovereignLaunchPolicy.validate_booking(prod_oran)
        log("STEP 3", "Oran Now Allowed (Sovereignty Confirmed)", "SUCCESS", "green")
    except Exception as e:
        log("STEP 3", f"Oran Still Blocked: {e}", "FAIL", "red")

    # 4. Cleanup (Revert)
    log("STEP 4", "Reverting Config...", "ACTION", "yellow")
    config.SOVEREIGN_ALLOWED_WILAYAS = original_wilayas
    log("CONFIG", f"Reverted: {config.SOVEREIGN_ALLOWED_WILAYAS}", "INFO")

if __name__ == "__main__":
    run_test()
