
import pytest
from django.urls import reverse
from rest_framework import status
from apps.users.models import User
from apps.disputes.models import Dispute, Judgment

@pytest.mark.django_db
class TestAdjudicationFlow:
    def setup_method(self):
        self.admin = User.objects.create_superuser(
            username="adminuser", 
            email="admin@example.com", 
            password="password123"
        )
        self.user = User.objects.create_user(
            username="testuser", 
            email="test@example.com", 
            password="password123"
        )
        self.dispute = Dispute.objects.create(
            user=self.user,
            title="Test Dispute",
            description="Test Description",
            status="under_review"
        )
        self.url = reverse('sovereign-dispute-verdict', kwargs={'dispute_id': self.dispute.id})
        self.status_url = reverse('sovereign-dispute-status', kwargs={'dispute_id': self.dispute.id})

    def test_admin_can_issue_verdict(self, client):
        client.force_login(self.admin)
        
        response = client.post(self.url, {
            'verdict': 'favor_tenant',
            'ruling_text': 'The tenant is right based on evidence.',
            'awarded_amount': 150.00
        }, content_type='application/json')

        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'sovereign_proceeding'
        assert data['code'] == 'JUDGMENT_ISSUED'
        
        # Verify database state
        self.dispute.refresh_from_db()
        assert self.dispute.status == 'judgment_provisional'
        assert Judgment.objects.filter(dispute=self.dispute).exists()

    def test_non_admin_cannot_issue_verdict(self, client):
        client.force_login(self.user)
        
        response = client.post(self.url, {
            'verdict': 'favor_tenant',
            'ruling_text': 'I want to win my own case.',
        }, content_type='application/json')

        assert response.status_code == 403

    def test_sovereign_status_reflects_verdict(self, client):
        # 1. Issue verdict first
        from apps.disputes.adjudication_service import AdjudicationService
        AdjudicationService.issue_verdict(self.dispute, self.admin, 'favor_tenant', 'Reasoning')

        client.force_login(self.user)
        response = client.get(self.status_url)
        
        assert response.status_code == 200
        data = response.json()
        assert data['current_phase'] == 'judgment_provisional'
        assert 'visual_assets' in data
