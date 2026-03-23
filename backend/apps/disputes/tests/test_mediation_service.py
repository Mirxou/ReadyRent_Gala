"""
Unit tests for MediationService
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from unittest.mock import patch, MagicMock

from apps.disputes.models import Dispute, MediationSession, SettlementOffer, Judgment
from apps.disputes.mediation_service import MediationService
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class TestMediationService(TestCase):
    """Test mediation and settlement logic"""
    
    def setUp(self):
        """Create test data"""
        self.user = User.objects.create_user(email="test@example.com", password="test123")
        self.admin = User.objects.create_user(email="admin@example.com", password="admin123", is_staff=True)
        
        category = Category.objects.create(name="Electronics")
        product = Product.objects.create(name="Camera", category=category, owner=self.admin, price_per_day=Decimal("100.00"))
        self.booking = Booking.objects.create(
            user=self.user,
            product=product,
            total_price=Decimal("1000.00"),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=1)
        )
        
        self.dispute = Dispute.objects.create(
            title="Camera Broken",
            description="Lens cracked",
            booking=self.booking,
            user=self.user,
            claimed_amount=Decimal("3000.00")
        )
    
    def test_start_mediation_creates_session(self):
        """Starting mediation should create a MediationSession"""
        session = MediationService.start_mediation(self.dispute)
        
        self.assertIsNotNone(session)
        self.assertEqual(session.dispute, self.dispute)
        self.assertEqual(session.status, 'active')
    
    @patch('apps.disputes.mediation_service.PrecedentSearchService')
    def test_generate_system_offer_calculates_amount(self, mock_precedent):
        """System should generate offer based on precedents"""
        # Mock precedent search
        mock_precedent.search.return_value = [
            {'judgment_id': 1, 'similarity': 0.9, 'awarded_ratio': 0.5}
        ]
        
        session = MediationService.start_mediation(self.dispute)
        offer = MediationService.generate_system_offer(session)
        
        self.assertIsNotNone(offer)
        self.assertEqual(offer.source, 'system')
        self.assertGreater(offer.amount, 0)
    
    def test_high_value_offer_pending_review(self):
        """Offers > 5000 DZD should be PENDING_REVIEW"""
        # Create high-value dispute
        high_dispute = Dispute.objects.create(
            title="Expensive Item",
            description="High value claim",
            booking=self.booking,
            user=self.user,
            claimed_amount=Decimal("12000.00")
        )
        
        session = MediationService.start_mediation(high_dispute)
        
        # Mock precedent to return 50% award
        with patch('apps.disputes.mediation_service.PrecedentSearchService') as mock:
            mock.search.return_value = [{'judgment_id': 1, 'similarity': 0.9, 'awarded_ratio': 0.5}]
            offer = MediationService.generate_system_offer(session)
        
        # 50% of 12000 = 6000 > 5000 threshold
        self.assertEqual(offer.status, SettlementOffer.Status.PENDING_REVIEW)
    
    def test_low_value_offer_visible(self):
        """Offers <= 5000 DZD should be VISIBLE"""
        session = MediationService.start_mediation(self.dispute)
        
        # Mock precedent to return 30% award
        with patch('apps.disputes.mediation_service.PrecedentSearchService') as mock:
            mock.search.return_value = [{'judgment_id': 1, 'similarity': 0.9, 'awarded_ratio': 0.3}]
            offer = MediationService.generate_system_offer(session)
        
        # 30% of 3000 = 900 < 5000 threshold
        self.assertEqual(offer.status, SettlementOffer.Status.VISIBLE)
    
    def test_accept_offer_closes_dispute(self):
        """Accepting offer should close dispute"""
        session = MediationService.start_mediation(self.dispute)
        
        offer = SettlementOffer.objects.create(
            session=session,
            source='system',
            amount=Decimal("1500.00"),
            reasoning="Test offer",
            status=SettlementOffer.Status.VISIBLE
        )
        
        MediationService.accept_offer(offer)
        
        offer.refresh_from_db()
        self.dispute.refresh_from_db()
        
        self.assertTrue(offer.is_accepted)
        self.assertEqual(self.dispute.status, 'closed')
    
    def test_reject_offer_increments_round(self):
        """Rejecting offer should increment mediation round"""
        session = MediationService.start_mediation(self.dispute)
        initial_round = session.current_round
        
        offer = SettlementOffer.objects.create(
            session=session,
            source='system',
            amount=Decimal("1500.00"),
            reasoning="Test offer",
            status=SettlementOffer.Status.VISIBLE
        )
        
        MediationService.reject_offer(offer)
        
        session.refresh_from_db()
        self.assertEqual(session.current_round, initial_round + 1)
