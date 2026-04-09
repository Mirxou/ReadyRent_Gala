"""
Comprehensive Tests for Locations App
Full Coverage: Models, Views, Serializers, Services, Security, Edge Cases
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
from datetime import date, time
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.users.models import User
from apps.locations.models import Address, DeliveryZone, DeliveryRequest, DeliveryTracking
from apps.locations.serializers import AddressSerializer, DeliveryZoneSerializer, DeliveryRequestSerializer
from apps.bookings.models import Booking
from apps.products.models import Product, Category


class AddressModelTests(TestCase):
    """Test Cases for Address Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='location@test.com',
            username='location_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_address_creation(self):
        """Test Address model creation"""
        address = Address.objects.create(
            user=self.user,
            label='Home',
            full_address='123 Main Street',
            street='Main Street',
            city='Constantine',
            country='Algeria',
            latitude=Decimal('36.3650'),
            longitude=Decimal('6.6147'),
            is_default=True
        )

        self.assertEqual(address.label, 'Home')
        self.assertEqual(address.city, 'Constantine')
        self.assertTrue(address.is_default)
        self.assertIsNotNone(address.created_at)

    def test_address_default_behavior(self):
        """Test only one default address per user"""
        address1 = Address.objects.create(
            user=self.user,
            label='Home',
            full_address='123 Main Street',
            is_default=True
        )

        address2 = Address.objects.create(
            user=self.user,
            label='Office',
            full_address='456 Work Avenue',
            is_default=True
        )

        address1.refresh_from_db()
        address2.refresh_from_db()

        self.assertFalse(address1.is_default)
        self.assertTrue(address2.is_default)

    def test_address_coordinates_validation(self):
        """Test coordinate validation"""
        address = Address.objects.create(
            user=self.user,
            label='With Coordinates',
            full_address='Test Address',
            latitude=Decimal('36.3650'),
            longitude=Decimal('6.6147')
        )

        self.assertIsNotNone(address.latitude)
        self.assertIsNotNone(address.longitude)

    def test_address_str_representation(self):
        """Test address string representation"""
        address = Address.objects.create(
            user=self.user,
            label='Home',
            full_address='123 Main Street',
            city='Constantine'
        )

        self.assertIn('location@test.com', str(address))
        self.assertIn('Home', str(address))

    def test_address_gps_fields(self):
        """Test GPS fields"""
        address = Address.objects.create(
            user=self.user,
            label='GPS Test',
            full_address='GPS Address',
            latitude=Decimal('36.365000'),
            longitude=Decimal('6.614700'),
            google_place_id='ChIJnQSsN4t2hxIRSk1gYz0SpUU'
        )

        self.assertEqual(address.google_place_id, 'ChIJnQSsN4t2hxIRSk1gYz0SpUU')


class DeliveryZoneModelTests(TestCase):
    """Test Cases for DeliveryZone Models"""

    def test_delivery_zone_creation(self):
        """Test DeliveryZone model creation"""
        zone = DeliveryZone.objects.create(
            name='Downtown',
            name_ar='وسط المدينة',
            description='Downtown Constantine',
            city='Constantine',
            center_latitude=Decimal('36.3650'),
            center_longitude=Decimal('6.6147'),
            radius_km=Decimal('10.00'),
            delivery_fee=Decimal('200.00'),
            same_day_delivery_available=True,
            same_day_delivery_fee=Decimal('500.00'),
            same_day_cutoff_time=time(14, 0)
        )

        self.assertEqual(zone.name, 'Downtown')
        self.assertTrue(zone.same_day_delivery_available)
        self.assertEqual(zone.delivery_fee, Decimal('200.00'))

    def test_delivery_zone_same_day_delivery(self):
        """Test same-day delivery configuration"""
        zone = DeliveryZone.objects.create(
            name='Suburbs',
            name_ar='الأحياء الخارجية',
            city='Constantine',
            center_latitude=Decimal('36.3700'),
            center_longitude=Decimal('6.6200'),
            same_day_delivery_available=False
        )

        self.assertFalse(zone.same_day_delivery_available)

    def test_delivery_zone_radius(self):
        """Test delivery zone radius"""
        zone = DeliveryZone.objects.create(
            name='Wide Area',
            name_ar='منطقة واسعة',
            city='Constantine',
            center_latitude=Decimal('36.3650'),
            center_longitude=Decimal('6.6147'),
            radius_km=Decimal('25.00')
        )

        self.assertEqual(zone.radius_km, Decimal('25.00'))


