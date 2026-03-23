import os
import sys
import django
from django.db import connection

# Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product

def verify_blind_booking():
    print("🕵️  Verifying Blind Bookings (RLS View Protection)...")
    
    # 1. Setup Data
    # Stranger (Attacker)
    stranger, _ = User.objects.get_or_create(email="stranger@test.com", defaults={'username': 'stranger'})
    
    # Victim (Renter)
    victim, _ = User.objects.get_or_create(email="victim@test.com", defaults={'username': 'victim'})
    
    # Booking
    # Context switch required for RLS Insert Policy
    with connection.cursor() as cursor:
        cursor.execute("SELECT set_config('app.current_user_id', %s, false)", [str(victim.id)])
    
    # Ensure one exists for victim
    if not Booking.objects.filter(user=victim).exists():
        # Need a product first
        prod = Product.objects.first()
        if not prod:
            print("⚠️ No products available. Cannot create booking. Run verify_p2p first.")
            return

        Booking.objects.create(
            user=victim,
            product=prod,
            start_date='2030-01-01',
            end_date='2030-01-02',
            total_price=100
        )
    
    target_booking = Booking.objects.filter(user=victim).first()
    print(f"   Target Booking ID: {target_booking.id} (Renter: {victim.id})")
    print(f"   Attacker: {stranger.id}")

    # 2. Simulate Attack (Unauthorized SELECT)
    with connection.cursor() as cursor:
        try:
             cursor.execute("SET ROLE authenticated")
        except:
             pass 

        # A. Set Context to Stranger
        cursor.execute("SELECT set_config('app.current_user_id', %s, false)", [str(stranger.id)])
        cursor.execute("SELECT set_config('app.current_user_is_admin', 'false', false)")
        
        # B. Try to Select
        query = f"SELECT id, total_price FROM bookings_booking WHERE id = {target_booking.id}"
        cursor.execute(query)
        result = cursor.fetchone()
        
        # 3. Verify Result
        if result is None:
            print("✅ SUCCESS: RLS hid the booking! Query returned NULL/Empty.")
        else:
            print(f"❌ FAILURE: Stranger saw the booking! Result: {result}")

if __name__ == '__main__':
    verify_blind_booking()
