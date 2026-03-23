"""
Test Factories for ReadyRent.Gala
Provides clean, reusable fixtures for testing financial flows.
"""
from decimal import Decimal
from django.utils import timezone
from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.payments.models import Payment


def create_user(username='testuser', email='test@example.com', role='customer'):
    """Create a test user with unique credentials"""
    return User.objects.create_user(
        username=username,
        email=email,
        password='testpass123',
        role=role
    )


def create_category(name='Test Category', slug=None):
    """Create a product category"""
    if slug is None:
        slug = name.lower().replace(' ', '-')
    
    category, _ = Category.objects.get_or_create(
        slug=slug,
        defaults={'name': name}
    )
    return category


def create_product(owner=None, name='Test Product', price_per_day=100.00, category=None):
    """Create a test product"""
    if owner is None:
        owner = create_user(username=f'owner_{timezone.now().timestamp()}')
    
    if category is None:
        category = create_category(name='Furniture')
    
    return Product.objects.create(
        owner=owner,
        name=name,
        name_ar=name,
        slug=f'test-product-{timezone.now().timestamp()}',
        description='Test product description',
        description_ar='وصف منتج الاختبار',
        category=category,
        price_per_day=Decimal(str(price_per_day)),
        size='M',  # Required field
        color='Blue',  # Required field
        status='available'
    )


def create_booking(
    user=None,
    product=None,
    days=3,
    status='pending',
    escrow_status='INITIATED'
):
    """Create a test booking"""
    if user is None:
        user = create_user(username=f'tenant_{timezone.now().timestamp()}')
    
    if product is None:
        owner = create_user(username=f'owner_{timezone.now().timestamp()}')
        product = create_product(owner=owner)
    
    start_date = timezone.now().date()
    end_date = start_date + timezone.timedelta(days=days)
    total_price = product.price_per_day * days
    
    return Booking.objects.create(
        user=user,
        product=product,
        start_date=start_date,
        end_date=end_date,
        total_days=days,
        total_price=total_price,
        status=status,
        escrow_status=escrow_status
    )


def create_payment(
    user=None,
    booking=None,
    amount=None,
    transaction_id='txn_test',
    payment_method='baridimob',
    status='pending'
):
    """Create a test payment"""
    if booking is None:
        booking = create_booking(user=user)
    
    if user is None:
        user = booking.user
    
    if amount is None:
        amount = booking.total_price
    
    return Payment.objects.create(
        user=user,
        booking=booking,
        amount=amount,
        currency='DZD',
        payment_method=payment_method,
        transaction_id=transaction_id,
        status=status
    )


def create_webhook_test_fixtures():
    """
    Create complete fixtures for webhook testing.
    Returns dict with owner, tenant, product, booking, payment.
    """
    # Create unique users
    import time
    timestamp = str(time.time()).replace('.', '')
    
    owner = create_user(
        username=f'owner_{timestamp}',
        email=f'owner_{timestamp}@test.com'
    )
    tenant = create_user(
        username=f'tenant_{timestamp}',
        email=f'tenant_{timestamp}@test.com'
    )
    
    # Create product with category
    category = create_category(name='Furniture')
    product = create_product(
        owner=owner,
        name=f'Test Product {timestamp}',
        price_per_day=100.00,
        category=category
    )
    
    # Create booking
    booking = create_booking(
        user=tenant,
        product=product,
        days=3,
        status='pending',
        escrow_status='INITIATED'
    )
    
    # Create payment with unique transaction_id
    payment = create_payment(
        user=tenant,
        booking=booking,
        amount=booking.total_price,
        transaction_id=f'txn_test_{timestamp}',
        status='pending'
    )
    
    return {
        'owner': owner,
        'tenant': tenant,
        'product': product,
        'booking': booking,
        'payment': payment,
        'timestamp': timestamp
    }
