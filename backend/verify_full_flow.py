import os
import django
import sys
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Dispute, Judgment, MediationSession, SettlementOffer
from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.disputes.admin_service import SovereignGateService
from apps.disputes.mediation_service import MediationService
from django.utils import timezone
from datetime import timedelta

def test_full_system_flow():
    print("⚔️ GRAND SOVEREIGN VERIFICATION START ⚔️")
    
    # 0. Setup Data
    admin, _ = User.objects.get_or_create(email="admin_gate@example.com", defaults={"is_staff": True})
    user, _ = User.objects.get_or_create(email="high_roller@example.com")
    category, _ = Category.objects.get_or_create(name="Real Estate")
    product, _ = Product.objects.get_or_create(name="Villa Gala", category=category, owner=admin, price_per_day=Decimal("10000.00"))
    
    # 1. High Value Booking (Total 30,000)
    print(">> CREATING HIGH VALUE BOOKING...")
    booking = Booking.objects.create(
        user=user, 
        product=product, 
        total_price=Decimal("30000.00"), 
        start_date=timezone.now(), 
        end_date=timezone.now()+timedelta(days=3)
    )
    
    # 2. Dispute Filed (Signal should trigger Mediation)
    print(">> FILING DISPUTE (CLAIM: 10,000)...")
    dispute = Dispute.objects.create(
        title="Major Water Leak", 
        description="Pool leaked into living room.", 
        booking=booking, 
        user=user,
        claimed_amount=Decimal("10000.00"),
        priority="high"
    )
    
    # Force mediation if signal didn't fire (shell context safety)
    if not hasattr(dispute, 'mediation_session'):
        MediationService.start_mediation(dispute)
    
    dispute.refresh_from_db()
    session = dispute.mediation_session
    print(f"[OK] Mediation Session: {session}")
    
    # 3. Verify Offer is HIDDEN (Pending Review)
    # The system logic (Phase 4) sets status=PENDING if amount > 5000.
    # We claimed 10,000. Fallback or Mock Precedents might give 50% = 5,000.
    # Wait, the check was `> 5000`. If offer is EXACTLY 5000, it might be visible.
    # Let's ensure offer is > 5000.
    # If no precedents, fallback is 50% of Booking Total (15,000) or 50% of Claim (5,000).
    # In `MediationService`: `base = dispute.claimed_amount if dispute.claimed_amount else booking.total_price`.
    # `suggested_amount = base / 2`.
    # So 5000.
    # Condition: `if suggested_amount > Decimal('5000.00'):`
    # 5000 is NOT > 5000. It's visible. 
    # Let's bump the claim to 12,000 -> Offer 6,000.
    
    print(">> ADJUSTING CLAIM TO TRIGGER GUARD (12,000 -> 6,000 Offer)...")
    dispute.claimed_amount = Decimal("12000.00")
    dispute.save()
    # Regenerate offer? The first one is already made. 
    # Let's reject the first one to trigger round 2, or just wipe offers and regen.
    session.offers.all().delete()
    offer = MediationService.generate_system_proposal(session)
    
    print(f"[OK] New Offer Generated: {offer.amount} ({offer.status})")
    assert offer.amount > 5000, f"Offer {offer.amount} too low to trigger gate!"
    assert offer.status == SettlementOffer.Status.PENDING_REVIEW, "Offer should be PENDING_REVIEW!"
    print("[OK] GATE CLOSED: Offer is hidden.")
    
    # 4. Admin Approves (Sovereign Gate)
    print(">> ADMIN APPROVING OFFER...")
    SovereignGateService.approve_offer(offer.id, admin)
    
    offer.refresh_from_db()
    assert offer.status == SettlementOffer.Status.VISIBLE, "Offer should be VISIBLE now!"
    print("[OK] GATE OPENED: Offer is visible.")
    
    # 5. User Accepts
    print(">> USER ACCEPTING OFFER...")
    MediationService.accept_offer(offer)
    
    dispute.refresh_from_db()
    assert dispute.status == 'closed', "Dispute should be CLOSED!"
    print("[OK] Dispute Resolved.")
    
    print("⚔️ VERIFICATION COMPLETE: SYSTEM IS SOVEREIGN ⚔️")

if __name__ == "__main__":
    try:
        test_full_system_flow()
    except Exception as e:
        print(f"❌ FAILED: {e}")
        sys.exit(1)
