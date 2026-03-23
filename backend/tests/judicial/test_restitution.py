import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework.test import APIClient
from apps.bookings.models import Booking, Refund
from apps.disputes.models import Dispute, Judgment
from apps.disputes.adjudication_service import AdjudicationService
from django.utils import timezone
from datetime import timedelta

@pytest.mark.django_db
class TestRestitutionService:
    def setup_method(self):
        self.client = APIClient()
        # Setup helpers
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.owner = User.objects.create_user(username='owner', email='owner@example.com', password='password')
        self.tenant = User.objects.create_user(username='tenant', email='tenant@example.com', password='password')
        
        # Product
        from apps.products.models import Product, Category
        category = Category.objects.create(name="Test Cat", slug="test-cat")
        self.product = Product.objects.create(
            owner=self.owner, 
            category=category,
            name="Test Product",
            price_per_day=100
        )
        
        # Booking with Escrow HELD
        from apps.bookings.models import Booking
        self.booking = Booking.objects.create(
            user=self.tenant,
            product=self.product,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=2),
            total_days=2,
            total_price=200, # 2 days * 100
            status='confirmed',
            escrow_status='HELD',
            beneficiary=self.owner
        )
        
        # Dispute
        self.dispute = Dispute.objects.create(
            user=self.tenant,
            booking=self.booking,
            title="Item broken",
            description="It broke.",
            status='under_review'
        )
        
        # Initial Judgment
        self.judgment = Judgment.objects.create(
            dispute=self.dispute,
            verdict='pending',
            ruling_text="Draft",
            status='provisional'
        )

    def test_restitution_favor_owner(self):
        """Test that ruling in favor of owner releases escrow."""
        self.judgment.verdict = 'favor_owner'
        self.judgment.ruling_text = "Tenant is liable."
        self.judgment.save()
        
        # Finalize
        AdjudicationService.finalize_judgment(self.judgment)
        
        # Check booking escrow status
        self.booking.refresh_from_db()
        assert self.booking.escrow_status == 'RELEASED'

    def test_restitution_favor_tenant(self):
        """Test that ruling in favor of tenant triggers refund."""
        self.judgment.verdict = 'favor_tenant'
        self.judgment.ruling_text = "Owner is at fault."
        self.judgment.save()
        
        AdjudicationService.finalize_judgment(self.judgment)
        
        self.booking.refresh_from_db()
        # Should be REFUNDED or at least have a Refund record
        assert self.booking.escrow_status == 'REFUNDED'
        
        refund = Refund.objects.filter(booking=self.booking).first()
        assert refund is not None
        assert refund.amount == self.booking.total_price
        assert refund.status == 'completed'

    def test_restitution_split_verdict(self):
        """Test split verdict handling."""
        self.judgment.verdict = 'split'
        self.judgment.awarded_amount = Decimal('50.00') # Refund 50 to tenant
        self.judgment.ruling_text = "Split liability."
        self.judgment.save()
        
        AdjudicationService.finalize_judgment(self.judgment)
        
        self.booking.refresh_from_db()
        # Split usually implies some release, so we mark as RELEASED in our logic
        assert self.booking.escrow_status == 'RELEASED'
        
        refund = Refund.objects.filter(booking=self.booking).first()
        assert refund is not None
        assert refund.amount == Decimal('50.00')
