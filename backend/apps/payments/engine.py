from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.payments.models import EscrowHold, Wallet, WalletTransaction
from apps.payments.states import EscrowState
from apps.disputes.audit_service import AuditService
from decimal import Decimal
import structlog

logger = structlog.get_logger("escrow")
wallet_logger = structlog.get_logger("wallet")

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

class OwnerlessProductError(Exception):
    """ℹ️ SOVEREIGN INTEGRITY: Product owner was deleted after escrow was created.
    Funds cannot be auto-disbursed. Manual treasury reconciliation required.
    """
    pass

class EscrowEngine:
    """
    The Core Financial State Machine (Phase 3).
    Strictly enforces all EscrowHold state transitions.
    """

    ALLOWED_TRANSITIONS = {
        EscrowState.PENDING:        {EscrowState.HELD, EscrowState.CANCELLED},
        EscrowState.HELD:           {EscrowState.RELEASED, EscrowState.REFUNDED, EscrowState.DISPUTED},
        EscrowState.DISPUTED:       {EscrowState.RELEASED, EscrowState.REFUNDED, EscrowState.HELD},
        EscrowState.RELEASED:       set(),
        EscrowState.REFUNDED:       set(),
        EscrowState.CANCELLED:      set(),
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
                    raise InvalidStateTransitionError(
                        f"Self-transition not allowed: {current_state} -> {target_state}"
                    )

                if current_state in cls.TERMINAL_STATES:
                    raise TerminalStateError(
                        f"Cannot transition from terminal state {current_state}"
                    )

                if target_state not in cls.ALLOWED_TRANSITIONS.get(current_state, set()):
                    raise InvalidStateTransitionError(
                        f"Cannot transition from {current_state} to {target_state}"
                    )

                cls._check_preconditions(hold, target_state)
                cls._validate_pre_invariants(hold)

                # 3. Side Effects (Decoupled from State Mutation)
                cls._apply_side_effects(hold, from_state=current_state, to_state=target_state)

                # 4. State Update
                hold.state = target_state
                hold.save()

                # 5. Forensic Logging
                logger.info(
                    "escrow_transition",
                    hold_id=hold.id,
                    old_state=current_state,
                    new_state=target_state,
                    amount=str(hold.amount),
                    actor_id=getattr(actor, "id", None),
                    reason=reason
                )

                # 6. Audit Logging (CRITICAL: Inside Transaction & Strict Check)
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
                    raise AuditFailureError(
                        f"Audit log failed, rolling back transaction: {e}"
                    ) from e

                # 7. Final Invariant Check
                cls._validate_post_invariants(hold)

                # 8. Sync Legacy Field (now a no-op — escrow_status is a @property)
                hold.booking.sync_escrow_state()

                return hold

    @classmethod
    def _check_preconditions(cls, hold: EscrowHold, target_state: str):
        """Check specific business rules for each transition."""
        if target_state == EscrowState.CANCELLED:
            # PENDING -> CANCELLED: Only if no completed payment exists
            if hold.booking.payments.filter(status='completed').exists():
                raise InvalidStateTransitionError("Cannot Cancel: Completed payment exists.")

        if target_state == EscrowState.RELEASED:
            # HELD -> RELEASED: Booking must be COMPLETED
            if hold.booking.status != 'completed':
                raise InvalidStateTransitionError(
                    f"Cannot Release: Booking status is {hold.booking.status}, expected 'completed'."
                )

        if target_state == EscrowState.REFUNDED:
            # HELD -> REFUNDED: Mutual Cancel — policy checks happen in Service layer
            pass

        if target_state == EscrowState.DISPUTED:
            # HELD -> DISPUTED
            pass

        if target_state == EscrowState.HELD and hold.state == EscrowState.DISPUTED:
            # DISPUTED -> HELD (Withdrawn)
            pass

    @classmethod
    def _apply_side_effects(cls, hold: EscrowHold, from_state: str, to_state: str):
        """
        Apply financial movements based on transition.
        CRITICAL: Does NOT depend on hold.state (which is not yet updated).
        """
        # PENDING -> HELD (Lock Funds)
        if from_state == EscrowState.PENDING and to_state == EscrowState.HELD:
            source_wallet = Wallet.objects.select_for_update().get(id=hold.wallet.id)
            if source_wallet.is_frozen:
                raise InvariantViolationError(
                    f"Cannot lock funds from frozen wallet #{source_wallet.id}. "
                    "Resolve the frozen state before escrow hold."
                )
            if source_wallet.balance < hold.amount:
                raise InvariantViolationError(
                    f"Insufficient wallet balance for escrow lock: "
                    f"{source_wallet.balance} < {hold.amount}."
                )

            source_wallet.balance -= hold.amount
            source_wallet.save()
            wallet_logger.info(
                "wallet_debit",
                wallet_id=source_wallet.id,
                hold_id=hold.id,
                amount=str(hold.amount),
                transaction_type='escrow_lock'
            )
            WalletTransaction.objects.create(
                wallet=source_wallet,
                amount=-hold.amount,
                balance_after=source_wallet.balance,
                transaction_type='escrow_lock',
                reference_id=f"escrow_hold:{hold.id}|lock",
                description=f"Escrow lock for Booking #{hold.booking.id}",
            )

        # HELD -> RELEASED or DISPUTED -> RELEASED (Transfer to Owner)
        elif to_state == EscrowState.RELEASED:
            owner = getattr(hold.booking.product, 'owner', None)
            if not owner:
                # 🛡️ SOVEREIGN INTEGRITY: المالك حُذف بعد إنشاء الضمان.
                # نُلقي Exception صريحة حتى تُسجيل في Audit وعدم إخفاء المشكلة.
                logger.error(
                    "escrow_release_ownerless_product",
                    hold_id=hold.id,
                    booking_id=hold.booking.id,
                    action_required="MANUAL_TREASURY_RECONCILIATION"
                )
                raise OwnerlessProductError(
                    f"EscrowHold #{hold.id}: Product owner deleted. "
                    f"Funds ({hold.amount}) require manual treasury reconciliation."
                )

            cls._execute_transfer(
                hold,
                recipient=owner,
                amount=hold.amount,
                transaction_type='escrow_release'
            )
            hold.released_at = timezone.now()

        # HELD -> REFUNDED or DISPUTED -> REFUNDED (Return to Renter)
        elif to_state == EscrowState.REFUNDED:
            cls._execute_transfer(
                hold,
                recipient=hold.booking.user,
                amount=hold.amount,
                transaction_type='escrow_refund'
            )
            hold.released_at = timezone.now()

    @classmethod
    def _execute_transfer(cls, hold: EscrowHold, recipient, amount: Decimal, transaction_type: str):
        """Helper to move funds atomically."""
        # 0. CRITICAL: Check wallet is not frozen (H-1 fix)
        recipient_wallet, _ = Wallet.objects.select_for_update().get_or_create(user=recipient)
        if recipient_wallet.is_frozen:
            raise InvariantViolationError(
                f"Cannot transfer funds to frozen wallet #{recipient_wallet.id}. "
                f"Reason: {recipient_wallet.frozen_reason or 'Compliance hold'}. "
                f"Contact support to resolve."
            )
        
        # 1. Update Recipient Wallet
        recipient_wallet.balance += amount
        recipient_wallet.save()

        # 2. Financial Observability
        wallet_logger.info(
            "wallet_credit",
            wallet_id=recipient_wallet.id,
            hold_id=hold.id,
            amount=str(amount),
            beneficiary_id=recipient.id,
            transaction_type=transaction_type
        )

        # 3. Determine ledger transaction type
        db_type = transaction_type

        # 4. Create Immutable Ledger Entry
        WalletTransaction.objects.create(
            wallet=recipient_wallet,
            amount=amount,
            balance_after=recipient_wallet.balance,
            transaction_type=db_type,
            reference_id=f"escrow_hold:{hold.id}|{db_type}",
            description=f"Escrow {db_type.replace('_', ' ').upper()} for Booking #{hold.booking.id}",
        )

    @classmethod
    def _validate_pre_invariants(cls, hold: EscrowHold):
        """Check invariants before mutations."""
        if hold.amount is None or hold.amount < 0:
            raise InvariantViolationError("Negative or None hold amount.")

    @classmethod
    def _validate_post_invariants(cls, hold: EscrowHold):
        """Check invariants after mutations."""
        if hold.amount is None or hold.amount < 0:
            raise InvariantViolationError("EscrowHold amount corrupted (negative or None).")

        held_reference = f"escrow_hold:{hold.id}|lock"
        split_reference_prefix = f"escrow_hold:{hold.id}|split_"
        all_reference_prefix = f"escrow_hold:{hold.id}"

        if hold.state == EscrowState.HELD:
            tx_count = WalletTransaction.objects.filter(reference_id=held_reference).count()
            if tx_count != 1:
                raise InvariantViolationError(
                    f"Held-state invariant failed: expected 1 escrow lock transaction, found {tx_count}."
                )
            tx = WalletTransaction.objects.get(reference_id=held_reference)
            if tx.amount != -hold.amount:
                raise InvariantViolationError(
                    f"Escrow lock amount mismatch: transaction {tx.amount} != -hold.amount { -hold.amount }."
                )

        elif hold.state in {EscrowState.RELEASED, EscrowState.REFUNDED}:
            txs = WalletTransaction.objects.filter(reference_id__startswith=all_reference_prefix)
            if txs.count() != 2:
                raise InvariantViolationError(
                    f"Binary resolution invariant failed: expected 2 wallet transactions for {hold.state}, found {txs.count()}."
                )
            total = txs.aggregate(total=Sum('amount'))['total']
            if total != Decimal('0.00'):
                raise InvariantViolationError(
                    f"Financial invariant failed: transaction amounts do not net to zero ({total})."
                )
            if not txs.filter(transaction_type='escrow_lock').exists():
                raise InvariantViolationError("Missing escrow lock transaction for terminal state.")
            if not txs.filter(transaction_type__in=['escrow_release', 'escrow_refund']).exists():
                raise InvariantViolationError("Missing terminal escrow transaction for final state.")

        elif hold.state == EscrowState.CANCELLED:
            # CANCELLED must have zero transactions
            tx_count = WalletTransaction.objects.filter(reference_id__startswith=all_reference_prefix).count()
            if tx_count != 0:
                raise InvariantViolationError(
                    f"Invariant Failed: CANCELLED state should have 0 transactions, found {tx_count}."
                )

        elif hold.state == EscrowState.SPLIT_RELEASED:
            txs = WalletTransaction.objects.filter(reference_id__startswith=all_reference_prefix)
            if txs.count() != 3:
                raise InvariantViolationError(
                    f"Split release invariant failed: expected 3 wallet transactions, found {txs.count()}."
                )
            total = txs.aggregate(total=Sum('amount'))['total']
            if total != Decimal('0.00'):
                raise InvariantViolationError(
                    f"Split release invariant failed: transaction amounts do not net to zero ({total})."
                )

    # ─────────────────────────────────────────────────────────────────────────
    # Split Verdict Support (Phase 1.2 — Judgment split resolution)
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    def execute_split_release(
        cls,
        hold_id: int,
        renter_percentage: int,
        judgment_id: int,
        reason: str,
        actor=None,
    ):
        """
        Execute a partial (split) verdict: distribute escrow funds between renter and owner.

        Args:
            hold_id:           ID of the EscrowHold to split
            renter_percentage: Integer 1-99 (percentage going to renter; owner gets remainder)
            judgment_id:       Judgment ID for audit trail reference
            reason:            Human-readable reason for the split
            actor:             The admin/judge user making the call (for logging)

        Invariants enforced:
            - renter_percentage must be 1-99 (0 or 100 use RELEASE/REFUND instead)
            - EscrowHold must be in DISPUTED state
            - Exactly 2 WalletTransactions created, summing exactly to hold.amount
            - State transitions to SPLIT_RELEASED (terminal, irreversible)
        """
        from .context import EscrowEngineContext
        from decimal import Decimal, ROUND_HALF_UP

        if not (1 <= renter_percentage <= 99):
            raise ValueError(
                f"renter_percentage must be 1-99 for a split verdict "
                f"(use RELEASED for 0%, REFUNDED for 100%). Got: {renter_percentage}"
            )

        with transaction.atomic():
            with EscrowEngineContext.activate():
                # 1. Lock row (prevent concurrent modifications)
                try:
                    hold = EscrowHold.objects.select_for_update().get(id=hold_id)
                except EscrowHold.DoesNotExist:
                    raise ValueError(f"EscrowHold #{hold_id} not found.")

                # 2. State validation
                if hold.state != EscrowState.DISPUTED:
                    raise InvalidStateTransitionError(
                        f"Split release requires DISPUTED state. Current state: {hold.state}"
                    )

                cls._validate_pre_invariants(hold)
                
                # 2b. CRITICAL FIX (H-6): Call _check_preconditions for consistency with main transition method
                cls._check_preconditions(hold, EscrowState.SPLIT_RELEASED)

                # 3. Calculate split amounts (Decimal-safe, no float arithmetic)
                renter_pct = Decimal(renter_percentage) / Decimal(100)
                renter_amount = (hold.amount * renter_pct).quantize(
                    Decimal('0.01'), rounding=ROUND_HALF_UP
                )
                owner_amount = hold.amount - renter_amount  # Remainder — avoids rounding drift

                # 4. Resolve parties
                renter = hold.booking.user
                owner = getattr(hold.booking.product, 'owner', None)
                if not owner:
                    # 🛡️ SOVEREIGN INTEGRITY: المالك حُذف بعد إنشاء الضمان.
                    logger.error(
                        "escrow_split_release_ownerless_product",
                        hold_id=hold.id,
                        booking_id=hold.booking.id,
                        action_required="MANUAL_TREASURY_RECONCILIATION"
                    )
                    raise OwnerlessProductError(
                        f"EscrowHold #{hold.id}: Cannot split release. Product owner deleted."
                    )

                renter_wallet, _ = Wallet.objects.select_for_update().get_or_create(user=renter)
                owner_wallet, _ = Wallet.objects.select_for_update().get_or_create(user=owner)

                # 5. Credit renter
                renter_wallet.balance += renter_amount
                renter_wallet.save()
                WalletTransaction.objects.create(
                    wallet=renter_wallet,
                    amount=renter_amount,
                    balance_after=renter_wallet.balance,
                    transaction_type='refund',
                    reference_id=f"escrow_hold:{hold.id}|split_renter|judgment:{judgment_id}",
                    description=(
                        f"حكم تقسيمي ({renter_percentage}% للمستأجر) — "
                        f"حجز #{hold.booking.id}"
                    ),
                )

                # 6. Credit owner
                owner_wallet.balance += owner_amount
                owner_wallet.save()
                WalletTransaction.objects.create(
                    wallet=owner_wallet,
                    amount=owner_amount,
                    balance_after=owner_wallet.balance,
                    transaction_type='escrow_release',
                    reference_id=f"escrow_hold:{hold.id}|split_owner|judgment:{judgment_id}",
                    description=(
                        f"حكم تقسيمي ({100 - renter_percentage}% للمؤجر) — "
                        f"حجز #{hold.booking.id}"
                    ),
                )

                # 7. Transition EscrowHold to terminal SPLIT_RELEASED state
                hold.state = EscrowState.SPLIT_RELEASED
                hold.released_at = timezone.now()
                hold.save()

                # 8. Forensic log
                logger.info(
                    "escrow_split_release",
                    hold_id=hold.id,
                    judgment_id=judgment_id,
                    renter_percentage=renter_percentage,
                    renter_amount=str(renter_amount),
                    owner_amount=str(owner_amount),
                    actor_id=getattr(actor, "id", None),
                    reason=reason,
                )

                # 9. Audit log (must succeed — failure rolls back entire transaction)
                try:
                    AuditService.log(
                        entity=hold,
                        old_state=EscrowState.DISPUTED,
                        new_state=EscrowState.SPLIT_RELEASED,
                        reason=f"Split {renter_percentage}/{100 - renter_percentage}: {reason}",
                        actor=actor,
                    )
                except Exception as e:
                    raise AuditFailureError(
                        f"Audit log failed, rolling back split: {e}"
                    ) from e

                # 10. Post-invariant: both transactions must exist and sum to hold.amount
                split_txs = WalletTransaction.objects.filter(
                    reference_id__startswith=f"escrow_hold:{hold.id}|split_"
                )
                if split_txs.count() != 2:
                    raise InvariantViolationError(
                        f"Split invariant violated: expected 2 transactions, "
                        f"found {split_txs.count()}"
                    )
                tx_total = sum(tx.amount for tx in split_txs)
                if tx_total != hold.amount:
                    raise InvariantViolationError(
                        f"Split invariant violated: transactions sum ({tx_total}) "
                        f"!= hold.amount ({hold.amount})"
                    )

                return {
                    "status": "success",
                    "hold_id": hold.id,
                    "renter_amount": float(renter_amount),
                    "owner_amount": float(owner_amount),
                    "judgment_id": judgment_id,
                }
