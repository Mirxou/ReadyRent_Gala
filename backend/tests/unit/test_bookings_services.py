"""
Tests for Bookings Service (Dispute, Escrow, Financial)
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from apps.bookings.models import Booking, Escrow
from apps.bookings.services_dispute import DisputeService
from apps.bookings.services_escrow import EscrowService
from apps.bookings.services_financial import FinancialService
from apps.products.models import Category, Product
from apps.disputes.models import Dispute, DisputeMessage
from django.contrib.auth import get_user_model

User = get_user_model()


class BookingEscrowServiceTestCase(TestCase):
    """Test Escrow Service functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(
            email='renter@example.com',
            username='renter',
            password='pass123'
        )
        
        self.user2 = User.objects.create_user(
            email='owner@example.com',
            username='owner',
            password='pass123'
        )
        
        self.category = Category.objects.create(
            name='Test',
            slug='test',
            is_active=True
        )
        
        self.product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user2,
            category=self.category,
            price_per_day=Decimal('1000.00'),
            status='available'
        )
        
        self.booking = Booking.objects.create(
            user=self.user1,
            product=self.product,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=3),
            status='pending',
            total_price=Decimal('3000.00')
        )
    
    def test_create_escrow_hold(self):
        """Test creating escrow hold"""
        escrow = EscrowService.create_escrow_hold(self.booking)
        
        assert escrow is not None
        assert escrow.booking == self.booking
        assert escrow.status == 'HELD'
        assert escrow.amount == self.booking.total_price
    
    def test_release_escrow_on_completion(self):
        """Test releasing escrow on booking completion"""
        escrow = EscrowService.create_escrow_hold(self.booking)
        
        # Complete booking
        self.booking.status = 'completed'
        self.booking.save()
        
        released = EscrowService.release_escrow(self.booking)
        
        assert released is True
        escrow.refresh_from_db()
        assert escrow.status == 'RELEASED'
    
    def test_release_escrow_on_cancellation(self):
        """Test releasing escrow on booking cancellation"""
        escrow = EscrowService.create_escrow_hold(self.booking)
        
        # Cancel booking
        cancelled = EscrowService.cancel_escrow(self.booking)
        
        assert cancelled is True
        escrow.refresh_from_db()
        assert escrow.status == 'CANCELLED'
    
    def test_escrow_hold_prevents_duplicate(self):
        """Test that duplicate escrow holds are prevented"""
        EscrowService.create_escrow_hold(self.booking)
        
        # Try to create another
        escrow2 = EscrowService.create_escrow_hold(self.booking)
        
        # Should return existing escrow, not create new one
        assert Escrow.objects.filter(booking=self.booking).count() == 1


class BookingFinancialServiceTestCase(TestCase):
    """Test Financial Service functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(
            email='renter@example.com',
            username='renter'
        )
        
        self.user2 = User.objects.create_user(
            email='owner@example.com',
            username='owner'
        )
        
        self.category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        self.product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user2,
            category=self.category,
            price_per_day=Decimal('1000.00')
        )
    
    def test_calculate_booking_cost(self):
        """Test calculating booking cost"""
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=3)
        
        cost = FinancialService.calculate_booking_cost(
            self.product,
            start_date,
            end_date
        )
        
        # 3 days × 1000 = 3000
        assert cost == Decimal('3000.00')
    
    def test_calculate_cost_with_discount(self):
        """Test calculating cost with discount"""
        self.product.discount_percentage = 10  # 10% discount
        self.product.save()
        
        start_date = date.today() + timedelta(days=1)
        end_date = start_date + timedelta(days=3)
        
        cost = FinancialService.calculate_booking_cost(
            self.product,
            start_date,
            end_date,
            apply_discounts=True
        )
        
        # 3000 - 10% = 2700
        assert cost == Decimal('2700.00')
    
    def test_calculate_fees(self):
        """Test calculating booking fees"""
        booking_cost = Decimal('3000.00')
        
        fees = FinancialService.calculate_fees(booking_cost)
        
        # Fees should be calculated
        assert fees > 0
        assert isinstance(fees, Decimal)
    
    def test_payment_distribution(self):
        """Test distributing payment to owner and platform"""
        total_amount = Decimal('3000.00')
        
        owner_amount, platform_amount = FinancialService.distribute_payment(total_amount)
        
        assert owner_amount + platform_amount == total_amount
        assert owner_amount > 0
        assert platform_amount > 0


class BookingDisputeServiceTestCase(TestCase):
    """Test Dispute Service functionality"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(
            email='renter@example.com',
            username='renter'
        )
        
        self.user2 = User.objects.create_user(
            email='owner@example.com',
            username='owner'
        )
        
        self.category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        self.product = Product.objects.create(
            name='Product',
            slug='product',
            owner=self.user2,
            category=self.category,
            price_per_day=Decimal('1000.00')
        )
        
        self.booking = Booking.objects.create(
            user=self.user1,
            product=self.product,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=3),
            status='completed'
        )
    
    def test_create_dispute(self):
        """Test creating a dispute"""
        dispute = DisputeService.create_dispute(
            booking=self.booking,
            raised_by=self.user1,
            reason='damaged_item',
            description='Item was damaged'
        )
        
        assert dispute is not None
        assert dispute.booking == self.booking
        assert dispute.status == 'open'
        assert dispute.raised_by == self.user1
    
    def test_add_dispute_message(self):
        """Test adding message to dispute"""
        dispute = Dispute.objects.create(
            booking=self.booking,
            raised_by=self.user1,
            reason='damaged_item',
            description='Damaged',
            status='open'
        )
        
        message = DisputeService.add_message(
            dispute=dispute,
            message_from=self.user1,
            content='Here is evidence',
            evidence_type='image'
        )
        
        assert message is not None
        assert message.dispute == dispute
        assert message.message_from == self.user1
    
    def test_resolve_dispute(self):
        """Test resolving a dispute"""
        dispute = Dispute.objects.create(
            booking=self.booking,
            raised_by=self.user1,
            reason='damaged_item',
            status='open'
        )
        
        resolved = DisputeService.resolve_dispute(
            dispute=dispute,
            resolved_by=self.user2,
            resolution='full_refund',
            refund_amount=self.booking.total_price
        )
        
        assert resolved is True
        dispute.refresh_from_db()
        assert dispute.status == 'resolved'
    
    def test_escalate_dispute(self):
        """Test escalating dispute to tribunal"""
        dispute = Dispute.objects.create(
            booking=self.booking,
            raised_by=self.user1,
            reason='damaged_item',
            status='open'
        )
        
        escalated = DisputeService.escalate_to_tribunal(dispute)
        
        assert escalated is True
        dispute.refresh_from_db()
        assert dispute.status == 'tribunal_review'
