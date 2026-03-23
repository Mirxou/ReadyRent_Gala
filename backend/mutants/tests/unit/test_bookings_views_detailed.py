import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock

from apps.bookings.models import Cart, CartItem, Booking, Waitlist, DamageAssessment, Cancellation
from apps.products.models import Category, Product

User = get_user_model()

@pytest.fixture
def booking_setup(db):
    user = User.objects.create_user(username='buser', email='b@example.com', password='pass')
    category = Category.objects.create(name='Electronics', slug='elec')
    product = Product.objects.create(
        name='Camera', name_ar='كاميرا', price_per_day=Decimal('500.00'), 
        category=category, status='available', slug='camera'
    )
    return user, product

@pytest.mark.unit
@pytest.mark.django_db
class TestCartViews:
    """Test Cart management"""
    
    def test_cart_operations(self, api_client, booking_setup):
        user, product = booking_setup
        api_client.force_authenticate(user=user)
        
        # 1. Add to cart
        data = {
            'product_id': product.id,
            'quantity': 1,
            'start_date': timezone.now().date() + timedelta(days=1),
            'end_date': timezone.now().date() + timedelta(days=3)
        }
        response = api_client.post('/api/bookings/cart/items/', data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # 2. Get cart
        response = api_client.get('/api/bookings/cart/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['items']) == 1
        
        # 3. Delete item
        item_id = response.data['items'][0]['id']
        response = api_client.delete(f'/api/bookings/cart/items/{item_id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT

@pytest.mark.unit
@pytest.mark.django_db
class TestBookingProcess:
    """Test Booking creation and management"""
    
    @patch('apps.bookings.availability_service.AvailabilityService.check_availability')
    def test_create_booking_success(self, mock_check, api_client, booking_setup):
        user, product = booking_setup
        api_client.force_authenticate(user=user)
        
        start = timezone.now().date() + timedelta(days=1)
        end = start + timedelta(days=2)
        CartItem.objects.create(
            cart=Cart.objects.get_or_create(user=user)[0],
            product=product,
            quantity=1,
            start_date=start,
            end_date=end
        )
        
        mock_check.return_value = {'available': True}
        
        response = api_client.post('/api/bookings/create/', {})
        assert response.status_code == status.HTTP_201_CREATED

    def test_update_booking_status_admin(self, api_client, booking_setup):
        user, product = booking_setup
        admin = User.objects.create_superuser(username='admin_b', email='ab@example.com', password='pass', role='admin')
        booking = Booking.objects.create(
            user=user, product=product, start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=1),
            total_days=2, total_price=Decimal('1000.00'), status='pending'
        )
        
        api_client.force_authenticate(user=admin)
        response = api_client.patch(f'/api/bookings/{booking.id}/status/', {'status': 'confirmed'})
        assert response.status_code == status.HTTP_200_OK

@pytest.mark.unit
@pytest.mark.django_db
class TestBookingOperations:
    """Test cancellation, stats, waitlist"""
    
    def test_admin_stats(self, api_client):
        admin = User.objects.create_superuser(username='admins', email='as@example.com', password='pass', role='admin')
        api_client.force_authenticate(user=admin)
        response = api_client.get('/api/bookings/admin/stats/')
        assert response.status_code == status.HTTP_200_OK

    def test_waitlist_flow(self, api_client, booking_setup):
        user, product = booking_setup
        api_client.force_authenticate(user=user)
        response = api_client.post('/api/bookings/waitlist/add/', {'product_id': product.id})
        assert response.status_code == status.HTTP_201_CREATED

@pytest.mark.unit
@pytest.mark.django_db
class TestDamageAssessment:
    """Test damage assessment views"""
    
    def test_damage_assessment_full_flow(self, api_client, booking_setup):
        user, product = booking_setup
        staff = User.objects.create_user(username='staff_d', email='sd@example.com', password='pass', role='staff')
        booking = Booking.objects.create(
            user=user, product=product, start_date=timezone.now().date(),
            end_date=timezone.now().date(), total_days=1, total_price=Decimal('500.00'), status='completed'
        )
        
        # 1. Create Assessment
        api_client.force_authenticate(user=staff)
        data = {
            'booking_id': booking.id,
            'severity': 'minor',
            'damage_description': 'Scratches'
        }
        response = api_client.post('/api/bookings/damage-assessment/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assessment_id = response.data['id']
        
        # 2. Add checklist item
        api_client.post('/api/bookings/inspection-checklist/', {
            'assessment_id': assessment_id,
            'item_name': 'Lens',
            'is_checked': True
        })
        
        # 3. Create claim (as user)
        api_client.force_authenticate(user=user)
        response = api_client.post('/api/bookings/damage-claims/', {
            'assessment_id': assessment_id,
            'claimed_amount': '100.00',
            'claim_description': 'I agree'
        })
        assert response.status_code == status.HTTP_201_CREATED

        # 4. Update assessment (staff)
        api_client.force_authenticate(user=staff)
        response = api_client.patch(f'/api/bookings/damage-assessment/{assessment_id}/', {
            'severity': 'moderate'
        })
        assert response.status_code == status.HTTP_200_OK

    def test_booking_cancel_permission_denied(self, api_client, booking_setup):
        user, product = booking_setup
        other_user = User.objects.create_user(username='other', email='other@example.com', password='pass')
        booking = Booking.objects.create(
            user=user, product=product, start_date=timezone.now().date() + timedelta(days=5),
            end_date=timezone.now().date() + timedelta(days=7),
            total_days=3, total_price=Decimal('1500.00'), status='confirmed'
        )
        api_client.force_authenticate(user=other_user)
        
        response = api_client.post(f'/api/bookings/{booking.id}/cancel/', {'reason': 'Steal'})
        assert response.status_code == status.HTTP_403_FORBIDDEN

@pytest.mark.unit
@pytest.mark.django_db
class TestBookingLifecycle:
    """Test cancellation and early return"""

    @patch('apps.bookings.services.BookingService.cancel_booking')
    def test_cancel_booking(self, mock_cancel, api_client, booking_setup):
        user, product = booking_setup
        booking = Booking.objects.create(
            user=user, product=product, start_date=timezone.now().date() + timedelta(days=5),
            end_date=timezone.now().date() + timedelta(days=7),
            total_days=3, total_price=Decimal('1500.00'), status='confirmed'
        )
        api_client.force_authenticate(user=user)
        
        cancellation = Cancellation(booking=booking, cancelled_by=user, reason='Test')
        mock_cancel.return_value = (cancellation, None)
        
        response = api_client.post(f'/api/bookings/{booking.id}/cancel/', {'reason': 'Change'})
        assert response.status_code == status.HTTP_200_OK

    @patch('apps.bookings.services.BookingService.process_early_return')
    def test_early_return(self, mock_return, api_client, booking_setup):
        user, product = booking_setup
        booking = Booking.objects.create(
            user=user, product=product, start_date=timezone.now().date() - timedelta(days=2),
            end_date=timezone.now().date() + timedelta(days=2),
            total_days=5, total_price=Decimal('2500.00'), status='in_use'
        )
        api_client.force_authenticate(user=user)
        mock_return.return_value = (None, {'refund_amount': 0})
        response = api_client.post(f'/api/bookings/{booking.id}/early-return/', {'return_date': str(timezone.now().date())})
        assert response.status_code == status.HTTP_200_OK

    def test_admin_booking_management(self, api_client, booking_setup):
        user, product = booking_setup
        admin = User.objects.create_superuser(username='staff_b', email='sb@example.com', password='pass', role='admin')
        booking = Booking.objects.create(user=user, product=product, start_date=timezone.now().date(), end_date=timezone.now().date(), total_days=1, total_price=Decimal('500.00'), status='pending')
        api_client.force_authenticate(user=admin)
        
        response = api_client.get('/api/bookings/admin/')
        assert response.status_code == status.HTTP_200_OK
        
        api_client.put(f'/api/bookings/admin/{booking.id}/', {
            'status': 'confirmed', 'product': product.id, 'user': user.id,
            'start_date': str(booking.start_date), 'end_date': str(booking.end_date),
            'total_days': 1, 'total_price': '500.00'
        })
        assert response.status_code == status.HTTP_200_OK
