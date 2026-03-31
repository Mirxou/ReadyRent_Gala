"""
Payment models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.conf import settings


class PaymentMethod(models.Model):
    """Payment method configuration"""
    METHOD_CHOICES = [
        ('baridimob', _('BaridiMob')),
        ('bank_card', _('Bank Card')),
        # GAP-03 FIX (2026-03-31): E-Dahabia (Golden Card) + COD. Ref: AUDIT_BASELINE.md §12.2 GAP-03.
        ('edahabia', _('E-Dahabia (البطاقة الذهبية)')),
        ('cod', _('دفع عند الاستلام (COD)')),
    ]
    
    name = models.CharField(_('name'), max_length=50, choices=METHOD_CHOICES, unique=True)
    is_active = models.BooleanField(_('active'), default=True)
    display_name = models.CharField(_('display name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    icon = models.CharField(_('icon'), max_length=100, blank=True, help_text=_('Icon class or URL'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('طريقة الدفع')
        verbose_name_plural = _('طرق الدفع')
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


class Payment(models.Model):
    """Payment model"""
    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('processing', _('Processing')),
        ('completed', _('Completed')),
        ('failed', _('Failed')),
        ('cancelled', _('Cancelled')),
        ('refunded', _('Refunded')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('user'))
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True,
        verbose_name=_('booking'))
    payment_method = models.CharField(
        _('payment method'),
        max_length=20,
        choices=PaymentMethod.METHOD_CHOICES
    )
    
    # GAP-03: E-Dahabia specific fields
    edahabia_card_number_hash = models.CharField(
        _('E-Dahabia card hash'), max_length=88, blank=True,
        help_text='HMAC-SHA256 of card number for idempotency — never store plaintext'
    )
    # GAP-03: COD specific fields
    cod_delivery_address = models.TextField(_('COD delivery address'), blank=True)
    cod_confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='cod_confirmations',
        verbose_name=_('COD confirmed by staff')
    )
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    currency = models.CharField(_('currency'), max_length=3, default='DZD')
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Payment method specific data
    # For BaridiMob
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True)
    otp_code = models.CharField(_('OTP code'), max_length=10, blank=True)
    
    # For Bank Card
    card_last_four = models.CharField(_('card last four'), max_length=4, blank=True)
    card_brand = models.CharField(_('card brand'), max_length=20, blank=True)
    
    # Transaction details
    transaction_id = models.CharField(_('transaction ID'), max_length=100, blank=True, unique=True, null=True)
    gateway_response = models.JSONField(_('gateway response'), default=dict, blank=True)
    failure_reason = models.TextField(_('failure reason'), blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('الدفع')
        verbose_name_plural = _('المدفوعات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking', 'status']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['payment_method', 'status']),
        ]
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency} - {self.get_status_display()}"


class PaymentWebhook(models.Model):
    """Webhook logs for payment gateways"""
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='webhooks',
        null=True,
        blank=True,
        verbose_name=_('payment'))
    payment_method = models.CharField(_('payment method'), max_length=20)
    event_type = models.CharField(_('event type'), max_length=50)
    
    # 🔐 IDEMPOTENCY PROTECTION (Phase 16.1)
    # CRITICAL: event_id MUST be provided by gateway
    # null=False ensures uniqueness constraint works correctly in PostgreSQL
    event_id = models.CharField(
        _('event ID'),
        max_length=150,
        unique=True,
        db_index=True,
        null=False,  # ← ENFORCED: No null values allowed
        blank=False,  # ← ENFORCED: Required in forms/serializers
        default='legacy_event', # Temporary default for migration
        help_text=_('Gateway event ID for idempotency protection')
    )
    
    payload = models.JSONField(_('payload'), default=dict)
    headers = models.JSONField(_('headers'), default=dict, blank=True)
    processed = models.BooleanField(_('processed'), default=False)
    error_message = models.TextField(_('error message'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Webhook الدفع')
        verbose_name_plural = _('Webhooks الدفع')
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['payment_method', 'event_id'],
                name='unique_webhook_event'
            )
        ]
    
    def __str__(self):
        return f"Webhook {self.id} - {self.event_type} - {self.payment_method}"


class Wallet(models.Model):
    """
    The Digital Vault.
    Stores user funds.
    CRITICAL: Never use float for balance.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(_('Balance'), max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, default='DZD')
    
    is_frozen = models.BooleanField(default=False)
    frozen_reason = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Wallet ({self.user.email}): {self.balance} {self.currency}"

