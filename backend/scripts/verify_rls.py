import os
import sys
import django
from django.db import connection

# Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.products.models import Product

def verify_rls():
    print("🛡️  Verifying RLS Enforcement...")
    
    # 1. Setup Data
    admin = User.objects.filter(is_superuser=True).first()
    renter = User.objects.filter(email="renter@example.com").first()
    
    if not admin or not renter:
        print("❌ Setup failed: Admin or Renter user not found.")
        return

    # Find a product owned by Admin
    product = Product.objects.filter(owner=admin).first()
    if not product:
        print("❌ Setup failed: No product owned by admin.")
        return
        
    original_price = product.price_per_day
    print(f"   Target Product: {product.name} (Owner: Admin, Price: {original_price})")
    print(f"   Attacker: {renter.email} (ID: {renter.id})")

    # 2. Simulate Attack (Direct DB Update attempting to bypass Django perms)
    # We simulate this by setting the RLS context manually, then running SQL.
    # This mimics what happens if a hacker compromised the application code 
    # but the DB connection was still scoped to the user.
    
    print("\n[Test] Attempting Unauthorized Update via Raw SQL...")
    
    with connection.cursor() as cursor:
        # A. Switch to Restricted Role (Simulate Supabase App User)
        # Note: 'postgres' superuser bypasses RLS. We must switch to 'authenticated' or 'anon'.
        try:
            cursor.execute("SET ROLE authenticated")
        except Exception as e:
             # Fallback for local dev if 'authenticated' role missing: create or ignore (but test will fail if superuser)
             print(f"   Context: Could not SET ROLE authenticated ({e}). Test might fail if DB user is superuser.")

        # B. Set Context to Renter
        cursor.execute("SELECT set_config('app.current_user_id', %s, false)", [str(renter.id)])
        cursor.execute("SELECT set_config('app.current_user_is_admin', 'false', false)")
        
        # B. Try to Update
        # Using raw sql to be sure we are hitting DB directly
        update_query = f"UPDATE products_product SET price_per_day = 0 WHERE id = {product.id}"
        cursor.execute(update_query)
        rows = cursor.rowcount
        
        print(f"   Rows affected: {rows}")
        
    # 3. Verify Result
    product.refresh_from_db()
    if product.price_per_day == original_price:
        print("✅ SUCCESS: RLS blocked the update! Price is unchanged.")
    else:
        print(f"❌ FAILURE: RLS failed! Price changed to {product.price_per_day}")

if __name__ == '__main__':
    verify_rls()
