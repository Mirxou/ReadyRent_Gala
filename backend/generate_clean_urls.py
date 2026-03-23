import os

content = """from django.urls import path
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
"""

file_path = os.path.join("apps", "users", "urls.py")

# Ensure directory exists
os.makedirs(os.path.dirname(file_path), exist_ok=True)

# Write with utf-8 encoding explicitly
if os.path.exists(file_path):
    os.remove(file_path)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content.strip()) # strip to remove any leading/trailing weirdness

print(f"Successfully generated {file_path}")

# VERIFICATION
with open(file_path, "rb") as f:
    raw = f.read()
    print(f"File size: {len(raw)} bytes")
    if b'\x00' in raw:
        print("CRITICAL: Null bytes detected in file!")
        print(raw)
    else:
        print("Verification PASSED: No null bytes found.")
        print(f"Head: {raw[:50]}")
