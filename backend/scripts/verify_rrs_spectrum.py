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
    log("SETUP", "Initializing The Sovereign Spectrum (Green/Yellow/Red)...", "WAIT", "yellow")
    
    # Mock Objects
    cat_elec = Category(slug='electronics')
    cat_vehicle = Category(slug='vehicles')
    cat_books = Category(slug='books')
    
    # Setup Config
    # Green Zone: Algiers (16) -> Allows Electronics, Vehicles
    # Yellow Zone: Oran (31) -> Allows Electronics ONLY
    # Red Zone: Annaba (23) -> Blocked
    
    config.SOVEREIGN_WILAYAS_GREEN = [16]
    config.SOVEREIGN_WILAYAS_YELLOW = [31]
    
    config.SOVEREIGN_ALLOWED_CATEGORIES = ['electronics', 'vehicles'] # Global/Green list
    config.SOVEREIGN_YELLOW_ZONE_CATEGORIES = ['electronics'] # Yellow restricted list
    
    log("CONFIG", f"Green: {config.SOVEREIGN_WILAYAS_GREEN}, Yellow: {config.SOVEREIGN_WILAYAS_YELLOW}", "INFO")
    
    # Products
    p_green_elec = Product(wilaya=16, category=cat_elec)
    p_green_veh = Product(wilaya=16, category=cat_vehicle)
    
    p_yellow_elec = Product(wilaya=31, category=cat_elec)
    p_yellow_veh = Product(wilaya=31, category=cat_vehicle)
    
    p_red = Product(wilaya=23, category=cat_elec) # Annaba
    
    # TEST 1: Green Zone (Full Access)
    log("TEST 1", "Checking Green Zone (Algiers)...", "ACTION", "yellow")
    try:
        SovereignLaunchPolicy.validate_booking(p_green_elec)
        log("TEST 1", "Green/Electronics Allowed", "SUCCESS", "green")
    except Exception as e: log("TEST 1", f"Green/Electronics Failed: {e}", "FAIL", "red")

    try:
        SovereignLaunchPolicy.validate_booking(p_green_veh)
        log("TEST 1", "Green/Vehicles Allowed", "SUCCESS", "green")
    except Exception as e: log("TEST 1", f"Green/Vehicles Failed: {e}", "FAIL", "red")

    # TEST 2: Yellow Zone (Restricted Access)
    log("TEST 2", "Checking Yellow Zone (Oran)...", "ACTION", "yellow")
    try:
        SovereignLaunchPolicy.validate_booking(p_yellow_elec)
        log("TEST 2", "Yellow/Electronics (Allowed Category) Allowed", "SUCCESS", "green")
    except Exception as e: log("TEST 2", f"Yellow/Electronics Failed: {e}", "FAIL", "red")

    try:
        SovereignLaunchPolicy.validate_booking(p_yellow_veh)
        log("TEST 2", "Yellow/Vehicles (Restricted Category) Allowed (FAIL)", "FAIL", "red")
    except Exception as e: 
        log("TEST 2", "Yellow/Vehicles Blocked (Correct)", "SUCCESS", "green")
        # print(f"DEBUG Error: {e}")

    # TEST 3: Red Zone (Blocked)
    log("TEST 3", "Checking Red Zone (Annaba)...", "ACTION", "yellow")
    try:
        SovereignLaunchPolicy.validate_booking(p_red)
        log("TEST 3", "Red Zone Allowed (FAIL)", "FAIL", "red")
    except Exception as e: 
        log("TEST 3", "Red Zone Blocked (Correct)", "SUCCESS", "green")

if __name__ == "__main__":
    run_test()
