"""
Phase 45: The Golden Path Verification & Kill Switch Test
Simulates the full lifecycle of a Sovereign Dispute and tests the emergency halt protocol.
"""

import os
import django
import sys
import json
from decimal import Decimal
from django.core.cache import cache
from django.conf import settings

# Setup Django environment
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from apps.users.models import User
from apps.disputes.models import Dispute, MediationSession, SettlementOffer, EvidenceLog
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.mediation_service import MediationService
from apps.disputes.fusion_service import ArchitecturalFusion
from django.utils import timezone
from datetime import timedelta
from django.core.cache import caches

def test_golden_path_launch():
    # FORCE LocMemCache to avoid Redis dependency failing silently
    settings.CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'sovereign-test-cache',
        }
    }
    # Reset cache connection handler
    caches._caches = {}
    from django.core.cache import cache
    print(f"CACHE BACKEND FORCED: {cache}")

    print("\n=== PHASE 45: GOLDEN PATH VERIFICATION ===\n")
    
    # 0. Setup
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = User.objects.create_superuser('admin@launch.test', 'admin_launch', 'pass')
    
    tenant, _ = User.objects.get_or_create(email='tenant@launch.test', defaults={'username': 'tenant_launch'})
    owner, _ = User.objects.get_or_create(email='owner@launch.test', defaults={'username': 'owner_launch'})
    
    category, _ = Category.objects.get_or_create(name="Launch Cat", defaults={'slug': 'launch-cat'})
    product, _ = Product.objects.get_or_create(
        name="Launch Item", 
        defaults={'owner': owner, 'price_per_day': 1000, 'category': category, 'slug': 'launch-item'}
    )
    
    booking = Booking.objects.create(
        product=product, user=tenant,
        start_date=timezone.now(), end_date=timezone.now()+timedelta(days=5),
        total_price=5000, status='completed', total_days=5
    )
    
    # 1. Genesis: Dispute Creation
    print("1. [GENESIS] Dispute Filed")
    dispute = Dispute.objects.create(user=tenant, booking=booking, title="[LAUNCH] Golden Path", status='filed')
    print(f"   Dispute ID: {dispute.id}")
    
    # 2. Mediation: Auto-Proposal
    print("2. [MEDIATION] System Proposal")
    session = MediationService.start_mediation(dispute)
    offer = session.offers.first()
    print(f"   Offer ID: {offer.id}, Status: {offer.status}")
    
    # 3. The Gate: Admin Approval
    print("3. [GATE] Admin Approval")
    offer.status = SettlementOffer.Status.VISIBLE
    offer.approved_by = admin
    offer.approved_at = timezone.now()
    offer.save()
    
    EvidenceLog.objects.create(
        dispute=dispute, action='AI_PROPOSAL_APPROVED', actor=admin, 
        metadata={'offer_id': offer.id}
    )
    print("   Offer Approved & Logged")
    
    # 4. Fusion: Consistency Check
    print("4. [FUSION] Architectural Consistency Check")
    report = ArchitecturalFusion.ensure_consistency(dispute.id)
    print(f"   Fusion Report: {report['status']}")
    
    if report['status'] != 'HEALTHY':
        print(f"❌ FAILED: Fusion report anomalies: {report['anomalies']}")
        return False
    print("✅ Fusion Check Passed")
    
    # 5. The Kill Switch Test
    print("5. [SAFETY] Testing Kill Switch (Halo Halt)")
    client = Client()
    client.force_login(tenant)
    
    # A. Verify Normal Operation
    url = f'/api/disputes/{dispute.id}/mediation/' # Read-only, should pass regardless
    resp = client.get(url)
    if resp.status_code != 200:
        print(f"❌ Pre-check failed: {resp.status_code}")
        return False
        
    start_url = f'/api/disputes/{dispute.id}/mediation/'
    # Simulate POST to start mediation (blocked if halted) - Wait, view logic might handle it differently
    # Let's test a known mocked POST endpoint or just rely on middleware logic intercepting any POST
    # The Admin Decision endpoint is a good candidate: /api/disputes/admin/offers/<id>/decide/
    
    offer_id = offer.id 
    decide_url = f'/api/disputes/admin/offers/{offer_id}/decide/'
    
    # Activate Halt
    cache.set('SOVEREIGN_AI_HALTED', True, timeout=None)
    print(f"   🚨 KILL SWITCH ACTIVATED 🚨 (Cache Value: {cache.get('SOVEREIGN_AI_HALTED')})")
    print(f"   Test Cache Backend: {cache}")

    # Switch to Admin for decision
    client.force_login(admin)

    # Try State Change (POST)
    resp = client.post(decide_url, {'action': 'approve'}, content_type='application/json')
    print(f"   POST Request Status: {resp.status_code}")
    
    if resp.status_code == 503 and resp.json().get('code') == 'SOVEREIGN_HALTED':
        print("✅ BLOCKED: Write operation successfully halted.")
    else:
        print(f"❌ FAILED: Kill switch did not block request (Got {resp.status_code})")
        # Deactivate before return
        cache.delete('SOVEREIGN_AI_HALTED')
        return False
        
    # Validating Read-Only exemption
    resp = client.get(url)
    if resp.status_code == 200:
        print("✅ ALLOWED: Read operation still functional.")
    else:
        print("❌ FAILED: Kill switch blocked read operation.")
        cache.delete('SOVEREIGN_AI_HALTED')
        return False
        
    # Deactivate Halt
    cache.delete('SOVEREIGN_AI_HALTED')
    print("   🟢 KILL SWITCH DEACTIVATED")
    
    # 6. Cleanup
    Dispute.objects.filter(title__startswith="[LAUNCH]").delete()
    
    return True

if __name__ == "__main__":
    try:
        if test_golden_path_launch():
            print("\n" + "="*60)
            print("🚀 READY FOR LAUNCH: ALL SYSTEMS GO")
            print("="*60)
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        cache.delete('SOVEREIGN_AI_HALTED') # Ensure cleanup
        sys.exit(1)
