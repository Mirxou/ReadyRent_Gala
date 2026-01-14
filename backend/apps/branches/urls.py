"""
URLs for Branches app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BranchListView, BranchDetailView, BranchInventoryListView, BranchInventoryDetailView,
    BranchStaffListView, BranchPerformanceListView, BranchStatsView,
    AdminBranchViewSet, AdminBranchInventoryViewSet
)

app_name = 'branches'

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/branches', AdminBranchViewSet, basename='admin-branch')
admin_router.register(r'admin/inventory', AdminBranchInventoryViewSet, basename='admin-branch-inventory')

urlpatterns = [
    # Public routes
    path('', BranchListView.as_view(), name='branch-list'),
    path('<int:pk>/', BranchDetailView.as_view(), name='branch-detail'),
    path('<int:pk>/stats/', BranchStatsView.as_view(), name='branch-stats'),
    
    # Inventory routes
    path('inventory/', BranchInventoryListView.as_view(), name='branch-inventory-list'),
    path('inventory/<int:pk>/', BranchInventoryDetailView.as_view(), name='branch-inventory-detail'),
    
    # Staff routes
    path('staff/', BranchStaffListView.as_view(), name='branch-staff-list'),
    
    # Performance routes
    path('performance/', BranchPerformanceListView.as_view(), name='branch-performance-list'),
    
    path('', include(admin_router.urls)),
]


