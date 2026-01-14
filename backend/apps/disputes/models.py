"""
Dispute models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class Dispute(models.Model):
    """Dispute model"""
    STATUS_CHOICES = [
        ('open', _('Open')),
        ('under_review', _('Under Review')),
        ('in_mediation', _('In Mediation')),
        ('resolved', _('Resolved')),
        ('closed', _('Closed')),
    ]
    
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='disputes',
        verbose_name=_('user'))
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='disputes', null=True, blank=True,
        verbose_name=_('booking'))
    title = models.CharField(_('title'), max_length=200)
    description = models.TextField(_('description'))
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(_('priority'), max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_disputes',
        verbose_name=_('assigned_to'))
    resolution = models.TextField(_('resolution'), blank=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_disputes',
        verbose_name=_('resolved_by'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الخلاف')
        verbose_name_plural = _('الخلافات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"


class DisputeMessage(models.Model):
    """Messages in dispute conversation"""
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='messages',
        verbose_name=_('dispute'))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dispute_messages',
        verbose_name=_('user'))
    message = models.TextField(_('message'))
    attachments = models.JSONField(_('attachments'), default=list, blank=True)
    is_internal = models.BooleanField(_('internal'), default=False, help_text=_('Internal note not visible to user'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('رسالة الخلاف')
        verbose_name_plural = _('رسائل الخلافات')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message {self.id} - {self.dispute.title}"


class SupportTicket(models.Model):
    """Support ticket system"""
    STATUS_CHOICES = [
        ('open', _('Open')),
        ('in_progress', _('In Progress')),
        ('waiting_customer', _('Waiting for Customer')),
        ('resolved', _('Resolved')),
        ('closed', _('Closed')),
    ]
    
    PRIORITY_CHOICES = [
        ('low', _('Low')),
        ('medium', _('Medium')),
        ('high', _('High')),
        ('urgent', _('Urgent')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets',
        verbose_name=_('user'))
    subject = models.CharField(_('subject'), max_length=200)
    description = models.TextField(_('description'))
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(_('priority'), max_length=20, choices=PRIORITY_CHOICES, default='medium')
    category = models.CharField(_('category'), max_length=50, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name=_('assigned_to'))
    resolution = models.TextField(_('resolution'), blank=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('تذكرة الدعم')
        verbose_name_plural = _('تذاكر الدعم')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
        ]
    
    def __str__(self):
        return f"{self.subject} - {self.user.email}"


class TicketMessage(models.Model):
    """Messages in support ticket"""
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages',
        verbose_name=_('ticket'))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ticket_messages',
        verbose_name=_('user'))
    message = models.TextField(_('message'))
    attachments = models.JSONField(_('attachments'), default=list, blank=True)
    is_internal = models.BooleanField(_('internal'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('رسالة التذكرة')
        verbose_name_plural = _('رسائل التذاكر')
        ordering = ['created_at']
    
    def __str__(self):
        return f"Message {self.id} - {self.ticket.subject}"


