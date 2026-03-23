"""
Unit tests for SovereignGateService
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.disputes.models import Dispute, MediationSession, SettlementOffer, EvidenceLog
from apps.disputes.admin_service import SovereignGateService
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class TestSovereignGateService(TestCase):
    """Test admin approval workflow (The Sovereign Gate)"""
    
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
            title="Expensive Claim",
            description="High value issue",
            booking=self.booking,
            user=self.user,
            claimed_amount=Decimal("10000.00")
        )
        
        self.session = MediationSession.objects.create(
            dispute=self.dispute,
            expires_at=timezone.now() + timedelta(days=3)
        )
        
        self.pending_offer = SettlementOffer.objects.create(
            session=self.session,
            source='system',
            amount=Decimal("6000.00"),
            reasoning="Based on precedents",
            status=SettlementOffer.Status.PENDING_REVIEW
        )
    
    def test_approve_offer_changes_status_to_visible(self):
        """Approving offer should change status to VISIBLE"""
        SovereignGateService.approve_offer(self.pending_offer.id, self.admin)
        
        self.pending_offer.refresh_from_db()
        self.assertEqual(self.pending_offer.status, SettlementOffer.Status.VISIBLE)
        self.assertEqual(self.pending_offer.approved_by, self.admin)
        self.assertIsNotNone(self.pending_offer.approved_at)
    
    def test_approve_offer_logs_action(self):
        """Approving offer should create EvidenceLog entry"""
        initial_count = EvidenceLog.objects.count()
        
        SovereignGateService.approve_offer(self.pending_offer.id, self.admin)
        
        self.assertEqual(EvidenceLog.objects.count(), initial_count + 1)
        
        log = EvidenceLog.objects.latest('timestamp')
        self.assertEqual(log.actor, self.admin)
        self.assertIn('SOVEREIGN_GATE_OPEN', log.action)
    
    def test_reject_offer_changes_status(self):
        """Rejecting offer should change status to REJECTED"""
        SovereignGateService.reject_offer(self.pending_offer.id, self.admin, "Too high")
        
        self.pending_offer.refresh_from_db()
        self.assertEqual(self.pending_offer.status, SettlementOffer.Status.REJECTED)
    
    def test_reject_offer_logs_action(self):
        """Rejecting offer should create EvidenceLog entry"""
        initial_count = EvidenceLog.objects.count()
        
        SovereignGateService.reject_offer(self.pending_offer.id, self.admin, "Unreasonable amount")
        
        self.assertEqual(EvidenceLog.objects.count(), initial_count + 1)
        
        log = EvidenceLog.objects.latest('timestamp')
        self.assertEqual(log.actor, self.admin)
        self.assertIn('SOVEREIGN_GATE_CLOSE', log.action)
    
    def test_cannot_approve_already_visible_offer(self):
        """Cannot approve an already visible offer"""
        self.pending_offer.status = SettlementOffer.Status.VISIBLE
        self.pending_offer.save()
        
        with self.assertRaises(ValueError):
            SovereignGateService.approve_offer(self.pending_offer.id, self.admin)
    
    def test_cannot_reject_already_rejected_offer(self):
        """Cannot reject an already rejected offer"""
        self.pending_offer.status = SettlementOffer.Status.REJECTED
        self.pending_offer.save()
        
        with self.assertRaises(ValueError):
            SovereignGateService.reject_offer(self.pending_offer.id, self.admin, "Reason")