from .states import EscrowState

class EscrowHold(models.Model):
    """
    The Safety Lock.
    Holds funds for a specific Booking or Dispute.
    """
    STATUS_CHOICES = [
        ('held', _('Held')),
        ('released', _('Released')),
        ('refunded', _('Refunded')),
        ('disputed', _('Disputed')),
    ]
    
    wallet = models.ForeignKey(Wallet, on_delete=models.PROTECT, related_name='escrow_holds')
    booking = models.OneToOneField('bookings.Booking', on_delete=models.PROTECT, related_name='escrow_hold')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='DZD')
    
    # ⚠️ DEPRECATED: Use 'state' instead. Will be removed in Phase 3.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='held')
    
    # ✅ CANONICAL STATE (Phase 2 Source of Truth)
    # WARNING: Do not write directly to this field in business logic.
    # Use EscrowEngine (Phase 3) or specific services.
    state = models.CharField(
        max_length=20,
        choices=EscrowState.choices,
        default=EscrowState.PENDING,
        db_index=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['booking'],
                name='unique_escrow_per_booking'
            )
        ]
    
    def save(self, *args, **kwargs):
        from .context import EscrowEngineContext
        
        # Guard: Prevent Direct State Writse (Phase 3)
        if self.pk:
            current = EscrowHold.objects.get(pk=self.pk)
            if current.state != self.state:
                # State is changing
                if not EscrowEngineContext.is_active():
                    # We are changing state OUTSIDE the Engine!
                    # For Phase 3 Migration (Strict Mode): RAISE ERROR
                    raise ValueError(
                        f"CRITICAL: Direct write to EscrowHold.state ({current.state} -> {self.state}) is FORBIDDEN. "
                        "Must use EscrowEngine.transition()."
                    )
        
        super().save(*args, **kwargs)

    def get_progress_percentage(self) -> int:
        """
        Calculate visual progress based on the Sovereign State Machine.
        Returns 0 to 100.
        """
        progress_map = {
            EscrowState.PENDING: 10,
            EscrowState.HELD: 50,
            EscrowState.DISPUTED: 50,
            EscrowState.RELEASED: 100,
            EscrowState.REFUNDED: 100,
            EscrowState.CANCELLED: 100,
            EscrowState.SPLIT_RELEASED: 100,
        }
        return progress_map.get(self.state, 0)

    def is_release_ready(self) -> bool:
        """
        Check if the escrow can be transitioned to RELEASED.
        Standard Rule: Booking must be 'completed' (item returned & inspected).
        """
        return self.state == EscrowState.HELD and self.booking.status == 'completed'

    def __str__(self):
        return f"Escrow #{self.id} ({self.amount}) - {self.state}"


class WalletTransaction(models.Model):
    """
    The Immutable Ledger.
    Tracks every single movement of funds.
    """
    TYPE_CHOICES = [
        ('deposit', _('Deposit')),
        ('withdrawal', _('Withdrawal')),
        ('payment', _('Payment')),
        ('refund', _('Refund')),
        ('escrow_lock', _('Escrow Lock')),
        ('escrow_release', _('Escrow Release')),
        ('escrow_refund', _('Escrow Refund')),  # GAP-05 FIX (2026-03-31): was in docs, missing from code
        ('penalty', _('Penalty')),
    ]
    
    wallet = models.ForeignKey(Wallet, on_delete=models.PROTECT, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2) # Positive or Negative
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reference_id = models.CharField(max_length=100, blank=True) # e.g. Payment ID, Booking ID
    description = models.CharField(max_length=255)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.transaction_type}: {self.amount} ({self.created_at})"
