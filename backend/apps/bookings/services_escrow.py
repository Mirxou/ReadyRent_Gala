from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Booking
# from apps.users.models import User  # Avoid circular import if possible, use settings.AUTH_USER_MODEL if needed

class EscrowService:
    """
    Financial Trust State Machine.
    Manages the lifecycle of funds: INIT -> HELD -> RELEASED/REFUNDED.
    """

    @staticmethod
    def initiate_escrow(booking: Booking, vault_address: str = None) -> Booking:
        """
        Move funds to HELD state.
        Called when payment is confirmed.
        """
        # Phase 3: Engine Transition
        from apps.payments.models import EscrowHold
        from apps.payments.engine import EscrowEngine
        from apps.payments.states import EscrowState
        from apps.payments.context import EscrowEngineContext

        # Ensure Hold Exists
        escrow_hold, _ = EscrowHold.objects.get_or_create(
             booking=booking,
             defaults={'amount': booking.total_price, 'state': EscrowState.PENDING}
        )

        with EscrowEngineContext.activate():
            try:
                EscrowEngine.transition(
                    hold_id=escrow_hold.id,
                    target_state=EscrowState.HELD,
                    reason="Legacy EscrowService Initiate",
                    actor=None
                )
            except Exception:
                # Idempotency check handled by Engine, but if it fails we might re-raise or ignore if already HELD
                pass

        if vault_address:
            booking.vault_address = vault_address
        booking.save() # This might trigger sync, which is fine
        return booking

    @staticmethod
    def release_funds(booking: Booking, approved_by_user=None) -> Booking:
        """
        Release funds to the Beneficiary (Owner).
        """
        if not getattr(booking.product, 'owner', None):
            raise ValidationError('Cannot release funds for an ownerless product.')

        # Phase 3: Engine Transition
        from apps.payments.models import EscrowHold
        from apps.payments.engine import EscrowEngine
        from apps.payments.states import EscrowState
        from apps.payments.context import EscrowEngineContext
        
        escrow_hold = EscrowHold.objects.get(booking=booking)
        
        with EscrowEngineContext.activate():
             EscrowEngine.transition(
                 hold_id=escrow_hold.id,
                 target_state=EscrowState.RELEASED,
                 reason="Legacy EscrowService Release",
                 actor=approved_by_user
             )
        return booking

    @staticmethod
    def refund_funds(booking: Booking, reason: str) -> Booking:
        """
        Return funds to the Customer.
        """
        # Phase 3: Engine Transition
        from apps.payments.models import EscrowHold
        from apps.payments.engine import EscrowEngine
        from apps.payments.states import EscrowState
        from apps.payments.context import EscrowEngineContext
        
        escrow_hold = EscrowHold.objects.get(booking=booking)
        
        with EscrowEngineContext.activate():
             EscrowEngine.transition(
                 hold_id=escrow_hold.id,
                 target_state=EscrowState.REFUNDED,
                 reason=f"Legacy EscrowService Refund: {reason}",
                 actor=None
             )
        return booking

    @staticmethod
    def get_escrow_summary(user_id: int):
        """
        Get financial summary for a user (Owner view).
        """
        held = Booking.objects.filter(beneficiary_id=user_id, escrow_status='HELD').count()
        released = Booking.objects.filter(beneficiary_id=user_id, escrow_status='RELEASED').count()
        return {
            'held_transactions': held,
            'released_transactions': released,
            'trust_score': 'High' if released > held else 'Building' 
        }
