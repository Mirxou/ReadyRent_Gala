from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import PackagingType, PackagingMaterial, PackagingRule, PackagingInstance, PackagingMaterialUsage


class PackagingMaterialUsageInline(admin.TabularInline):
    model = PackagingMaterialUsage
    extra = 1


@admin.register(PackagingType)
class PackagingTypeAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'size', 'is_active']
    list_filter = ['size', 'is_active']
    search_fields = ['name', 'name_ar']


@admin.register(PackagingMaterial)
class PackagingMaterialAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'material_type', 'cost_per_unit', 'is_reusable', 'is_active']
    list_filter = ['material_type', 'is_reusable', 'is_active']
    search_fields = ['name', 'name_ar']


@admin.register(PackagingRule)
class PackagingRuleAdmin(admin.ModelAdmin):
    list_display = ['product', 'product_category', 'packaging_type', 'priority', 'is_active']
    list_filter = ['is_active', 'requires_protection']
    search_fields = ['product__name', 'product_category__name']


@admin.register(PackagingInstance)
class PackagingInstanceAdmin(admin.ModelAdmin):
    list_display = ['booking', 'packaging_type', 'status', 'packaging_cost', 'prepared_at', 'prepared_by']
    list_filter = ['status', 'prepared_at']
    search_fields = ['booking__product__name']
    readonly_fields = ['prepared_at']
    inlines = [PackagingMaterialUsageInline]


@admin.register(PackagingMaterialUsage)
class PackagingMaterialUsageAdmin(admin.ModelAdmin):
    list_display = ['packaging_instance', 'material', 'quantity', 'total_cost']
    list_filter = ['material']

