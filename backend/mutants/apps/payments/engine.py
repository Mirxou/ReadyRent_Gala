from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.payments.models import EscrowHold, Wallet, WalletTransaction
from apps.payments.states import EscrowState
from apps.disputes.audit_service import AuditService
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)
from inspect import signature as _mutmut_signature
from typing import Annotated
from typing import Callable
from typing import ClassVar


MutantDict = Annotated[dict[str, Callable], "Mutant"]


def _mutmut_trampoline(orig, mutants, call_args, call_kwargs, self_arg = None):
    """Forward call to original or mutated function, depending on the environment"""
    import os
    mutant_under_test = os.environ['MUTANT_UNDER_TEST']
    if mutant_under_test == 'fail':
        from mutmut.__main__ import MutmutProgrammaticFailException
        raise MutmutProgrammaticFailException('Failed programmatically')      
    elif mutant_under_test == 'stats':
        from mutmut.__main__ import record_trampoline_hit
        record_trampoline_hit(orig.__module__ + '.' + orig.__name__)
        result = orig(*call_args, **call_kwargs)
        return result
    prefix = orig.__module__ + '.' + orig.__name__ + '__mutmut_'
    if not mutant_under_test.startswith(prefix):
        result = orig(*call_args, **call_kwargs)
        return result
    mutant_name = mutant_under_test.rpartition('.')[-1]
    if self_arg is not None:
        # call to a class method where self is not bound
        result = mutants[mutant_name](self_arg, *call_args, **call_kwargs)
    else:
        result = mutants[mutant_name](*call_args, **call_kwargs)
    return result

class InvalidStateTransitionError(Exception):
    """Raised when a transition is not allowed by the state machine."""
    pass

class TerminalStateError(Exception):
    """Raised when attempting to modify a terminal state."""
    pass

class InvariantViolationError(Exception):
    """Raised when a system invariant is violated."""
    pass

class AuditFailureError(Exception):
    """Raised when audit logging fails."""
    pass

