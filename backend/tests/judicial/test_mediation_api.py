import pytest
from rest_framework.test import APIClient
from django.urls import reverse
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from apps.disputes.models import Dispute, Judgment, MediationSession, SettlementOffer

@pytest.mark.django_db
class TestMediationAPI:
    def setup_method(self):
        self.client = APIClient()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.owner = User.objects.create_user(username='api_owner', email='api_owner@example.com', password='password')
        self.tenant = User.objects.create_user(username='api_tenant', email='api_tenant@example.com', password='password')
        
        self.client.force_authenticate(user=self.tenant)
        
        from apps.products.models import Product, Category
        category = Category.objects.create(name="API Cat", slug="api-cat")
        self.product = Product.objects.create(
            owner=self.owner, 
            category=category,
            name="API Item",
            price_per_day=50
        )
        
        from apps.bookings.models import Booking
        self.booking = Booking.objects.create(
            user=self.tenant,
            product=self.product,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=2),
            total_days=2,
            total_price=100,
            status='confirmed',
            escrow_status='HELD'
        )
        
        self.dispute = Dispute.objects.create(
            user=self.tenant,
            booking=self.booking,
            title="Broken API",
            description="API broken.",
            status='filed'
        )

    def test_start_mediation_endpoint(self):
        """Test POST /disputes/<id>/mediation/ with action='start'."""
        url = reverse('disputes:dispute-mediation', kwargs={'dispute_id': self.dispute.id})
        data = {'action': 'start'}
        
        response = self.client.post(url, data)
        assert response.status_code == 200
        assert response.data['status'] == 'active'
        assert len(response.data['offers']) == 1
        assert response.data['offers'][0]['source'] == 'system'

    def test_accept_offer_endpoint(self):
        """Test POST /disputes/<id>/mediation/ with action='accept_offer'."""
        # 1. Start mediation first
        from apps.disputes.mediation_service import MediationService
        session = MediationService.start_mediation(self.dispute)
        offer = session.offers.first()
        
        url = reverse('disputes:dispute-mediation', kwargs={'dispute_id': self.dispute.id})
        data = {
            'action': 'accept_offer',
            'offer_id': offer.id
        }
        
        response = self.client.post(url, data)
        assert response.status_code == 200
        assert response.data['status'] == 'offer_accepted'
        
        self.dispute.refresh_from_db()
        assert self.dispute.status == 'closed'

    def test_mediation_status_check(self):
        """
        Verify that the status endpoint returns 'mediation_active' when a session is open.
        """
        from apps.disputes.mediation_service import MediationService
        MediationService.start_mediation(self.dispute)
        
        # Override get_dispute_status logic check by ensuring session is active
        # The view checks: hasattr(dispute, 'mediation_session') and status='active'
        # Default create is 'active'
        
        url = reverse('disputes:dispute-status', kwargs={'dispute_id': self.dispute.id})
        # Need to fix URL reversal name if it differs, checking urls.py...
        # Url path: path('<int:dispute_id>/status/', get_dispute_status, name='dispute-status'),
        # Wait, I need to check if that URL is actually registered in urls.py because I didn't see it in the previous `view_file` of `urls.py`. 
        # I only saw `path('<int:dispute_id>/mediation/', ...)`
        # Let me double check urls.py before running this.
        response = self.client.get(url)
        assert response.status_code == 200
        assert response.data['current_phase'] == 'mediation_active'

    def test_reject_offer_endpoint(self):
        """Test POST /disputes/<id>/mediation/ with action='reject_offer'."""
        from apps.disputes.mediation_service import MediationService
        session = MediationService.start_mediation(self.dispute)
        offer = session.offers.first()
        initial_round = session.current_round
        
        url = reverse('disputes:dispute-mediation', kwargs={'dispute_id': self.dispute.id})
        data = {
            'action': 'reject_offer',
            'offer_id': offer.id
        }
        
        response = self.client.post(url, data)
        assert response.status_code == 200
        assert response.data['status'] == 'continued'
        assert response.data['round'] == initial_round + 1
        
        session.refresh_from_db()
        assert session.current_round == initial_round + 1
        assert session.offers.count() == 2 # New offer generated
