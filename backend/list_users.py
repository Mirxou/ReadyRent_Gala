"""
List all existing users and optionally update admin password
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# List all users
print("=" * 60)
print("EXISTING USERS IN DATABASE")
print("=" * 60)

users = User.objects.all()
if not users:
    print("❌ No users found in database")
else:
    for user in users:
        print(f"\n📧 Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Name: {user.first_name} {user.last_name}")
        print(f"   Verified: {user.is_verified}")
        print(f"   Staff: {user.is_staff}")
        print(f"   Superuser: {user.is_superuser}")

print("\n" + "=" * 60)

# Update admin password to known value
try:
    admin = User.objects.get(username='admin')
    new_password = "Admin123!@#"
    admin.set_password(new_password)
    admin.save()
    print(f"\n✅ Updated admin password")
    print(f"\n🔑 LOGIN CREDENTIALS:")
    print(f"   Email: {admin.email}")
    print(f"   Password: {new_password}")
    print(f"\n   (Use these credentials in the login form)")
except User.DoesNotExist:
    print("\n❌ No admin user found")
