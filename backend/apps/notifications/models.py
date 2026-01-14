"""
Notification models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class Notification(models.Model):
    """Notification model"""
    TYPE_CHOICES = [
        ('booking_confirmed', _('Booking Confirmed')),
        ('booking_reminder', _('Booking Reminder')),
        ('booking_completed', _('Booking Completed')),
        ('return_reminder', _('Return Reminder')),
        ('product_available', _('Product Available')),
        ('system', _('System Notification')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications',
        verbose_name=_('user'))
    type = models.CharField(_('type'), max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(_('title'), max_length=200)
    message = models.TextField(_('message'))
    is_read = models.BooleanField(_('read'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('الإشعار')
        verbose_name_plural = _('الإشعارات')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"

