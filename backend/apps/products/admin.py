from django.contrib import admin
from .models import Category, Product, ProductImage, ProductVariant
from django.utils.translation import gettext_lazy as _


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'name', 'slug', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'name_ar', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'category', 'price_per_day', 'size', 'status', 'is_featured', 'rating']
    list_filter = ['category', 'status', 'is_featured', 'size']
    search_fields = ['name', 'name_ar', 'description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_primary', 'order', 'created_at']
    list_filter = ['is_primary']
    search_fields = ['product__name', 'alt_text']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['name', 'product', 'size', 'color', 'sku', 'price_per_day', 'is_active', 'created_at']
    list_filter = ['size', 'color', 'is_active', 'created_at']
    search_fields = ['name', 'sku', 'product__name', 'product__name_ar']
    readonly_fields = ['sku', 'created_at', 'updated_at']

