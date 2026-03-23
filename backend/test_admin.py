"""
Test Django Admin Customizations
"""
import os
import django
import sys
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.admin.sites import site
from apps.disputes.models import SettlementOffer, MediationSession, Dispute
from apps.disputes.admin import SettlementOfferAdmin
from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

def test_admin_configuration():
    print("🔧 DJANGO ADMIN VERIFICATION START 🔧")
    
    # 1. Check Admin Registration
    print(">> TEST: Admin Classes Registered")
    registered_models = site._registry.keys()
    
    assert SettlementOffer in registered_models, "SettlementOffer not registered in admin!"
    assert MediationSession in registered_models, "MediationSession not registered in admin!"
    print("[OK] All admin classes registered")
    
    # 2. Check SettlementOfferAdmin Configuration
    print(">> TEST: SettlementOfferAdmin Configuration")
    admin_class = site._registry[SettlementOffer]
    
    # Check list_display
    expected_fields = ['id', 'dispute_link', 'source', 'amount_display', 'status_badge', 'created_at']
    assert admin_class.list_display == expected_fields, f"list_display mismatch: {admin_class.list_display}"
    print(f"[OK] list_display configured correctly: {len(expected_fields)} fields")
    
    # Check actions
    expected_actions = ['approve_offers', 'reject_offers']
    assert all(action in admin_class.actions for action in expected_actions), "Actions missing!"
    print(f"[OK] Bulk actions configured: {expected_actions}")
    
    # Check filters
    assert 'status' in admin_class.list_filter, "Status filter missing!"
    print("[OK] Filters configured")
    
    # 3. Test Custom Methods
    print(">> TEST: Custom Admin Methods")
    
    # Setup data
    admin_user = User.objects.create_user(email="admin_test@example.com", password="test123", is_staff=True)
    user = User.objects.create_user(email="user_test@example.com", password="test123")
    category, _ = Category.objects.get_or_create(name="Test Category")
    product, _ = Product.objects.get_or_create(name="Test Product", category=category, owner=admin_user, price_per_day=Decimal("100.00"))
    booking = Booking.objects.create(user=user, product=product, total_price=Decimal("1000.00"), start_date=timezone.now(), end_date=timezone.now()+timedelta(days=1))
    
    dispute = Dispute.objects.create(title="Test Dispute", description="Test", booking=booking, user=user, claimed_amount=Decimal("500.00"))
    session = MediationSession.objects.create(dispute=dispute, expires_at=timezone.now()+timedelta(days=3))
    offer = SettlementOffer.objects.create(
        session=session,
        source='system',
        amount=Decimal("250.00"),
        reasoning="Test reasoning",
        status=SettlementOffer.Status.PENDING_REVIEW
    )
    
    # Test methods exist and work
    admin_instance = SettlementOfferAdmin(SettlementOffer, site)
    
    # dispute_link
    link_html = admin_instance.dispute_link(offer)
    assert 'Test Dispute' in link_html, "dispute_link method failed!"
    print("[OK] dispute_link() works")
    
    # amount_display
    amount = admin_instance.amount_display(offer)
    assert '250.00' in amount, "amount_display method failed!"
    print("[OK] amount_display() works")
    
    # status_badge
    badge_html = admin_instance.status_badge(offer)
    assert '#ff9800' in badge_html, "status_badge should be orange for PENDING!"
    print("[OK] status_badge() displays correctly")
    
    print("✅ ALL ADMIN TESTS PASSED")

if __name__ == "__main__":
    try:
        test_admin_configuration()
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
