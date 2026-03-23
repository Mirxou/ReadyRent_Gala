import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from constance import config
from apps.bookings.launch_policy import SovereignLaunchPolicy

print("--- Sovereign Configuration ---")
try:
    print(f"Green Wilayas: {SovereignLaunchPolicy.get_green_wilayas()}")
    print(f"Yellow Wilayas: {SovereignLaunchPolicy.get_yellow_wilayas()}")
    print(f"Global Categories: {SovereignLaunchPolicy.get_global_allowed_categories()}")
except Exception as e:
    print(f"Error reading config: {e}")

from apps.products.models import Product
try:
    p = Product.objects.get(pk=1)
    # Update to Wilaya 16 (Algiers - Algiers Centre) which should be open
    p.wilaya = 16 
    p.commune = "Algiers Centre"
    p.save()
    print(f"Updated Product 1 to Wilaya {p.wilaya} ({p.commune})")
except Product.DoesNotExist:
    print("Product 1 not found")
