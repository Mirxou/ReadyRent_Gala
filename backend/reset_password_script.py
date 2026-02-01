import os
import sys
import django

# Add the project root to the path so config can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    u = User.objects.get(username='admin')
    u.set_password('admin123')
    u.save()
    print("SUCCESS: Password for 'admin' has been set to 'admin123'")
except User.DoesNotExist:
    print("ERROR: User 'admin' not found")
except Exception as e:
    print(f"ERROR: {e}")