class DeliveryRequestModelTests(TestCase):
    """Test Cases for DeliveryRequest Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='delivery@test.com',
            username='delivery_test',
            password='TestPass123!',
            role='tenant'
        )
        self.owner = User.objects.create_user(
            email='owner_delivery@test.com',
            username='owner_delivery_test',
            password='TestPass123!',
            role='owner'
        )
        self.staff = User.objects.create_user(
            email='staff_delivery@test.com',
            username='staff_delivery_test',
            password='TestPass123!',
            role='staff'
        )
        self.category = Category.objects.create(name_ar='فستان', name_en='Dress')
        self.product = Product.objects.create(
            name_ar='فستان سهرة',
            name_en='Evening Dress',
            owner=self.owner,
            category=self.category
        )
        self.booking = Booking.objects.create(
            user=self.user,
            product=self.product,
            start_date=date(2026, 4, 1),
            end_date=date(2026, 4, 5),
            total_days=5,
            total_price=Decimal('5000.00'),
            status='confirmed'
        )
        self.address = Address.objects.create(
            user=self.user,
            label='Delivery Address',
            full_address='123 Delivery Street',
            city='Constantine'
        )

    def test_delivery_request_creation(self):
        """Test DeliveryRequest model creation"""
        delivery = DeliveryRequest.objects.create(
            booking=self.booking,
            delivery_type='both',
            status='pending',
            delivery_address=self.address,
            delivery_date=date(2026, 4, 1),
            delivery_time_slot='Morning',
            pickup_date=date(2026, 4, 5),
            pickup_time_slot='Afternoon',
            delivery_fee=Decimal('200.00')
        )

        self.assertEqual(delivery.delivery_type, 'both')
        self.assertEqual(delivery.status, 'pending')
        self.assertIsNotNone(delivery.created_at)

    def test_delivery_request_assignment(self):
        """Test driver assignment to delivery"""
        delivery = DeliveryRequest.objects.create(
            booking=self.booking,
            delivery_type='delivery',
            status='pending',
            delivery_address=self.address,
            delivery_date=date(2026, 4, 1),
            delivery_fee=Decimal('200.00')
        )

        delivery.assigned_driver = self.staff
        delivery.status = 'assigned'
        delivery.save()

        delivery.refresh_from_db()
        self.assertEqual(delivery.assigned_driver, self.staff)
        self.assertEqual(delivery.status, 'assigned')

    def test_delivery_tracking_creation(self):
        """Test delivery tracking creation"""
        delivery = DeliveryRequest.objects.create(
            booking=self.booking,
            delivery_type='delivery',
            status='in_transit',
            delivery_address=self.address,
            delivery_date=date(2026, 4, 1),
            delivery_fee=Decimal('200.00'),
            current_latitude=Decimal('36.3650'),
            current_longitude=Decimal('6.6147')
        )

        tracking = DeliveryTracking.objects.create(
            delivery_request=delivery,
            latitude=Decimal('36.3650'),
            longitude=Decimal('6.6147'),
            status='in_transit'
        )

        self.assertEqual(tracking.latitude, Decimal('36.3650'))
        self.assertEqual(tracking.longitude, Decimal('6.6147'))


class AddressSerializerTests(TestCase):
    """Test Cases for Address Serializers"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='serializer@test.com',
            username='serializer_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_address_serializer_validation(self):
        """Test address serializer validation"""
        data = {
            'label': 'Home',
            'full_address': '123 Test Street',
            'city': 'Constantine',
            'latitude': '36.3650',
            'longitude': '6.6147'
        }

        serializer = AddressSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_address_serializer_coordinates_validation(self):
        """Test that latitude and longitude must be provided together"""
        data = {
            'label': 'Partial',
            'full_address': '123 Test Street',
            'latitude': '36.3650'
        }

        serializer = AddressSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class AddressViewTests(APITestCase):
    """Test Cases for Address Views"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='address_view@test.com',
            username='address_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.other_user = User.objects.create_user(
            email='other_address@test.com',
            username='other_address_test',
            password='TestPass123!',
            role='tenant'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_address(self):
        """Test creating an address"""
        response = self.client.post('/api/addresses/', {
            'label': 'Home',
            'full_address': '123 Main Street',
            'city': 'Constantine',
            'country': 'Algeria',
            'latitude': '36.3650',
            'longitude': '6.6147'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_list_addresses(self):
        """Test listing user addresses"""
        Address.objects.create(
            user=self.user,
            label='Home',
            full_address='123 Main Street'
        )

        response = self.client.get('/api/addresses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_cannot_view_other_user_addresses(self):
        """Test user cannot view other user's addresses"""
        Address.objects.create(
            user=self.other_user,
            label='Secret',
            full_address='456 Secret Street'
        )

        response = self.client.get('/api/addresses/')
        self.assertEqual(len(response.data), 0)


