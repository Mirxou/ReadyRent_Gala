"""
Integration tests for return flow
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.products.models import Category, Product
from apps.bookings.models import Booking
from apps.returns.models import Return

User = get_user_model()


class ReturnFlowTest(TestCase):
    """Test complete return flow"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.category = Category.objects.create(
            name='Dresses',
            name_ar='فساتين',
            slug='dresses'
        )
        
        self.product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان تجريبي',
            slug='test-dress',
            description='Test',
            category=self.category,
            price_per_day=1000.00,
            size='M',
            color='Red'
        )
        
        self.start_date = timezone.now().date() - timedelta(days=3)
        self.end_date = timezone.now().date() - timedelta(days=1)
        
        # Create completed booking
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=self.start_date,
            end_date=self.end_date,
            total_days=3,
            total_price=3000.00,
            status='completed'
        )
    
    def test_return_flow(self):
        """Test: Create return -> Inspection -> Complete return"""
        
        # 1. Create return request
        return_obj = Return.objects.create(
            booking=self.booking,
            reason='No longer needed',
            condition='good'
        )
        
        self.assertEqual(return_obj.booking, self.booking)
        self.assertEqual(return_obj.status, 'pending')
        
        # 2. Approve return
        return_obj.status = 'approved'
        return_obj.save()
        
        # 3. Mark as received
        return_obj.status = 'received'
        return_obj.save()
        
        # 4. Complete inspection
        return_obj.damage_assessment = 'No damage'
        return_obj.cleaning_required = True
        return_obj.status = 'inspected'
        return_obj.save()
        
        # 5. Complete return
        return_obj.status = 'completed'
        return_obj.save()
        
        self.assertEqual(return_obj.status, 'completed')

