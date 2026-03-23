import os
import django
import sys

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model

def create_admin():
    User = get_user_model()
    USERNAME = 'admin'
    EMAIL = 'admin@readyrent.gala'
    PASSWORD = 'Admin123!@#'

    try:
        if not User.objects.filter(username=USERNAME).exists():
            print(f"Creating superuser '{USERNAME}'...")
            User.objects.create_superuser(USERNAME, EMAIL, PASSWORD)
            print(f"✅ Superuser created successfully!")
            print(f"   Email: {EMAIL}")
            print(f"   Password: {PASSWORD}")
        else:
            print(f"⚠️ Superuser '{USERNAME}' already exists.")
    except Exception as e:
        print(f"❌ Failed to create superuser: {e}")

if __name__ == "__main__":
    create_admin()