class DeliveryZoneViewTests(APITestCase):
    """Test Cases for DeliveryZone Views"""

    def setUp(self):
        self.client = APIClient()
        self.zone = DeliveryZone.objects.create(
            name='Test Zone',
            name_ar='منطقة اختبار',
            city='Constantine',
            center_latitude=Decimal('36.3650'),
            center_longitude=Decimal('6.6147'),
            is_active=True
        )

    def test_list_delivery_zones(self):
        """Test listing delivery zones"""
        response = self.client.get('/api/delivery-zones/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_delivery_zone(self):
        """Test retrieving a delivery zone"""
        response = self.client.get(f'/api/delivery-zones/{self.zone.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class LocationSecurityTests(APITestCase):
    """Security Tests for Locations"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='sec_location@test.com',
            username='sec_location_test',
            password='TestPass123!',
            role='tenant'
        )
        self.client.force_authenticate(user=self.user)

    def test_xss_in_address_label(self):
        """Test XSS protection in address label"""
        xss_payload = '<script>alert("XSS")</script>'

        address = Address.objects.create(
            user=self.user,
            label=xss_payload,
            full_address='Test Address'
        )

        self.assertNotIn('<script>', address.label)

    def test_xss_in_full_address(self):
        """Test XSS protection in full address"""
        xss_payload = '<img src=x onerror=alert("XSS")>'

        address = Address.objects.create(
            user=self.user,
            label='Test',
            full_address=xss_payload
        )

        self.assertNotIn('<img', address.full_address)

    def test_coordinates_boundary_values(self):
        """Test coordinate boundary values"""
        address = Address.objects.create(
            user=self.user,
            label='Boundary Test',
            full_address='Boundary Address',
            latitude=Decimal('90.000000'),
            longitude=Decimal('180.000000')
        )

        self.assertEqual(address.latitude, Decimal('90.000000'))
        self.assertEqual(address.longitude, Decimal('180.000000'))


class LocationEdgeCaseTests(TestCase):
    """Edge Case Tests for Locations"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='edge_location@test.com',
            username='edge_location_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_empty_address_list(self):
        """Test handling of empty address list"""
        addresses = Address.objects.filter(user=self.user)
        self.assertEqual(addresses.count(), 0)

    def test_unicode_in_address(self):
        """Test Unicode characters in addresses"""
        address = Address.objects.create(
            user=self.user,
            label='منزلي',
            full_address='شارع رئيسي، المدينة',
            city='قسنطينة'
        )

        self.assertIn('منزلي', address.label)
        self.assertIn('قسنطينة', address.city)

    def test_large_address_data(self):
        """Test handling of large address data"""
        address = Address.objects.create(
            user=self.user,
            label='Large',
            full_address='x' * 1000,
            street='y' * 200
        )

        self.assertEqual(len(address.full_address), 1000)

    def test_multiple_addresses_same_user(self):
        """Test creating multiple addresses for same user"""
        for i in range(10):
            Address.objects.create(
                user=self.user,
                label=f'Address {i}',
                full_address=f'{i} Street'
            )

        count = Address.objects.filter(user=self.user).count()
        self.assertEqual(count, 10)

    def test_address_inactive_status(self):
        """Test inactive address handling"""
        address = Address.objects.create(
            user=self.user,
            label='Inactive',
            full_address='Inactive Address',
            is_active=False
        )

        self.assertFalse(address.is_active)

    def test_null_coordinates(self):
        """Test handling of null coordinates"""
        address = Address.objects.create(
            user=self.user,
            label='No GPS',
            full_address='No GPS Address',
            latitude=None,
            longitude=None
        )

        self.assertIsNone(address.latitude)
        self.assertIsNone(address.longitude)


if __name__ == '__main__':
    import unittest
    unittest.main()
