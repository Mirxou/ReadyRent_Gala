
import os
import sys
import django

# Setup Django environment manually since pytest-django is missing
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from apps.disputes.models import Dispute, Judgment, EvidenceLog
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    user = User.objects.create_superuser(
        email='admin@sovereign.law', 
        password='sovereign_pass',
        role='admin'
    )
    return user

@pytest.fixture
def regular_user(db):
    user = User.objects.create_user(
        email='citizen@sovereign.law', 
        password='citizen_pass',
        role='renter'
    )
    return user

@pytest.fixture
def dispute(db, regular_user):
    # Setup dependencies
    category = Category.objects.create(name="Apparel")
    product = Product.objects.create(
        name="Silk Robe", 
        category=category,
        price_per_day=100.00,
        slug="silk-robe-override"
    )
    booking = Booking.objects.create(
        user=regular_user,
        product=product,
        start_date=timezone.now(),
        end_date=timezone.now() + timedelta(days=3),
        total_price=300.00,
        total_days=3,
        status='completed'
    )
    dispute = Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Deadlocked Dispute",
        description="This dispute is stuck in procedural hell.",
        status='under_review'
    )
    return dispute

@pytest.mark.django_db
def test_sovereign_override_success(api_client, admin_user, dispute):
    """
    Verify that an Admin can force-resolve a dispute.
    """
    api_client.force_authenticate(user=admin_user)
    
    url = reverse('disputes:dispute-override', kwargs={'dispute_id': dispute.id})
    payload = {
        "verdict": "favor_owner",
        "ruling_text": "Sovereign Intervention required to restore order.",
        "awarded_amount": 300.00,
        "justification": "Procedural deadlock detected. Immediate finality required."
    }
    
    print(f"\n🧪 TESTING OVERRIDE on Dispute #{dispute.id}...")
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == 200
    assert response.data['code'] == 'SOVEREIGN_OVERRIDE_EXECUTED'
    
    # Verify Dispute State
    dispute.refresh_from_db()
    assert dispute.status == 'judgment_final'
    assert "SOVEREIGN OVERRIDE" in dispute.resolution
    
    # Verify Judgment Creation
    judgment = Judgment.objects.get(dispute=dispute)
    assert judgment.status == 'final'
    assert judgment.verdict == 'favor_owner'
    
    # Verify Evidence Log
    log = EvidenceLog.objects.filter(action='SOVEREIGN_OVERRIDE', dispute=dispute).first()
    assert log is not None
    assert log.actor == admin_user
    assert log.metadata['justification'] == payload['justification']
    
    print("✅ OVERRIDE SUCCESS: Dispute Finalized and Logged.")

@pytest.mark.django_db
def test_sovereign_override_permission_denied(api_client, regular_user, dispute):
    """
    Verify that a regular user CANNOT force-resolve a dispute.
    """
    api_client.force_authenticate(user=regular_user)
    
    url = reverse('disputes:dispute-override', kwargs={'dispute_id': dispute.id})
    payload = {
        "verdict": "favor_tenant",
        "justification": "I want to win now."
    }
    
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == 403
    print("✅ PERMISSION GUARD: Regular user blocked from Red Button.")

@pytest.mark.django_db
def test_sovereign_override_missing_justification(api_client, admin_user, dispute):
    """
    Verify that justification is MANDATORY.
    """
    api_client.force_authenticate(user=admin_user)
    
    url = reverse('disputes:dispute-override', kwargs={'dispute_id': dispute.id})
    payload = {
        "verdict": "favor_owner",
        "ruling_text": "Because I said so.",
        # Missing justification
    }
    
    response = api_client.post(url, payload, format='json')
    
    assert response.status_code == 400
    assert "Justification is required" in str(response.data)
    print("✅ PROCEDURAL GUARD: Missing justification rejected.")
