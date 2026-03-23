from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

class Vouch(models.Model):
    """
    Social Vouching System.
    Golden Users (>80 score) can vouch for new users to boost their Trust Score.
    """
    RELATIONSHIP_CHOICES = [
        ('family', _('Family')),
        ('friend', _('Friend')),
        ('colleague', _('Colleague')),
        ('neighbor', _('Neighbor')),
        ('community', _('Community Member')),
    ]

    TRUST_LEVEL_CHOICES = [
        (1, _('I know them')),
        (2, _('I trust them')),
        (3, _('I highly trust them')),
        (4, _('I guarantee for them')),
        (5, _('Relative / Inner Circle')),
    ]

    voucher = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='vouchers_given',
        verbose_name=_("Voucher")
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='vouches_received',
        verbose_name=_("Receiver")
    )
    
    relationship = models.CharField(_('relationship'), max_length=20, choices=RELATIONSHIP_CHOICES, default='community')
    trust_level = models.IntegerField(_('trust level'), choices=TRUST_LEVEL_CHOICES, default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('voucher', 'receiver')
        verbose_name = _('تزكية')
        verbose_name_plural = _('تزكيات')

    def __str__(self):
        return f"{self.voucher} -> {self.receiver}"


class Referral(models.Model):
    """
    The Propaganda: Referral System with Social Collateral.
    - Referrer (Parent) stakes their reputation on the Referred (Child).
    - If Child acts maliciously, Parent is penalized (Parent Penalty).
    """
    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referrals_sent',
        verbose_name=_("Referrer (Parent)")
    )
    referred = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referral_received',
        verbose_name=_("Referred (Child)")
    )
    referral_code = models.CharField(_("Referral Code"), max_length=50, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', _('Pending')),
            ('completed', _('Completed')),
            ('revoked', _('Revoked (Penalty Applied)')),
        ],
        default='pending'
    )
    social_collateral = models.IntegerField(
        _("Social Collateral"), 
        default=20,
        help_text=_("Points deducted from Parent if Child is blacklisted.")
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('الإحالة')
        verbose_name_plural = _('الإحالات')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.referrer} invited {self.referred}"
