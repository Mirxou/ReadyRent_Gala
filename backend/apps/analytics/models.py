"""
Analytics models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.db.models import Sum, Count, Avg
from django.core.validators import MinValueValidator, MaxValueValidator


class AnalyticsEvent(models.Model):
    """Track various analytics events"""
    EVENT_TYPE_CHOICES = [
        ('page_view', _('Page View')),
        ('product_view', _('Product View')),
        ('search', _('Search')),
        ('booking_created', _('Booking Created')),
        ('booking_completed', _('Booking Completed')),
        ('user_registration', _('User Registration')),
        ('cart_add', _('Cart Add')),
        ('cart_remove', _('Cart Remove')),
        ('checkout_started', _('Checkout Started')),
        ('conversion', _('Conversion')),
        ('other', _('Other')),
    ]
    
    event_type = models.CharField(_('event type'), max_length=30, choices=EVENT_TYPE_CHOICES)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analytics_events',
        verbose_name=_('user'))
    session_id = models.CharField(_('session ID'), max_length=100, blank=True)
    
    # Event data
    event_data = models.JSONField(
        _('event data'),
        default=dict,
        blank=True,
        help_text=_('Additional event-specific data')
    )
    
    # Metadata
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    user_agent = models.TextField(_('user agent'), blank=True)
    referrer = models.URLField(_('referrer'), blank=True)
    
    timestamp = models.DateTimeField(_('timestamp'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('حدث التحليلات')
        verbose_name_plural = _('أحداث التحليلات')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.timestamp}"


class ProductAnalytics(models.Model):
    """Product-specific analytics aggregated data"""
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='analytics',
        verbose_name=_('product'))
    
    # Views
    total_views = models.IntegerField(_('total views'), default=0)
    unique_views = models.IntegerField(_('unique views'), default=0)
    
    # Engagement
    total_searches = models.IntegerField(_('total searches'), default=0)
    total_cart_adds = models.IntegerField(_('total cart adds'), default=0)
    
    # Conversions
    total_bookings = models.IntegerField(_('total bookings'), default=0)
    conversion_rate = models.DecimalField(
        _('conversion rate'),
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text=_('Percentage of views that resulted in bookings')
    )
    
    # Revenue
    total_revenue = models.DecimalField(_('total revenue'), max_digits=10, decimal_places=2, default=0)
    
    # Dates
    last_viewed = models.DateTimeField(_('last viewed'), null=True, blank=True)
    last_booked = models.DateTimeField(_('last booked'), null=True, blank=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('تحليلات المنتج')
        verbose_name_plural = _('تحليلات المنتجات')
    
    def __str__(self):
        return f"Analytics for {self.product.name_ar}"
    
    def update_conversion_rate(self):
        """Update conversion rate"""
        if self.total_views > 0:
            self.conversion_rate = (self.total_bookings / self.total_views) * 100
            self.save()


class DailyAnalytics(models.Model):
    """Daily aggregated analytics"""
    date = models.DateField(_('date'), unique=True)
    
    # User metrics
    new_users = models.IntegerField(_('new users'), default=0)
    active_users = models.IntegerField(_('active users'), default=0)
    total_users = models.IntegerField(_('total users'), default=0)
    
    # Booking metrics
    bookings_created = models.IntegerField(_('bookings created'), default=0)
    bookings_completed = models.IntegerField(_('bookings completed'), default=0)
    bookings_cancelled = models.IntegerField(_('bookings cancelled'), default=0)
    
    # Revenue
    total_revenue = models.DecimalField(_('total revenue'), max_digits=10, decimal_places=2, default=0)
    average_booking_value = models.DecimalField(_('average booking value'), max_digits=10, decimal_places=2, default=0)
    
    # Product metrics
    products_viewed = models.IntegerField(_('products viewed'), default=0)
    unique_products_viewed = models.IntegerField(_('unique products viewed'), default=0)
    
    # Search metrics
    total_searches = models.IntegerField(_('total searches'), default=0)
    unique_searches = models.IntegerField(_('unique searches'), default=0)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('التحليلات اليومية')
        verbose_name_plural = _('التحليلات اليومية')
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.date}"


class UserBehavior(models.Model):
    """User behavior tracking"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='behavior',
        verbose_name=_('user'))
    
    # Activity
    last_login = models.DateTimeField(_('last login'), null=True, blank=True)
    total_sessions = models.IntegerField(_('total sessions'), default=0)
    total_page_views = models.IntegerField(_('total page views'), default=0)
    
    # Engagement
    favorite_categories = models.JSONField(_('favorite categories'), default=list, blank=True)
    favorite_products = models.JSONField(_('favorite products'), default=list, blank=True)
    
    # Purchase behavior
    total_bookings = models.IntegerField(_('total bookings'), default=0)
    total_spent = models.DecimalField(_('total spent'), max_digits=10, decimal_places=2, default=0)
    average_booking_value = models.DecimalField(_('average booking value'), max_digits=10, decimal_places=2, default=0)
    
    # Preferences
    preferred_price_range = models.JSONField(_('preferred price range'), default=dict, blank=True)
    preferred_rental_duration = models.IntegerField(_('preferred rental duration (days)'), null=True, blank=True)
    
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('سلوك المستخدم')
        verbose_name_plural = _('سلوكيات المستخدمين')
    
    def __str__(self):
        return f"Behavior for {self.user.email}"


class Forecast(models.Model):
    """Demand forecasting model"""
    FORECAST_TYPE_CHOICES = [
        ('product', _('Product Forecast')),
        ('category', _('Category Forecast')),
        ('seasonal', _('Seasonal Forecast')),
        ('trend', _('Trend Forecast')),
    ]
    
    forecast_type = models.CharField(_('forecast type'), max_length=20, choices=FORECAST_TYPE_CHOICES)
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='forecasts',
        verbose_name=_('product'))
    category = models.ForeignKey(
        'products.Category',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='forecasts',
        verbose_name=_('category'))
    
    # Forecast period
    forecast_start = models.DateField(_('forecast start'))
    forecast_end = models.DateField(_('forecast end'))
    forecast_date = models.DateField(_('forecast date'), auto_now_add=True)
    
    # Forecasted values
    predicted_demand = models.IntegerField(_('predicted demand'), default=0)
    predicted_revenue = models.DecimalField(_('predicted revenue'), max_digits=12, decimal_places=2, default=0)
    confidence_level = models.DecimalField(
        _('confidence level'),
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_('Confidence level percentage (0-100)')
    )
    
    # Seasonal factors
    seasonal_factor = models.DecimalField(_('seasonal factor'), max_digits=5, decimal_places=2, default=1.0)
    trend_factor = models.DecimalField(_('trend factor'), max_digits=5, decimal_places=2, default=1.0)
    
    # Additional data
    forecast_data = models.JSONField(_('forecast data'), default=dict, blank=True)
    notes = models.TextField(_('notes'), blank=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('التوقع')
        verbose_name_plural = _('التوقعات')
        ordering = ['-forecast_date', '-forecast_start']
        indexes = [
            models.Index(fields=['forecast_type', 'forecast_start']),
            models.Index(fields=['product', 'forecast_start']),
            models.Index(fields=['category', 'forecast_start']),
        ]
    
    def __str__(self):
        if self.product:
            return f"Forecast for {self.product.name_ar} - {self.forecast_start} to {self.forecast_end}"
        elif self.category:
            return f"Forecast for {self.category.name_ar} - {self.forecast_start} to {self.forecast_end}"
        return f"{self.get_forecast_type_display()} - {self.forecast_start} to {self.forecast_end}"