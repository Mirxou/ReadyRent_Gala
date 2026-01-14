"""
Chatbot models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.utils import timezone


class ChatSession(models.Model):
    """Chat session with the AI chatbot"""
    STATUS_CHOICES = [
        ('active', _('Active')),
        ('resolved', _('Resolved')),
        ('escalated', _('Escalated to Human')),
        ('closed', _('Closed')),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        null=True,
        blank=True,
        verbose_name=_('user'))
    session_id = models.CharField(
        _('session ID'),
        max_length=100,
        unique=True,
        help_text=_('Unique session identifier')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    language = models.CharField(
        _('language'),
        max_length=10,
        default='ar',
        choices=[('ar', 'العربية'), ('fr', 'Français'), ('en', 'English')]
    )
    started_at = models.DateTimeField(_('started at'), auto_now_add=True)
    resolved_at = models.DateTimeField(_('resolved at'), null=True, blank=True)
    escalated_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='escalated_chats',
        limit_choices_to={'role__in': ['admin', 'staff']},
        verbose_name=_('escalated_to'))
    escalated_at = models.DateTimeField(_('escalated at'), null=True, blank=True)
    
    # Context
    context_data = models.JSONField(
        _('context data'),
        default=dict,
        blank=True,
        help_text=_('Additional context about the conversation')
    )
    
    class Meta:
        verbose_name = _('جلسة الدردشة')
        verbose_name_plural = _('جلسات الدردشة')
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"Chat Session {self.session_id} - {self.get_status_display()}"


class ChatMessage(models.Model):
    """Messages in a chat session"""
    ROLE_CHOICES = [
        ('user', _('User')),
        ('assistant', _('Assistant')),
        ('system', _('System')),
    ]
    
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name=_('session'))
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=ROLE_CHOICES
    )
    content = models.TextField(_('content'))
    
    # AI-specific fields
    model_used = models.CharField(
        _('AI model used'),
        max_length=50,
        blank=True,
        help_text=_('AI model version used (e.g., gpt-4, gpt-3.5-turbo)')
    )
    tokens_used = models.IntegerField(
        _('tokens used'),
        null=True,
        blank=True,
        help_text=_('Number of tokens consumed')
    )
    
    # Metadata
    metadata = models.JSONField(
        _('metadata'),
        default=dict,
        blank=True,
        help_text=_('Additional message metadata')
    )
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('رسالة الدردشة')
        verbose_name_plural = _('رسائل الدردشة')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.session.session_id} - {self.role} - {self.created_at}"


class ChatIntent(models.Model):
    """Detected intents from user messages"""
    INTENT_TYPES = [
        ('product_inquiry', _('Product Inquiry')),
        ('booking_help', _('Booking Help')),
        ('return_inquiry', _('Return Inquiry')),
        ('delivery_status', _('Delivery Status')),
        ('pricing', _('Pricing')),
        ('general_info', _('General Information')),
        ('complaint', _('Complaint')),
        ('compliment', _('Compliment')),
        ('other', _('Other')),
    ]
    
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='intents',
        verbose_name=_('session'))
    message = models.ForeignKey(
        ChatMessage,
        on_delete=models.CASCADE,
        related_name='intents',
        verbose_name=_('message'))
    intent_type = models.CharField(
        _('intent type'),
        max_length=50,
        choices=INTENT_TYPES
    )
    confidence = models.DecimalField(
        _('confidence'),
        max_digits=5,
        decimal_places=4,
        help_text=_('Confidence score (0-1)')
    )
    extracted_entities = models.JSONField(
        _('extracted entities'),
        default=dict,
        blank=True,
        help_text=_('Extracted entities from the message')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('نية الدردشة')
        verbose_name_plural = _('نيات الدردشة')
        ordering = ['-confidence', '-created_at']
    
    def __str__(self):
        return f"{self.intent_type} ({self.confidence})"


class ChatbotConfiguration(models.Model):
    """Configuration for the chatbot"""
    key = models.CharField(
        _('key'),
        max_length=100,
        unique=True
    )
    value = models.TextField(_('value'))
    description = models.TextField(_('description'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('إعدادات الدردشة الآلية')
        verbose_name_plural = _('إعدادات الدردشة الآلية')
    
    def __str__(self):
        return f"{self.key} - {self.is_active}"

