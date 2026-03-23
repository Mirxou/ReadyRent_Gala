import os
import django
from django.db.models import Count
from decimal import Decimal

# Setup Django
import sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.bookings.models import Booking
from apps.products.models import Product

def verify_load_test():
    print("--- VERIFYING LOAD TEST RESULTS ---")
    
    # 1. Check Total Bookings for Product 1
    # Locust script targeted Product 1 for 2026-06-01 to 2026-06-05
    try:
        product = Product.objects.get(id=1)
        print(f"Target Product: {product.name} (ID: 1)")
    except Product.DoesNotExist:
        print("Product 1 not found. Did the simulation run?")
        return

    bookings = Booking.objects.filter(product=product, start_date="2026-06-01")
    count = bookings.count()
    print(f"Total Bookings for Target Slot: {count}")
    
    if count == 0:
        print("WARNING: No bookings found. Load test might have failed to connect or run.")
        return

    if count > 1:
        print("❌ CRITICAL FAIL: Double Booking Detected!")
        for b in bookings:
            print(f" - Booking {b.id}: {b.status} (User: {b.user.username})")
    else:
        print("✅ SUCCESS: Exactly one booking secured the slot.")
        print(f"   Winner: Booking {bookings.first().id} by {bookings.first().user.username}")

    # 2. Check for Overlaps General
    print("\nChecking for ANY overlaps on Product 1...")
    # This is O(N^2) naive check or better DB check
    all_bookings = Booking.objects.filter(product=product).exclude(status='cancelled')
    overlap_found = False
    for b1 in all_bookings:
        for b2 in all_bookings:
            if b1.id == b2.id:
                continue
            # Check overlap
            if b1.start_date < b2.end_date and b1.end_date > b2.start_date:
                print(f"❌ OVERLAP: #{b1.id} ({b1.start_date}-{b1.end_date}) vs #{b2.id} ({b2.start_date}-{b2.end_date})")
                overlap_found = True
                break
        if overlap_found:
            break
            
    if not overlap_found:
        print("✅ SUCCESS: No overlaps found across all bookings for Product 1.")

if __name__ == "__main__":
    verify_load_test()
