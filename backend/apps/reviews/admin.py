"""
Admin for Review app
"""
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Review, ReviewImage


class ReviewImageInline(admin.TabularInline):
    """Inline for ReviewImage"""
    model = ReviewImage
    extra = 0


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'product', 'rating', 'title', 'status', 'created_at']
    list_filter = ['status', 'rating', 'is_verified_purchase', 'created_at']
    search_fields = ['user__email', 'product__name', 'title', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ReviewImageInline]
    
    fieldsets = (
        (_('تفاصيل التقييم'), {
            'fields': ('user', 'product', 'booking', 'rating', 'title', 'comment')
        }),
        (_('الحالة'), {
            'fields': ('status', 'is_verified_purchase', 'helpful_count')
        }),
        (_('الطوابع الزمنية'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ReviewImage)
class ReviewImageAdmin(admin.ModelAdmin):
    list_display = ['review', 'order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['review__title']