class EscrowEngine:
    """
    The Core Financial State Machine (Phase 3).
    Strictly enforces all EscrowHold state transitions.
    """

    ALLOWED_TRANSITIONS = {
        EscrowState.PENDING: {EscrowState.HELD, EscrowState.CANCELLED},
        EscrowState.HELD: {EscrowState.RELEASED, EscrowState.REFUNDED, EscrowState.DISPUTED},
        EscrowState.DISPUTED: {EscrowState.RELEASED, EscrowState.REFUNDED, EscrowState.HELD},
        EscrowState.RELEASED: set(),
        EscrowState.REFUNDED: set(),
        EscrowState.CANCELLED: set(),
    }

    TERMINAL_STATES = {
        EscrowState.RELEASED,
        EscrowState.REFUNDED,
        EscrowState.CANCELLED,
    }

    @classmethod
    def transition(cls, hold_id: int, target_state: str, reason: str, actor=None):
        """
        Execute a state transition atomically with strict invariant checks.
        """
        from .context import EscrowEngineContext
        
        with transaction.atomic():
            with EscrowEngineContext.activate():
                # 1. Lock Row
                try:
                    hold = EscrowHold.objects.select_for_update().get(id=hold_id)
                except EscrowHold.DoesNotExist:
                    raise ValueError(f"EscrowHold #{hold_id} not found.")

            current_state = hold.state

            # 2. Validation
            if current_state == target_state:
                raise InvalidStateTransitionError(f"Self-transition not allowed: {current_state} -> {target_state}")

            if current_state in cls.TERMINAL_STATES:
                raise TerminalStateError(f"Cannot transition from terminal state {current_state}")

            if target_state not in cls.ALLOWED_TRANSITIONS.get(current_state, set()):
                raise InvalidStateTransitionError(f"Cannot transition from {current_state} to {target_state}")

            cls._check_preconditions(hold, target_state)
            cls._validate_pre_invariants(hold)

            # 3. Side Effects (Decoupled from State Mutation)
            cls._apply_side_effects(hold, from_state=current_state, to_state=target_state)

            # 4. State Update
            hold.state = target_state
            hold.save()

            # 5. Audit Logging (CRITICAL: Inside Transaction & Strict Check)
            try:
                AuditService.log(
                    entity=hold,
                    old_state=current_state,
                    new_state=target_state,
                    reason=reason,
                    actor=actor
                )
            except Exception as e:
                # FORCE ROLLBACK on any audit failure
                raise AuditFailureError(f"Audit log failed, rolling back transaction: {e}") from e

            # 6. Final Invariant Check
            cls._validate_post_invariants(hold)

            # 7. Sync Legacy Field
            hold.booking.sync_escrow_state()
            
            return hold

    @classmethod
    def _check_preconditions(cls, hold: EscrowHold, target_state: str):
        """Check specific business rules for each transition."""
        if target_state == EscrowState.CANCELLED:
             # PENDING -> CANCELLED: Only if no completed payment exists
             # In Phase 2/3, we assume PENDING implies no payment processed yet or payment failed.
             # If a payment exists and is captured, it should have moved to HELD.
             # We check if related Payments are successful.
             if hold.booking.payments.filter(status='completed').exists():
                 raise InvalidStateTransitionError("Cannot Cancel: Completed payment exists.")

        if target_state == EscrowState.RELEASED:
            # HELD -> RELEASED: Service Completion
            # Booking status implies service is done or verified.
            # Relaxed check: booking status might be 'confirmed' or 'in_use' moving to 'completed'.
            # Strict Spec: Booking.status must be COMPLETED.
            if hold.booking.status != 'completed':
                 # In some flows, we might release funds *then* complete booking.
                 # But Auditor Spec said: Booking.status == COMPLETED.
                 # We will enforce this strictly. If flows differ, they must update booking first.
                 raise InvalidStateTransitionError(f"Cannot Release: Booking status is {hold.booking.status}, expected 'completed'.")

        if target_state == EscrowState.REFUNDED:
            # HELD -> REFUNDED: Mutual Cancel
            # Usually before start date.
            # We assume policy checks happened in the Service layer calling this.
            pass

        if target_state == EscrowState.DISPUTED:
             # HELD -> DISPUTED
             pass

        if target_state == EscrowState.HELD and hold.state == EscrowState.DISPUTED:
             # DISPUTED -> HELD (Withdrawn)
             # Allowed.
             pass

    @classmethod
    def _apply_side_effects(cls, hold: EscrowHold, from_state: str, to_state: str):
        """
        Apply financial movements based on transition.
        CRITICAL: Does NOT depend on hold.state (which is not yet updated).
        """
        
        # PENDING -> HELD (Lock Funds)
        if from_state == EscrowState.PENDING and to_state == EscrowState.HELD:
            # Funds are technically "locked" by virtue of being in HELD (and captured by Payment).
            # No explicit Wallet move here if Payment directly credited Vault?
            # Or does Payment move money to Wallet? 
            # Ideally: Payment -> Wallet (Credit) -> EscrowHold (Lock).
            # Providing strict implementation: Ensure Wallet has funds?
            # For now, we assume Payment Webhook handled the credit to Wallet. 
            pass

        # HELD -> RELEASED (Transfer to Owner)
        # DISPUTED -> RELEASED (Judgment Owner Win)
        elif to_state == EscrowState.RELEASED:
            cls._execute_transfer(hold, recipient=hold.booking.product.owner, amount=hold.amount, transaction_type='release')

        # HELD -> REFUNDED (Return to Tenant)
        # DISPUTED -> REFUNDED (Judgment Tenant Win)
        elif to_state == EscrowState.REFUNDED:
            cls._execute_transfer(hold, recipient=hold.booking.user, amount=hold.amount, transaction_type='refund')

    @classmethod
    def _execute_transfer(cls, hold: EscrowHold, recipient, amount: Decimal, transaction_type: str):
        """Helper to move funds."""
        
        # 1. Update Recipient Wallet
        recipient_wallet, _ = Wallet.objects.select_for_update().get_or_create(user=recipient)
        recipient_wallet.balance += amount
        recipient_wallet.save()
        
        # 2. Determine Transaction Type
        db_type = 'escrow_release'
        if transaction_type == 'refund':
            db_type = 'refund'
        elif transaction_type == 'release':
            db_type = 'escrow_release'
            
        # 3. Create Immutable Ledger Entry
        WalletTransaction.objects.create(
            wallet=recipient_wallet,
            amount=amount,
            balance_after=recipient_wallet.balance,
            transaction_type=db_type,
            reference_id=f"escrow_hold:{hold.id}",  # Strict Link for Invariant Check
            description=f"Escrow {transaction_type.upper()} for Booking #{hold.booking.id}",
        )

    @classmethod
    def _validate_pre_invariants(cls, hold: EscrowHold):
        """Check invariants before mutations."""
        if hold.amount is None or hold.amount < 0:
             raise InvariantViolationError("Negative or None hold amount.")
        # Immutability of hold amount check?
        # We can't easily check "history" here without looking up DB again, but hold is fresh from DB.
        pass

    @classmethod
    def _validate_post_invariants(cls, hold: EscrowHold):
        """Check invariants after mutations."""
        # 1. Immutability of Hold Amount
        # We assume the object in memory is correct, but strictly we could reload.
        # For performance/transaction constraints, we check the in-memory object vs pre-calculated invariant if needed.
        if hold.amount is None or hold.amount < 0:
             raise InvariantViolationError("EscrowHold amount corrupted (negative or None).")

        # 2. Binary Resolution Check
        if hold.state in {EscrowState.RELEASED, EscrowState.REFUNDED}:
            # Find transactions linked to this hold via strict reference_id
            tx_count = WalletTransaction.objects.filter(
                reference_id=f"escrow_hold:{hold.id}"
            ).count()
            
            if tx_count != 1:
                raise InvariantViolationError(
                    f"Binary Resolution Invariant Failed: Expected exactly 1 WalletTransaction for {hold.state} state, found {tx_count}."
                )
                
            # Optionally check amount match (though create() used hold.amount)
            # Strict paranoid check:
            tx = WalletTransaction.objects.get(reference_id=f"escrow_hold:{hold.id}")
            if tx.amount != hold.amount:
                 raise InvariantViolationError(
                     f"Financial Invariant Failed: Transaction amount ({tx.amount}) != Hold amount ({hold.amount})"
                 )

        elif hold.state in cls.TERMINAL_STATES:
             # CANCELLED
             # Should be zero transactions?
             tx_count = WalletTransaction.objects.filter(
                reference_id=f"escrow_hold:{hold.id}"
            ).count()
             if tx_count != 0:
                  raise InvariantViolationError(
                      f"Invariant Failed: CANCELLED state should have 0 transactions, found {tx_count}."
                  )

