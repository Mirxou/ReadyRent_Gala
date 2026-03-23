from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

class AuditLog(models.Model):
    """
    Immutable Audit Log for critical system actions.
    Tracks WHO did WHAT, WHEN, WHERE (IP), and to WHICH object.
    MANDATORY for Banking-Grade Security (Phase 15.4).
    """
    ACTION_CHOICES = [
        ('CREATE', _('Creation')),
        ('UPDATE', _('Update')),
        ('DELETE', _('Deletion')),
        ('LOGIN', _('Login')),
        ('LOGOUT', _('Logout')),
        ('RISK_FLAG', _('Risk Flag')),
        ('DISPUTE_ACTION', _('Dispute Action')),
        ('ESCROW_MOVE', _('Escrow Movement')),
        ('SECURITY_ALERT', _('Security Alert')),
    ]

    # WHO
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text=_("User who performed the action")
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    # WHAT
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    changes = models.JSONField(default=dict, blank=True, help_text=_("JSON diff of changes"))
    metadata = models.JSONField(default=dict, blank=True, help_text=_("Context (User Agent, etc.)"))

    # WHICH OBJECT (Generic Relation)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255) # Char to support UUIDs if needed
    content_object = GenericForeignKey('content_type', 'object_id')

    # WHEN
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = _("Audit Log")
        verbose_name_plural = _("Audit Logs")
        indexes = [
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['actor', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.timestamp} - {self.action} by {self.actor} on {self.content_object}"
