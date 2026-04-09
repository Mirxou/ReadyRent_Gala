from django.urls import path
from apps.users.views import (
    RegisterView, LoginView, UserProfileView,
    RequestPhoneVerificationView, VerifyPhoneView,
    UploadIDView, VerifyAddressView,
    CookieTokenRefreshView, LogoutView,
    PasswordResetRequestView, PasswordResetConfirmView,
    Generate2FASecretView, Enable2FAView,
    IdentityDocumentView, BusinessProfileView,
    VerificationStatusView, ChangePasswordView,
    AdminVerificationListView, AdminApproveVerificationView,
    AdminRejectVerificationView, BlacklistListView, AddToBlacklistView,
    StaffListView, StaffRoleViewSet, AdminUserManagementViewSet,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password/change/', ChangePasswordView.as_view(), name='change_password'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('verification/', VerificationStatusView.as_view(), name='verification_status'),
    
    # Verification
    path('verify-phone/request/', RequestPhoneVerificationView.as_view(), name='verify_phone_request'),
    path('verify-phone/confirm/', VerifyPhoneView.as_view(), name='verify_phone_confirm'),
    path('verify-id/', UploadIDView.as_view(), name='verify_id'),
    path('verify-address/', VerifyAddressView.as_view(), name='verify_address'),
    path('kyc/document/', IdentityDocumentView.as_view(), name='kyc_document'),
    path('kyb/business/', BusinessProfileView.as_view(), name='kyb_business'),
    path('verification/phone/request/', RequestPhoneVerificationView.as_view(), name='verification_phone_request'),
    path('verification/phone/verify/', VerifyPhoneView.as_view(), name='verification_phone_verify'),
    
    # Password Reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password/reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request_legacy'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm_legacy'),

    # Admin compatibility routes
    path('admin/verifications/', AdminVerificationListView.as_view(), name='admin_verifications'),
    path('admin/verifications/<int:user_id>/approve/', AdminApproveVerificationView.as_view(), name='admin_verification_approve'),
    path('admin/verifications/<int:user_id>/reject/', AdminRejectVerificationView.as_view(), name='admin_verification_reject'),
    path('admin/users/', AdminUserManagementViewSet.as_view({'get': 'list'}), name='admin_users'),
    path('admin/blacklist/', BlacklistListView.as_view(), name='admin_blacklist'),
    path('admin/blacklist/add/', AddToBlacklistView.as_view(), name='admin_blacklist_add'),

    # Staff compatibility routes
    path('staff/list/', StaffListView.as_view(), name='staff_list'),
    path('staff/roles/', StaffRoleViewSet.as_view({'get': 'list', 'post': 'create'}), name='staff_roles'),
    path('staff/roles/<int:pk>/', StaffRoleViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='staff_roles_detail'),

    # Security (Phase 6)
    path('security/2fa/generate/', Generate2FASecretView.as_view(), name='2fa_generate'),
    path('security/2fa/enable/', Enable2FAView.as_view(), name='2fa_enable'),
]
