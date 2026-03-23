"""
Smart Agreement Model (Digital Evidence)
Stores an immutable snapshot of a confirmed booking.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.bookings.models import Booking

class Contract(models.Model):
    """
    Represents a digitally signed, immutable agreement.
    Once created, the snapshot MUST NOT change.
    """
    booking = models.OneToOneField(
        Booking, 
        on_delete=models.CASCADE, 
        related_name='contract',
        verbose_name=_('booking')
    )
    
    # The Core: Immutable Data
    snapshot = models.JSONField(
        _('agreement snapshot'),
        help_text=_('Frozen copy of Renter, Owner, Product, and Terms at moment of booking.')
    )
    
    # 2030 Tech: Integrity
    contract_hash = models.CharField(
        _('digital signature'), 
        max_length=64, 
        help_text=_('SHA-256 hash of the snapshot for integrity verification.'),
        unique=True
    )
    
    version = models.CharField(_('contract version'), max_length=10, default='1.0')
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class ContractStatus(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SIGNED = 'signed', 'Signed'
        VOID = 'void', 'Void'
        LEGACY = 'legacy', 'Legacy (Pre-Phase15)'

    # Fields
    status = models.CharField(
        max_length=10, 
        choices=ContractStatus.choices, 
        default=ContractStatus.DRAFT, 
        db_index=True
    )
    signed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    # ─────────────────────────────────────────────────────────────────────────
    # Phase 1.3: Dual-Signature Implementation
    # ─────────────────────────────────────────────────────────────────────────
    
    # Renter Signature
    renter_signature = models.CharField(_('Renter Signature'), max_length=128, blank=True)
    renter_signed_at = models.DateTimeField(_('Renter Signed At'), null=True, blank=True)
    renter_ip = models.GenericIPAddressField(_('Renter IP'), null=True, blank=True)
    
    # Owner Signature
    owner_signature = models.CharField(_('Owner Signature'), max_length=128, blank=True)
    owner_signed_at = models.DateTimeField(_('Owner Signed At'), null=True, blank=True)
    owner_ip = models.GenericIPAddressField(_('Owner IP'), null=True, blank=True)
    
    is_finalized = models.BooleanField(
        _('Is Finalized?'), 
        default=False, 
        help_text=_('True when both parties have signed. Locks the contract purely.')
    )

    class Meta:
        verbose_name = _('العقد الذكي')
        verbose_name_plural = _('العقود الذكية')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['booking']),
            models.Index(fields=['booking', 'status']),
        ]

    def __str__(self):
        return f"SmartContract #{self.id} (Booking {self.booking.id})"

    def _generate_signature(self, user):
        """Generates an HMAC-SHA256 signature for a specific user based on the contract_hash."""
        import hmac
        import hashlib
        from django.conf import settings
        
        # Payload: Contract Hash + User ID + Secret Key
        msg = f"{self.contract_hash}:{user.id}".encode('utf-8')
        secret = settings.SECRET_KEY.encode('utf-8')
        
        return hmac.new(secret, msg, hashlib.sha256).hexdigest()

    def sign(self, user, ip_address):
        """
        Signs the contract for the given user.
        Raises ValueError if the user is not a party, or if already finalized.
        """
        from django.utils import timezone
        
        if self.is_finalized:
            raise ValueError("Contract is already finalized and cannot be modified.")

        # Identify Party
        is_renter = (user.id == self.booking.user.id)
        is_owner = (user.id == self.booking.product.owner.id)
        
        if not is_renter and not is_owner:
            raise ValueError("User is not a party to this contract.")
            
        sig = self._generate_signature(user)
        now = timezone.now()
        
        if is_renter:
            self.renter_signature = sig
            self.renter_signed_at = now
            self.renter_ip = ip_address
        elif is_owner:
            self.owner_signature = sig
            self.owner_signed_at = now
            self.owner_ip = ip_address
            
        # Check if complete
        if self.renter_signature and self.owner_signature:
            self.is_finalized = True
            self.status = self.ContractStatus.SIGNED
            self.signed_at = now
            
        self.save()

    def save(self, *args, **kwargs):
        """Overrides save to enforce strict immutability when finalized."""
        if self.pk:
            try:
                old = Contract.objects.get(pk=self.pk)
                # If it was already finalized in DB, block ALL mutations.
                # (Unless we are in the exact transaction that finalizes it,
                #  where old.is_finalized is False but self.is_finalized is True)
                if old.is_finalized:
                    raise ValueError("Strict Immutability: Finalized contracts cannot be modified.")
            except Contract.DoesNotExist:
                pass
                
        super().save(*args, **kwargs)

