import pytest
from decimal import Decimal
from hypothesis import given, strategies as st, settings, HealthCheck
from django.utils import timezone
from apps.payments.models import EscrowHold, Wallet, WalletTransaction
from apps.payments.states import EscrowState
from apps.payments.engine import EscrowEngine, InvalidStateTransitionError, TerminalStateError
from apps.bookings.models import Booking
from apps.users.models import User
from apps.products.models import Product, Category
from apps.payments.context import EscrowEngineContext

# Strategies
ALL_STATES = [
    EscrowState.PENDING,
    EscrowState.HELD,
    EscrowState.RELEASED,
    EscrowState.REFUNDED,
    EscrowState.CANCELLED,
    EscrowState.DISPUTED,
]

@pytest.fixture
def property_setup(db):
    """Fixture to setup minimal data for property tests."""
    # Create persistent users for the tests (Hypothesis runs usually rollback, but data setup needs to happen)
    tenant, _ = User.objects.get_or_create(username='prop_tenant', defaults={'email': 't@ex.com', 'password': 'pw'})
    if not tenant.check_password('pw'):
        tenant.set_password('pw')
        tenant.save()

    owner, _ = User.objects.get_or_create(username='prop_owner', defaults={'email': 'o@ex.com', 'password': 'pw'})
    if not owner.check_password('pw'):
        owner.set_password('pw')
        owner.save()

    Wallet.objects.get_or_create(user=tenant)
    Wallet.objects.get_or_create(user=owner)
    
    category = Category.objects.create(name="Prop Cat", slug="prop-cat")
    product = Product.objects.create(
        owner=owner,
        category=category,
        name="Prop Product",
        price_per_day=Decimal('10.00')
    )
    return tenant, owner, product

def create_test_hold(tenant, owner, product, amount=Decimal('100.00'), status='pending'):
    """Helper to create a fresh hold for each hypothesis example."""
    booking = Booking.objects.create(
        user=tenant,
        product=product,
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timezone.timedelta(days=1),
        total_days=1,
        total_price=amount,
        status='pending', # Start pending
        escrow_status='INITIATED'
    )
    hold = EscrowHold.objects.create(
        booking=booking,
        amount=amount,
        state=EscrowState.PENDING,
        wallet=tenant.wallet
    )
    return hold

def wallet_tx_count(hold):
    return WalletTransaction.objects.filter(reference_id__startswith=f"escrow_hold:{hold.id}").count()

# 🔬 Property Test 1 — Transition Validity
@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(st.lists(st.sampled_from(ALL_STATES), min_size=1, max_size=10))
@pytest.mark.django_db(transaction=True)
def test_random_transition_sequences(property_setup, state_sequence):
    tenant, owner, product = property_setup
    hold = create_test_hold(tenant, owner, product)
    
    # Enable Context
    
    for target in state_sequence:
        # Fuzz: Try to satisfy preconditions if target is RELEASED to make it "interesting"
        # Otherwise it will just reject based on preconditions, which is also valid to test.
        if target == EscrowState.RELEASED:
            hold.booking.status = 'completed'
            hold.booking.save()
            
        try:
            with EscrowEngineContext.activate():
                EscrowEngine.transition(
                    hold.id, # Engine takes ID
                    target_state=target,
                    reason="fuzz test",
                    actor=tenant # Use tenant as actor
                )
        except (InvalidStateTransitionError, TerminalStateError):
            pass  # Expected for invalid transitions
        except Exception as e:
            # We want to catch ANY other crash as a failure
            pytest.fail(f"Engine Crashed on {target}: {e}")

    hold.refresh_from_db()

    # Invariants must always hold
    assert hold.amount >= 0, "Amount negative"
    
    if hold.state == EscrowState.RELEASED:
        assert wallet_tx_count(hold) == 1, "Released but no TX or double TX"
    elif hold.state == EscrowState.REFUNDED:
        assert wallet_tx_count(hold) == 1, "Refunded but no TX or double TX"
    # Note: HELD, PENDING etc should have 0 *release/refund* txs. 
    # WalletTransaction might have 'escrow_hold' type for creation if implemented, 
    # but 'escrow_release' is what we check for finality.
    # Adjust assertion based on actual TX types in system.
    else:
        # Check no RELEASE/REFUND transactions
        txs = WalletTransaction.objects.filter(
            reference_id__startswith=f"escrow_hold:{hold.id}",
            transaction_type__in=['escrow_release', 'escrow_refund']
        )
        assert txs.count() == 0, f"Intermediate state {hold.state} has final TXs"


# 🔬 Property Test 2 — Amount Immutability
@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(st.decimals(min_value=1, max_value=10000, places=2))
@pytest.mark.django_db(transaction=True)
def test_amount_never_mutates(property_setup, amount):
    tenant, owner, product = property_setup
    # Create hold with random amount
    hold = create_test_hold(tenant, owner, product, amount=amount)

    # Try valid transition
    try:
        with EscrowEngineContext.activate():
            EscrowEngine.transition(
                hold.id,
                EscrowState.HELD,
                reason="fuzz amount",
                actor=tenant
            )
    except Exception:
        pass

    hold.refresh_from_db()
    assert hold.amount == amount, "Escrow Amount Mutated!"


# 🔬 Property Test 3 — Idempotency Fuzz
@settings(max_examples=50, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(st.integers(min_value=1, max_value=5))
@pytest.mark.django_db(transaction=True)
def test_repeated_release_attempts(property_setup, repeat_count):
    tenant, owner, product = property_setup
    hold = create_test_hold(tenant, owner, product)
    
    # Move to HELD first to make Release valid
    with EscrowEngineContext.activate():
        EscrowEngine.transition(hold.id, EscrowState.HELD, "Setup")
    
    # Precondition for Release
    hold.booking.status = 'completed'
    hold.booking.save()

    # Repeatedly try to Release
    for i in range(repeat_count):
        try:
            with EscrowEngineContext.activate():
                EscrowEngine.transition(
                    hold.id,
                    EscrowState.RELEASED,
                    reason=f"replay fuzz {i}",
                    actor=tenant
                )
        except Exception:
            pass # Ignore errors (first should succeed, others might fail or be ignored)

    hold.refresh_from_db()

    assert hold.state == EscrowState.RELEASED
    assert wallet_tx_count(hold) == 1, "Should have exactly 1 transaction despite repeats"
