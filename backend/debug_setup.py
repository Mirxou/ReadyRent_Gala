
import os
import django
import sys

# Path setup
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    print("Initializing Django...")
    django.setup()
    print("Django setup successful!")
    
    from django.conf import settings
    print(f"Using database: {settings.DATABASES['default']['ENGINE']}")
    
    from apps.users.models import User
    print(f"User model: {User._meta.db_table}")
    
except Exception as e:
    import traceback
    print("FAILED to initialize Django:")
    traceback.print_exc()
