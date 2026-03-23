import pytest
from decimal import Decimal
from django.utils import timezone
from apps.payments.models import EscrowHold, Wallet, WalletTransaction
from apps.payments.states import EscrowState
from apps.payments.engine import EscrowEngine
from apps.bookings.models import Booking
from apps.users.models import User
from apps.products.models import Product, Category
from apps.payments.context import EscrowEngineContext

@pytest.fixture
def test_users(db):
    renter, _ = User.objects.get_or_create(username='renter', defaults={'email': 'r@ex.com', 'password': 'pw'})
    owner, _ = User.objects.get_or_create(username='owner', defaults={'email': 'o@ex.com', 'password': 'pw'})
    Wallet.objects.get_or_create(user=renter)
    Wallet.objects.get_or_create(user=owner)
    
    category, _ = Category.objects.get_or_create(name="Cat", slug="cat")
    product, _ = Product.objects.get_or_create(
        owner=owner, category=category, name="Test Product", price_per_day=Decimal('100.00')
    )
    return renter, owner, product

@pytest.mark.django_db(transaction=True)
def test_split_release_flow(test_users):
    renter, owner, product = test_users
    amount = Decimal('1000.00')
    
    booking = Booking.objects.create(
        user=renter,
        product=product,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timezone.timedelta(days=10),
        total_days=10,
        total_price=amount,
        status='completed'
    )
    hold = EscrowHold.objects.create(
        booking=booking,
        amount=amount,
        state=EscrowState.DISPUTED,
        wallet=renter.wallet
    )
    
    # Run split verdict
    with EscrowEngineContext.activate():
        EscrowEngine.execute_split_release(
            hold_id=hold.id,
            renter_percentage=60,
            judgment_id=1,
            reason="Court judgment",
            actor=None
        )
        
    hold.refresh_from_db()
    
    # Verify State
    assert hold.state == EscrowState.SPLIT_RELEASED, f"State is {hold.state}"
    
    expected_renter_amount = amount * Decimal('0.60')
    expected_owner_amount = amount * Decimal('0.40')
    
    # Verify Wallet Transactions (using the specific split reference ID pattern)
    owner_tx = WalletTransaction.objects.filter(
        wallet=owner.wallet, 
        reference_id__contains=f"escrow_hold:{hold.id}|split_owner"
    ).first()
    renter_tx = WalletTransaction.objects.filter(
        wallet=renter.wallet, 
        reference_id__contains=f"escrow_hold:{hold.id}|split_renter"
    ).first()
    
    assert owner_tx is not None, "Owner TX not found"
    assert renter_tx is not None, "Renter TX not found"
    
    assert owner_tx.amount == expected_owner_amount, f"Owner got {owner_tx.amount}"
    assert renter_tx.amount == expected_renter_amount, f"Renter got {renter_tx.amount}"
