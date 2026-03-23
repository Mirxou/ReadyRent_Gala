import pytest
from django.urls import reverse
from rest_framework import status
from apps.disputes.models import Dispute, EvidenceLog

@pytest.fixture
def user_client(api_client, regular_user):
    """Authenticated client for a regular user."""
    api_client.force_authenticate(user=regular_user)
    return api_client

@pytest.fixture
def dispute(regular_user, booking):
    """Test dispute fixture."""
    return Dispute.objects.create(
        user=regular_user,
        booking=booking,
        title="Test Dispute",
        description="A sample dispute for testing.",
        status="under_review"
    )

@pytest.mark.django_db
def test_tribunal_case_detail_access(admin_client, user_client, dispute):
    """Verifies that only admins can access the high-context tribunal view."""
    url = reverse('tribunal-case-detail', kwargs={'dispute_id': dispute.id})
    
    # Admin Access
    response = admin_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert 'user_context' in response.data
    assert 'evidence_trail' in response.data
    
    # Regular User Access (Forbidden)
    response = user_client.get(url)
    assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.django_db
def test_tribunal_evidence_aggregation(admin_client, dispute, admin_user):
    """Ensures that the evidence trail is correctly aggregated in the tribunal view."""
    # Create evidence
    EvidenceLog.objects.create(
        action="TEST_ACTION",
        actor=admin_user,
        dispute=dispute,
        metadata={"info": "test evidence"}
    )
    
    url = reverse('tribunal-case-detail', kwargs={'dispute_id': dispute.id})
    response = admin_client.get(url)
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.data['evidence_trail']) >= 1
    assert response.data['evidence_trail'][0]['action'] == "TEST_ACTION"

@pytest.mark.django_db
def test_issue_verdict_via_internal_workflow(admin_client, dispute):
    """Verifies the issue_verdict endpoint used by the RulingEditor."""
    url = reverse('sovereign-dispute-verdict', kwargs={'dispute_id': dispute.id})
    payload = {
        "verdict": "favor_tenant",
        "ruling_text": "تمت استعادة الحق بناءً على البيينة.",
        "awarded_amount": 500.00
    }
    
    response = admin_client.post(url, payload, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert response.data['code'] == "JUDGMENT_ISSUED"
    
    dispute.refresh_from_db()
    assert dispute.status == "judgment_provisional"
