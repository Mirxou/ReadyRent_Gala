import os
import django
import structlog
import uuid
import json
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.payments.engine import EscrowEngine
from apps.payments.models import EscrowHold, Wallet
from apps.payments.states import EscrowState
from apps.bookings.models import Booking
from django.contrib.auth import get_user_model

User = get_user_model()

def run_simulation():
    # 🆔 Bind a correlation ID manually for the simulation
    request_id = str(uuid.uuid4())
    structlog.contextvars.bind_contextvars(request_id=request_id)
    
    print(f"--- Starting Simulation with request_id: {request_id} ---")
    
    # Setup Data
    user, _ = User.objects.get_or_create(username="audit_test_user", defaults={"email": "audit@example.com"})
    owner, _ = User.objects.get_or_create(username="owner_test_user", defaults={"email": "owner@example.com"})
    
    # Create a mock hold if none exists
    # Note: EscrowEngine requires a Booking.
    # We'll use an existing booking or create a dummy one.
    booking = Booking.objects.first()
    if not booking:
        print("No booking found, please run migrations/setup first.")
        return

    hold, created = EscrowHold.objects.get_or_create(
        booking=booking,
        defaults={'amount': Decimal('100.00'), 'state': EscrowState.HELD}
    )
    
    if not created:
        hold.state = EscrowState.HELD
        hold.save()

    print(f"Hold state: {hold.state}")
    
    # Trigger transition
    try:
        # Note: Depending on booking status, RELEASED might fail.
        # We ensure booking is completed for the test.
        booking.status = 'completed'
        booking.save()
        
        print("Triggering transition to RELEASED...")
        EscrowEngine.transition(
            hold_id=hold.id,
            target_state=EscrowState.RELEASED,
            reason="Integration Test for Structured Logging",
            actor=user
        )
        print("Transition successful.")
    except Exception as e:
        print(f"Transition failed: {e}")

if __name__ == "__main__":
    run_simulation()
