import os
import sys
import django
import json
from datetime import date, timedelta

# Added project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['SENTRY_DSN'] = "" # No Sentry
django.setup()

from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.contracts.services import ContractService
from apps.contracts.models import Contract

def test_smart_agreement():
    print("📜 Testing Smart Agreement Integrity (Digital Evidence)...")

    # 1. Setup Data
    user_owner, _ = User.objects.get_or_create(email="owner_contract@test.com", defaults={'username': 'owner_contract'})
    user_renter, _ = User.objects.get_or_create(email="renter_contract@test.com", defaults={'username': 'renter_contract'})
    
    category, _ = Category.objects.get_or_create(slug='contract-cat', defaults={'name': 'Contracts', 'name_ar': 'عقود'})
    
    product, _ = Product.objects.get_or_create(
        slug="contract-prod-01",
        defaults={
            'name': "Original Camera",
            'owner': user_owner,
            'category': category,
            'price_per_day': 5000,
            'size': 'M', 'color': 'Black'
        }
    )
    # Ensure name is original
    product.name = "Original Camera" 
    product.price_per_day = 5000
    product.save()

    booking = Booking.objects.create(
        product=product,
        user=user_renter,
        status='pending',
        start_date=date.today(),
        end_date=date.today() + timedelta(days=3),
        total_days=3,
        total_price=15000
    )

    print(f"   Original Product: {product.name} ({product.price_per_day} DZD)")

    # 2. Create Smart Contract (Confirmation)
    print("\n✍️  Signing Smart Contract...")
    contract = ContractService.create_contract(booking)
    print(f"   Contract Created: ID {contract.id}")
    print(f"   Digital Signature: {contract.contract_hash[:10]}...")

    # 3. Modify "Reality" (Change Product Data)
    print("\n🔄 Modifying Asset in Database (Simulating User Edit)...")
    product.name = "Fake Camera For Scam"
    product.price_per_day = 99999
    product.save()
    print(f"   Current DB Product: {product.name} ({product.price_per_day} DZD)")

    # 4. Verify Evidence (Immutability Check)
    print("\n🕵️‍♀️ Verifying Digital Evidence...")
    
    snapshot = contract.snapshot
    evidence_name = snapshot['asset']['name']
    evidence_price = snapshot['terms']['price_per_day']
    
    print(f"   Evidence Name: {evidence_name}")
    print(f"   Evidence Price: {evidence_price}")

    if evidence_name == "Original Camera" and evidence_price == 5000.0:
        print("   ✅ PASS: Evidence preserved original terms.")
    else:
        print("   ❌ FAIL: Evidence was malformed!")
        return

    # 5. Verify Cryptographic Integrity
    is_valid = ContractService.verify_integrity(contract)
    if is_valid:
        print("   ✅ PASS: Digital Signature matches snapshot content.")
    else:
        print("   ❌ FAIL: Hash mismatch! Data integrity compromised.")

if __name__ == "__main__":
    test_smart_agreement()
