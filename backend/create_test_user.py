"""
Create a test user for login testing
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# Create or get test user
email = "admin@readyrent.com"
password = "Admin123!@#"

try:
    user = User.objects.get(email=email)
    print(f"✅ User already exists: {email}")
except User.DoesNotExist:
    user = User.objects.create_user(
        username=email.split('@')[0],  # Use email prefix as username
        email=email,
        password=password,
        first_name="Admin",
        last_name="User",
        phone="+213555000000",
        is_verified=True,
        is_staff=True,
        is_superuser=True
    )
    print(f"✅ Created new user: {email}")

print(f"\n📋 Test Credentials:")
print(f"   Email: {email}")
print(f"   Password: {password}")
print(f"\n🔑 User Details:")
print(f"   ID: {user.id}")
print(f"   Name: {user.get_full_name()}")
print(f"   Verified: {user.is_verified}")
print(f"   Staff: {user.is_staff}")
