from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import AnalyticsEvent, ProductAnalytics, DailyAnalytics, UserBehavior, Forecast


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'user', 'session_id', 'timestamp']
    list_filter = ['event_type', 'timestamp']
    search_fields = ['user__email', 'session_id']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(ProductAnalytics)
class ProductAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['product', 'total_views', 'total_bookings', 'conversion_rate', 'total_revenue', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['product__name']
    readonly_fields = ['updated_at']


@admin.register(DailyAnalytics)
class DailyAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'new_users', 'active_users', 'bookings_created', 'total_revenue', 'updated_at']
    list_filter = ['date']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'


@admin.register(UserBehavior)
class UserBehaviorAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_sessions', 'total_bookings', 'total_spent', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['user__email']
    readonly_fields = ['updated_at']


@admin.register(Forecast)
class ForecastAdmin(admin.ModelAdmin):
    list_display = ['forecast_type', 'product', 'category', 'forecast_start', 'forecast_end', 'predicted_demand', 'predicted_revenue', 'confidence_level', 'forecast_date']
    list_filter = ['forecast_type', 'forecast_start', 'forecast_end']
    search_fields = ['product__name', 'product__name_ar', 'category__name', 'category__name_ar']
    readonly_fields = ['forecast_date', 'created_at', 'updated_at']
    date_hierarchy = 'forecast_start'

