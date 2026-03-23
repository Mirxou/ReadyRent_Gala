import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product

try:
    p = Product.objects.get(pk=1)
    p.wilaya = 25 # Constantine code
    p.commune = "Constantine"
    p.save()
    print(f"Successfully updated Product {p.id} wilaya to {p.wilaya}")
except Product.DoesNotExist:
    print("Product 1 not found. Creating it...")
    # Create a dummy product if it doesn't exist
    p = Product.objects.create(
        id=1,
        owner_id=1, 
        name="Test Product",
        description="A test product",
        price_per_day=1000,
        category_id=1, 
        wilaya=25,
        commune="Constantine",
        stock=10
    )
    print(f"Created Product {p.id} with wilaya {p.wilaya}")
except Exception as e:
    print(f"Error: {e}")
