"""
URLs for Product app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryListView, ProductListView, ProductDetailView,
    AdminProductManagementViewSet, AdminCategoryManagementViewSet,
    search_suggestions, matching_accessories, product_metadata,
    ProductVariantListView, ProductVariantDetailView, AdminProductVariantViewSet,
    WishlistViewSet, product_recommendations
)

app_name = 'products'

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/products', AdminProductManagementViewSet, basename='admin-product')
admin_router.register(r'admin/categories', AdminCategoryManagementViewSet, basename='admin-category')
admin_router.register(r'admin/variants', AdminProductVariantViewSet, basename='admin-variant')

# User router
user_router = DefaultRouter()
user_router.register(r'wishlist', WishlistViewSet, basename='wishlist')

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('metadata/', product_metadata, name='product-metadata'),
    path('search-suggestions/', search_suggestions, name='search-suggestions'),
    path('<int:pk>/matching-accessories/', matching_accessories, name='matching-accessories'),
    path('<int:product_id>/variants/', ProductVariantListView.as_view(), name='variant-list'),
    path('variants/<int:pk>/', ProductVariantDetailView.as_view(), name='variant-detail'),
    path('', ProductListView.as_view(), name='product-list'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('<int:pk>/recommendations/', product_recommendations, name='product-recommendations'),
    path('', include(admin_router.urls)),
    path('', include(user_router.urls)),
]

