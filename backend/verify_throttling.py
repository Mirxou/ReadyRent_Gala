import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.settings import api_settings

print("Checking Throttle Classes...")
try:
    throttle_classes = api_settings.DEFAULT_THROTTLE_CLASSES
    print(f"DEFAULT_THROTTLE_CLASSES: {throttle_classes}")
    
    for throttle_class in throttle_classes:
        print(f"Successfully imported: {throttle_class.__name__}")
        if hasattr(throttle_class, 'get_cache_key'):
             print(f" - Has get_cache_key: OK")
        
    print("✅ Throttling Configuration Verified!")
except Exception as e:
    print(f"❌ Verification Failed: {e}")
