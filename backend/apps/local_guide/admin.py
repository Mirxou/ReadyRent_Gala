from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import ServiceCategory, LocalService, ServiceImage, ServiceReview


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1


class ServiceReviewInline(admin.TabularInline):
    model = ServiceReview
    extra = 0
    readonly_fields = ['created_at']


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'slug', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'name_ar']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(LocalService)
class LocalServiceAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'service_type', 'city', 'rating', 'is_featured', 'is_verified', 'is_active']
    list_filter = ['service_type', 'city', 'is_featured', 'is_verified', 'is_active']
    search_fields = ['name', 'name_ar', 'phone', 'email']
    readonly_fields = ['rating', 'review_count', 'created_at', 'updated_at']
    inlines = [ServiceImageInline, ServiceReviewInline]
    
    fieldsets = (
        (_('Basic Info'), {
            'fields': ('name', 'name_ar', 'service_type', 'category')
        }),
        (_('Description'), {
            'fields': ('description', 'description_ar')
        }),
        (_('Contact'), {
            'fields': ('phone', 'email', 'website', 'whatsapp')
        }),
        (_('Location'), {
            'fields': ('address', 'city', 'latitude', 'longitude')
        }),
        (_('Pricing'), {
            'fields': ('price_range_min', 'price_range_max', 'price_note')
        }),
        (_('Media'), {
            'fields': ('logo', 'cover_image')
        }),
        (_('Status'), {
            'fields': ('is_featured', 'is_verified', 'is_active', 'rating', 'review_count')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ['service', 'user', 'rating', 'is_verified', 'created_at']
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['service__name', 'user__email', 'comment']
    readonly_fields = ['created_at', 'updated_at']

