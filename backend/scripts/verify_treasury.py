import os
import django
import sys
from decimal import Decimal
from datetime import date, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from constance import config
from apps.bookings.services_financial import FinancialService
from apps.products.models import Product, Category
from apps.users.models import User

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
    log("SETUP", "Initializing The Treasury (SPF Verification)...", "WAIT", "yellow")
    
    # 1. Verify Config
    spf_rate = config.SPF_RENTER_RATE
    log("CONFIG", f"Current SPF Rate: {spf_rate} (Expected: 0.05)", "INFO", "green" if spf_rate == 0.05 else "red")
    
    # 2. Mock Data
    price_per_day = Decimal("100.00")
    
    # We need a dummy product instance just for attribute access if service uses it
    # But service takes 'product' object mainly for 'price_per_day'.
    # Let's create a simple class to mock product if we don't want DB hit, 
    # but let's use real DB object if possible or mock.
    class MockProduct:
        price_per_day = Decimal("100.00")
    
    product = MockProduct()
    
    start_date = date.today()
    end_date = start_date + timedelta(days=4) # 5 days total
    
    # 3. Calculate Breakdown
    log("STEP 1", f"Calculating for 5 days @ {price_per_day}/day...", "ACTION", "yellow")
    breakdown = FinancialService.calculate_booking_breakdown(product, start_date, end_date)
    
    # Expected:
    # Days: 5
    # Base: 500.00
    # Fee: 500 * 0.05 = 25.00
    # Total: 525.00
    
    expected_fee = Decimal("25.00")
    expected_total = Decimal("525.00")
    
    log("AUDIT", f"Base Price: {breakdown['base_price']}", "INFO")
    log("AUDIT", f"Protection Fee: {breakdown['protection_fee']}", "INFO")
    log("AUDIT", f"Total Price: {breakdown['total_price']}", "INFO")
    
    if breakdown['protection_fee'] == expected_fee:
        log("STEP 1", "Fee Calculation Valid (Match)", "SUCCESS", "green")
    else:
        log("STEP 1", f"Fee Mismatch! Expected {expected_fee}, Got {breakdown['protection_fee']}", "FAIL", "red")
        
    if breakdown['total_price'] == expected_total:
         log("STEP 1", "Total Price Valid (Match)", "SUCCESS", "green")
    else:
         log("STEP 1", f"Total Mismatch! Expected {expected_total}, Got {breakdown['total_price']}", "FAIL", "red")

    # 4. Zero Day Test
    log("STEP 2", "Testing 1 Day Rental...", "ACTION", "yellow")
    breakdown_1day = FinancialService.calculate_booking_breakdown(product, start_date, start_date)
    # Base: 100
    # Fee: 5.00
    if breakdown_1day['protection_fee'] == Decimal("5.00"):
        log("STEP 2", "1-Day Fee Valid", "SUCCESS", "green")
    else:
        log("STEP 2", f"1-Day Fee Fail: {breakdown_1day['protection_fee']}", "FAIL", "red")

if __name__ == "__main__":
    run_test()
