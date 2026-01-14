"""
URLs for User app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserProfileView, AdminUserManagementViewSet,
    VerificationStatusView, RequestPhoneVerificationView, VerifyPhoneView,
    UploadIDView, VerifyAddressView, AdminVerificationListView,
    AdminApproveVerificationView, AdminRejectVerificationView,
    BlacklistListView, AddToBlacklistView,
    StaffRoleViewSet, ActivityLogViewSet, ShiftViewSet, PerformanceReviewViewSet,
    StaffListView, PasswordResetRequestView, PasswordResetConfirmView
)

app_name = 'users'

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/users', AdminUserManagementViewSet, basename='admin-user')
admin_router.register(r'staff/roles', StaffRoleViewSet, basename='staff-role')
admin_router.register(r'staff/activity-logs', ActivityLogViewSet, basename='activity-log')
admin_router.register(r'staff/shifts', ShiftViewSet, basename='shift')
admin_router.register(r'staff/performance-reviews', PerformanceReviewViewSet, basename='performance-review')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Password reset routes
    path('password/reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Verification routes
    path('verification/', VerificationStatusView.as_view(), name='verification-status'),
    path('verification/phone/request/', RequestPhoneVerificationView.as_view(), name='request-phone-verification'),
    path('verification/phone/verify/', VerifyPhoneView.as_view(), name='verify-phone'),
    path('verification/id/upload/', UploadIDView.as_view(), name='upload-id'),
    path('verification/address/', VerifyAddressView.as_view(), name='verify-address'),
    
    # Admin verification routes
    path('admin/verifications/', AdminVerificationListView.as_view(), name='admin-verification-list'),
    path('admin/verifications/<int:user_id>/approve/', AdminApproveVerificationView.as_view(), name='admin-approve-verification'),
    path('admin/verifications/<int:user_id>/reject/', AdminRejectVerificationView.as_view(), name='admin-reject-verification'),
    path('admin/blacklist/', BlacklistListView.as_view(), name='admin-blacklist-list'),
    path('admin/blacklist/add/', AddToBlacklistView.as_view(), name='admin-add-blacklist'),
    
    # Staff management routes
    path('staff/list/', StaffListView.as_view(), name='staff-list'),
    
    path('', include(admin_router.urls)),
]

