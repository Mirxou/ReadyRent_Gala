"""
Integration tests for dispute resolution flow
"""
import pytest
from django.contrib.auth import get_user_model
from apps.disputes.models import Dispute, DisputeMessage
from apps.bookings.models import Booking
from apps.products.models import Category, Product
from decimal import Decimal
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.integration
@pytest.mark.django_db
class TestDisputeResolutionFlow:
    """Test complete dispute resolution flow"""
    
    def test_dispute_creation_flow(self, regular_user, product):
        """Test: User creates dispute -> Admin reviews -> Resolution"""
        
        # Create a booking first
        booking = Booking.objects.create(
            user=regular_user,
            product=product,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=3),
            total_days=2,
            total_price=Decimal('5000.00'),
            status='completed'
        )
        
        # 1. User creates dispute
        dispute = Dispute.objects.create(
            user=regular_user,
            booking=booking,
            title='Product damaged',
            title_ar='المنتج تالف',
            description='The dress arrived damaged',
            description_ar='الفسستان وصل تالف',
            status='open',
            priority='high'
        )
        
        assert dispute.status == 'open'
        assert dispute.user == regular_user
        assert dispute.booking == booking
        
        # 2. Admin assigns dispute
        admin_user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            username='admin',
            role='admin',
            is_staff=True
        )
        
        dispute.assigned_to = admin_user
        dispute.status = 'under_review'
        dispute.save()
        
        assert dispute.assigned_to == admin_user
        assert dispute.status == 'under_review'
        
        # 3. Add messages
        message1 = DisputeMessage.objects.create(
            dispute=dispute,
            sender=regular_user,
            message='I want a refund',
            message_ar='أريد استرداد المال'
        )
        
        message2 = DisputeMessage.objects.create(
            dispute=dispute,
            sender=admin_user,
            message='We will investigate',
            message_ar='سنقوم بالتحقيق'
        )
        
        assert dispute.messages.count() == 2
        
        # 4. Admin resolves dispute
        dispute.status = 'resolved'
        dispute.resolution = 'Refund processed'
        dispute.resolution_ar = 'تم استرداد المال'
        dispute.resolved_by = admin_user
        dispute.save()
        
        assert dispute.status == 'resolved'
        assert dispute.resolved_by == admin_user
    
    def test_dispute_mediation_flow(self, regular_user, product):
        """Test: Dispute goes to mediation -> Resolution"""
        
        booking = Booking.objects.create(
            user=regular_user,
            product=product,
            start_date=date.today() + timedelta(days=1),
            end_date=date.today() + timedelta(days=3),
            total_days=2,
            total_price=Decimal('5000.00'),
            status='completed'
        )
        
        dispute = Dispute.objects.create(
            user=regular_user,
            booking=booking,
            title='Service issue',
            description='Poor service quality',
            status='open'
        )
        
        # Move to mediation
        dispute.status = 'in_mediation'
        dispute.save()
        
        assert dispute.status == 'in_mediation'
        
        # Resolve
        dispute.status = 'resolved'
        dispute.resolution = 'Issue resolved through mediation'
        dispute.save()
        
        assert dispute.status == 'resolved'

