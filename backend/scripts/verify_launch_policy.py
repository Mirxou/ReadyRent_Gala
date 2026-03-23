
import os
import sys
import django
# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category

User = get_user_model()

def log(scenario, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m", "red": "\033[91m", "yellow": "\033[93m", "white": "\033[0m"
    }
    reset = "\033[0m"
    print(f"{colors.get(color, reset)}[{scenario}] [{status}] {message}{reset}")

def verify_policy():
    log("POLICY", "Verifying Sovereign Launch Constraints...", "YELLOW")
    
    # Setup Data
    user, _ = User.objects.get_or_create(email="policy_tester@standard.rent", defaults={'username': 'policy_tester'})
    
    cat_elec, _ = Category.objects.get_or_create(slug="electronics", defaults={'name': 'Electronics'})
    cat_cars, _ = Category.objects.get_or_create(slug="vehicles", defaults={'name': 'Vehicles'})
    
    # 1. Test: Electronics in Algiers (Should Pass)
    p_valid = Product(
        name="Valid Camera",
        category=cat_elec,
        wilaya=16, # Algiers
        price_per_day=100,
        owner=user,
        description="test",
        slug="valid-camera-123"
    )
    
    # 2. Test: Vehicle (Should Fail)
    p_invalid_cat = Product(
        name="Invalid Car",
        category=cat_cars,
        wilaya=16,
        price_per_day=100,
        owner=user,
        description="test",
        slug="invalid-car-123"
    )

    # 3. Test: Electronics in Oran (Should Fail)
    p_invalid_loc = Product(
        name="Invalid Location Camera",
        category=cat_elec,
        wilaya=31, # Oran
        price_per_day=100,
        owner=user,
        description="test",
        slug="invalid-loc-123"
    )
    
    from apps.bookings.launch_policy import SovereignLaunchPolicy
    
    # Check 1
    try:
        SovereignLaunchPolicy.validate_booking(p_valid)
        log("TEST 1", "Algiers/Electronics: PASSED (Correct)", "SUCCESS", "green")
    except ValidationError as e:
        log("TEST 1", f"Algiers/Electronics: FAILED (Unexpected) - {e}", "FAIL", "red")
        
    # Check 2
    try:
        SovereignLaunchPolicy.validate_booking(p_invalid_cat)
        log("TEST 2", "Vehicles: FAILED (Unexpected - Should block)", "FAIL", "red")
    except ValidationError as e:
        log("TEST 2", "Vehicles: BLOCKED (Correct)", "SUCCESS", "green")
        
    # Check 3
    try:
        SovereignLaunchPolicy.validate_booking(p_invalid_loc)
        log("TEST 3", "Oran: FAILED (Unexpected - Should block)", "FAIL", "red")
    except ValidationError as e:
        log("TEST 3", "Oran: BLOCKED (Correct)", "SUCCESS", "green")

if __name__ == "__main__":
    verify_policy()
