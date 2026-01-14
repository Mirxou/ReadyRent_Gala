"""
URLs for Vendors app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VendorRegistrationView, VendorProfileView, VendorListView, VendorDetailView,
    VendorProductListView, VendorDashboardView,
    AdminVendorViewSet, AdminCommissionListView, AdminCommissionProcessView,
    VendorPerformanceListView
)

app_name = 'vendors'

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/vendors', AdminVendorViewSet, basename='admin-vendor')

urlpatterns = [
    # Public routes
    path('', VendorListView.as_view(), name='vendor-list'),
    path('<int:pk>/', VendorDetailView.as_view(), name='vendor-detail'),
    
    # Vendor routes
    path('register/', VendorRegistrationView.as_view(), name='vendor-register'),
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('dashboard/', VendorDashboardView.as_view(), name='vendor-dashboard'),
    path('products/', VendorProductListView.as_view(), name='vendor-product-list'),
    path('performance/', VendorPerformanceListView.as_view(), name='vendor-performance-list'),
    
    # Admin routes
    path('admin/commissions/', AdminCommissionListView.as_view(), name='admin-commission-list'),
    path('admin/commissions/<int:pk>/process/', AdminCommissionProcessView.as_view(), name='admin-commission-process'),
    path('', include(admin_router.urls)),
]


