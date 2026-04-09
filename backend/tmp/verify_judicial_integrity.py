
import os
import django
import sys
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.test_settings")
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product
from apps.payments.models import EscrowHold
from apps.disputes.models import Dispute, Judgment
from apps.disputes.services.adjudication import AdjudicationService

def test_judicial_integrity():
    print("--- Starting Judicial Integrity Verification ---")
    from django.core.management import call_command
    call_command('migrate', verbosity=0, interactive=False)

    # 1. Setup Data
    user = User.objects.create(email="renter@test.com", username="renter")
    owner = User.objects.create(email="owner@test.com", username="owner")
    product = Product.objects.create(name="Test Box", daily_price=Decimal("100.00"), owner=owner)
    booking = Booking.objects.create(
        user=user, 
        product=product, 
        total_price=Decimal("100.00"),
        status='COMPLETED'
    )
    
    # Simulate an EscrowHold
    hold = EscrowHold.objects.create(
        booking=booking,
        amount=Decimal("100.00"),
        state='DISPUTED'
    )
    
    dispute = Dispute.objects.create(
        user=user,
        booking=booking,
        title="I want my money back",
        status='under_review'
    )

    # 2. Issue a PROVISIONAL judgment (Favor Tenant)
    print("Issuing Provisional Judgment (Favor Tenant)...")
    judgment = AdjudicationService.issue_verdict(
        dispute=dispute,
        judge=owner, # using owner as dummy judge
        verdict_type='favor_tenant',
        ruling_text="Product was broken."
    )
    
    assert judgment.status == 'provisional'
    hold.refresh_from_db()
    assert hold.state == 'DISPUTED', "Funds should still be disputed"
    print("✅ Provisional state verified.")

    # 3. Finalize Judgment (The Bug Fix Test)
    # This triggers Judgment.save() which should now call AdjudicationService.finalize_judgment
    print("Finalizing Judgment...")
    judgment.status = 'final'
    judgment.save()
    
    # 4. Assert Financial Execution
    hold.refresh_from_db()
    print(f"Final Escrow State: {hold.state}")
    
    # favor_tenant maps to REFUNDED
    assert hold.state == 'REFUNDED', f"Financial Failure! Expected REFUNDED, got {hold.state}"
    
    dispute.refresh_from_db()
    assert dispute.status == 'judgment_final'
    
    print("✅ SUCCESS: Non-split judgment correctly triggered financial release!")

if __name__ == "__main__":
    try:
        test_judicial_integrity()
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
