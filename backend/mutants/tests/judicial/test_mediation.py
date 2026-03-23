import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from apps.disputes.models import Dispute, Judgment, MediationSession, SettlementOffer
from apps.disputes.mediation_service import MediationService

@pytest.mark.django_db
class TestMediationService:
    def setup_method(self):
        self.client = APIClient()
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.owner = User.objects.create_user(username='mediator_owner', email='m_owner@example.com', password='password')
        self.tenant = User.objects.create_user(username='mediator_tenant', email='m_tenant@example.com', password='password')
        
        from apps.products.models import Product, Category
        category = Category.objects.create(name="Mediation Cat", slug="med-cat")
        self.product = Product.objects.create(
            owner=self.owner, 
            category=category,
            name="Glass Vase",
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
            title="Broken on arrival",
            description="It was broken.",
            status='filed'
        )
        
        # Create some precedents
        # 1. Similar case, owner awarded 20
        d1 = Dispute.objects.create(user=self.tenant, title="P1", status='judgment_final')
        Judgment.objects.create(dispute=d1, verdict='favor_owner', awarded_amount=20, status='final', ruling_text="R1")
        
        # 2. Similar case, owner awarded 40
        d2 = Dispute.objects.create(user=self.tenant, title="P2", status='judgment_final')
        Judgment.objects.create(dispute=d2, verdict='favor_owner', awarded_amount=40, status='final', ruling_text="R2")


    def test_start_mediation_generates_offer(self):
        """Test that starting mediation creates a session and a system offer."""
        session = MediationService.start_mediation(self.dispute)
        
        assert isinstance(session, MediationSession)
        assert session.status == 'active'
        assert session.offers.count() == 1
        
        offer = session.offers.first()
        assert offer.source == 'system'
        # Avg of 20 and 40 is 30
        assert offer.amount == Decimal('30.00')

    def test_accept_offer_resolves_dispute(self):
        """Test that accepting an offer closes the dispute and triggers money movement."""
        session = MediationService.start_mediation(self.dispute)
        offer = session.offers.first()
        
        MediationService.accept_offer(offer)
        
        self.dispute.refresh_from_db()
        assert self.dispute.status == 'closed'
        assert "Settled via Mediation" in self.dispute.resolution
        
        self.booking.refresh_from_db()
        assert self.booking.escrow_status == 'RELEASED'
