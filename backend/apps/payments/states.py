from django.db import models
from django.utils.translation import gettext_lazy as _

class EscrowState(models.TextChoices):
    """
    Canonical State Machine for EscrowHold.
    Source of Truth for Phase 2 Unification.
    """
    PENDING        = 'pending',        _('Pending')         # Funds not yet secured
    HELD           = 'held',           _('Held')            # Funds secured in vault
    RELEASED       = 'released',       _('Released')        # Funds transferred to owner
    REFUNDED       = 'refunded',       _('Refunded')        # Funds returned to renter
    DISPUTED       = 'disputed',       _('Disputed')        # Funds frozen via Judicial System
    CANCELLED      = 'cancelled',      _('Cancelled')       # Transaction voided before holding
    SPLIT_RELEASED = 'split_released', _('Split Released')  # Partial verdict: split between parties
