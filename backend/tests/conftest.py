"""
Pytest configuration and fixtures for ReadyRent.Gala tests
"""
import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from decimal import Decimal
from datetime import date, timedelta
from apps.products.models import Category, Product
from apps.bookings.models import Booking
from apps.branches.models import Branch
from apps.vendors.models import Vendor

User = get_user_model()


@pytest.fixture
def api_client():
    """API client for testing"""
    return Client()


@pytest.fixture
def authenticated_client(api_client, admin_user):
    """Authenticated API client"""
    api_client.force_login(admin_user)
    return api_client


@pytest.fixture
def admin_user():
    """Create admin user"""
    return User.objects.create_user(
        email='admin@test.com',
        password='testpass123',
        username='admin',
        first_name='Admin',
        last_name='User',
        role='admin',
        is_staff=True,
        is_superuser=True,
        is_active=True
    )


@pytest.fixture
def regular_user():
    """Create regular user"""
    return User.objects.create_user(
        email='user@test.com',
        password='testpass123',
        username='user',
        first_name='Regular',
        last_name='User',
        role='customer',
        is_active=True
    )


@pytest.fixture
def staff_user():
    """Create staff user"""
    return User.objects.create_user(
        email='staff@test.com',
        password='testpass123',
        username='staff',
        first_name='Staff',
        last_name='User',
        role='staff',
        is_staff=True,
        is_active=True
    )


@pytest.fixture
def category():
    """Create test category"""
    return Category.objects.create(
        name='Evening Dresses',
        name_ar='فساتين سهرة',
        slug='evening-dresses',
        description='Test category',
        is_active=True
    )


@pytest.fixture
def product(category):
    """Create test product"""
    return Product.objects.create(
        name='Test Dress',
        name_ar='فستان تجريبي',
        slug='test-dress',
        description='Test description',
        description_ar='وصف تجريبي',
        category=category,
        price_per_day=Decimal('2500.00'),
        size='M',
        color='Red',
        color_hex='#DC2626',
        status='available',
        is_featured=True
    )


@pytest.fixture
def branch():
    """Create test branch"""
    admin = User.objects.create_user(
        email='manager@test.com',
        password='testpass123',
        username='manager',
        role='admin'
    )
    return Branch.objects.create(
        name='Main Branch',
        name_ar='الفرع الرئيسي',
        code='MAIN-001',
        address='123 Test Street',
        address_ar='123 شارع تجريبي',
        city='Constantine',
        phone='+213123456789',
        email='main@test.com',
        manager=admin,
        is_active=True
    )


@pytest.fixture
def vendor(regular_user):
    """Create test vendor"""
    return Vendor.objects.create(
        user=regular_user,
        business_name='Test Vendor',
        business_name_ar='مورد تجريبي',
        phone='+213987654321',
        email='vendor@test.com',
        address='456 Vendor Street',
        city='Constantine',
        commission_rate=Decimal('15.00'),
        status='active',
        is_verified=True
    )


@pytest.fixture
def booking(regular_user, product):
    """Create test booking"""
    start_date = date.today() + timedelta(days=1)
    end_date = start_date + timedelta(days=3)
    total_days = (end_date - start_date).days
    
    return Booking.objects.create(
        user=regular_user,
        product=product,
        start_date=start_date,
        end_date=end_date,
        total_days=total_days,
        total_price=product.price_per_day * total_days,
        status='pending'
    )


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Enable database access for all tests"""
    pass

