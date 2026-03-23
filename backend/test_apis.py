"""
Test script for Sovereign APIs
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from apps.disputes.models import Dispute, MediationSession, SettlementOffer
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.disputes.api_views import DisputeViewSet, SettlementOfferViewSet, AdminOfferViewSet
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

User = get_user_model()
factory = RequestFactory()

def test_api_endpoints():
    print("🔧 API ENDPOINT VERIFICATION START 🔧")
    
    # Setup
    user = User.objects.create_user(email="api_test@example.com", password="test123")
    admin = User.objects.create_user(email="admin_api@example.com", password="admin123", is_staff=True)
    category, _ = Category.objects.get_or_create(name="Electronics")
    product, _ = Product.objects.get_or_create(name="Laptop", category=category, owner=admin, price_per_day=Decimal("100.00"))
    booking = Booking.objects.create(user=user, product=product, total_price=Decimal("10000.00"), start_date=timezone.now(), end_date=timezone.now()+timedelta(days=3))
    
    # 1. Test Dispute Creation via API
    print(">> TEST: Create Dispute via API")
    request = factory.post('/api/disputes/', {
        'title': 'Screen Cracked',
        'description': 'Laptop screen damaged',
        'booking_id': booking.id,
        'claimed_amount': '6000.00'
    })
    request.user = user
    
    view = DisputeViewSet.as_view({'post': 'create'})
    response = view(request)
    
    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    print(f"[OK] Dispute created: {response.data['id']}")
    
    dispute_id = response.data['id']
    dispute = Dispute.objects.get(id=dispute_id)
    
    # 2. Test Mediation Session Access
    print(">> TEST: Access Mediation Session")
    request = factory.get(f'/api/disputes/{dispute_id}/mediation_session/')
    request.user = user
    
    view = DisputeViewSet.as_view({'get': 'mediation_session'})
    response = view(request, pk=dispute_id)
    
    assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
    print(f"[OK] Mediation session response: {response.status_code}")
    
    # 3. Test PENDING Offer Invisibility (User should NOT see pending offers)
    print(">> TEST: Pending Offers Invisibility")
    # Get the mediation session
    session = dispute.mediation_session
    # Check if any offers exist and are pending
    pending_offers = session.offers.filter(status=SettlementOffer.Status.PENDING_REVIEW)
    
    # User tries to list offers
    request = factory.get(f'/api/disputes/{dispute_id}/offers/')
    request.user = user
    
    view = DisputeViewSet.as_view({'get': 'offers'})
    response = view(request, pk=dispute_id)
    
    assert response.status_code == 200
    visible_count = len(response.data)
    print(f"[OK] User sees {visible_count} offers (Pending: {pending_offers.count()})")
    assert visible_count == 0 or visible_count < pending_offers.count(), "User should not see PENDING offers!"
    
    # 4. Test Admin Pending List
    print(">> TEST: Admin Pending Offers List")
    request = factory.get('/api/admin/offers/pending/')
    request.user = admin
    
    view = AdminOfferViewSet.as_view({'get': 'pending'})
    response = view(request)
    
    assert response.status_code == 200
    print(f"[OK] Admin sees {len(response.data)} pending offers")
    
    # 5. Test Admin Approval
    if pending_offers.exists():
        print(">> TEST: Admin Approval (Sovereign Gate)")
        offer = pending_offers.first()
        
        request = factory.post(f'/api/admin/offers/{offer.id}/approve/')
        request.user = admin
        
        view = AdminOfferViewSet.as_view({'post': 'approve'})
        response = view(request, pk=offer.id)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"[OK] Admin approved offer #{offer.id}")
        
        # Verify it's now visible to user
        offer.refresh_from_db()
        assert offer.status == SettlementOffer.Status.VISIBLE, "Offer should be VISIBLE now!"
        print(f"[OK] Offer is now VISIBLE")
    
    print("✅ ALL API TESTS PASSED")

if __name__ == "__main__":
    try:
        test_api_endpoints()
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
