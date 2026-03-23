
import os
import django
import pytest
from django.utils import timezone
from django.urls import reverse
from rest_framework.test import APIClient
from apps.users.models import User
from apps.disputes.models import Dispute, Judgment, Appeal
from apps.disputes.adjudication_service import AdjudicationService

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data():
    admin = User.objects.create_superuser(username='admin_p35', email='admin@p35.com', password='password')
    tenant = User.objects.create_user(username='tenant_p35', email='tenant@p35.com', password='password')
    dispute = Dispute.objects.create(user=tenant, title='P35 Test', status='under_review')
    judgment = AdjudicationService.issue_verdict(dispute, admin, 'favor_tenant', 'Test Judgment', 100)
    return admin, tenant, dispute, judgment

@pytest.mark.django_db
def test_user_can_appeal_verdict(api_client, setup_data):
    admin, tenant, dispute, judgment = setup_data
    api_client.force_authenticate(user=tenant)
    
    url = reverse('sovereign-dispute-appeal', kwargs={'dispute_id': dispute.id})
    response = api_client.post(url, {'reason': 'I need more money'})
    
    assert response.status_code == 200
    assert response.data['code'] == 'APPEAL_FILED'
    
    dispute.refresh_from_db()
    assert dispute.status == 'under_review'
    assert Appeal.objects.filter(judgment=judgment).exists()

@pytest.mark.django_db
def test_user_can_close_dispute(api_client, setup_data):
    admin, tenant, dispute, judgment = setup_data
    api_client.force_authenticate(user=tenant)
    
    url = reverse('sovereign-dispute-close', kwargs={'dispute_id': dispute.id})
    response = api_client.post(url)
    
    assert response.status_code == 200
    assert response.data['code'] == 'DISPUTE_ARCHIVED'
    
    dispute.refresh_from_db()
    judgment.refresh_from_db()
    assert dispute.status == 'closed'
    assert judgment.status == 'final'
