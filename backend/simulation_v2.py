
import os
import sys
import uuid
import django
import random
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# Force local DB branch
# sys.argv = ['simulation_v2.py', 'test']
django.setup()
print(f"DEBUG: sys.path = {sys.path}")

from django.db import transaction
from django.contrib.auth import get_user_model
from apps.payments.models import EscrowHold, Wallet, WalletTransaction
from apps.payments.engine import EscrowEngine
from apps.payments.states import EscrowState
from apps.bookings.models import Booking
from apps.products.models import Product, Category
import structlog

logger = structlog.get_logger("audit")
User = get_user_model()

def run_simulation():
    print("--- STARTING SIMULATION V2 ---")
    
    # 1. Setup Data
    category, _ = Category.objects.get_or_create(name="Staging Sim", slug="staging-sim")
    
    users = []
    print("Creating 10 Users...") # Reduced scale for debugging
    for i in range(10):
        username = f"sim_v2_user_{i}"
        user, _ = User.objects.get_or_create(
            username=username, 
            defaults={"email": f"{username}@test.com"}
        )
        users.append(user)
    
    owners = users[:2]
    
    print("Creating 5 Products...")
    products = []
    for i in range(5):
        product, _ = Product.objects.get_or_create(
            slug=f"sim_v2_prod_{i}",
            defaults={
                "name": f"Product {i}",
                "owner": random.choice(owners),
                "category": category,
                "price_per_day": Decimal("100.00"),
                "size": "M",
                "color": "Gray",
                "wilaya": 1
            }
        )
        products.append(product)

    # 2. Simulate Bookings
    print("Simulating 5 Bookings...")
    active_holds = []
    for i in range(5):
        tenant = random.choice(users[2:])
        product = random.choice(products)
        amount = Decimal("200.00")
        
        with transaction.atomic():
            booking = Booking.objects.create(
                user=tenant,
                product=product,
                start_date="2026-04-01",
                end_date="2026-04-03",
                total_days=2,
                base_price=Decimal("190.00"),
                protection_fee=Decimal("10.00"),
                total_price=amount,
                status="pending"
            )
            
            # 🛡️ Phase 3.6: Manual Escrow Initialization for Simulation
            # Simulate the behavior of the BaridiMob/BankCard webhook
            from apps.payments.context import EscrowEngineContext
            
            # 1. Ensure wallets exist
            tenant_wallet, created_t = Wallet.objects.get_or_create(user=tenant, defaults={'balance': Decimal("0.00")})
            if created_t or tenant_wallet.balance == 0:
                 # Initial Funding for Simulation
                 tenant_wallet.balance += Decimal("10000.00")
                 tenant_wallet.save()
                 WalletTransaction.objects.create(
                     wallet=tenant_wallet,
                     amount=Decimal("10000.00"),
                     balance_after=tenant_wallet.balance,
                     transaction_type='deposit',
                     description='SIM V2 INITIAL DEPOSIT'
                 )

            owner_wallet, _ = Wallet.objects.get_or_create(user=product.owner, defaults={'balance': Decimal("0.00")})
            
            # 2. Create Hold (PENDING)
            hold, created = EscrowHold.objects.get_or_create(
                booking=booking,
                defaults={
                    'wallet': tenant_wallet,
                    'amount': booking.total_price,
                    'state': EscrowState.PENDING
                }
            )
            
            # 3. Transition to HELD (Lock Funds)
            structlog.contextvars.bind_contextvars(request_id=str(uuid.uuid4()))
            with EscrowEngineContext.activate():
                EscrowEngine.transition(
                    hold_id=hold.id,
                    target_state=EscrowState.HELD,
                    reason="SIM V2 PAYMENT",
                    actor=None
                )
            active_holds.append(hold)

    # 3. Transitions
    print("Processing Transitions...")
    # Release 1
    h1 = active_holds[0]
    h1.booking.status = 'completed'
    h1.booking.save()
    EscrowEngine.transition(h1.id, EscrowState.RELEASED, "SIM V2 RELEASE", actor=None)
    
    # Refund 1
    h2 = active_holds[1]
    EscrowEngine.transition(h2.id, EscrowState.REFUNDED, "SIM V2 REFUND", actor=None)
    
    # Dispute 1
    h3 = active_holds[2]
    EscrowEngine.transition(h3.id, EscrowState.DISPUTED, "SIM V2 DISPUTE", actor=None)
    
    # Reconciliation
    print("Reconciliation...")
    balance_sum = sum(w.balance for w in Wallet.objects.all())
    held_sum = sum(h.amount for h in EscrowHold.objects.filter(state=EscrowState.HELD))
    print(f"Wallets: {balance_sum}, Held: {held_sum}, System: {balance_sum + held_sum}")
    print("--- SIMULATION V2 COMPLETE ---")

if __name__ == "__main__":
    run_simulation()
