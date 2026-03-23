import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from constance import config
from apps.products.models import Category

# 1. Flag Wilaya 16 (Algiers) as Green
current_green = getattr(config, 'SOVEREIGN_WILAYAS_GREEN', [])
if 16 not in current_green:
    # Constance stores lists as expected if picklefield is used, 
    # but sometimes it's comma-separated strings depending on config.
    # checking type first.
    print(f"Current Green Wilayas type: {type(current_green)}")
    
    # Assuming it's a list based on LaunchPolicy code: wilaya_id in cls.get_green_wilayas()
    new_green = list(current_green) + [16]
    config.SOVEREIGN_WILAYAS_GREEN = new_green
    print(f"Updated SOVEREIGN_WILAYAS_GREEN to: {config.SOVEREIGN_WILAYAS_GREEN}")
else:
    print("Wilaya 16 already in Green Zone.")

# 2. Add Category 1 to Global Allowed Categories
try:
    cat = Category.objects.get(pk=1)
    print(f"Category 1: {cat.name} (slug: {cat.slug})")
    
    current_allowed = getattr(config, 'SOVEREIGN_ALLOWED_CATEGORIES', [])
    if cat.slug not in current_allowed:
        new_allowed = list(current_allowed) + [cat.slug]
        config.SOVEREIGN_ALLOWED_CATEGORIES = new_allowed
        print(f"Updated SOVEREIGN_ALLOWED_CATEGORIES to: {config.SOVEREIGN_ALLOWED_CATEGORIES}")
    else:
        print(f"Category '{cat.slug}' already allowed.")

except Category.DoesNotExist:
    print("Category 1 not found. Creating 'Test Category'...")
    cat = Category.objects.create(id=1, name="Electronics", name_ar="إلكترونيات", slug="electronics")
    
    current_allowed = getattr(config, 'SOVEREIGN_ALLOWED_CATEGORIES', [])
    if cat.slug not in current_allowed:
        new_allowed = list(current_allowed) + [cat.slug]
        config.SOVEREIGN_ALLOWED_CATEGORIES = new_allowed
        print(f"Updated SOVEREIGN_ALLOWED_CATEGORIES to: {config.SOVEREIGN_ALLOWED_CATEGORIES}")

print("--- Sovereign Config Update Complete ---")
