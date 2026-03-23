import sys
import os

# Add the project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.products.models import Product
from apps.products.services import ProductService
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.products.views import ProductViewSet

def verify_p2p_migration():
    print("🚀 Starting P2P Migration Verification...")
    
    # 1. Verify Legacy Ownership
    print("\n[1] Verifying Legacy Product Ownership...")
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        print("❌ CRITICAL: No admin user found!")
        return
        
    legacy_products = Product.objects.filter(owner=admin_user)
    count = legacy_products.count()
    if count > 0:
        print(f"✅ Success: found {count} legacy products owned by Admin ({admin_user.email}).")
    else:
        print("⚠️ Warning: No legacy products found (Database might be fresh).")

    # 2. Verify New Product Ownership Logic
    print("\n[2] Verifying New Product Creation & Ownership...")
    
    # Create a test user
    test_user, created = User.objects.get_or_create(
        email="renter@example.com", 
        defaults={'first_name': 'Renter', 'last_name': 'User'}
    )
    if created:
        test_user.set_password("password123")
        test_user.save()
        print("   -> Created test user.")
    
    # Simulate API Request to create product
    factory = APIRequestFactory()
    view = ProductViewSet.as_view({'post': 'create'})
    
    data = {
        'name': 'User Owned Dress',
        'category_id': 1, # Assuming category 1 exists
        'price_per_day': 5000,
        'size': 'M',
        'color': 'Red'
    }
    
    # Check if we have categories
    from apps.products.models import Category
    if not Category.objects.exists():
        Category.objects.create(name='Dresses', name_ar='فساتين')
        
    cat = Category.objects.first()
    data['category_id'] = cat.id
    
    request = factory.post('/api/products/', data)
    force_authenticate(request, user=test_user)
    
    try:
        response = view(request)
        if response.status_code == 201:
            prod_id = response.data['id']
            prod = Product.objects.get(id=prod_id)
            if prod.owner == test_user:
                print(f"✅ Success: New product '{prod.name}' is correctly owned by {prod.owner.email}.")
            else:
                print(f"❌ Failed: Product owner mismatch! Expected {test_user.email}, Got {prod.owner.email}")
        else:
            print(f"❌ Failed to create product: {response.data}")
    except Exception as e:
        print(f"❌ Exception during product creation: {e}")

    # 3. Verify Permission Enforcement
    print("\n[3] Verifying Permissions (Editing others' products)...")
    
    # Try to edit Admin's product as Test User
    legacy_prod = Product.objects.filter(owner=admin_user).first()
    if legacy_prod:
        view_update = ProductViewSet.as_view({'patch': 'partial_update'})
        request_update = factory.patch(f'/api/products/{legacy_prod.id}/', {'price_per_day': 99999})
        force_authenticate(request_update, user=test_user)
        
        response_update = view_update(request_update, pk=legacy_prod.id)
        if response_update.status_code == 403:
            print("✅ Success: Permission Denied (403) when trying to edit Admin's product.")
        else:
            print(f"❌ Failed: Permission check failed! Status Code: {response_update.status_code}")
    else:
        print("⚠️ Skipping permission check (no admin product found).")

if __name__ == "__main__":
    verify_p2p_migration()
