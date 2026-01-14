from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan


@admin.register(WarrantyPlan)
class WarrantyPlanAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'plan_type', 'coverage_type', 'price', 'max_coverage_amount', 'is_active', 'is_featured']
    list_filter = ['plan_type', 'coverage_type', 'is_active', 'is_featured']
    search_fields = ['name', 'name_ar']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WarrantyPurchase)
class WarrantyPurchaseAdmin(admin.ModelAdmin):
    list_display = ['booking', 'warranty_plan', 'warranty_price', 'coverage_amount', 'status', 'purchased_at', 'expires_at']
    list_filter = ['status', 'purchased_at']
    search_fields = ['booking__product__name']
    readonly_fields = ['purchased_at', 'activated_at']
    date_hierarchy = 'purchased_at'


@admin.register(WarrantyClaim)
class WarrantyClaimAdmin(admin.ModelAdmin):
    list_display = ['warranty_purchase', 'claim_type', 'claim_amount', 'status', 'approved_amount', 'submitted_at']
    list_filter = ['status', 'claim_type', 'submitted_at']
    search_fields = ['warranty_purchase__booking__product__name', 'description']
    readonly_fields = ['submitted_at', 'reviewed_at', 'paid_at']
    date_hierarchy = 'submitted_at'


@admin.register(InsurancePlan)
class InsurancePlanAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'plan_type', 'base_price', 'price_percentage', 'max_coverage_percentage', 'is_active', 'is_featured']
    list_filter = ['plan_type', 'is_active', 'is_featured']
    search_fields = ['name', 'name_ar']
    readonly_fields = ['created_at', 'updated_at']

