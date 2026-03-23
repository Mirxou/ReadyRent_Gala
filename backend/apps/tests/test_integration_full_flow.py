import pytest
from decimal import Decimal
from django.utils import timezone
from apps.users.models import User
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.payments.models import EscrowHold, Wallet, WalletTransaction
from apps.payments.states import EscrowState
from apps.payments.engine import EscrowEngine
from apps.contracts.models import Contract
from apps.payments.context import EscrowEngineContext

@pytest.mark.django_db(transaction=True)
def test_full_happy_path_flow():
    # 1. Signup
    renter = User.objects.create(username='renter_full', email='r2@ex.com')
    owner = User.objects.create(username='owner_full', email='o2@ex.com')
    Wallet.objects.create(user=renter)
    Wallet.objects.create(user=owner)
    
    # 2. Create Product
    category, _ = Category.objects.get_or_create(name="Cat", slug="cat")
    product = Product.objects.create(
        owner=owner, category=category, name="Flow Product", price_per_day=Decimal('50.00')
    )
    
    # 3. Create Booking
    amount = Decimal('250.00')
    booking = Booking.objects.create(
        user=renter,
        product=product,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timezone.timedelta(days=5),
        total_days=5,
        total_price=amount,
        status='pending'
    )
    
    # 4. Payment Mock -> Escrow PENDING -> HELD
    hold = EscrowHold.objects.create(
        booking=booking,
        amount=amount,
        state=EscrowState.PENDING,
        wallet=renter.wallet
    )
    
    with EscrowEngineContext.activate():
        EscrowEngine.transition(hold.id, EscrowState.HELD, "Deposit paid", renter)
        
    hold.refresh_from_db()
    assert hold.state == EscrowState.HELD
    
    # 5. Contract Signing (both parties)
    contract = Contract.objects.create(
        booking=booking,
        snapshot={"price": 250},
        contract_hash="dummy_hash_for_test"
    )
    
    contract.sign(renter, "192.168.1.1")
    contract.sign(owner, "192.168.1.2")
    
    assert contract.is_finalized is True
    assert contract.renter_signature is not None
    assert contract.owner_signature is not None
    
    # 6. Complete Booking
    booking.status = 'completed'
    booking.save()
    
    # 7. Escrow Release
    with EscrowEngineContext.activate():
        EscrowEngine.transition(hold.id, EscrowState.RELEASED, "Booking finished", owner)
        
    hold.refresh_from_db()
    owner.wallet.refresh_from_db()
    
    assert hold.state == EscrowState.RELEASED
    tx = WalletTransaction.objects.filter(wallet=owner.wallet, reference_id=f"escrow_hold:{hold.id}", transaction_type='escrow_release').first()
    assert tx is not None
    assert tx.amount == amount
