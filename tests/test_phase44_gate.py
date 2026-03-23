"""
Phase 44: Verification of Limited Sovereign Exposure (The Gate)
Ensures system offers remain hidden until explicitly approved by an admin.
"""

import os
import django
import sys
import json
from decimal import Decimal

# Setup Django environment
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APIClient, force_authenticate
from apps.users.models import User
from apps.disputes.models import Dispute, MediationSession, SettlementOffer, EvidenceLog
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.mediation_service import MediationService
from apps.disputes.views import AdminPendingOffersView, admin_decide_offer, MediationView
from django.utils import timezone
from datetime import timedelta

def test_sovereign_gate_workflow():
    print("\n=== Testing Phase 44: Sovereign Gate Workflow ===\n")
    
    # 1. Setup Users
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = User.objects.create_superuser('admin@gate.test', 'admin_gate', 'pass')
        
    tenant = User.objects.get_or_create(email='tenant@gate.test', defaults={'username': 'tenant_gate'})[0]
    owner = User.objects.get_or_create(email='owner@gate.test', defaults={'username': 'owner_gate'})[0]
    
    category = Category.objects.get_or_create(
        name="Gate Test Category",
        defaults={'slug': 'gate-test'}
    )[0]

    product = Product.objects.get_or_create(
        name="Gate Test Item",
        defaults={
            'owner': owner, 
            'price_per_day': 100, 
            'category': category,
            'slug': 'gate-test-item-unique'
        }
    )[0]
    
    booking = Booking.objects.create(
        product=product, user=tenant, 
        start_date=timezone.now(), end_date=timezone.now()+timedelta(days=3),
        total_price=300, status='completed',
        total_days=3  # Explicitly set required field
    )
    
    dispute = Dispute.objects.create(
        user=tenant, booking=booking, 
        title="[PHASE44] Gate Test", status='filed'
    )
    
    # 3. Trigger Mediation (System Proposal)
    print("🤖 Generative System Proposal...")
    session = MediationService.start_mediation(dispute)
    offer = session.offers.first()
    
    print(f"   Offer Created: ID #{offer.id}")
    print(f"   Status: {offer.status}")
    
    # VERIFY: Status must be PENDING_REVIEW
    if offer.status != SettlementOffer.Status.PENDING_REVIEW:
        print("❌ FAILED: System offer should be PENDING_REVIEW by default")
        return False
    print("✅ System offer is properly GATED (Pending Review)")
    
    # 4. Verify Invisibility (Regular User)
    client = APIClient()
    client.force_authenticate(user=tenant)
    url = f'/api/disputes/{dispute.id}/mediation/'
    
    # We need to simulate the view request directly or via client if URL is registered
    # Using client to test view logic
    response = client.get(url)
    if response.status_code == 200:
        visible_offers = response.data['offers']
        # Should be empty or not contain this offer
        if any(o['id'] == offer.id for o in visible_offers):
             print("❌ FAILED: Pending offer is visible to tenant!")
             return False
        print("✅ Offer is INVISIBLE to regular user")
    elif response.status_code == 404:
        print(f"⚠️ Warning: Endpoint {url} not found. Checking if URL conf is loaded...")
    
    # 5. Verify Visibility (Admin API)
    client.force_authenticate(user=admin)
    pending_url = '/api/disputes/admin/pending-proposals/'
    response = client.get(pending_url)
    
    if response.status_code == 200:
        data = response.data
        # Handle pagination
        if isinstance(data, dict) and 'results' in data:
            results = data['results']
        elif isinstance(data, list):
            results = data
        else:
            print(f"❌ FAILED: Unexpected response format: {type(data)}")
            return False
            
        pending_ids = [o['id'] for o in results]
        if offer.id in pending_ids:
            print("✅ Offer is VISIBLE in Admin Pending Queue")
        else:
            print(f"❌ FAILED: Offer {offer.id} not found in pending queue. IDs found: {pending_ids}")
            return False
            
    # 6. Admin Approves Offer
    print("\n👮 Admin Approving Offer...")
    decision_url = f'/api/disputes/admin/offers/{offer.id}/decide/'
    response = client.post(decision_url, {'action': 'approve'}, format='json')
    
    if response.status_code == 200:
        print("✅ Approval Request Successful")
    else:
        print(f"❌ FAILED: Approval request failed {response.status_code}")
        return False
        
    # 7. Verify Outcome
    offer.refresh_from_db()
    print(f"   New Status: {offer.status}")
    print(f"   Approved By: {offer.approved_by.username}")
    
    if offer.status != SettlementOffer.Status.VISIBLE:
        print("❌ FAILED: Status did not change to VISIBLE")
        return False
    print("✅ Status updated to VISIBLE")
    
    # Check Log
    log = EvidenceLog.objects.filter(
        dispute=dispute, 
        action='AI_PROPOSAL_APPROVED'
    ).last()
    
    if log:
        print(f"✅ Evidence Logged: {log.action} by {log.actor.username}")
    else:
        print("❌ FAILED: No evidence log created")
        return False
        
    # 8. Verify Visibility (Regular User - Again)
    client.force_authenticate(user=tenant)
    response = client.get(url) 
    visible_offers = response.data['offers']
    if any(o['id'] == offer.id for o in visible_offers):
        print("✅ Offer is now VISIBLE to regular user")
    else:
        print("❌ FAILED: Offer still invisible after approval")
        return False
        
    # Clean up
    Dispute.objects.filter(title__startswith="[PHASE44]").delete()
    return True

if __name__ == "__main__":
    try:
        if test_sovereign_gate_workflow():
            print("\n" + "="*60)
            print("🎉 PHASE 44 VERIFIED: THE HUMAN GATE IS ACTIVE")
            print("="*60)
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
