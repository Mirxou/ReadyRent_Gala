from django.urls import path
from apps.users.views import (
    RegisterView, LoginView, UserProfileView,
    RequestPhoneVerificationView, VerifyPhoneView,
    UploadIDView, VerifyAddressView,
    CookieTokenRefreshView, LogoutView,
    PasswordResetRequestView, PasswordResetConfirmView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Verification
    path('verify-phone/request/', RequestPhoneVerificationView.as_view(), name='verify_phone_request'),
    path('verify-phone/confirm/', VerifyPhoneView.as_view(), name='verify_phone_confirm'),
    path('verify-id/', UploadIDView.as_view(), name='verify_id'),
    path('verify-address/', VerifyAddressView.as_view(), name='verify_address'),
    
    # Password Reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]