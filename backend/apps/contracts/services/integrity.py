
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction
from apps.contracts.models import Contract
import logging

logger = logging.getLogger(__name__)

class ContractIntegrityService:
    """
    The Guardian of Contract Legal Integrity.
    Enforces the lifecycle: DRAFT -> SIGNED -> VOID.
    Prevents retroactive fabrication and ensures immutability.
    """

    @staticmethod
    def is_enforceable(contract: Contract) -> bool:
        """
        Determines if a contract is legally enforceable.
        Must be SIGNED and have a valid signed_at timestamp.
        LEGACY contracts are NOT enforceable by default.
        """
        if contract.status == Contract.ContractStatus.SIGNED:
            return contract.signed_at is not None
        return False

    @staticmethod
    def sign_contract(contract: Contract) -> Contract:
        """
        Transitions a DRAFT contract to SIGNED.
        Sets the official timestamp.
        """
        if contract.status != Contract.ContractStatus.DRAFT:
            raise ValidationError(f"Cannot sign contract in {contract.status} state. Only DRAFT contracts can be signed.")

        # Atomic update to prevent race conditions
        with transaction.atomic():
            # Refresh to lock row? (Optional for now, but good practice)
            # contract = Contract.objects.select_for_update().get(id=contract.id)
            
            contract.status = Contract.ContractStatus.SIGNED
            contract.signed_at = timezone.now()
            contract.save()
            
            logger.info(f"Contract #{contract.id} SIGNED at {contract.signed_at}. Snapshot frozen.")
            
        return contract

    @staticmethod
    def update_contract(contract: Contract, **updates) -> Contract:
        """
        Updates a contract's mutable fields (if any).
        STRICT IMMUTABILITY GUARD:
        Once SIGNED or VOID, a contract CANNOT be modified.
        """
        if contract.status in [Contract.ContractStatus.SIGNED, Contract.ContractStatus.VOID]:
            raise ValidationError(f"Immutable Contract #{contract.id} cannot be modified in {contract.status} state.")
            
        if contract.status == Contract.ContractStatus.LEGACY:
             # Legacy contracts shouldn't really be touched either without migration
             raise ValidationError("Legacy contracts are read-only until migrated.")

        # Apply updates
        for field, value in updates.items():
            if hasattr(contract, field):
                setattr(contract, field, value)
        
        contract.save()
        return contract

    @staticmethod
    def void_contract(contract: Contract, reason: str) -> Contract:
        """
        Voids a contract. One-way trapdoor.
        """
        if contract.status == Contract.ContractStatus.VOID:
             return contract
             
        contract.status = Contract.ContractStatus.VOID
        contract.save()
        logger.warning(f"Contract #{contract.id} VOIDED. Reason: {reason}")
        return contract
