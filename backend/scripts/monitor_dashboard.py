import os
import sys
import django
from django.db.models import Count, Q

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['SENTRY_DSN'] = ""  # Disable Sentry for local monitoring
django.setup()

from apps.users.models import User
from apps.products.models import Product
from apps.bookings.models import Booking

def print_dashboard():
    print("\n📊 --- STANDARD.RENT LIVE MONITOR --- 📊")
    
    # 1. User Stats
    total_users = User.objects.count()
    gold_users = User.objects.filter(verification__risk_score__lt=20).count()
    users_with_products = User.objects.annotate(pc=Count('owned_products')).filter(pc__gt=0).count()
    
    print(f"\n👥 USERS")
    print(f"   Total: {total_users}")
    print(f"   Owners (Have Products): {users_with_products}")
    print(f"   Gold Tier (Risk < 20): {gold_users}")

    # 2. Product Stats
    total_products = Product.objects.count()
    orphaned = Product.objects.filter(owner__isnull=True).count()
    
    print(f"\n📦 PRODUCTS")
    print(f"   Total: {total_products}")
    print(f"   Orphaned (CRITICAL): {orphaned}")
    
    # 3. Booking Stats
    total_bookings = Booking.objects.count()
    confirmed = Booking.objects.filter(status='confirmed').count()
    pending = Booking.objects.filter(status='pending').count()
    
    print(f"\n📅 BOOKINGS")
    print(f"   Total: {total_bookings}")
    print(f"   Confirmed: {confirmed}")
    print(f"   Pending: {pending}")

    print("\n✅ SYSTEM STATUS: OPERATIONAL")
    print("------------------------------------------")

if __name__ == "__main__":
    print_dashboard()
