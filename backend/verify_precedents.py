import os
import django
import sys
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Dispute, Judgment, JudgmentEmbedding, EvidenceLog
from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.disputes.precedent_search_service import PrecedentSearchService
from apps.disputes.consistency_service import ConsistencyService
from django.utils import timezone
from datetime import timedelta

def test_precedent_system():
    print("🏛️ LIBRARY OF ALEXANDRIA VERIFICATION START 🏛️")
    
    # 0. Setup Data
    user, _ = User.objects.get_or_create(email="librarian@example.com")
    category, _ = Category.objects.get_or_create(name="Luxury Cars")
    product, _ = Product.objects.get_or_create(name="Rolls Royce Ghost", category=category, owner=user, price_per_day=Decimal("5000.00"))
    
    # Booking A (The Precedent)
    b1 = Booking.objects.create(user=user, product=product, start_date=timezone.now(), end_date=timezone.now()+timedelta(days=3))
    
    # Booking B (The New Case)
    b2 = Booking.objects.create(user=user, product=product, start_date=timezone.now(), end_date=timezone.now()+timedelta(days=3))

    print("[OK] Base Data Created")

    # 1. Create Precedent Judgment
    print(">> CREATING PRECEDENT JUDGMENT...")
    d1 = Dispute.objects.create(title="Scratch on Bumper", description="Deep scratch found on rear bumper.", booking=b1, user=user)
    j1 = Judgment.objects.create(
        dispute=d1, 
        verdict="favor_owner", 
        ruling_text="Tenant is liable for damage during rental.", 
        awarded_amount=Decimal("15000.00"),
        status="final",
        finalized_at=timezone.now()
    )
    
    # 2. Embed Precedent (Mock)
    print(">> EMBEDDING PRECEDENT...")
    embedding = PrecedentSearchService.embed_judgment(j1)
    assert embedding.embedding_vector is not None
    print(f"[OK] Precedent Embedded (Vector Size: {len(embedding.embedding_vector)})")
    
    # 3. Create New Judgment (Divergent)
    print(">> CREATING NEW JUDGMENT (DIVERGENT)...")
    d2 = Dispute.objects.create(title="Scratch on Door", description="Scratch found on driver door.", booking=b2, user=user)
    j2 = Judgment.objects.create(
        dispute=d2, 
        verdict="favor_tenant", # Divergent!
        ruling_text="Damage pre-existed.", 
        awarded_amount=Decimal("0.00"),
        status="final",
        finalized_at=timezone.now()
    )
    
    # 4. Run Consistency Check
    print(">> RUNNING CONSISTENCY CHECK...")
    # Mocking minimum judgments check logic in ConsistencyService 
    # (We temporarily lower the threshold in memory or just add dummy judgments if needed)
    # Actually, ConsistencyService has MIN_JUDGMENTS_FOR_BASELINE = 5.
    # We must patch this or force it.
    ConsistencyService.MIN_JUDGMENTS_FOR_BASELINE = 1 # Force lower threshold for test
    
    report = ConsistencyService.evaluate_judgment(j2)
    
    print("\n📊 REPORT GENERATED:")
    print(f"Recommendation: {report['recommendation']}")
    print(f"Precedents Found: {report['precedents_found']}")
    
    # 5. Verify Results
    assert report['precedents_found'] > 0, "Failed to find the precedent!"
    assert report['recommendation'] == "DIVERGENT", f"Expected DIVERGENT, got {report['recommendation']}"
    
    flags = report.get('divergence_flags', [])
    assert len(flags) > 0, "No divergence flags raised!"
    print(f"[OK] Divergence Correctly Flagged: {flags[0]['reason']}")
    
    print("✅ VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL")

if __name__ == "__main__":
    try:
        test_precedent_system()
    except Exception as e:
        print(f"❌ FAILED: {e}")
        sys.exit(1)
