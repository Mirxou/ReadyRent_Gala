from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import BundleCategory, Bundle, BundleItem, BundleBooking, BundleReview


class BundleItemInline(admin.TabularInline):
    model = BundleItem
    extra = 1
    fields = ['item_type', 'product', 'custom_name', 'quantity', 'is_required', 'order']


@admin.register(BundleCategory)
class BundleCategoryAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'name_ar']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Bundle)
class BundleAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'category', 'base_price', 'bundle_price', 'get_savings', 'is_featured', 'is_active', 'total_bookings']
    list_filter = ['category', 'is_featured', 'is_active', 'created_at']
    search_fields = ['name', 'name_ar', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['total_bookings', 'rating', 'created_at', 'updated_at', 'get_savings', 'get_discount_percentage']
    inlines = [BundleItemInline]
    
    fieldsets = (
        (_('Basic Info'), {
            'fields': ('name', 'name_ar', 'slug', 'category', 'description', 'description_ar', 'image')
        }),
        (_('Pricing'), {
            'fields': ('base_price', 'bundle_price', 'discount_type', 'discount_value', 'get_savings', 'get_discount_percentage')
        }),
        (_('Conditions'), {
            'fields': ('min_days', 'max_days')
        }),
        (_('Status'), {
            'fields': ('is_featured', 'is_active', 'total_bookings', 'rating')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(BundleItem)
class BundleItemAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'get_name', 'item_type', 'quantity', 'is_required', 'order']
    list_filter = ['item_type', 'is_required']
    search_fields = ['bundle__name', 'custom_name', 'product__name']


@admin.register(BundleBooking)
class BundleBookingAdmin(admin.ModelAdmin):
    list_display = ['bundle', 'user', 'start_date', 'end_date', 'total_price', 'get_savings', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'bundle__name']
    readonly_fields = ['created_at', 'updated_at', 'get_savings']
    filter_horizontal = ['individual_bookings']
    date_hierarchy = 'created_at'


@admin.register(BundleReview)
class BundleReviewAdmin(admin.ModelAdmin):
    list_display = ['bundle_booking', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['bundle_booking__bundle__name', 'comment']
    readonly_fields = ['created_at', 'updated_at']

